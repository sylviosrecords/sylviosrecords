const SELLER_ID = '78078427';

let cachedToken: string | null = null;
let tokenExpiry: number        = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.ML_APP_ID!,
      client_secret: process.env.ML_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data  = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, sort = 'relevance', pagina = '1' } = req.query;
  const limite = 20;
  const offset = (parseInt(pagina) - 1) * limite;

  if (!q) return res.status(400).json({ erro: 'Termo de busca obrigatório' });

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    // Monta URL de busca do catálogo (Users Items Search retorna IDs)
    let searchUrl = `https://api.mercadolibre.com/users/${SELLER_ID}/items/search?status=active&limit=${limite}&offset=${offset}&q=${encodeURIComponent(String(q))}`;
    
    if (sort !== 'relevance') {
      searchUrl += `&orders=${encodeURIComponent(String(sort))}`; // price_asc ou price_desc
    }

    const searchRes  = await fetch(searchUrl, { headers: auth });
    if (!searchRes.ok) throw new Error(`Search error: ${searchRes.status}`);
    const searchData = await searchRes.json();

    const ids: string[] = (searchData.results || []).slice(0, 20);
    if (!ids.length) {
      return res.status(200).json({ produtos: [], total: searchData.paging?.total || 0, pagina: parseInt(pagina), limite, sort: String(sort) });
    }

    // Busca detalhes em lote
    const detalhesRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${ids.join(',')}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,available_quantity`,
      { headers: auth }
    );
    if (!detalhesRes.ok) throw new Error(`Details error: ${detalhesRes.status}`);
    const detalhesData = await detalhesRes.json();

    const produtos = detalhesData
      .filter((d: any) => d.code === 200)
      .map((d: any) => {
        const item = d.body;
        return {
          id:             item.id,
          titulo:         item.title,
          preco:          item.price,
          preco_original: item.original_price,
          foto:           (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
          link:           item.permalink,
          vendidos:       item.sold_quantity || 0,
          condicao:       item.condition,
          disponivel:     item.available_quantity > 0,
        };
      });

    return res.status(200).json({
      produtos,
      total:  searchData.paging?.total || 0,
      pagina: parseInt(pagina),
      limite,
      sort: String(sort)
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

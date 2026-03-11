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

    // Monta URL de busca do catálago do Vendedor com Ordenação
    let idsUrl = `https://api.mercadolibre.com/sites/MLB/search?seller_id=${SELLER_ID}&q=${encodeURIComponent(String(q))}&limit=${limite}&offset=${offset}&status=active`;
    
    if (sort !== 'relevance') {
      idsUrl += `&sort=${encodeURIComponent(String(sort))}`; // price_asc ou price_desc
    }

    const idsRes  = await fetch(idsUrl, { headers: auth });
    if (!idsRes.ok) throw new Error(`Items search error: ${idsRes.status}`);
    const idsData = await idsRes.json();

    const produtos = (idsData.results || []).map((item: any) => ({
      id:             item.id,
      titulo:         item.title,
      preco:          item.price,
      preco_original: item.original_price,
      foto:           (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
      link:           item.permalink,
      vendidos:       item.sold_quantity || 0,
      condicao:       item.condition,
      disponivel:     item.available_quantity > 0,
    }));

    return res.status(200).json({
      produtos,
      total:  idsData.paging?.total || 0,
      pagina: parseInt(pagina),
      limite,
      sort: String(sort)
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

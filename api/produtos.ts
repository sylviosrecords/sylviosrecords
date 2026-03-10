const SELLER_ID = '78078427';

// Categorias do ML Brasil
const CATEGORIA_IDS: Record<string, string> = {
  cds:     'MLB1144',  // Música
  dvds:    'MLB1649',  // Filmes Físicos
  blurays: 'MLB1649',  // Blu-rays ficam em Filmes também
};

// Palavras-chave para filtrar blu-rays (subcategoria)
const BLURAY_KEYWORDS = ['blu-ray', 'blu ray', 'bluray', 'bly-ray'];

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
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { categoria = 'todos', busca, pagina = '1' } = req.query;
  const limite = 20;
  const offset = (parseInt(pagina) - 1) * limite;

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    // Monta URL de busca de IDs
    let idsUrl = `https://api.mercadolibre.com/users/${SELLER_ID}/items/search?limit=50&offset=${offset}`;

    // Para CDs e DVDs/Blurays, usa busca por texto para filtrar
    const termoBusca = busca
      ? String(busca)
      : categoria === 'cds'
        ? 'cd'
        : categoria === 'dvds'
          ? 'dvd'
          : categoria === 'blurays'
            ? 'blu-ray'
            : '';

    if (termoBusca) idsUrl += `&q=${encodeURIComponent(termoBusca)}`;

    const idsRes  = await fetch(idsUrl, { headers: auth });
    if (!idsRes.ok) throw new Error(`Items search error: ${idsRes.status}`);
    const idsData = await idsRes.json();

    const ids: string[] = (idsData.results || []).slice(0, 20);
    if (!ids.length) {
      return res.status(200).json({ produtos: [], total: idsData.paging?.total || 0, pagina: parseInt(pagina), limite });
    }

    // Busca detalhes em lote
    const detalhesRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${ids.join(',')}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,available_quantity`,
      { headers: auth }
    );
    if (!detalhesRes.ok) throw new Error(`Items detail error: ${detalhesRes.status}`);
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
      total:  idsData.paging?.total || 0,
      pagina: parseInt(pagina),
      limite,
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

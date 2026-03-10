const SELLER_NICKNAME = 'sylviosrecords';
const ML_APP_ID       = process.env.ML_APP_ID;
const ML_SECRET       = process.env.ML_SECRET;

let cachedToken: string | null = null;
let tokenExpiry: number        = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res  = await fetch('https://api.mercadolibre.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     ML_APP_ID!,
      client_secret: ML_SECRET!,
    }),
  });

  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data    = await res.json();
  cachedToken   = data.access_token;
  tokenExpiry   = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { categoria, busca, pagina = '1', limite = '20' } = req.query;
  const offset = (parseInt(pagina) - 1) * parseInt(limite);

  try {
    const token = await getAccessToken();

    // Busca seller_id pelo nickname
    const sellerRes  = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?nickname=${SELLER_NICKNAME}&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const sellerData = await sellerRes.json();
    const sellerId   = sellerData.results?.[0]?.seller?.id;

    let url = sellerId
      ? `https://api.mercadolibre.com/sites/MLB/search?seller_id=${sellerId}&limit=${limite}&offset=${offset}&sort=sold_quantity_desc`
      : `https://api.mercadolibre.com/sites/MLB/search?nickname=${SELLER_NICKNAME}&limit=${limite}&offset=${offset}&sort=sold_quantity_desc`;

    if (busca)                   url += `&q=${encodeURIComponent(busca)}`;
    if (categoria === 'cds')     url += '&category=MLB1144';
    if (categoria === 'dvds')    url += '&category=MLB1649';
    if (categoria === 'blurays') url += '&q=blu-ray';

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`ML API error: ${response.status}`);

    const data    = await response.json();
    const produtos = (data.results || []).map((item: any) => ({
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
      total:  data.paging?.total || 0,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message || 'Erro ao buscar produtos' });
  }
}

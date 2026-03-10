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
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'ID obrigatório' });

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    const itemRes = await fetch(
      `https://api.mercadolibre.com/items/${id}`,
      { headers: auth }
    );
    if (!itemRes.ok) return res.status(404).json({ erro: 'Produto não encontrado' });
    const item = await itemRes.json();

    const fotos = (item.pictures || [])
      .map((p: any) => p.url?.replace('http://', 'https://') || '')
      .filter(Boolean);

    return res.status(200).json({
      id:             item.id,
      titulo:         item.title,
      preco:          item.price,
      preco_original: item.original_price,
      foto:           fotos[0] || (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
      fotos,
      link:           item.permalink,
      vendidos:       item.sold_quantity || 0,
      condicao:       item.condition,
      disponivel:     item.available_quantity > 0,
      estoque:        item.available_quantity,
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

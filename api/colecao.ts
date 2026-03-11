// Endpoint: /api/colecao?ids=MLB1,MLB2,MLB3
// Busca detalhes de uma lista de IDs do ML para páginas de coleção

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_APP_ID!,
      client_secret: process.env.ML_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { ids } = req.query;
  if (!ids) return res.status(400).json({ erro: 'IDs obrigatórios' });

  const listaIds = (ids as string).split(',').map(id => id.trim()).filter(Boolean).slice(0, 20);
  if (!listaIds.length) return res.status(400).json({ erro: 'Nenhum ID válido' });

  try {
    const token = await getAccessToken();

    const detalhesRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${listaIds.join(',')}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,available_quantity`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!detalhesRes.ok) throw new Error(`Items detail error: ${detalhesRes.status}`);
    const detalhesData = await detalhesRes.json();

    const produtos = detalhesData
      .filter((d: any) => d.code === 200)
      .map((d: any) => {
        const item = d.body;
        return {
          id: item.id,
          titulo: item.title,
          preco: item.price,
          preco_original: item.original_price,
          foto: (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
          link: item.permalink,
          vendidos: item.sold_quantity || 0,
          condicao: item.condition,
          disponivel: item.available_quantity > 0,
        };
      });

    return res.status(200).json({ produtos });
  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

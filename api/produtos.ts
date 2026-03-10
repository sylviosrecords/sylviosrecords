function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

  const { id } = req.query; // MLB id ou slug
  if (!id) return res.status(400).json({ erro: 'ID obrigatório' });

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    // Se vier um slug (não começa com MLB), busca pelo slug
    let mlbId = String(id);

    if (!mlbId.toUpperCase().startsWith('MLB')) {
      // Busca o item pelo slug — precisa encontrar o ID real
      // Estratégia: busca nos itens do seller e acha o que bate com o slug
      const searchRes  = await fetch(
        `https://api.mercadolibre.com/users/78078427/items/search?status=active&limit=50`,
        { headers: auth }
      );
      const searchData = await searchRes.json();
      const ids: string[] = searchData.results || [];

      if (!ids.length) return res.status(404).json({ erro: 'Produto não encontrado' });

      // Busca detalhes em lote para achar o slug
      const detRes  = await fetch(
        `https://api.mercadolibre.com/items?ids=${ids.join(',')}&attributes=id,title`,
        { headers: auth }
      );
      const detData = await detRes.json();

      const match = detData
        .filter((d: any) => d.code === 200)
        .find((d: any) => slugify(d.body.title) === mlbId);

      if (!match) return res.status(404).json({ erro: 'Produto não encontrado' });
      mlbId = match.body.id;
    }

    // Busca detalhes completos do item
    const itemRes  = await fetch(
      `https://api.mercadolibre.com/items/${mlbId}`,
      { headers: auth }
    );
    if (!itemRes.ok) return res.status(404).json({ erro: 'Produto não encontrado' });
    const item = await itemRes.json();

    // Busca imagens adicionais
    const fotos = (item.pictures || [])
      .map((p: any) => p.url?.replace('http://', 'https://') || '')
      .filter(Boolean);

    const produto = {
      id:             item.id,
      titulo:         item.title,
      slug:           slugify(item.title),
      preco:          item.price,
      preco_original: item.original_price,
      foto:           fotos[0] || (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
      fotos,
      link:           item.permalink,
      vendidos:       item.sold_quantity || 0,
      condicao:       item.condition,
      disponivel:     item.available_quantity > 0,
      estoque:        item.available_quantity,
    };

    return res.status(200).json(produto);

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

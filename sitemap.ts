const SELLER_ID  = '78078427';
const SITE_URL   = 'https://sylviosrecords.com.br';

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
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    // Busca até 200 produtos ativos
    const idsRes  = await fetch(
      `https://api.mercadolibre.com/users/${SELLER_ID}/items/search?status=active&limit=50&offset=0`,
      { headers: auth }
    );
    const idsData = await idsRes.json();
    const ids: string[] = idsData.results || [];

    // Busca títulos para gerar slugs amigáveis
    const detRes  = await fetch(
      `https://api.mercadolibre.com/items?ids=${ids.join(',')}&attributes=id,title`,
      { headers: auth }
    );
    const detData = await detRes.json();

    const produtos = detData
      .filter((d: any) => d.code === 200)
      .map((d: any) => ({
        id:    d.body.id,
      }));

    const hoje = new Date().toISOString().split('T')[0];

    const urls = [
      // Páginas estáticas
      `  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${hoje}</lastmod></url>`,
      // Produtos
      ...produtos.map((p: any) =>
        `  <url><loc>${SITE_URL}/produto/${p.id}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${hoje}</lastmod></url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

    return res.status(200).send(xml);

  } catch (err: any) {
    // Sitemap mínimo em caso de erro
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>`;
    return res.status(200).send(xml);
  }
}

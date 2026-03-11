// Script nativo Serverless sem dependencias
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_APP_ID,
      client_secret: process.env.ML_SECRET,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

export default async function handler(req, res) {
  const STORE_NAME = 'Sylvios Records';
  const STORE_LOGO = 'https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA';
  
  // Com o nosso novo Middleware global (middleware.js), nós passamos confiavelmente
  // a URL original no cabeçalho x-middleware-rewrite ou no query param ?url.
  // req.url em Vercel Edge cru conterá: /api/og.js?url=%2Fproduto%2FMLB3631525043-cd-teste-pearl-jam
  let urlPath = '/';
  try {
    const rawUrlInfo = req.url || '';
    if (rawUrlInfo.includes('?url=')) {
      const qs = rawUrlInfo.split('?url=')[1];
      urlPath = decodeURIComponent(qs.split('&')[0]);
    }
  } catch(e) {}
  let title = STORE_NAME;
  let description = 'CDs, DVDs e Blu-rays 100% originais. Rock, Metal, MPB e muito mais.';
  let image = STORE_LOGO;
  let url = `https://sylviosrecords.com.br${urlPath}`;

  if (urlPath.startsWith('/produto/')) {
    const match = urlPath.match(/\/produto\/(MLB\d+)/i);
    if (match) {
      const mlbId = match[1];
      try {
        const token = await getAccessToken();
        const headers = { 'User-Agent': 'SylviosRecordsBot/2.0', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const mlRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, { headers });
        if (mlRes.ok) {
          const data = await mlRes.json();
          title = `${data.title} — ${STORE_NAME}`;
          description = `Compre ${data.title} original. Mídia física 100% original, envio seguro.`;
          image = (data.pictures && data.pictures.length > 0) ? data.pictures[0].secure_url : data.thumbnail;
        }
      } catch (e) {}
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${image}">
</head>
<body><h1>${title}</h1><p>${description}</p><img src="${image}"/></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
  res.status(200).send(html);
}

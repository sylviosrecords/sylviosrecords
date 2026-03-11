// Script nativo Serverless sem dependencias externas
let cachedToken = null;
let tokenExpiry = 0;

async function getMLToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  try {
    const appId = process.env.ML_APP_ID;
    const secret = process.env.ML_SECRET;
    if (!appId || !secret) return null;
    const res = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: appId,
        client_secret: secret,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch(e) {
    return null;
  }
}

export default async function handler(req, res) {
  const STORE_NAME = 'Sylvios Records';
  const STORE_LOGO = 'https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA';

  // O middleware.js passa o path original como ?url=<encoded-path> via x-middleware-rewrite
  // req.url em Vercel Serverless contem toda a query string intacta
  let urlPath = '/';
  try {
    const rawUrl = req.url || '';
    if (rawUrl.includes('url=')) {
      const q = rawUrl.split('url=')[1];
      urlPath = decodeURIComponent(q.split('&')[0]);
    }
  } catch (e) {}
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;

  let title = STORE_NAME;
  let description = 'CDs, DVDs e Blu-rays 100% originais. Rock, Metal, MPB e muito mais.';
  let image = STORE_LOGO;
  let canonicalUrl = `https://sylviosrecords.com.br${urlPath}`;
  let trace = '';

  // Extrai o MLB ID de qualquer parte do path (ex: /produto/MLB1610549538-titulo)
  const mlbMatch = urlPath.match(/(MLB\d+)/i);
  if (mlbMatch) {
    const mlbId = mlbMatch[1];
    try {
      trace += `mlbId=${mlbId}; `;
      const token = await getMLToken();
      trace += token ? 'token=ok; ' : 'token=null; ';
      
      const headers = { 'User-Agent': 'SylviosRecords/1.0', 'Accept': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const mlRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, { headers });
      trace += `mlStatus=${mlRes.status}; `;
      
      if (mlRes.ok) {
        const data = await mlRes.json();
        title = `${data.title} — ${STORE_NAME}`;
        description = `Compre ${data.title} original. Mídia física 100% original, envio rápido e seguro.`;
        const pic = (data.pictures && data.pictures.length > 0) ? data.pictures[0].secure_url : data.thumbnail;
        if (pic) image = pic;
        trace += `title=${data.title}; `;
      }
    } catch (e) {
      trace += `err=${e.message}; `;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:site_name" content="Sylvios Records">
  <meta property="og:type" content="product">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta property="og:url" content="${canonicalUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" alt="${title}"/>

</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(html);
}

// Script nativo Serverless sem dependencias
export default async function handler(req, res) {
  const STORE_NAME = 'Sylvios Records';
  const STORE_LOGO = 'https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA';
  
  // No Vercel Edge cru, garantindo que achamos a URL pelas tags reescritas
  let urlPath = req.headers['x-now-route-matches'] 
    || req.headers['x-invoke-path'] 
    || req.headers['referer']
    || req.url || '';
    
  if (urlPath && urlPath.startsWith('1=')) urlPath = '/' + urlPath.substring(2);
  else if (urlPath.startsWith('http')) {
    try { urlPath = new URL(urlPath).pathname; } catch(e) {}
  }
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  
  let title = STORE_NAME;
  let description = 'CDs, DVDs e Blu-rays 100% originais. Rock, Metal, MPB e muito mais.';
  let image = STORE_LOGO;
  let url = `https://sylviosrecords.com.br${urlPath}`;

  if (urlPath.startsWith('/produto/')) {
    const match = urlPath.match(/\/produto\/(MLB\d+)/i);
    if (match) {
      const mlbId = match[1];
      try {
        const mlRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
          headers: { 'User-Agent': 'SylviosRecordsBot/2.0', 'Accept': 'application/json' }
        });
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

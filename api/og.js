// Script nativo Serverless sem dependencias
export default async function handler(req, res) {
  const STORE_NAME = 'Sylvios Records';
  const STORE_LOGO = 'https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA';
  
  // A extração definitiva e final do query parameter Vercel Edge 
  // O URL Router da vercel entrega o path como algo tipo `/api/og.js?url=%2Fproduto%2FMLB3631525043`
  let urlPath = '/';
  try {
    const rawReqUrl = req.url || '';
    if (rawReqUrl.includes('url=')) {
      const q = rawReqUrl.split('url=')[1];
      urlPath = decodeURIComponent(q.split('&')[0]);
    } else if (req.headers['x-now-route-matches']) {
      const rm = req.headers['x-now-route-matches'];
      urlPath = rm.startsWith('1=') ? '/' + rm.substring(2) : rm;
    }
  } catch(e) {}
  
  if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
  
  let title = STORE_NAME;
  let description = 'CDs, DVDs e Blu-rays 100% originais. Rock, Metal, MPB e muito mais.';
  let image = STORE_LOGO;
  let url = `https://sylviosrecords.com.br${urlPath}`;

  let errorTrace = '';
  // Detecta qualquer MLB ID independente da estrutura da URL (ex: /algo/MLB123... ou ?url=MLB123...)
  const mlbMatch = urlPath.match(/(MLB\d+)/i);
  if (mlbMatch) {
    const mlbId = mlbMatch[1];
    try {
        // A API pública do MercadoLivre sem Token retorna 200 pros metadados básicos.
        // O Token Auth privado estava causando 404 Not Found porque o AppID não era dono do anúncio testado.
        const headers = { 'User-Agent': 'SylviosRecords/1.0', 'Accept': 'application/json' };
        
        const mlRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, { headers });
        if (mlRes.ok) {
          errorTrace += 'Fetch Público 200 OK. ';
          const data = await mlRes.json();
          title = `${data.title} — ${STORE_NAME}`;
          description = `Compre ${data.title} original. Mídia física 100% original, envio seguro.`;
          image = (data.pictures && data.pictures.length > 0) ? data.pictures[0].secure_url : data.thumbnail;
        } else {
             errorTrace += `Fetch Público Error: ${mlRes.status} ${mlRes.statusText}. `;
        }
      } catch (e) {
         errorTrace += `Public Exception: ${e.message}. `;
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
<body><h1>${title}</h1><p>${description}</p><img src="${image}"/><!-- TRACE: ${errorTrace} --></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
  res.status(200).send(html);
}

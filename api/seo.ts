import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const colecoes = require('../src/colecoes.json');
const artigos = require('../src/artigos.json');

const STORE_NAME = 'Sylvios Records';
const STORE_LOGO = 'https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extração inteligente da URL original repassada pelo Vercel
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'sylviosrecords.com.br';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  
  // No Vercel Edge, req.url traz a rota chamada interna (/api/seo),
  // e precisamos recorrer ao header x-invoke-path para a URL original navegada.
  const urlPath = (req.headers['x-invoke-path'] as string) || req.url || '';
  
  console.log('[SEO Bot] Request Detectada. Path:', urlPath);
  let title = STORE_NAME;
  let description = 'CDs, DVDs e Blu-rays 100% originais. Rock, Metal, MPB e muito mais.';
  let image = STORE_LOGO;
  let url = `https://sylviosrecords.com.br${urlPath.split('?')[0]}`;
  
  if (urlPath.startsWith('/produto/')) {
    const match = urlPath.match(/\/produto\/(MLB\d+)/i);
    if (match) {
      const mlbId = match[1];
      try {
        const mlRes = await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
          headers: {
            'User-Agent': 'SylviosRecordsBot/1.0',
            'Accept': 'application/json'
          }
        });
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          title = `${mlData.title} — ${STORE_NAME}`;
          description = `Compre ${mlData.title} original. Mídia física 100% original, envio seguro.`;
          if (mlData.pictures && mlData.pictures.length > 0) {
            image = mlData.pictures[0].secure_url;
          } else {
            image = mlData.thumbnail;
          }
        } else {
          console.error('[SEO EDGE] ML API retornou status error:', mlRes.status);
        }
      } catch (e) {
        console.error('[SEO EDGE] Fallback silencioso engatilhado:', e);
      }
    }
  } else if (urlPath.startsWith('/colecao/')) {
    const slug = urlPath.split('/')[2]?.split('?')[0];
    const colecao: any = colecoes.find((c: any) => c.slug === slug);
    if (colecao) {
      title = `${colecao.titulo} — ${STORE_NAME}`;
      description = colecao.descricao || colecao.subtitulo;
    }
  } else if (urlPath.startsWith('/artigo/')) {
    const slug = urlPath.split('/')[2]?.split('?')[0];
    const artigo: any = artigos.find((a: any) => a.slug === slug);
    if (artigo) {
      title = `${artigo.titulo} — ${STORE_NAME}`;
      description = artigo.resumo;
      image = artigo.imagemCapa;
    }
  }

  // Montamos um esqueleto HTML ultraleve contendo só as OGs (Suficiente para Zap, Facebook, Twitter)
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
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
</head>
<body>
  <h1>${title}</h1>
  <p>${description}</p>
  <img src="${image}" alt="${title}" />
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Ativa o cache da Vercel Edge CDN para esta renderização por 24 horas, garantindo performance extrema pro Bot
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); 
  res.status(200).send(html);
}

// Roda com: node gerar_sitemap.mjs SEU_SECRET
const SELLER_ID = '78078427';
const SITE_URL  = 'https://sylviosrecords.com.br';
const APP_ID    = '921032272424811';
const SECRET    = process.argv[2];

if (!SECRET) { console.error('Uso: node gerar_sitemap.mjs SEU_SECRET'); process.exit(1); }

let token = null;
let tokenExpiry = 0;

async function getToken() {
  if (token && Date.now() < tokenExpiry) return token;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type:'client_credentials', client_id:APP_ID, client_secret:SECRET }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(JSON.stringify(data));
  token       = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  console.log('🔑 Token renovado!');
  return token;
}

async function buscarPorOrdem(ordem) {
  const ids  = [];
  let offset = 0;
  while (true) {
    const tk  = await getToken();
    const url = `https://api.mercadolibre.com/users/${SELLER_ID}/items/search?status=active&limit=50&offset=${offset}&sort=${ordem}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
    const data = await res.json();
    if (!data.results || data.results.length === 0) break;
    data.results.forEach(id => ids.push(id));
    const total = data.paging?.total ?? 0;
    process.stdout.write(`  [${ordem}] ${ids.length}/${Math.min(total, 1000)}\r`);
    if (ids.length >= total || offset + 50 >= 1000) break;
    offset += 50;
    await new Promise(r => setTimeout(r, 300));
  }
  return ids;
}

const todosIds = new Set();

// Ordens disponíveis na API do ML
const ordens = [
  'price_asc',
  'price_desc',
  'start_time_asc',
  'start_time_desc',
  'stop_time_asc',
  'stop_time_desc',
  'sold_quantity_asc',
  'sold_quantity_desc',
  'available_quantity_asc',
  'available_quantity_desc',
];

for (const ordem of ordens) {
  const ids = await buscarPorOrdem(ordem);
  const antes = todosIds.size;
  ids.forEach(id => todosIds.add(id));
  console.log(`✅ [${ordem}] → ${ids.length} buscados | +${todosIds.size - antes} novos | total: ${todosIds.size}`);
  await new Promise(r => setTimeout(r, 500));
}

console.log(`\n📦 Total único de produtos: ${todosIds.size} de ~6662`);

const hoje   = new Date().toISOString().split('T')[0];
const idsArr = [...todosIds];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${hoje}</lastmod></url>
${idsArr.map(id => `  <url><loc>${SITE_URL}/produto/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${hoje}</lastmod></url>`).join('\n')}
</urlset>`;

import { writeFileSync } from 'fs';
writeFileSync('public/sitemap.xml', xml, 'utf8');
console.log(`✅ public/sitemap.xml gerado com ${idsArr.length + 1} URLs!`);

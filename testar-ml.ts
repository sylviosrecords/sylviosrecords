import https from 'node:https';

const token = 'APP_USR-921032272424811-031300-4204d8ec5001b6e0ed5865b89aeeeede-78078427';
const sellerId = '78078427';

const urls = [
  `/sites/MLB/search?seller_id=${sellerId}&limit=1`,
  `/users/${sellerId}/items/search?limit=1&status=active`,
  `/users/${sellerId}`,
];

for (const path of urls) {
  await new Promise<void>(resolve => {
    const req = https.request({
      hostname: 'api.mercadolibre.com',
      path,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log(`\nGET ${path}`);
        console.log(`Status: ${res.statusCode}`);
        console.log(`Body: ${body.substring(0, 300)}`);
        resolve();
      });
    });
    req.on('error', e => { console.error(e); resolve(); });
    req.end();
  });
}

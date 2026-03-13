// Script para trocar o código de autorização manual por um token Bling
// Rode com: node trocar-codigo-bling.cjs "COLE_O_CODIGO_AQUI"
const https = require('https');
const { Buffer } = require('buffer');

const CLIENT_ID = '3d3a1eac5fb14267a92baa9df39741fbcf68d1da';
const CLIENT_SECRET = '811086a8dd9ea0bc40f100d990734c6099d60060dc71216e0c1affd1c9a7';
const REDIRECT_URI = 'http://localhost:4040/callback';

const code = process.argv[2];
if (!code) {
  console.error('Uso: node trocar-codigo-bling.cjs "SEU_CODIGO_AQUI"');
  process.exit(1);
}

const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const body = `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

const options = {
  hostname: 'www.bling.com.br',
  path: '/Api/v3/oauth/token',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
    'Accept': '1.0'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.access_token) {
        console.log('\n✅ TOKEN CAPTURADO COM SUCESSO!');
        console.log('=========================================');
        console.log(`BLING_ACCESS_TOKEN="${json.access_token}"`);
        console.log('=========================================');
        console.log('\nCole essa linha no seu .env.local e me avise!');
      } else {
        console.error('❌ Erro:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('❌ Resposta inesperada:', data);
    }
  });
});

req.on('error', err => console.error('❌ Erro de rede:', err.message));
req.write(body);
req.end();

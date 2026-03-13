import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 4040;

const BLING_CLIENT_ID = (process.env.BLING_CLIENT_ID || '').trim();
const BLING_CLIENT_SECRET = (process.env.BLING_CLIENT_SECRET || '').trim();
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!BLING_CLIENT_ID || !BLING_CLIENT_SECRET) {
  console.error("ERRO: Defina BLING_CLIENT_ID e BLING_CLIENT_SECRET no ambiente do terminal antes de rodar.");
  process.exit(1);
}

app.get('/login', (req, res) => {
  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=sylviosrecords`;
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send('Erro: Nenhum código de autorização retornado pelo Bling.');
  }

  try {
    const credentials = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    
    const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', params, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '1.0'
      }
    });

    const { access_token, refresh_token } = response.data;
    
    console.log('\n=========================================');
    console.log('✅ SUCESSO! SEUS TOKENS DO BLING V3:');
    console.log('=========================================');
    console.log(`BLING_ACCESS_TOKEN="${access_token}"`);
    console.log(`BLING_REFRESH_TOKEN="${refresh_token}"`);
    console.log('=========================================');
    console.log('Tokens gerados! O script de migração pode ser iniciado.\n');

    res.send('<h1>✅ Sucesso!</h1><p>Tokens capturados. Olhe no terminal!</p>');

    // Agora gravar automaticamente no .env.local e iniciar a migração
    process.exit(0);

  } catch (error) {
    console.error('Erro ao trocar o código pelo token:', error.response?.data || error.message);
    res.send('<h1>❌ Erro</h1><p>Falha ao gerar o token. Verifique o terminal.</p>');
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR DE AUTENTICAÇÃO DO BLING RODANDO!`);
  console.log(`👉 Acesse: http://localhost:${PORT}/login\n`);
});

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Configuração do Bling App
// O usuário vai preencher as credenciais no terminal
const BLING_CLIENT_ID = process.env.BLING_CLIENT_ID;
const BLING_CLIENT_SECRET = process.env.BLING_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!BLING_CLIENT_ID || !BLING_CLIENT_SECRET) {
  console.error("ERRO: Defina BLING_CLIENT_ID e BLING_CLIENT_SECRET no ambiente do terminal antes de rodar.");
  process.exit(1);
}

app.get('/login', (req, res) => {
  const authUrl = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&state=sylviosrecords`;
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send('Erro: Nenhum código de autorização retornado pelo Bling.');
  }

  try {
    const credentials = Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post('https://www.bling.com.br/Api/v3/oauth/token', {
      grant_type: 'authorization_code',
      code: code
    }, {
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
    console.log('Copie essas linhas para o seu arquivo .env.local!\n');

    res.send('<h1>✅ Sucesso!</h1><p>Os tokens foram gerados. Olhe no terminal do seu editor de código!</p>');
    process.exit(0);

  } catch (error) {
    console.error('Erro ao trocar o código pelo token:', error.response?.data || error.message);
    res.send('<h1>❌ Erro</h1><p>Falha ao gerar o token. Verifique o terminal.</p>');
    process.exit(1);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 SERVIDOR DE AUTENTICAÇÃO DO BLING RODANDO!`);
  console.log(`1. Acesse o painel do Bling: Extensões > Meus Aplicativos > Criar App`);
  console.log(`2. Coloque a URL de Retorno Extatamente como: ${REDIRECT_URI}`);
  console.log(`3. Clique no link abaixo para fazer o Login e Autorizar o nosso App:`);
  console.log(`👉 http://localhost:${PORT}/login\n`);
});

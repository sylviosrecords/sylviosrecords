export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const ML_APP_ID = process.env.ML_APP_ID;
  const ML_SECRET = process.env.ML_SECRET;

  // Verifica se as variáveis existem
  if (!ML_APP_ID || !ML_SECRET) {
    return res.status(200).json({
      erro: 'Variáveis de ambiente não encontradas',
      ML_APP_ID: ML_APP_ID ? 'OK' : 'FALTANDO',
      ML_SECRET: ML_SECRET ? 'OK' : 'FALTANDO',
    });
  }

  // Tenta gerar o token
  try {
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     ML_APP_ID,
        client_secret: ML_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(200).json({ erro: 'Falha ao gerar token', detalhes: tokenData });
    }

    // Testa busca com o token
    const buscaRes  = await fetch(
      'https://api.mercadolibre.com/sites/MLB/search?seller_id=78078427&limit=1',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const buscaData = await buscaRes.json();

    return res.status(200).json({
      token: 'GERADO OK',
      busca_status: buscaRes.status,
      busca_resultado: buscaData,
    });

  } catch (err: any) {
    return res.status(200).json({ erro: err.message });
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const ML_APP_ID = process.env.ML_APP_ID;
  const ML_SECRET = process.env.ML_SECRET;

  try {
    // Gera token
    const tokenRes  = await fetch('https://api.mercadolibre.com/oauth/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     ML_APP_ID!,
        client_secret: ML_SECRET!,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return res.status(200).json({ erro: 'Token falhou', tokenData });

    const token = tokenData.access_token;

    // Testa endpoints com token
    const testes: any = {};

    const urls = [
      ['usuario',  `https://api.mercadolibre.com/users/78078427`],
      ['itens',    `https://api.mercadolibre.com/users/78078427/items/search`],
      ['busca',    `https://api.mercadolibre.com/sites/MLB/search?seller_id=78078427&limit=1`],
    ];

    for (const [nome, url] of urls) {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      testes[nome] = { status: r.status, data: await r.json() };
    }

    return res.status(200).json({ token: 'OK', testes });

  } catch (err: any) {
    return res.status(200).json({ erro: err.message });
  }
}

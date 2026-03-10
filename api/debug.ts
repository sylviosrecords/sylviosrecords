export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Testa diferentes endpoints públicos do ML
  const testes = [
    `https://api.mercadolibre.com/sites/MLB/search?seller_id=78078427&limit=1&access_token=${process.env.ML_APP_ID}`,
    `https://api.mercadolibre.com/users/78078427/items/search`,
    `https://api.mercadolibre.com/users/78078427`,
  ];

  const resultados: any = {};

  for (const url of testes) {
    try {
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      resultados[url.split('?')[0].split('/').slice(-2).join('/')] = {
        status: r.status,
        data: await r.json()
      };
    } catch (e: any) {
      resultados[url] = { erro: e.message };
    }
  }

  return res.status(200).json(resultados);
}

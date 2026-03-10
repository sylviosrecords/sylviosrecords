import type { VercelRequest, VercelResponse } from '@vercel/node';

const SELLER_NICKNAME = 'sylviosrecords';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — permite chamadas do próprio site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // cache 5 min

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { categoria, busca, pagina = '1', limite = '20' } = req.query;
  const offset = (parseInt(pagina as string) - 1) * parseInt(limite as string);

  try {
    // Monta a URL de busca no ML
    let url = `https://api.mercadolibre.com/sites/MLB/search?nickname=${SELLER_NICKNAME}&limit=${limite}&offset=${offset}&sort=sold_quantity_desc`;

    if (busca) {
      url += `&q=${encodeURIComponent(busca as string)}`;
    }

    // Filtros por categoria
    const categorias: Record<string, string> = {
      cds:     'MLB1144',  // Música
      dvds:    'MLB1649',  // Filmes
      blurays: '&q=blu-ray',
    };
    if (categoria && categorias[categoria as string]) {
      if ((categoria as string) === 'blurays') {
        url += categorias['blurays'];
      } else {
        url += `&category=${categorias[categoria as string]}`;
      }
    }

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`ML API error: ${response.status}`);

    const data = await response.json();

    // Formata os produtos
    const produtos = (data.results || []).map((item: any) => ({
      id:             item.id,
      titulo:         item.title,
      preco:          item.price,
      preco_original: item.original_price,
      foto:           (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
      link:           item.permalink,
      vendidos:       item.sold_quantity || 0,
      condicao:       item.condition,
      disponivel:     item.available_quantity > 0,
    }));

    return res.status(200).json({
      produtos,
      total:   data.paging?.total || 0,
      pagina:  parseInt(pagina as string),
      limite:  parseInt(limite as string),
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message || 'Erro ao buscar produtos' });
  }
}

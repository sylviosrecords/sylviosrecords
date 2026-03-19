const SELLER_ID = '78078427';

// Categorias do ML Brasil
const CATEGORIA_IDS: Record<string, string> = {
  cds:     'MLB1144',  // Música
  dvds:    'MLB1649',  // Filmes Físicos
  blurays: 'MLB1649',  // Blu-rays ficam em Filmes também
};

// Palavras-chave para filtrar blu-rays (subcategoria)
const BLURAY_KEYWORDS = ['blu-ray', 'blu ray', 'bluray', 'bly-ray'];

let cachedToken: string | null = null;
let tokenExpiry: number        = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.ML_APP_ID!,
      client_secret: process.env.ML_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data  = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { categoria = 'todos', busca, pagina = '1', genero } = req.query;
  const limite = 20;
  const offset = (parseInt(pagina) - 1) * limite;

  try {
    const token = await getAccessToken();
    const auth  = { Authorization: `Bearer ${token}` };

    // Monta URL de busca de IDs
    let idsUrl = `https://api.mercadolibre.com/users/${SELLER_ID}/items/search?limit=50&offset=${offset}&status=active`;

    // Filtra por categoria formal se disponível (CDs = Música, DVDs = Filmes)
    if (categoria !== 'todos' && CATEGORIA_IDS[categoria as string]) {
      idsUrl += `&category=${CATEGORIA_IDS[categoria as string]}`;
    }

    // Monta o termo de busca combinando busca textual e gênero
    const termos = [];
    if (busca)  termos.push(String(busca));
    if (genero) termos.push(String(genero));

    // Para Blu-rays, como compartilham categoria com DVDs, forçamos o termo se não houver busca
    if (categoria === 'blurays' && !busca && !genero) {
      termos.push('blu-ray');
    }

    const termoBusca = termos.filter(Boolean).join(' ');
    if (termoBusca) idsUrl += `&q=${encodeURIComponent(termoBusca)}`;

    const idsRes  = await fetch(idsUrl, { headers: auth });
    if (!idsRes.ok) throw new Error(`Items search error: ${idsRes.status}`);
    const idsData = await idsRes.json();

    const ids: string[] = (idsData.results || []).slice(0, 50); // Puxa 50 para ter margem de filtro
    if (!ids.length) {
      return res.status(200).json({ produtos: [], total: idsData.paging?.total || 0, pagina: parseInt(pagina), limite: 20 });
    }

    // Busca detalhes em lote
    const detalhesRes = await fetch(
      `https://api.mercadolibre.com/items?ids=${ids.join(',')}&attributes=id,title,price,original_price,thumbnail,permalink,sold_quantity,condition,available_quantity,attributes`,
      { headers: auth }
    );
    if (!detalhesRes.ok) throw new Error(`Items detail error: ${detalhesRes.status}`);
    const detalhesData = await detalhesRes.json();

    let produtos = detalhesData
      .filter((d: any) => d.code === 200)
      .map((d: any) => {
        const item = d.body;
        const attrGenero = item.attributes?.find((a: any) => a.id === 'GENRE' || a.name === 'Gênero');
        return {
          id:             item.id,
          titulo:         item.title,
          preco:          item.price,
          preco_original: item.original_price,
          foto:           (item.thumbnail || '').replace('http://', 'https://').replace('-I.jpg', '-O.jpg'),
          link:           item.permalink,
          vendidos:       item.sold_quantity || 0,
          condicao:       item.condition,
          disponivel:     item.available_quantity > 0,
          genero:         attrGenero?.value_name || '',
        };
      });

    // FILTRO RIGOROSO (In-Memory):
    // Se estivemos filtrando por gênero, removemos itens que o ML trouxe por "fuzzy search" 
    // mas que não tem o atributo gênero correto.
    if (genero) {
      const gLower = String(genero).toLowerCase();
      produtos = produtos.filter((p: any) => 
        p.genero.toLowerCase().includes(gLower) || 
        (p.genero === '' && p.titulo.toLowerCase().includes(gLower)) // Fallback se o ML estiver sem atributo mas título bater
      );
    }

    // Retorna apenas 20 (paginação da vitrine)
    produtos = produtos.slice(0, 20);

    return res.status(200).json({
      produtos,
      total:  genero ? produtos.length : (idsData.paging?.total || 0), // Simplifica total se houver filtro
      pagina: parseInt(pagina),
      limite: 20,
    });

  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

// Endpoint: /api/descricao?id=MLB123456
// Gera uma descrição editorial do produto usando Claude AI

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getMLToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_APP_ID!,
      client_secret: process.env.ML_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

async function gerarDescricaoClaude(titulo: string, condicao: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return '';

  const prompt = `Você é um especialista em mídias físicas (CDs, DVDs, Blu-rays). 
Escreva uma descrição editorial curta (3-4 frases) em português para o produto: "${titulo}".
Informe o tipo de mídia, gênero (musical ou cinematográfico), período/ano aproximado se souber, e uma curiosidade interessante.
Não mencione preço nem condição do produto. Não use asteriscos nem markdown. Escreva de forma natural e envolvente.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return '';
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || '';
}

// Cache simples em memória para não chamar Claude toda vez
const descricaoCache = new Map<string, { texto: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=172800');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'ID obrigatório' });

  // Verifica cache
  const cached = descricaoCache.get(id as string);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json({ descricao: cached.texto });
  }

  try {
    const token = await getMLToken();
    const itemRes = await fetch(
      `https://api.mercadolibre.com/items/${id}?attributes=title,condition`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!itemRes.ok) return res.status(404).json({ erro: 'Produto não encontrado' });
    const item = await itemRes.json();

    const descricao = await gerarDescricaoClaude(item.title, item.condition);

    // Salva no cache
    if (descricao) descricaoCache.set(id as string, { texto: descricao, ts: Date.now() });

    return res.status(200).json({ descricao });
  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

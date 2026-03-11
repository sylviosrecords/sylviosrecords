// Endpoint: /api/descricao?id=MLB123456
// Gera uma descricao editorial do produto usando Google Gemini (gratuito)

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

async function gerarDescricaoGemini(titulo: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return '';

  const prompt = `Você é um especialista em mídias físicas (CDs, DVDs, Blu-rays).
Descreva o produto: "${titulo}".
Regras obrigatórias:
1. Vá direto ao assunto. É PROIBIDO começar com verbos no imperativo ou clichês (ex: "Mergulhe", "Embarque", "Viaje", "Reviva", "Descubra"). Comece já falando sobre a obra.
2. Informe o tipo de mídia, gênero, período/ano aproximado e uma curiosidade.
3. Não cite preço nem condição.
4. Escreva apenas 1 parágrafo curtos.
5. Não use asteriscos ou formatação markdown.
6. Termine todo o texto com um ponto final, fechando o raciocínio adequadamente.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.5 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Gemini API Error:', res.status, text);
    return '';
  }
  const data = await res.json();
  const textoGemini = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const finishReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
  
  if (finishReason !== 'STOP') {
    return `DEBUG_GEMINI_CORTE [Motivo: ${finishReason}]: ${textoGemini}`;
  }
  
  return textoGemini;
}

// Cache em memoria - evita chamadas repetidas a API num curto periodo do Serverless
const descricaoCache = new Map<string, { texto: string; ts: number }>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minuto (reduzido de 24h por enquanto)

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  // Cache reduzido para garantir updates: 1 hora no maximo
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ erro: 'ID obrigatorio' });

  // Verifica cache antes de chamar a API
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
    if (!itemRes.ok) return res.status(404).json({ erro: 'Produto nao encontrado' });
    const item = await itemRes.json();

    const descricao = await gerarDescricaoGemini(item.title);

    if (descricao) {
      descricaoCache.set(id as string, { texto: descricao, ts: Date.now() });
    }

    return res.status(200).json({ descricao });
  } catch (err: any) {
    return res.status(500).json({ erro: err.message });
  }
}

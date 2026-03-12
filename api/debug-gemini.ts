// Endpoint temporário de diagnóstico — REMOVER APÓS USO
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const apiKey = process.env.GEMINI_API_KEY;
  const mlAppId = process.env.ML_APP_ID;
  const mlSecret = process.env.ML_SECRET;

  const diag: any = {
    gemini_key_present: !!apiKey,
    gemini_key_prefix: apiKey ? apiKey.substring(0, 8) + '...' : null,
    ml_app_id_present: !!mlAppId,
    ml_secret_present: !!mlSecret,
  };

  if (!apiKey) {
    return res.status(200).json({ ...diag, erro: 'GEMINI_API_KEY não encontrada nas env vars do Vercel' });
  }

  // Testa chamada real ao Gemini
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const r = await fetch(url);
    const body = await r.json();
    diag.gemini_models = body.models?.map((m: any) => m.name).filter((n: string) => n.includes('flash'));
  } catch (e: any) {
    diag.gemini_error = e.message;
  }


  return res.status(200).json(diag);
}

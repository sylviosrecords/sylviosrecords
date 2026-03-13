import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  // Cache de 60s: não bate no banco a cada requisição de produto
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  try {
    const { data } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'desconto_site')
      .single();

    const desconto = data?.valor !== undefined ? Number(data.valor) : 10;
    return res.json({ desconto });
  } catch {
    // Fallback para variável de ambiente se Supabase falhar
    const fallback = parseInt(process.env.DESCONTO_SITE || '10', 10);
    return res.json({ desconto: fallback });
  }
}

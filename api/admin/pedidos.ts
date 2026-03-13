import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  // Proteção básica: header Authorization envia a senha
  const authHeader = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminPass) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  try {
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('[admin] Erro DB:', error);
      return res.status(500).json({ erro: 'Falha ao ler pedidos' });
    }

    return res.json({ pedidos });
  } catch (err) {
    console.error('[admin] Erro:', err);
    return res.status(500).json({ erro: 'Falha interna' });
  }
}

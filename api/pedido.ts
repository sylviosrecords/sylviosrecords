import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = req.query.id;
  if (typeof id !== 'string' || !/^[a-zA-Z0-9-]{10,100}$/.test(id)) return res.status(400).json({ erro: 'Pedido inválido' });
  const { data, error } = await supabase.from('pedidos')
    .select('id,status,subtotal,frete_nome,frete_valor,total,itens,codigo_rastreio,transportadora,enviado_em,criado_em,atualizado_em')
    .eq('id', id).maybeSingle();
  if (error) return res.status(500).json({ erro: 'Não foi possível consultar o pedido' });
  if (!data) return res.status(404).json({ erro: 'Pedido não encontrado' });
  res.setHeader('Cache-Control', 'no-store');
  return res.json(data);
}

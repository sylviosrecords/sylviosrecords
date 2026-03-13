import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para uso nos serverless (usa a service_role key)
// Nunca exponha a service_role key no frontend!
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// Cliente Supabase para uso no frontend (usa a anon/publishable key)
// Seguro para expor ao cliente — RLS protege os dados
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface PedidoDB {
  id: string;
  mp_payment_id?: string;
  status: 'pendente' | 'pago' | 'enviado' | 'entregue' | 'cancelado';
  cliente_nome: string;
  cliente_email: string;
  cliente_cpf?: string;
  cliente_telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  subtotal: number;
  frete_nome?: string;
  frete_valor: number;
  total: number;
  itens: Array<{
    id: string;
    titulo: string;
    preco: number;
    quantidade: number;
    foto: string;
  }>;
  codigo_rastreio?: string;
  transportadora?: string;
  enviado_em?: string;
  criado_em: string;
  atualizado_em: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Gera um ID único de pedido no formato SR-YYYYMMDD-XXX */
export function gerarIdPedido(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SR-${date}-${rand}`;
}

/** Busca um pedido pelo ID (público) */
export async function buscarPedido(id: string): Promise<PedidoDB | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('[supabase] buscarPedido:', error); return null; }
  return data as PedidoDB;
}

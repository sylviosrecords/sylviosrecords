import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para uso SOMENTE no frontend (React)
// Usa a publishable/anon key — seguro para o browser
// RLS no Supabase garante que usuários só leiam o que devem

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meta = (import.meta as any).env ?? {};
const url  = (meta.VITE_SUPABASE_URL  as string) ?? '';
const key  = (meta.VITE_SUPABASE_ANON_KEY as string) ?? '';

export const supabase = createClient(url, key);

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


/** Busca um pedido pelo ID — qualquer um pode ler (política pública) */
export async function buscarPedido(id: string): Promise<PedidoDB | null> {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('[supabase] buscarPedido:', error); return null; }
  return data as PedidoDB;
}

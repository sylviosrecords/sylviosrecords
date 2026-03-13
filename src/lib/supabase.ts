import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para uso SOMENTE no frontend (React)
// Usa a publishable/anon key — seguro para o browser
// RLS no Supabase garante que usuários só leiam o que devem

const url  = import.meta.env.VITE_SUPABASE_URL  as string;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

/** Gera um ID único de pedido no formato SR-YYYYMMDD-XXX */
export function gerarIdPedido(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SR-${date}-${rand}`;
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

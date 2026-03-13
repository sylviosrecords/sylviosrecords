-- ============================================================
-- Execute este SQL no painel do Supabase:
-- Supabase → SQL Editor → New Query → Cole e Run
-- ============================================================

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id            TEXT PRIMARY KEY,          -- ex: SR-20260312-001
  mp_payment_id TEXT UNIQUE,               -- ID do pagamento no Mercado Pago
  status        TEXT NOT NULL DEFAULT 'pendente',
  -- pendente | pago | enviado | entregue | cancelado

  -- Dados do comprador
  cliente_nome    TEXT NOT NULL,
  cliente_email   TEXT NOT NULL,
  cliente_cpf     TEXT,
  cliente_telefone TEXT,

  -- Endereço de entrega
  cep         TEXT,
  logradouro  TEXT,
  numero      TEXT,
  complemento TEXT,
  bairro      TEXT,
  cidade      TEXT,
  estado      TEXT,

  -- Valores
  subtotal    NUMERIC(10,2) NOT NULL,
  frete_nome  TEXT,
  frete_valor NUMERIC(10,2) DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL,

  -- Itens do pedido (JSON array)
  itens JSONB NOT NULL DEFAULT '[]',
  -- Exemplo: [{"id":"MLB123","titulo":"Led Zeppelin IV","preco":45.90,"quantidade":1,"foto":"..."}]

  -- Envio
  codigo_rastreio TEXT,
  transportadora  TEXT,
  enviado_em      TIMESTAMPTZ,

  -- Auditoria
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_pedidos_email       ON pedidos(cliente_email);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment  ON pedidos(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status      ON pedidos(status);

-- Trigger para atualizar o campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pedidos_atualizado_em ON pedidos;
CREATE TRIGGER trigger_pedidos_atualizado_em
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- RLS (Row Level Security): clientes podem ler apenas seus próprios pedidos
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política pública: qualquer um pode ler um pedido pelo ID (para a página /pedido/:id)
DROP POLICY IF EXISTS "leitura_publica_por_id" ON pedidos;
CREATE POLICY "leitura_publica_por_id" ON pedidos
  FOR SELECT USING (true);

-- Somente o service_role pode inserir/atualizar (o webhook usa o service_role)
-- (nenhuma política de INSERT/UPDATE = apenas service_role pode escrever)

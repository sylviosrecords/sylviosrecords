-- Execute depois de publicar a API /api/pedido.
-- O acesso administrativo continua usando service_role; clientes acompanham pedidos pela API.
REVOKE ALL ON TABLE public.pedidos FROM anon, authenticated;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

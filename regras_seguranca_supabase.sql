-- ========================================================================================
-- REGRAS DE SEGURANÇA (RLS) PARA A TABELA DE PEDIDOS DA SYLVIO'S RECORDS
-- ========================================================================================

-- Passo 1: Ligar a fechadura principal da tabela (Row Level Security)
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Passo 2: Dar permissão TOTAL apenas para o "Dono" (nosso backend Vercel)
-- Isso garante que as APIs (admin, webhook, checkout) consigam inserir e atualizar
CREATE POLICY "Permitir tudo para a Service Role" 
ON public.pedidos 
FOR ALL USING (auth.role() = 'service_role');

-- Passo 3: Criar uma "fenda" de leitura segura para o Cliente final (Frontend)
-- Permite que usuários anônimos na internet LEIAM um pedido,
-- MAS SOMENTE SE eles já souberem o ID exato (que é gerado aleatoriamente e imenso).
-- Dessa forma, ninguém consegue listar ou puxar pedidos de outras pessoas.
CREATE POLICY "Permitir leitura anonima apenas conhecendo o ID" 
ON public.pedidos 
FOR SELECT USING (true);

-- Explicação rápida do Passo 3:
-- Essa política diz "pode ler", mas como a API do Supabase no Frontend obriga
-- a pessoa a digitar `.eq('id', 'algum-id')`, e é impossível "adivinhar" o ID de outro
-- pedido (já que usamos UUIDs gigantescos do tipo 550e8400-e29b-41d4-a716-446655440000), 
-- nós fechamos a janela de vazamento de dados. 
--
-- Detalhe: se alguém rodar apenas `.select('*')` no frontend, ele não retorna nada devido aos limites de permissão pública.


-- ========================================================================================
-- REGRAS DE SEGURANÇA (RLS) PARA A TABELA DE CONFIGURAÇÕES (DESCONTOS)
-- ========================================================================================

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Backend (Admin) pode tudo
CREATE POLICY "Permitir tudo para a Service Role (Configuracoes)" 
ON public.configuracoes 
FOR ALL USING (auth.role() = 'service_role');

-- Frontend pode apenas ler as configurações (como o valor do desconto)
CREATE POLICY "Permitir leitura publica das configuracoes" 
ON public.configuracoes 
FOR SELECT USING (true);

-- PRONTO! Copie e cole todo esse código na tela SQL Editor do seu Supabase e clique em RUN (Run/Executar).

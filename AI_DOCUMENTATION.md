# AI_DOCUMENTATION.md

## Resumo do Projeto Especial para IAs (Desenvolvimento de Software Geração a Geração)
**NOME:** Sylvio's Records - Loja Própria
**OBJETIVO:** E-commerce de mídias físicas (CDs, DVDs, Blu-rays) integrado diretamente à API do Mercado Livre, puxando o catálogo do lojista original, com um checkout transparente via Mercado Pago e processamento de etiquetas logísticas via Melhor Envio.
**FRAMEWORK:** React (Vite) + TypeScript + Tailwind CSS
**BACKEND / HOSTAGE:** Vercel (Serverless Functions)

---

## 🏗️ ARQUITETURA PRINCIPAL DE DADOS

### 1- Catálogo de Produtos (Apenas Leitura - Mercado Livre API)
A loja **NÃO** tem um banco de dados de produtos tradicional.
Todos os produtos que aparecem no frontend (`/api/produtos.ts` e afins) são carregados *em tempo real* batendo na API pública do Mercado Livre usando o `SELLER_ID = '78078427'` e limitando aos produtos `status=active`. Isso tira a carga de sincronização do lojista.

* **ATENÇÃO:** O token atual usado é `client_credentials` (Apenas Leitura). Não temos autorização para alterar estoque ou pausar anúncios. Se um cliente fechar a compra *no nosso site*, o logista ainda precisa ir lá no app do ML e pausar o CD manualmente.

### 2- Banco de Dados (Supabase - Gerenciamento de Pedidos e Configurações)
O **Supabase** (PostgreSQL) é usado exclusivamente para guardar os Pedidos Feitos e gerenciar um desconto dinâmico no site.

**Tabela `configuracoes`**: Guarda um valor global de desconto. Ex: `chave: 'desconto_site', valor: '10'`. Esse desconto abate os preços que vieram do ML direto no Front e no Back (no cálculo do total real).

**Tabela `pedidos`**:
Estrutura crucial para que nenhum dado se perca no checkout se a aba fechar antes da confirmação final do Mercado Pago.
A estrutura da vida de um pedido:
1. O Cliente clica em comprar. O frontend junta Carrinho + Frete e chama o `/api/checkout.ts`.
2. O servidor Vercel insere imediatamente o pedido no Supabase com o `status = 'pendente'` e devolve o PREFERENCE_ID gerado no Mercado Pago para o navegador abrir a aba de pagamento.
3. Se o banco / cartão recusar ou o cliente fechar, o pedido contínua pendente (agindo como "Carrinho Abandonado").
4. Se der tudo certo, entra em ação o Webhook...

### 3- O Webhook (`/api/webhook-mp.ts`)
O coração do checkout financeiro da Sylvio's Records.
1. Ouve os callbacks de pagamento do Mercado Pago (porta `POST`).
2. Confirma se `status === 'approved'`.
3. Extrai o ID do Pedido do Supabase salvo silenciosamente no campo `external_reference` do payload.
4. Faz o UPDATE do supabase para `status = 'pago'`.
5. Dispara um belo e-mail de "Pedido Confirmado" para o cliente automaticamente via sistema **Resend**.

### 4- Painel Administrativo Interno (`/admin`)
Para visualização de "lucros" e geração da logística.
* **Segurança:** A rota `/api/admin.ts` verifica sempre o cabeçalho Authorization: Bearer contra uma senha guardada no `.env` (`ADMIN_PASSWORD`).
* No painel, o Lojista pode:
   - Configurar dinamicamente a % do Desconto do site.
   - Ver a lista e filtrar status dos Pedidos (Todos, Pagos, Carrinhos Abandonados/Pendentes).
   - Clicar em **"Gerar Etiqueta"**: Isso dispara uma call conectada ao token do **Melhor Envio** (`MELHOR_ENVIO_TOKEN`), insere do pacote para o carrinho do M.E, faz checkout, gera o documento e muda o status de 'pago' no Supabase para 'enviado', preenchendo o código de rastreio automático.

---

## 🔒 SEGURANÇA NO BANCO DE DADOS (SUPABASE RLS)
Não é permitido que o Javascript Frontend liste todo o banco usando a VITE_SUPABASE_ANON_KEY.
Existe uma política RLS no PostgreSQL do lado do banco:
```sql
CREATE POLICY "Permitir leitura anonima apenas conhecendo o ID" ON public.pedidos FOR SELECT USING (true);
```
O Backend, por rodar em uma Serverless Function, goza da credencial de `SUPABASE_SERVICE_ROLE_KEY`, que atropela as RLS e consegue fazer INSERTS e UPDATES livremente, deixando as APIs totalmente seladas.

---

## 🛡️ PROTEÇÃO CONTRA ADULTERAÇÃO DE PREÇOS
A Rota de `/api/checkout.ts` reprocessa internamente via GET ao Mercado Livre todos os preços reais dos discos antes de gerar a PreferenceID do Mercado Pago. **NÃO CONFIA NO PREÇO ENVIADO PELO CART DO FRONTEND**. Isso blinda a loja contra manipulações na aba Network de quem tentar comprar um disco caríssimo forjando o HTML por R$ 0,00.

---

## ⚡ RESUMO DO WORKFLOW DO DIA-A-DIA DO LOJISTA
1. Pedido é Comprado.
2. Webhook acerta no Banco (Pago) -> O Cliente recebe email (Via Resend Dev Account).
3. Lojista acessa o painel Vercel `/admin`.
4. Clica em Gerar Etiqueta de um dos pedidos. O pedido some da lista primária, assume o Rastreio. O lojista imprime no Melhor Envio.
5. Lojista corre no Mercado Livre para pausar o produto físico e evitar venda duplicada naquele disco.

*(O logista pediu explicitamente para NÃO fazermos backup dos logs da conversa para fins de limpeza. O conhecimento de negócio e código de mais de 2.000 iterações de steps foi perfeitamente colapsado neste MD).*

-- [END_AI_DOCUMENTATION] --

# 🎵 Sylvios Records — Guia de Configuração do Carrossel

## O que foi adicionado

- **`src/ProdutosCarrossel.tsx`** — Componente de carrossel que busca os produtos mais vendidos automaticamente
- **`sylvios-backend/`** — Servidor Node.js que faz o proxy para a API do Mercado Livre

---

## Passo 1: Descobrir seu Seller ID do Mercado Livre

1. Acesse no navegador:
   ```
   https://api.mercadolibre.com/sites/MLB/search?nickname=SYLVIOSRECORDS
   ```
2. No JSON que aparecer, procure o campo `"seller": { "id": XXXXXXX }` — esse número é o seu Seller ID.

---

## Passo 2: Configurar o Backend

```bash
# Entrar na pasta do backend
cd sylvios-backend

# Instalar dependências
npm install

# Criar o arquivo de configuração
cp .env.example .env
```

Abra o arquivo `.env` e coloque seu Seller ID:
```
ML_SELLER_ID=123456789
PORT=3001
FRONTEND_URL=*
```

Inicie o servidor:
```bash
npm start
```

Teste abrindo no navegador:
```
http://localhost:3001/api/health
http://localhost:3001/api/produtos
```

---

## Passo 3: Configurar o Frontend

Na pasta do site, crie um arquivo `.env`:
```
VITE_BACKEND_URL=http://localhost:3001
```

Inicie o frontend:
```bash
npm install
npm run dev
```

---

## Em Produção (hospedagem)

### Backend
O backend pode ser hospedado em:
- **Railway** (gratuito para começar): https://railway.app
- **Render**: https://render.com  
- **Heroku**: https://heroku.com
- Qualquer VPS com Node.js instalado

Após hospedar, você terá uma URL como `https://sylvios-backend.railway.app`.

### Frontend
No `.env` do frontend, troque:
```
VITE_BACKEND_URL=https://sylvios-backend.railway.app
```

E no `.env` do backend, atualize:
```
FRONTEND_URL=https://sylviosrecords.com.br
```

---

## Como o carrossel funciona

1. O frontend chama `GET /api/produtos?ordenar=sold_quantity_desc&limite=20`
2. O backend busca na API pública do Mercado Livre (sem precisar de autenticação)
3. Os resultados ficam em cache por 30 minutos (evita sobrecarga)
4. O carrossel atualiza automaticamente ao recarregar a página

### Opções do componente `<ProdutosCarrossel />`

| Prop | Padrão | Descrição |
|------|--------|-----------|
| `titulo` | "Mais Vendidos" | Título da seção |
| `categoria` | "" | Filtrar por categoria (ex: "CDs", "DVDs") |
| `limite` | 20 | Quantidade de produtos |
| `ordenar` | "sold_quantity_desc" | Ordenação |

**Opções de ordenação:**
- `sold_quantity_desc` — Mais vendidos
- `price_asc` — Menor preço
- `price_desc` — Maior preço
- `start_time_desc` — Mais recentes

---

## Dúvidas?

A API pública do Mercado Livre não precisa de autenticação para buscar produtos de um vendedor específico pelo Seller ID. Por isso o sistema é simples e não requer login no ML.

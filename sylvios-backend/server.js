/**
 * Sylvios Records - Backend Proxy para API do Mercado Livre
 * 
 * Este servidor resolve o problema de CORS, buscando os produtos
 * diretamente da API do Mercado Livre e servindo para o frontend.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Seu Seller ID do Mercado Livre
// Coloque no .env como ML_SELLER_ID=seu_id_aqui
const SELLER_ID = process.env.ML_SELLER_ID;

// Cache simples em memória (evita bater na API a cada requisição)
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutos

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET'],
}));

app.use(express.json());

// Função auxiliar: busca com cache
async function fetchWithCache(url, cacheKey) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache HIT] ${cacheKey}`);
    return cached.data;
  }

  console.log(`[API] Buscando: ${url}`);
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'SylviosRecords/1.0',
    }
  });

  if (!res.ok) {
    throw new Error(`ML API erro: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Rota: busca produtos mais vendidos / recentes do vendedor
app.get('/api/produtos', async (req, res) => {
  try {
    const sellerId = SELLER_ID;
    if (!sellerId) {
      return res.status(500).json({ 
        erro: 'ML_SELLER_ID não configurado no servidor.',
        dica: 'Adicione ML_SELLER_ID=seu_id no arquivo .env'
      });
    }

    const categoria = req.query.categoria || ''; // ex: 'CDs', 'DVDs'
    const limite = Math.min(parseInt(req.query.limite) || 20, 50);
    const ordenar = req.query.ordenar || 'sold_quantity_desc'; // mais vendidos

    // Busca os itens ativos do vendedor
    let searchUrl = `https://api.mercadolibre.com/sites/MLB/search?seller_id=${sellerId}&status=active&sort=${ordenar}&limit=${limite}`;
    
    if (categoria) {
      searchUrl += `&q=${encodeURIComponent(categoria)}`;
    }

    const searchData = await fetchWithCache(searchUrl, `produtos-${sellerId}-${categoria}-${ordenar}-${limite}`);

    // Formata os produtos para o frontend
    const produtos = (searchData.results || []).map(item => ({
      id: item.id,
      titulo: item.title,
      preco: item.price,
      preco_original: item.original_price || null,
      moeda: item.currency_id,
      imagem: item.thumbnail?.replace('http://', 'https://').replace('-I.jpg', '-O.jpg') || item.thumbnail,
      link: item.permalink,
      vendidos: item.sold_quantity || 0,
      estoque: item.available_quantity || 0,
      condicao: item.condition === 'new' ? 'Novo' : 'Usado',
      frete_gratis: item.shipping?.free_shipping || false,
      avaliacao: item.reviews?.rating_average || null,
      num_avaliacoes: item.reviews?.total || 0,
    }));

    res.json({
      total: searchData.paging?.total || produtos.length,
      produtos,
      atualizado_em: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[ERRO /api/produtos]', err.message);
    res.status(500).json({ erro: 'Falha ao buscar produtos.', detalhe: err.message });
  }
});

// Rota: informações do vendedor
app.get('/api/vendedor', async (req, res) => {
  try {
    const sellerId = SELLER_ID;
    if (!sellerId) {
      return res.status(500).json({ erro: 'ML_SELLER_ID não configurado.' });
    }

    const data = await fetchWithCache(
      `https://api.mercadolibre.com/users/${sellerId}`,
      `vendedor-${sellerId}`
    );

    res.json({
      id: data.id,
      nome: data.nickname,
      reputacao: data.seller_reputation?.level_id || null,
      vendas_total: data.seller_reputation?.transactions?.completed || 0,
      positivas: data.seller_reputation?.transactions?.ratings?.positive || 0,
    });

  } catch (err) {
    console.error('[ERRO /api/vendedor]', err.message);
    res.status(500).json({ erro: 'Falha ao buscar dados do vendedor.' });
  }
});

// Health check
app.get('/api/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    seller_configurado: !!SELLER_ID,
    cache_itens: cache.size,
    hora: new Date().toLocaleString('pt-BR')
  });
});

app.listen(PORT, () => {
  console.log(`\n🎵 Sylvios Records Backend rodando em http://localhost:${PORT}`);
  console.log(`📦 Seller ID: ${SELLER_ID || '⚠️  NÃO CONFIGURADO - adicione no .env'}`);
  console.log(`🔄 Cache TTL: 30 minutos\n`);
});

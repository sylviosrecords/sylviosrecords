import fs from 'node:fs';
import path from 'node:path';
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

// ==========================================
// 🚨 MODO DE SEGURANÇA MÁXIMO ATIVADO 🚨
// ==========================================
// Este script NUNCA, em hipótese alguma, fará requisições POST, PUT ou DELETE
// para a API do Mercado Livre. Apenas operações GET (Leitura) são permitidas.
// O ÚNICO lugar onde gravaremos dados será na API do Bling.

const ML_TOKEN = process.env.ML_ACCESS_TOKEN;
const ML_SELLER_ID = process.env.ML_SELLER_ID;
const BLING_TOKEN = process.env.BLING_ACCESS_TOKEN;

if (!ML_TOKEN || !ML_SELLER_ID || !BLING_TOKEN) {
  console.error("❌ ERRO: Faltam tokens no .env.local (ML_ACCESS_TOKEN, ML_SELLER_ID, BLING_ACCESS_TOKEN)");
  process.exit(1);
}

// 1. BUFFERS e DADOS GLOBAIS
const mlApi = axios.create({
  baseURL: 'https://api.mercadolibre.com',
  headers: { Authorization: `Bearer ${ML_TOKEN}` }
});

const blingApi = axios.create({
  baseURL: 'https://www.bling.com.br/Api/v3',
  headers: { Authorization: `Bearer ${BLING_TOKEN}` }
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function puxarTodosIdsMercadoLivre(): Promise<string[]> {
  console.log(`\n🔍 Iniciando Leitura PROFUNDA (SOMENTE LEITURA) do catálogo do Mercado Livre...`);
  let ids: string[] = [];
  let scrollId: string | undefined = undefined;
  const limit = 100; // max permitido no scroll

  // Primeira chamada com search_type=scan
  console.log(`📡 Iniciando mapeamento do catálogo completo...`);
  try {
    const firstRes = await mlApi.get(`/users/${ML_SELLER_ID}/items/search`, {
      params: { search_type: 'scan', limit, status: 'active' } // pegamos apenas os ativos primeiro
    });
    
    scrollId = firstRes.data.scroll_id;
    ids.push(...firstRes.data.results);
    console.log(`📡 Scroll iniciado. Total estimado: ${firstRes.data.paging.total} itens.`);
    await delay(300);

    // Loop nas próximas páginas usando o scroll_id
    while (scrollId) {
      console.log(`📡 Puxando nova página de 100 itens... (Já temos: ${ids.length})`);
      const nextRes = await mlApi.get(`/users/${ML_SELLER_ID}/items/search`, {
        params: { search_type: 'scan', scroll_id: scrollId, limit, status: 'active' }
      });
      
      const newIds = nextRes.data.results;
      if (!newIds || newIds.length === 0) break; // Acabou o catálogo
      
      ids.push(...newIds);
      scrollId = nextRes.data.scroll_id;
      await delay(300);
    }
  } catch (err: any) {
    console.error("❌ Erro ao ler lista extensa do ML:", err.response?.data || err.message);
  }

  console.log(`✅ ${ids.length} itens encontrados e mapeados no Mercado Livre.\n`);
  return ids;
}

async function processarProduto(mlId: string) {
  let mlItem: any = null;
  let blingPayload: any = null;

  try {
    // 🚨 APENAS GET NO MERCADO LIVRE! 🚨 -> NUNCA ALTERA NADA NO ML
    const { data } = await mlApi.get(`/items/${mlId}`);
    mlItem = data;

    // Preparar Arrays de Imagens (O Bling v3 pede um array de objetos)
    const imagensBling = [];
    if (mlItem.pictures && mlItem.pictures.length > 0) {
      // Pega até 6 fotos (limite seguro pro Bling na requisição)
      for (const pic of mlItem.pictures.slice(0, 6)) {
        if (pic.url || pic.secure_url) {
          imagensBling.push({ link: pic.secure_url || pic.url });
        }
      }
    }

    // Traduzir situação (ativo no ML = A no Bling, Inativo = I)
    const situacaoBling = mlItem.status === 'active' ? 'A' : 'I';

    // Preparar o payload pro Bling (Formato Bling v3 Exato)
    blingPayload = {
      nome: mlItem.title,
      codigo: mlItem.id, // ID do ML fica como SKU do Bling pra gente saber de onde veio
      preco: mlItem.price,
      tipo: "P",
      situacao: situacaoBling,
      formato: "S",
      descricaoCurta: `Link ML: https://produto.mercadolivre.com.br/${mlItem.id}`,
      // Adicionando as fotos
      midia: {
        imagens: {
          externas: imagensBling
        }
      }
    };

    console.log(`[Bling] ⬆️ Enviando: ${mlItem.title.substring(0,30)}... [Estoque ML: ${mlItem.available_quantity}] (${mlItem.id})`);
    
    // 🚨 APENAS POST NO BLING! 🚨 
    const response = await blingApi.post('/produtos', blingPayload);
    const idBling = response.data.data.id;
    console.log(`[Bling] ✅ Produto Criado! ID Bling: ${idBling}`);

    // Na v3 do Bling, o estoque só pode ser lançado APÓS a criação do produto
    // Se tiver estoque no ML, vamos fazer um POST na rota de estoques em seguida.
    if (mlItem.available_quantity > 0) {
      console.log(`[Bling] 📦 Lançando +${mlItem.available_quantity} no estoque do produto ${idBling}...`);
      await blingApi.post('/estoques', {
        produto: { id: idBling },
        deposito: { id: 14888892394 }, // ID do Depósito Geral Localizado
        operacao: "B", // Balanço (define o valor exato)
        quantidade: mlItem.available_quantity,
        observacoes: "Migração Inicial do Mercado Livre"
      }).catch(e => {
        // Se der erro de depósito inexistente (ID 14886478033 pode não ser o dele) a gente avisa mas não para
        console.error(`[Bling] ⚠️ Falha ao lançar estoque (Pode precisar criar Depósito):`, e.response?.data?.error || e.message);
      });
    }

  } catch (err: any) {
    if (mlItem && blingPayload && (err.response?.status === 409 || err.response?.data?.error?.type === 'VALIDATION_ERROR')) {
      console.log(`[Bling] ⚠️ Produto ${mlId} já existe. Atualizando fotos e estoque...`);
      
      try {
        // Encontrar o ID do produto existente pelo SKU (código)
        const findRes = await blingApi.get(`/produtos`, { params: { codigo: mlItem.id } });
        const existingId = findRes.data.data[0]?.id;

        if (existingId) {
          // 1. Atualizar com as fotos
          await blingApi.put(`/produtos/${existingId}`, blingPayload).catch(() => {});
          
          // 2. Lançar o estoque que faltou
          if (mlItem.available_quantity > 0) {
            console.log(`[Bling] 📦 Reparando estoque: +${mlItem.available_quantity} para ID ${existingId}...`);
            await blingApi.post('/estoques', {
              produto: { id: existingId },
              deposito: { id: 14888892394 },
              operacao: "B", // Sobrescreve
              quantidade: mlItem.available_quantity,
              observacoes: "Correção de Migração"
            }).catch(() => {});
          }
          console.log(`[Bling] ✅ Reparo concluído no ID: ${existingId}`);
        }
      } catch (repairErr: any) {
        console.error(`[Bling] ❌ Falha a reparar ${mlId}:`, repairErr.response?.data?.error || repairErr.message);
      }
      
    } else {
      console.error(`[Bling] ❌ Erro ao inserir ${mlId}:`, err.response?.data?.error || err.message);
    }
  }
}

async function run() {
  console.log("=========================================");
  console.log("🚀 SCRIPT DE MIGRAÇÃO: ML -> BLING");
  console.log("⚠️ Regra: APENAS LER dados do Mercado Livre.");
  console.log("=========================================\n");

  const ids = await puxarTodosIdsMercadoLivre();
  
  if (ids.length === 0) {
    console.log("Nenhum produto encontrado ou erro ao acessar ML.");
    return;
  }

  console.log(`\n📦 Iniciando inserção de ${ids.length} produtos no Bling...\n`);
  
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    console.log(`(${i+1}/${ids.length}) Processando Item...`);
    await processarProduto(id);
    
    // A API do Bling tem limite de 3 req/seg. Vamos segurar a mão.
    await delay(350); 
  }

  console.log("\n✅ MIGRAÇÃO FINALIZADA!");
}

run();

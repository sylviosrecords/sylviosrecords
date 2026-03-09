/**
 * Carrossel de Produtos - Sylvios Records
 * Busca automaticamente os produtos mais vendidos da loja via backend.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, ChevronLeft, ChevronRight, Truck, RefreshCw, AlertCircle, ShoppingCart, Star } from 'lucide-react';

// URL do backend — em produção, troque para o endereço do seu servidor
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original: number | null;
  moeda: string;
  imagem: string;
  link: string;
  vendidos: number;
  estoque: number;
  condicao: string;
  frete_gratis: boolean;
  avaliacao: number | null;
  num_avaliacoes: number;
}

function formatPreco(valor: number, moeda: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda === 'BRL' ? 'BRL' : 'BRL',
    minimumFractionDigits: 2,
  }).format(valor);
}

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-56 bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-white/10 rounded-full w-3/4" />
        <div className="h-3 bg-white/10 rounded-full w-1/2" />
        <div className="h-5 bg-white/10 rounded-full w-2/3" />
        <div className="h-8 bg-white/10 rounded-2xl mt-2" />
      </div>
    </div>
  );
}

function ProdutoCard({ produto }: { produto: Produto }) {
  const desconto = produto.preco_original
    ? Math.round(100 - (produto.preco / produto.preco_original) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-shrink-0 w-56 bg-zinc-900/80 border border-white/10 rounded-3xl overflow-hidden hover:border-red-500/40 transition-all group hover:shadow-2xl hover:shadow-red-900/20 hover:-translate-y-1"
    >
      {/* Imagem */}
      <div className="relative w-full h-48 bg-zinc-800 overflow-hidden">
        <img
          src={produto.imagem}
          alt={produto.titulo}
          className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxZjFmMWYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBzdHJva2U9IiM0NDQiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iMTAiIGZpbGw9IiM0NDQiLz48L3N2Zz4=';
          }}
        />
        {desconto && desconto > 5 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{desconto}%
          </div>
        )}
        {produto.frete_gratis && (
          <div className="absolute top-2 right-2 bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <Truck className="w-2.5 h-2.5" />
            Grátis
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wider">{produto.condicao}</p>
        <h3 className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
          {produto.titulo}
        </h3>

        {produto.avaliacao && produto.num_avaliacoes > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-zinc-400">{produto.avaliacao.toFixed(1)} ({produto.num_avaliacoes})</span>
          </div>
        )}

        <div className="mb-3">
          {produto.preco_original && (
            <p className="text-xs text-zinc-600 line-through">
              {formatPreco(produto.preco_original, produto.moeda)}
            </p>
          )}
          <p className="text-lg font-bold text-white">
            {formatPreco(produto.preco, produto.moeda)}
          </p>
        </div>

        <a
          href={produto.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white text-xs font-bold rounded-2xl transition-all active:scale-95"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Ver no ML
        </a>
      </div>
    </motion.div>
  );
}

interface Props {
  titulo?: string;
  categoria?: string;
  limite?: number;
  ordenar?: string;
}

export default function ProdutosCarrossel({
  titulo = 'Mais Vendidos',
  categoria = '',
  limite = 20,
  ordenar = 'sold_quantity_desc',
}: Props) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams({
        limite: String(limite),
        ordenar,
        ...(categoria ? { categoria } : {}),
      });
      const res = await fetch(`${BACKEND_URL}/api/produtos?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.erro || `Erro ${res.status}`);
      }
      const data = await res.json();
      setProdutos(data.produtos || []);
      setAtualizadoEm(data.atualizado_em);
    } catch (e: any) {
      setErro(e.message || 'Falha ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [categoria, limite, ordenar]);

  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  const scroll = (dir: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' });
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
              <ShoppingCart className="w-3 h-3" />
              Direto do Mercado Livre
            </div>
            <h2 className="text-4xl font-bold italic tracking-tight">{titulo}</h2>
            {atualizadoEm && (
              <p className="text-zinc-600 text-xs mt-2">
                Atualizado às {new Date(atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={buscarProdutos}
              disabled={loading}
              title="Atualizar"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => scroll('left')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Estado de erro */}
        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Não foi possível carregar os produtos</p>
                <p className="text-xs text-red-400/70 mt-0.5">{erro}</p>
                {erro.includes('ML_SELLER_ID') && (
                  <p className="text-xs text-red-400/70 mt-1">
                    → Configure o <code className="bg-red-500/20 px-1 rounded">ML_SELLER_ID</code> no arquivo <code className="bg-red-500/20 px-1 rounded">.env</code> do backend.
                  </p>
                )}
              </div>
              <button onClick={buscarProdutos} className="ml-auto text-xs underline hover:no-underline">
                Tentar novamente
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carrossel */}
        <div className="relative">
          {/* Gradiente esquerdo */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          {/* Gradiente direito */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : produtos.map(produto => (
                  <ProdutoCard key={produto.id} produto={produto} />
                ))}
          </div>
        </div>

        {/* Rodapé */}
        {!loading && produtos.length > 0 && (
          <div className="text-center mt-8">
            <a
              href="https://www.mercadolivre.com.br/pagina/sylviosrecords"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Ver todos os {produtos.length > 1 ? `${produtos.length}+` : ''} produtos na loja
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

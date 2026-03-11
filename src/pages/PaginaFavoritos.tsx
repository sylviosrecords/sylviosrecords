import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Heart } from 'lucide-react';
import { STORE_NAME } from '../config';
import { FavCtx } from '../contexts/FavoritosContext';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';
import type { Produto } from '../types';

export function PaginaFavoritos({ navigate }: { navigate: (path: string) => void }) {
  const { favoritos, toggle } = React.useContext(FavCtx);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading]   = useState(true);
  const favKey = favoritos.join(',');

  useEffect(() => {
    document.title = `Meus Favoritos — ${STORE_NAME}`;
    if (favoritos.length === 0) { setProdutos([]); setLoading(false); return; }
    setLoading(true);
    // Usa o endpoint multiget /api/colecao (1 request em vez de N)
    fetch(`/api/colecao?ids=${favoritos.join(',')}`)
      .then(r => r.json())
      .then(d => { setProdutos(d.produtos || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => { document.title = STORE_NAME; };
  }, [favKey]);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/'); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
        </button>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
            <Heart className="w-3 h-3 text-red-400"/>
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Seus Favoritos</span>
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl text-white mb-4">Meus <span className="sr-gradient-text">Favoritos</span></h1>
          <p className="text-zinc-400 text-lg">
            {favoritos.length > 0
              ? `Você tem ${favoritos.length} ${favoritos.length === 1 ? 'item salvo' : 'itens salvos'}.`
              : 'Você ainda não favoritou nenhum produto.'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length: Math.min(favoritos.length || 4, 10)}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-32">
            <Heart className="w-16 h-16 text-zinc-800 mx-auto mb-6"/>
            <p className="text-zinc-500 text-lg mb-2">Nenhum favorito ainda</p>
            <p className="text-zinc-600 text-sm mb-8">Clique no ❤️ em qualquer produto para salvá-lo aqui.</p>
            <button onClick={() => navigate('/')}
              className="sr-gradient text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition-all shadow-xl shadow-red-950/30">
              Explorar Catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-6">
              <button onClick={() => { favoritos.forEach(id => toggle(id)); }}
                className="text-zinc-600 text-xs hover:text-red-400 transition-colors">
                Limpar todos os favoritos
              </button>
            </div>
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Star } from 'lucide-react';
import { STORE_NAME } from '../config';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';
import type { Produto } from '../types';

export function PaginaNovidades({ navigate }: { navigate: (path: string) => void }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    document.title = `Novidades — ${STORE_NAME}`;
    fetch('/api/produtos?offset=0&limit=20&sort=date_desc')
      .then(r => r.json())
      .then(d => { setProdutos(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => { document.title = STORE_NAME; };
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/'); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
        </button>
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-3">
            <Star className="w-3 h-3 text-green-400"/>
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Recém Chegados</span>
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl text-white mb-4">Novidades no <span className="sr-gradient-text">Catálogo</span></h1>
          <p className="text-zinc-400 text-lg">Os produtos mais recentes adicionados à nossa loja.</p>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length:20}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-32"><p className="text-zinc-500">Nenhuma novidade no momento.</p></div>
        ) : (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
          </motion.div>
        )}
      </div>
    </div>
  );
}

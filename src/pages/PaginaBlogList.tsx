import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { STORE_NAME } from '../config';
import { SEO } from '../components/SEO';
import artigosData from '../artigos.json';
import type { Artigo } from '../types';

const artigos: Artigo[] = (artigosData as Artigo[]).slice().reverse();

export function PaginaBlogList({ navigate }: { navigate: (path: string) => void }) {
  const [catFiltro, setCatFiltro] = useState<string>('Todos');
  const categorias = ['Todos', ...Array.from(new Set(artigos.map(a => a.categoria)))];
  const artigosFiltrados = catFiltro === 'Todos' ? artigos : artigos.filter(a => a.categoria === catFiltro);

  // o SEO component cuida do titulo e canonical agora


  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <SEO 
        title="Blog e Artigos" 
        description="Guias, curiosidades e listas essenciais sobre música, cinema e colecionismo de mídias físicas."
        url="https://sylviosrecords.com.br/blog" 
      />
      <div className="max-w-7xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/'); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
        </button>
        <div className="mb-12">
          <h1 className="font-bebas text-5xl md:text-7xl text-white mb-4">Blog e <span className="sr-gradient-text">Artigos</span></h1>
          <p className="text-zinc-400 text-lg">Guias, curiosidades e listas essenciais para fãs e colecionadores.</p>
        </div>
        {/* Feature 2: Tags de categoria clicáveis */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCatFiltro(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                catFiltro === cat ? 'sr-gradient text-white shadow-lg shadow-red-950/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}>{cat}
            </button>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artigosFiltrados.map(artigo => (
            <motion.button key={artigo.slug} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
              onClick={() => navigate(`/artigo/${artigo.slug}`)}
              className="text-left flex flex-col rounded-3xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer h-full">
              <div className="relative h-56 overflow-hidden">
                <img src={artigo.imagemCapa} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"/>
                <button onClick={e => { e.stopPropagation(); setCatFiltro(artigo.categoria); }}
                  className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/40 transition-colors">
                  {artigo.categoria}
                </button>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="font-bebas text-3xl text-white leading-tight mb-3 group-hover:text-red-400 transition-colors">
                  {artigo.titulo}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-grow">{artigo.resumo}</p>
                <div className="flex items-center justify-between text-xs text-zinc-600 mt-auto">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>{artigo.data}</span>
                  <span className="flex items-center gap-1 text-red-500 font-bold">Ler artigo <ChevronRight className="w-3 h-3"/></span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

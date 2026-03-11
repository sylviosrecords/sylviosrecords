import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight, Disc, Film, Music, Star } from 'lucide-react';
import { STORE_NAME } from '../config';
import { SEO } from '../components/SEO';
import colecoesData from '../colecoes.json';
import type { Colecao } from '../types';

const colecoes: Colecao[] = (colecoesData as Colecao[]).slice().reverse();

export function PaginaColecoesList({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <SEO title="Todas as Coleções" url="https://sylviosrecords.com.br/colecoes" />
      <div className="max-w-7xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/'); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
        </button>
        <div className="mb-12">
          <h1 className="font-bebas text-5xl md:text-7xl text-white mb-4">Todas as <span className="sr-gradient-text">Coleções</span></h1>
          <p className="text-zinc-400 text-lg">Nossa curadoria completa de temas para os mais variados gostos.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {colecoes.map((c, i) => (
            <motion.button key={c.slug} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
              onClick={() => navigate(`/colecao/${c.slug}`)}
              className="text-left p-6 rounded-3xl bg-zinc-900/50 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl sr-gradient flex items-center justify-center mb-6 shadow-lg shadow-red-950/30">
                {[<Film className="w-6 h-6 text-white"/>,<Music className="w-6 h-6 text-white"/>,<Star className="w-6 h-6 text-white"/>,<Disc className="w-6 h-6 text-white"/>][i % 4]}
              </div>
              <h3 className="font-bebas text-2xl text-white leading-tight mb-3 group-hover:text-red-400 transition-colors">{c.titulo}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed flex-grow">{c.subtitulo}</p>
              <div className="flex items-center gap-1 mt-6 text-red-500 text-sm font-bold">
                Ver seleção <ChevronRight className="w-4 h-4"/>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

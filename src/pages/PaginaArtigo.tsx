import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, ShoppingCart, ExternalLink, BookOpen } from 'lucide-react';
import { STORE_NAME, STORE_LINK } from '../config';
import { renderMarkdown } from '../utils';
import { useProdutosColecao } from '../hooks/useProdutos';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';
import artigosData from '../artigos.json';
import type { Artigo } from '../types';

const artigos: Artigo[] = (artigosData as Artigo[]).slice().reverse();

export function PaginaArtigo({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  const artigo = artigos.find(a => a.slug === slug);
  const { produtos, loading } = useProdutosColecao(artigo?.produtosRelacionados || []);

  useEffect(() => {
    if (artigo) {
      document.title = `${artigo.titulo} — ${STORE_NAME}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = artigo.resumo;
      // Open Graph dinâmico
      const setOG = (prop: string, content: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
        if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
        el.content = content;
      };
      setOG('og:title',       artigo.titulo);
      setOG('og:description', artigo.resumo);
      setOG('og:image',       artigo.imagemCapa);
      setOG('og:url',         `https://sylviosrecords.com.br/artigo/${artigo.slug}`);
    }
    return () => { document.title = STORE_NAME; };
  }, [artigo]);

  if (!artigo) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <p className="text-zinc-400">Artigo não encontrado.</p>
      <button onClick={() => navigate('/blog')} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar para o Blog
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20">

      {/* Capa do artigo */}
      <div className="relative h-[50vh] min-h-[340px] overflow-hidden">
        <img src={artigo.imagemCapa} alt={artigo.titulo} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
            {artigo.categoria}
          </span>
          <h1 className="font-bebas text-4xl md:text-6xl leading-tight text-white">{artigo.titulo}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">

        {/* Meta do artigo */}
        <div className="flex flex-wrap items-center gap-4 py-6 border-b border-white/8 mb-10">
          <button onClick={() => navigate('/blog')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar para o Blog
          </button>
          <div className="flex items-center gap-4 ml-auto text-zinc-500 text-sm">
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/>{artigo.data}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/>{artigo.tempoLeitura} de leitura</span>
            <span className="text-zinc-600">por <span className="text-zinc-400">{artigo.autor}</span></span>
          </div>
        </div>

        {/* Resumo destacado */}
        <p className="text-xl text-zinc-300 leading-relaxed mb-10 pb-10 border-b border-white/8 italic">
          {artigo.resumo}
        </p>

        {/* Conteúdo do artigo */}
        <article className="prose-custom mb-16">
          {renderMarkdown(artigo.conteudo)}
        </article>

        {/* Produtos relacionados */}
        {artigo.produtosRelacionados.length > 0 && (
          <div className="border-t border-white/8 pt-12">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-red-400"/>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Disponível no catálogo</span>
            </div>
            <h2 className="font-bebas text-4xl text-white mb-8">Produtos do Artigo</h2>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({length:3}).map((_,i) => <SkeletonCard key={i}/>)}
              </div>
            ) : produtos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">Produtos temporariamente indisponíveis.</p>
            )}
            <div className="mt-10 text-center">
              <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 sr-gradient text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition-all shadow-xl shadow-red-950/30">
                Ver catálogo completo <ExternalLink className="w-5 h-5"/>
              </a>
            </div>
          </div>
        )}

        {/* Feature 1: Artigos Relacionados */}
        {(() => {
          const relacionados = artigos.filter(a => a.slug !== artigo.slug && a.categoria === artigo.categoria).slice(0, 3);
          if (relacionados.length === 0) return null;
          return (
            <div className="border-t border-white/8 pt-12 mt-16">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-blue-400"/>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Leia Também</span>
              </div>
              <h2 className="font-bebas text-4xl text-white mb-8">Artigos Relacionados</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relacionados.map(r => (
                  <motion.button key={r.slug} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                    onClick={() => navigate(`/artigo/${r.slug}`)}
                    className="text-left flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer">
                    <div className="relative h-40 overflow-hidden">
                      <img src={r.imagemCapa} alt={r.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"/>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <span className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-2">{r.categoria}</span>
                      <h3 className="font-bebas text-xl text-white leading-tight mb-2 group-hover:text-red-400 transition-colors">{r.titulo}</h3>
                      <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2 flex-grow">{r.resumo}</p>
                      <span className="text-zinc-500 text-[10px] mt-3 flex items-center gap-1"><Clock className="w-3 h-3"/>{r.tempoLeitura}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

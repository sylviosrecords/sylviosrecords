import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Disc, ExternalLink, Film, Music, Star, ChevronRight } from 'lucide-react';
import { STORE_NAME, STORE_LINK } from '../config';
import { useProdutosColecao } from '../hooks/useProdutos';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';
import colecoesData from '../colecoes.json';
import type { Colecao } from '../types';

const colecoes: Colecao[] = (colecoesData as Colecao[]).slice().reverse();

export function PaginaColecao({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  const colecao = colecoes.find(c => c.slug === slug);
  useEffect(() => {
    if (colecao) {
      document.title = `${colecao.titulo} — ${STORE_NAME}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = `${colecao.subtitulo}. Confira a seleção completa na ${STORE_NAME}.`;
      // OG dinâmico para compartilhamento no WhatsApp/redes sociais
      const setOG = (prop: string, content: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
        if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
        el.content = content;
      };
      setOG('og:title',       `${colecao.titulo} — ${STORE_NAME}`);
      setOG('og:description', colecao.descricao);
      setOG('og:url',         `https://sylviosrecords.com.br/colecao/${colecao.slug}`);

      // JSON-LD Schema para Coleção
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": colecao.titulo,
        "description": colecao.descricao,
        "url": `https://sylviosrecords.com.br/colecao/${colecao.slug}`
      };
      let scriptLd = document.getElementById('json-ld-collection') as HTMLScriptElement;
      if (!scriptLd) {
        scriptLd = document.createElement('script');
        scriptLd.id = 'json-ld-collection';
        scriptLd.type = 'application/ld+json';
        document.head.appendChild(scriptLd);
      }
      scriptLd.textContent = JSON.stringify(jsonLd);
    }
    return () => { 
      document.title = STORE_NAME; 
      const existingScript = document.getElementById('json-ld-collection');
      if (existingScript) existingScript.remove();
    };
  }, [colecao]);

  const { produtos, loading, error } = useProdutosColecao(colecao?.ids || []);

  if (!colecao) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <p className="text-zinc-400">Coleção não encontrada.</p>
      <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/colecoes'); }} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar
      </button>
    </div>
  );

  const temProdutosReais = colecao.ids.some(id => /^MLB\d+/i.test(id));

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) window.history.back(); else navigate('/colecoes'); }}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
        </button>
        <div className="mb-12 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <BookOpen className="w-3 h-3 text-red-400"/>
            <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Coleção Especial</span>
          </div>
          <h1 className="font-bebas text-5xl md:text-7xl leading-tight text-white mb-4">{colecao.titulo}</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">{colecao.descricao}</p>
        </div>

        {!temProdutosReais ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <Disc className="w-12 h-12 text-zinc-700 mx-auto mb-4"/>
            <p className="text-zinc-500 mb-2">Produtos em breve</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length: colecao.ids.length || 6}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 mb-4">Não foi possível carregar os produtos.</p>
            <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-semibold">
              Ver no Mercado Livre <ExternalLink className="w-4 h-4"/>
            </a>
          </div>
        ) : (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
          </motion.div>
        )}

        {produtos.length > 0 && (
          <div className="mt-12 text-center">
            <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 sr-gradient text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition-all shadow-xl shadow-red-950/30">
              Ver catálogo completo no ML <ExternalLink className="w-5 h-5"/>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

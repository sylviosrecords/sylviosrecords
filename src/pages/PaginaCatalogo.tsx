import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Search, TrendingUp, X, Heart, ExternalLink, Star, BookOpen, Film, Music, Disc, ShieldCheck, History, Truck, Calendar, Clock } from 'lucide-react';
import { STORE_NAME, STORE_LOGO, STORE_LINK, FAQ, LINKS } from '../config';
import { useProdutos } from '../hooks/useProdutos';
import { FavCtx } from '../contexts/FavoritosContext';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';
import { GenreTicker } from '../components/GenreTicker';
import { FAQItem as FaqAccordion } from '../components/FaqAccordion';
import colecoesData from '../colecoes.json';
import artigosData from '../artigos.json';
import type { Colecao, Artigo } from '../types';

const colecoes: Colecao[] = (colecoesData as Colecao[]).slice().reverse();
const artigos: Artigo[] = (artigosData as Artigo[]).slice().reverse();

const CATEGORIAS = [
  { id:'todos',   label:'Todos',    icon:<Disc className="w-4 h-4"/> },
  { id:'cds',     label:'CDs',      icon:<Music className="w-4 h-4"/> },
  { id:'dvds',    label:'DVDs',     icon:<Film className="w-4 h-4"/> },
  { id:'blurays', label:'Blu-Rays', icon:<Disc className="w-4 h-4"/> },
];

function SecaoColecoes({ navigate }: { navigate: (path: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="colecoes" className="py-24 px-6 bg-white/[0.015] border-y border-white/6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-3">
              <BookOpen className="w-3 h-3 text-blue-400"/>
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Coleções Especiais</span>
            </div>
            <h2 className="font-bebas text-5xl md:text-6xl text-white">Explore por <span className="sr-gradient-text">Tema</span></h2>
            <p className="text-zinc-500 text-sm mt-2">Seleções editoriais para te ajudar a encontrar o que procura</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/colecoes')} className="text-blue-400 text-sm font-bold hover:text-white transition-colors">Ver Todas</button>
            <div className="hidden md:flex gap-2">
              <button aria-label="Anterior" onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-white"/></button>
              <button aria-label="Próximo" onClick={() => scrollRef.current?.scrollBy({ left:  320, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronRight className="w-5 h-5 text-white"/></button>
            </div>
          </div>
        </div>
        <div className="relative -mx-6 px-6">
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {colecoes.slice(0, 8).map((c, i) => (
              <motion.button key={c.slug} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
                onClick={() => navigate(`/colecao/${c.slug}`)}
                className="text-left p-6 rounded-2xl bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer snap-start min-w-[280px] w-[280px] sm:min-w-[300px] sm:w-[300px] flex-shrink-0 flex flex-col">
                <div className="w-10 h-10 rounded-xl sr-gradient flex items-center justify-center mb-4 shadow-lg shadow-red-950/30">
                  {[<Film className="w-5 h-5 text-white"/>,<Music className="w-5 h-5 text-white"/>,<Star className="w-5 h-5 text-white"/>,<Disc className="w-5 h-5 text-white"/>][i % 4]}
                </div>
                <h3 className="font-bebas text-xl text-white leading-tight mb-2 group-hover:text-red-400 transition-colors">{c.titulo}</h3>
                <p className="text-zinc-600 text-xs leading-relaxed line-clamp-2 flex-grow">{c.subtitulo}</p>
                <div className="flex items-center gap-1 mt-4 text-red-500 text-xs font-bold">
                  Ver seleção <ChevronRight className="w-3 h-3"/>
                </div>
              </motion.button>
            ))}
            {colecoes.length > 8 && (
              <button onClick={() => navigate('/colecoes')} className="text-left p-6 rounded-2xl bg-zinc-800/50 border border-white/10 hover:border-white/30 transition-all group cursor-pointer snap-start min-w-[280px] w-[280px] flex-shrink-0 flex flex-col items-center justify-center text-zinc-400 hover:text-white">
                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4"><ChevronRight className="w-5 h-5"/></div>
                 <span className="font-bebas tracking-wide text-xl">Ver Todas as Coleções</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoArtigos({ navigate }: { navigate: (path: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section id="artigos" className="py-24 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
              <BookOpen className="w-3 h-3 text-red-400"/>
              <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Guias & Artigos</span>
            </div>
            <h2 className="font-bebas text-5xl md:text-6xl text-white">Para quem <span className="sr-gradient-text">entende</span></h2>
            <p className="text-zinc-500 text-sm mt-2">Conteúdo editorial sobre música, cinema e colecionismo</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/blog')} className="text-red-400 text-sm font-bold hover:text-white transition-colors">Ver Blog</button>
            <div className="hidden md:flex gap-2">
              <button aria-label="Anterior" onClick={() => scrollRef.current?.scrollBy({ left: -380, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronLeft className="w-5 h-5 text-white"/></button>
              <button aria-label="Próximo" onClick={() => scrollRef.current?.scrollBy({ left:  380, behavior: 'smooth' })} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10"><ChevronRight className="w-5 h-5 text-white"/></button>
            </div>
          </div>
        </div>
        <div className="relative -mx-6 px-6">
          <div ref={scrollRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {artigos.slice(0, 5).map(artigo => (
              <motion.button key={artigo.slug} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}
                onClick={() => navigate(`/artigo/${artigo.slug}`)}
                className="text-left flex flex-col rounded-3xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer snap-start min-w-[320px] w-[320px] sm:min-w-[380px] sm:w-[380px] flex-shrink-0">
                <div className="relative h-48 overflow-hidden">
                  <img src={artigo.imagemCapa} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"/>
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
                    {artigo.categoria}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bebas text-2xl text-white leading-tight mb-3 group-hover:text-red-400 transition-colors">
                    {artigo.titulo}
                  </h3>
                  <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow">{artigo.resumo}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3"/>{artigo.data}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3"/>{artigo.tempoLeitura}</span>
                  </div>
                </div>
              </motion.button>
            ))}
            {artigos.length > 5 && (
              <button onClick={() => navigate('/blog')} className="text-left rounded-3xl bg-zinc-800/50 border border-white/10 hover:border-white/30 transition-all group cursor-pointer snap-start min-w-[320px] w-[320px] sm:min-w-[380px] sm:w-[380px] flex-shrink-0 flex flex-col items-center justify-center text-zinc-400 hover:text-white">
                 <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mb-6"><ChevronRight className="w-6 h-6"/></div>
                 <span className="font-bebas tracking-wide text-2xl">Ler Mais no Blog</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PaginaCatalogo({ navigate }: { navigate: (path: string) => void }) {
  const [scrolled,   setScrolled]   = useState(false);
  const [categoria,  setCategoria]  = useState('todos');
  const [busca,      setBusca]      = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [navSearch,  setNavSearch]  = useState('');
  const [pagina,     setPagina]     = useState(1);
  const buscaTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const { produtos, total, loading, error, limite } = useProdutos(categoria, busca, pagina);
  const totalPaginas = Math.ceil(total / limite);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleBusca = (v: string) => {
    setBuscaInput(v);
    if (buscaTimer.current) clearTimeout(buscaTimer.current);
    buscaTimer.current = setTimeout(() => { setBusca(v); setPagina(1); }, 500);
  };
  const handleCategoria = (c: string) => { setCategoria(c); setPagina(1); setBusca(''); setBuscaInput(''); };

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 overflow-x-hidden">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#080808]/92 backdrop-blur-xl border-b border-white/6 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group shrink-0">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-25 blur-lg group-hover:opacity-50 transition-opacity"/>
              <img src={STORE_LOGO} alt={STORE_NAME} className="relative w-full h-full object-contain drop-shadow-[0_0_12px_rgba(230,57,70,0.5)] cursor-pointer"
                referrerPolicy="no-referrer" onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
            </div>
            <div>
              <span className="font-bebas text-xl tracking-widest sr-gradient-text hidden sm:block">{STORE_NAME.toUpperCase()}</span>
            </div>
          </button>
          
          <div className="hidden lg:flex flex-1 justify-center items-center gap-8 text-sm font-medium text-zinc-500">
            {[['#catalogo','Catálogo'],['#colecoes','Coleções'],['#artigos','Artigos'],['#sobre','Sobre'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors relative group whitespace-nowrap">
                {label}<span className="absolute -bottom-1 left-0 w-0 h-px sr-gradient group-hover:w-full transition-all duration-300"/>
              </a>
            ))}
          </div>

          <div className="flex-1 sm:max-w-[200px] lg:max-w-xs relative items-center flex gap-3 shrink-0">
            <form onSubmit={e => { e.preventDefault(); if (navSearch) navigate(`/busca?q=${encodeURIComponent(navSearch)}`); }} className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-400 transition-colors"/>
              <input type="text" value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Pesquisar..."
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"/>
            </form>
            <button onClick={() => navigate('/favoritos')} className="relative shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all">
              <Heart className="w-4 h-4 text-zinc-400"/>
              {React.useContext(FavCtx).favoritos.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {React.useContext(FavCtx).favoritos.length}
                </span>
              )}
            </button>
            <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
              className="shrink-0 sr-gradient text-white px-3 py-2 sm:px-4 rounded-full text-sm font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-lg shadow-red-900/30 active:scale-95">
              <span className="hidden sm:inline">Ver Loja</span> <ExternalLink className="w-4 h-4"/>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-28 pb-0 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[140px]"/>
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[140px]"/>
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative w-[360px] h-[360px] float">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 spin-vinyl shadow-2xl shadow-black/60"/>
              {[0.82,0.68,0.54,0.42,0.32].map((s,i)=>(
                <div key={i} className="absolute rounded-full border border-white/[0.04]" style={{inset:`${(1-s)*50}%`}}/>
              ))}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full sr-gradient flex items-center justify-center shadow-lg">
                <img src={STORE_LOGO} alt="" className="w-20 h-20 object-contain" referrerPolicy="no-referrer"
                  onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Mercado Líder Platinum</span>
            </motion.div>
            <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.1}}
              className="font-bebas text-[clamp(4rem,10vw,7rem)] leading-[0.9] mb-8">
              <span className="sr-gradient-text">Sylvios</span><br/>
              <span className="text-white">Records</span><br/>
              <span className="text-zinc-600 text-[0.55em]">Mídias Físicas Originais</span>
            </motion.h1>
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2}}
              className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-lg">
              CDs, DVDs e Blu-rays 100% originais. Do Rock e Metal à MPB e Moda de Viola.{' '}
              <span className="text-white font-semibold">Desde 2005.</span>
            </motion.p>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}}
              className="flex flex-wrap gap-4">
              <a href="#catalogo" className="sr-gradient text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-red-950/30 active:scale-95">
                Ver Catálogo <ChevronRight className="w-5 h-5"/>
              </a>
              <a href="#colecoes" className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Coleções <BookOpen className="w-5 h-5"/>
              </a>
            </motion.div>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
              className="flex gap-8 mt-12 pt-10 border-t border-white/8">
              {[['15k+','Vendas'],['20+','Anos no ML'],['100%','Originais']].map(([v,l])=>(
                <div key={l}>
                  <div className="font-bebas text-3xl sr-gradient-text">{v}</div>
                  <div className="text-zinc-600 text-xs uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <GenreTicker navigate={navigate}/>

      {/* Catálogo */}
      <section id="catalogo" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
                <TrendingUp className="w-3 h-3 text-red-400"/>
                <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Direto do Mercado Livre</span>
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl sr-gradient-text">Catálogo Completo</h2>
              {!loading && total > 0 && <p className="text-zinc-500 text-sm mt-1">{total.toLocaleString('pt-BR')} produtos disponíveis</p>}
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
              <input type="text" value={buscaInput} onChange={e => handleBusca(e.target.value)} placeholder="Buscar produto..."
                className="w-full pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"/>
              {buscaInput && (
                <button onClick={() => handleBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => handleCategoria(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  categoria === cat.id ? 'sr-gradient text-white shadow-lg shadow-red-950/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}>{cat.icon}{cat.label}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({length:20}).map((_,i) => <SkeletonCard key={i}/>)}
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <p className="text-zinc-500 mb-6">Não foi possível carregar os produtos.</p>
              <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-semibold">
                Ver no Mercado Livre <ExternalLink className="w-4 h-4"/>
              </a>
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-32"><p className="text-zinc-500">Nenhum produto encontrado.</p></div>
          ) : (
            <>
              <motion.div key={`${categoria}-${busca}-${pagina}`}
                initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
              </motion.div>
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-3 mt-14">
                  <button onClick={()=>{setPagina(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={pagina===1}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-5 h-5"/>
                  </button>
                  <div className="flex gap-2">
                    {Array.from({length:Math.min(totalPaginas,5)},(_,i)=>{
                      const p = pagina<=3 ? i+1 : pagina-2+i;
                      if (p<1||p>totalPaginas) return null;
                      return (
                        <button key={p} onClick={()=>{setPagina(p);window.scrollTo({top:0,behavior:'smooth'});}}
                          className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${p===pagina?'sr-gradient text-white shadow-lg':'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'}`}>{p}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={()=>{setPagina(p=>Math.min(totalPaginas,p+1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={pagina===totalPaginas}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronRight className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Coleções */}
      <SecaoColecoes navigate={navigate}/>

      {/* Artigos */}
      <SecaoArtigos navigate={navigate}/>

      {/* Garantia */}
      <section className="py-24 px-6 bg-white/[0.015] border-y border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Por que comprar aqui</p>
            <h2 className="font-bebas text-5xl text-white">Nossa Garantia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:<ShieldCheck className="w-8 h-8"/>, title:'100% Originais', desc:'Garantia de procedência em cada disco.', from:'from-red-600/15', border:'border-red-500/20 hover:border-red-500/40' },
              { icon:<History     className="w-8 h-8"/>, title:'Desde 2005',     desc:'Quase duas décadas de tradição no ML.',  from:'from-blue-600/15',border:'border-blue-500/20 hover:border-blue-500/40' },
              { icon:<Truck       className="w-8 h-8"/>, title:'Envio Seguro',   desc:'Embalagem reforçada. Disco chega intacto.',from:'from-zinc-600/15',border:'border-white/10 hover:border-white/25' },
            ].map((f,i)=>(
              <motion.div key={i} whileHover={{y:-6}}
                className={`relative p-8 rounded-3xl bg-gradient-to-br ${f.from} to-transparent border ${f.border} transition-all overflow-hidden`}>
                <div className="sr-gradient-text mb-5">{f.icon}</div>
                <h3 className="font-bebas text-2xl text-white mb-3">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 sr-gradient opacity-95"/>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-bebas text-6xl text-white mb-8">Nossa História</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              A <strong>Sylvios Records</strong> nasceu em 2005 da paixão pela música e pelo cinema.
              Catálogo vasto que vai do Rock, Metal e Grunge ao melhor da MPB e Moda de Viola.
            </p>
            <p className="text-white/70 text-lg leading-relaxed mb-12">
              Para um colecionador, cada detalhe importa — o encarte impecável, a caixa conservada,
              o disco sem riscos. Por isso só vendemos produtos originais.
            </p>
            <div className="flex gap-12">
              {[['20+','Anos'],['15k+','Vendas'],['100%','Original']].map(([v,l])=>(
                <div key={l}>
                  <div className="font-bebas text-5xl text-white">{v}</div>
                  <div className="text-white/50 text-xs uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-white/[0.015] border-t border-white/6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">Dúvidas frequentes</p>
            <h2 className="font-bebas text-5xl text-white">Perguntas</h2>
          </div>
          <div>{FAQ.map((f,i)=><FaqAccordion key={i} q={f.q} a={f.a}/>)}</div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="relative w-28 h-28 mx-auto mb-10">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-30 blur-2xl"/>
              <img src={STORE_LOGO} alt={STORE_NAME} className="relative w-full h-full object-contain drop-shadow-[0_0_30px_rgba(230,57,70,0.5)]"
                referrerPolicy="no-referrer" onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
            </div>
            <h2 className="font-bebas text-6xl md:text-8xl leading-none mb-6">
              <span className="sr-gradient-text">Aumente</span><br/><span className="text-white">sua coleção.</span>
            </h2>
            <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
              className="sr-gradient inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl text-white hover:opacity-90 transition-all shadow-2xl shadow-red-950/40 active:scale-95">
              Acessar Loja Completa <ExternalLink className="w-6 h-6"/>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-600 text-sm">
          <div className="flex items-center gap-3">
            <img src={STORE_LOGO} alt="" className="w-7 h-7 object-contain opacity-60" referrerPolicy="no-referrer"
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
            <span className="font-bebas tracking-widest text-zinc-500">{STORE_NAME.toUpperCase()}</span>
          </div>
          <span>© 2026 {STORE_NAME}. Todos os direitos reservados.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

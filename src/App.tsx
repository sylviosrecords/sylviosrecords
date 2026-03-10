/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc, Film, Package, ShieldCheck, Truck, History,
  ExternalLink, ChevronRight, ChevronLeft, Star,
  Music, Loader2, Search, TrendingUp, ChevronDown, X
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────
const STORE_NAME = "Sylvios Records";
const STORE_LINK = "https://www.mercadolivre.com.br/pagina/sylviosrecords";
const STORE_LOGO = "https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA";

const LINKS = {
  ALL:    "https://lista.mercadolivre.com.br/pagina/sylviosrecords/",
  MUSIC:  "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/musica/",
  MOVIES: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/filmes-fisicos/",
};

const GENRES = ['Rock','Metal','Grunge','Punk','Clássico','MPB','Moda de Viola','Jazz','Blues'];

const CATEGORIAS = [
  { id: 'todos',   label: 'Todos',    icon: <Package className="w-4 h-4"/> },
  { id: 'cds',     label: 'CDs',      icon: <Music   className="w-4 h-4"/> },
  { id: 'dvds',    label: 'DVDs',     icon: <Film    className="w-4 h-4"/> },
  { id: 'blurays', label: 'Blu-Rays', icon: <Disc    className="w-4 h-4"/> },
];

const FAQ = [
  { q:"Os produtos são originais?",    a:"Sim. Trabalhamos exclusivamente com mídias físicas 100% originais, nacionais e importadas." },
  { q:"Como é feito o envio?",         a:"Usamos embalagens reforçadas com plástico bolha e papelão rígido. Seu disco chega intacto." },
  { q:"Vocês aceitam encomendas?",     a:"Renovamos o estoque constantemente. Para títulos específicos, use o campo de perguntas no ML." },
  { q:"Entregam para todo o Brasil?",  a:"Sim! Vendemos pelo Mercado Livre com frete calculado no checkout para todo o Brasil." },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original: number | null;
  foto: string;
  link: string;
  vendidos: number;
  condicao: string;
  disponivel: boolean;
}

// ── Hook busca produtos via API própria ───────────────────────────────────────
function useProdutos(categoria: string, busca: string, pagina: number) {
  const [produtos,  setProdutos]  = useState<Produto[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);
  const limite = 20;

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({
          pagina: String(pagina),
          limite: String(limite),
          ...(categoria !== 'todos' && { categoria }),
          ...(busca && { busca }),
        });
        const res  = await fetch(`/api/produtos?${params}`);
        const data = await res.json();
        if (!cancelado) {
          setProdutos(data.produtos || []);
          setTotal(data.total || 0);
        }
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };
    carregar();
    return () => { cancelado = true; };
  }, [categoria, busca, pagina]);

  return { produtos, total, loading, error, limite };
}

// ── Formatador de preço ───────────────────────────────────────────────────────
const fmt = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const desc = (o: number, c: number) => Math.round(((o-c)/o)*100);

// ── Card produto ──────────────────────────────────────────────────────────────
function ProdutoCard({ p }: { p: Produto }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <a href={p.link} target="_blank" rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30 duration-300">
      {/* Imagem */}
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        {imgOk && p.foto
          ? <img src={p.foto} alt={p.titulo}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgOk(false)}/>
          : <div className="w-full h-full flex items-center justify-center">
              <Disc className="w-12 h-12 text-zinc-700"/>
            </div>
        }
        {p.preco_original && p.preco_original > p.preco && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            -{desc(p.preco_original, p.preco)}%
          </span>
        )}
        {p.condicao === 'new' && (
          <span className="absolute top-2 right-2 bg-blue-600/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            NOVO
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 min-h-[30px] mb-2 flex-1">{p.titulo}</p>
        {p.preco_original && p.preco_original > p.preco && (
          <p className="text-zinc-600 text-[11px] line-through">{fmt(p.preco_original)}</p>
        )}
        <p className="text-white font-bold text-sm">{fmt(p.preco)}</p>
        {p.vendidos > 0 && (
          <p className="text-zinc-600 text-[10px] mt-1">{p.vendidos} vendidos</p>
        )}
      </div>
    </a>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 cursor-pointer group" onClick={() => setOpen(!open)}>
      <div className="flex justify-between items-center py-5 gap-4">
        <span className="font-semibold text-white/90 group-hover:text-red-400 transition-colors">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-red-500 flex-shrink-0"/>
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }} className="overflow-hidden">
            <p className="pb-5 text-zinc-400 leading-relaxed text-sm">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Ticker ────────────────────────────────────────────────────────────────────
function GenreTicker() {
  return (
    <div className="overflow-hidden border-y border-white/6 py-3 bg-white/[0.02]">
      <motion.div className="flex gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}>
        {[...GENRES, ...GENRES, ...GENRES, ...GENRES].map((g, i) => (
          <span key={i} className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-zinc-500">
            <span className="w-1 h-1 rounded-full bg-gradient-to-r from-red-500 to-blue-500 inline-block"/>
            {g}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [scrolled,   setScrolled]   = useState(false);
  const [categoria,  setCategoria]  = useState('todos');
  const [busca,      setBusca]      = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [pagina,     setPagina]     = useState(1);
  const buscaTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  const { produtos, total, loading, error, limite } = useProdutos(categoria, busca, pagina);
  const totalPaginas = Math.ceil(total / limite);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Debounce na busca
  const handleBusca = (v: string) => {
    setBuscaInput(v);
    if (buscaTimer.current) clearTimeout(buscaTimer.current);
    buscaTimer.current = setTimeout(() => { setBusca(v); setPagina(1); }, 500);
  };

  const handleCategoria = (c: string) => {
    setCategoria(c); setPagina(1); setBusca(''); setBuscaInput('');
  };

  const scrollToCatalogo = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,600;1,400&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        body { font-family: 'DM Sans', sans-serif; }
        .sr-gradient { background: linear-gradient(135deg, #e63946 0%, #1d3557 100%); }
        .sr-gradient-text {
          background: linear-gradient(135deg, #e63946 0%, #4895ef 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        @keyframes spin-vinyl { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin-vinyl { animation: spin-vinyl 18s linear infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 6s ease-in-out infinite; }
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-1%,-2%)}
          20%{transform:translate(2%,1%)} 30%{transform:translate(-1%,3%)}
          40%{transform:translate(3%,-1%)} 50%{transform:translate(-2%,1%)}
        }
        .grain::before {
          content:''; position:fixed; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.035; pointer-events:none; animation:grain 0.4s steps(2) infinite; z-index:9999;
        }
        ::selection { background:#e63946; color:#fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #e63946; border-radius: 3px; }
      `}</style>

      <div className="grain fixed inset-0 pointer-events-none z-[9999]"/>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#080808]/92 backdrop-blur-xl border-b border-white/6 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-25 blur-lg group-hover:opacity-50 transition-opacity"/>
              <img src={STORE_LOGO} alt={STORE_NAME}
                className="relative w-full h-full object-contain drop-shadow-[0_0_12px_rgba(230,57,70,0.5)]"
                referrerPolicy="no-referrer"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>
            </div>
            <div>
              <span className="font-bebas text-2xl tracking-widest sr-gradient-text">{STORE_NAME.toUpperCase()}</span>
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest -mt-1">Mídias Físicas · Desde 2005</p>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            {[['#catalogo','Catálogo'],['#sobre','Sobre'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors relative group">
                {label}
                <span className="absolute -bottom-1 left-0 w-0 h-px sr-gradient group-hover:w-full transition-all duration-300"/>
              </a>
            ))}
          </div>

          <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
            className="sr-gradient text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-900/30 active:scale-95">
            Ver Loja <ExternalLink className="w-4 h-4"/>
          </a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-28 pb-0 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[140px]"/>
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[140px]"/>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55vw] opacity-[0.04] pointer-events-none">
            <img src={STORE_LOGO} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer"/>
          </div>
          {/* Vinil decorativo */}
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative w-[360px] h-[360px] float">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 spin-vinyl shadow-2xl shadow-black/60"/>
              {[0.82,0.68,0.54,0.42,0.32].map((s,i) => (
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
              CDs, DVDs e Blu-rays 100% originais. Do Rock e Metal à MPB e Moda de Viola.
              {' '}<span className="text-white font-semibold">Desde 2005.</span>
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}}
              className="flex flex-wrap gap-4">
              <button onClick={scrollToCatalogo}
                className="sr-gradient text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-red-950/30 active:scale-95">
                Ver Catálogo Completo <ChevronRight className="w-5 h-5"/>
              </button>
              <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
                className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Loja no ML <ExternalLink className="w-5 h-5"/>
              </a>
            </motion.div>

            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}
              className="flex gap-8 mt-12 pt-10 border-t border-white/8">
              {[['15k+','Vendas'],['20+','Anos no ML'],['100%','Originais']].map(([v,l]) => (
                <div key={l}>
                  <div className="font-bebas text-3xl sr-gradient-text">{v}</div>
                  <div className="text-zinc-600 text-xs uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <GenreTicker/>

      {/* ── CATÁLOGO COMPLETO ────────────────────────────────────────────── */}
      <section id="catalogo" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-3">
                <TrendingUp className="w-3 h-3 text-red-400"/>
                <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Direto do Mercado Livre</span>
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl sr-gradient-text">Catálogo Completo</h2>
              {!loading && total > 0 && (
                <p className="text-zinc-500 text-sm mt-1">{total.toLocaleString('pt-BR')} produtos disponíveis</p>
              )}
            </div>

            {/* Busca */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
              <input
                type="text"
                value={buscaInput}
                onChange={e => handleBusca(e.target.value)}
                placeholder="Buscar produto..."
                className="w-full pl-11 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-red-500/50 transition-colors"
              />
              {buscaInput && (
                <button onClick={() => { handleBusca(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              )}
            </div>
          </div>

          {/* Filtros de categoria */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIAS.map(cat => (
              <button key={cat.id} onClick={() => handleCategoria(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  categoria === cat.id
                    ? 'sr-gradient text-white shadow-lg shadow-red-950/30'
                    : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}>
                {cat.icon}{cat.label}
              </button>
            ))}
          </div>

          {/* Grid de produtos */}
          {loading ? (
            <div className="flex items-center justify-center py-32 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-500"/>
              <span className="text-zinc-500">Buscando produtos...</span>
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
            <div className="text-center py-32">
              <p className="text-zinc-500">Nenhum produto encontrado para "{busca}".</p>
            </div>
          ) : (
            <>
              <motion.div
                key={`${categoria}-${busca}-${pagina}`}
                initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.3}}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {produtos.map(p => <ProdutoCard key={p.id} p={p}/>)}
              </motion.div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex items-center justify-center gap-3 mt-14">
                  <button onClick={() => { setPagina(p => Math.max(1, p-1)); window.scrollTo({top: 0, behavior:'smooth'}); }}
                    disabled={pagina === 1}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronLeft className="w-5 h-5"/>
                  </button>

                  <div className="flex gap-2">
                    {Array.from({length: Math.min(totalPaginas, 5)}, (_, i) => {
                      const p = pagina <= 3 ? i+1 : pagina - 2 + i;
                      if (p < 1 || p > totalPaginas) return null;
                      return (
                        <button key={p} onClick={() => { setPagina(p); window.scrollTo({top:0, behavior:'smooth'}); }}
                          className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                            p === pagina ? 'sr-gradient text-white shadow-lg' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'
                          }`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={() => { setPagina(p => Math.min(totalPaginas, p+1)); window.scrollTo({top:0, behavior:'smooth'}); }}
                    disabled={pagina === totalPaginas}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronRight className="w-5 h-5"/>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── DIFERENCIAIS ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.015] border-y border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Por que comprar aqui</p>
            <h2 className="font-bebas text-5xl text-white">Nossa Garantia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:<ShieldCheck className="w-8 h-8"/>, title:'100% Originais', desc:'Garantia de procedência em cada disco. Só vendemos itens verificados.', from:'from-red-600/15', border:'border-red-500/20 hover:border-red-500/40' },
              { icon:<History     className="w-8 h-8"/>, title:'Desde 2005',     desc:'Quase duas décadas de tradição e confiança no Mercado Livre.',         from:'from-blue-600/15', border:'border-blue-500/20 hover:border-blue-500/40' },
              { icon:<Truck       className="w-8 h-8"/>, title:'Envio Seguro',   desc:'Embalagem com plástico bolha e papelão rígido. Disco chega intacto.',   from:'from-zinc-600/15', border:'border-white/10 hover:border-white/25' },
            ].map((f,i) => (
              <motion.div key={i} whileHover={{y:-6}}
                className={`relative p-8 rounded-3xl bg-gradient-to-br ${f.from} to-transparent border ${f.border} transition-all overflow-hidden`}>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 opacity-5">
                  <img src={STORE_LOGO} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer"/>
                </div>
                <div className="sr-gradient-text mb-5">{f.icon}</div>
                <h3 className="font-bebas text-2xl text-white mb-3">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE ───────────────────────────────────────────────────────── */}
      <section id="sobre" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 sr-gradient opacity-95"/>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] opacity-10 pointer-events-none">
          <img src={STORE_LOGO} alt="" className="w-full h-full object-contain spin-vinyl" referrerPolicy="no-referrer"/>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-bebas text-6xl text-white mb-8">Nossa História</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              A <strong>Sylvios Records</strong> nasceu em 2005 da paixão pela música e pelo cinema.
              Especialistas em mídias físicas, construímos nossa reputação com um catálogo vasto
              que vai do Rock, Metal e Grunge ao melhor da MPB e Moda de Viola.
            </p>
            <p className="text-white/70 text-lg leading-relaxed mb-12">
              Para um colecionador, cada detalhe importa — o encarte impecável, a caixa conservada,
              o disco sem riscos. Por isso só vendemos produtos originais.
            </p>
            <div className="flex gap-12">
              {[['20+','Anos'],['15k+','Vendas'],['100%','Original']].map(([v,l]) => (
                <div key={l}>
                  <div className="font-bebas text-5xl text-white">{v}</div>
                  <div className="text-white/50 text-xs uppercase tracking-widest">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 bg-white/[0.015] border-t border-white/6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">Dúvidas frequentes</p>
            <h2 className="font-bebas text-5xl text-white">Perguntas</h2>
          </div>
          <div>{FAQ.map((f,i) => <FAQItem key={i} q={f.q} a={f.a}/>)}</div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="relative w-28 h-28 mx-auto mb-10">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-30 blur-2xl"/>
              <img src={STORE_LOGO} alt={STORE_NAME}
                className="relative w-full h-full object-contain drop-shadow-[0_0_30px_rgba(230,57,70,0.5)]"
                referrerPolicy="no-referrer"
                onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
            </div>
            <h2 className="font-bebas text-6xl md:text-8xl leading-none mb-6">
              <span className="sr-gradient-text">Aumente</span><br/>
              <span className="text-white">sua coleção.</span>
            </h2>
            <p className="text-zinc-500 text-lg mb-10 max-w-md mx-auto">
              Todos os produtos disponíveis com compra 100% segura pelo Mercado Livre.
            </p>
            <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
              className="sr-gradient inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl text-white hover:opacity-90 transition-all shadow-2xl shadow-red-950/40 active:scale-95">
              Acessar Loja Completa <ExternalLink className="w-6 h-6"/>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
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

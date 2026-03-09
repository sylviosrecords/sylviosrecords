/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc, Film, Package, ShieldCheck, Truck, History,
  ExternalLink, ChevronRight, ChevronLeft, Star,
  Music, Loader2, ShoppingCart, TrendingUp, ChevronDown
} from 'lucide-react';

// ── Constantes ────────────────────────────────────────────────────────────────
const STORE_NAME  = "Sylvios Records";
const STORE_LINK  = "https://www.mercadolivre.com.br/pagina/sylviosrecords";
const STORE_LOGO  = "https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA";
const SELLER_NICK = "sylviosrecords";

const LINKS = {
  ALL:    "https://lista.mercadolivre.com.br/pagina/sylviosrecords/",
  MUSIC:  "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/musica/",
  MOVIES: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/filmes-fisicos/",
  SERIES: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/seriados/",
};

const GENRES = ['Rock','Metal','Grunge','Punk','Clássico','MPB','Moda de Viola','Jazz','Blues'];

const CATEGORIES = [
  { id:'cds',    title:'CDs',             icon:<Music   className="w-5 h-5"/>, desc:'Álbuns raros, nacionais e importados.',       img:'https://lh3.googleusercontent.com/d/18e1pt4ENEMhUprWFVp7aZFIPCCrsf9Yy', link:LINKS.MUSIC  },
  { id:'dvds',   title:'DVDs',            icon:<Film    className="w-5 h-5"/>, desc:'Filmes, shows e documentários musicais.',      img:'https://lh3.googleusercontent.com/d/1pFi7VQ9y6deX7sGfbFG40aIcATqUt70l', link:LINKS.MOVIES },
  { id:'blurays',title:'Blu-Rays',        icon:<Disc    className="w-5 h-5"/>, desc:'Alta definição para sua coleção.',             img:'https://lh3.googleusercontent.com/d/1-hQ6SFPr7WqGZ7eozTwZjtNhmgP1c9Mp', link:LINKS.MOVIES },
  { id:'boxes',  title:'Boxes & Especiais',icon:<Package className="w-5 h-5"/>,desc:'Edições de luxo e itens para colecionadores.',img:'https://lh3.googleusercontent.com/d/1bGasfQk_kK23kiEUYoT_8h5Maq6agUUU', link:LINKS.ALL    },
];

const FAQ = [
  { q:"Os produtos são originais?",      a:"Sim. Trabalhamos exclusivamente com mídias físicas 100% originais, nacionais e importadas. Cada item é verificado antes de anunciado." },
  { q:"Como é feito o envio?",           a:"Usamos embalagens reforçadas com plástico bolha e papelão rígido para que o disco e o encarte cheguem perfeitos." },
  { q:"Vocês aceitam encomendas?",       a:"Renovamos o estoque constantemente. Para títulos específicos, use o campo de perguntas no Mercado Livre e nos avise." },
  { q:"Compram de todo o Brasil?",       a:"Vendemos para todo o Brasil pelo Mercado Livre, com frete calculado no checkout." },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface MLProduct {
  id: string; title: string; price: number;
  original_price: number | null; thumbnail: string;
  permalink: string; label: string;
}

// ── Produtos fallback ─────────────────────────────────────────────────────────
const BEST_SELLERS: MLProduct[] = [
  { id:'1',  title:"King Crimson – In the Court of the Crimson King", price:49.90, original_price:59.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/c7/72/1d/c7721df0-9c25-2ec0-5f66-a8f19b7e9e0d/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-king-crimson-in-the-court-of-the-impnovolacr/p/MLB25581255', label:'Rock Prog' },
  { id:'2',  title:"Belchior – Alucinação",                           price:39.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8e/2f/7b/8e2f7b90-4a0e-b892-2be2-3a2c9e4c0e1d/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-belchior-alucinacao/p/MLB22999342', label:'MPB' },
  { id:'3',  title:"Guns N' Roses – Use Your Illusion I",             price:44.90, original_price:54.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/8f/04/09/8f040974-ca1a-5fc0-ac75-c62a58b94480/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-guns-n-roses-use-your-illusion-i-lacrado/p/MLB24742382', label:'Hard Rock' },
  { id:'4',  title:"Raul Seixas – Gita",                              price:37.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5b/6e/38/5b6e38f0-0e6a-5c31-0c1a-3e7a1d4e7c2b/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-raul-seixas-gita-lacrado-verso-do-album-estandar/p/MLB22921057', label:'Rock Nacional' },
  { id:'5',  title:"Guns N' Roses – Greatest Hits",                   price:42.90, original_price:49.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/aa/43/c4/aa43c4a8-0e31-e52b-a96e-f9356be9bb2e/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-guns-n-roses-greatest-hits/p/MLB22610868', label:'Hard Rock' },
  { id:'6',  title:"Rainbow – Straight Between the Eyes",             price:46.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/b5/3a/58/b53a58b2-2a18-e4cd-5048-8e49f5c8b7b3/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-rainbow-straight-between-the-eyes-impnovolacrado/p/MLB24577768', label:'Heavy Metal' },
  { id:'7',  title:"A-ha – The Collection",                           price:38.90, original_price:45.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/46/ae/d0/46aed0fa-c1b4-6b5e-ed25-52bbb90e6e1e/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-a-ha-collection-lacrado/p/MLB22507415', label:'Pop Rock' },
  { id:'8',  title:"Bryan Adams – So Far So Good",                    price:36.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/a7/f2/32/a7f232e8-a4e1-c1a4-5e32-1e7b4e3c9b1a/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/bryan-adams-so-far-so-good-cd-1993-produzido-por-polygran/p/MLB22981121', label:'Rock' },
  { id:'9',  title:"Titãs – Acústico MTV",                            price:41.90, original_price:49.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2c/4b/8e/2c4b8e12-3a1c-6e2b-9f4a-1c3e7d5b8a0c/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/tits-acustico-mtv-cd-original/p/MLB23056108', label:'Rock Nacional' },
  { id:'10', title:"Adele – 25",                                      price:39.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music20/v4/26/20/33/262033d8-8a0e-5a6a-8484-f6a5c5a4e1c5/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-adele-25/p/MLB22913005', label:'Pop' },
  { id:'11', title:"Bee Gees – Greatest",                             price:43.90, original_price:52.90, thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/e4/9c/ba/e49cba3e-7b0e-0f23-5c82-9b8e6b7a3e2c/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-bee-gees-greatest-hits-stayin-alive-lacrado/p/MLB23130291', label:'Disco / Pop' },
  { id:'12', title:"Ramones – Adios Amigos",                          price:44.90, original_price:null,   thumbnail:'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/cd/7e/bf/cd7ebfe2-5e9a-7d3b-8d6a-1a4b9c2e0f1d/source/600x600bb.jpg', permalink:'https://www.mercadolivre.com.br/cd-ramones-adios-amigos-rock-1995-album-fisico-13-faixas-brasil/p/MLB22959340', label:'Punk Rock' },
];

// ── iTunes artwork helper ────────────────────────────────────────────────────
async function fetchItunesArtwork(title: string): Promise<string> {
  try {
    const q = encodeURIComponent(title.replace(/[–—-]/g,' ').trim());
    const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=album&limit=1&country=BR`);
    const d = await r.json();
    const art = d.results?.[0]?.artworkUrl100;
    if (art) return art.replace('100x100bb','400x400bb');
  } catch {}
  return '';
}

// ── Hook ML + iTunes ─────────────────────────────────────────────────────────
function useMercadoLivreProducts() {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(false);
        const ml  = `https://api.mercadolibre.com/sites/MLB/search?nickname=${SELLER_NICK}&sort=sold_quantity_desc&limit=20`;
        const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(ml)}`, { headers:{'Accept':'application/json'} });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items: MLProduct[] = await Promise.all((data.results||[]).map(async (item:any) => {
          const art = await fetchItunesArtwork(item.title);
          return { id:item.id, title:item.title, price:item.price, original_price:item.original_price,
                   thumbnail:art, permalink:item.permalink, label:'' };
        }));
        setProducts(items.length ? items : BEST_SELLERS);
      } catch {
        const fb = await Promise.all(BEST_SELLERS.map(async p => {
          const art = await fetchItunesArtwork(p.title);
          return art ? {...p, thumbnail:art} : p;
        }));
        setProducts(fb);
      } finally { setLoading(false); }
    };
    load();
    const t = setInterval(load, 30*60*1000);
    return () => clearInterval(t);
  }, []);

  return { products, loading, error };
}

// ── Carrossel ────────────────────────────────────────────────────────────────
function ProductCarousel({ products, loading }: { products:MLProduct[]; loading:boolean }) {
  const [idx, setIdx]     = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const vis   = 4;
  const max   = Math.max(0, products.length - vis);

  const fmtPrice = (v:number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const disc     = (o:number, c:number) => Math.round(((o-c)/o)*100);

  useEffect(() => {
    if (paused || !products.length) return;
    timer.current = setTimeout(() => setIdx(i => i >= max ? 0 : i+1), 3500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, paused, max, products.length]);

  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-red-500"/>
      <span className="text-zinc-500 text-sm">Buscando produtos...</span>
    </div>
  );

  if (!products.length) return (
    <div className="text-center py-16">
      <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-red-500/50 transition-colors text-sm">
        Ver todos no Mercado Livre <ExternalLink className="w-4 h-4"/>
      </a>
    </div>
  );

  return (
    <div className="relative" onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <button onClick={()=>setIdx(i=>Math.max(i-1,0))} disabled={idx===0}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:border-red-500/50 disabled:opacity-20 transition-all shadow-xl">
        <ChevronLeft className="w-5 h-5"/>
      </button>

      <div className="overflow-hidden">
        <motion.div className="flex gap-4"
          animate={{ x: `calc(-${idx*(100/vis)}% - ${idx*16/vis}px)` }}
          transition={{ type:'spring', stiffness:280, damping:32 }}>
          {products.map(p => (
            <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer"
              className="flex-none w-[calc(25%-12px)] min-w-[180px] group">
              <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/40 duration-300">
                <div className="relative aspect-square bg-zinc-800 overflow-hidden">
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.title}
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-500"/>
                    : <div className="w-full h-full flex items-center justify-center"><Disc className="w-12 h-12 text-zinc-700"/></div>
                  }
                  {p.original_price && p.original_price > p.price && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      -{disc(p.original_price, p.price)}%
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 min-h-[30px] mb-2">{p.title}</p>
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-zinc-600 text-[11px] line-through">{fmtPrice(p.original_price)}</p>
                  )}
                  <p className="text-white font-bold">{fmtPrice(p.price)}</p>
                </div>
              </div>
            </a>
          ))}
        </motion.div>
      </div>

      <button onClick={()=>setIdx(i=>Math.min(i+1,max))} disabled={idx>=max}
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center hover:border-red-500/50 disabled:opacity-20 transition-all shadow-xl">
        <ChevronRight className="w-5 h-5"/>
      </button>

      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({length:max+1}).map((_,i)=>(
          <button key={i} onClick={()=>setIdx(i)}
            className={`h-1 rounded-full transition-all ${i===idx?'w-6 bg-red-500':'w-1.5 bg-zinc-700'}`}/>
        ))}
      </div>
    </div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────
function FAQItem({q,a}:{q:string;a:string}) {
  const [open,setOpen] = useState(false);
  return (
    <div className="border-b border-white/8 cursor-pointer group" onClick={()=>setOpen(!open)}>
      <div className="flex justify-between items-center py-5 gap-4">
        <span className="font-semibold text-white/90 group-hover:text-red-400 transition-colors">{q}</span>
        <motion.div animate={{rotate:open?180:0}} transition={{duration:0.25}}>
          <ChevronDown className="w-5 h-5 text-red-500 flex-shrink-0"/>
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}}
            exit={{height:0,opacity:0}} transition={{duration:0.25}} className="overflow-hidden">
            <p className="pb-5 text-zinc-400 leading-relaxed text-sm">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Ticker de gêneros ─────────────────────────────────────────────────────────
function GenreTicker() {
  return (
    <div className="overflow-hidden border-y border-white/6 py-3 bg-white/[0.02]">
      <motion.div className="flex gap-10 whitespace-nowrap"
        animate={{x:['0%','-50%']}} transition={{repeat:Infinity,duration:22,ease:'linear'}}>
        {[...GENRES,...GENRES,...GENRES,...GENRES].map((g,i)=>(
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
  const [activeCat, setActiveCat]   = useState(CATEGORIES[0]);
  const [scrolled,  setScrolled]    = useState(false);
  const { products, loading }       = useMercadoLivreProducts();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,400;0,600;1,400&display=swap');
        .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        body { font-family: 'DM Sans', sans-serif; }

        /* Gradiente da marca: vermelho → azul */
        .sr-gradient { background: linear-gradient(135deg, #e63946 0%, #1d3557 100%); }
        .sr-gradient-text {
          background: linear-gradient(135deg, #e63946 0%, #4895ef 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sr-border { border-image: linear-gradient(135deg,#e63946,#4895ef) 1; }

        /* Glow vermelho-azul */
        .sr-glow { box-shadow: 0 0 60px rgba(230,57,70,0.15), 0 0 120px rgba(72,149,239,0.08); }

        @keyframes spin-vinyl { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin-vinyl { animation: spin-vinyl 18s linear infinite; }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 6s ease-in-out infinite; }

        /* Grain */
        @keyframes grain {
          0%,100%{transform:translate(0,0)} 10%{transform:translate(-1%,-2%)}
          20%{transform:translate(2%,1%)} 30%{transform:translate(-1%,3%)}
          40%{transform:translate(3%,-1%)} 50%{transform:translate(-2%,1%)}
          60%{transform:translate(1%,2%)} 70%{transform:translate(-3%,-1%)}
          80%{transform:translate(1%,-3%)} 90%{transform:translate(2%,1%)}
        }
        .grain::before {
          content:''; position:fixed; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.035; pointer-events:none; animation:grain 0.4s steps(2) infinite; z-index:9999;
        }
        ::selection { background:#e63946; color:#fff; }
      `}</style>

      <div className="grain fixed inset-0 pointer-events-none z-[9999]"/>

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-400 ${
        scrolled ? 'bg-[#080808]/90 backdrop-blur-xl border-b border-white/6 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-30 blur-lg group-hover:opacity-60 transition-opacity"/>
              <img src={STORE_LOGO} alt={STORE_NAME}
                className="relative w-full h-full object-contain drop-shadow-[0_0_12px_rgba(230,57,70,0.6)]"
                referrerPolicy="no-referrer"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }}/>
            </div>
            <div>
              <span className="font-bebas text-2xl tracking-widest sr-gradient-text">{STORE_NAME.toUpperCase()}</span>
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest -mt-1">Mídias Físicas · Desde 2005</p>
            </div>
          </a>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-500">
            {[['#mais-vendidos','Mais Vendidos'],['#categorias','Categorias'],['#sobre','Sobre'],['#faq','FAQ']].map(([href,label])=>(
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

        {/* Fundo atmosférico */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Glow vermelho esquerda */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-40 w-[600px] h-[600px] bg-red-700/10 rounded-full blur-[140px]"/>
          {/* Glow azul direita */}
          <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[140px]"/>
          {/* Logo gigante fantasma */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[55vw] opacity-[0.04] pointer-events-none">
            <img src={STORE_LOGO} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer"/>
          </div>
          {/* Vinil decorativo */}
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative w-[380px] h-[380px] float">
              {/* Disco */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/5 spin-vinyl shadow-2xl shadow-black/60"/>
              {/* Sulcos */}
              {[0.82,0.68,0.54,0.42,0.32].map((s,i)=>(
                <div key={i} className="absolute rounded-full border border-white/[0.04]"
                  style={{inset:`${(1-s)*50}%`,}}/>
              ))}
              {/* Label central com degradê */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full sr-gradient flex items-center justify-center shadow-lg">
                <img src={STORE_LOGO} alt="" className="w-20 h-20 object-contain drop-shadow-lg" referrerPolicy="no-referrer"
                  onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">

            {/* Badge ML */}
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/>
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Mercado Líder Platinum</span>
            </motion.div>

            {/* Título */}
            <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.8,delay:0.1}}
              className="font-bebas text-[clamp(4rem,10vw,7.5rem)] leading-[0.9] mb-8 tracking-wide">
              <span className="sr-gradient-text">Sylvios</span><br/>
              <span className="text-white">Records</span><br/>
              <span className="text-zinc-600 text-[0.55em]">Mídias Físicas Originais</span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.2}}
              className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-lg">
              CDs, DVDs e Blu-rays 100% originais. Do Rock e Metal à MPB e Moda de Viola —
              cada disco conta uma história. <span className="text-white font-semibold">Desde 2005.</span>
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.3}}
              className="flex flex-wrap gap-4">
              <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
                className="sr-gradient text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-red-950/30 active:scale-95">
                Explorar Coleção <ChevronRight className="w-5 h-5"/>
              </a>
              <a href="#mais-vendidos"
                className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                Mais Vendidos
              </a>
            </motion.div>

            {/* Stats */}
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

      {/* ── TICKER GÊNEROS ──────────────────────────────────────────────── */}
      <GenreTicker/>

      {/* ── MAIS VENDIDOS ───────────────────────────────────────────────── */}
      <section id="mais-vendidos" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                <TrendingUp className="w-3 h-3 text-red-400"/>
                <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Atualizado automaticamente</span>
              </div>
              <h2 className="font-bebas text-5xl md:text-6xl sr-gradient-text">Mais Vendidos</h2>
              <p className="text-zinc-500 mt-1 text-sm">Os favoritos dos nossos clientes</p>
            </div>
            <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white border border-white/10 hover:border-red-500/30 px-5 py-2.5 rounded-full transition-all">
              Ver todos <ExternalLink className="w-4 h-4"/>
            </a>
          </div>
          <ProductCarousel products={products} loading={loading}/>
        </div>
      </section>

      {/* ── CATEGORIAS ──────────────────────────────────────────────────── */}
      <section id="categorias" className="py-28 px-6 bg-white/[0.015] border-y border-white/6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">Navegue por categoria</p>
            <h2 className="font-bebas text-5xl md:text-6xl text-white">O que você procura?</h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            {/* Lista de categorias */}
            <div className="w-full lg:w-5/12 flex flex-col gap-3">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={()=>setActiveCat(cat)}
                  className={`group flex items-center gap-5 p-5 rounded-2xl text-left transition-all ${
                    activeCat.id===cat.id
                      ? 'sr-gradient text-white shadow-xl shadow-red-950/30'
                      : 'bg-white/4 border border-white/8 hover:bg-white/8 text-zinc-400'
                  }`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${activeCat.id===cat.id?'bg-white/20':'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                    {cat.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base">{cat.title}</div>
                    <div className={`text-xs mt-0.5 ${activeCat.id===cat.id?'text-red-100':'text-zinc-600'}`}>{cat.desc}</div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-all ${activeCat.id===cat.id?'opacity-100':'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'}`}/>
                </button>
              ))}
            </div>

            {/* Imagem */}
            <div className="w-full lg:w-7/12 relative aspect-square lg:aspect-[4/3]">
              <AnimatePresence mode="wait">
                <motion.div key={activeCat.id}
                  initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:1.02}}
                  transition={{duration:0.35}}
                  className="absolute inset-0 rounded-3xl overflow-hidden border border-white/8 sr-glow">
                  <img src={activeCat.img} alt={activeCat.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"/>
                  {/* Overlay gradiente de marca */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"/>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-blue-900/20"/>
                  {/* Card inferior */}
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="bg-black/50 backdrop-blur-2xl border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bebas text-3xl sr-gradient-text">{activeCat.title}</div>
                          <p className="text-zinc-400 text-sm mt-1">{activeCat.desc}</p>
                        </div>
                        <a href={activeCat.link} target="_blank" rel="noopener noreferrer"
                          className="sr-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0">
                          Ver no ML <ExternalLink className="w-4 h-4"/>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ────────────────────────────────────────────────── */}
      <section id="diferenciais" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Por que comprar aqui</p>
            <h2 className="font-bebas text-5xl md:text-6xl text-white">Nossa garantia</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:<ShieldCheck className="w-8 h-8"/>, title:'100% Originais', desc:'Garantia de procedência em cada disco. Só vendemos itens verificados.', color:'from-red-600/20 to-red-900/5', border:'border-red-500/20 hover:border-red-500/50' },
              { icon:<History    className="w-8 h-8"/>, title:'Desde 2005',     desc:'Quase duas décadas de tradição e confiança no Mercado Livre.', color:'from-blue-600/20 to-blue-900/5', border:'border-blue-500/20 hover:border-blue-500/50' },
              { icon:<Truck      className="w-8 h-8"/>, title:'Envio Seguro',   desc:'Embalagem com plástico bolha e papelão rígido. Seu disco chega intacto.', color:'from-red-600/20 to-blue-900/5', border:'border-white/10 hover:border-white/30' },
            ].map((f,i)=>(
              <motion.div key={i} whileHover={{y:-8}}
                className={`relative p-8 rounded-3xl bg-gradient-to-br ${f.color} border ${f.border} transition-all overflow-hidden`}>
                {/* Watermark logo */}
                <div className="absolute -right-6 -bottom-6 w-28 h-28 opacity-5">
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
      <section id="sobre" className="py-28 px-6 relative overflow-hidden">
        {/* BG gradiente de marca */}
        <div className="absolute inset-0 sr-gradient opacity-95"/>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40"/>

        {/* Logo gigante decorativa */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] opacity-10 pointer-events-none">
          <img src={STORE_LOGO} alt="" className="w-full h-full object-contain spin-vinyl" referrerPolicy="no-referrer"/>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-bebas text-6xl md:text-7xl text-white mb-8 leading-none">Nossa História</h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              A <strong>Sylvios Records</strong> nasceu em 2005 da paixão pela música e pelo cinema.
              Especialistas em mídias físicas, construímos nossa reputação com um catálogo vasto
              que vai do Rock, Metal e Grunge ao melhor da MPB e Moda de Viola.
            </p>
            <p className="text-white/70 text-lg leading-relaxed mb-12">
              Para um colecionador, cada detalhe importa — o encarte impecável, a caixa conservada,
              o disco sem riscos. Por isso só vendemos produtos originais com atendimento que entende a sua paixão.
            </p>
            <div className="flex items-center gap-12">
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

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-28 px-6 bg-white/[0.015] border-t border-white/6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">Dúvidas frequentes</p>
            <h2 className="font-bebas text-5xl md:text-6xl text-white">Perguntas</h2>
          </div>
          <div>{FAQ.map((f,i)=><FAQItem key={i} q={f.q} a={f.a}/>)}</div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>

            {/* Logo centralizada */}
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
            <p className="text-zinc-500 text-lg mb-12 max-w-md mx-auto">
              Acesse nossa loja no Mercado Livre e encontre o próximo disco que vai completar a sua coleção.
            </p>
            <a href={LINKS.ALL} target="_blank" rel="noopener noreferrer"
              className="sr-gradient inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold text-xl text-white hover:opacity-90 transition-all shadow-2xl shadow-red-950/40 active:scale-95">
              Acessar Loja no Mercado Livre
              <ExternalLink className="w-6 h-6"/>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5 text-zinc-600 text-sm">
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

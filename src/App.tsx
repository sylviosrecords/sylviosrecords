/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc, Film, Package, ShieldCheck, Truck, History,
  ExternalLink, ChevronRight, ChevronLeft, Star,
  Music, Loader2, Search, TrendingUp, ChevronDown,
  X, ArrowLeft, ShoppingCart, ImageOff, BookOpen, Sparkles, Clock, Calendar
} from 'lucide-react';
import colecoesData from './colecoes.json';
import artigosData  from './artigos.json';

const STORE_NAME = "Sylvios Records";
const STORE_LINK = "https://www.mercadolivre.com.br/pagina/sylviosrecords";
const STORE_LOGO = "https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA";
const LINKS = {
  ALL:    "https://lista.mercadolivre.com.br/pagina/sylviosrecords/",
};
const GENRES = ['Rock','Metal','Grunge','Punk','Clássico','MPB','Moda de Viola','Jazz','Blues'];
const CATEGORIAS = [
  { id:'todos',   label:'Todos',    icon:<Package className="w-4 h-4"/> },
  { id:'cds',     label:'CDs',      icon:<Music   className="w-4 h-4"/> },
  { id:'dvds',    label:'DVDs',     icon:<Film    className="w-4 h-4"/> },
  { id:'blurays', label:'Blu-Rays', icon:<Disc    className="w-4 h-4"/> },
];
const FAQ = [
  { q:"Os produtos são originais?",   a:"Sim. Trabalhamos exclusivamente com mídias físicas 100% originais, nacionais e importadas." },
  { q:"Como é feito o envio?",        a:"Usamos embalagens reforçadas com plástico bolha e papelão rígido. Seu disco chega intacto." },
  { q:"Vocês aceitam encomendas?",    a:"Renovamos o estoque constantemente. Para títulos específicos, use o campo de perguntas no ML." },
  { q:"Entregam para todo o Brasil?", a:"Sim! Vendemos pelo Mercado Livre com frete calculado no checkout para todo o Brasil." },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Produto {
  id: string; titulo: string; slug?: string;
  preco: number; preco_original: number | null;
  foto: string; fotos?: string[];
  link: string; vendidos: number;
  condicao: string; disponivel: boolean; estoque?: number;
}
interface Colecao {
  slug: string; titulo: string; subtitulo: string; descricao: string; ids: string[];
}
interface Artigo {
  slug: string; titulo: string; resumo: string; categoria: string;
  autor: string; data: string; tempoLeitura: string;
  imagemCapa: string; conteudo: string; produtosRelacionados: string[];
}

const colecoes: Colecao[] = colecoesData as Colecao[];
const artigos:  Artigo[]  = artigosData  as Artigo[];

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function extrairIdML(slug: string): string {
  const match = slug.match(/^(MLB\d+)/i);
  return match ? match[1] : slug;
}

// Converte markdown simples (### h3, **bold**, *italic*, \n\n) em JSX
function renderMarkdown(texto: string) {
  return texto.split('\n\n').map((bloco, i) => {
    if (bloco.startsWith('### ')) {
      return <h3 key={i} className="font-bebas text-2xl text-white mt-8 mb-3">{bloco.replace('### ','')}</h3>;
    }
    const html = bloco
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
    return <p key={i} className="text-zinc-400 leading-relaxed mb-4" dangerouslySetInnerHTML={{__html: html}}/>;
  });
}

// ── Roteamento ────────────────────────────────────────────────────────────────
function useRoute() {
  const [route, setRoute] = useState(window.location.pathname + window.location.search);
  useEffect(() => {
    const fn = () => setRoute(window.location.pathname + window.location.search);
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, []);
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return { route, navigate };
}

const fmt  = (v: number) => v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const disc = (o: number, c: number) => Math.round(((o-c)/o)*100);

// ── Hooks de dados ────────────────────────────────────────────────────────────
function useProdutos(categoria: string, busca: string, pagina: number) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const limite = 20;
  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({
          pagina: String(pagina), limite: String(limite),
          ...(categoria !== 'todos' && { categoria }),
          ...(busca && { busca }),
        });
        const res  = await fetch(`/api/produtos?${params}`);
        const data = await res.json();
        if (!cancelado) { setProdutos(data.produtos || []); setTotal(data.total || 0); }
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [categoria, busca, pagina]);
  return { produtos, total, loading, error, limite };
}

function useBuscaPesquisa(q: string, sort: string, pagina: number) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const limite = 20;
  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({ q, sort, pagina: String(pagina) });
        const res  = await fetch(`/api/busca?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelado) { setProdutos(data.produtos || []); setTotal(data.total || 0); }
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [q, sort, pagina]);
  return { produtos, total, loading, error, limite };
}

function useProduto(slugComposto: string) {
  const id = extrairIdML(slugComposto);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const res  = await fetch(`/api/item?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelado) setProduto(data);
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [id]);
  return { produto, loading, error };
}

function useDescricao(id: string) {
  const [descricao, setDescricao] = useState('');
  const [loading,   setLoading]   = useState(false);
  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    const carregar = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/descricao?id=${encodeURIComponent(id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setDescricao(data.descricao || '');
      } catch { }
      finally { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [id]);
  return { descricao, loading };
}

function useProdutosColecao(ids: string[]) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const idsValidos = ids.filter(id => /^MLB\d+/i.test(id));
  useEffect(() => {
    if (!idsValidos.length) { setLoading(false); return; }
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const res  = await fetch(`/api/colecao?ids=${idsValidos.join(',')}`);
        const data = await res.json();
        if (!cancelado) setProdutos(data.produtos || []);
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [idsValidos.join(',')]);
  return { produtos, loading, error };
}

// ── Componentes reutilizáveis ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6">
      <div className="aspect-square skeleton"/>
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 w-full rounded"/>
        <div className="skeleton h-3 w-3/4 rounded"/>
        <div className="skeleton h-4 w-1/2 rounded mt-1"/>
      </div>
    </div>
  );
}

function ProdutoCard({ p, navigate }: { key?: React.Key; p: Produto; navigate: (path: string) => void }) {
  const [imgOk,     setImgOk]     = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const urlProduto = `/produto/${p.id}-${slugify(p.titulo)}`;
  return (
    <div onClick={() => navigate(urlProduto)}
      className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30 duration-300 cursor-pointer">
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        {!imgLoaded && <div className="absolute inset-0 skeleton"/>}
        {imgOk && p.foto
          ? <img src={p.foto} alt={p.titulo} loading="lazy"
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgOk(false); setImgLoaded(true); }}/>
          : <div className="w-full h-full flex items-center justify-center"><Disc className="w-12 h-12 text-zinc-700"/></div>
        }
        {p.preco_original && p.preco_original > p.preco && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            -{disc(p.preco_original, p.preco)}%
          </span>
        )}
        {p.condicao === 'new' && (
          <span className="absolute top-2 right-2 bg-blue-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NOVO</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 min-h-[30px] mb-2 flex-1">{p.titulo}</p>
        {p.preco_original && p.preco_original > p.preco && (
          <p className="text-zinc-600 text-[11px] line-through">{fmt(p.preco_original)}</p>
        )}
        <p className="text-white font-bold text-sm">{fmt(p.preco)}</p>
        {p.vendidos > 0 && <p className="text-zinc-600 text-[10px] mt-1">{p.vendidos} vendidos</p>}
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { key?: React.Key; q: string; a: string }) {
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

function GenreTicker() {
  return (
    <div className="overflow-hidden border-y border-white/6 py-3 bg-white/[0.02]">
      <motion.div className="flex gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}>
        {[...GENRES,...GENRES,...GENRES,...GENRES].map((g, i) => (
          <span key={i} className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-zinc-500">
            <span className="w-1 h-1 rounded-full bg-gradient-to-r from-red-500 to-blue-500 inline-block"/>{g}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Navbar secundária (produto/coleção/artigo/busca) ────────────────────────────────
function NavSecundaria({ navigate }: { navigate: (path: string) => void }) {
  const [buscaInput, setBuscaInput] = useState('');
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#080808]/92 backdrop-blur-xl border-b border-white/6 py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group shrink-0">
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-0 sr-gradient rounded-full opacity-25 blur-lg"/>
            <img src={STORE_LOGO} alt={STORE_NAME} className="relative w-full h-full object-contain" referrerPolicy="no-referrer"
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
          </div>
          <span className="hidden sm:block font-bebas text-xl tracking-widest sr-gradient-text">{STORE_NAME.toUpperCase()}</span>
        </button>
        <div className="flex-1 max-w-sm relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
          <form onSubmit={e => { e.preventDefault(); if (buscaInput) navigate(`/busca?q=${encodeURIComponent(buscaInput)}`); }}>
            <input type="text" value={buscaInput} onChange={e => setBuscaInput(e.target.value)} placeholder="Buscar discos, filmes..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"/>
          </form>
        </div>
        <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
          className="shrink-0 sr-gradient text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90">
          <span className="hidden sm:inline">Ver Loja</span> <ExternalLink className="w-4 h-4"/>
        </a>
      </div>
    </nav>
  );
}

// ── Página Produto ────────────────────────────────────────────────────────────
function PaginaProduto({ slugComposto, navigate }: { slugComposto: string; navigate: (path: string) => void }) {
  const { produto, loading, error } = useProduto(slugComposto);
  const [fotoIdx, setFotoIdx] = useState(0);
  const fotos = produto?.fotos?.length ? produto.fotos : produto?.foto ? [produto.foto] : [];
  const { descricao, loading: descLoading } = useDescricao(produto?.id || '');

  useEffect(() => {
    if (produto?.titulo) {
      document.title = `${produto.titulo} — ${STORE_NAME}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = `Compre ${produto.titulo} no Mercado Livre com envio seguro. Mídia física original — ${STORE_NAME}.`;

      // Injeção de Meta-Dados JSON-LD (Schema.org) para Rich Snippets no Google
      const jsonLd = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": produto.titulo,
        "image": produto.foto,
        "description": `Compre ${produto.titulo} original no ${STORE_NAME}. Envio seguro via Mercado Livre.`,
        "offers": {
          "@type": "Offer",
          "url": produto.link,
          "priceCurrency": "BRL",
          "price": produto.preco,
          "availability": produto.vendidos > -1 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": {
            "@type": "Organization",
            "name": STORE_NAME
          }
        }
      };

      let scriptLd = document.getElementById('json-ld') as HTMLScriptElement;
      if (!scriptLd) {
        scriptLd = document.createElement('script');
        scriptLd.id = 'json-ld';
        scriptLd.type = 'application/ld+json';
        document.head.appendChild(scriptLd);
      }
      scriptLd.textContent = JSON.stringify(jsonLd);
    }
    
    return () => { 
      document.title = STORE_NAME; 
      const existingScript = document.getElementById('json-ld');
      if (existingScript) existingScript.remove();
    };
  }, [produto]);

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-red-500"/>
    </div>
  );
  if (error || !produto) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <p className="text-zinc-400">Produto não encontrado.</p>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar ao catálogo
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar ao catálogo
        </button>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-900 border border-white/8 mb-4 relative">
              {fotos.length > 0
                ? <img src={fotos[fotoIdx]} alt={produto.titulo} className="w-full h-full object-contain p-4"/>
                : <div className="w-full h-full flex items-center justify-center"><ImageOff className="w-16 h-16 text-zinc-700"/></div>
              }
              {produto.preco_original && produto.preco_original > produto.preco && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-black px-3 py-1 rounded-full">
                  -{disc(produto.preco_original, produto.preco)}%
                </span>
              )}
            </div>
            {fotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {fotos.map((f, i) => (
                  <button key={i} onClick={() => setFotoIdx(i)}
                    className={`flex-none w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === fotoIdx ? 'border-red-500' : 'border-white/10 hover:border-white/30'}`}>
                    <img src={f} alt="" className="w-full h-full object-contain p-1"/>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-6">
            <span className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
              produto.condicao === 'new' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>{produto.condicao === 'new' ? 'Novo' : 'Usado'}</span>

            <h1 className="font-bebas text-4xl md:text-5xl leading-tight text-white">{produto.titulo}</h1>

            <div>
              {produto.preco_original && produto.preco_original > produto.preco && (
                <p className="text-zinc-500 text-lg line-through">{fmt(produto.preco_original)}</p>
              )}
              <p className="text-4xl font-bold sr-gradient-text">{fmt(produto.preco)}</p>
              {produto.preco_original && produto.preco_original > produto.preco && (
                <p className="text-green-400 text-sm mt-1">Você economiza {fmt(produto.preco_original - produto.preco)}</p>
              )}
            </div>

            {produto.estoque !== undefined && produto.estoque <= 5 && produto.estoque > 0 && (
              <p className="text-yellow-500 text-sm font-semibold">⚠️ Apenas {produto.estoque} {produto.estoque === 1 ? 'unidade' : 'unidades'} disponível</p>
            )}
            {produto.vendidos > 0 && <p className="text-zinc-500 text-sm">{produto.vendidos} vendidos</p>}

            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-400"/>
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Sobre este produto</span>
              </div>
              {descLoading
                ? <div className="space-y-2"><div className="skeleton h-3 w-full rounded"/><div className="skeleton h-3 w-4/5 rounded"/><div className="skeleton h-3 w-3/4 rounded"/></div>
                : descricao
                  ? <p className="text-zinc-400 text-sm leading-relaxed">{descricao}</p>
                  : <p className="text-zinc-600 text-sm italic">Descrição não disponível.</p>
              }
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/4 border border-white/8">
              {[['✅','Produto 100% original'],['📦','Embalagem reforçada para envio seguro'],['🏆','Vendedor Mercado Líder Platinum']].map(([emoji, texto]) => (
                <p key={texto} className="text-sm text-zinc-400">{emoji} {texto}</p>
              ))}
            </div>

            <a href={produto.link} target="_blank" rel="noopener noreferrer"
              className="sr-gradient text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-red-950/30 active:scale-95">
              <ShoppingCart className="w-6 h-6"/> Comprar no Mercado Livre <ExternalLink className="w-5 h-5"/>
            </a>
            <p className="text-zinc-600 text-xs text-center">Você será redirecionado para o Mercado Livre para finalizar a compra com segurança.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página Coleção ────────────────────────────────────────────────────────────
function PaginaColecao({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
  const colecao = colecoes.find(c => c.slug === slug);
  useEffect(() => {
    if (colecao) {
      document.title = `${colecao.titulo} — ${STORE_NAME}`;
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
      meta.content = `${colecao.subtitulo}. Confira a seleção completa na ${STORE_NAME}.`;
    }
    return () => { document.title = STORE_NAME; };
  }, [colecao]);

  const { produtos, loading, error } = useProdutosColecao(colecao?.ids || []);

  if (!colecao) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-6">
      <p className="text-zinc-400">Coleção não encontrada.</p>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar
      </button>
    </div>
  );

  const temProdutosReais = colecao.ids.some(id => /^MLB\d+/i.test(id));

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-10 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar ao catálogo
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

// ── Página Artigo ─────────────────────────────────────────────────────────────
function PaginaArtigo({ slug, navigate }: { slug: string; navigate: (path: string) => void }) {
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
      <button onClick={() => navigate('/')} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar
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
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar
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
      </div>
    </div>
  );
}

// ── Seção Coleções (home) ─────────────────────────────────────────────────────
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

// ── Seção Artigos (home) ──────────────────────────────────────────────────────
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

// ── Pagina Coleções List (Todas as Colecoes) ──────────────────────────────────
function PaginaColecoesList({ navigate }: { navigate: (path: string) => void }) {
  useEffect(() => {
    document.title = `Todas as Coleções — ${STORE_NAME}`;
    return () => { document.title = STORE_NAME; };
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar para Home
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

// ── Pagina Blog List (Todos os Artigos) ───────────────────────────────────────
function PaginaBlogList({ navigate }: { navigate: (path: string) => void }) {
  useEffect(() => {
    document.title = `Blog e Artigos — ${STORE_NAME}`;
    return () => { document.title = STORE_NAME; };
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar para Home
        </button>
        <div className="mb-12">
          <h1 className="font-bebas text-5xl md:text-7xl text-white mb-4">Blog e <span className="sr-gradient-text">Artigos</span></h1>
          <p className="text-zinc-400 text-lg">Guias, curiosidades e listas essenciais para fãs e colecionadores.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {artigos.map(artigo => (
            <motion.button key={artigo.slug} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}
              onClick={() => navigate(`/artigo/${artigo.slug}`)}
              className="text-left flex flex-col rounded-3xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all group cursor-pointer h-full">
              <div className="relative h-56 overflow-hidden">
                <img src={artigo.imagemCapa} alt={artigo.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"/>
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest">
                  {artigo.categoria}
                </span>
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

// ── Página Catálogo (home) ────────────────────────────────────────────────────
function PaginaCatalogo({ navigate }: { navigate: (path: string) => void }) {
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
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group shrink-0">
            <div className="relative w-12 h-12 flex-shrink-0">
              <div className="absolute inset-0 sr-gradient rounded-full opacity-25 blur-lg group-hover:opacity-50 transition-opacity"/>
              <img src={STORE_LOGO} alt={STORE_NAME} className="relative w-full h-full object-contain drop-shadow-[0_0_12px_rgba(230,57,70,0.5)]"
                referrerPolicy="no-referrer" onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
            </div>
            <div>
              <span className="font-bebas text-2xl tracking-widest sr-gradient-text hidden sm:block">{STORE_NAME.toUpperCase()}</span>
            </div>
          </button>
          
          <div className="hidden lg:flex flex-1 justify-center items-center gap-8 text-sm font-medium text-zinc-500">
            {[['#catalogo','Catálogo'],['#colecoes','Coleções'],['#artigos','Artigos'],['#sobre','Sobre'],['#faq','FAQ']].map(([href,label]) => (
              <a key={href} href={href} className="hover:text-white transition-colors relative group whitespace-nowrap">
                {label}<span className="absolute -bottom-1 left-0 w-0 h-px sr-gradient group-hover:w-full transition-all duration-300"/>
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <form onSubmit={e => { e.preventDefault(); if (navSearch) navigate(`/busca?q=${encodeURIComponent(navSearch)}`); }} className="relative hidden md:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-400 transition-colors"/>
              <input type="text" value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="Buscar Discos, Filmes..."
                className="w-48 pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 focus:bg-white/10 lg:focus:w-64 transition-all duration-300"/>
            </form>
            <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
              className="sr-gradient text-white px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-red-900/30 active:scale-95">
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

      <GenreTicker/>

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
          <div>{FAQ.map((f,i)=><FAQItem key={i} q={f.q} a={f.a}/>)}</div>
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

// ── Página Busca ───────────────────────────────────────────────────────────────
function PaginaBusca({ buscaQuery, navigate }: { buscaQuery: string; navigate: (path: string) => void }) {
  const [sort, setSort] = useState('relevance');
  const [pagina, setPagina] = useState(1);
  const { produtos, total, loading, error, limite } = useBuscaPesquisa(buscaQuery, sort, pagina);
  const totalPaginas = Math.ceil(total / limite);

  useEffect(() => {
    document.title = `Busca: ${buscaQuery} — ${STORE_NAME}`;
    setPagina(1);
  }, [buscaQuery]);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar para Home
          </button>
          <h1 className="font-bebas text-5xl md:text-6xl text-white">
            Resultados para <span className="sr-gradient-text">"{buscaQuery}"</span>
          </h1>
          {!loading && <p className="text-zinc-500 text-sm mt-2">{total.toLocaleString('pt-BR')} produtos encontrados</p>}
        </div>

        {/* Filtros de Ordenação */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'relevance', label: 'Mais Relevantes' },
            { id: 'price_asc', label: 'Menor Preço' },
            { id: 'price_desc', label: 'Maior Preço' }
          ].map(opt => (
            <button key={opt.id} onClick={() => { setSort(opt.id); setPagina(1); }}
              className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                sort === opt.id ? 'sr-gradient text-white shadow-lg shadow-red-950/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}>{opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length:10}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : error ? (
          <div className="text-center py-32"><p className="text-zinc-500">Erro ao carregar os resultados.</p></div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-32">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4"/>
            <p className="text-zinc-500">Nenhum produto encontrado na loja oficial para "{buscaQuery}".</p>
          </div>
        ) : (
          <>
            <motion.div key={`${buscaQuery}-${sort}-${pagina}`}
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
    </div>
  );
}

// ── App principal ─────────────────────────────────────────────────────────────
export default function App() {
  const { route, navigate } = useRoute();

  const isProduto = route.startsWith('/produto/');
  const isColecao = route.startsWith('/colecao/');
  const isArtigo  = route.startsWith('/artigo/');
  const isBusca   = route.startsWith('/busca');
  const isColecoesList = route === '/colecoes';
  const isBlogList = route === '/blog';

  const slugProduto = isProduto ? route.replace('/produto/', '') : '';
  const slugColecao = isColecao ? route.replace('/colecao/', '') : '';
  const slugArtigo  = isArtigo  ? route.replace('/artigo/',  '') : '';
  const buscaQuery  = isBusca   ? new URLSearchParams(route.split('?')[1]).get('q') || '' : '';

  const isSecundaria = isProduto || isColecao || isArtigo || isColecoesList || isBlogList || isBusca;

  return (
    <>
      <style>{`
        .font-bebas { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }
        body { font-family: 'DM Sans', system-ui, sans-serif; }
        .sr-gradient { background: linear-gradient(135deg, #e63946 0%, #1d3557 100%); }
        .sr-gradient-text {
          background: linear-gradient(135deg, #e63946 0%, #4895ef 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        @keyframes spin-vinyl { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .spin-vinyl { animation: spin-vinyl 18s linear infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .float { animation: float 6s ease-in-out infinite; }
        ::selection { background:#e63946; color:#fff; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #e63946; border-radius: 3px; }
        .skeleton {
          background: linear-gradient(90deg, #1a1a1a 25%, #252525 50%, #1a1a1a 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {isSecundaria && <NavSecundaria navigate={navigate}/>}

      <AnimatePresence mode="wait">
        {isProduto ? (
          <motion.div key="produto" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaProduto slugComposto={slugProduto} navigate={navigate}/>
          </motion.div>
        ) : isColecao ? (
          <motion.div key="colecao" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaColecao slug={slugColecao} navigate={navigate}/>
          </motion.div>
        ) : isArtigo ? (
          <motion.div key="artigo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaArtigo slug={slugArtigo} navigate={navigate}/>
          </motion.div>
        ) : isColecoesList ? (
          <motion.div key="colecoeslist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaColecoesList navigate={navigate}/>
          </motion.div>
        ) : isBlogList ? (
          <motion.div key="bloglist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaBlogList navigate={navigate}/>
          </motion.div>
        ) : isBusca ? (
          <motion.div key="busca" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaBusca buscaQuery={buscaQuery} navigate={navigate}/>
          </motion.div>
        ) : (
          <motion.div key="catalogo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
            <PaginaCatalogo navigate={navigate}/>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

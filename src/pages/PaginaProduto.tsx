import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, ImageOff, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react';
import { STORE_NAME } from '../config';
import { useProduto, useDescricao } from '../hooks/useProdutos';
import { fmt, disc } from '../utils';

export function PaginaProduto({ slugComposto, navigate }: { slugComposto: string; navigate: (path: string) => void }) {
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
        "sku": produto.id,
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

      // OG dinâmico para compartilhamento no WhatsApp/redes sociais
      const setOG = (prop: string, content: string) => {
        let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement;
        if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el); }
        el.content = content;
      };
      setOG('og:title',       `${produto.titulo} — ${STORE_NAME}`);
      setOG('og:description', `Compre ${produto.titulo} original. Mídia física 100% original, envio seguro.`);
      setOG('og:image',       produto.foto || '');
      setOG('og:url',         produto.link);
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
      <button onClick={() => { if (window.history.length > 2) { window.history.back(); } else { navigate('/#catalogo'); } }} className="flex items-center gap-2 sr-gradient text-white px-6 py-3 rounded-full font-bold">
        <ArrowLeft className="w-4 h-4"/> Voltar ao catálogo
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => { if (window.history.length > 2) { window.history.back(); } else { navigate('/#catalogo'); } }}
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

import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, ImageOff, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { STORE_NAME } from '../config';
import { SEO } from '../components/SEO';
import { useProduto, useDescricao } from '../hooks/useProdutos';
import { fmt, disc } from '../utils';
import { useCarrinho } from '../contexts/CarrinhoContext';

export function PaginaProduto({ slugComposto, navigate }: { slugComposto: string; navigate: (path: string) => void }) {
  const { produto, loading, error } = useProduto(slugComposto);
  const [fotoIdx, setFotoIdx] = useState(0);
  const [adicionado, setAdicionado] = useState(false);
  const fotos = produto?.fotos?.length ? produto.fotos : produto?.foto ? [produto.foto] : [];
  const { descricao, loading: descLoading } = useDescricao(produto?.id || '');
  const { adicionarItem } = useCarrinho();

  const handleAddToCart = () => {
    if (!produto) return;
    adicionarItem(produto);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 2000);
  };

  const handleBuyNow = () => {
    if (!produto) return;
    adicionarItem(produto);
    navigate('/carrinho');
  };

  useEffect(() => {
    if (produto?.titulo) {

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
    }
    return () => { 
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
      <SEO 
        title={produto.titulo} 
        description={`Compre ${produto.titulo} original. Mídia física 100% original, envio seguro.`}
        image={produto.foto}
        url={produto.link}
        type="product"
      />
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
              {/* Badge Dinâmico - 10% OFF em relação ao ML */}
              <span className="absolute top-4 left-4 bg-red-600 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg border border-red-800">
                -10% OFF (Site)
              </span>
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
              <p className="text-zinc-500 text-lg line-through">{fmt(produto.preco / 0.9)} <span className="text-sm">(No Mercado Livre)</span></p>
              <p className="text-4xl font-bold sr-gradient-text">{fmt(produto.preco)}</p>
              <p className="text-green-400 text-sm mt-1">Comprando pelo site você economiza {fmt((produto.preco / 0.9) - produto.preco)} (-10%)</p>
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
            ? <div className="animate-pulse space-y-2 max-w-lg mt-2"><div className="h-4 bg-white/10 rounded w-full"></div><div className="h-4 bg-white/10 rounded w-5/6"></div></div>
            : descricao
              ? <p className="text-zinc-400 text-sm leading-relaxed">{descricao}</p>
              : <p className="text-zinc-400 text-sm leading-relaxed">Mídia física original garantida pelo Sylvio's Records. Um item indispensável para colecionadores e amantes do catálogo clássico, com a procedência e qualidade que plataformas digitais não podem oferecer.</p>
          }
            </div>

            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/4 border border-white/8">
              {[['✅','Produto 100% original'],['📦','Embalagem reforçada para envio seguro'],['🏆','Vendedor Mercado Líder Platinum']].map(([emoji, texto]) => (
                <p key={texto} className="text-sm text-zinc-400">{emoji} {texto}</p>
              ))}
            </div>

            {/* Botões de compra */}
            <div className="flex flex-col gap-3">

              {/* Adicionar ao Carrinho */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                className={`w-full px-8 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 ${
                  adicionado
                    ? 'bg-green-600 text-white'
                    : 'bg-white/8 border border-white/15 text-white hover:bg-white/12'
                }`}
              >
                <ShoppingCart className="w-5 h-5" />
                {adicionado ? '✓ Adicionado ao Carrinho!' : 'Adicionar ao Carrinho'}
              </motion.button>

              {/* Comprar Agora */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBuyNow}
                className="sr-gradient text-white px-8 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-red-950/30"
              >
                ⚡ Comprar Agora pelo Site
              </motion.button>

              {/* Divisor */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-zinc-600 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Fallback ML */}
              <a href={produto.link} target="_blank" rel="noopener noreferrer"
                className="text-zinc-500 hover:text-zinc-300 text-sm flex items-center justify-center gap-2 transition-colors py-2"
              >
                <ExternalLink className="w-4 h-4" />
                Comprar no Mercado Livre
              </a>
            </div>

            <p className="text-zinc-700 text-xs text-center">🔒 Pagamento seguro via Mercado Pago · Pix, Boleto e Cartão</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Disc } from 'lucide-react';
import type { Produto } from '../types';
import { slugify, fmt, disc } from '../utils';
import { FavCtx } from '../contexts/FavoritosContext';
import { useCarrinho } from '../contexts/CarrinhoContext';

export function ProdutoCard({ p, navigate }: { key?: React.Key; p: Produto; navigate: (path: string) => void }) {
  const [imgOk,     setImgOk]     = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [adicionado, setAdicionado] = useState(false);
  const { isFav, toggle } = React.useContext(FavCtx);
  const { adicionarItem } = useCarrinho();
  const fav = isFav(p.id);
  const urlProduto = `/produto/${p.id}-${slugify(p.titulo)}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    adicionarItem(p);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1500);
  };
  return (
    <div onClick={() => navigate(urlProduto)}
      className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900 border border-white/6 hover:border-red-500/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-950/30 duration-300 cursor-pointer relative transform-gpu will-change-transform">
      <div className="relative aspect-square bg-zinc-800 overflow-hidden">
        {!imgLoaded && <div className="absolute inset-0 skeleton"/>}
        {imgOk && p.foto
          ? <img src={p.foto} alt={p.titulo} loading="lazy"
              className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgOk(false); setImgLoaded(true); }}/>
          : <div className="w-full h-full flex items-center justify-center"><Disc className="w-12 h-12 text-zinc-700"/></div>
        }
        {/* Badge OFF dinâmico baseado no calulo + 10% ML */}
        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow border border-red-800/50">
          -10% OFF (Site)
        </span>
        {p.condicao === 'new' && (
          <span className="absolute top-2 right-2 bg-blue-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NOVO</span>
        )}
        <button onClick={e => { e.stopPropagation(); toggle(p.id); }}
          className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
            fav ? 'bg-red-500 text-white' : 'bg-black/50 text-zinc-400 hover:text-red-400'
          }`}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[11px] text-zinc-400 leading-tight line-clamp-2 min-h-[30px] mb-2 flex-1">{p.titulo}</p>
        
        {/* Mostra preço original (calculado +10% do ML) riscado e preço atual do site em destaque */}
        <p className="text-zinc-600 text-[11px] line-through">{fmt(p.preco / 0.9)} <span className="text-[9px]">(ML)</span></p>
        <p className="text-white font-bold text-sm">{fmt(p.preco)}</p>
        
        {p.vendidos > 0 && <p className="text-zinc-600 text-[10px] mt-1">{p.vendidos} vendidos</p>}

        {/* Botão Adicionar ao Carrinho */}
        <button
          onClick={handleAddToCart}
          className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            adicionado
              ? 'bg-green-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-red-700 hover:text-white'
          }`}
        >
          {adicionado ? '✓ Adicionado!' : '🛒 Adicionar'}
        </button>
      </div>
    </div>
  );
}

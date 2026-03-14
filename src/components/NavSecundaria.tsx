import React, { useState } from 'react';
import { Search, ExternalLink, Heart, ShoppingCart } from 'lucide-react';
import { STORE_NAME, STORE_LINK, STORE_LOGO } from '../config';
import { FavCtx } from '../contexts/FavoritosContext';
import { CarrinhoCtx } from '../contexts/CarrinhoContext';

export function NavSecundaria({ navigate }: { navigate: (path: string) => void }) {
  const [buscaInput, setBuscaInput] = useState('');
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#080808]/92 backdrop-blur-xl border-b border-white/6 py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-3 group shrink-0">
          <div className="relative w-10 h-10 shrink-0">
            <div className="absolute inset-0 sr-gradient rounded-full opacity-25 blur-lg"/>
            <img src={STORE_LOGO} alt={STORE_NAME} className="relative w-full h-full object-contain cursor-pointer" referrerPolicy="no-referrer"
              onError={e=>{(e.currentTarget as HTMLImageElement).style.display='none'}}/>
          </div>
          <span className="hidden sm:block font-bebas text-xl tracking-widest sr-gradient-text">{STORE_NAME.toUpperCase()}</span>
        </button>
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"/>
          <form onSubmit={e => { e.preventDefault(); if (buscaInput) navigate(`/busca?q=${encodeURIComponent(buscaInput)}`); }}>
            <input type="text" value={buscaInput} onChange={e => setBuscaInput(e.target.value)} placeholder="Pesquisar itens..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"/>
          </form>
        </div>
        <button onClick={() => navigate('/favoritos')} className="relative shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all">
          <Heart className="w-4 h-4 text-zinc-400"/>
          {React.useContext(FavCtx).favoritos.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {React.useContext(FavCtx).favoritos.length}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/carrinho')} className="relative shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all">
          <ShoppingCart className="w-4 h-4 text-zinc-400"/>
          {React.useContext(CarrinhoCtx).itens.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {React.useContext(CarrinhoCtx).itens.reduce((acc, item) => acc + item.quantidade, 0)}
            </span>
          )}
        </button>
        <button onClick={() => navigate('/contato')} className="shrink-0 text-zinc-400 hover:text-white transition-colors flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5" title="Central de Atendimento / Dúvidas">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        </button>
        <a href={STORE_LINK} target="_blank" rel="noopener noreferrer"
          className="shrink-0 sr-gradient text-white px-3 py-2 sm:px-4 rounded-full text-sm font-bold flex items-center gap-1.5 hover:opacity-90">
          <span className="hidden sm:inline">Mercado Livre</span> <ExternalLink className="w-4 h-4"/>
        </a>
      </div>
    </nav>
  );
}

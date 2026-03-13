import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCarrinho } from '../contexts/CarrinhoContext';
import { CarrinhoCalculadorFrete } from '../components/CarrinhoCalculadorFrete';
import { fmt } from '../utils';
import { NavSecundaria } from '../components/NavSecundaria';

export function PaginaCarrinho({ navigate, setFreteCheckout }: { navigate: (r: string) => void, setFreteCheckout: (f: { nome: string; preco: number } | null) => void }) {
  const { itens, total, totalItens, removerItem, alterarQuantidade, limparCarrinho } = useCarrinho();
  const [freteEscolhido, setFreteEscolhido] = useState<{ nome: string; preco: number } | null>(null);

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <NavSecundaria navigate={navigate} />
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-zinc-500">
          <span className="text-7xl mb-4">🛒</span>
          <h2 className="text-2xl font-bold text-white mb-2">Carrinho Vazio</h2>
          <p className="text-zinc-500 mb-6">Adicione discos incríveis ao seu carrinho para continuar.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
          >
            ← Explorar o Catálogo
          </motion.button>
        </div>
      </div>
    );
  }

  const totalComFrete = total + (freteEscolhido?.preco || 0);

  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Seu Carrinho</h1>
          <button
            onClick={limparCarrinho}
            className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
          >
            Limpar carrinho
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Itens */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {itens.map(item => (
                <motion.div
                  key={item.produto.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <img
                    src={item.produto.foto}
                    alt={item.produto.titulo}
                    className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                    onClick={() => navigate(`/produto/${item.produto.id}`)}
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white font-medium leading-tight cursor-pointer hover:text-red-300 transition-colors line-clamp-2"
                      onClick={() => navigate(`/produto/${item.produto.id}`)}
                    >
                      {item.produto.titulo}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1 capitalize">{item.produto.condicao}</p>
                    <p className="text-red-400 font-bold text-base mt-2">
                      {fmt(item.produto.preco * item.quantidade)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => removerItem(item.produto.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                      >−</button>
                      <span className="text-white font-bold w-4 text-center">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
                      >+</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Resumo do Pedido */}
          <div className="space-y-4">
            {/* Calculador de Frete */}
            <CarrinhoCalculadorFrete
              quantidade={totalItens}
              onFreteEscolhido={setFreteEscolhido}
              freteEscolhido={freteEscolhido}
            />

            {/* Totais */}
            <div
              className="p-5 rounded-xl space-y-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-white">{fmt(total)}</span>
              </div>
              {freteEscolhido && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">{freteEscolhido.nome}</span>
                  <span className="text-white">{fmt(freteEscolhido.preco)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-red-400 text-xl">{fmt(totalComFrete)}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFreteCheckout(freteEscolhido);
                  navigate('/checkout');
                }}
                disabled={!freteEscolhido}
                className="w-full py-3 rounded-lg font-bold text-white text-sm mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
              >
                {freteEscolhido ? 'Prosseguir para Pagamento →' : 'Selecione o frete para continuar'}
              </motion.button>

              <p className="text-zinc-600 text-xs text-center">
                🔒 Pagamento 100% seguro via Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

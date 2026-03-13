import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCarrinho } from '../contexts/CarrinhoContext';
import { fmt } from '../utils';

export function CarrinhoDrawer({ navigate }: { navigate: (r: string) => void }) {
  const { itens, total, totalItens, isAberto, fecharCarrinho, removerItem, alterarQuantidade } = useCarrinho();

  return (
    <AnimatePresence>
      {isAberto && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            onClick={fecharCarrinho}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col"
            style={{
              background: 'linear-gradient(135deg, #0f0f0f 0%, #1a0a0a 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.4rem' }}>🛒</span>
                <span className="font-bold text-white text-lg">Seu Carrinho</span>
                {totalItens > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItens}
                  </span>
                )}
              </div>
              <button
                onClick={fecharCarrinho}
                className="text-zinc-400 hover:text-white transition-colors text-2xl leading-none"
                aria-label="Fechar carrinho"
              >
                ×
              </button>
            </div>

            {/* Itens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {itens.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-48 text-zinc-500"
                  >
                    <span className="text-5xl mb-3">🎵</span>
                    <p className="text-sm">Seu carrinho está vazio</p>
                    <button
                      onClick={fecharCarrinho}
                      className="mt-4 text-red-400 text-sm hover:text-red-300 underline"
                    >
                      Continuar comprando
                    </button>
                  </motion.div>
                ) : (
                  itens.map(item => (
                    <motion.div
                      key={item.produto.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 50 }}
                      className="flex gap-3 p-3 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <img
                        src={item.produto.foto}
                        alt={item.produto.titulo}
                        className="w-14 h-14 object-cover rounded"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium leading-tight line-clamp-2">
                          {item.produto.titulo}
                        </p>
                        <p className="text-red-400 font-bold text-sm mt-1">
                          {fmt(item.produto.preco * item.quantidade)}
                        </p>

                        {/* Controle de quantidade */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                            className="w-6 h-6 rounded bg-zinc-800 text-white text-sm flex items-center justify-center hover:bg-zinc-700"
                          >−</button>
                          <span className="text-white text-sm w-4 text-center">{item.quantidade}</span>
                          <button
                            onClick={() => alterarQuantidade(item.produto.id, item.quantidade + 1)}
                            className="w-6 h-6 rounded bg-zinc-800 text-white text-sm flex items-center justify-center hover:bg-zinc-700"
                          >+</button>
                        </div>
                      </div>
                      <button
                        onClick={() => removerItem(item.produto.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors text-lg self-start mt-1"
                        aria-label="Remover item"
                      >
                        🗑
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer com Total e Botão de Checkout */}
            {itens.length > 0 && (
              <div className="p-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 text-sm">Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
                  <span className="text-white font-bold text-lg">{fmt(total)}</span>
                </div>
                <p className="text-zinc-500 text-xs">Frete calculado no checkout</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { fecharCarrinho(); navigate('/carrinho'); }}
                  className="w-full py-3 rounded-lg font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
                >
                  Finalizar Pedido →
                </motion.button>
                <button
                  onClick={fecharCarrinho}
                  className="w-full py-2 text-zinc-400 text-sm hover:text-white transition-colors"
                >
                  Continuar comprando
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

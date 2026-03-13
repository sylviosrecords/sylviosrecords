import React from 'react';
import { motion } from 'motion/react';
import { NavSecundaria } from '../components/NavSecundaria';

export function PaginaPedidoSucesso({ navigate }: { navigate: (r: string) => void }) {
  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-7xl mb-6"
        >
          🎉
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-3"
        >
          Pedido Confirmado!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-zinc-400 max-w-md mb-2"
        >
          Seu pagamento foi aprovado. Em breve você receberá um e-mail com os detalhes do pedido e o código de rastreio assim que enviarmos.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-600 text-sm mb-8"
        >
          Obrigado por comprar na Sylvio's Records! 🎵
        </motion.p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
        >
          ← Continuar Comprando
        </motion.button>
      </div>
    </div>
  );
}

export function PaginaPedidoFalha({ navigate }: { navigate: (r: string) => void }) {
  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="text-7xl mb-6">😔</div>
        <h1 className="text-3xl font-bold text-white mb-3">Pagamento não Concluído</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Não conseguimos processar seu pagamento. Nenhuma cobrança foi realizada. Tente novamente ou escolha outra forma de pagamento.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/checkout')}
            className="px-6 py-3 rounded-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
          >
            Tentar Novamente
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/carrinho')}
            className="px-6 py-3 rounded-lg font-bold text-zinc-400 border border-zinc-700 hover:border-zinc-500"
          >
            ← Voltar ao Carrinho
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export function PaginaPedidoPendente({ navigate }: { navigate: (r: string) => void }) {
  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="text-7xl mb-6">⏳</div>
        <h1 className="text-3xl font-bold text-white mb-3">Pagamento Pendente</h1>
        <p className="text-zinc-400 max-w-md mb-8">
          Seu pedido foi recebido! Se você pagou via boleto, o pagamento pode levar até 2 dias úteis para ser confirmado. Após isso, enviaremos seu disco automaticamente.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-lg font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
        >
          ← Voltar ao Início
        </motion.button>
      </div>
    </div>
  );
}

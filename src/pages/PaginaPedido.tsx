import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { NavSecundaria } from '../components/NavSecundaria';
import { buscarPedido, type PedidoDB } from '../lib/supabase';
import { fmt } from '../utils';

const STATUS_INFO: Record<string, { label: string; emoji: string; cor: string; descricao: string }> = {
  pendente: {
    label: 'Aguardando Pagamento',
    emoji: '⏳',
    cor: '#f59e0b',
    descricao: 'Aguardando a confirmação do seu pagamento.',
  },
  pago: {
    label: 'Pagamento Aprovado',
    emoji: '✅',
    cor: '#22c55e',
    descricao: 'Pagamento confirmado! Estamos preparando seu disco para envio.',
  },
  enviado: {
    label: 'Enviado',
    emoji: '📦',
    cor: '#3b82f6',
    descricao: 'Seu pedido foi despachado e está a caminho!',
  },
  entregue: {
    label: 'Entregue',
    emoji: '🎉',
    cor: '#8b5cf6',
    descricao: 'Pedido entregue. Aproveite sua música!',
  },
  cancelado: {
    label: 'Cancelado',
    emoji: '❌',
    cor: '#ef4444',
    descricao: 'Este pedido foi cancelado.',
  },
};

const PASSOS = ['pendente', 'pago', 'enviado', 'entregue'];

export function PaginaPedido({ pedidoId, navigate }: { pedidoId: string; navigate: (r: string) => void }) {
  const [pedido, setPedido] = useState<PedidoDB | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  useEffect(() => {
    if (!pedidoId) return;
    setCarregando(true);
    buscarPedido(pedidoId)
      .then(p => {
        if (!p) setNaoEncontrado(true);
        else setPedido(p);
      })
      .finally(() => setCarregando(false));
  }, [pedidoId]);

  const stepIndex = pedido ? PASSOS.indexOf(pedido.status) : -1;
  const statusInfo = pedido ? STATUS_INFO[pedido.status] : null;

  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        {carregando && (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        {naoEncontrado && !carregando && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Pedido não encontrado</h2>
            <p className="text-zinc-500 mb-6">Verifique o número do pedido e tente novamente.</p>
            <button onClick={() => navigate('/')} className="text-red-400 underline text-sm">
              Voltar ao início
            </button>
          </div>
        )}

        {pedido && statusInfo && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Header do pedido */}
            <div className="text-center mb-2">
              <span className="text-5xl">{statusInfo.emoji}</span>
              <h1 className="text-2xl font-bold text-white mt-3">Pedido {pedido.id}</h1>
              <p style={{ color: statusInfo.cor }} className="font-semibold mt-1">{statusInfo.label}</p>
              <p className="text-zinc-500 text-sm mt-1">{statusInfo.descricao}</p>
            </div>

            {/* Barra de progresso */}
            {pedido.status !== 'cancelado' && (
              <div className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center">
                  {PASSOS.map((passo, idx) => {
                    const info = STATUS_INFO[passo];
                    const ativo = idx <= stepIndex;
                    const atual = idx === stepIndex;
                    return (
                      <React.Fragment key={passo}>
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${atual ? 'ring-2 ring-offset-2 ring-offset-zinc-900' : ''}`}
                            style={{
                              background: ativo ? statusInfo.cor : '#2a2a2a',
                              color: ativo ? '#fff' : '#555',
                              ringColor: statusInfo.cor,
                            }}
                          >
                            {ativo ? info.emoji : idx + 1}
                          </div>
                          <p className="text-[10px] mt-1 text-center" style={{ color: ativo ? '#aaa' : '#444', maxWidth: 60 }}>
                            {info.label.split(' ')[0]}
                          </p>
                        </div>
                        {idx < PASSOS.length - 1 && (
                          <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: idx < stepIndex ? statusInfo.cor : '#2a2a2a' }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Código de rastreio */}
            {pedido.codigo_rastreio && (
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Código de Rastreio</p>
                <p className="text-white font-mono text-xl font-bold">{pedido.codigo_rastreio}</p>
                <p className="text-zinc-500 text-xs mt-1">{pedido.transportadora}</p>
                <a
                  href={`https://www.linketrack.com/track/${pedido.codigo_rastreio}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 text-xs underline mt-2 inline-block"
                >
                  Rastrear no Correios →
                </a>
              </div>
            )}

            {/* Itens */}
            <div className="p-5 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-white font-semibold text-sm">🎵 Itens do Pedido</h3>
              {pedido.itens.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  {item.foto && <img src={item.foto} alt={item.titulo} className="w-10 h-10 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-300 text-sm truncate">{item.titulo}</p>
                    <p className="text-zinc-600 text-xs">× {item.quantidade}</p>
                  </div>
                  <p className="text-white text-sm font-medium">{fmt(item.preco * item.quantidade)}</p>
                </div>
              ))}
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-zinc-500 text-sm">Total</span>
                <span className="text-red-400 font-bold">{fmt(pedido.total)}</span>
              </div>
            </div>

            {/* Endereço de entrega */}
            {pedido.logradouro && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="text-white font-semibold text-sm mb-2">📍 Endereço de Entrega</h3>
                <p className="text-zinc-400 text-sm">
                  {pedido.logradouro}, {pedido.numero}{pedido.complemento ? ` — ${pedido.complemento}` : ''}
                </p>
                <p className="text-zinc-400 text-sm">{pedido.bairro} · {pedido.cidade}/{pedido.estado} · CEP {pedido.cep}</p>
              </div>
            )}

            <p className="text-zinc-600 text-xs text-center">
              Pedido realizado em {new Date(pedido.criado_em).toLocaleString('pt-BR')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

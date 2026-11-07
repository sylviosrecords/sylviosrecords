import React, { useEffect, useState } from 'react';

type EstadoPedido = 'carregando' | 'pendente' | 'pago' | 'cancelado' | 'indisponivel';

export function estadoDoPedido(status: unknown): EstadoPedido {
  if (status === 'pago' || status === 'enviado' || status === 'entregue') return 'pago';
  if (status === 'pendente') return 'pendente';
  if (status === 'cancelado') return 'cancelado';
  return 'indisponivel';
}

function RetornoPagamento({ navigate, tipo }: { navigate: (r: string) => void; tipo: 'sucesso' | 'falha' | 'pendente' }) {
  const params = new URLSearchParams(window.location.search);
  const pedidoId = params.get('pedido') || params.get('external_reference');
  const [estado, setEstado] = useState<EstadoPedido>(pedidoId ? 'carregando' : 'indisponivel');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!pedidoId) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let consultas = 0;
    const verificar = async () => {
      try {
        const resposta = await fetch(`/api/pedido?id=${encodeURIComponent(pedidoId)}`, { cache: 'no-store' });
        if (!resposta.ok) throw new Error('Pedido indisponível');
        const pedido = await resposta.json() as { status?: unknown };
        if (!ativo) return;
        const novoEstado = estadoDoPedido(pedido.status);
        setEstado(novoEstado);
        if (novoEstado === 'pendente' && ++consultas < 6) timer = setTimeout(verificar, 5000);
      } catch {
        if (ativo) setEstado('indisponivel');
      }
    };
    setEstado('carregando');
    void verificar();
    return () => { ativo = false; if (timer) clearTimeout(timer); };
  }, [pedidoId, tentativa]);

  const confirmado = estado === 'pago';
  const titulo = confirmado ? 'Pagamento confirmado!' : estado === 'cancelado' ? 'Pedido cancelado' :
    estado === 'carregando' ? 'Verificando seu pagamento' :
    estado === 'pendente' ? 'Pagamento em verificação' :
    tipo === 'falha' ? 'Pagamento não confirmado' : 'Não foi possível confirmar o pagamento';
  const mensagem = confirmado ? 'Seu pagamento foi confirmado. Acompanhe o preparo do pedido pelo botão abaixo.' :
    estado === 'cancelado' ? 'Este pedido está cancelado. Se precisar de ajuda, entre em contato com a loja.' :
    estado === 'carregando' ? 'Estamos consultando o status do seu pedido. Aguarde um momento.' :
    estado === 'pendente' ? 'Seu pedido está aguardando a confirmação do pagamento. Você pode acompanhar o status ou consultar novamente em alguns instantes.' :
    'Não foi possível verificar o status agora. Antes de tentar pagar novamente, confira seu pedido ou entre em contato com a loja.';

  return (
    <div className="min-h-screen bg-[#080808]">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 pt-20" aria-live="polite">
        <div className="text-7xl mb-6" aria-hidden="true">{confirmado ? '🎉' : estado === 'cancelado' ? '😔' : '⏳'}</div>
        <h1 className="text-3xl font-bold text-white mb-3">{titulo}</h1>
        <p className="text-zinc-400 max-w-md mb-2">{mensagem}</p>
        {pedidoId && (
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 mb-6 w-full max-w-sm">
            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Número do Pedido</p>
            <p className="text-white font-mono font-bold text-sm break-all">{pedidoId}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          {pedidoId && <button onClick={() => navigate(`/pedido/${encodeURIComponent(pedidoId)}`)} className="px-6 py-3 rounded-lg font-bold text-white" style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}>📦 Acompanhar pedido</button>}
          {pedidoId && !confirmado && estado !== 'cancelado' && <button onClick={() => setTentativa(n => n + 1)} className="px-6 py-3 rounded-lg font-bold text-zinc-300 border border-zinc-700">Consultar novamente</button>}
          {tipo === 'falha' && !confirmado && <button onClick={() => navigate('/carrinho')} className="px-6 py-3 rounded-lg font-bold text-zinc-300 border border-zinc-700">Voltar ao carrinho</button>}
          <button onClick={() => navigate('/contato')} className="px-6 py-3 rounded-lg font-bold text-zinc-300 border border-zinc-700">Preciso de ajuda</button>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-lg font-bold text-zinc-400 border border-zinc-700">Continuar comprando</button>
        </div>
      </div>
    </div>
  );
}

export function PaginaPedidoSucesso({ navigate }: { navigate: (r: string) => void }) { return <RetornoPagamento navigate={navigate} tipo="sucesso" />; }
export function PaginaPedidoFalha({ navigate }: { navigate: (r: string) => void }) { return <RetornoPagamento navigate={navigate} tipo="falha" />; }
export function PaginaPedidoPendente({ navigate }: { navigate: (r: string) => void }) { return <RetornoPagamento navigate={navigate} tipo="pendente" />; }

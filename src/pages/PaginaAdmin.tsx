import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Package, CheckCircle, Truck, RefreshCw, X, Settings, Info } from 'lucide-react';
import { fmt } from '../utils';

// Tipo Simplificado do Pedido no db
interface AdminPedido {
  id: string;
  status: string;
  cliente_nome: string;
  cliente_email: string;
  total: number;
  criado_em: string;
  codigo_rastreio?: string;
}

export function PaginaAdmin() {
  const [senha, setSenha] = useState('');
  const [logado, setLogado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pedidos, setPedidos] = useState<AdminPedido[]>([]);
  
  // Modal de Etiqueta
  const [pedidoFoco, setPedidoFoco] = useState<AdminPedido | null>(null);
  const [nfeKey, setNfeKey] = useState('');
  const [gerandoMsg, setGerandoMsg] = useState('');

  // Configurador de Desconto
  const [descontoAtual, setDescontoAtual] = useState(10);
  const [novoDesconto, setNovoDesconto] = useState(10);
  const [descontoMsg, setDescontoMsg] = useState('');

  // 1. Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const resp = await fetch('/api/admin?action=pedidos', {
        headers: { Authorization: `Bearer ${senha}` }
      });
      if (!resp.ok) throw new Error('Senha incorreta');
      const data = await resp.json();
      setPedidos(data.pedidos || []);
      // Buscar desconto atual
      const cfgResp = await fetch('/api/admin?action=config', {
        headers: { Authorization: `Bearer ${senha}` }
      });
      if (cfgResp.ok) { const cfg = await cfgResp.json(); setDescontoAtual(cfg.desconto ?? 10); setNovoDesconto(cfg.desconto ?? 10); }
      setLogado(true);
    } catch {
      setErro('Acesso negado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // 1.1 Refresh manual dos pedidos
  const carregarPedidos = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin?action=pedidos', {
        headers: { Authorization: `Bearer ${senha}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setPedidos(data.pedidos || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Gerar Etiqueta
  const handleGerarEtiqueta = async () => {
    if (!pedidoFoco) return;
    setGerandoMsg('Preparando envio no Melhor Envio...');
    setErro('');
    
    try {
      const resp = await fetch('/api/admin?action=etiqueta', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${senha}` 
        },
        body: JSON.stringify({ 
          pedidoId: pedidoFoco.id, 
          nfe_key: nfeKey.trim() || undefined 
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.erro || 'Falha ao gerar');
      
      setGerandoMsg('Sucesso! Etiqueta gerada e paga.');
      setTimeout(() => {
        setPedidoFoco(null);
        setGerandoMsg('');
        setNfeKey('');
        carregarPedidos(); // Atualiza a lista pra mostrar o badge azul
      }, 2000);

    } catch (err: any) {
      setGerandoMsg('');
      setErro(err.message);
    }
  };

  // Tela de Login (Gatekeeper)
  if (!logado) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">Área Restrita</h1>
            <p className="text-zinc-500 text-sm text-center mt-1">Gestão de Pedidos e Envios</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="Senha Master"
                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            {erro && <p className="text-red-400 text-xs text-center">{erro}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Tela do Painel Principal
  return (
    <div className="min-h-screen bg-[#080808] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-red-500" /> Painel de Pedidos
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gerencie suas vendas e imprima etiquetas.</p>
          </div>
          <button onClick={carregarPedidos} disabled={loading} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Status / Rastreio</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm text-zinc-300 divide-y divide-white/5">
                {pedidos.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 whitespace-nowrap text-zinc-500">{new Date(p.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}</td>
                    <td className="p-4">
                      <div className="text-white font-medium">{p.cliente_nome}</div>
                      <div className="text-zinc-500 text-xs">{p.cliente_email}</div>
                    </td>
                    <td className="p-4">
                      {p.status === 'enviado' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-md text-xs font-bold mb-1"><Truck className="w-3 h-3"/> ENVIADO</span>
                          <div className="text-zinc-500 text-[10px] font-mono">{p.codigo_rastreio}</div>
                        </div>
                      ) : p.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded-md text-xs font-bold"><CheckCircle className="w-3 h-3"/> PAGO (Imprimir)</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md text-xs font-bold uppercase">{p.status}</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-white">{fmt(p.total)}</td>
                    <td className="p-4 text-right">
                      {p.status === 'pago' && (
                        <button onClick={() => setPedidoFoco(p)} className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          🚛 Gerar Etiqueta
                        </button>
                      )}
                      {p.status === 'enviado' && (
                        <a href="https://melhorenvio.com.br/painel/envios/aguardando-impressao" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs font-bold underline">
                          Imprimir no M.E.
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {pedidos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-zinc-500">Nenhum pedido encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configurador de Desconto */}
        <div className="mt-8 bg-zinc-900 border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-5">
            <Settings className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-bold text-white">Configurador de Desconto</h2>
            <span className="ml-auto text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">Atual: <strong className="text-white">{descontoAtual}% OFF</strong></span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0} max={50} step={1}
                value={novoDesconto}
                onChange={e => setNovoDesconto(Number(e.target.value))}
                className="flex-1 accent-red-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0} max={50}
                  value={novoDesconto}
                  onChange={e => setNovoDesconto(Math.min(50, Math.max(0, Number(e.target.value))))}
                  className="w-16 bg-black/50 border border-zinc-700 rounded-lg px-2 py-1.5 text-white text-center font-bold focus:outline-none focus:border-red-500"
                />
                <span className="text-zinc-400 text-sm">%</span>
              </div>
            </div>

            {novoDesconto !== descontoAtual && (
              <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 text-sm font-bold mb-1">Para aplicar o desconto de {novoDesconto}%:</p>
                  <ol className="text-amber-200/70 text-xs space-y-1 leading-relaxed list-decimal pl-4">
                    <li>Acesse <strong>vercel.com</strong> → Settings → Environment Variables</li>
                    <li>Crie ou atualize a variável: <code className="bg-black/30 px-1 rounded">DESCONTO_SITE</code> = <code className="bg-black/30 px-1 rounded font-bold">{novoDesconto}</code></li>
                    <li>Clique em <strong>Redeploy</strong> na aba Deployments</li>
                  </ol>
                </div>
              </div>
            )}

            {novoDesconto === descontoAtual && (
              <p className="text-green-500 text-sm font-medium">✅ O site está com {descontoAtual}% de desconto ativo.</p>
            )}

            {novoDesconto === 0 && (
              <p className="text-zinc-400 text-xs">💡 Desconto 0% = os badges de desconto e preços riscados somem automaticamente do site.</p>
            )}

            {descontoMsg && <p className="text-green-400 text-sm font-bold">{descontoMsg}</p>}
          </div>
        </div>
      </div>

      {/* Modal de Gerar Etiqueta */}
      {pedidoFoco && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-2xl p-6 relative">
            <button onClick={() => setPedidoFoco(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h2 className="text-xl font-bold text-white mb-1">Emitir Etiqueta de Envio</h2>
            <p className="text-zinc-400 text-sm mb-6">Pedido de: <strong className="text-white">{pedidoFoco.cliente_nome}</strong></p>

            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                <h3 className="text-blue-400 font-bold text-sm mb-1">Como você quer enviar?</h3>
                <p className="text-blue-200/70 text-xs leading-relaxed">
                  Deixe o campo abaixo VAZIO para gerarmos uma <strong>Declaração de Conteúdo Automática</strong> (ideal para MEI). Se for usar Nota Fiscal, cole a Chave de 44 dígitos.
                </p>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs mb-1 font-bold">Chave NF-e (Opcional - 44 dígitos)</label>
                <input 
                  type="text"
                  maxLength={44}
                  value={nfeKey}
                  onChange={e => setNfeKey(e.target.value.replace(/\D/g, ''))}
                  placeholder="Deixe em branco para Declaração"
                  className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 font-mono text-center tracking-widest"
                />
              </div>

              {erro && <p className="text-red-400 text-xs text-center border border-red-500/30 bg-red-900/10 p-2 rounded-lg">{erro}</p>}
              {gerandoMsg && <p className="text-green-400 text-xs text-center font-bold animate-pulse">{gerandoMsg}</p>}

              <button
                onClick={handleGerarEtiqueta}
                disabled={!!gerandoMsg}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {gerandoMsg ? 'Processando...' : '💰 Pagar e Gerar no Melhor Envio'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

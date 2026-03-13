import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useCarrinho } from '../contexts/CarrinhoContext';
import { NavSecundaria } from '../components/NavSecundaria';
import { fmt } from '../utils';
import { DadosComprador } from '../types';

// Formata CPF
function formatCPF(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Formata telefone
function formatTel(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

// Formata CEP
function formatCEP(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 8);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
}

export function PaginaCheckout({ navigate, freteNome, fretePreco }: {
  navigate: (r: string) => void;
  freteNome?: string;
  fretePreco?: number;
}) {
  const { itens, total, limparCarrinho } = useCarrinho();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [dados, setDados] = useState<DadosComprador>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  });

  const update = (campo: keyof Omit<DadosComprador, 'endereco'>, valor: string) =>
    setDados(d => ({ ...d, [campo]: valor }));

  const updateEnd = (campo: keyof DadosComprador['endereco'], valor: string) =>
    setDados(d => ({ ...d, endereco: { ...d.endereco, [campo]: valor } }));

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await resp.json() as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean };
      if (!data.erro) {
        setDados(d => ({
          ...d,
          endereco: {
            ...d.endereco,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            estado: data.uf || '',
          },
        }));
      }
    } catch { /* silencioso */ }
    finally { setBuscandoCep(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freteNome) {
      setErro('Volte ao carrinho e escolha uma opção de frete.');
      return;
    }
    setCarregando(true);
    setErro('');

    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map(i => ({
            id: i.produto.id,
            titulo: i.produto.titulo,
            preco: i.produto.preco,
            quantidade: i.quantidade,
            foto: i.produto.foto,
          })),
          comprador: dados,
          frete: { nome: freteNome, preco: fretePreco || 0 },
        }),
      });

      const data = await resp.json() as { checkoutUrl?: string; erro?: string };
      if (data.erro) throw new Error(data.erro);
      if (data.checkoutUrl) {
        limparCarrinho();
        window.location.href = data.checkoutUrl; // Redireciona pro MP
      }
    } catch (err) {
      setErro((err as Error).message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSimular = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!freteNome) { setErro('Escolha um frete primeiro.'); return; }
    setCarregando(true);
    setErro('');
    
    try {
      const resp = await fetch('/api/checkout-simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: itens.map(i => ({
            id: i.produto.id,
            titulo: i.produto.titulo,
            preco: i.produto.preco,
            quantidade: i.quantidade,
            foto: i.produto.foto,
          })),
          comprador: dados,
          frete: { nome: freteNome, preco: fretePreco || 0 },
        }),
      });

      const data = await resp.json() as { checkoutUrl?: string; erro?: string };
      if (data.erro) throw new Error(data.erro);
      if (data.checkoutUrl) {
        limparCarrinho();
        navigate(data.checkoutUrl); // Vai pro sucesso
      }
    } catch (err) {
      setErro((err as Error).message || 'Erro ao simular');
    } finally {
      setCarregando(false);
    }
  };


  const InputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: 'white',
    padding: '0.625rem 0.75rem',
    width: '100%',
    fontSize: '0.875rem',
    outline: 'none',
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-zinc-400 text-xs mb-1">{children}</label>
  );

  const totalComFrete = total + (fretePreco || 0);

  return (
    <div className="min-h-screen bg-[#080808]">
      <NavSecundaria navigate={navigate} />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/carrinho')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-white">Finalizar Pedido</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Dados Pessoais */}
          <section className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-white font-semibold flex items-center gap-2">👤 Dados Pessoais</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome Completo *</Label>
                <input required style={InputStyle} value={dados.nome} onChange={e => update('nome', e.target.value)} placeholder="Rafael Silveira" />
              </div>
              <div>
                <Label>E-mail *</Label>
                <input required type="email" style={InputStyle} value={dados.email} onChange={e => update('email', e.target.value)} placeholder="rafael@email.com" />
              </div>
              <div>
                <Label>CPF *</Label>
                <input required style={InputStyle} value={dados.cpf} onChange={e => update('cpf', formatCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label>Telefone *</Label>
                <input required style={InputStyle} value={dados.telefone} onChange={e => update('telefone', formatTel(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </section>

          {/* Endereço de Entrega */}
          <section className="p-5 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-white font-semibold flex items-center gap-2">📦 Endereço de Entrega</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>CEP *</Label>
                <input
                  required style={InputStyle}
                  value={dados.endereco.cep}
                  onChange={e => { const v = formatCEP(e.target.value); updateEnd('cep', v); if (v.replace(/\D/g,'').length === 8) buscarCep(v); }}
                  placeholder="00000-000"
                />
                {buscandoCep && <p className="text-zinc-500 text-xs mt-1">Buscando endereço...</p>}
              </div>
              <div className="sm:col-span-2">
                <Label>Logradouro *</Label>
                <input required style={InputStyle} value={dados.endereco.logradouro} onChange={e => updateEnd('logradouro', e.target.value)} placeholder="Rua dos Discos" />
              </div>
              <div>
                <Label>Número *</Label>
                <input required style={InputStyle} value={dados.endereco.numero} onChange={e => updateEnd('numero', e.target.value)} placeholder="123" />
              </div>
              <div className="sm:col-span-2">
                <Label>Complemento</Label>
                <input style={InputStyle} value={dados.endereco.complemento || ''} onChange={e => updateEnd('complemento', e.target.value)} placeholder="Apto 4, Bloco B" />
              </div>
              <div>
                <Label>Bairro *</Label>
                <input required style={InputStyle} value={dados.endereco.bairro} onChange={e => updateEnd('bairro', e.target.value)} placeholder="Centro" />
              </div>
              <div>
                <Label>Cidade *</Label>
                <input required style={InputStyle} value={dados.endereco.cidade} onChange={e => updateEnd('cidade', e.target.value)} placeholder="São Paulo" />
              </div>
              <div>
                <Label>UF *</Label>
                <input required style={InputStyle} maxLength={2} value={dados.endereco.estado} onChange={e => updateEnd('estado', e.target.value.toUpperCase())} placeholder="SP" />
              </div>
            </div>
          </section>

          {/* Resumo do Pedido */}
          <section className="p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-white font-semibold mb-4">🛒 Resumo</h2>
            {itens.map(item => (
              <div key={item.produto.id} className="flex justify-between text-sm py-1">
                <span className="text-zinc-400 truncate mr-3 max-w-[70%]">{item.produto.titulo} × {item.quantidade}</span>
                <span className="text-white">{fmt(item.produto.preco * item.quantidade)}</span>
              </div>
            ))}
            {freteNome && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-zinc-400">{freteNome}</span>
                <span className="text-white">{fmt(fretePreco || 0)}</span>
              </div>
            )}
            <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-bold">
              <span className="text-white">Total</span>
              <span className="text-red-400 text-xl">{fmt(totalComFrete)}</span>
            </div>
          </section>

          {erro && (
            <div className="p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              ⚠ {erro}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={carregando}
              className="w-full py-4 rounded-lg font-bold text-white text-base disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #dc2626, #7f1d1d)' }}
            >
              {carregando ? '⏳ Aguarde...' : `🔒 Ir para Pagamento — ${fmt(totalComFrete)}`}
            </motion.button>
            <motion.button
              onClick={handleSimular}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={carregando}
              className="w-full py-4 rounded-lg font-bold text-zinc-300 bg-white/5 border border-white/10 text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              🚀 Simular Pagamento Aprovado (Bypassar Mercado Pago)
            </motion.button>
          </div>

          <p className="text-zinc-600 text-xs text-center">
            Ao clicar, você será redirecionado ao pagamento seguro do Mercado Pago.<br />
            Aceitamos Pix, Boleto e Cartão de Crédito (até 6×).
          </p>
        </form>
      </div>
    </div>
  );
}

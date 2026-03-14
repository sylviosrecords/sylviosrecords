import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FreteOpcao } from '../types';
import { fmt } from '../utils';

interface Props {
  quantidade: number;
  onFreteEscolhido: (frete: { nome: string; preco: number } | null, cep?: string) => void;
  freteEscolhido: { nome: string; preco: number } | null;
}

export function CarrinhoCalculadorFrete({ quantidade, onFreteEscolhido, freteEscolhido }: Props) {
  const [cep, setCep] = useState('');
  const [opcoes, setOpcoes] = useState<FreteOpcao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [estimativa, setEstimativa] = useState(false);

  const calcularFrete = async () => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setErro('CEP inválido. Digite 8 números.');
      return;
    }
    setCarregando(true);
    setErro('');
    setOpcoes([]);
    onFreteEscolhido(null);

    try {
      const resp = await fetch(`/api/frete?cep=${cepLimpo}&quantidade=${quantidade}`);
      const data = await resp.json() as { opcoes?: FreteOpcao[]; estimativa?: boolean; erro?: string };

      if (data.erro) {
        setErro(data.erro);
      } else {
        setOpcoes(data.opcoes || []);
        setEstimativa(!!data.estimativa);
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const formatarCep = (v: string) => {
    const n = v.replace(/\D/g, '').slice(0, 8);
    return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
  };

  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span>📦</span> Calcular Frete
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          value={cep}
          onChange={e => setCep(formatarCep(e.target.value))}
          onKeyDown={e => e.key === 'Enter' && calcularFrete()}
          placeholder="00000-000"
          maxLength={9}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600"
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={calcularFrete}
          disabled={carregando}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {carregando ? '...' : 'OK'}
        </motion.button>
      </div>

      {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}

      {estimativa && opcoes.length > 0 && (
        <p className="text-yellow-500/70 text-xs mt-2">
          ⚠ Valores estimados — o frete exato é calculado pelo Melhor Envio no checkout.
        </p>
      )}

      {opcoes.length > 0 && (
        <div className="mt-3 space-y-2">
          {opcoes.map(op => (
            <button
              key={op.id}
              onClick={() => onFreteEscolhido({ nome: op.nome, preco: op.preco }, cep.replace(/\D/g, ''))}
              className="w-full flex items-center justify-between p-3 rounded-lg text-left transition-all"
              style={{
                background: freteEscolhido?.nome === op.nome
                  ? 'rgba(220, 38, 38, 0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: freteEscolhido?.nome === op.nome
                  ? '1px solid rgba(220,38,38,0.5)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div>
                <p className="text-white text-sm font-medium">{op.nome}</p>
                <p className="text-zinc-500 text-xs">{op.prazo}</p>
              </div>
              <span className="text-red-400 font-bold text-sm">{fmt(op.preco)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

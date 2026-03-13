import type { VercelRequest, VercelResponse } from '@vercel/node';

// API de cálculo de frete via Melhor Envio
// Doc: https://docs.melhorenvio.com.br/reference/calcular-frete
// Por enquanto usa estimativa manual dos Correios para evitar depender de credenciais
// quando o token do Melhor Envio for configurado, basta descomentar a seção correspondente.

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30 * 60 * 1000; // 30 minutos

// Peso estimado de 1 disco (vinil ou DVD em caixa)
const PESO_DISCO_KG = 0.35;
// Dimensões do pacote
const DIMENSOES = { comprimento: 30, altura: 5, largura: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { cep, quantidade } = req.query;

  if (!cep || typeof cep !== 'string') {
    return res.status(400).json({ erro: 'CEP é obrigatório' });
  }

  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    return res.status(400).json({ erro: 'CEP inválido' });
  }

  const qtd = parseInt((quantidade as string) || '1', 10);
  const cacheKey = `${cepLimpo}_${qtd}`;

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    return res.json(cached.data);
  }

  const token = process.env.MELHOR_ENVIO_TOKEN;

  // ── Melhor Envio (quando o token estiver configurado) ──────────────────────
  if (token) {
    try {
      const pesoTotal = PESO_DISCO_KG * qtd;

      const body = {
        from: { postal_code: '01310100' }, // CEP de origem (São Paulo, SP) - ajustar para o seu CEP
        to: { postal_code: cepLimpo },
        package: {
          height: DIMENSOES.altura,
          width: DIMENSOES.largura,
          length: DIMENSOES.comprimento,
          weight: pesoTotal,
        },
        options: { receipt: false, own_hand: false },
        services: '1,2,3,4,7,8', // PAC, SEDEX, Jadlog, etc.
      };

      const resp = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Sylvios Records (sylviosrecords.com.br)',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(`Melhor Envio retornou ${resp.status}`);
      }

      // Filtra e formata apenas os resultados sem erro
      const opcoes = (data as Array<{ error?: string; id: string; name: string; price: string; delivery_time: number; company: { name: string; picture: string } }>)
        .filter((s) => !s.error && s.price)
        .map((s) => ({
          id: s.id,
          nome: s.name,
          preco: parseFloat(s.price),
          prazo: `${s.delivery_time} dia${s.delivery_time !== 1 ? 's' : ''} úteis`,
          transportadora: s.company?.name || '',
          foto: s.company?.picture || '',
        }));

      const resposta = { opcoes };
      cache.set(cacheKey, { data: resposta, ts: Date.now() });
      return res.json(resposta);
    } catch (err) {
      console.error('[frete] Erro no Melhor Envio:', err);
      // fallback para estimativa manual
    }
  }

  // ── Fallback: estimativa simples via ViaCEP + tabela básica ───────────────
  try {
    const viaCep = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dadosCep = await viaCep.json() as { erro?: boolean; uf?: string };

    if (dadosCep.erro) {
      return res.status(400).json({ erro: 'CEP não encontrado' });
    }

    // Estimativa por UF (tabela simplificada)
    const tabelaUF: Record<string, { pac: number; sedex: number; prazo_pac: number; prazo_sedex: number }> = {
      SP: { pac: 18, sedex: 28, prazo_pac: 3, prazo_sedex: 1 },
      RJ: { pac: 22, sedex: 33, prazo_pac: 5, prazo_sedex: 2 },
      MG: { pac: 20, sedex: 30, prazo_pac: 4, prazo_sedex: 1 },
      ES: { pac: 22, sedex: 33, prazo_pac: 5, prazo_sedex: 2 },
      PR: { pac: 24, sedex: 36, prazo_pac: 5, prazo_sedex: 2 },
      SC: { pac: 24, sedex: 36, prazo_pac: 5, prazo_sedex: 2 },
      RS: { pac: 26, sedex: 38, prazo_pac: 6, prazo_sedex: 2 },
      GO: { pac: 26, sedex: 38, prazo_pac: 6, prazo_sedex: 2 },
      DF: { pac: 26, sedex: 38, prazo_pac: 6, prazo_sedex: 2 },
      BA: { pac: 30, sedex: 42, prazo_pac: 8, prazo_sedex: 3 },
      PE: { pac: 32, sedex: 44, prazo_pac: 9, prazo_sedex: 3 },
      CE: { pac: 33, sedex: 46, prazo_pac: 10, prazo_sedex: 3 },
      AM: { pac: 38, sedex: 54, prazo_pac: 12, prazo_sedex: 4 },
      PA: { pac: 36, sedex: 52, prazo_pac: 11, prazo_sedex: 4 },
    };

    const uf = dadosCep.uf || 'SP';
    const tabela = tabelaUF[uf] || { pac: 32, sedex: 46, prazo_pac: 10, prazo_sedex: 3 };

    // Adicional por quantidade extra
    const adicional = Math.max(0, qtd - 1) * 4;

    const opcoes = [
      {
        id: 'pac',
        nome: 'PAC (Correios)',
        preco: +(tabela.pac + adicional).toFixed(2),
        prazo: `${tabela.prazo_pac} a ${tabela.prazo_pac + 2} dias úteis`,
        transportadora: 'Correios',
        foto: '',
      },
      {
        id: 'sedex',
        nome: 'SEDEX (Correios)',
        preco: +(tabela.sedex + adicional).toFixed(2),
        prazo: `${tabela.prazo_sedex} a ${tabela.prazo_sedex + 1} dia útil`,
        transportadora: 'Correios',
        foto: '',
      },
    ];

    const resposta = { opcoes, estimativa: true };
    cache.set(cacheKey, { data: resposta, ts: Date.now() });
    return res.json(resposta);
  } catch (err) {
    console.error('[frete] Erro no fallback:', err);
    return res.status(500).json({ erro: 'Não foi possível calcular o frete. Tente novamente.' });
  }
}

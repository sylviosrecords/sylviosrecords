import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Setup admin Supabase client to bypass RLS for inserting orders
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({ erro: 'Credenciais do Mercado Pago não configuradas' });
  }

  // Validação básica do body
  const { itens, comprador, frete, cupom } = req.body as {
    itens: Array<{ titulo: string; preco: number; quantidade: number; foto: string; id: string }>;
    comprador: { 
      nome: string; email: string; cpf: string; telefone: string;
      endereco?: { cep: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; };
    };
    frete: { nome: string; preco: number };
    cupom?: string;
  };

  if (!itens?.length || !comprador?.nome || !comprador?.email) {
    return res.status(400).json({ erro: '[PASSO 0] Dados do pedido incompletos' });
  }

  // PASSO 1: Desconto do Supabase
  let fatorDescontoSite = 0.9; // 10% padrão
  let fatorDescontoCupom = 1.0; // Sem cupom por padrão
  try {
    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'desconto_site').single();
    const desconto = parseInt(config?.valor || process.env.DESCONTO_SITE || '10', 10);
    fatorDescontoSite = 1 - (desconto / 100);
  } catch (err) {
    console.error('[checkout] Erro ao buscar config Supabase:', err);
    // Continua com o padrão
  }

  if (cupom) {
    try {
      const { data: cupomData } = await supabase.from('cupons').select('*').eq('codigo', cupom.toUpperCase()).eq('ativo', true).single();
      if (cupomData && typeof cupomData.desconto === 'number') {
        fatorDescontoCupom = 1 - (cupomData.desconto / 100);
      }
    } catch (err) {
      console.error('[checkout] Erro ao validar cupom:', err);
    }
  }

  // PASSO 2: Preços reais do Mercado Livre
  const precosReais: Record<string, number> = {};
  try {
    const ids = itens.map(i => i.id).join(',');
    const mlResposta = await fetch(`https://api.mercadolibre.com/items?ids=${ids}&attributes=id,price`);
    if (mlResposta.ok) {
      const mlDados = await mlResposta.json();
      if (Array.isArray(mlDados)) {
        for (const r of mlDados) {
          if (r.code === 200 && r.body) precosReais[r.body.id] = r.body.price;
        }
      }
    }
  } catch (err) {
    console.error('[checkout] Erro ao buscar precos ML (nao critico):', err);
    // Continua usando precos do frontend como fallback
  }

  let totalRealItens = 0;
  const itensValidados = itens.map(i => {
    const precoML = precosReais[i.id];
    // Preço máximo aceitável = preço ML com desconto do site
    const precoMaximo = precoML ? Number((precoML * fatorDescontoSite).toFixed(2)) : null;
    // Usamos o preço enviado pelo frontend, MAS bloqueamos se for MAIOR que o máximo (anti-fraude)
    const precoFrontend = Number(Number(i.preco).toFixed(2));
    const precoBase = (precoMaximo !== null && precoFrontend > precoMaximo) ? precoMaximo : precoFrontend;
    // Aplica cupom sobre o preço já com desconto do site
    const precoFinal = Number((precoBase * fatorDescontoCupom).toFixed(2));
    totalRealItens += precoFinal * i.quantidade;
    return { ...i, preco: precoFinal };
  });
  const totalCalculado = totalRealItens + frete.preco;

  // PASSO 3: Inserir pedido no Supabase
  let dbOrderId: string;
  try {
    const pedidoId = crypto.randomUUID();
    const { data: dbOrder, error: dbError } = await supabase.from('pedidos').insert({
      id: pedidoId,
      status: 'pendente',
      cliente_nome: comprador.nome,
      cliente_email: comprador.email,
      cliente_cpf: comprador.cpf,
      cliente_telefone: comprador.telefone,
      cep: comprador.endereco?.cep,
      logradouro: comprador.endereco?.logradouro,
      numero: comprador.endereco?.numero,
      complemento: comprador.endereco?.complemento,
      bairro: comprador.endereco?.bairro,
      cidade: comprador.endereco?.cidade,
      estado: comprador.endereco?.estado,
      frete_nome: frete.nome,
      frete_valor: frete.preco,
      subtotal: totalRealItens,
      itens: itensValidados.map(i => ({ id: i.id, titulo: i.titulo, preco: i.preco, quantidade: i.quantidade })),
      total: totalCalculado,
      cupom_codigo: cupom ? cupom.toUpperCase() : null,
    }).select('id').single();

    if (dbError || !dbOrder) {
      const msg = dbError?.message || 'Sem ID retornado';
      console.error('[checkout] Erro DB:', msg);
      return res.status(500).json({ erro: `[PASSO 3-DB] ${msg}` });
    }
    dbOrderId = dbOrder.id;
  } catch (err: any) {
    return res.status(500).json({ erro: `[PASSO 3-CATCH] ${err?.message || String(err)}` });
  }

  // PASSO 4: Criar preferência no Mercado Pago
  try {
    const preferencia = {
      external_reference: dbOrderId,
      items: [
        ...itensValidados.map(item => ({
          id: item.id,
          title: item.titulo,
          quantity: item.quantidade,
          unit_price: item.preco,
          currency_id: 'BRL',
          picture_url: item.foto,
        })),
        ...(frete.preco > 0 ? [{
          id: 'frete',
          title: frete.nome,
          quantity: 1,
          unit_price: frete.preco,
          currency_id: 'BRL',
        }] : []),
      ],
      payer: {
        name: comprador.nome.split(' ').slice(0, -1).join(' ') || comprador.nome,
        surname: comprador.nome.split(' ').slice(-1)[0] || comprador.nome,
        email: comprador.email,
        phone: {
          area_code: comprador.telefone.replace(/\D/g, '').slice(0, 2),
          number: comprador.telefone.replace(/\D/g, '').slice(2),
        },
        identification: { type: 'CPF', number: comprador.cpf.replace(/\D/g, '') },
      },
      payment_methods: {
        installments: 12,
        excluded_payment_types: [],
      },
      back_urls: {
        success: `${process.env.SITE_URL}/pedido/sucesso?pedido=${dbOrderId}`,
        failure: `${process.env.SITE_URL}/pedido/falha`,
        pending: `${process.env.SITE_URL}/pedido/pendente`,
      },
      auto_approve: false,
      notification_url: `${process.env.SITE_URL}/api/webhook-mp`,
      statement_descriptor: 'SYLVIOS RECORDS',
      expires: false,
    };

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(preferencia),
    });

    const dados = await resposta.json() as { id?: string; init_point?: string; error?: string; message?: string; cause?: unknown[] };

    if (!resposta.ok || dados.error) {
      console.error('[checkout] Erro MP:', JSON.stringify(dados));
      return res.status(500).json({ erro: `[PASSO 4-MP] ${dados.message || dados.error || 'Erro desconhecido MP'}`, detalhe: dados.cause });
    }

    return res.json({ preferenceId: dados.id, checkoutUrl: dados.init_point });
  } catch (err: any) {
    return res.status(500).json({ erro: `[PASSO 4-CATCH] ${err?.message || String(err)}` });
  }
}

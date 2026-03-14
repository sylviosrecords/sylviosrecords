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

  try {
    const { itens, comprador, frete } = req.body as {
      itens: Array<{ titulo: string; preco: number; quantidade: number; foto: string; id: string }>;
      comprador: { 
        nome: string; email: string; cpf: string; telefone: string;
        endereco?: { cep: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; };
      };
      frete: { nome: string; preco: number };
    };

    // 0. BUSCAR PREÇOS REAIS DO MERCADO LIVRE E DESCONTO DO SUPABASE
    const { data: config } = await supabase.from('configuracoes').select('valor').eq('chave', 'desconto_site').single();
    const descontoStr = config?.valor || process.env.DESCONTO_SITE || '10';
    const desconto = parseInt(descontoStr, 10);
    const fatorDesconto = 1 - (desconto / 100);

    const ids = itens.map(i => i.id).join(',');
    const mlResposta = await fetch(`https://api.mercadolibre.com/items?ids=${ids}&attributes=id,price`);
    const mlDados = await mlResposta.json();

    const precosReais: Record<string, number> = {};
    if (Array.isArray(mlDados)) {
      for (const res of mlDados) {
        if (res.code === 200 && res.body) {
          precosReais[res.body.id] = res.body.price;
        }
      }
    }

    let totalRealItens = 0;
    const itensValidados = itens.map(i => {
      const precoOriginal = precosReais[i.id] || i.preco; // Fallback caso ML falhe e caia fora de 200 pro item
      const precoComDesconto = Number((precoOriginal * fatorDesconto).toFixed(2));
      totalRealItens += (precoComDesconto * i.quantidade);
      return { ...i, preco: precoComDesconto };
    });

    const totalCalculado = totalRealItens + frete.preco;

    // 1. INSERIR PEDIDO PENDENTE NO BANCO DE DADOS PRIMEIRO
    const { data: dbOrder, error: dbError } = await supabase.from('pedidos').insert({
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
      itens: itensValidados.map(i => ({ id: i.id, titulo: i.titulo, preco: i.preco, quantidade: i.quantidade })),
      total: totalCalculado,
    }).select('id').single();

    if (dbError || !dbOrder) {
      console.error('[checkout] Erro ao salvar pedido no DB:', dbError);
      return res.status(500).json({ erro: 'Erro ao registrar pedido no sistema', detalhe: dbError });
    }

    // 2. Montar a preferência de pagamento com referência ao ID interno
    const preferencia = {
      external_reference: dbOrder.id, // VÍNCULO CRUCIAL COM NOSSO BANCO DE DADOS
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
        excluded_payment_types: [],
        installments: 6,
      },
      back_urls: {
        success: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/sucesso`,
        failure: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/falha`,
        pending: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/pendente`,
      },
      auto_approve: false,
      notification_url: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/api/webhook-mp`,
      statement_descriptor: 'SYLVIOS RECORDS',
      expires: false,
    };

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferencia),
    });

    const dados = await resposta.json() as { id?: string; init_point?: string; sandbox_init_point?: string; error?: string };

    if (!resposta.ok || dados.error) {
      console.error('[checkout] Erro MP:', dados);
      return res.status(500).json({ erro: 'Erro ao criar link de pagamento', detalhe: dados });
    }

    return res.json({
      preferenceId: dados.id,
      checkoutUrl: dados.init_point,
      sandboxUrl: dados.sandbox_init_point,
    });
  } catch (err) {
    console.error('[checkout] Erro:', err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import freteHandler from './frete.js';

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
  const { itens, comprador, frete, cupom } = (req.body || {}) as {
    itens: Array<{ titulo: string; preco: number; quantidade: number; foto: string; id: string }>;
    comprador: { 
      nome: string; email: string; cpf: string; telefone: string;
      endereco?: { cep: string; logradouro: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; };
    };
    frete: { nome: string; preco: number };
    cupom?: string;
  };

  if (!Array.isArray(itens) || !itens.length || !comprador?.nome || !comprador?.email) {
    return res.status(400).json({ erro: '[PASSO 0] Dados do pedido incompletos' });
  }

  if (!frete || typeof frete.nome !== 'string' || !Number.isFinite(frete.preco) || frete.preco < 0 ||
      !comprador.cpf || !comprador.telefone || !comprador.endereco?.cep ||
      new Set(itens.map(i => i.id)).size !== itens.length || itens.length > 20 || itens.some(i => !/^MLB\d+$/.test(i.id) || !Number.isInteger(i.quantidade) || i.quantidade < 1 || i.quantidade > 100 || !Number.isFinite(i.preco) || i.preco <= 0)) {
    return res.status(400).json({ erro: 'Dados do pedido inválidos. Confira o carrinho e o endereço.' });
  }

  // Recalcula o frete no servidor para o CEP e quantidade informados.
  let freteStatus = 200;
  let freteResultado: any;
  const freteResponse = {
    setHeader() { return this; },
    status(code: number) { freteStatus = code; return this; },
    json(data: unknown) { freteResultado = data; return this; },
    end() { return this; },
  };
  await freteHandler({ method: 'GET', query: { cep: comprador.endereco.cep, quantidade: String(itens.reduce((n, i) => n + i.quantidade, 0)) } } as any, freteResponse as any);
  const freteAtual = freteResultado?.opcoes?.find((op: any) => op.nome === frete.nome);
  if (freteStatus !== 200 || !freteAtual || Math.round(freteAtual.preco * 100) !== Math.round(frete.preco * 100)) {
    return res.status(400).json({ erro: 'O frete mudou ou não está disponível. Volte ao carrinho e calcule novamente.' });
  }
  frete.preco = freteAtual.preco;

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

  if (!Number.isFinite(fatorDescontoSite) || fatorDescontoSite <= 0 || fatorDescontoSite > 1) {
    return res.status(500).json({ erro: 'Configuração de desconto inválida.' });
  }

  if (cupom) {
    try {
      const { data: cupomData } = await supabase.from('cupons').select('*').eq('codigo', cupom.toUpperCase()).eq('ativo', true).single();
      if (!cupomData || typeof cupomData.desconto !== 'number' || cupomData.desconto < 0 || cupomData.desconto >= 100) {
        return res.status(400).json({ erro: 'Cupom inválido ou expirado.' });
      }
      fatorDescontoCupom = 1 - (cupomData.desconto / 100);
    } catch (err) {
      console.error('[checkout] Erro ao validar cupom:', err);
      return res.status(500).json({ erro: 'Não foi possível validar o cupom. Tente novamente.' });
    }
  }

  // Os preços e a disponibilidade vêm do mesmo catálogo usado pela loja.
  let itensValidados: typeof itens;
  let totalRealItens = 0;
  try {
    const tokenResposta = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.ML_APP_ID || '', client_secret: process.env.ML_SECRET || '' }),
    });
    if (!tokenResposta.ok) throw new Error('Falha ao autenticar no catálogo');
    const auth = await tokenResposta.json() as { access_token: string };
    const ids = [...new Set(itens.map(i => i.id))].join(',');
    const mlResposta = await fetch(`https://api.mercadolibre.com/items?ids=${encodeURIComponent(ids)}&attributes=id,title,price,seller_id,status,available_quantity,thumbnail`, { headers: { Authorization: `Bearer ${auth.access_token}` } });
    if (!mlResposta.ok) throw new Error('Falha ao consultar catálogo');
    const dados = await mlResposta.json() as Array<{ code: number; body: any }>;
    const produtos = new Map(dados.filter(r => r.code === 200 && r.body).map(r => [r.body.id, r.body]));
    itensValidados = itens.map(i => {
      const produto = produtos.get(i.id);
      if (!produto || String(produto.seller_id) !== '78078427' || produto.status !== 'active' || produto.available_quantity < i.quantidade || !Number.isFinite(produto.price) || produto.price <= 0 || Math.round(produto.price * 100) !== Math.round(i.preco * 100)) {
        throw new Error('Um item mudou de preço ou não está disponível. Atualize o carrinho.');
      }
      const preco = Number((Number((produto.price * fatorDescontoSite).toFixed(2)) * fatorDescontoCupom).toFixed(2));
      if (preco <= 0) throw new Error('Não foi possível calcular o valor do pedido.');
      totalRealItens += preco * i.quantidade;
      return { ...i, titulo: produto.title, foto: (produto.thumbnail || '').replace('http://', 'https://'), preco };
    });
  } catch (err) {
    console.error('[checkout] Erro ao validar catálogo:', err);
    return res.status(400).json({ erro: err instanceof Error && err.message.startsWith('Um item') ? err.message : 'Não foi possível validar os produtos. Tente novamente.' });
  }
  totalRealItens = Number(totalRealItens.toFixed(2));
  const totalCalculado = Number((totalRealItens + frete.preco).toFixed(2));

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
      return res.status(500).json({ erro: 'Não foi possível registrar o pedido. Tente novamente.' });
    }
    dbOrderId = dbOrder.id;
  } catch (err: any) {
    console.error('[checkout] Erro ao registrar pedido:', err);
    return res.status(500).json({ erro: 'Não foi possível registrar o pedido. Tente novamente.' });
  }

  // PASSO 4: Criar preferência no Mercado Pago
  try {
    const siteUrl = (process.env.SITE_URL || 'https://sylviosrecords.vercel.app').replace(/\/$/, '');
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
        success: `${siteUrl}/pedido/sucesso?pedido=${dbOrderId}`,
        failure: `${siteUrl}/pedido/falha`,
        pending: `${siteUrl}/pedido/pendente`,
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhook-mp`,
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
      return res.status(502).json({ erro: 'Não foi possível iniciar o pagamento. Tente novamente.' });
    }

    return res.json({ preferenceId: dados.id, checkoutUrl: dados.init_point });
  } catch (err: any) {
    console.error('[checkout] Erro ao iniciar pagamento:', err);
    return res.status(502).json({ erro: 'Não foi possível iniciar o pagamento. Tente novamente.' });
  }
}

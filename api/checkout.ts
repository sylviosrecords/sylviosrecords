import type { VercelRequest, VercelResponse } from '@vercel/node';

// Integração com o SDK do Mercado Pago (Server-side)
// Documentação: https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post

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

    // Montar a preferência de pagamento do Mercado Pago
    const preferencia = {
      items: [
        // Itens do pedido
        ...itens.map(item => ({
          id: item.id,
          title: item.titulo,
          quantity: item.quantidade,
          unit_price: item.preco,
          currency_id: 'BRL',
          picture_url: item.foto,
        })),
        // Frete como item separado (padrão MP)
        ...(frete.preco > 0 ? [{
          id: 'frete',
          title: frete.nome,
          quantity: 1,
          unit_price: frete.preco,
          currency_id: 'BRL',
        }] : []),
      ],
      payer: {
        name: comprador.nome.split(' ').slice(0, -1).join(' '),
        surname: comprador.nome.split(' ').slice(-1)[0],
        email: comprador.email,
        phone: { number: comprador.telefone.replace(/\D/g, '') },
        identification: { type: 'CPF', number: comprador.cpf.replace(/\D/g, '') },
      },
      payment_methods: {
        // Permite PIX, boleto e cartão
        excluded_payment_types: [],
        installments: 6, // Máximo de parcelas
      },
      back_urls: {
        success: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/sucesso`,
        failure: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/falha`,
        pending: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/pedido/pendente`,
      },
      auto_approve: false,
      notification_url: `${process.env.SITE_URL || 'https://sylviosrecords.vercel.app'}/api/webhook-mp`,
      metadata: {
        frete_nome: frete.nome,
        frete_valor: frete.preco,
        cliente_telefone: comprador.telefone,
        endereco_cep: comprador.endereco?.cep,
        endereco_logradouro: comprador.endereco?.logradouro,
        endereco_numero: comprador.endereco?.numero,
        endereco_complemento: comprador.endereco?.complemento,
        endereco_bairro: comprador.endereco?.bairro,
        endereco_cidade: comprador.endereco?.cidade,
        endereco_estado: comprador.endereco?.estado,
      },
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
      return res.status(500).json({ erro: 'Erro ao criar preferência de pagamento', detalhe: dados });
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

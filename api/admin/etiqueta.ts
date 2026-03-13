import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Autorização via Senha do Painel Admin
  const authHeader = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== adminPass) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const tokenME = process.env.MELHOR_ENVIO_TOKEN;
  if (!tokenME) {
    return res.status(500).json({ erro: 'Token do Melhor Envio não configurado' });
  }

  try {
    const { pedidoId, nfe_key } = req.body as { pedidoId: string; nfe_key?: string };
    if (!pedidoId) return res.status(400).json({ erro: 'ID do pedido obrigatório' });

    // 1. Puxar o pedido real do banco
    const { data: pedido, error: dbError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (dbError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // Como o Frete ID (service do Melhor Envio) não foi salvo de forma direta no DB (apenas o nome),
    // vamos tentar mapear o nome. Se não tiver, envia o mais padrão (PAC).
    let serviceId = 1; // 1 = PAC Correios 
    const nomeFrete = pedido.frete_nome?.toLowerCase() || '';
    if (nomeFrete.includes('sedex')) serviceId = 2; // SEDEX
    if (nomeFrete.includes('jadlog') || nomeFrete.includes('package')) serviceId = 3; // Jadlog Package

    // 2. Preparar payload de adição ao Carrinho (Cart) do Melhor Envio
    let non_commercial = true;
    let invoice = null;

    if (nfe_key && nfe_key.length === 44) {
       // Possui Nota Fiscal! Envia como comercial.
       non_commercial = false;
       invoice = { key: nfe_key };
    }

    // Calcula o valor total dos itens (em float formatado para o ME)
    // O ME precisa do valor dos produtos avulsos.
    const cartPayload = {
      service: serviceId,
      agency: null, 
      from: {
        name: "Sylvios Records",
        phone: "11999999999", // Coloque o telefone real
        email: "contato@sylviosrecords.com.br",
        document: "00000000000000", // Necessário CPF/CNPJ se houver nota
        company_document: "00000000000000", 
        state_register: "",
        postal_code: "11704460"
      },
      to: {
        name: pedido.cliente_nome.substring(0, 50),
        phone: (pedido.cliente_telefone || "11999999999").replace(/\D/g, ''),
        email: pedido.cliente_email,
        document: (pedido.cliente_cpf || "00000000000").replace(/\D/g, ''),
        address: pedido.logradouro || "Endereço",
        number: pedido.numero || "S/N",
        complement: pedido.complemento || "",
        district: pedido.bairro || "Centro",
        city: pedido.cidade || "Cidade",
        state_abbr: pedido.estado || "SP",
        country_id: "BR",
        postal_code: (pedido.cep || "").replace(/\D/g, '')
      },
      products: pedido.itens.map((i: any) => ({
        name: i.titulo,
        quantity: i.quantidade,
        unitary_value: Number(i.preco).toFixed(2),
      })),
      volumes: [
        {
          height: 5,
          width: 30,
          length: 30,
          weight: 0.35 * pedido.itens.reduce((sum: number, i: any) => sum + i.quantidade, 0)
        }
      ],
      options: {
        receipt: false,
        own_hand: false,
        collect: false,
        non_commercial, // true = Gera Declaração de Conteúdo, false = NF-e
        invoice // só passa se tiver a chave
      }
    };

    console.log('[etiqueta] Adicionando ao Carrinho Melhor Envio...');
    const cartResp = await fetch('https://melhorenvio.com.br/api/v2/me/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenME}`,
        'User-Agent': 'Sylvios Records (sylviosrecords.com.br)'
      },
      body: JSON.stringify(cartPayload)
    });

    const cartData = await cartResp.json();
    if (!cartResp.ok || cartData.error) {
       console.error('[etiqueta] Erro ao adicionar Carrinho ME:', cartData);
       return res.status(500).json({ erro: 'Falha no Melhor Envio (Cart)', detalhe: cartData });
    }

    const meOrderId = cartData.id;

    // 3. Checkout da Etiqueta no Carrinho (Pagando com a carteira ou cartão padrão já na conta ME)
    console.log(`[etiqueta] Pagando Etiqueta ${meOrderId}...`);
    const checkoutResp = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenME}`,
        'User-Agent': 'Sylvios Records (sylviosrecords.com.br)'
      },
      body: JSON.stringify({ orders: [String(meOrderId)] })
    });

    const checkoutData = await checkoutResp.json();
    if (!checkoutResp.ok || checkoutData.error) {
      console.error('[etiqueta] Erro no Checkout ME:', checkoutData);
      return res.status(500).json({ erro: 'Falha no Melhor Envio (Checkout)', detalhe: checkoutData });
    }

    // 4. Gerar Etiquetas (Libera rastreio e link)
    console.log(`[etiqueta] Gerando e Aprovando Etiquetas...`);
    const generateResp = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenME}`,
        'User-Agent': 'Sylvios Records (sylviosrecords.com.br)'
      },
      body: JSON.stringify({ orders: [String(meOrderId)] })
    });
    
    // (O generate joga para fila, mas a api tem outra request opcional pra imprimir. Não faremos aqui, deixaremos no painel)

    // Atualizar no nosso DB
    // Guardamos o tracking da transportadora e alteramos status
    await supabase.from('pedidos').update({
       status: 'enviado',
       codigo_rastreio: `ME-${meOrderId}`, // Idealmente pega o .tracking após generate-label
       atualizado_em: new Date().toISOString()
    }).eq('id', pedidoId);

    return res.json({ 
      ok: true, 
      me_order_id: meOrderId,
      mensagem: "Etiqueta enviada pro Carrinho e Paga com Sucesso!"
    });

  } catch (err: any) {
    console.error('[etiqueta] Erro CRÍTICO:', err);
    return res.status(500).json({ erro: 'Exceção', detalhe: err.message });
  }
}

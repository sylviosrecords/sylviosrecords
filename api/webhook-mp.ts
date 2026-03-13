import type { VercelRequest, VercelResponse } from '@vercel/node';

// Webhook que o Mercado Pago chama quando um pagamento é atualizado.
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // O MP só envia POST
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body as { type: string; data: { id: string } };

  // Ignorar notificações que não são de pagamento
  if (type !== 'payment') {
    return res.status(200).json({ ok: true, ignorado: true });
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).end();

  try {
    // Buscar os detalhes do pagamento na API do MP
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const pagamento = await resp.json() as {
      status: string;
      status_detail: string;
      transaction_amount: number;
      payer: { email: string; first_name: string };
      metadata?: Record<string, unknown>;
    };

    console.log('[webhook-mp] Pagamento recebido:', {
      id: data.id,
      status: pagamento.status,
      valor: pagamento.transaction_amount,
      comprador: pagamento.payer?.email,
    });

    // ── Aqui você pode adicionar lógicas futuras quando integrar o ERP: ──
    // if (pagamento.status === 'approved') {
    //   await notificarERP(pagamento);
    //   await enviarEmailConfirmacao(pagamento.payer.email, pagamento);
    // }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[webhook-mp] Erro ao processar:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { gerarIdPedido } from '../src/utils.ts';

// ── Clientes ─────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SITE_URL = process.env.SITE_URL || 'https://sylviosrecords.vercel.app';

// ── Webhook handler ───────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, data } = req.body as { type: string; data: { id: string } };

  if (type !== 'payment') return res.status(200).json({ ok: true, ignorado: true });

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(500).json({ erro: 'MP_ACCESS_TOKEN não configurado' });

  try {
    // 1. Buscar dados do pagamento no Mercado Pago
    const respMP = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pagamento = await respMP.json() as {
      status: string;
      status_detail: string;
      transaction_amount: number;
      additional_info?: {
        items?: Array<{ id: string; title: string; unit_price: string; quantity: string; picture_url?: string }>;
        shipments?: { receiver_address?: { zip_code: string; street_name: string; street_number: string; city_name: string; state_name: string } };
      };
      payer: { email: string; first_name: string; last_name: string; identification?: { number: string } };
      metadata?: {
        pedido_id?: string;
        frete_nome?: string;
        frete_valor?: number;
        cliente_telefone?: string;
        endereco_numero?: string;
        endereco_complemento?: string;
      };
    };

    console.log('[webhook-mp] Pagamento:', { id: data.id, status: pagamento.status });

    // 2. Só processa pagamentos aprovados
    if (pagamento.status !== 'approved') {
      return res.status(200).json({ ok: true, status: pagamento.status });
    }

    // 3. Verificar se pedido já existe (evita duplicatas)
    const mpPaymentId = String(data.id);
    const { data: existente } = await supabase
      .from('pedidos')
      .select('id')
      .eq('mp_payment_id', mpPaymentId)
      .single();

    if (existente) {
      console.log('[webhook-mp] Pedido já existe:', existente.id);
      return res.status(200).json({ ok: true, pedido_id: existente.id });
    }

    // 4. Montar os dados do pedido
    const pedidoId = gerarIdPedido();
    const itens = (pagamento.additional_info?.items || [])
      .filter(i => i.id !== 'frete')
      .map(i => ({
        id: i.id,
        titulo: i.title,
        preco: parseFloat(i.unit_price),
        quantidade: parseInt(i.quantity),
        foto: i.picture_url || '',
      }));

    const frete = (pagamento.additional_info?.items || []).find(i => i.id === 'frete');
    const freteValor = frete ? parseFloat(frete.unit_price) : 0;
    const freteNome = pagamento.metadata?.frete_nome || (frete?.title) || 'Frete';
    const subtotal = itens.reduce((sum, i) => sum + i.preco * i.quantidade, 0);
    const endereco = pagamento.additional_info?.shipments?.receiver_address;

    const pedido = {
      id: pedidoId,
      mp_payment_id: mpPaymentId,
      status: 'pago',
      cliente_nome: `${pagamento.payer.first_name} ${pagamento.payer.last_name}`.trim(),
      cliente_email: pagamento.payer.email,
      cliente_cpf: pagamento.payer.identification?.number,
      cliente_telefone: pagamento.metadata?.cliente_telefone,
      cep: endereco?.zip_code,
      logradouro: endereco?.street_name,
      numero: pagamento.metadata?.endereco_numero || endereco?.street_number,
      complemento: pagamento.metadata?.endereco_complemento,
      cidade: endereco?.city_name,
      estado: endereco?.state_name,
      subtotal,
      frete_nome: freteNome,
      frete_valor: freteValor,
      total: pagamento.transaction_amount,
      itens,
    };

    // 5. Salvar no Supabase
    const { error: dbError } = await supabase.from('pedidos').insert(pedido);
    if (dbError) {
      console.error('[webhook-mp] Erro ao salvar pedido:', dbError);
      return res.status(500).json({ erro: 'Erro ao salvar pedido no banco' });
    }

    console.log('[webhook-mp] Pedido salvo:', pedidoId);

    // 6. Enviar e-mail de confirmação
    await enviarEmailConfirmacao(pedido);

    return res.status(200).json({ ok: true, pedido_id: pedidoId });
  } catch (err) {
    console.error('[webhook-mp] Erro:', err);
    return res.status(500).json({ erro: 'Erro interno' });
  }
}

// ── Template de e-mail ────────────────────────────────────────────────────────
async function enviarEmailConfirmacao(pedido: {
  id: string;
  cliente_nome: string;
  cliente_email: string;
  itens: Array<{ titulo: string; preco: number; quantidade: number; foto: string }>;
  subtotal: number;
  frete_nome?: string;
  frete_valor: number;
  total: number;
}) {
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const itensHtml = pedido.itens.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#ccc;font-size:13px;">
        ${i.titulo} × ${i.quantidade}
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;color:#fff;font-size:13px;text-align:right;white-space:nowrap;">
        ${fmt(i.preco * i.quantidade)}
      </td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #1e1e1e;">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7f1d1d,#dc2626);padding:32px 24px;text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;text-transform:uppercase;letter-spacing:3px;">Sylvio's Records</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:28px;font-weight:800;">Pedido Confirmado! 🎉</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 24px;">
            <p style="color:#aaa;font-size:14px;margin:0 0 24px;">
              Olá, <strong style="color:#fff;">${pedido.cliente_nome.split(' ')[0]}</strong>! Seu pagamento foi aprovado e seu pedido está sendo preparado com carinho.
            </p>

            <!-- Nº do pedido -->
            <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
              <p style="margin:0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Número do Pedido</p>
              <p style="margin:6px 0 0;color:#dc2626;font-size:24px;font-weight:800;letter-spacing:2px;">${pedido.id}</p>
            </div>

            <!-- Itens -->
            <p style="color:#666;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Itens do Pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${itensHtml}
              <tr>
                <td style="padding:8px 0;color:#666;font-size:13px;">Subtotal</td>
                <td style="padding:8px 0;color:#aaa;font-size:13px;text-align:right;">${fmt(pedido.subtotal)}</td>
              </tr>
              ${pedido.frete_valor > 0 ? `
              <tr>
                <td style="padding:8px 0;color:#666;font-size:13px;">${pedido.frete_nome || 'Frete'}</td>
                <td style="padding:8px 0;color:#aaa;font-size:13px;text-align:right;">${fmt(pedido.frete_valor)}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:12px 0 0;color:#fff;font-size:15px;font-weight:700;border-top:1px solid #2a2a2a;">Total</td>
                <td style="padding:12px 0 0;color:#dc2626;font-size:18px;font-weight:800;text-align:right;border-top:1px solid #2a2a2a;">${fmt(pedido.total)}</td>
              </tr>
            </table>

            <!-- CTA Rastreio -->
            <div style="margin-top:28px;text-align:center;">
              <a href="${SITE_URL}/pedido/${pedido.id}"
                style="display:inline-block;background:linear-gradient(135deg,#dc2626,#7f1d1d);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;">
                Acompanhar meu pedido →
              </a>
            </div>

            <p style="margin:24px 0 0;color:#555;font-size:12px;text-align:center;line-height:1.6;">
              Você receberá o código de rastreio assim que o disco for despachado.<br>
              Dúvidas? Responda este e-mail.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #1e1e1e;text-align:center;">
            <p style="margin:0;color:#333;font-size:11px;">© 2026 Sylvio's Records · sylviosrecords.com.br</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: 'Sylvio\'s Records <pedidos@sylviosrecords.com.br>',
      to: pedido.cliente_email,
      subject: `✅ Pedido ${pedido.id} confirmado — Sylvio's Records`,
      html,
    });
    console.log('[email] Confirmação enviada:', result);
  } catch (err) {
    console.error('[email] Erro ao enviar:', err);
    // Não falha o webhook por causa do e-mail
  }
}

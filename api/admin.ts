import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function checkAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASSWORD;
  return !!(authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === adminPass);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS para o painel frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!checkAuth(req)) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const { action } = req.query as { action?: string };

  // ── GET /api/admin?action=pedidos ─────────────────────────────────────────
  if (req.method === 'GET' && action === 'pedidos') {
    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('criado_em', { ascending: false });
      if (error) return res.status(500).json({ erro: 'Falha ao ler pedidos' });
      return res.json({ pedidos });
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── GET /api/admin?action=config ──────────────────────────────────────────
  if (req.method === 'GET' && action === 'config') {
    try {
      const { data } = await supabase
        .from('configuracoes').select('valor').eq('chave', 'desconto_site').single();
      return res.json({ desconto: data?.valor !== undefined ? Number(data.valor) : 10 });
    } catch {
      return res.json({ desconto: parseInt(process.env.DESCONTO_SITE || '10', 10) });
    }
  }

  // ── POST /api/admin?action=config ─────────────────────────────────────────
  if (req.method === 'POST' && action === 'config') {
    try {
      const { desconto } = req.body as { desconto: number };
      if (typeof desconto !== 'number' || desconto < 0 || desconto > 100) {
        return res.status(400).json({ erro: 'Desconto inválido (0-100)' });
      }
      const { error, status, statusText } = await supabase.from('configuracoes').upsert(
        { chave: 'desconto_site', valor: String(desconto) },
        { onConflict: 'chave' }
      );
      if (error) return res.status(500).json({ erro: `ERRO BANCO: ${error.message || JSON.stringify(error)} | Status: ${status}` });
      return res.json({ ok: true, desconto });
    } catch (err: any) {
      return res.status(500).json({ erro: `ERRO FATAL: ${err.message}` });
    }
  }

  // ── DELETE /api/admin?action=pedido ───────────────────────────────────────
  if (req.method === 'DELETE' && action === 'pedido') {
    try {
      const { id } = req.body as { id: string };
      if (!id) return res.status(400).json({ erro: 'ID obrigatório' });
      await supabase.from('pedidos').delete().eq('id', id);
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── GET /api/admin?action=cupons ─────────────────────────────────────────
  if (req.method === 'GET' && action === 'cupons') {
    try {
      const { data: cupons, error } = await supabase.from('cupons').select('*').order('codigo');
      if (error) return res.status(500).json({ erro: 'Falha ao ler cupons' });
      return res.json({ cupons: cupons || [] });
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── POST /api/admin?action=cupons ─────────────────────────────────────────
  if (req.method === 'POST' && action === 'cupons') {
    try {
      const { codigo, desconto, ativo } = req.body as { codigo: string; desconto: number; ativo: boolean };
      if (!codigo || typeof desconto !== 'number' || desconto < 0 || desconto > 100) {
        return res.status(400).json({ erro: 'Dados de cupom inválidos' });
      }
      const { error } = await supabase.from('cupons').upsert(
        { codigo: codigo.toUpperCase(), desconto, ativo },
        { onConflict: 'codigo' }
      );
      if (error) return res.status(500).json({ erro: `ERRO BANCO: ${error.message}` });
      return res.json({ ok: true, cupom: { codigo: codigo.toUpperCase(), desconto, ativo } });
    } catch (err: any) {
      return res.status(500).json({ erro: `ERRO FATAL: ${err.message}` });
    }
  }

  // ── DELETE /api/admin?action=cupons ───────────────────────────────────────
  if (req.method === 'DELETE' && action === 'cupons') {
    try {
      const { codigo } = req.body as { codigo: string };
      if (!codigo) return res.status(400).json({ erro: 'Código obrigatório' });
      const { error } = await supabase.from('cupons').delete().eq('codigo', codigo.toUpperCase());
      if (error) return res.status(500).json({ erro: `ERRO BANCO: ${error.message}` });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }

  // ── POST /api/admin?action=etiqueta ───────────────────────────────────────
  if (req.method === 'POST' && action === 'etiqueta') {
    const tokenME = process.env.MELHOR_ENVIO_TOKEN;
    if (!tokenME) return res.status(500).json({ erro: 'Token do Melhor Envio não configurado' });

    try {
      const { pedidoId, nfe_key } = req.body as { pedidoId: string; nfe_key?: string };
      if (!pedidoId) return res.status(400).json({ erro: 'ID do pedido obrigatório' });

      const { data: pedido, error: dbError } = await supabase
        .from('pedidos').select('*').eq('id', pedidoId).single();
      if (dbError || !pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });

      let serviceId = 1;
      const nomeFrete = pedido.frete_nome?.toLowerCase() || '';
      if (nomeFrete.includes('sedex')) serviceId = 2;
      if (nomeFrete.includes('jadlog') || nomeFrete.includes('package')) serviceId = 3;

      const non_commercial = !(nfe_key && nfe_key.length === 44);
      const invoice = non_commercial ? null : { key: nfe_key };

      const cartPayload = {
        service: serviceId,
        agency: null,
        from: {
          name: "Sylvios Records",
          phone: "13996061597",
          email: "contato@sylviosrecords.com.br",
          document: "52025529805",
          address: "Rua Particular",
          number: "S/N",
          district: "Ocian",
          city: "Praia Grande",
          state_abbr: "SP",
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
          name: i.titulo, quantity: i.quantidade, unitary_value: Number(i.preco).toFixed(2),
        })),
        volumes: [{
          height: 5, width: 30, length: 30,
          weight: 0.35 * pedido.itens.reduce((sum: number, i: any) => sum + i.quantidade, 0)
        }],
        options: { receipt: false, own_hand: false, collect: false, non_commercial, invoice }
      };

      const cartResp = await fetch('https://melhorenvio.com.br/api/v2/me/cart', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${tokenME}`, 'User-Agent': 'Sylvios Records (sylviosrecords.com.br)' },
        body: JSON.stringify(cartPayload)
      });
      const textResp = await cartResp.text();
      let cartData;
      try {
        cartData = JSON.parse(textResp);
      } catch (e) {
        return res.status(500).json({ erro: `Melhor Envio retornou HTML. Status ${cartResp.status}`, detalhe: textResp.substring(0, 200) });
      }

      if (!cartResp.ok || cartData.error) {
        let erroReal = cartData.message || cartData.error || 'Falha no Melhor Envio (Cart)';
        if (cartData.errors) erroReal += ' - ' + JSON.stringify(cartData.errors);
        return res.status(500).json({ erro: erroReal });
      }

      const meOrderId = cartData.id;

      await fetch('https://melhorenvio.com.br/api/v2/me/shipment/checkout', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${tokenME}`, 'User-Agent': 'Sylvios Records (sylviosrecords.com.br)' },
        body: JSON.stringify({ orders: [String(meOrderId)] })
      });

      await fetch('https://melhorenvio.com.br/api/v2/me/shipment/generate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${tokenME}`, 'User-Agent': 'Sylvios Records (sylviosrecords.com.br)' },
        body: JSON.stringify({ orders: [String(meOrderId)] })
      });

      await supabase.from('pedidos').update({
        status: 'enviado', codigo_rastreio: `ME-${meOrderId}`, atualizado_em: new Date().toISOString()
      }).eq('id', pedidoId);

      return res.json({ ok: true, me_order_id: meOrderId, mensagem: "Etiqueta gerada com sucesso!" });
    } catch (err: any) {
      return res.status(500).json({ erro: err.message });
    }
  }

  return res.status(400).json({ erro: 'Ação inválida' });
}

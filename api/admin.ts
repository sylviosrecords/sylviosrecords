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

  // A emissão automática anterior não verificava o pagamento ou geração no Melhor Envio.
  if (req.method === 'POST' && action === 'etiqueta') {
    return res.status(503).json({ erro: 'Emita a etiqueta diretamente no Melhor Envio. A emissão pelo painel está temporariamente indisponível.' });
  }

  return res.status(400).json({ erro: 'Ação inválida' });
}

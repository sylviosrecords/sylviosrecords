import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Proteção via senha admin
  const authHeader = req.headers.authorization;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!authHeader || authHeader.split(' ')[1] !== adminPass) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  if (req.method === 'GET') {
    const valor = parseInt(process.env.DESCONTO_SITE || '10', 10);
    return res.json({ desconto: valor });
  }

  if (req.method === 'POST') {
    const { desconto } = req.body as { desconto: number };
    if (typeof desconto !== 'number' || desconto < 0 || desconto > 100) {
      return res.status(400).json({ erro: 'Desconto inválido (0-100)' });
    }

    // IMPORTANTE: No Vercel Hobby, não há como persistir env vars via API.
    // Então retornamos a instrução para o usuário atualizar na Vercel Dashboard,
    // e guardamos em memória como resposta de confirmação.
    return res.json({
      ok: true,
      desconto,
      instrucao: `Atualize a variável DESCONTO_SITE=${desconto} no painel da Vercel e faça um Redeploy.`
    });
  }

  return res.status(405).end();
}

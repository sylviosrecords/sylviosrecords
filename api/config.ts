import type { VercelRequest, VercelResponse } from '@vercel/node';

// Desconto padrão do site em % (ex: 10 = 10%)
// Em produção, o valor pode ser sobrescrito pela variável de ambiente DESCONTO_SITE
const DESCONTO_DEFAULT = 10;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const valor = parseInt(process.env.DESCONTO_SITE || String(DESCONTO_DEFAULT), 10);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  return res.json({ desconto: valor });
}

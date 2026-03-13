const fs = require('fs');
const file = 'api/checkout-simular.ts';
let text = fs.readFileSync(file, 'utf8');

text = text.replace(
  /const result = await resend\.emails\.send\(\{[\s\S]*?\}\);/g,
  `const resend = getResend();
    if (process.env.RESEND_API_KEY) {
      const result = await resend.emails.send({
        from: "Sylvio's Records <pedidos@sylviosrecords.com.br>",
        to: pedido.cliente_email,
        subject: \`✅ Pedido Teste \${pedido.id} — Sylvio's Records\`,
        html,
      });
      console.log('[email] Confirmação simulada enviada:', result);
    } else {
      console.log('[email] Simulado sem envio real (falta API KEY):', pedido.id);
    }`
);

text = text.replace(
  /console\.log\('\[email\] Confirmação simulada enviada:', result\);\n/g,
  ''
);

fs.writeFileSync(file, text);
console.log('Fixed');

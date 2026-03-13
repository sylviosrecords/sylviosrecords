import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testMP() {
  const token = process.env.MP_ACCESS_TOKEN;
  console.log("Token a ser usado:", token?.substring(0, 15) + "...");

  const preferencia = {
    items: [
      {
        id: "TEST-ITEM-1",
        title: "Vinil Teste de Conexão",
        quantity: 1,
        unit_price: 15.00,
        currency_id: 'BRL',
      }
    ],
    payer: {
      name: "Rafael",
      surname: "Teste",
      email: "test@example.com",
    },
  };

  try {
    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(preferencia)
    });

    const data = await res.json();
    if (res.ok) {
      console.log("✅ SUCESSO! Preferência criada.");
      console.log("ID:", data.id);
      console.log("URL de Pagamento:", data.init_point);
    } else {
      console.error("❌ ERRO DA API MP:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch(e) {
    console.error("Falha na requisição:", e);
  }
}

testMP();

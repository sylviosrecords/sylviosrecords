import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testME() {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  console.log("Token a ser usado:", token?.substring(0, 15) + "...");

  const body = {
    from: { postal_code: '01310100' },
    to: { postal_code: '20090000' }, // Rio de Janeiro
    package: {
      height: 5,
      width: 30,
      length: 30,
      weight: 0.35,
    },
    options: { receipt: false, own_hand: false },
    services: '1,2,3,4,7,8',
  };

  try {
    const resp = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Sylvios Records (sylviosrecords.com.br)',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (resp.ok) {
      console.log("✅ FRETE SUCESSO!");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error("❌ ERRO DA API MELHOR ENVIO:");
      console.error(JSON.stringify(data, null, 2));
    }
  } catch(e) {
    console.error("Falha na requisição:", e);
  }
}

testME();

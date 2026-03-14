import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getAccessToken(): Promise<string> {
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.ML_APP_ID!,
      client_secret: process.env.ML_SECRET!,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function testarApagar() {
  try {
    const token = await getAccessToken();
    console.log('Token obtido com sucesso. Testando permissão de escrita...');
    
    // Pegar o item mais recente do vendedor
    const SELLER_ID = '78078427';
    const idsRes = await fetch(`https://api.mercadolibre.com/users/${SELLER_ID}/items/search?limit=1&status=active`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const idsData = await idsRes.json();
    const itemId = idsData.results[0];
    
    console.log('Testando alterar o anúncio:', itemId);
    
    // Tentar pausar o anúncio (mudança de status)
    const updateRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status: "paused" })
    });
    
    const updateData = await updateRes.json();
    console.log('Status da resposta (PUT):', updateRes.status);
    console.log('Resposta do ML:', updateData);
    
    if (updateRes.ok) {
        console.log('SUCESSO! A API permitiu alterar o anúncio. Reativando para não prejudicar a venda...');
        await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: "active" })
        });
    } else {
        console.log('FALHA ESPERADA: Sem permissão de escrita com este tipo de token.');
    }
    
  } catch (err) {
    console.error('Erro no script:', err);
  }
}

testarApagar();

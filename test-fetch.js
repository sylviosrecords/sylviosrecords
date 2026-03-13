const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('https://sylviosrecords-zvgrb5res-sylviosrecords-8222s-projects.vercel.app/api/checkout-simular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens: [],
        comprador: { nome: 'TEST', email: 'test@test.com', cpf: '123', telefone: '123' },
        frete: { nome: 'SEDEX', preco: 10 }
      })
    });
    
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('BODY:', text.substring(0, 1000));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();

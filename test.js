import http from 'node:http';

const data = JSON.stringify({
  itens: [],
  comprador: { nome: 'TEST', email: 'test@test.com', cpf: '123', telefone: '123' },
  frete: { nome: 'SEDEX', preco: 10 }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/checkout-simular',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log('STATUS:', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('BODY:', body.substring(0, 1000)));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();

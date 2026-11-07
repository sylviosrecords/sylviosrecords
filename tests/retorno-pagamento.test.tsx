import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { separarRota } from '../src/hooks/useRoute';
import { estadoDoPedido, PaginaPedidoSucesso, PaginaPedidoFalha, PaginaPedidoPendente } from '../src/pages/PaginasPedido';

test('retornos mantêm os parâmetros separados do caminho', () => {
  for (const nome of ['sucesso', 'falha', 'pendente']) {
    assert.deepEqual(separarRota(`/pedido/${nome}?pedido=abc&status=approved`), { caminho: `/pedido/${nome}`, busca: 'pedido=abc&status=approved' });
    assert.deepEqual(separarRota(`/pedido/${nome}`), { caminho: `/pedido/${nome}`, busca: '' });
  }
  assert.equal(new URLSearchParams(separarRota('/busca?q=rock').busca).get('q'), 'rock');
});

test('somente estados confirmados apresentam pagamento aprovado', () => {
  for (const status of ['pago', 'enviado', 'entregue']) assert.equal(estadoDoPedido(status), 'pago');
  assert.equal(estadoDoPedido('pendente'), 'pendente');
  assert.equal(estadoDoPedido('cancelado'), 'cancelado');
  for (const status of [undefined, null, 'approved', 'erro']) assert.equal(estadoDoPedido(status), 'indisponivel');
});

test('páginas de retorno não afirmam aprovação antes de consultar o pedido', () => {
  (globalThis as any).window = { location: { search: '?pedido=abc1234567&status=approved' } };
  for (const Pagina of [PaginaPedidoSucesso, PaginaPedidoFalha, PaginaPedidoPendente]) {
    const html = renderToStaticMarkup(<Pagina navigate={() => {}} />);
    assert.match(html, /Verificando seu pagamento/);
    assert.doesNotMatch(html, /Pagamento confirmado!/);
    assert.match(html, /abc1234567/);
  }
  (globalThis as any).window = { location: { search: '' } };
  const html = renderToStaticMarkup(<PaginaPedidoSucesso navigate={() => {}} />);
  assert.match(html, /Não foi possível confirmar o pagamento/);
  assert.doesNotMatch(html, /Pagamento confirmado!/);
});

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ItemCarrinho, Produto } from '../types';

const MAX_POR_ITEM = 5; // máximo por item quando não há estoque definido

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  total: number;
  totalItens: number;
  adicionarItem: (produto: Produto, quantidade?: number) => void;
  removerItem: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  isAberto: boolean;
  abrirCarrinho: () => void;
  fecharCarrinho: () => void;
}

export const CarrinhoCtx = createContext<CarrinhoContextType | null>(null);

export function useCarrinho() {
  const ctx = useContext(CarrinhoCtx);
  if (!ctx) throw new Error('useCarrinho deve ser usado dentro de CarrinhoProvider');
  return ctx;
}

export function useCarrinhoProvider(): CarrinhoContextType {
  const [itens, setItens] = useState<ItemCarrinho[]>(() => {
    try {
      const salvo = localStorage.getItem('sylvios_carrinho');
      return salvo ? JSON.parse(salvo) : [];
    } catch {
      return [];
    }
  });

  const [isAberto, setIsAberto] = useState(false);

  // Persiste no localStorage sempre que o carrinho mudar
  useEffect(() => {
    localStorage.setItem('sylvios_carrinho', JSON.stringify(itens));
  }, [itens]);

  const total = itens.reduce((acc, item) => acc + item.produto.preco * item.quantidade, 0);
  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const adicionarItem = (produto: Produto, quantidade = 1) => {
    setItens(prev => {
      const existente = prev.find(i => i.produto.id === produto.id);
      const limite = produto.estoque != null && produto.estoque > 0
        ? Math.min(produto.estoque, MAX_POR_ITEM)
        : MAX_POR_ITEM;
      if (existente) {
        const novaQtd = Math.min(existente.quantidade + quantidade, limite);
        return prev.map(i =>
          i.produto.id === produto.id ? { ...i, quantidade: novaQtd } : i
        );
      }
      return [...prev, { produto, quantidade: Math.min(quantidade, limite) }];
    });
    setIsAberto(true);
  };

  const removerItem = (produtoId: string) => {
    setItens(prev => prev.filter(i => i.produto.id !== produtoId));
  };

  const alterarQuantidade = (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) { removerItem(produtoId); return; }
    setItens(prev =>
      prev.map(i => {
        if (i.produto.id !== produtoId) return i;
        const limite = i.produto.estoque != null && i.produto.estoque > 0
          ? Math.min(i.produto.estoque, MAX_POR_ITEM)
          : MAX_POR_ITEM;
        return { ...i, quantidade: Math.min(quantidade, limite) };
      })
    );
  };

  const limparCarrinho = () => setItens([]);

  return {
    itens,
    total,
    totalItens,
    adicionarItem,
    removerItem,
    alterarQuantidade,
    limparCarrinho,
    isAberto,
    abrirCarrinho: () => setIsAberto(true),
    fecharCarrinho: () => setIsAberto(false),
  };
}

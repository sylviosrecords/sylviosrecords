import { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { extrairIdML } from '../utils';

// ── useProdutos — lista paginada da home ──────────────────────────────────────
export function useProdutos(categoria: string, busca: string, pagina: number) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const limite = 10;

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({
          pagina: String(pagina), limite: String(limite),
          ...(categoria !== 'todos' && { categoria }),
          ...(busca && { busca }),
        });
        const res  = await fetch(`/api/produtos?${params}`);
        const data = await res.json();
        if (!cancelado) { setProdutos(data.produtos || []); setTotal(data.total || 0); }
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [categoria, busca, pagina]);

  return { produtos, total, loading, error, limite };
}

// ── useBuscaPesquisa — resultados de busca ────────────────────────────────────
export function useBuscaPesquisa(q: string, sort: string, pagina: number) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const limite = 20;

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const params = new URLSearchParams({ q, sort, pagina: String(pagina) });
        const res  = await fetch(`/api/busca?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelado) { setProdutos(data.produtos || []); setTotal(data.total || 0); }
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [q, sort, pagina]);

  return { produtos, total, loading, error, limite };
}

// ── useProduto — detalhe de um produto ───────────────────────────────────────
export function useProduto(slugComposto: string) {
  const id = extrairIdML(slugComposto);
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const res  = await fetch(`/api/item?id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelado) setProduto(data);
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [id]);

  return { produto, loading, error };
}

// ── useDescricao — descrição IA via Gemini ────────────────────────────────────
export function useDescricao(id: string) {
  const [descricao, setDescricao] = useState('');
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    const carregar = async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/descricao?id=${encodeURIComponent(id)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelado) setDescricao(data.descricao || '');
      } catch { }
      finally { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [id]);

  return { descricao, loading };
}

// ── useProdutosColecao — produtos de uma coleção ──────────────────────────────
export function useProdutosColecao(ids: string[]) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const idsValidos = ids.filter(id => /^MLB\d+/i.test(id));

  useEffect(() => {
    if (!idsValidos.length) { setLoading(false); return; }
    let cancelado = false;
    const carregar = async () => {
      setLoading(true); setError(false);
      try {
        const res  = await fetch(`/api/colecao?ids=${idsValidos.join(',')}`);
        const data = await res.json();
        if (!cancelado) setProdutos(data.produtos || []);
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsValidos.join(',')]);

  return { produtos, loading, error };
}

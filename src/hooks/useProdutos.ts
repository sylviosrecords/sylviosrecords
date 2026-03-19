import { useState, useEffect } from 'react';
import type { Produto } from '../types';
import { extrairIdML } from '../utils';

// ── Cache Global ──────────────────────────────────────────────────────────────
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

async function fetchComCache(url: string) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}

// ── useProdutos — lista paginada da home ──────────────────────────────────────
export function useProdutos(categoria: string, busca: string, pagina: number, genero: string = '') {
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
          ...(genero && { genero }),
        });
        const url = `/api/produtos?${params}`;
        
        // Verifica cache de forma síncrona visualmente rapida antes de mostrar loading se der
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setProdutos(cached.data.produtos || []);
          setTotal(cached.data.total || 0);
          setLoading(false);
          return;
        }

        const data = await fetchComCache(url);
        if (!cancelado) { setProdutos(data.produtos || []); setTotal(data.total || 0); }
      } catch { if (!cancelado) setError(true); }
      finally  { if (!cancelado) setLoading(false); }
    };
    carregar();
    return () => { cancelado = true; };
  }, [categoria, busca, pagina, genero]);

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
        const url = `/api/busca?${params}`;
        
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setProdutos(cached.data.produtos || []);
          setTotal(cached.data.total || 0);
          setLoading(false);
          return;
        }

        const data = await fetchComCache(url);
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
        const url = `/api/item?id=${encodeURIComponent(id)}`;
        
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setProduto(cached.data);
          setLoading(false);
          return;
        }

        const data = await fetchComCache(url);
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
        const url = `/api/descricao?id=${encodeURIComponent(id)}`;
        
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setDescricao(cached.data.descricao || '');
          setLoading(false);
          return;
        }

        const data = await fetchComCache(url);
        if (!cancelado) setDescricao(data.descricao || '');
      } catch { } // ignora silentemente error pra descricao
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
        const chaveIds = idsValidos.join(',');
        const url = `/api/colecao?ids=${chaveIds}`;
        
        const cached = cache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setProdutos(cached.data.produtos || []);
          setLoading(false);
          return;
        }

        const data = await fetchComCache(url);
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

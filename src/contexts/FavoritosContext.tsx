import React, { useState } from 'react';

// ── Hook de favoritos ─────────────────────────────────────────────────────────
const LS_KEY = 'sr_favoritos';

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  });

  const toggle = (id: string) => {
    setFavoritos(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const isFav = (id: string) => favoritos.includes(id);
  return { favoritos, toggle, isFav };
}

// ── Contexto de favoritos ─────────────────────────────────────────────────────
export const FavCtx = React.createContext<ReturnType<typeof useFavoritos>>({
  favoritos: [],
  toggle: () => {},
  isFav: () => false,
});

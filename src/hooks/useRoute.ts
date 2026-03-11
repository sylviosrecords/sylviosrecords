import { useState, useEffect } from 'react';

// ── Hook de roteamento SPA ────────────────────────────────────────────────────
export function useRoute() {
  const [route, setRoute] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const fn = () => setRoute(window.location.pathname + window.location.search);
    window.addEventListener('popstate', fn);
    return () => window.removeEventListener('popstate', fn);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return { route, navigate };
}

import React, { createContext, useContext, useEffect, useState } from 'react';

interface DescontoCtxType {
  desconto: number; // ex: 10 = 10%
  carregando: boolean;
}

export const DescontoCtx = createContext<DescontoCtxType>({ desconto: 10, carregando: false });

export function useDesconto() {
  return useContext(DescontoCtx);
}

export function DescontoProvider({ children }: { children: React.ReactNode }) {
  const [desconto, setDesconto] = useState(10);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.ok ? r.json() : { desconto: 10 })
      .then((data: { desconto: number }) => setDesconto(data.desconto ?? 10))
      .catch(() => setDesconto(10))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <DescontoCtx.Provider value={{ desconto, carregando }}>
      {children}
    </DescontoCtx.Provider>
  );
}

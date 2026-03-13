import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { useFavoritos, FavCtx } from './contexts/FavoritosContext';
import { useCarrinhoProvider, CarrinhoCtx } from './contexts/CarrinhoContext';
import { NavSecundaria } from './components/NavSecundaria';
import { CarrinhoDrawer } from './components/CarrinhoDrawer';

// Páginas (Lazy Loading)
const PaginaProduto   = lazy(() => import('./pages/PaginaProduto').then(m => ({ default: m.PaginaProduto })));
const PaginaColecao   = lazy(() => import('./pages/PaginaColecao').then(m => ({ default: m.PaginaColecao })));
const PaginaArtigo    = lazy(() => import('./pages/PaginaArtigo').then(m => ({ default: m.PaginaArtigo })));
const PaginaColecoesList = lazy(() => import('./pages/PaginaColecoesList').then(m => ({ default: m.PaginaColecoesList })));
const PaginaBlogList  = lazy(() => import('./pages/PaginaBlogList').then(m => ({ default: m.PaginaBlogList })));
const PaginaCatalogo  = lazy(() => import('./pages/PaginaCatalogo').then(m => ({ default: m.PaginaCatalogo })));
const PaginaBusca     = lazy(() => import('./pages/PaginaBusca').then(m => ({ default: m.PaginaBusca })));
const PaginaNovidades = lazy(() => import('./pages/PaginaNovidades').then(m => ({ default: m.PaginaNovidades })));
const Pagina404       = lazy(() => import('./pages/Pagina404').then(m => ({ default: m.Pagina404 })));
const PaginaFavoritos = lazy(() => import('./pages/PaginaFavoritos').then(m => ({ default: m.PaginaFavoritos })));

// Novas páginas da loja própria
const PaginaCarrinho     = lazy(() => import('./pages/PaginaCarrinho').then(m => ({ default: m.PaginaCarrinho })));
const PaginaCheckout     = lazy(() => import('./pages/PaginaCheckout').then(m => ({ default: m.PaginaCheckout })));
const PaginaPedido       = lazy(() => import('./pages/PaginaPedido').then(m => ({ default: m.PaginaPedido })));
const PaginaPedidoSucesso  = lazy(() => import('./pages/PaginasPedido').then(m => ({ default: m.PaginaPedidoSucesso })));
const PaginaPedidoFalha    = lazy(() => import('./pages/PaginasPedido').then(m => ({ default: m.PaginaPedidoFalha })));
const PaginaPedidoPendente = lazy(() => import('./pages/PaginasPedido').then(m => ({ default: m.PaginaPedidoPendente })));

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#080808] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const { route, navigate } = useRoute();
  const favCtxValue = useFavoritos();
  const carrinhoCtxValue = useCarrinhoProvider();

  // Estado do frete escolhido — passa entre PaginaCarrinho → PaginaCheckout
  const [freteCheckout, setFreteCheckout] = useState<{ nome: string; preco: number } | null>(null);

  const isProduto      = route.startsWith('/produto/');
  const isColecao      = route.startsWith('/colecao/');
  const isArtigo       = route.startsWith('/artigo/');
  const isBusca        = route.startsWith('/busca');
  const isColecoesList = route === '/colecoes';
  const isBlogList     = route === '/blog';
  const isNovidades    = route === '/novidades';
  const isFavoritos    = route === '/favoritos';
  const isCarrinho     = route === '/carrinho';
  const isCheckout     = route === '/checkout';
  const isPedido       = route.startsWith('/pedido/') && !route.startsWith('/pedido/sucesso') && !route.startsWith('/pedido/falha') && !route.startsWith('/pedido/pendente');
  const isPedidoSucesso  = route === '/pedido/sucesso';
  const isPedidoFalha    = route === '/pedido/falha';
  const isPedidoPendente = route === '/pedido/pendente';
  const pedidoId = isPedido ? route.replace('/pedido/', '') : '';

  const slugProduto = isProduto ? route.replace('/produto/', '') : '';
  const slugColecao = isColecao ? route.replace('/colecao/', '') : '';
  const slugArtigo  = isArtigo  ? route.replace('/artigo/', '') : '';
  const buscaQuery  = isBusca   ? new URLSearchParams(route.split('?')[1]).get('q') || '' : '';

  const isSecundaria = isProduto || isColecao || isArtigo || isColecoesList || isBlogList
    || isBusca || isNovidades || isFavoritos || isCarrinho || isCheckout
    || isPedido || isPedidoSucesso || isPedidoFalha || isPedidoPendente;

  const wrap = (key: string, el: React.ReactNode) => (
    <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {el}
    </motion.div>
  );

  return (
    <CarrinhoCtx.Provider value={carrinhoCtxValue}>
      <FavCtx.Provider value={favCtxValue}>

        {/* Drawer do carrinho — disponível em qualquer página */}
        <CarrinhoDrawer navigate={navigate} />

        {isSecundaria && <NavSecundaria navigate={navigate} />}

        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            {isProduto       ? wrap('produto',    <PaginaProduto    slugComposto={slugProduto} navigate={navigate} />) :
             isColecao       ? wrap('colecao',    <PaginaColecao    slug={slugColecao}          navigate={navigate} />) :
             isArtigo        ? wrap('artigo',     <PaginaArtigo     slug={slugArtigo}            navigate={navigate} />) :
             isColecoesList  ? wrap('colecoeslist', <PaginaColecoesList navigate={navigate} />) :
             isBlogList      ? wrap('bloglist',   <PaginaBlogList   navigate={navigate} />) :
             isFavoritos     ? wrap('favoritos',  <PaginaFavoritos  navigate={navigate} />) :
             isNovidades     ? wrap('novidades',  <PaginaNovidades  navigate={navigate} />) :
             isBusca         ? wrap('busca',      <PaginaBusca      buscaQuery={buscaQuery} navigate={navigate} />) :
             isCarrinho      ? wrap('carrinho',   <PaginaCarrinho   navigate={navigate} />) :
             isCheckout      ? wrap('checkout',   <PaginaCheckout   navigate={navigate} freteNome={freteCheckout?.nome} fretePreco={freteCheckout?.preco} />) :
             isPedido        ? wrap('pedido',     <PaginaPedido     pedidoId={pedidoId} navigate={navigate} />) :
             isPedidoSucesso ? wrap('sucesso',    <PaginaPedidoSucesso navigate={navigate} />) :
             isPedidoFalha   ? wrap('falha',      <PaginaPedidoFalha   navigate={navigate} />) :
             isPedidoPendente? wrap('pendente',   <PaginaPedidoPendente navigate={navigate} />) :
             (
               wrap('home', route === '/' ? <PaginaCatalogo navigate={navigate} /> : <Pagina404 navigate={navigate} />)
             )}
          </AnimatePresence>
        </Suspense>

      </FavCtx.Provider>
    </CarrinhoCtx.Provider>
  );
}

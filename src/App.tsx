import React, { Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { useFavoritos, FavCtx } from './contexts/FavoritosContext';
import { NavSecundaria } from './components/NavSecundaria';

// Páginas (Lazy Loading)
const PaginaProduto = lazy(() => import('./pages/PaginaProduto').then(m => ({ default: m.PaginaProduto })));
const PaginaColecao = lazy(() => import('./pages/PaginaColecao').then(m => ({ default: m.PaginaColecao })));
const PaginaArtigo  = lazy(() => import('./pages/PaginaArtigo').then(m => ({ default: m.PaginaArtigo })));
const PaginaColecoesList = lazy(() => import('./pages/PaginaColecoesList').then(m => ({ default: m.PaginaColecoesList })));
const PaginaBlogList = lazy(() => import('./pages/PaginaBlogList').then(m => ({ default: m.PaginaBlogList })));
const PaginaCatalogo = lazy(() => import('./pages/PaginaCatalogo').then(m => ({ default: m.PaginaCatalogo })));
const PaginaBusca   = lazy(() => import('./pages/PaginaBusca').then(m => ({ default: m.PaginaBusca })));
const PaginaNovidades = lazy(() => import('./pages/PaginaNovidades').then(m => ({ default: m.PaginaNovidades })));
const Pagina404     = lazy(() => import('./pages/Pagina404').then(m => ({ default: m.Pagina404 })));
const PaginaFavoritos = lazy(() => import('./pages/PaginaFavoritos').then(m => ({ default: m.PaginaFavoritos })));

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#080808] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  const { route, navigate } = useRoute();
  const favCtxValue = useFavoritos();

  const isProduto = route.startsWith('/produto/');
  const isColecao = route.startsWith('/colecao/');
  const isArtigo  = route.startsWith('/artigo/');
  const isBusca   = route.startsWith('/busca');
  const isColecoesList = route === '/colecoes';
  const isBlogList = route === '/blog';
  const isNovidades = route === '/novidades';
  const isFavoritos = route === '/favoritos';

  const slugProduto = isProduto ? route.replace('/produto/', '') : '';
  const slugColecao = isColecao ? route.replace('/colecao/', '') : '';
  const slugArtigo  = isArtigo  ? route.replace('/artigo/',  '') : '';
  const buscaQuery  = isBusca   ? new URLSearchParams(route.split('?')[1]).get('q') || '' : '';

  const isSecundaria = isProduto || isColecao || isArtigo || isColecoesList || isBlogList || isBusca || isNovidades || isFavoritos;


  return (
    <FavCtx.Provider value={favCtxValue}>

      {isSecundaria && <NavSecundaria navigate={navigate}/>}

      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait">
          {isProduto ? (
            <motion.div key="produto" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaProduto slugComposto={slugProduto} navigate={navigate}/>
            </motion.div>
          ) : isColecao ? (
            <motion.div key="colecao" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaColecao slug={slugColecao} navigate={navigate}/>
            </motion.div>
          ) : isArtigo ? (
            <motion.div key="artigo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaArtigo slug={slugArtigo} navigate={navigate}/>
            </motion.div>
          ) : isColecoesList ? (
            <motion.div key="colecoeslist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaColecoesList navigate={navigate}/>
            </motion.div>
          ) : isBlogList ? (
            <motion.div key="bloglist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaBlogList navigate={navigate}/>
            </motion.div>
          ) : isFavoritos ? (
            <motion.div key="favoritos" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaFavoritos navigate={navigate}/>
            </motion.div>
          ) : isNovidades ? (
            <motion.div key="novidades" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaNovidades navigate={navigate}/>
            </motion.div>
          ) : isBusca ? (
            <motion.div key="busca" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              <PaginaBusca buscaQuery={buscaQuery} navigate={navigate}/>
            </motion.div>
          ) : (
            <motion.div key="catalogo" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.2}}>
              {route === '/' ? <PaginaCatalogo navigate={navigate}/> : <Pagina404 navigate={navigate}/>}
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    </FavCtx.Provider>
  );
}

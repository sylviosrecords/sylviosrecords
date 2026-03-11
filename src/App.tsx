import { motion, AnimatePresence } from 'motion/react';
import { useRoute } from './hooks/useRoute';
import { useFavoritos, FavCtx } from './contexts/FavoritosContext';
import { NavSecundaria } from './components/NavSecundaria';

// Páginas
import { PaginaProduto } from './pages/PaginaProduto';
import { PaginaColecao } from './pages/PaginaColecao';
import { PaginaArtigo } from './pages/PaginaArtigo';
import { PaginaColecoesList } from './pages/PaginaColecoesList';
import { PaginaBlogList } from './pages/PaginaBlogList';
import { PaginaCatalogo } from './pages/PaginaCatalogo';
import { PaginaBusca } from './pages/PaginaBusca';
import { PaginaNovidades } from './pages/PaginaNovidades';
import { Pagina404 } from './pages/Pagina404';
import { PaginaFavoritos } from './pages/PaginaFavoritos';

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
    </FavCtx.Provider>
  );
}

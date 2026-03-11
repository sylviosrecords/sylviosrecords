import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { STORE_NAME } from '../config';
import { useBuscaPesquisa } from '../hooks/useProdutos';
import { SkeletonCard } from '../components/SkeletonCard';
import { ProdutoCard } from '../components/ProdutoCard';

export function PaginaBusca({ buscaQuery, navigate }: { buscaQuery: string; navigate: (path: string) => void }) {
  const [sort, setSort] = useState('relevance');
  const [pagina, setPagina] = useState(1);
  const { produtos, total, loading, error, limite } = useBuscaPesquisa(buscaQuery, sort, pagina);
  const totalPaginas = Math.ceil(total / limite);

  useEffect(() => {
    document.title = `Busca: ${buscaQuery} — ${STORE_NAME}`;
    setPagina(1);
  }, [buscaQuery]);

  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 pt-28 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-4 text-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/> Voltar para Home
          </button>
          <h1 className="font-bebas text-5xl md:text-6xl text-white">
            Resultados para <span className="sr-gradient-text">"{buscaQuery}"</span>
          </h1>
          {!loading && <p className="text-zinc-500 text-sm mt-2">{total.toLocaleString('pt-BR')} produtos encontrados</p>}
        </div>

        {/* Filtros de Ordenação */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'relevance', label: 'Mais Relevantes' },
            { id: 'price_asc', label: 'Menor Preço' },
            { id: 'price_desc', label: 'Maior Preço' }
          ].map(opt => (
            <button key={opt.id} onClick={() => { setSort(opt.id); setPagina(1); }}
              className={`flex-none px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                sort === opt.id ? 'sr-gradient text-white shadow-lg shadow-red-950/30' : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}>{opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({length:10}).map((_,i) => <SkeletonCard key={i}/>)}
          </div>
        ) : error ? (
          <div className="text-center py-32"><p className="text-zinc-500">Erro ao carregar os resultados.</p></div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-32">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4"/>
            <p className="text-zinc-500">Nenhum produto encontrado na loja oficial para "{buscaQuery}".</p>
          </div>
        ) : (
          <>
            <motion.div key={`${buscaQuery}-${sort}-${pagina}`}
              initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.3}}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {produtos.map(p => <ProdutoCard key={p.id} p={p} navigate={navigate}/>)}
            </motion.div>
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-3 mt-14">
                <button onClick={()=>{setPagina(p=>Math.max(1,p-1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={pagina===1}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                  <ChevronLeft className="w-5 h-5"/>
                </button>
                <div className="flex gap-2">
                  {Array.from({length:Math.min(totalPaginas,5)},(_,i)=>{
                    const p = pagina<=3 ? i+1 : pagina-2+i;
                    if (p<1||p>totalPaginas) return null;
                    return (
                      <button key={p} onClick={()=>{setPagina(p);window.scrollTo({top:0,behavior:'smooth'});}}
                        className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${p===pagina?'sr-gradient text-white shadow-lg':'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10'}`}>{p}
                      </button>
                    );
                  })}
                </div>
                <button onClick={()=>{setPagina(p=>Math.min(totalPaginas,p+1));window.scrollTo({top:0,behavior:'smooth'});}} disabled={pagina===totalPaginas}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-30 transition-all">
                  <ChevronRight className="w-5 h-5"/>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

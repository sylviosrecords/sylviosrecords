import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Disc } from 'lucide-react';
import { STORE_NAME } from '../config';

export function Pagina404({ navigate }: { navigate: (path: string) => void }) {
  useEffect(() => {
    document.title = `Página não encontrada — ${STORE_NAME}`;
    return () => { document.title = STORE_NAME; };
  }, []);
  return (
    <div className="min-h-screen bg-[#080808] text-zinc-100 flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4}}>
        <Disc className="w-20 h-20 text-zinc-800 mx-auto mb-6 spin-vinyl"/>
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-3">Erro 404</p>
        <h1 className="font-bebas text-6xl md:text-8xl text-white mb-4">Página não encontrada</h1>
        <p className="text-zinc-500 text-lg mb-10 max-w-md">
          Parece que esse lado do disco está em branco. A página que você procurou não existe.
        </p>
        <button onClick={() => navigate('/')}
          className="sr-gradient text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition-all shadow-xl shadow-red-950/30 flex items-center gap-2 mx-auto">
          <ArrowLeft className="w-5 h-5"/> Voltar para a Home
        </button>
      </motion.div>
    </div>
  );
}

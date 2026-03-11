import { motion } from 'motion/react';
import { GENRES } from '../config';

export function GenreTicker({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="overflow-hidden border-y border-white/6 py-3 bg-white/[0.02]">
      <motion.div className="flex gap-10 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }} transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}>
        {[...GENRES,...GENRES,...GENRES,...GENRES].map((g, i) => (
          <button key={i} onClick={() => navigate(`/busca?q=${encodeURIComponent(g)}`)}
            className="text-xs font-black uppercase tracking-widest flex items-center gap-3 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer">
            <span className="w-1 h-1 rounded-full bg-gradient-to-r from-red-500 to-blue-500 inline-block"/>{g}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

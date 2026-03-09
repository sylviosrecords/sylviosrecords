/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Disc, 
  Film, 
  Tv, 
  Package, 
  ShieldCheck, 
  Truck, 
  History, 
  ExternalLink,
  ChevronRight,
  Star,
  Music
} from 'lucide-react';

// Design Recipe: Dark Luxury / Specialist Tool
// Mood: Professional, Trustworthy, Collector-focused

const STORE_NAME = "Sylvios Records";
const STORE_LINK = "https://www.mercadolivre.com.br/pagina/sylviosrecords";
const STORE_LOGO = "https://lh3.googleusercontent.com/d/1q6YyW7bYCceOyChffF9LhNuVLhmrGjGA";

const LINKS = {
  ALL: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/#component=menu_corridors&tracking_id=0632775d6426985ea171cf11e4d9bcd2&label=Todos+os+produtos&global_position=1",
  MUSIC: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/musica/?tracking_id=0632775d6426985ea171cf11e4d9bcd2#client=HOME&component_id=menu_corridors&component=menu_corridors&label=Música&tracking_id=0632775d6426985ea171cf11e4d9bcd2&global_position=1",
  MOVIES: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/filmes-fisicos/?tracking_id=0632775d6426985ea171cf11e4d9bcd2#client=HOME&component_id=menu_corridors&component=menu_corridors&label=Filmes+Físicos&tracking_id=0632775d6426985ea171cf11e4d9bcd2&global_position=1",
  SERIES: "https://lista.mercadolivre.com.br/pagina/sylviosrecords/lista/musica-filmes-seriados/seriados/?tracking_id=0632775d6426985ea171cf11e4d9bcd2#client=HOME&component_id=menu_corridors&component=menu_corridors&label=Seriados&tracking_id=0632775d6426985ea171cf11e4d9bcd2&global_position=1"
};

const GENRES = [
  { name: 'Rock', color: 'bg-red-500' },
  { name: 'Metal', color: 'bg-blue-600' },
  { name: 'Clássico', color: 'bg-zinc-700' },
  { name: 'Grunge', color: 'bg-zinc-800' },
  { name: 'Punk', color: 'bg-red-700' },
  { name: 'MPB', color: 'bg-blue-500' },
  { name: 'Moda de Viola', color: 'bg-amber-700' }
];

const CATEGORIES = [
  {
    id: 'cds',
    title: 'CDs',
    icon: <Music className="w-6 h-6" />,
    description: 'Álbuns raros, edições nacionais e importadas de diversos gêneros.',
    image: 'https://lh3.googleusercontent.com/d/18e1pt4ENEMhUprWFVp7aZFIPCCrsf9Yy',
    link: LINKS.MUSIC
  },
  {
    id: 'dvds',
    title: 'DVDs',
    icon: <Film className="w-6 h-6" />,
    description: 'Filmes clássicos, shows inesquecíveis e documentários musicais.',
    image: 'https://lh3.googleusercontent.com/d/1pFi7VQ9y6deX7sGfbFG40aIcATqUt70l',
    link: LINKS.MOVIES
  },
  {
    id: 'blurays',
    title: 'Blu-Rays',
    icon: <Disc className="w-6 h-6" />,
    description: 'A melhor qualidade de imagem e som para sua coleção.',
    image: 'https://lh3.googleusercontent.com/d/1-hQ6SFPr7WqGZ7eozTwZjtNhmgP1c9Mp',
    link: LINKS.MOVIES
  },
  {
    id: 'boxes',
    title: 'Boxes & Especiais',
    icon: <Package className="w-6 h-6" />,
    description: 'Coleções completas, edições de luxo e itens para colecionadores.',
    image: 'https://lh3.googleusercontent.com/d/1bGasfQk_kK23kiEUYoT_8h5Maq6agUUU',
    link: LINKS.ALL
  }
];

const FEATURE_CARDS = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-red-500" />,
    title: '100% Originais',
    description: 'Garantia de procedência e qualidade em cada disco.'
  },
  {
    icon: <History className="w-8 h-8 text-blue-500" />,
    title: 'Desde 2005',
    description: 'Quase duas décadas de tradição e confiança no Mercado Livre.'
  },
  {
    icon: <Truck className="w-8 h-8 text-red-500" />,
    title: 'Envio Seguro',
    description: 'Embalagem profissional para que sua mídia chegue perfeita.'
  }
];

const FAQ = [
  {
    q: "Os produtos são originais?",
    a: "Sim, trabalhamos exclusivamente com mídias físicas 100% originais, nacionais e importadas."
  },
  {
    q: "Como é feito o envio?",
    a: "Utilizamos embalagens reforçadas com plástico bolha e papelão rígido para garantir que o estojo e o disco cheguem intactos."
  },
  {
    q: "Vocês aceitam encomendas?",
    a: "Sempre renovamos nosso estoque. Se procura algo específico, entre em contato conosco através do campo de perguntas no Mercado Livre."
  }
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-red-500/30 relative overflow-x-hidden">
      {/* Background Logo Decoration */}
      <div className="fixed -right-[30vw] top-1/2 -translate-y-1/2 w-[150vw] h-[150vh] opacity-[0.02] pointer-events-none z-0 blur-[2px]">
        <img 
          src={STORE_LOGO} 
          alt="" 
          className="w-full h-full object-contain object-right"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 flex items-center justify-center">
              <img 
                src={STORE_LOGO} 
                alt={STORE_NAME} 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-red-600', 'to-blue-700', 'rounded-lg');
                  const icon = document.createElement('div');
                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-disc text-white animate-spin-slow"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2"/></svg>';
                  e.currentTarget.parentElement?.appendChild(icon.firstChild as Node);
                }}
              />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase italic hidden sm:block">{STORE_NAME}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
            <a href="#categorias" className="hover:text-white transition-colors">Categorias</a>
            <a href="#generos" className="hover:text-white transition-colors">Gêneros</a>
            <a href="#diferenciais" className="hover:text-white transition-colors">Diferenciais</a>
          </div>
          <a 
            href={STORE_LINK} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
          >
            Ver no Mercado Livre
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Star className="w-3 h-3 fill-current" />
              Mercado Líder Platinum
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8">
              Sua coleção merece o <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">melhor da música.</span>
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              De Rock e Metal a MPB e Moda de Viola. Na <span className="text-white font-semibold">{STORE_NAME}</span>, cada disco é uma história preservada desde 2005.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href={LINKS.ALL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center gap-2"
              >
                Explorar Coleção
                <ChevronRight className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-white/5">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                      {i === 3 ? '+15k' : ''}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="font-bold">+15.000 vendas</div>
                  <div className="text-zinc-500 text-xs">Clientes satisfeitos</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Genres */}
      <section id="generos" className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <span className="text-zinc-500 text-sm font-bold uppercase tracking-widest self-center mr-4">Gêneros:</span>
            {GENRES.map((genre, idx) => (
              <motion.span 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:border-white/30 transition-colors cursor-default`}
              >
                {genre.name}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section id="categorias" className="py-24 px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <h2 className="text-4xl font-bold mb-12 italic tracking-tight">O que você procura?</h2>
              <div className="grid gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className={`group relative flex items-center gap-6 p-6 rounded-3xl transition-all text-left ${
                      activeCategory.id === cat.id 
                      ? 'bg-gradient-to-r from-red-600 to-blue-700 text-white shadow-2xl shadow-red-900/40' 
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      activeCategory.id === cat.id ? 'bg-white/20' : 'bg-zinc-800'
                    }`}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{cat.title}</div>
                      <div className={`text-sm ${activeCategory.id === cat.id ? 'text-red-100' : 'text-zinc-500'}`}>
                        {cat.description}
                      </div>
                    </div>
                    <ChevronRight className={`ml-auto w-5 h-5 transition-transform ${
                      activeCategory.id === cat.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="w-full md:w-1/2 relative aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full rounded-[40px] overflow-hidden border border-white/10 shadow-2xl"
                >
                  <img 
                    src={activeCategory.image} 
                    alt={activeCategory.title}
                    className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px]">
                    <div className="text-3xl font-bold mb-2">{activeCategory.title}</div>
                    <p className="text-zinc-300 mb-6">Confira as melhores ofertas em nossa loja oficial.</p>
                    <a 
                      href={activeCategory.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl text-sm font-bold transition-all"
                    >
                      Ver no Mercado Livre
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="diferenciais" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Por que comprar conosco?</h2>
            <p className="text-zinc-400">Compromisso com a qualidade e a satisfação do colecionador.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURE_CARDS.map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-10 rounded-[32px] bg-white/5 border border-white/10 hover:border-red-500/30 transition-all"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-24 px-6 bg-gradient-to-br from-red-600 to-blue-800 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 -translate-y-1/4 translate-x-1/4">
          <Disc className="w-[600px] h-[600px] animate-spin-slow" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold mb-8 italic tracking-tighter">Nossa História</h2>
            <p className="text-xl text-zinc-100/80 leading-relaxed mb-8">
              A <span className="font-bold">{STORE_NAME}</span> nasceu em 2005 da paixão pela música e pelo cinema. Especialistas em mídias físicas, construímos nossa reputação oferecendo um catálogo vasto que vai do Rock, Metal e Grunge ao melhor da MPB e Moda de Viola.
            </p>
            <p className="text-xl text-zinc-100/80 leading-relaxed mb-12">
              Entendemos que para um colecionador, cada detalhe importa: o encarte impecável, a caixa conservada e o disco sem riscos. Por isso, garantimos apenas produtos originais e um atendimento que entende a sua paixão.
            </p>
            <div className="flex items-center gap-12">
              <div>
                <div className="text-4xl font-bold">19+</div>
                <div className="text-red-200 text-sm uppercase tracking-widest font-semibold">Anos de Mercado</div>
              </div>
              <div>
                <div className="text-4xl font-bold">100%</div>
                <div className="text-blue-200 text-sm uppercase tracking-widest font-semibold">Originalidade</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-6 bg-zinc-900/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center italic">Dúvidas Frequentes</h2>
          <div className="space-y-4">
            {FAQ.map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-bold mb-2 text-red-400">{item.q}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / CTA */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
              <img src={STORE_LOGO} alt={STORE_NAME} className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" referrerPolicy="no-referrer" />
            </div>
            <span className="text-lg font-bold tracking-tighter uppercase italic">{STORE_NAME}</span>
          </div>
          <h2 className="text-4xl font-bold mb-10">Pronto para aumentar sua coleção?</h2>
          <a 
            href={LINKS.ALL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold text-xl hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-white/10"
          >
            Acessar Loja no Mercado Livre
            <ExternalLink className="w-6 h-6" />
          </a>
          <div className="mt-20 pt-10 border-t border-white/5 text-zinc-600 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 {STORE_NAME}. Todos os direitos reservados.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-zinc-400 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}} />
    </div>
  );
}

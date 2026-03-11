// ── Tipos globais do projeto ───────────────────────────────────────────────────

export interface Produto {
  id: string;
  titulo: string;
  slug?: string;
  preco: number;
  preco_original: number | null;
  foto: string;
  fotos?: string[];
  link: string;
  vendidos: number;
  condicao: string;
  disponivel: boolean;
  estoque?: number;
}

export interface Colecao {
  slug: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  ids: string[];
}

export interface Artigo {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  autor: string;
  data: string;
  tempoLeitura: string;
  imagemCapa: string;
  conteudo: string;
  produtosRelacionados: string[];
}

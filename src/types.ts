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
  genero?: string;
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

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface FreteOpcao {
  id: string;
  nome: string;
  preco: number;
  prazo: string;
  transportadora: string;
}

export interface EnderecoEntrega {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosComprador {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco: EnderecoEntrega;
}

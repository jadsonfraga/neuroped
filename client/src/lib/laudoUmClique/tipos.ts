// ============================================================================
// laudoUmClique/tipos.ts — modelos do "Laudo em um clique"
// ----------------------------------------------------------------------------
// Fonte das regras: dossiê de redação clínica (Lei v9.5 + melhorias R1–R12).
// Nenhum tipo aqui carrega dado real: o texto do laudo é sempre escrito pelo
// médico; o gerador só organiza, nunca inventa conteúdo clínico.
// ============================================================================

export type CamadaDiagnostica = "firmado" | "investigacao" | "suspeita";

export interface DiagnosticoEntrada {
  nome: string;
  camada: CamadaDiagnostica;
  /** Obrigatórios, em paralelo, quando a camada é "firmado". */
  cid10?: string;
  cid11?: string;
}

/** Escala já aplicada, normalizada a partir de um resultado salvo. */
export interface EscalaPontuada {
  id: string;
  nome: string;
  /** Data ISO da aplicação (ou vazio). */
  data: string;
  respondente: string;
  /** Escore bruto salvo no resultado; null quando não foi registrado. */
  escore: number | null;
  /** Classificação salva ou derivada por ponto de corte oficial já existente. */
  classificacao: string;
  /** "salvo" = veio do resultado; "derivado" = recalculado por classificador local. */
  origem: "salvo" | "derivado" | "sem-escore";
  /** Leitura em uma linha, escrita pelo médico (opcional). */
  leitura: string;
  incluir: boolean;
}

export interface EntradaLaudoUmClique {
  paciente: string;
  /** Nomes de responsáveis/escola/serviços citados, para pseudonimização. */
  responsaveis: string[];
  dataNascimento: string; // AAAA-MM-DD
  sexo: "masculino" | "feminino" | "";
  serie: string;
  moraCom: string;
  cidade: string;
  dataConsulta: string; // AAAA-MM-DD

  quemE: string;
  historia: string;
  historiaFonte: string; // ex.: "caderneta de vacinação e laudo anterior, de março de 2026"
  familia: string;
  escola: string;
  escolaFonte: string;
  terapias: string;
  terapiasFonte: string;
  exames: string;
  examesFonte: string;
  exameNeuro: string;
  leitura: string;
  diagnosticos: DiagnosticoEntrada[];
  conduta: string;
  escolaOrienta: string;
  retorno: string;

  /** Resumo para o quadro "Em uma página". Vazio = derivado do corpo. */
  motivoResumo: string;
  decisaoHoje: string;
  proximosPassos: string;

  escalas: EscalaPontuada[];
  incluirAnexoTecnico: boolean;
  altoRisco: boolean;
}

export interface Capitulo {
  numero: string; // romano
  titulo: string;
  texto: string;
}

export interface LaudoUmClique {
  capitulos: Capitulo[];
  quadro: { rotulo: string; texto: string }[];
  fechamento: string[];
  anexoTecnico: string | null;
  /** Texto limpo (modo B) pronto para colar no Word / imprimir. */
  texto: string;
}

export interface ItemCheck {
  id: string;
  ok: boolean;
  nivel: "bloqueio" | "alerta";
  mensagem: string;
}

export interface RelatorioEstilo {
  aprovado: boolean;
  itens: ItemCheck[];
  metricas: {
    capitulos: number;
    palavras: number;
    frases: number;
    mediaPalavrasFrase: number;
    pctAbaixo30: number;
    flesch: number;
    declaracoesFonte: number;
  };
}

export interface ControleLaudo {
  lacunas: string[];
  estilo: RelatorioEstilo;
  segundaLeitura: string[];
  linhaProntuarioIA: string;
  avisoRevisao: string;
}

export const AVISO_REVISAO_MEDICA =
  "Texto gerado de forma automatizada a partir do que o médico informou. Deve ser lido, editado e assumido pelo médico responsável antes de qualquer emissão ou assinatura.";

export const NOTA_FINAL_FIXA = [
  "Redação clínica de Dr. Jadson Fraga Araújo Júnior, revista com auxílio de ferramenta computacional.",
  "Soli Deo Gloria",
] as const;

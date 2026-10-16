// ============================================================================
// checagemDose/tipos.ts — esquema da base de faixas de referência de dose
// ----------------------------------------------------------------------------
// A base (client/src/data/doses/referencias-dose.json) é DADO, separada do
// código. Cada limite carrega o TRECHO LITERAL da fonte oficial; cada entrada
// carrega fonte, versão, data e status de validação do médico.
// ============================================================================

export type StatusValidacao = "aguardando_validacao_medico" | "validado_medico" | "rejeitado_medico";
export type TipoLimite = "dose_inicial" | "dose_alvo_recomendada" | "limite_maximo" | "limite_seguranca_documentado";
export type UnidadeLimite = "mg/kg/dia" | "mg/dia";

export interface LimiteFonte {
  tipo: TipoLimite;
  unidade: UnidadeLimite;
  /** Valor único (ex.: alvo, máximo). */
  valor?: number;
  /** Intervalo (ex.: dose inicial de 10 a 15 mg/kg/dia). */
  min?: number;
  max?: number;
  /** Trecho literal da fonte que sustenta o número. */
  trecho: string;
  condicao?: string;
}

export interface FonteOficial {
  tipo: string;
  orgao: string;
  titulo: string;
  fabricante: string;
  secao: string;
  setId: string;
  versaoSpl: string;
  /** Data efetiva da bula (AAAA-MM-DD). */
  dataEfetiva: string;
  /** Data em que a fonte foi consultada (AAAA-MM-DD). */
  dataConsulta: string;
  url: string;
  obtidoVia: string;
}

export interface PopulacaoReferencia {
  /** Idade em meses, mínimo inclusivo / máximo exclusivo. */
  idadeMinMeses?: number;
  idadeMaxMeses?: number;
  /** Peso em kg, mínimo inclusivo / máximo exclusivo. */
  pesoMinKg?: number;
  pesoMaxKg?: number;
}

export interface EntradaReferencia {
  id: string;
  medicamento: string;
  aliases: string[];
  indicacao: string;
  populacao: PopulacaoReferencia;
  limites: LimiteFonte[];
  fonte: FonteOficial;
  observacoes: string;
  status: StatusValidacao;
  validacao: { por: string | null; em: string | null; observacao: string | null };
}

export interface BaseReferencias {
  schemaVersion: number;
  geradoEm: string;
  aviso: string;
  entradas: EntradaReferencia[];
}

export type CodigoAlerta =
  | "acima-do-limite-da-fonte"
  | "acima-da-dose-alvo-da-fonte"
  | "abaixo-da-dose-inicial-da-fonte"
  | "dentro-da-faixa-da-fonte";

export interface AlertaDose {
  codigo: CodigoAlerta;
  nivel: "atencao" | "informativo";
  mensagem: string;
  limite: LimiteFonte;
}

export interface EntradaDose {
  medicamento: string;
  /** Dose por administração, em mg. */
  doseMg: number;
  /** Administrações por dia. */
  dosesPorDia: number;
  pesoKg: number;
  idadeMeses: number;
}

export type ResultadoChecagem =
  | { situacao: "entrada-invalida"; motivo: string }
  | { situacao: "sem-dado-validado"; motivo: string; medicamentoConhecido: boolean }
  | {
      situacao: "avaliada";
      doseDiariaMg: number;
      doseMgKgDia: number;
      entrada: EntradaReferencia;
      alertas: AlertaDose[];
      aguardandoValidacao: boolean;
    };

export const AVISO_APOIO_DOSE =
  "Apoio à leitura: compara a dose registrada com faixas de referência extraídas de bulas oficiais. Não é prescrição, não indica dose correta e não sugere conduta. A decisão é sempre do médico, com a bula nacional, o paciente e o contexto clínico.";

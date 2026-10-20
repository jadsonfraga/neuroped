import {
  circuitForAge, CIRCUIT_TASKS, coverageStatus, MSE_SECTIONS, NEURO_BASIC_DOMAINS,
  type CircuitRecords, type CoverageDomain, type CoverageStatus,
} from "./clinicalCircuit";
import type { GameSummary } from "./model";

/**
 * Matriz de suficiência para o laudo neuropediátrico. Organiza o que o circuito e a bateria
 * registraram, o que falta esclarecer e o que depende de fonte externa ou de decisão médica.
 * Nunca preenche achado ausente, nunca conclui diagnóstico e nunca libera documento.
 * "Registrado" significa descrito no jogo; não equivale a normal.
 */
export type SuficienciaStatus =
  | "examinado"
  | "a_esclarecer"
  | "falta_exame_direto"
  | "pendente_execucao"
  | "nao_obtido"
  | "fora_do_jogo"
  | "depende_fonte_externa"
  | "depende_decisao_medica";

export const SUFICIENCIA_LABELS: Record<SuficienciaStatus, string> = {
  examinado: "Registrado — não equivale a normal",
  a_esclarecer: "Achado a esclarecer",
  falta_exame_direto: "Falta exame direto",
  pendente_execucao: "Pendente de execução no jogo",
  nao_obtido: "Não realizado ou sem colaboração",
  fora_do_jogo: "Fora do jogo nesta faixa",
  depende_fonte_externa: "Depende de fonte externa",
  depende_decisao_medica: "Depende de decisão médica",
};

/** Resumo da bateria principal usado pela matriz: só contagem de mundos aplicados, sem pontuação. */
export interface BateriaResumo {
  complete: boolean;
  total: number;
  aplicados: number;
  naoAplicados: string[];
}

export function resumoDaBateria(summary: GameSummary): BateriaResumo {
  return {
    complete: summary.complete,
    total: summary.phases.length,
    aplicados: summary.phases.filter((phase) => phase.applied).length,
    naoAplicados: summary.phases.filter((phase) => phase.skipReason).map((phase) => `${phase.phase.name} (${phase.skipReason})`),
  };
}

type Origem =
  | { tipo: "dominio"; dominio: string }
  | { tipo: "estacao"; estacao: string }
  | { tipo: "urgencia" }
  | { tipo: "escola" }
  | { tipo: "bateria" }
  | { tipo: "externa"; fonte: string }
  | { tipo: "medica" };

export interface RequisitoLaudo { id: string; secao: string; label: string; origem: Origem }

const S1 = "1 · Identificação";
const S2 = "2 · Motivo da avaliação";
const S3 = "3 · História clínica e do neurodesenvolvimento";
const S4 = "4 · Exame clínico, neurológico e comportamental";
const S5 = "5 · Escalas, instrumentos e documentos analisados";
const S6 = "6 · Impressão diagnóstica";
const S7 = "7 · Conduta e recomendações";
const S8 = "8 · Fechamento";

/** Itens que o laudo da estrutura PANT exige, na ordem das seções. */
export const REQUISITOS_LAUDO: readonly RequisitoLaudo[] = [
  { id: "identificacao", secao: S1, label: "Nome, data de nascimento, sexo, cidade, data da avaliação e protocolo", origem: { tipo: "externa", fonte: "prontuário" } },
  { id: "motivo", secao: S2, label: "Demanda principal e encaminhamento", origem: { tipo: "externa", fonte: "anamnese ou encaminhamento" } },
  { id: "marcos", secao: S3, label: "Marcos do desenvolvimento (relato com fonte)", origem: { tipo: "estacao", estacao: "milestones" } },
  { id: "gestacao", secao: S3, label: "Gestação, parto, puerpério e história familiar", origem: { tipo: "externa", fonte: "anamnese" } },
  { id: "escolar", secao: S3, label: "Relato escolar ou de creche, quando frequenta", origem: { tipo: "escola" } },
  { id: "sono", secao: S3, label: "Sono e funções neurovegetativas (relato)", origem: { tipo: "estacao", estacao: "sleep" } },
  { id: "urgencia", secao: S4, label: "Sinais de urgência: consciência, fundo de olho e sinais meníngeos", origem: { tipo: "urgencia" } },
  { id: "cabeca", secao: S4, label: "Cabeça e perímetro cefálico", origem: { tipo: "dominio", dominio: "crescimento" } },
  { id: "par3_4_6", secao: S4, label: "Pares III, IV e VI: movimentos oculares e pupilas", origem: { tipo: "dominio", dominio: "oculomotores" } },
  { id: "par5_7", secao: S4, label: "Pares V e VII: sensibilidade e mímica facial", origem: { tipo: "dominio", dominio: "par5_7" } },
  { id: "par8_12", secao: S4, label: "Pares VIII a XII: audição, voz, deglutição e língua", origem: { tipo: "dominio", dominio: "pares8_12" } },
  { id: "par11", secao: S4, label: "Par XI: esternocleidomastóideo e trapézio", origem: { tipo: "dominio", dominio: "par11" } },
  { id: "tonus", secao: S4, label: "Tônus e postura", origem: { tipo: "dominio", dominio: "tonus" } },
  { id: "forca", secao: S4, label: "Força muscular", origem: { tipo: "dominio", dominio: "forca" } },
  { id: "reflexos", secao: S4, label: "Reflexos", origem: { tipo: "dominio", dominio: "reflexos" } },
  { id: "sensibilidade", secao: S4, label: "Sensibilidade e estereognosia", origem: { tipo: "dominio", dominio: "sensibilidade" } },
  { id: "coordenacao", secao: S4, label: "Coordenação e dismetria", origem: { tipo: "dominio", dominio: "coordenacao" } },
  { id: "marcha", secao: S4, label: "Marcha e equilíbrio", origem: { tipo: "dominio", dominio: "marcha" } },
  { id: "involuntarios", secao: S4, label: "Movimentos involuntários", origem: { tipo: "dominio", dominio: "involuntarios" } },
  { id: "praxias", secao: S4, label: "Praxias e praxia construtiva", origem: { tipo: "dominio", dominio: "praxias" } },
  { id: "lateralidade", secao: S4, label: "Lateralidade e bimanualidade", origem: { tipo: "dominio", dominio: "lateralidade" } },
  { id: "linguagem", secao: S4, label: "Fala e linguagem", origem: { tipo: "dominio", dominio: "linguagem" } },
  { id: "interacao", secao: S4, label: "Interação social e aparência", origem: { tipo: "dominio", dominio: "aparencia" } },
  { id: "atencao", secao: S4, label: "Atenção e atividade psicomotora", origem: { tipo: "dominio", dominio: "psicomotor" } },
  { id: "cognicao", secao: S4, label: "Cognição: memória, orientação e funções executivas", origem: { tipo: "dominio", dominio: "cognicao" } },
  { id: "humor", secao: S4, label: "Humor e afeto", origem: { tipo: "dominio", dominio: "humor" } },
  { id: "pensamento", secao: S4, label: "Pensamento e percepção", origem: { tipo: "dominio", dominio: "pensamento" } },
  { id: "juizo", secao: S4, label: "Juízo crítico e insight", origem: { tipo: "dominio", dominio: "juizo" } },
  { id: "seguranca", secao: S4, label: "Segurança (entrevista reservada, somente profissional)", origem: { tipo: "dominio", dominio: "seguranca" } },
  { id: "bateria", secao: S5, label: "Bateria principal: mundos aplicados", origem: { tipo: "bateria" } },
  { id: "escalas", secao: S5, label: "Escalas e instrumentos padronizados, quando aplicáveis", origem: { tipo: "externa", fonte: "instrumentos licenciados ou validados" } },
  { id: "documentos", secao: S5, label: "Documentos analisados (laudos, relatórios e exames)", origem: { tipo: "externa", fonte: "documentos recebidos" } },
  { id: "exames", secao: S5, label: "Exames complementares, quando indicados", origem: { tipo: "externa", fonte: "exames complementares" } },
  { id: "impressao", secao: S6, label: "Impressão diagnóstica com CID-10 e CID-11 em paralelo", origem: { tipo: "medica" } },
  { id: "fundamentacao", secao: S6, label: "Fundamentação que relaciona achados aos diagnósticos", origem: { tipo: "medica" } },
  { id: "conduta", secao: S7, label: "Conduta, encaminhamentos e orientações", origem: { tipo: "medica" } },
  { id: "liberacao", secao: S8, label: "Revisão médica, assinatura e liberação do documento", origem: { tipo: "medica" } },
];

const DOMINIOS: readonly CoverageDomain[] = [...NEURO_BASIC_DOMAINS, ...MSE_SECTIONS];

const DE_COBERTURA: Record<CoverageStatus, SuficienciaStatus> = {
  registrado: "examinado",
  esclarecer: "a_esclarecer",
  parcial: "falta_exame_direto",
  pendente: "pendente_execucao",
  nao_obtido: "nao_obtido",
  sem_estacao: "fora_do_jogo",
};

const URGENCIA = ["consciencia", "fundus", "meningeal"];

function statusDeEstacao(id: string, years: number, records: CircuitRecords): SuficienciaStatus {
  if (!circuitForAge(years).some((task) => task.id === id)) return "fora_do_jogo";
  const status = records[id]?.status;
  if (status === "observado") return "examinado";
  if (status === "achado") return "a_esclarecer";
  if (status === "nao_realizado" || status === "nao_colaborou") return "nao_obtido";
  return "pendente_execucao";
}

function statusUrgencia(records: CircuitRecords): SuficienciaStatus {
  const estados = URGENCIA.map((id) => records[id]?.status);
  if (estados.includes("achado")) return "a_esclarecer";
  if (estados.some((status) => status === "nao_realizado" || status === "nao_colaborou")) return "nao_obtido";
  if (estados.every((status) => status === "observado")) return "examinado";
  return "pendente_execucao";
}

function statusBateria(bateria: BateriaResumo | null): SuficienciaStatus {
  if (!bateria || (bateria.aplicados === 0 && bateria.naoAplicados.length === 0)) return "pendente_execucao";
  if (bateria.naoAplicados.length) return "nao_obtido";
  return bateria.complete ? "examinado" : "pendente_execucao";
}

function resolver(origem: Origem, years: number, records: CircuitRecords, bateria: BateriaResumo | null): { status: SuficienciaStatus; detalhe: string } {
  if (origem.tipo === "dominio") {
    const dominio = DOMINIOS.find((entry) => entry.id === origem.dominio);
    if (!dominio) throw new Error(`domínio de suficiência ausente: ${origem.dominio}`);
    const estacoes = circuitForAge(years).filter((task) => dominio.stations.includes(task.id)).map((task) => task.title);
    return {
      status: DE_COBERTURA[coverageStatus(dominio, years, records)],
      detalhe: estacoes.length ? `Estações: ${estacoes.join("; ")}` : "Sem estação nesta faixa; exame direto se indicado",
    };
  }
  if (origem.tipo === "estacao") {
    const titulo = CIRCUIT_TASKS.find((task) => task.id === origem.estacao)?.title ?? origem.estacao;
    const fonte = records[origem.estacao]?.source;
    return {
      status: statusDeEstacao(origem.estacao, years, records),
      detalhe: fonte ? `Estação: ${titulo}; fonte registrada` : `Estação: ${titulo}; fonte não informada`,
    };
  }
  if (origem.tipo === "urgencia") {
    return { status: statusUrgencia(records), detalhe: "Achados de urgência precisam ser esclarecidos antes de qualquer conclusão" };
  }
  if (origem.tipo === "escola") {
    const registrado = Object.values(records).some((entry) => entry.source === "escola");
    return {
      status: registrado ? "examinado" : "depende_fonte_externa",
      detalhe: registrado ? "Relato escolar registrado no circuito" : "Solicitar relato da escola ou creche; o jogo não verifica este item",
    };
  }
  if (origem.tipo === "bateria") {
    const detalhe = bateria
      ? `${bateria.aplicados} de ${bateria.total} mundos aplicados${bateria.naoAplicados.length ? `; não aplicados: ${bateria.naoAplicados.join("; ")}` : ""}`
      : "Partida não iniciada nesta sessão";
    return { status: statusBateria(bateria), detalhe };
  }
  if (origem.tipo === "externa") {
    return { status: "depende_fonte_externa", detalhe: `Fonte: ${origem.fonte}; o jogo não verifica este item` };
  }
  return { status: "depende_decisao_medica", detalhe: "Decisão e assinatura do médico; o jogo não preenche este campo" };
}

export interface LinhaSuficiencia { id: string; secao: string; label: string; status: SuficienciaStatus; detalhe: string }

export function matrizSuficiencia(years: number, records: CircuitRecords, bateria: BateriaResumo | null = null): LinhaSuficiencia[] {
  return REQUISITOS_LAUDO.map((requisito) => ({
    id: requisito.id,
    secao: requisito.secao,
    label: requisito.label,
    ...resolver(requisito.origem, years, records, bateria),
  }));
}

/** Itens que ainda não estão resolvidos. Contagem de pendências, não escore clínico. */
export function itensNaoResolvidos(linhas: readonly LinhaSuficiencia[]): number {
  return linhas.filter((linha) => linha.status !== "examinado").length;
}

export function textoProntidao(years: number, linhas: readonly LinhaSuficiencia[]): string[] {
  const out = [
    `PRONTIDÃO PARA O LAUDO — MATRIZ DE SUFICIÊNCIA (${years} anos)`,
    "Emissão automática: não. O jogo não preenche achados ausentes, não libera documentos e não conclui diagnóstico.",
    `Itens não resolvidos: ${itensNaoResolvidos(linhas)} de ${linhas.length}. "Registrado" significa descrito no jogo ou na bateria; não equivale a normal.`,
  ];
  let secao = "";
  for (const linha of linhas) {
    if (linha.secao !== secao) {
      secao = linha.secao;
      out.push(secao);
    }
    out.push(`• ${linha.label}: ${SUFICIENCIA_LABELS[linha.status]} (${linha.detalhe}).`);
  }
  out.push("");
  return out;
}

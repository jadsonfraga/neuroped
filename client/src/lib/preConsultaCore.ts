import { allScales, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import {
  clearClinicalSessionRecords,
  loadClinicalSessionRecords,
  saveClinicalSessionRecords,
} from "@/lib/clinicalSessionStorage";

export type PreConsultaStatus = "aguardando" | "respondendo" | "concluido" | "precisa-ajuda" | "pronto-medico";
export type PreConsultaRespondente = "pais" | "adolescente" | "professor" | "secretaria";
export type PreConsultaContexto = "primeira-consulta" | "retorno" | "avaliacao-escolar" | "ajuste-medicacao" | "acompanhamento";

export interface PreConsultaRecord {
  id: string;
  paciente: string;
  idadeMeses: number;
  queixa: string;
  respondente: PreConsultaRespondente;
  contexto: PreConsultaContexto;
  observacoes?: string;
  status: PreConsultaStatus;
  createdAt: string;
}

export interface PreConsultaRecommendation {
  label: "Ouro" | "Prata" | "Questionário escolar";
  scale?: ScaleEntry;
  reason: string;
}

export interface AgeValidationInput {
  years: string | number;
  months: string | number;
}

export interface AgeValidationResult {
  isValid: boolean;
  years: number;
  months: number;
  totalMonths: number;
  errors: string[];
  label: string;
}

export const PRE_CONSULTA_STORAGE_KEY = "neuroped:pre-consultas";
export const PRE_CONSULTA_SECURE_KEY = "pre-consultas";

const preConsultaStorageConfig = {
  secureKey: PRE_CONSULTA_SECURE_KEY,
  legacyLocalStorageKey: PRE_CONSULTA_STORAGE_KEY,
} as const;

export const preConsultaQueixas = [
  { id: "linguagem", label: "Atraso de fala / linguagem" },
  { id: "tea", label: "Suspeita de TEA" },
  { id: "tdah", label: "TDAH / atenção" },
  { id: "comportamento", label: "Comportamento" },
  { id: "sono", label: "Sono" },
  { id: "ansiedade", label: "Ansiedade" },
  { id: "depressao", label: "Depressão / humor" },
  { id: "trauma", label: "Trauma / TEPT" },
  { id: "tiques", label: "Tiques" },
  { id: "epilepsia", label: "Epilepsia" },
  { id: "aprendizagem", label: "Aprendizagem / escola" },
  { id: "alimentacao", label: "Seletividade alimentar" },
  { id: "efeitos", label: "Medicação / efeitos colaterais" },
  { id: "social", label: "Relações sociais" },
];

const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);

export function sanitizeAgeInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function parseAgePart(value: string | number) {
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return Number.NaN;
  return Number(text);
}

export function formatAgeLabel(totalMonths: number): string {
  if (totalMonths < 24) return `${totalMonths} meses`;
  return `${Math.floor(totalMonths / 12)} anos e ${totalMonths % 12} meses`;
}

export function validateAge({ years, months }: AgeValidationInput): AgeValidationResult {
  const parsedYears = parseAgePart(years);
  const parsedMonths = parseAgePart(months);
  const errors: string[] = [];

  if (!Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 18) {
    errors.push("Anos deve ser um número inteiro entre 0 e 18.");
  }
  if (!Number.isInteger(parsedMonths) || parsedMonths < 0 || parsedMonths > 11) {
    errors.push("Meses deve ser um número inteiro entre 0 e 11.");
  }

  const safeYears = Number.isInteger(parsedYears) ? parsedYears : 0;
  const safeMonths = Number.isInteger(parsedMonths) ? parsedMonths : 0;
  const totalMonths = safeYears * 12 + safeMonths;

  if (errors.length === 0 && totalMonths === 0) {
    errors.push("Informe uma idade maior que 0 mês para gerar resumo clínico.");
  }

  return {
    isValid: errors.length === 0,
    years: safeYears,
    months: safeMonths,
    totalMonths,
    errors,
    label: errors.length === 0 ? formatAgeLabel(totalMonths) : "",
  };
}

function uniqueById(items: ScaleEntry[]): ScaleEntry[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function responseWeight(scale: ScaleEntry, respondente: PreConsultaRespondente) {
  if (respondente === "professor" && scale.respondente.includes("professor")) return 5;
  if (respondente === "adolescente" && (scale.respondente.includes("autoaplicavel") || scale.respondente.includes("crianca"))) return 5;
  if (respondente === "pais" && scale.respondente.includes("pais")) return 5;
  if (respondente === "secretaria" && (scale.respondente.includes("pais") || scale.respondente.includes("clinico"))) return 3;
  return 0;
}

function scoreScale(scale: ScaleEntry, form: Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto">) {
  let score = 0;
  if (form.idadeMeses >= scale.ageMin && form.idadeMeses <= scale.ageMax) score += 5;
  if (scale.queixas.includes(form.queixa)) score += 8;
  score += responseWeight(scale, form.respondente);
  if (scale.appRoute) score += 3;
  if (scale.prioridade === "triagem") score += 2;
  if (form.contexto === "avaliacao-escolar" && scale.respondente.includes("professor")) score += 4;
  if (form.contexto === "ajuste-medicacao" && scale.queixas.includes("efeitos")) score += 5;
  return score;
}

export function recommendPreConsultaScales(form: Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto">): PreConsultaRecommendation[] {
  const ranked = uniqueById(catalog)
    .map((scale) => ({ scale, score: scoreScale(scale, form) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.scale.name.localeCompare(b.scale.name))
    .map((item) => item.scale);

  const school = ranked.find((scale) => scale.respondente.includes("professor"));

  return [
    { label: "Ouro", scale: ranked[0], reason: "Maior compatibilidade com idade, queixa, respondente e rota disponível." },
    { label: "Prata", scale: ranked[1] || ranked[0], reason: "Complementar para ampliar triagem sem expor excesso de escalas à família." },
    { label: "Questionário escolar", scale: school, reason: "Útil quando há queixa escolar, comportamento em sala ou necessidade de observação do professor." },
  ];
}

export async function loadPreConsultas(): Promise<PreConsultaRecord[]> {
  return loadClinicalSessionRecords<PreConsultaRecord>(preConsultaStorageConfig);
}

export async function savePreConsultas(items: PreConsultaRecord[]): Promise<boolean> {
  return saveClinicalSessionRecords(preConsultaStorageConfig, items);
}

export async function clearPreConsultas(): Promise<void> {
  await clearClinicalSessionRecords(preConsultaStorageConfig);
}

export function buildPreConsultaSummary(record: PreConsultaRecord, recommendations = recommendPreConsultaScales(record)) {
  const idade = formatAgeLabel(record.idadeMeses);
  const escalas = recommendations
    .filter((item) => item.scale)
    .map((item) => `- ${item.label}: ${item.scale?.name} — ${item.scale?.fullName}`)
    .join("\n");

  return `RESUMO PRÉ-CONSULTA\n\nPaciente: ${record.paciente || "Não informado"}\nIdade: ${idade}\nRespondente: ${record.respondente}\nMotivo principal: ${record.queixa}\nContexto: ${record.contexto}\nStatus: ${record.status}\n\nEscalas/questionários sugeridos:\n${escalas || "- Nenhuma sugestão forte. Refinar dados clínicos."}\n\nAchados relevantes:\n- Dados iniciais coletados em pré-consulta pela recepção/família.\n- Confirmar queixa principal, duração, contexto escolar e impacto funcional.\n\nPontos de atenção:\n1. Verificar prejuízo funcional real em casa e escola.\n2. Checar marcos do desenvolvimento, sono, comportamento e medicação quando aplicável.\n3. Correlacionar triagem com anamnese e exame neurológico.\n\nPontos positivos:\n1. Família chegou com dados organizados antes da consulta.\n2. O fluxo evita exposição a excesso de escalas.\n3. O médico recebe direcionamento inicial sem diagnóstico automático.\n\nPerguntas estratégicas para abrir consulta:\n1. Qual é a maior preocupação da família hoje?\n2. O que mais atrapalha a rotina da criança na casa ou na escola?\n\nInterpretação prudente:\n- Triagem/monitoramento; não é diagnóstico isolado.\n- Correlacionar com história clínica, exame neurológico e informações escolares.\n\nObservações livres:\n${record.observacoes || "- Sem observações adicionais."}`;
}

export function createPreConsultaRecord(input: Omit<PreConsultaRecord, "id" | "status" | "createdAt">): PreConsultaRecord {
  return {
    ...input,
    id: `pc-${crypto.randomUUID()}`,
    status: "aguardando",
    createdAt: new Date().toISOString(),
  };
}

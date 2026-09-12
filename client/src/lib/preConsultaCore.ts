import { allScales, type ScaleEntry } from "@/data/scaleFilter";
import { mergeFilterableCatalog } from "@/data/filterableCatalog";
import { noCostWorldScales } from "@/data/noCostWorldScales";
import { regula20CatalogEntry, regula20Eligibility } from "@/data/regula20";
import { recoveredMonitorCatalog } from "@/data/recoveredAuthorialMonitors";
import { safePrevisitRecommendations } from "./preConsultaSafeRanking";
import {
  PREVISIT_SECURE_KEYS,
  previsitLegacyGet,
  previsitLegacyRemove,
  previsitSecureClear,
  previsitSecureGet,
  previsitSecureSet,
} from "@/lib/previsitLocalPersistence";

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
  label: "Ouro" | "Prata" | "Questionário escolar" | "Monitor autoral";
  scale?: ScaleEntry;
  reason: string;
}
export interface AgeValidationInput { years: string | number; months: string | number }
export interface AgeValidationResult { isValid: boolean; years: number; months: number; totalMonths: number; errors: string[]; label: string }
export const PRE_CONSULTA_STORAGE_KEY = "neuroped:pre-consultas";
const PRE_CONSULTA_SECURE_KEY = PREVISIT_SECURE_KEYS.preConsulta;

export const preConsultaQueixas = [
  { id: "linguagem", label: "Atraso de fala / linguagem" },
  { id: "tea", label: "Suspeita de TEA" },
  { id: "tdah", label: "TDAH / atenção" },
  { id: "comportamento", label: "Comportamento" },
  { id: "irritabilidade-funcional", label: "Irritabilidade · registro funcional" },
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
  { id: "transicoes-funcional", label: "Transições · monitor autoral" },
  { id: "autonomia-funcional", label: "Autonomia · monitor autoral" },
  { id: "sono-funcional", label: "Sono · monitor autoral" },
  { id: "tiques-funcional", label: "Tiques · monitor autoral" },
  { id: "generalizacao-funcional", label: "Generalização · monitor autoral" },
  { id: "escola-funcional", label: "Escola · monitor autoral" },
];
const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const recoveredByGoal: Record<string, string> = {
  "transicoes-funcional": "adapta-18-sdg", "autonomia-funcional": "rota-aut-18-sdg",
  "sono-funcional": "ritmo-sono-20-sdg", "tiques-funcional": "ticar-18-sdg",
  "generalizacao-funcional": "ponte-16-sdg", "escola-funcional": "porta-20-sdg",
};

export function sanitizeAgeInput(value: string): string { return value.replace(/[^\d]/g, ""); }
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
  if (!Number.isInteger(parsedYears) || parsedYears < 0 || parsedYears > 18) errors.push("Anos deve ser um número inteiro entre 0 e 18.");
  if (!Number.isInteger(parsedMonths) || parsedMonths < 0 || parsedMonths > 11) errors.push("Meses deve ser um número inteiro entre 0 e 11.");
  const safeYears = Number.isInteger(parsedYears) ? parsedYears : 0;
  const safeMonths = Number.isInteger(parsedMonths) ? parsedMonths : 0;
  const totalMonths = safeYears * 12 + safeMonths;
  if (errors.length === 0 && totalMonths === 0) errors.push("Informe uma idade maior que 0 mês para gerar resumo clínico.");
  return { isValid: errors.length === 0, years: safeYears, months: safeMonths, totalMonths, errors, label: errors.length === 0 ? formatAgeLabel(totalMonths) : "" };
}

export function recommendPreConsultaScales(form: Pick<PreConsultaRecord, "idadeMeses" | "queixa" | "respondente" | "contexto">): PreConsultaRecommendation[] {
  if (form.queixa === "irritabilidade-funcional") {
    const purpose = ["retorno", "acompanhamento"].includes(form.contexto) ? "seguimento-funcional" : "basal-funcional";
    const eligibility = regula20Eligibility({ ageMonths: form.idadeMeses, respondent: form.respondente === "secretaria" ? "pais" : form.respondente, purpose, focus: form.queixa });
    return [{ label: "Monitor autoral", scale: eligibility.eligible ? regula20CatalogEntry : undefined,
      reason: eligibility.eligible ? "REGULA-20: registro funcional autoral, não teste diagnóstico. Confirme basal/seguimento, observador e contexto no filtro dedicado. Não empilhar com outro monitor de irritabilidade." : eligibility.reason }];
  }
  const requestedId = recoveredByGoal[form.queixa];
  if (requestedId) {
    const scale = recoveredMonitorCatalog.find((s) => s.id === requestedId);
    const respondent = form.respondente === "secretaria" ? "pais" : form.respondente;
    const compatible = scale && Number.isInteger(form.idadeMeses) && form.idadeMeses >= scale.ageMin && form.idadeMeses <= scale.ageMax && scale.respondente.some((r) => r === respondent);
    return [{ label: "Monitor autoral", scale: compatible ? scale : undefined,
      reason: compatible ? "Abrir o acervo autoral e confirmar finalidade funcional, contexto e observação direta antes de iniciar. Uma indicação não libera a aplicação sem esses dados. Não repetir instrumento já aplicado." : "Este instrumento não é adequado à idade ou ao respondente informado. Não substituir por formulário de outro observador." }];
  }
  return safePrevisitRecommendations(catalog, form);
}

export async function loadPreConsultas(): Promise<PreConsultaRecord[]> {
  const protectedRecords = await previsitSecureGet<PreConsultaRecord[]>(PRE_CONSULTA_SECURE_KEY);
  if (Array.isArray(protectedRecords)) return protectedRecords;
  // A política central bloqueia inclusive esta leitura em LIVE autenticado.
  const raw = previsitLegacyGet(PRE_CONSULTA_STORAGE_KEY);
  if (raw === null) return [];
  try {
    const legacy = JSON.parse(raw);
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = await previsitSecureSet(PRE_CONSULTA_SECURE_KEY, legacy);
      if (migrated && previsitLegacyGet(PRE_CONSULTA_STORAGE_KEY) === raw) previsitLegacyRemove(PRE_CONSULTA_STORAGE_KEY);
      return legacy;
    }
    previsitLegacyRemove(PRE_CONSULTA_STORAGE_KEY);
    return [];
  } catch { return []; }
}
export async function savePreConsultas(items: PreConsultaRecord[]): Promise<boolean> {
  let stored: boolean;
  try { stored = await previsitSecureSet(PRE_CONSULTA_SECURE_KEY, items); } catch { return false; }
  if (!stored) return false;
  previsitLegacyRemove(PRE_CONSULTA_STORAGE_KEY);
  return true;
}
export async function clearPreConsultas(): Promise<void> {
  previsitLegacyRemove(PRE_CONSULTA_STORAGE_KEY);
  await previsitSecureClear(PRE_CONSULTA_SECURE_KEY);
}
export function buildPreConsultaSummary(record: PreConsultaRecord, recommendations = recommendPreConsultaScales(record)) {
  const idade = formatAgeLabel(record.idadeMeses);
  const escalas = recommendations.filter((item) => item.scale).map((item) => `- ${item.label}: ${item.scale?.name} — ${item.scale?.fullName}`).join("\n");
  return `RESUMO PRÉ-CONSULTA\n\nPaciente: ${record.paciente || "Não informado"}\nIdade: ${idade}\nRespondente: ${record.respondente}\nMotivo principal: ${record.queixa}\nContexto: ${record.contexto}\nStatus: ${record.status}\n\nEscalas/questionários sugeridos:\n${escalas || "- Nenhuma opção liberada para este perfil; revisar os critérios clínicos."}\n\nPontos a esclarecer na consulta:\n- Queixa principal, início, duração e contexto.\n- Participação real em casa, escola e outros ambientes.\n- Marcos do desenvolvimento, sono, segurança, medicação e mudanças recentes.\n- Apoios eficazes, habilidades preservadas e prioridades da família.\n\nInterpretação prudente:\n- Este é um registro preparatório, não diagnóstico.\n- Questionário autoral é descritivo; não usar pontos de corte não validados.\n- Não presumir normalidade em temas não perguntados e não combinar informantes.\n- Correlacionar relatos com avaliação clínica e exame efetivamente realizados.\n\nObservações relatadas:\n${record.observacoes || "Não informadas."}`;
}
export function createPreConsultaRecord(input: Omit<PreConsultaRecord, "id" | "status" | "createdAt">): PreConsultaRecord {
  return { ...input, id: `pc-${crypto.randomUUID()}`, status: "aguardando", createdAt: new Date().toISOString() };
}

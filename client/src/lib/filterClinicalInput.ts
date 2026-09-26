/** Entrada de navegação; não define normas nem diagnósticos. */
export interface ExactFilterAge { years: string; months: string }
export interface FilterAgeBand { id: string; label: string; min: number; max: number }
export interface ResolvedFilterAge {
  status: "unspecified" | "exact" | "band" | "invalid";
  ageMonths: number | null;
  ageBand: { min: number; max: number } | null;
  label: string;
  message: string;
}
interface Complaint { id: string; label: string; parentHint?: string }
const MAX_FILTER_MONTHS = 216;
const EMPTY: ResolvedFilterAge = {
  status: "unspecified", ageMonths: null, ageBand: null,
  label: "idade não especificada", message: "Informe a idade exata ou escolha uma faixa etária.",
};
const invalidAge = (message = "Confira a idade: use anos completos e meses de 0 a 11, até 18 anos."): ResolvedFilterAge => ({
  ...EMPTY, status: "invalid", label: "idade a conferir", message,
});
export function formatFilterAge(months: number): string {
  const years = Math.floor(months / 12), rest = months % 12;
  const y = `${years} ${years === 1 ? "ano" : "anos"}`;
  const m = `${rest} ${rest === 1 ? "mês" : "meses"}`;
  return !years ? m : !rest ? y : `${y} e ${m}`;
}
const exactAge = (months: number): ResolvedFilterAge => ({
  status: "exact", ageMonths: months, ageBand: null,
  label: formatFilterAge(months), message: "Idade exata aplicada a todos os resultados.",
});
/** Vazio não é zero; nunca corrige ou limita silenciosamente um valor inválido. */
export function parseExactFilterAge(input?: ExactFilterAge): ResolvedFilterAge {
  if (!input || (!input.years.trim() && !input.months.trim())) return { ...EMPTY };
  const years = input.years.trim(), months = input.months.trim();
  if (![years, months].every((part) => part === "" || /^\d{1,3}$/.test(part))) return invalidAge();
  const total = Number(years || 0) * 12 + Number(months || 0);
  if (Number(months || 0) > 11 || total > MAX_FILTER_MONTHS) return invalidAge();
  return exactAge(total);
}
/** Idades compostas são somadas, não truncadas para a parcela de meses. */
export function parseFilterSearchAge(query: string): ResolvedFilterAge {
  const text = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // "a" ou "aos" separado do primeiro número pode indicar intervalo etário,
  // não abreviação de anos. Falha fechado; preserva 5a6m e 5 anos e 6 meses.
  if (/(?<![\w.,])\d+(?:[.,]\d+)?\s+a(?:os)?\s*\d+(?:[.,]\d+)?\s*(?:anos?|a|meses|mes|m)(?![a-z0-9])/.test(text)) {
    return invalidAge("A busca contém uma faixa ou idade ambígua. Escolha uma faixa nos botões ou informe a idade exata.");
  }
  const matches = [...text.matchAll(/(?<![\w.,])([+-]?\d+(?:[.,]\d+)?)\s*(anos?|a)(?:\s*(?:e\s*)?([+-]?\d+(?:[.,]\d+)?)\s*(?:meses|mes|m))?(?![a-z0-9])|(?<![\w.,])([+-]?\d+(?:[.,]\d+)?)\s*(?:meses|mes|m)(?![a-z0-9])/g)];
  if (!matches.length) return { ...EMPTY };
  if (matches.length !== 1) return invalidAge("Há mais de uma idade na busca. Informe uma única idade nos campos próprios.");
  const match = matches[0];
  if (/\d\s*(?:[-–—/]|aos|ate|ou|e)\s*$/.test(text.slice(0, match.index))) {
    return invalidAge("A busca contém uma faixa ou idade ambígua. Escolha uma faixa nos botões ou informe a idade exata.");
  }
  const yearText = match[1], monthText = match[3] ?? match[4];
  const years = yearText ? Number(yearText.replace(",", ".")) : 0;
  const months = monthText ? Number(monthText.replace(",", ".")) : 0;
  const total = years * 12 + months;
  if ([yearText, monthText].some((part) => part?.startsWith("-") || part?.startsWith("+")) ||
      !Number.isInteger(months) || (match[3] !== undefined && (months > 11 || !Number.isInteger(years))) ||
      !Number.isInteger(total) || total < 0 || total > MAX_FILTER_MONTHS) return invalidAge();
  return exactAge(total);
}
/** Autoridade única de idade para motor, pódio, complementos e exportações. */
export function resolveFilterAge(fields: ExactFilterAge | undefined, selectedBand: string | null,
  query: string, bands: readonly FilterAgeBand[]): ResolvedFilterAge {
  const entered = parseExactFilterAge(fields);
  if (entered.status !== "unspecified") return entered;
  const searched = parseFilterSearchAge(query);
  if (searched.status === "invalid") return searched;
  const band = bands.find((candidate) => candidate.id === selectedBand);
  if (searched.status === "exact") {
    if (band && (searched.ageMonths! < band.min || searched.ageMonths! > band.max)) {
      return invalidAge("A idade da busca não pertence à faixa selecionada. Corrija a busca ou informe a idade nos campos próprios.");
    }
    return searched;
  }
  if (!band) return { ...EMPTY };
  return { status: "band", ageMonths: Math.round((band.min + band.max) / 2),
    ageBand: { min: band.min, max: band.max }, label: band.label,
    message: "Busca por faixa: alguns instrumentos atendem apenas parte dela. Confirme a idade exata antes de aplicar." };
}
/** Vocabulário de navegação, sem converter sintomas em diagnósticos. */
export const COMPLAINT_SEARCH_TERMS: Readonly<Record<string, readonly string[]>> = {
  atraso: ["desenvolvimento", "marcos", "bebe", "lactente", "prematuro"],
  tea: ["autismo", "autista", "espectro autista", "mchat", "m-chat"],
  tdah: ["adhd", "atencao", "hiperatividade", "impulsividade", "desatencao", "desatento"],
  linguagem: ["fala", "comunicacao", "fonologia", "vocabulario", "fala pouco"],
  aprendizagem: ["escola", "escolar", "leitura", "escrita", "dislexia", "matematica"],
  ansiedade: ["medo", "panico", "fobia", "preocupacao"],
  depressao: ["humor", "tristeza", "depressivo", "desanimo"],
  comportamento: ["conduta", "oposicao", "agressividade", "irritabilidade", "desregulacao", "birras"],
  sono: ["dormir", "dorme", "insonia", "ronco", "despertares"],
  epilepsia: ["crise", "convulsao", "convulsoes"],
  pc: ["paralisia cerebral", "espasticidade"],
  motor: ["coordenacao", "motricidade", "motor fino", "motor grosso"],
  sensorial: ["sensorial", "integracao sensorial", "hipersensibilidade"],
  suicidio: ["suicidio", "autolesao", "ideacao suicida"],
  efeitos: ["medicacao", "remedio", "efeito colateral", "efeitos adversos", "tolerabilidade", "adesao"],
  alimentacao: ["seletividade alimentar", "recusa alimentar", "engasgo", "disfagia"],
  dor: ["cefaleia", "dor de cabeca", "enxaqueca"],
  tiques: ["tique", "tourette"],
  toc: ["obsessoes", "compulsoes", "rituais"],
  cognicao: ["memoria", "raciocinio", "funcao executiva", "funcoes executivas"],
  funcionalidade: ["habilidades adaptativas", "participacao"],
  autonomia: ["autocuidado", "vida diaria", "avds"],
  evolucao: ["reavaliacao", "seguimento", "evolucao"],
};
function normalizedWords(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function hasPhrase(text: string, phrase: string): boolean {
  const term = normalizedWords(phrase);
  return !!term && ` ${text} `.includes(` ${term} `);
}
function complaintTerms(complaint: Complaint): readonly string[] {
  return [complaint.id, complaint.label, ...(COMPLAINT_SEARCH_TERMS[complaint.id] ?? [])];
}
export function inferComplaintIds(query: string, complaints: readonly Complaint[]): string[] {
  const text = normalizedWords(query);
  if (text.length < 2) return [];
  return complaints.filter((complaint) => complaintTerms(complaint).some((term) => hasPhrase(text, term)))
    .map((complaint) => complaint.id);
}
export function expandComplaintSearch(query: string, complaints: readonly Complaint[]): string {
  return [query, ...inferComplaintIds(query, complaints).flatMap((id) => [id, ...(COMPLAINT_SEARCH_TERMS[id] ?? [])])].join(" ");
}
/** Busca visual independente; mantém selecionadas visíveis, sem selecionar automaticamente. */
export function filterComplaintOptions<T extends Complaint>(complaints: readonly T[], query: string, selected: readonly string[]): T[] {
  const tokens = normalizedWords(query).split(" ").filter(Boolean);
  return complaints.filter((complaint) => {
    if (selected.includes(complaint.id) || !tokens.length) return true;
    const words = normalizedWords([...complaintTerms(complaint), complaint.parentHint ?? ""].join(" ")).split(" ");
    return tokens.every((token) => words.some((word) => token.length < 3 ? word === token : word.startsWith(token)));
  });
}

// ─────────────────────── Intenção de busca (texto livre) ───────────────────────
// A pessoa escreve como fala: "menino 5 anos não fala, pais, 10 min". A idade
// e a queixa já são lidas acima; aqui se reconhecem respondente, tempo
// disponível, finalidade, comunicação e alfabetização. NADA é aplicado
// automaticamente: a UI mostra o que entendeu e a pessoa confirma com um
// toque — respondente é vínculo clínico obrigatório, nunca um palpite.
export type FilterQueryRespondent = "pais" | "professor" | "autoaplicavel" | "teste_direto_crianca" | "clinico";
export interface FilterQueryIntent {
  respondent: FilterQueryRespondent | null;
  timeBudgetMinutes: number | null;
  assessmentType: "diagnostic" | "monitoring" | null;
  communication: "verbal" | "nonverbal" | null;
  literacy: "literate" | "preliterate" | null;
}
const EMPTY_INTENT: FilterQueryIntent = {
  respondent: null, timeBudgetMinutes: null, assessmentType: null, communication: null, literacy: null,
};
const RESPONDENT_PATTERNS: Array<[FilterQueryRespondent, RegExp]> = [
  ["teste_direto_crianca", /\b(teste direto|testes diretos|direto com a crianca|aplicar na crianca|com a crianca)\b/],
  ["autoaplicavel", /\b(autoaplicavel|autoaplicavei|autorrelato|auto relato|autoquestionario|ele mesmo|ela mesma|o proprio|a propria|adolescente responde|responde sozinh[oa])\b/],
  ["professor", /\b(professor|professora|professores|escola|creche|educador|educadora|coordenacao pedagogica)\b/],
  ["pais", /\b(pais|mae|pai|cuidador|cuidadora|cuidadores|familia|responsavel|responsaveis|avo|avos)\b/],
  ["clinico", /\b(observacao clinica|entrevista clinica|clinico|medico|no consultorio|em consulta)\b/],
];
export function parseFilterQueryIntent(query: string): FilterQueryIntent {
  const text = ` ${normalizedWords(query)} `;
  if (text.trim().length < 2) return { ...EMPTY_INTENT };
  const intent: FilterQueryIntent = { ...EMPTY_INTENT };
  for (const [respondent, pattern] of RESPONDENT_PATTERNS) {
    if (pattern.test(text)) { intent.respondent = respondent; break; }
  }
  // Tempo: "10 min", "10 minutos", "até 15 min", "em 5 minutos". Ignora
  // números que fazem parte de idade ("5 anos"/"18 meses") por exigir a
  // unidade "min". "rápido/rápida/breve" sugere 5 min.
  const time = text.match(/(?<![\d])(\d{1,3})\s*(?:min|mins|minutos|minuto)\b/);
  if (time) {
    const minutes = Number(time[1]);
    if (minutes >= 1 && minutes <= 180) intent.timeBudgetMinutes = minutes;
  } else if (/\b(rapid[oa]|breve|curt[oa]|rapidinho)\b/.test(text)) {
    intent.timeBudgetMinutes = 5;
  }
  if (/\b(monitor\w*|acompanhamento|seguimento|evolucao|evolutivo|reavaliacao|retorno|resposta ao tratamento|follow up)\b/.test(text)) {
    intent.assessmentType = "monitoring";
  } else if (/\b(diagnostic[oa]|confirmar|confirmacao|avaliacao completa|padrao ouro)\b/.test(text)) {
    intent.assessmentType = "diagnostic";
  }
  if (/\b(nao verbal|nao fala|sem fala|nao falante|nao vocaliza|ainda nao fala)\b/.test(text)) intent.communication = "nonverbal";
  else if (/\b(verbal|fala bem|ja fala)\b/.test(text) && !/\bnao verbal\b/.test(text)) intent.communication = "verbal";
  if (/\b(nao alfabetizad[oa]|pre alfabetizad[oa]|nao le|nao sabe ler|ainda nao le)\b/.test(text)) intent.literacy = "preliterate";
  else if (/\b(alfabetizad[oa]|ja le|le bem|sabe ler)\b/.test(text)) intent.literacy = "literate";
  return intent;
}

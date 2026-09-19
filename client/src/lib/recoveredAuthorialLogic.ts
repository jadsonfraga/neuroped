import { recoveredAuthorialMonitors, type RecoveredMonitor } from "@/data/recoveredAuthorialMonitors";

export interface MonitorSelectionInput {
  ageMonths: number; respondent: string; contexts: string[]; purpose: string;
  focuses: string[]; itemBudget: number; observed: boolean; urgent: string;
  alreadySelected?: string[];
}
export const monitorFocusOptions = [
  { id: "transicoes", label: "Mudanças de rotina e recuperação" },
  { id: "autonomia", label: "Autonomia e segurança cotidiana" },
  { id: "sono", label: "Sono e impacto durante o dia" },
  { id: "tiques", label: "Repercussão dos tiques" },
  { id: "generalizacao", label: "Levar o que aprendeu para outros ambientes" },
  { id: "participacao-escolar", label: "Participação e apoios na escola" },
];
export const monitorItemCount = (d: RecoveredMonitor) => d.domains.reduce((n, domain) => n + domain.items.length, 0);

/** Não confundir ausência de observação com ausência de dificuldade. */
export function monitorEligibility(d: RecoveredMonitor, input: MonitorSelectionInput): string | null {
  if (!Number.isInteger(input.ageMonths) || input.ageMonths < 0) return "Idade exata ainda não informada.";
  if (input.ageMonths < d.ageMin || input.ageMonths > d.ageMax) return "Fora da faixa etária definida para esta versão.";
  if (!d.respondents.some((r) => r === input.respondent)) return "Não adequado a este respondente; não responder pela escola ou pela criança.";
  if (!["basal", "seguimento"].includes(input.purpose)) return "Escolha basal ou seguimento funcional. Não é filtro diagnóstico.";
  if (!input.observed) return "É necessária observação direta suficiente no período.";
  if (input.urgent !== "nao") return "Interrompa a seleção e peça ajuda à equipe para avaliar a segurança atual.";
  if (!Array.isArray(input.contexts) || input.contexts.some((c) => !["casa", "escola", "terapia"].includes(c))) return "Contexto inválido.";
  if (d.contexts.includes("multiplos")) {
    if (new Set(input.contexts).size < 2) return "Generalização exige observação suficiente em pelo menos dois contextos.";
  } else if (input.contexts.length !== 1 || !d.contexts.includes(input.contexts[0])) return "Selecione um único contexto compatível; aplicações paralelas são separadas.";
  if (input.respondent === "professor" && !input.contexts.includes("escola")) return "O professor deve observar o contexto escolar.";
  if (!input.focuses.includes(d.focus)) return "Não responde às prioridades funcionais selecionadas.";
  return null;
}

/** Uma prioridade não preenche o restante com domínios irrelevantes; máximo dois formulários. */
export function planRecoveredMonitors(input: MonitorSelectionInput) {
  if (![20, 40].includes(input.itemBudget) || input.focuses.length > 3 || input.focuses.length === 0 || input.focuses.some((f) => !monitorFocusOptions.some((option) => option.id === f))) return [];
  const selected = new Set(input.alreadySelected ?? []);
  const selectedClusters = new Set(recoveredAuthorialMonitors.filter((d) => selected.has(d.id)).map((d) => d.cluster));
  // REGULA e ADAPTA compartilham parte do objetivo; preserva escolha anterior.
  if (["regula-20-sdg", "mapa-ri-18-sdg", "mcri-24-sdg", "irritabilidade-desregulacao-vs1"].some((id) => selected.has(id))) selectedClusters.add("irritabilidade-transicoes");
  let remaining = input.itemBudget;
  const result: Array<{ definition: RecoveredMonitor; reason: string; itemCount: number }> = [];
  const candidates = recoveredAuthorialMonitors.filter((d) => monitorEligibility(d, input) === null)
    .sort((a, b) => input.focuses.indexOf(a.focus) - input.focuses.indexOf(b.focus) || monitorItemCount(a) - monitorItemCount(b) || a.id.localeCompare(b.id));
  for (const definition of candidates) {
    const count = monitorItemCount(definition);
    if (selected.has(definition.id) || selectedClusters.has(definition.cluster) || count > remaining || result.length >= 2) continue;
    result.push({ definition, itemCount: count, reason: `Corresponde à prioridade ${input.focuses.indexOf(definition.focus) + 1}, à idade, ao observador e ao contexto. ${count} itens; janela de ${definition.windowDays} dias${definition.schoolDays ? " com frequência escolar" : ""}. ${definition.sourceKind === "pdf" ? "Fonte PDF conferida." : "Revisão operacional existente; não equivalente a PDF não recuperado."}` });
    selected.add(definition.id); selectedClusters.add(definition.cluster); remaining -= count;
  }
  return result;
}

export function calculateRecoveredMonitor(d: RecoveredMonitor, answers: readonly unknown[]) {
  const count = monitorItemCount(d);
  const no = d.maxPoint + 1;
  if (answers.length > count || answers.some((a) => a !== undefined && !(typeof a === "number" && Number.isInteger(a) && a >= 0 && a <= no))) throw new Error("Respostas inválidas; use as opções deste instrumento.");
  let offset = 0;
  const complete = Array.from({ length: count }, (_, i) => answers[i]).every((a) => a !== undefined);
  const domains = d.domains.map((domain) => {
    const values = Array.from({ length: domain.items.length }, (_, i) => answers[offset + i]); offset += domain.items.length;
    const scored = values.filter((v): v is number => typeof v === "number" && v <= d.maxPoint);
    const sum = scored.reduce((a, b) => a + b, 0);
    return { name: domain.name, count: domain.items.length, valid: scored.length, sum, no: values.filter((v) => v === no).length,
      value: complete && scored.length >= d.domainMinimum ? (d.metric === "mean" ? sum / scored.length : 100 * sum / (d.maxPoint * scored.length)) : null };
  });
  const valid = domains.reduce((n, r) => n + r.valid, 0);
  const sum = domains.reduce((n, r) => n + r.sum, 0);
  return { complete, count, valid, sum, domains, no: domains.reduce((n, r) => n + r.no, 0),
    total: complete && valid >= d.globalMinimum ? (d.metric === "mean" ? sum / valid : 100 * sum / (d.maxPoint * valid)) : null,
    rawTotal: complete && valid === count ? sum : null };
}

export function monitorComputedRows(d: RecoveredMonitor, answers: readonly unknown[]) {
  const result = calculateRecoveredMonitor(d, answers);
  if (!result.complete) throw new Error("Formulário incompleto; não emitir apuração final.");
  const unit = d.metric === "mean" ? `/${d.maxPoint}` : "% descritivo (não percentil)";
  const format = (n: number | null) => n === null ? "Não calculável com a cobertura observada" : `${n.toLocaleString("pt-BR", { minimumFractionDigits: d.metric === "mean" ? 2 : 1, maximumFractionDigits: d.metric === "mean" ? 2 : 1 })}${unit}`;
  return [
    { question: "Apuração — cobertura", answer: `${result.valid}/${result.count} observáveis; ${result.no} N/O. N/O não vale zero e não entra no denominador.` },
    ...result.domains.map((r) => ({ question: r.name, answer: `${format(r.value)}; ${r.valid}/${r.count} observáveis; soma observada ${r.sum}/${d.maxPoint * r.valid}. Cobertura mínima para esta apuração: ${d.domainMinimum} itens.` })),
    { question: d.metric === "percent" ? "Resumo proporcional observado" : "Média global descritiva", answer: `${format(result.total)}; ${result.valid}/${result.count} observáveis. Cobertura mínima: ${d.globalMinimum} itens, regra operacional da fonte e não ponto de corte diagnóstico.` },
    { question: "Total bruto — só com todos os itens observáveis", answer: result.rawTotal === null ? "Não calculado porque há N/O. Não prorratear totais brutos." : `${result.rawTotal}/${result.count * d.maxPoint}` },
    { question: "Direção e limites", answer: `${d.direction === "higher_better" ? "Valores maiores descrevem maior autonomia/habilidade/generalização observada." : "Valores maiores descrevem maior carga/frequência/demanda de apoio observada."} Não usar para classificar normalidade, gravidade, deficiência ou elegibilidade. Leitura item a item, contexto e red flags prevalecem. Não somar ou comparar valores de instrumentos diferentes.` },
  ];
}

export function monitorSafetyState(d: RecoveredMonitor, values: readonly string[]) {
  const complete = values.length === d.redFlags.length && Array.from({ length: d.redFlags.length }, (_, i) => values[i]).every((v) => ["nao", "sim", "incerto"].includes(v));
  return { complete, needsReview: !complete || values.some((v) => v !== "nao") };
}

export function assertRecoveredRegistry() {
  const ids = new Set<string>(); const contents = new Set<string>();
  for (const d of recoveredAuthorialMonitors) {
    const content = JSON.stringify(d.domains.flatMap((v) => v.items));
    if (ids.has(d.id) || contents.has(content)) throw new Error(`Instrumento autoral duplicado: ${d.id}`);
    if (!d.source || !d.version || !d.sourceNote || d.labels.length !== d.maxPoint + 2 || d.domains.some((v) => v.items.length < d.domainMinimum)) throw new Error(`Contrato autoral inconsistente: ${d.id}`);
    ids.add(d.id); contents.add(content);
  }
}
assertRecoveredRegistry();

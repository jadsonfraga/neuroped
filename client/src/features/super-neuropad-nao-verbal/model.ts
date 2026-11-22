/**
 * SuperNeuroPad Não Verbal — motor da aba para crianças pequenas que ainda não
 * respondem falando.
 *
 * Não cria conteúdo clínico novo: seleciona, do banco do Super NeuroPad Game da
 * idade, só os itens que a criança responde TOCANDO (ou apontando, com a
 * aplicadora tocando por ela) em figuras. Ficam de fora itens que pedem fala,
 * leitura, contagem de sílabas, contexto lido ou opções escritas em palavras.
 *
 * O registro é descritivo (acerto, erro, sem resposta, recusa, tempo e posição
 * tocada). Não há classificação, ponto de corte nem hipótese diagnóstica.
 */
import {
  gameItemsFor,
  optionOrder,
  phaseById,
  PHASE_ORDER,
  type Option,
  type PhaseId,
  type TouchItem,
} from "@/features/super-neuropad/model";

export const NV_TITLE = "SuperNeuroPad Não Verbal";
export const NV_YEARS = [2, 3, 4, 5, 6] as const;
export type NvYears = (typeof NV_YEARS)[number];
/** Sessão curta: atenção de criança pequena. */
export const NV_SESSION_MAX = 12;
/** A cada quantos desafios entra a pausa das bolhas (não pontua). */
export const NV_BREAK_EVERY = 4;
/** Segundos sem toque até o jogo chamar a atenção da criança (sem contar como resposta). */
export const NV_IDLE_SECONDS = 12;
export const NV_PREVIEW_SECONDS = 5;
/** No máximo estes desafios com resposta em número escrito: a sessão é de figuras. */
export const NV_MAX_NUMERIC = 3;

/** Enunciados que exigem fala, leitura ou consciência fonológica falada. */
const VERBAL_PROMPT = /\b(leia|leiam|fale|falar|diga|nomeie|s[ií]labas?|partes tem|palmas)\b/i;
const PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const DIGITS = /^\d{1,2}$/;

/** Opção respondível sem ler: figura do banco visual, emoji ou número curto (quantidade). */
function optionIsNonVerbal(option: Option): boolean {
  if (option.vr) return true;
  const art = option.art.trim();
  return PICTOGRAPHIC.test(art) || DIGITS.test(art);
}

/** Estímulo mostrado na tela não pode ser texto para ler. */
function stimulusIsNonVerbal(text: string | undefined): boolean {
  if (!text) return true;
  return !/[A-Za-zÀ-ÿ]{2,}/.test(text);
}

export function isNonVerbalItem(item: unknown): item is TouchItem {
  const candidate = item as TouchItem;
  if (!candidate || candidate.kind !== "toque") return false;
  if (candidate.informant === "cuidador") return false;
  if (candidate.context) return false;
  if (VERBAL_PROMPT.test(candidate.prompt)) return false;
  if (!stimulusIsNonVerbal(candidate.stimulus) || !stimulusIsNonVerbal(candidate.preview)) return false;
  return candidate.options.length >= 2 && candidate.options.every(optionIsNonVerbal);
}

/** Desafio cuja resposta é um número escrito (exige conhecer o numeral). */
export function isNumericItem(item: TouchItem): boolean {
  return item.options.every((option) => !option.vr && DIGITS.test(option.art.trim()));
}

export interface NvChallenge {
  phaseId: PhaseId;
  item: TouchItem;
}

/**
 * Desafios da sessão: itens não verbais da idade, alternando os mundos do jogo
 * (variedade prende mais a atenção) e mantendo a ordem do banco dentro de cada
 * mundo, com no máximo `NV_MAX_NUMERIC` respostas em número escrito.
 * Determinístico: a mesma idade gera a mesma sessão.
 */
export function nvChallengesFor(years: NvYears, max = NV_SESSION_MAX): NvChallenge[] {
  const queues = PHASE_ORDER.map((phaseId) => ({
    phaseId,
    items: gameItemsFor(String(years), phaseId).filter(isNonVerbalItem),
  }));
  const out: NvChallenge[] = [];
  const seen = new Set<string>();
  let progressed = true;
  while (out.length < max && progressed) {
    progressed = false;
    for (const queue of queues) {
      const next = queue.items.shift();
      if (!next) continue;
      progressed = true;
      if (seen.has(next.id)) continue;
      if (isNumericItem(next) && out.filter((entry) => isNumericItem(entry.item)).length >= NV_MAX_NUMERIC) continue;
      seen.add(next.id);
      out.push({ phaseId: queue.phaseId, item: next });
      if (out.length >= max) break;
    }
  }
  return out;
}

/**
 * Ordem das opções de cada desafio. Usa o balanceamento de posição do jogo
 * principal: a resposta esperada percorre todas as posições, então uma
 * preferência de lado aparece no registro em vez de virar acerto por acaso.
 */
export function nvOptionOrders(challenges: readonly NvChallenge[], seed: number): Option[][] {
  const ordinals = new Map<number, number>();
  return challenges.map(({ item }) => {
    const n = item.options.length;
    const ordinal = ordinals.get(n) ?? 0;
    ordinals.set(n, ordinal + 1);
    return optionOrder(item, seed, ordinal);
  });
}

export type NvStatus = "acerto" | "erro" | "sem_resposta" | "recusa";

export const NV_STATUS_LABELS: Record<NvStatus, string> = {
  acerto: "Tocou na figura esperada",
  erro: "Tocou em outra figura",
  sem_resposta: "Sem resposta",
  recusa: "Recusou",
};

export interface NvRecord {
  id: string;
  ref: string;
  phase: string;
  prompt: string;
  expected: string;
  given: string;
  status: NvStatus;
  seconds: number;
  /** Quantas vezes o enunciado foi repetido (voz ou aplicadora). */
  repeats: number;
  /** Quantas chamadas de atenção automáticas aconteceram antes da resposta. */
  attentionCalls: number;
  shown: number;
  pos?: number;
  correctPos?: number;
}

export function nvRecord(
  challenge: NvChallenge,
  shown: readonly Option[],
  chosen: Option | null,
  meta: { seconds: number; repeats: number; attentionCalls: number; refusal?: boolean },
): NvRecord {
  const { item, phaseId } = challenge;
  const status: NvStatus = chosen === null ? (meta.refusal ? "recusa" : "sem_resposta") : chosen.label === item.answer ? "acerto" : "erro";
  const pos = chosen ? shown.findIndex((option) => option.label === chosen.label) : -1;
  const correctPos = shown.findIndex((option) => option.label === item.answer);
  return {
    id: item.id,
    ref: item.ref,
    phase: phaseById(phaseId).name,
    prompt: item.prompt,
    expected: item.answer,
    given: chosen ? chosen.label : "—",
    status,
    seconds: Math.max(0, Math.round(meta.seconds)),
    repeats: meta.repeats,
    attentionCalls: meta.attentionCalls,
    shown: shown.length,
    ...(pos >= 0 ? { pos } : {}),
    ...(correctPos >= 0 ? { correctPos } : {}),
  };
}

export interface NvSummary {
  total: number;
  counts: Record<NvStatus, number>;
  /** Mediana do tempo até o toque, só entre os desafios com toque. */
  medianSeconds: number | null;
  /** Toques por posição (1ª, 2ª, …), para ver preferência de lado. */
  touchesByPosition: number[];
  repeats: number;
  attentionCalls: number;
}

export function nvSummary(records: readonly NvRecord[]): NvSummary {
  const counts: Record<NvStatus, number> = { acerto: 0, erro: 0, sem_resposta: 0, recusa: 0 };
  const times: number[] = [];
  const touchesByPosition: number[] = [];
  let repeats = 0;
  let attentionCalls = 0;
  for (const record of records) {
    counts[record.status]++;
    repeats += record.repeats;
    attentionCalls += record.attentionCalls;
    if (record.status === "acerto" || record.status === "erro") times.push(record.seconds);
    if (record.pos !== undefined) touchesByPosition[record.pos] = (touchesByPosition[record.pos] ?? 0) + 1;
  }
  times.sort((a, b) => a - b);
  const medianSeconds = times.length === 0 ? null : times.length % 2 ? times[(times.length - 1) / 2] : (times[times.length / 2 - 1] + times[times.length / 2]) / 2;
  return { total: records.length, counts, medianSeconds, touchesByPosition: Array.from(touchesByPosition, (value) => value ?? 0), repeats, attentionCalls };
}

/** Texto para a aplicadora copiar no prontuário: descritivo, sem classificação. */
export function nvReportText(records: readonly NvRecord[], years: number, notice: string, generatedAt: string): string {
  const summary = nvSummary(records);
  const lines = [
    `${NV_TITLE} — registro da aplicação`,
    `Idade informada: ${years} anos · Gerado em ${generatedAt}`,
    `Desafios aplicados: ${summary.total}`,
    `Tocou na figura esperada: ${summary.counts.acerto} · Tocou em outra figura: ${summary.counts.erro} · Sem resposta: ${summary.counts.sem_resposta} · Recusou: ${summary.counts.recusa}`,
    `Mediana do tempo até o toque: ${summary.medianSeconds === null ? "—" : `${summary.medianSeconds} s`}`,
    `Toques por posição na tela: ${summary.touchesByPosition.length ? summary.touchesByPosition.map((count, index) => `${index + 1}ª: ${count}`).join(" · ") : "—"}`,
    `Enunciados repetidos: ${summary.repeats} · Chamadas de atenção do jogo: ${summary.attentionCalls}`,
    "",
    "Desafio a desafio:",
    ...records.map(
      (record, index) =>
        `${index + 1}. [${record.phase}] ${record.prompt} — esperado: ${record.expected}; tocou: ${record.given}; ${NV_STATUS_LABELS[record.status]}; ${record.seconds} s${record.repeats ? `; repetido ${record.repeats}×` : ""} (${record.ref})`,
    ),
    "",
    "Itens retirados do banco do Super NeuroPad Game da idade; só desafios respondidos por toque ou apontar, sem fala, leitura ou escrita.",
    "A criança recebeu a mesma comemoração a cada toque, sem indicação de certo ou errado.",
    notice,
  ];
  return lines.join("\n");
}

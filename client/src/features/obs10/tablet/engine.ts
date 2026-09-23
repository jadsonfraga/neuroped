import { z } from "zod";
import { TABLET_LIMIT, TABLET_LIMITS, TABLET_VERSION, tabletPlan } from "./protocol";

export const OUTCOME_IDS = ["E", "V", "M", "A", "ND", "R", "NA"] as const;
export type TabletOutcome = typeof OUTCOME_IDS[number];
export type WizardPhase = "setup" | "camera" | "rehearsal" | "ready" | "cue" | "child" | "response" | "review" | "delivery";
export type Point = { x: number; y: number };
const pointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();
const contextSchema = z.object({ code: z.string().min(1).max(32).regex(/^[A-Za-z0-9_-]+$/), months: z.number().int().min(0).max(215), schooling: z.string().max(120), communication: z.string().max(200), conditions: z.string().max(1000) }).strict();
export type TabletContext = z.infer<typeof contextSchema>;
const observationSchema = z.object({ taskId: z.string().max(80), attempted: z.boolean(), openedAt: z.number().min(0).max(TABLET_LIMIT).nullable(), outcome: z.enum(OUTCOME_IDS).nullable(), note: z.string().max(2000), editedAfterEnd: z.boolean() }).strict();
export type TabletObservation = z.infer<typeof observationSchema>;
const eventSchema = z.object({ seq: z.number().int().min(1), second: z.number().min(0).max(TABLET_LIMIT), taskId: z.string().max(80).nullable(), type: z.enum(["start", "shown", "select", "stroke", "clear", "response", "skip", "end"]), value: z.union([z.string().max(200), z.array(pointSchema).min(1).max(512)]).optional() }).strict();
export type TabletEvent = z.infer<typeof eventSchema>;
export const recordSchema = z.object({ protocol: z.literal(TABLET_VERSION), modality: z.literal("tablet-exploratory"), sessionId: z.string().min(1).max(80).regex(/^[A-Za-z0-9_-]+$/), context: contextSchema, bandId: z.string().max(8), durationSeconds: z.number().min(0).max(TABLET_LIMIT), endReason: z.string().min(1).max(300), camera: z.enum(["integrated", "external"]), observations: z.array(observationSchema).max(30), events: z.array(eventSchema).max(1500), eventLimitReached: z.boolean(), reviewed: z.boolean(), revision: z.number().int().nonnegative(), importedForReview: z.boolean() }).strict();
export type TabletRecord = z.infer<typeof recordSchema>;
export interface TabletState { phase: WizardPhase; record: TabletRecord | null; cursor: number; elapsed: number; error: string }
export const initialTabletState = (): TabletState => ({ phase: "setup", record: null, cursor: 0, elapsed: 0, error: "" });
export const isCollecting = (phase: WizardPhase): boolean => ["cue", "child", "response"].includes(phase);
export type TabletAction =
  | { type: "next-setup" }
  | { type: "back-setup" }
  | { type: "start"; context: TabletContext; sessionId: string; camera: "integrated" | "external" }
  | { type: "tick"; second: number }
  | { type: "show" }
  | { type: "response" }
  | { type: "input"; event: "select" | "stroke" | "clear"; value?: string | Point[] }
  | { type: "save"; outcome: TabletOutcome; note: string }
  | { type: "skip"; reason: string }
  | { type: "end"; reason: string; second: number }
  | { type: "amend"; taskId: string; note: string }
  | { type: "reviewed"; value: boolean }
  | { type: "delivery" }
  | { type: "back-review" }
  | { type: "import"; record: TabletRecord };
function revise(r: TabletRecord, patch: Partial<TabletRecord>): TabletRecord { return { ...r, ...patch, reviewed: false, revision: r.revision + 1 }; }
function log(r: TabletRecord, second: number, taskId: string | null, type: TabletEvent["type"], value?: TabletEvent["value"]): TabletRecord {
  const points = r.events.reduce((n, e) => n + (Array.isArray(e.value) ? e.value.length : 0), 0);
  if (Array.isArray(value) && points + value.length > 12000) return { ...r, eventLimitReached: true };
  // Preserve room for the terminal event; saturation is explicit, never silently successful.
  if (r.events.length >= 1499 && type !== "end") return { ...r, eventLimitReached: true };
  if (r.events.length >= 1500) return { ...r, eventLimitReached: true };
  return { ...r, events: [...r.events, { seq: r.events.length + 1, second, taskId, type, ...(value === undefined ? {} : { value }) }] };
}
export function tabletReducer(s: TabletState, a: TabletAction): TabletState {
  if (a.type === "next-setup") {
    const steps: WizardPhase[] = ["setup", "camera", "rehearsal", "ready"];
    const i = steps.indexOf(s.phase);
    return i >= 0 && i < 3 ? { ...s, phase: steps[i + 1], error: "" } : s;
  }
  if (a.type === "back-setup") {
    const steps: WizardPhase[] = ["setup", "camera", "rehearsal", "ready"];
    const i = steps.indexOf(s.phase);
    return i > 0 ? { ...s, phase: steps[i - 1], error: "" } : s;
  }
  if (a.type === "start") {
    if (s.phase !== "ready") return s;
    const context = contextSchema.safeParse(a.context);
    const plan = context.success ? tabletPlan(context.data.months) : null;
    if (!context.success || !plan || !/^[A-Za-z0-9_-]{1,80}$/.test(a.sessionId)) return { ...s, error: "Confira idade e código institucional." };
    const record: TabletRecord = { protocol: TABLET_VERSION, modality: "tablet-exploratory", sessionId: a.sessionId, context: context.data, bandId: plan.bandId, durationSeconds: 0, endReason: "Coleta em andamento", camera: a.camera, observations: [], events: [], eventLimitReached: false, reviewed: false, revision: 0, importedForReview: false };
    return { phase: "cue", record: log(record, 0, null, "start"), cursor: 0, elapsed: 0, error: "" };
  }
  if (a.type === "import") {
    if (s.phase !== "setup" || s.record) return s;
    try { const record = parseTabletRecord(JSON.stringify(a.record)); return { phase: "review", record: { ...record, reviewed: false, importedForReview: true, revision: record.revision + 1 }, cursor: 0, elapsed: record.durationSeconds, error: "" }; }
    catch { return { ...s, error: "Arquivo incompatível. Nenhum registro atual foi substituído." }; }
  }
  if (!s.record) return s;
  let r = s.record;
  const plan = tabletPlan(r.context.months)!;
  const task = plan.tasks[s.cursor];
  if (a.type === "tick" || a.type === "end") {
    if (!isCollecting(s.phase) || !Number.isFinite(a.second)) return s;
    const elapsed = Math.min(TABLET_LIMIT, Math.max(s.elapsed, a.second));
    if (a.type === "tick" && elapsed < TABLET_LIMIT) return { ...s, elapsed };
    const reason = a.type === "end" ? a.reason.slice(0, 300) || "Encerramento solicitado" : "Limite absoluto de dez minutos atingido";
    r = revise(log(r, elapsed, task?.id ?? null, "end", reason.slice(0, 200)), { durationSeconds: elapsed, endReason: reason });
    return { ...s, record: r, elapsed, phase: "review", error: "" };
  }
  if (a.type === "show" && s.phase === "cue" && task) {
    if (r.observations.some((o) => o.taskId === task.id)) return s;
    r = revise(log(r, s.elapsed, task.id, "shown"), { observations: [...r.observations, { taskId: task.id, attempted: true, openedAt: s.elapsed, outcome: null, note: "", editedAfterEnd: false }] });
    return { ...s, record: r, phase: "child", error: "" };
  }
  if (a.type === "response" && s.phase === "child") return { ...s, phase: "response", error: "" };
  if (a.type === "input" && s.phase === "child" && task) {
    const allowed = a.event === "select" ? (task.kind === "choice" ? ["circle", "square"].includes(String(a.value)) : task.kind === "count" && ["0", "1", "2", "3", "4"].includes(String(a.value))) && typeof a.value === "string" : task.kind === "drawing" && (a.event === "clear" || z.array(pointSchema).min(1).max(512).safeParse(a.value).success);
    if (!allowed) return s;
    return { ...s, record: log(r, s.elapsed, task.id, a.event, a.value) };
  }
  if ((a.type === "save" && s.phase === "response") || (a.type === "skip" && s.phase === "cue")) {
    const note = (a.type === "save" ? a.note : a.reason).trim();
    if (!note || note.length > 2000 || (a.type === "save" && !OUTCOME_IDS.includes(a.outcome))) return { ...s, error: "Descreva o que aconteceu ou por que não aplicou. Não complete por suposição." };
    const prev = r.observations.find((o) => o.taskId === task.id);
    const observation: TabletObservation = a.type === "save" && prev ? { ...prev, outcome: a.outcome, note } : { taskId: task.id, attempted: false, openedAt: null, outcome: "NA", note, editedAfterEnd: false };
    r = revise(log(r, s.elapsed, task.id, a.type === "save" ? "response" : "skip", a.type === "save" ? a.outcome : "NA"), { observations: [...r.observations.filter((o) => o.taskId !== task.id), observation] });
    if (s.cursor + 1 >= plan.tasks.length) {
      r = revise(log(r, s.elapsed, null, "end", "Roteiro encerrado"), { durationSeconds: s.elapsed, endReason: "Roteiro encerrado" });
      return { ...s, record: r, phase: "review", error: "" };
    }
    return { ...s, record: r, cursor: s.cursor + 1, phase: "cue", error: "" };
  }
  if (a.type === "amend" && ["response", "review", "delivery"].includes(s.phase)) {
    if (a.note.length > 2000 || !r.observations.some((o) => o.taskId === a.taskId) || (s.phase === "response" && a.taskId !== task.id)) return s;
    return { ...s, record: revise(r, { observations: r.observations.map((o) => o.taskId === a.taskId ? { ...o, note: a.note, editedAfterEnd: o.editedAfterEnd || !isCollecting(s.phase) } : o) }), error: "" };
  }
  if (a.type === "reviewed" && ["review", "delivery"].includes(s.phase)) return { ...s, record: { ...r, reviewed: a.value, revision: r.revision + 1 } };
  if (a.type === "delivery" && s.phase === "review") return { ...s, phase: "delivery", error: "" };
  if (a.type === "back-review" && s.phase === "delivery") return { ...s, phase: "review" };
  return s;
}
export function parseTabletRecord(text: string): TabletRecord {
  if (new TextEncoder().encode(text).length > 4 * 1024 * 1024) throw new Error("Arquivo excede 4 MB.");
  const r = recordSchema.parse(JSON.parse(text));
  const plan = tabletPlan(r.context.months);
  if (!plan || plan.bandId !== r.bandId) throw new Error("Idade e ficha incompatíveis.");
  if (r.events[0]?.type !== "start" || r.events.at(-1)?.type !== "end") throw new Error("Somente coleta encerrada pode ser reaberta.");
  const ids = new Set(plan.tasks.map((t) => t.id));
  const seen = new Set<string>();
  for (const o of r.observations) {
    if (!ids.has(o.taskId) || seen.has(o.taskId) || (o.openedAt !== null && o.openedAt > r.durationSeconds) || (!o.attempted && (o.outcome !== "NA" || o.openedAt !== null)) || (o.attempted && o.openedAt === null)) throw new Error("Observação incompatível.");
    const shown = r.events.filter((e) => e.type === "shown" && e.taskId === o.taskId);
    if (o.attempted && (shown.length !== 1 || shown[0].second !== o.openedAt)) throw new Error("Abertura não rastreável.");
    seen.add(o.taskId);
  }
  let last = 0; let points = 0;
  for (const [i, e] of r.events.entries()) {
    if (e.seq !== i + 1 || e.second < last || e.second > r.durationSeconds || (e.taskId !== null && !ids.has(e.taskId))) throw new Error("Sequência de eventos inválida.");
    const t = plan.tasks.find((item) => item.id === e.taskId);
    if (e.type === "stroke" && (t?.kind !== "drawing" || !Array.isArray(e.value))) throw new Error("Traçado incompatível.");
    if (e.type === "clear" && t?.kind !== "drawing") throw new Error("Limpeza incompatível.");
    if (e.type === "select" && (!t || !["choice", "count"].includes(t.kind) || typeof e.value !== "string")) throw new Error("Toque incompatível.");
    if (Array.isArray(e.value)) points += e.value.length;
    if (points > 12000) throw new Error("Traçados excedem o limite operacional.");
    last = e.second;
  }
  return r;
}
export function drawingStrokes(events: TabletEvent[], taskId: string): Point[][] {
  let strokes: Point[][] = [];
  for (const e of events) if (e.taskId === taskId) { if (e.type === "clear") strokes = []; if (e.type === "stroke" && Array.isArray(e.value)) strokes.push(e.value); }
  return strokes;
}
export function tabletText(r: TabletRecord): string {
  const plan = tabletPlan(r.context.months)!;
  const lines = ["NEUROPED · OBS-10 TABLET · REGISTRO EXPLORATÓRIO", TABLET_LIMITS, `Versão: ${r.protocol} | Sessão: ${r.sessionId} | Revisão: ${r.revision}`, `Código: ${r.context.code} | Idade: ${r.context.months} meses | Ficha: ${plan.bandLabel}`, `Escolaridade: ${r.context.schooling || "Não informada"}`, `Comunicação: ${r.context.communication || "Não informada"}`, `Condições relatadas: ${r.context.conditions || "Não informadas"}`, `Duração: ${r.durationSeconds.toFixed(1)} s | Encerramento: ${r.endReason}`, `Captação solicitada: ${r.camera}. Integridade e enquadramento não são verificados automaticamente.`, r.importedForReview ? "Arquivo importado somente para revisão; origem e veracidade não autenticadas. Nenhum vídeo recuperado." : "Registro local; não houve envio automático ao prontuário.", "", "OBSERVAÇÕES DECLARADAS PELA APLICADORA"];
  for (const t of plan.tasks) {
    const o = r.observations.find((entry) => entry.taskId === t.id);
    lines.push(`\n${t.title} | Modalidade: ${t.kind}`, `Proposta: ${t.command}`, o ? `Resposta registrada: ${o.outcome ?? "Categoria não registrada"}. ${o.note || "Descrição ausente; não inferir achado."}${o.editedAfterEnd ? " [Descrição complementada após encerramento.]" : ""}` : "Não houve observação registrada desta tarefa. Não concluir ausência de habilidade.");
    if (t.kind === "drawing") lines.push("Traçado por toque, sem equivalência à escrita manual. Dados brutos no JSON. Uma interrupção pode deixar o último traço parcial.");
    if (t.memory === "recall") lines.push("Evocação só pode ser interpretada pelo médico com o registro inicial e as interferências. Intervalos de tela não são medidas normativas.");
  }
  lines.push("", "COBERTURA QUE ESTE MODO NÃO EXAMINA", ...plan.limitations, "", `Conferência humana: ${r.reviewed ? "declarada pela aplicadora" : "não declarada"}. Não é assinatura médica nem recibo de envio.`, `Eventos operacionais: ${r.events.length}; ${r.eventLimitReached ? "LIMITE ATINGIDO, registros de interação podem estar incompletos" : "sem truncamento sinalizado"}. Não são escores ou tempos de reação calibrados.`, "O JSON contém registro e traçados, não o vídeo. Arquivos exigem armazenamento institucional autorizado.");
  return lines.join("\n");
}

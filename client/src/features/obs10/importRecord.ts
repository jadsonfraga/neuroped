import { evidenceSchema, evidenceReferencesValid } from "./evidence";
import { pilotSchema } from "./pilot";
import { z } from "zod";
import { AGE_BANDS, OUTCOMES, bandForMonths } from "./protocol";
import { MATERIALS, PRACTICAL_TASKS } from "./practical";
import { emptyHandoff, type SessionRecord } from "./session";

export const MAX_RECORD_BYTES = 4 * 1024 * 1024;
const text = (max: number) => z.string().max(max);
const second = z.number().int().min(0).max(600);
const schema = z.object({
  version: z.enum(["1.0.0", "1.1.0", "1.2.0", "1.3.0", "1.4.0", "1.5.0", "1.6.0", "1.6.1"]),
  sessionId: text(100).regex(/^[a-zA-Z0-9-]*$/).optional(),
  context: z.object({
    code: text(32), chronologicalMonths: z.number().int().min(0).max(215),
    correctedMonths: z.number().int().min(0).max(23).nullable(),
    bandId: text(10).refine((value) => AGE_BANDS.some((band) => band.id === value)),
    schooling: text(120), language: text(120), adaptations: text(1500), conditions: text(1500), familyReport: text(2000),
    proneAllowed: z.boolean(), missingMaterials: z.array(text(100)).max(17).optional(),
    preparation: z.literal("direct").optional(),
  }).strict(),
  observations: z.array(z.object({
    id: text(80).min(1).regex(/^[a-zA-Z0-9_-]+$/), phase: z.number().int().min(0).max(5),
    task: text(180), response: text(2000), outcome: text(3).refine((value) => value === "" || OUTCOMES.some((item) => item.id === value)),
    assistance: text(1000), quality: z.enum(["", "Nítido", "Parcial", "Não avaliável"]),
    clip: text(40), videoTime: text(20), applicationSecond: second,
    modelInInstruction: z.boolean().optional(), recordedAfterEnd: z.boolean().optional(), editedAfterEnd: z.boolean().optional(),
  }).strict()).max(200),
  durationSeconds: second, endReason: text(600).min(1), encodingSecond: second.nullable(), recallSecond: second.nullable(),
  recording: text(1000), sourceRecording: text(1000).optional(), importedForReview: z.boolean().optional(),
  evidence: evidenceSchema.optional(), pilot: pilotSchema.optional(),
  handoff: z.object({ recordsReviewed: z.boolean(), mediaReviewed: z.boolean(), filesChecked: z.boolean(), declaredAt: z.string().datetime().nullable() }).strict().optional(),
}).strict();
export type ImportResult = { ok: true; record: SessionRecord } | { ok: false; error: string };

/** Read a bounded local document as untrusted data. Never revive HTML, URLs, video or a running session. */
export function parseRecordJSON(raw: string): ImportResult {
  if (new TextEncoder().encode(raw).length > MAX_RECORD_BYTES) return { ok: false, error: "Arquivo maior que 4 MB. Escolha apenas o JSON de uma aplicação OBS-10." };
  try {
    const result = schema.safeParse(JSON.parse(raw.replace(/^\uFEFF/, "")));
    if (!result.success) return { ok: false, error: "Arquivo incompatível ou incompleto. Aceitos registros OBS-10 1.0 a 1.6.1; nenhum dado atual foi alterado." };
    const data = result.data;
    const c = data.context;
    if ((c.correctedMonths !== null && (c.chronologicalMonths >= 24 || c.correctedMonths > c.chronologicalMonths))
      || bandForMonths(c.correctedMonths ?? c.chronologicalMonths)?.id !== c.bandId) throw new Error("Age mismatch");
    if (data.encodingSecond !== null && data.encodingSecond > data.durationSeconds) throw new Error("Encoding after collection");
    if (data.recallSecond !== null && (data.encodingSecond === null || data.recallSecond < data.encodingSecond || data.recallSecond > data.durationSeconds)) throw new Error("Invalid recall interval");
    const ids = new Set<string>();
    const materials = new Set<string>(Object.values(MATERIALS).map((item) => item.label));
    if (c.missingMaterials?.some((value) => !materials.has(value)) || new Set(c.missingMaterials).size !== (c.missingMaterials?.length ?? 0)) throw new Error("Invalid material list");
    for (const entry of data.observations) {
      if (ids.has(entry.id) || entry.applicationSecond > data.durationSeconds) throw new Error("Duplicate or invalid timestamp");
      ids.add(entry.id);
      if (entry.id.startsWith("guided-")) {
        const task = PRACTICAL_TASKS[c.bandId].find((item) => `guided-${item.id}` === entry.id);
        if (!task || task.phase !== entry.phase) throw new Error("Task outside the selected sheet");
        // A declared model cannot be downgraded by an imported document, and the
        // guided task keeps the sheet's canonical title: report and dossier must agree.
        entry.modelInInstruction = Boolean(task.model);
        entry.task = task.title;
      }
    }
    if (data.evidence && !evidenceReferencesValid(data.evidence, data.sessionId, data.observations as SessionRecord["observations"])) throw new Error("Invalid evidence references");
    return { ok: true, record: {
      ...data, observations: data.observations as SessionRecord["observations"],
      sourceRecording: data.sourceRecording ?? data.recording,
      recording: "Vídeo não incluído no JSON. Nenhum arquivo de vídeo foi carregado ou verificado nesta revisão.",
      importedForReview: true, handoff: emptyHandoff(),
      ...(data.evidence ? { evidence: { ...data.evidence, reviews: data.evidence.reviews.map((r) => ({ ...r, origin: "imported-unverified" as const })) } } : {}),
      ...(data.pilot ? { pilot: { ...data.pilot, source: "imported-unverified" as const } } : {}),
    } };
  } catch {
    return { ok: false, error: "JSON inválido ou com idades, tarefas ou tempos inconsistentes. A sessão atual foi preservada." };
  }
}

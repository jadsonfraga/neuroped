import { z } from "zod";
import type { Observation, SessionRecord } from "./session";

/** Local evidence is not a signature, diagnosis or identity authentication. */
export const MAX_VIDEO_BYTES = 128 * 1024 * 1024;
export const MAX_CLIPS = 8;
export const MAX_MOMENTS = 200;
export const MAX_REVIEWS = 300;
export const DECISIONS = ["Concordante com o registro", "Discordância a esclarecer", "Trecho insuficiente"] as const;
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const instant = z.string().datetime();
const position = z.number().finite().min(0).max(3600);
export const clipSchema = z.object({
  id, sessionId: id, label: z.string().min(1).max(40), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  bytes: z.number().int().min(1).max(MAX_VIDEO_BYTES), mime: z.string().max(100),
  durationSeconds: position.nullable(), associatedAt: instant,
}).strict();
export const momentSchema = z.object({
  id, clipId: id, observationId: id, startSecond: position, endSecond: position,
  sourceSnapshot: z.string().max(9000), createdAt: instant, method: z.literal("player-position"),
}).strict().refine((m) => m.endSecond > m.startSecond, "O fim deve ser posterior ao início");
export const reviewSchema = z.object({
  id, momentId: id, decision: z.enum(DECISIONS), comment: z.string().min(1).max(2000),
  sourceSnapshot: z.string().max(9000), createdAt: instant,
  role: z.enum(["admin", "professional"]), origin: z.enum(["local-session", "imported-unverified"]),
}).strict();
export const evidenceSchema = z.object({
  schemaVersion: z.literal("1.0.0"), clips: z.array(clipSchema).max(MAX_CLIPS),
  moments: z.array(momentSchema).max(MAX_MOMENTS), reviews: z.array(reviewSchema).max(MAX_REVIEWS),
}).strict();
export type ClipReference = z.infer<typeof clipSchema>;
export type EvidenceMoment = z.infer<typeof momentSchema>;
export type ProfessionalReview = z.infer<typeof reviewSchema>;
export type EvidenceBundle = z.infer<typeof evidenceSchema>;
export const emptyEvidence = (): EvidenceBundle => ({ schemaVersion: "1.0.0", clips: [], moments: [], reviews: [] });
export function snapshotObservation(o: Observation): string {
  return JSON.stringify([o.id, o.phase, o.task, o.response, o.outcome, o.assistance, o.quality, Boolean(o.modelInInstruction)]);
}
export function canAddMedicalReview(mode: string, role?: string): role is "admin" | "professional" {
  return mode === "remote" && (role === "admin" || role === "professional");
}
export function validMoment(start: number, end: number, duration: number | null): boolean {
  return Number.isFinite(start) && Number.isFinite(end) && start >= 0 && end > start && end <= 3600
    && (duration === null || end <= duration + 0.05);
}
export function evidenceReferencesValid(e: EvidenceBundle, sessionId: string | undefined, observations: Observation[]): boolean {
  if (!sessionId && (e.clips.length || e.moments.length || e.reviews.length)) return false;
  const clips = new Map(e.clips.map((c) => [c.id, c]));
  const moments = new Map(e.moments.map((m) => [m.id, m]));
  const obs = new Set(observations.map((o) => o.id));
  return clips.size === e.clips.length && moments.size === e.moments.length
    && new Set(e.reviews.map((r) => r.id)).size === e.reviews.length
    && new Set(e.clips.map((c) => c.sha256)).size === e.clips.length
    && e.clips.every((c) => c.sessionId === sessionId)
    && e.moments.every((m) => { const c = clips.get(m.clipId); return c && obs.has(m.observationId) && validMoment(m.startSecond, m.endSecond, c.durationSeconds); })
    && e.reviews.every((r) => moments.has(r.momentId));
}
export function momentChanged(m: EvidenceMoment, observations: Observation[]): boolean {
  const o = observations.find((item) => item.id === m.observationId);
  return !o || snapshotObservation(o) !== m.sourceSnapshot;
}
export function reviewChanged(r: ProfessionalReview, e: EvidenceBundle, observations: Observation[]): boolean {
  const m = e.moments.find((item) => item.id === r.momentId);
  const o = observations.find((item) => item.id === m?.observationId);
  return !o || snapshotObservation(o) !== r.sourceSnapshot;
}
export function mediaClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
}
export function evidenceText(record: SessionRecord): string {
  const e = record.evidence;
  if (!e || (!e.clips.length && !e.moments.length && !e.reviews.length)) return "EVIDÊNCIAS AUDIOVISUAIS: nenhum arquivo associado nesta documentação.";
  const lines = ["EVIDÊNCIAS AUDIOVISUAIS E COMENTÁRIOS PROFISSIONAIS", "Referências e comentários declarados. JSON não inclui vídeo, não autentica a criança, autoria ou verdade clínica. SHA-256 permite comparar bytes do arquivo, não sua identidade clínica."];
  for (const c of e.clips) lines.push(`${c.label} · ${c.bytes} bytes · SHA-256 ${c.sha256} · associação declarada ${c.associatedAt}.`);
  for (const m of e.moments) {
    const o = record.observations.find((item) => item.id === m.observationId);
    lines.push(`${o?.task || m.observationId} · ${e.clips.find((c) => c.id === m.clipId)?.label} · ${mediaClock(m.startSecond)}–${mediaClock(m.endSecond)} · posições marcadas no reprodutor. ${momentChanged(m, record.observations) ? "Registro modificado desde a marcação: reconferir." : "Registro textual coincide com a cópia da marcação; não implica revisão médica."}`);
    const reviews = e.reviews.filter((r) => r.momentId === m.id);
    for (const r of reviews) lines.push(`Comentário ${r.createdAt} · ${r.decision} · ${r.origin === "imported-unverified" ? "importado, autoria não autenticada" : "registrado nesta sessão por conta profissional, sem assinatura"} · ${reviewChanged(r, e, record.observations) ? "REGISTRO ALTERADO: RECONFERIR" : "referente à versão textual atual"}: ${r.comment}`);
  }
  lines.push("Não há análise automática da imagem, do som ou da semiologia; o conteúdo exige avaliação médica. A ausência de comentário não significa normalidade.");
  return lines.join("\n");
}

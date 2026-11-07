/**
 * Diários de acompanhamento no Clinical LIVE (por clínica e por paciente).
 *
 * Registro observacional relatado (família, escola, terapeuta, paciente ou
 * equipe). Não é escala, não pontua, não interpreta e não gera diagnóstico.
 * O conteúdo é cifrado por clínica no servidor; este contrato só valida forma
 * e limites, nunca o sentido clínico do que foi relatado.
 */

export const LIVE_DIARY_IDS = [
  "diario-sono",
  "diario-alimentar",
  "diario-aderencia",
  "diario-desregulacao",
  "diario-dieta-sensorial",
  "diario-escola",
] as const;
export type LiveDiaryId = (typeof LIVE_DIARY_IDS)[number];

export const LIVE_DIARY_REPORTERS = ["family", "patient", "school", "therapist", "clinician"] as const;
export type LiveDiaryReporter = (typeof LIVE_DIARY_REPORTERS)[number];

export const LIVE_DIARY_LIMITS = {
  maxFields: 40,
  maxFieldLength: 2_000,
  maxPayloadBytes: 20_000,
  maxListed: 500,
} as const;

const FIELD_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

export interface LiveDiaryEntryInput {
  clinicId: string;
  patientId: string;
  diaryId: LiveDiaryId;
  entryDate: string;
  reportedBy: LiveDiaryReporter;
  fields: Record<string, string>;
  supersedesEntryId: string | null;
}

export type LiveDiaryValidation =
  | { ok: true; value: LiveDiaryEntryInput }
  | { ok: false; code: string; message: string };

function fail(code: string, message: string): LiveDiaryValidation {
  return { ok: false, code, message };
}

export function isLiveDiaryId(value: unknown): value is LiveDiaryId {
  return typeof value === "string" && (LIVE_DIARY_IDS as readonly string[]).includes(value);
}

/** Data de calendário real (rejeita 2026-02-31) e não futura em mais de um dia. */
export function isValidDiaryDate(value: string, now: Date = new Date()): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false;
  if (y < 1900) return false;
  return date.getTime() <= now.getTime() + 36 * 60 * 60 * 1000;
}

export function validateLiveDiaryEntry(body: Record<string, unknown>, now: Date = new Date()): LiveDiaryValidation {
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  const patientId = typeof body.patientId === "string" ? body.patientId.trim() : "";
  if (!clinicId || !OPAQUE_ID.test(patientId)) return fail("VALIDATION_ERROR", "clinicId e patientId válidos são obrigatórios.");
  if (!isLiveDiaryId(body.diaryId)) return fail("VALIDATION_ERROR", "Diário desconhecido.");
  const entryDate = typeof body.entryDate === "string" ? body.entryDate.trim() : "";
  if (!isValidDiaryDate(entryDate, now)) return fail("VALIDATION_ERROR", "Data do registro inválida ou futura.");
  const reportedBy = body.reportedBy ?? "family";
  if (typeof reportedBy !== "string" || !(LIVE_DIARY_REPORTERS as readonly string[]).includes(reportedBy)) {
    return fail("VALIDATION_ERROR", "Origem do relato inválida.");
  }
  let supersedesEntryId: string | null = null;
  if (body.supersedesEntryId !== undefined && body.supersedesEntryId !== null && body.supersedesEntryId !== "") {
    if (typeof body.supersedesEntryId !== "string" || !OPAQUE_ID.test(body.supersedesEntryId)) {
      return fail("VALIDATION_ERROR", "supersedesEntryId inválido.");
    }
    supersedesEntryId = body.supersedesEntryId;
  }
  const rawFields = body.fields;
  if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) {
    return fail("VALIDATION_ERROR", "fields deve ser um objeto.");
  }
  const fields: Record<string, string> = {};
  const entries = Object.entries(rawFields as Record<string, unknown>);
  if (entries.length > LIVE_DIARY_LIMITS.maxFields) return fail("VALIDATION_ERROR", "Campos demais no registro.");
  for (const [key, value] of entries) {
    if (!FIELD_KEY.test(key)) return fail("VALIDATION_ERROR", "Nome de campo inválido.");
    if (key === "date") continue; // a data vive em entryDate
    if (value === null || value === undefined || value === "") continue;
    if (typeof value !== "string" && typeof value !== "number") return fail("VALIDATION_ERROR", "Valor de campo inválido.");
    const text = String(value).trim();
    if (text.length > LIVE_DIARY_LIMITS.maxFieldLength) return fail("VALIDATION_ERROR", "Campo excede o limite de texto.");
    if (text) fields[key] = text;
  }
  if (Object.keys(fields).length === 0) return fail("VALIDATION_ERROR", "Registro vazio.");
  const bytes = new TextEncoder().encode(JSON.stringify(fields)).byteLength;
  if (bytes > LIVE_DIARY_LIMITS.maxPayloadBytes) return fail("PAYLOAD_TOO_LARGE", "Registro excede 20 KB.");
  return {
    ok: true,
    value: { clinicId, patientId, diaryId: body.diaryId, entryDate, reportedBy: reportedBy as LiveDiaryReporter, fields, supersedesEntryId },
  };
}

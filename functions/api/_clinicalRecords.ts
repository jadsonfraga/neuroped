import {
  blindIndexTokens,
  decryptClinicalOrLegacy,
  encryptClinicalPayload,
  type BlindTokenGroup,
  type ClinicalCryptoEnv,
} from "./_clinicalCrypto";

export interface PatientSecurePayload {
  name: string;
  birth_date: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  diagnosis_code: string | null;
  notes: string | null;
}

export interface ConsultationSecurePayload {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

export interface ScaleSecurePayload {
  scale_id: string;
  scale_name: string;
  score: unknown;
  interpretation: unknown;
  details: string | null;
}

export interface DocumentSecurePayload {
  type: string;
  title: string;
  content: string | null;
}

export interface MemorySecurePayload {
  title: string | null;
  content: string;
  category: string | null;
  source: string | null;
  tags: string | null;
}

export interface ClinicalEventSecurePayload {
  event_type: unknown;
  encounter_id: unknown;
  provenance_kind: unknown;
  provenance_source: unknown;
  payload_json: string;
}

export interface ConectaSecurePayload {
  category: unknown;
  context: unknown;
  value: unknown;
  duration_minutes: unknown;
  payload_json: string | null;
}

function nullable(value: unknown): string | null {
  return value == null ? null : String(value);
}

export async function readPatientPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<PatientSecurePayload> {
  const id = String(row.id ?? "");
  return decryptClinicalOrLegacy<PatientSecurePayload>(
    env,
    { entityType: "patient", entityId: id, patientId: id },
    row.notes,
    () => ({
      name: String(row.name ?? ""),
      birth_date: nullable(row.birth_date),
      guardian_name: nullable(row.guardian_name),
      guardian_phone: nullable(row.guardian_phone),
      diagnosis_code: nullable(row.diagnosis_code),
      notes: nullable(row.notes),
    }),
  );
}

export async function patientStorage(
  env: ClinicalCryptoEnv,
  id: string,
  payload: PatientSecurePayload,
): Promise<{ envelope: string; search: BlindTokenGroup }> {
  return {
    envelope: await encryptClinicalPayload(
      env,
      { entityType: "patient", entityId: id, patientId: id },
      payload,
    ),
    search: await blindIndexTokens(env, [payload.name, payload.guardian_name, payload.diagnosis_code]),
  };
}

export async function readConsultationPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<ConsultationSecurePayload> {
  const id = String(row.id ?? "");
  const patientId = String(row.patient_id ?? "");
  return decryptClinicalOrLegacy<ConsultationSecurePayload>(
    env,
    { entityType: "consultation", entityId: id, patientId },
    row.subjective,
    () => ({
      subjective: nullable(row.subjective),
      objective: nullable(row.objective),
      assessment: nullable(row.assessment),
      plan: nullable(row.plan),
    }),
  );
}

export async function consultationStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string,
  payload: ConsultationSecurePayload,
): Promise<string> {
  return encryptClinicalPayload(env, { entityType: "consultation", entityId: id, patientId }, payload);
}

export async function readScalePayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<ScaleSecurePayload> {
  const id = String(row.id ?? "");
  const patientId = String(row.patient_id ?? "");
  return decryptClinicalOrLegacy<ScaleSecurePayload>(
    env,
    { entityType: "scale_result", entityId: id, patientId },
    row.details,
    () => ({
      scale_id: String(row.scale_id ?? ""),
      scale_name: String(row.scale_name ?? ""),
      score: row.score ?? null,
      interpretation: row.interpretation ?? null,
      details: nullable(row.details),
    }),
  );
}

export async function scaleStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string,
  payload: ScaleSecurePayload,
): Promise<string> {
  return encryptClinicalPayload(env, { entityType: "scale_result", entityId: id, patientId }, payload);
}

export async function readDocumentPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<DocumentSecurePayload> {
  const id = String(row.id ?? "");
  const patientId = String(row.patient_id ?? "");
  return decryptClinicalOrLegacy<DocumentSecurePayload>(
    env,
    { entityType: "document", entityId: id, patientId },
    row.content,
    () => ({ type: String(row.type ?? ""), title: String(row.title ?? ""), content: nullable(row.content) }),
  );
}

export async function documentStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string,
  payload: DocumentSecurePayload,
): Promise<string> {
  return encryptClinicalPayload(env, { entityType: "document", entityId: id, patientId }, payload);
}

export async function readMemoryPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<MemorySecurePayload> {
  const id = String(row.id ?? "");
  const patientId = row.patient_id == null ? null : String(row.patient_id);
  return decryptClinicalOrLegacy<MemorySecurePayload>(
    env,
    { entityType: "memory_note", entityId: id, patientId },
    row.content,
    () => ({
      title: nullable(row.title),
      content: String(row.content ?? ""),
      category: nullable(row.category),
      source: nullable(row.source),
      tags: nullable(row.tags),
    }),
  );
}

export async function memoryStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string | null,
  payload: MemorySecurePayload,
): Promise<{ envelope: string; search: BlindTokenGroup }> {
  return {
    envelope: await encryptClinicalPayload(
      env,
      { entityType: "memory_note", entityId: id, patientId },
      payload,
    ),
    search: await blindIndexTokens(env, [payload.title, payload.content, payload.category, payload.tags]),
  };
}

export async function readClinicalEventPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<ClinicalEventSecurePayload> {
  const id = String(row.id ?? "");
  const patientId = String(row.patient_id ?? "");
  return decryptClinicalOrLegacy<ClinicalEventSecurePayload>(
    env,
    { entityType: "clinical_event", entityId: id, patientId },
    row.payload_json,
    () => ({
      event_type: row.event_type,
      encounter_id: row.encounter_id ?? null,
      provenance_kind: row.provenance_kind,
      provenance_source: row.provenance_source,
      payload_json: String(row.payload_json ?? "{}"),
    }),
  );
}

export async function clinicalEventStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string,
  payload: ClinicalEventSecurePayload,
): Promise<string> {
  return encryptClinicalPayload(env, { entityType: "clinical_event", entityId: id, patientId }, payload);
}

export async function readConectaPayload(
  env: ClinicalCryptoEnv,
  row: Record<string, unknown>,
): Promise<ConectaSecurePayload> {
  const id = String(row.id ?? "");
  const patientId = String(row.patient_id ?? "");
  return decryptClinicalOrLegacy<ConectaSecurePayload>(
    env,
    { entityType: "conecta_event", entityId: id, patientId },
    row.payload_json,
    () => ({
      category: row.category,
      context: row.context ?? null,
      value: row.value ?? null,
      duration_minutes: row.duration_minutes ?? null,
      payload_json: nullable(row.payload_json),
    }),
  );
}

export async function conectaStorage(
  env: ClinicalCryptoEnv,
  id: string,
  patientId: string,
  payload: ConectaSecurePayload,
): Promise<string> {
  return encryptClinicalPayload(env, { entityType: "conecta_event", entityId: id, patientId }, payload);
}

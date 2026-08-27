import { clinicalBlindIndex } from "../../tenant/_crypto";
import type { TenantEnv } from "../../tenant/_core";

export type PatientSearchField = "name" | "guardian_name" | "external_reference";

export interface SearchablePatientProfile {
  name: string;
  guardianName: string | null;
}

function normalizedSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchVariants(value: string): string[] {
  const normalized = normalizedSearchValue(value);
  if (!normalized) return [];
  const words = normalized.split(" ").filter((word) => word.length >= 2);
  return Array.from(new Set([normalized, ...words])).slice(0, 8);
}

export function hasUsefulSearchValue(value: string): boolean {
  return normalizedSearchValue(value).length >= 2;
}

export async function preparePatientSearchTokenStatements(
  db: D1Database,
  env: TenantEnv,
  clinicId: string,
  patientId: string,
  profile: SearchablePatientProfile,
  externalReference: string | null,
  includeExternalReference = true,
  now = new Date().toISOString(),
  writeGuardUpdatedAt?: string,
): Promise<D1PreparedStatement[]> {
  const fields: Array<[PatientSearchField, string | null]> = [
    ["name", profile.name],
    ["guardian_name", profile.guardianName],
    ...(includeExternalReference
      ? [["external_reference", externalReference] as [PatientSearchField, string | null]]
      : []),
  ];
  const statements: D1PreparedStatement[] = [];
  for (const [field, value] of fields) {
    for (const variant of searchVariants(value ?? "")) {
      const token = await clinicalBlindIndex(env, clinicId, "patient-search", `${field}:${variant}`);
      const sql = writeGuardUpdatedAt
        ? `INSERT INTO live_patient_search_tokens
             (id, clinic_id, patient_id, field, token, created_at)
           SELECT ?, ?, ?, ?, ?, ?
            WHERE EXISTS (
              SELECT 1 FROM live_patients
               WHERE id = ? AND clinic_id = ? AND updated_at = ?
            )`
        : `INSERT INTO live_patient_search_tokens
             (id, clinic_id, patient_id, field, token, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`;
      const params = writeGuardUpdatedAt
        ? [crypto.randomUUID(), clinicId, patientId, field, token, now, patientId, clinicId, writeGuardUpdatedAt]
        : [crypto.randomUUID(), clinicId, patientId, field, token, now];
      statements.push(db.prepare(sql).bind(...params));
    }
  }
  return statements;
}

export async function searchTokensForQuery(
  env: TenantEnv,
  clinicId: string,
  query: string,
): Promise<string[]> {
  const tokens: string[] = [];
  for (const field of ["name", "guardian_name", "external_reference"] as const) {
    for (const variant of searchVariants(query)) {
      tokens.push(
        await clinicalBlindIndex(env, clinicId, "patient-search", `${field}:${variant}`),
      );
    }
  }
  return tokens;
}

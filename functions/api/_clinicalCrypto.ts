import {
  CLINICAL_LEGACY_SENTINEL,
  clinicalBlindTokensForQuery,
  clinicalBlindTokensForValue,
  decryptClinicalJson,
  decryptClinicalText,
  encryptClinicalJson,
  encryptClinicalText,
  type ClinicalFieldScope,
  type ClinicalKeyring,
} from "../../shared/clinical-crypto";

export interface ClinicalCryptoEnv {
  CLINICAL_DATA_KEY?: string;
  CLINICAL_DATA_KEY_PREVIOUS?: string;
  CLINICAL_ENCRYPTION_STRICT?: string;
}

export interface ClinicalSearchTokenStatementOptions {
  resourceType: string;
  resourceId: string;
  patientId?: string | null;
  ownerUserId?: string | null;
  values: Array<string | null | undefined>;
}

export function clinicalKeyringFromEnv(env: ClinicalCryptoEnv): ClinicalKeyring {
  const active = env.CLINICAL_DATA_KEY?.trim() ?? "";
  if (active.length < 32) throw new Error("CLINICAL_DATA_KEY_NOT_CONFIGURED");
  const previous = env.CLINICAL_DATA_KEY_PREVIOUS?.trim() || null;
  return {
    active,
    previous,
    strict: env.CLINICAL_ENCRYPTION_STRICT === "true",
  };
}

export function clinicalScope(table: string, rowId: string, field = "secure_payload"): ClinicalFieldScope {
  return { table, rowId, field };
}

export async function encryptClinicalPayload(
  env: ClinicalCryptoEnv,
  table: string,
  rowId: string,
  value: unknown,
): Promise<string> {
  return encryptClinicalJson(clinicalKeyringFromEnv(env).active, clinicalScope(table, rowId), value);
}

export async function decryptClinicalPayload<T>(
  env: ClinicalCryptoEnv,
  table: string,
  rowId: string,
  encrypted: string | null | undefined,
  legacyJson?: string | null,
): Promise<T | null> {
  return decryptClinicalJson<T>(
    clinicalKeyringFromEnv(env),
    clinicalScope(table, rowId),
    encrypted,
    legacyJson,
  );
}

export async function encryptClinicalField(
  env: ClinicalCryptoEnv,
  table: string,
  rowId: string,
  field: string,
  value: string,
): Promise<string> {
  return encryptClinicalText(
    clinicalKeyringFromEnv(env).active,
    clinicalScope(table, rowId, field),
    value,
  );
}

export async function decryptClinicalField(
  env: ClinicalCryptoEnv,
  table: string,
  rowId: string,
  field: string,
  encrypted: string | null | undefined,
  legacy?: string | null,
): Promise<string | null> {
  return decryptClinicalText(
    clinicalKeyringFromEnv(env),
    clinicalScope(table, rowId, field),
    encrypted,
    legacy,
  );
}

export async function blindTokensForQuery(
  env: ClinicalCryptoEnv,
  resourceType: string,
  query: string,
): Promise<string[]> {
  return clinicalBlindTokensForQuery(clinicalKeyringFromEnv(env), resourceType, query);
}

export async function replaceClinicalSearchTokensStatements(
  db: D1Database,
  env: ClinicalCryptoEnv,
  options: ClinicalSearchTokenStatementOptions,
): Promise<D1PreparedStatement[]> {
  const active = clinicalKeyringFromEnv(env).active;
  const hashes = new Set<string>();
  for (const value of options.values) {
    if (!value) continue;
    for (const hash of await clinicalBlindTokensForValue(active, options.resourceType, value)) hashes.add(hash);
  }
  const statements: D1PreparedStatement[] = [
    db
      .prepare("DELETE FROM clinical_search_tokens WHERE resource_type = ? AND resource_id = ?")
      .bind(options.resourceType, options.resourceId),
  ];
  for (const tokenHash of hashes) {
    statements.push(
      db
        .prepare(
          `INSERT INTO clinical_search_tokens
            (resource_type, resource_id, patient_id, owner_user_id, token_hash, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(resource_type, resource_id, token_hash) DO UPDATE SET
             patient_id = excluded.patient_id,
             owner_user_id = excluded.owner_user_id`,
        )
        .bind(
          options.resourceType,
          options.resourceId,
          options.patientId ?? null,
          options.ownerUserId ?? null,
          tokenHash,
          new Date().toISOString(),
        ),
    );
  }
  return statements;
}

export function encryptedLegacySentinel(): string {
  return CLINICAL_LEGACY_SENTINEL;
}

export function clinicalCryptoErrorResponse(error: unknown): Response | null {
  const message = error instanceof Error ? error.message : String(error);
  if (
    message === "CLINICAL_DATA_KEY_NOT_CONFIGURED" ||
    message === "CLINICAL_DATA_KEY_NOT_CONFIGURED_NOT_CONFIGURED"
  ) {
    return Response.json(
      { error: "Criptografia clínica não configurada.", code: "CLINICAL_CRYPTO_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (
    message === "CLINICAL_PLAINTEXT_FORBIDDEN" ||
    message === "CLINICAL_CIPHERTEXT_INVALID" ||
    message === "CLINICAL_JSON_INVALID"
  ) {
    return Response.json(
      { error: "Registro clínico não passou na verificação criptográfica.", code: "CLINICAL_CRYPTO_INTEGRITY" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

/**
 * GET  /api/patients — lista os pacientes visíveis ao usuário autenticado.
 * POST /api/patients — cria um paciente pertencente ao usuário autenticado.
 *
 * Produção D1: PII/PHI clínica fica em envelope AES-GCM e a busca usa blind index.
 */

import {
  authorizationError,
  canWriteClinicalData,
  getContextUser,
  isAdmin,
} from "../auth/_authorization";
import {
  normalizePatientWrite,
  parsePositiveInteger,
  type PatientApiRecord,
  type PatientDatabaseRow,
} from "./_contract";
import {
  blindTokenGroupsForQuery,
  clinicalCryptoErrorResponse,
  decryptClinicalPayload,
  encryptedLegacySentinel,
  encryptClinicalPayload,
  replaceClinicalSearchTokensStatements,
  type ClinicalCryptoEnv,
} from "../_clinicalCrypto";
import { isPlainObject } from "../_request";

interface Env extends ClinicalCryptoEnv {
  DB?: D1Database;
}

interface SecurePatientRow extends PatientDatabaseRow {
  owner_user_id?: unknown;
  secure_payload_encrypted?: unknown;
}

interface SecurePatientPayload {
  name: string;
  birthDate: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  diagnosisCode: string | null;
  notes: string | null;
}

const DEMO_PATIENTS: PatientApiRecord[] = [
  {
    id: "demo-001",
    name: "Demo Paciente 1 — Fictício",
    birthDate: "2018-03-15",
    guardianName: "Responsável Demo 1",
    guardianPhone: "(81) 99000-0001",
    diagnosisCode: "F84.0",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    isDemo: true,
    createdAt: new Date("2025-01-10").toISOString(),
    updatedAt: new Date("2025-01-10").toISOString(),
  },
  {
    id: "demo-002",
    name: "Demo Paciente 2 — Fictício",
    birthDate: "2016-07-22",
    guardianName: "Responsável Demo 2",
    guardianPhone: "(81) 99000-0002",
    diagnosisCode: "F90.0",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    isDemo: true,
    createdAt: new Date("2025-02-14").toISOString(),
    updatedAt: new Date("2025-02-14").toISOString(),
  },
  {
    id: "demo-003",
    name: "Demo Paciente 3 — Fictício",
    birthDate: "2020-11-05",
    guardianName: "Responsável Demo 3",
    guardianPhone: "(81) 99000-0003",
    diagnosisCode: "G40.3",
    notes: "Paciente de demonstração — dados fictícios. Não representa pessoa real.",
    isDemo: true,
    createdAt: new Date("2025-03-01").toISOString(),
    updatedAt: new Date("2025-03-01").toISOString(),
  },
];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function errorResponse(message: string, code: string, status: number): Response {
  return jsonResponse({ error: message, code }, status);
}

function nullable(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function legacyPayload(row: SecurePatientRow): SecurePatientPayload {
  const legacyName = nullable(row.name);
  return {
    name: legacyName && legacyName !== encryptedLegacySentinel() ? legacyName : "",
    birthDate: nullable(row.birth_date),
    guardianName: nullable(row.guardian_name),
    guardianPhone: nullable(row.guardian_phone),
    diagnosisCode: nullable(row.diagnosis_code),
    notes: nullable(row.notes),
  };
}

async function decodePatient(env: Env, row: SecurePatientRow): Promise<PatientApiRecord> {
  const id = String(row.id ?? "");
  const legacy = legacyPayload(row);
  const payload = await decryptClinicalPayload<SecurePatientPayload>(
    env,
    "patients_demo",
    id,
    nullable(row.secure_payload_encrypted),
    legacy.name ? JSON.stringify(legacy) : null,
  );
  if (!payload?.name) throw new Error("CLINICAL_CIPHERTEXT_INVALID");
  return {
    id,
    name: payload.name,
    birthDate: payload.birthDate ?? null,
    guardianName: payload.guardianName ?? null,
    guardianPhone: payload.guardianPhone ?? null,
    diagnosisCode: payload.diagnosisCode ?? null,
    notes: payload.notes ?? null,
    isDemo: row.is_demo === true || row.is_demo === 1 || row.is_demo === "1",
    createdAt: nullable(row.created_at),
    updatedAt: nullable(row.updated_at),
  };
}

function blindSearchSql(groups: string[][]): { clause: string; binds: string[] } {
  const binds: string[] = [];
  const clauses = groups.map((group) => {
    binds.push(...group);
    return `EXISTS (
      SELECT 1 FROM clinical_search_tokens cst
       WHERE cst.resource_type = 'patient'
         AND cst.resource_id = p.id
         AND cst.token_hash IN (${group.map(() => "?").join(",")})
    )`;
  });
  return { clause: clauses.length ? `AND ${clauses.join(" AND ")}` : "", binds };
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const page = parsePositiveInteger(url.searchParams.get("page"), 1, 1_000_000);
  const limit = parsePositiveInteger(url.searchParams.get("limit"), 20, 50);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 160);

  if (!env.DB) {
    let results = DEMO_PATIENTS;
    if (search) {
      const query = search.toLocaleLowerCase("pt-BR");
      results = results.filter((patient) =>
        [patient.name, patient.diagnosisCode, patient.guardianName].some((value) =>
          String(value ?? "").toLocaleLowerCase("pt-BR").includes(query),
        ),
      );
    }
    const offset = (page - 1) * limit;
    return jsonResponse({ data: results.slice(offset, offset + limit), total: results.length, page, limit, mode: "demo" });
  }

  const user = getContextUser(context);
  if (!user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);

  try {
    const groups = search ? await blindTokenGroupsForQuery(env, "patient", search) : [];
    if (search && groups.length === 0) {
      return jsonResponse({ data: [], total: 0, page, limit, mode: "db" });
    }
    const searchSql = blindSearchSql(groups);
    const ownershipClause = isAdmin(user) ? "" : "AND p.owner_user_id = ?";
    const ownershipBinds = isAdmin(user) ? [] : [user.id];
    const queryBinds = [...ownershipBinds, ...searchSql.binds];
    const offset = (page - 1) * limit;

    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM patients_demo p
        WHERE p.is_demo = 1 ${ownershipClause} ${searchSql.clause}`,
    ).bind(...queryBinds).first<{ total: number }>();

    const rows = await env.DB.prepare(
      `SELECT p.id, p.owner_user_id, p.name, p.birth_date, p.guardian_name, p.guardian_phone,
              p.diagnosis_code, p.notes, p.secure_payload_encrypted,
              p.is_demo, p.created_at, p.updated_at
         FROM patients_demo p
        WHERE p.is_demo = 1 ${ownershipClause} ${searchSql.clause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
    ).bind(...queryBinds, limit, offset).all<SecurePatientRow>();

    const data = await Promise.all((rows.results ?? []).map((row) => decodePatient(env, row)));
    return jsonResponse({ data, total: countResult?.total ?? 0, page, limit, mode: "db" });
  } catch (error) {
    const cryptoResponse = clinicalCryptoErrorResponse(error);
    if (cryptoResponse) return cryptoResponse;
    console.error("[patients.GET] DB error:", error);
    return errorResponse("Erro ao buscar pacientes.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const user = env.DB ? getContextUser(context) : null;
  if (env.DB && !user) return authorizationError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (user && !canWriteClinicalData(user)) {
    return authorizationError("Perfil sem permissão para criar pacientes.", "FORBIDDEN", 403);
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return errorResponse("Corpo da requisição inválido ou não é JSON.", "INVALID_JSON", 400);
  }
  if (!isPlainObject(parsed)) return errorResponse("Corpo deve ser um objeto JSON.", "INVALID_JSON", 400);

  const normalized = normalizePatientWrite(parsed, { requireName: true });
  if (!normalized.ok) return errorResponse(normalized.message, "VALIDATION_ERROR", 400);
  if (!env.DB) return errorResponse("Persistência indisponível. Nenhum paciente foi criado.", "DB_REQUIRED", 503);

  const id = `demo-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const payload: SecurePatientPayload = {
    name: normalized.values.name!,
    birthDate: normalized.values.birth_date ?? null,
    guardianName: normalized.values.guardian_name ?? null,
    guardianPhone: normalized.values.guardian_phone ?? null,
    diagnosisCode: normalized.values.diagnosis_code ?? null,
    notes: normalized.values.notes ?? null,
  };

  try {
    const encrypted = await encryptClinicalPayload(env, "patients_demo", id, payload);
    const insert = env.DB.prepare(
      `INSERT INTO patients_demo
        (id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes,
         secure_payload_encrypted, owner_user_id, is_demo, created_at, updated_at)
       VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, ?, ?, 1, ?, ?)`,
    ).bind(id, encryptedLegacySentinel(), encrypted, user!.id, now, now);
    const searchStatements = await replaceClinicalSearchTokensStatements(env.DB, env, {
      resourceType: "patient",
      resourceId: id,
      patientId: id,
      ownerUserId: user!.id,
      values: [payload.name, payload.guardianName, payload.diagnosisCode],
    });
    const results = await env.DB.batch([insert, ...searchStatements]);
    if ((results[0]?.meta.changes ?? 0) !== 1) throw new Error("PATIENT_INSERT_FAILED");

    return jsonResponse({
      id,
      name: payload.name,
      birthDate: payload.birthDate,
      guardianName: payload.guardianName,
      guardianPhone: payload.guardianPhone,
      diagnosisCode: payload.diagnosisCode,
      notes: payload.notes,
      isDemo: true,
      createdAt: now,
      updatedAt: now,
      mode: "db",
    }, 201);
  } catch (error) {
    const cryptoResponse = clinicalCryptoErrorResponse(error);
    if (cryptoResponse) return cryptoResponse;
    console.error("[patients.POST] DB error:", error);
    return errorResponse("Erro ao criar paciente.", "DB_ERROR", 500);
  }
};

/**
 * Diários de acompanhamento no Clinical LIVE — por clínica e por paciente.
 *
 * Registro observacional relatado (família, escola, terapeuta, paciente ou
 * equipe): não pontua, não interpreta, não é escala. Conteúdo cifrado por
 * clínica; colunas em claro só com metadados estruturados. Auditoria
 * metadata-only (nunca o texto relatado).
 *
 * GET   ?clinicId&patientId[&diaryId][&history=1] → registros ativos (ou todos com history=1)
 * POST  { clinicId, patientId, diaryId, entryDate, reportedBy, fields, supersedesEntryId? }
 * PATCH { clinicId, id, action: "void" } → anula um registro ativo (não apaga)
 *
 * Migration 0039 pendente → 503 LIVE_DIARY_MIGRATION_PENDING, sem falso sucesso.
 */
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import { isMissingExportTable } from "../../tenant/_exportPayload";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import {
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  decryptClinicalJson,
  encryptClinicalJson,
} from "../../tenant/_crypto";
import { isLiveDiaryId, LIVE_DIARY_LIMITS, validateLiveDiaryEntry } from "../../../../shared/live-diaries";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;
const TABLE = "live_diary_entries";

interface DiaryRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  author_user_id: string;
  diary_id: string;
  entry_date: string;
  reported_by: string;
  payload_encrypted: string;
  encryption_version: string;
  supersedes_entry_id: string | null;
  status: "active" | "corrected" | "voided";
  created_at: string;
}

const COLUMNS = `id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
  payload_encrypted, encryption_version, supersedes_entry_id, status, created_at`;

function purpose(id: string): string {
  return `live-diary-entry:${id}`;
}

function pending(): Response {
  return tenantError(
    "Diários indisponíveis até a migration 0039 ser aplicada. Nenhum registro foi gravado.",
    "LIVE_DIARY_MIGRATION_PENDING",
    503,
  );
}

function requireLiveConfiguration(env: TenantEnv): Response | null {
  if (!clinicalLiveEnabled(env)) return tenantError("Clinical Core LIVE permanece bloqueado.", "CLINICAL_LIVE_DISABLED", 503);
  if (!clinicalCryptoReady(env)) return tenantError("Keyring clínico dedicado não configurado.", "CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  return null;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function patientInClinic(db: D1Database, clinicId: string, patientId: string): Promise<boolean> {
  const row = await db
    .prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? AND status != 'merged' LIMIT 1`)
    .bind(patientId, clinicId)
    .first<{ id: string }>();
  return Boolean(row);
}

async function present(env: TenantEnv, row: DiaryRow) {
  const fields = await decryptClinicalJson<Record<string, unknown>>(env, row.clinic_id, purpose(row.id), row.payload_encrypted);
  return {
    id: row.id,
    patientId: row.patient_id,
    authorUserId: row.author_user_id,
    diaryId: row.diary_id,
    entryDate: row.entry_date,
    reportedBy: row.reported_by,
    fields: fields && typeof fields === "object" ? fields : {},
    supersedesEntryId: row.supersedes_entry_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;

  const url = new URL(context.request.url);
  const clinicId = (url.searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  const patientId = (url.searchParams.get("patientId") ?? "").trim();
  const diaryId = (url.searchParams.get("diaryId") ?? "").trim();
  const history = url.searchParams.get("history") === "1";
  if (!clinicId || !OPAQUE_ID.test(patientId)) return tenantError("clinicId e patientId são obrigatórios.", "VALIDATION_ERROR", 400);
  if (diaryId && !isLiveDiaryId(diaryId)) return tenantError("Diário desconhecido.", "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientInClinic(db, clinicId, patientId))) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);

  let rows: DiaryRow[];
  try {
    const result = await db
      .prepare(
        `SELECT ${COLUMNS} FROM ${TABLE}
          WHERE clinic_id = ? AND patient_id = ?
            AND (? = '' OR diary_id = ?)
            AND (? = 1 OR status = 'active')
          ORDER BY entry_date DESC, created_at DESC
          LIMIT ${LIVE_DIARY_LIMITS.maxListed}`,
      )
      .bind(clinicId, patientId, diaryId, diaryId, history ? 1 : 0)
      .all<DiaryRow>();
    rows = result.results ?? [];
  } catch (error) {
    if (isMissingExportTable(error, TABLE)) return pending();
    console.error("[live.diaries.GET] DB error", error);
    return tenantError("Não foi possível listar o diário.", "DB_ERROR", 500);
  }
  try {
    const data = await Promise.all(rows.map((row) => present(context.env, row)));
    return tenantJson({ data });
  } catch (error) {
    console.error("[live.diaries.GET] decrypt failure", error);
    return tenantError("Diário indisponível.", "CLINICAL_DECRYPT_FAILED", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const parsed = validateLiveDiaryEntry(body);
  if (!parsed.ok) return tenantError(parsed.message, parsed.code, parsed.code === "PAYLOAD_TOO_LARGE" ? 413 : 400);
  const input = parsed.value;

  const membership = await getClinicMembership(db, input.clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, input.clinicId, "clinical");
  if (billingError) return billingError;
  if (!(await patientInClinic(db, input.clinicId, input.patientId))) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);

  const id = crypto.randomUUID();
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const payloadEncrypted = await encryptClinicalJson(context.env, input.clinicId, purpose(id), input.fields);
  const insertSql = `INSERT INTO ${TABLE}
      (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by,
       payload_encrypted, encryption_version, supersedes_entry_id, status)`;
  const bindings = [
    id, input.clinicId, input.patientId, user.id, input.diaryId, input.entryDate, input.reportedBy,
    payloadEncrypted, encryptionVersion, input.supersedesEntryId,
  ];
  const audit = prepareSaasAudit(
    db,
    {
      clinicId: input.clinicId,
      actorUserId: user.id,
      action: input.supersedesEntryId ? "live_diary_entry_correct" : "live_diary_entry_create",
      targetType: "live_diary_entry",
      targetId: id,
      // só enums: sem texto relatado, sem paciente, sem data
      metadata: { diaryId: input.diaryId, reportedBy: input.reportedBy, fieldCount: Object.keys(input.fields).length, encryptionVersion },
    },
    true,
  );

  try {
    if (input.supersedesEntryId) {
      // Correção: a antiga sai de 'active' e a nova entra no mesmo batch; se o
      // UPDATE não atingir exatamente a linha ativa do mesmo paciente/diário,
      // nada mais persiste (INSERT e auditoria condicionados a changes() = 1).
      const results = await db.batch([
        db
          .prepare(
            `UPDATE ${TABLE} SET status = 'corrected'
              WHERE id = ? AND clinic_id = ? AND patient_id = ? AND diary_id = ? AND status = 'active'`,
          )
          .bind(input.supersedesEntryId, input.clinicId, input.patientId, input.diaryId),
        db.prepare(`${insertSql} SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active' WHERE changes() = 1`).bind(...bindings),
        audit,
      ]);
      if ([0, 1, 2].some((i) => Number(results[i]?.meta?.changes ?? 0) !== 1)) {
        return tenantError("O registro mudou ou não está mais ativo. Recarregue o diário.", "STALE_SUPERSESSION", 409);
      }
    } else {
      const results = await db.batch([
        db.prepare(`${insertSql} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`).bind(...bindings),
        audit,
      ]);
      if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
        return tenantError("O registro não foi persistido.", "DB_ERROR", 500);
      }
    }
  } catch (error) {
    if (isMissingExportTable(error, TABLE)) return pending();
    const message = error instanceof Error ? error.message : String(error);
    if (/LIVE_DIARY_SUPERSESSION_MISMATCH|UNIQUE constraint failed/.test(message)) {
      return tenantError("O registro corrigido não pertence a este diário ou já foi corrigido.", "INVALID_SUPERSESSION", 409);
    }
    console.error("[live.diaries.POST] DB error", error);
    return tenantError("Não foi possível registrar no diário.", "DB_ERROR", 500);
  }

  const row = await db.prepare(`SELECT ${COLUMNS} FROM ${TABLE} WHERE id = ? AND clinic_id = ?`).bind(id, input.clinicId).first<DiaryRow>();
  if (!row) return tenantError("O registro não foi persistido.", "DB_ERROR", 500);
  return tenantJson(await present(context.env, row), 201);
};

export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const configError = requireLiveConfiguration(context.env);
  if (configError) return configError;
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!clinicId || !OPAQUE_ID.test(id) || body.action !== "void") {
    return tenantError("clinicId, id e action \"void\" são obrigatórios.", "VALIDATION_ERROR", 400);
  }
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;

  try {
    const current = await db
      .prepare(`SELECT diary_id, status FROM ${TABLE} WHERE id = ? AND clinic_id = ? LIMIT 1`)
      .bind(id, clinicId)
      .first<{ diary_id: string; status: string }>();
    // Anti-enumeração: registro de outra clínica responde igual a inexistente.
    if (!current) return tenantError("Registro não encontrado nesta clínica.", "NOT_FOUND", 404);
    if (current.status !== "active") return tenantError("Somente registro ativo pode ser anulado.", "ENTRY_NOT_ACTIVE", 409);
    const results = await db.batch([
      db.prepare(`UPDATE ${TABLE} SET status = 'voided' WHERE id = ? AND clinic_id = ? AND status = 'active'`).bind(id, clinicId),
      prepareSaasAudit(
        db,
        { clinicId, actorUserId: user.id, action: "live_diary_entry_void", targetType: "live_diary_entry", targetId: id, metadata: { diaryId: current.diary_id } },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O registro mudou durante a operação.", "STALE", 409);
    }
  } catch (error) {
    if (isMissingExportTable(error, TABLE)) return pending();
    console.error("[live.diaries.PATCH] DB error", error);
    return tenantError("Não foi possível anular o registro.", "DB_ERROR", 500);
  }
  return tenantJson({ id, status: "voided" });
};

/**
 * Registro de uso de IA — Resolução CFM 2.454/2026, art. 4º, V (registrar no prontuário o uso de IA
 * como apoio), arts. 5º §1º e 11 (informar o paciente), art. 5º §3º (recusa informada).
 *
 * Guarda SÓ metadados estruturados (ferramenta, finalidade, quem, quando, dados enviados, revisão
 * humana, ciência da família). Nunca conteúdo clínico, resultado de teste, nível ou classificação.
 * Migration 0036 (não aplicada): sem a tabela, responde 503 AI_REGISTRY_MIGRATION_PENDING.
 */
import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  buildAiChartLine,
  validateAiUseInput,
  validateFamilyAck,
  type AiFamilyStatus,
  type AiPurpose,
  type AiDataSharing,
} from "../../../../shared/lgpd-compliance";
import { isMissingExportTable } from "../../tenant/_exportPayload";
import {
  getClinicMembership,
  membershipCanReadClinical,
  membershipCanWriteClinical,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface Row {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  actor_user_id: string;
  actor_name: string | null;
  tool: string;
  purpose: AiPurpose;
  data_sharing: AiDataSharing;
  risk_level: "baixo" | "medio" | "alto" | null;
  human_reviewed: number;
  used_at: string;
  family_status: AiFamilyStatus;
  family_status_at: string | null;
  created_at: string;
}

const SELECT = `SELECT r.id, r.clinic_id, r.patient_id, r.actor_user_id, u.name AS actor_name, r.tool, r.purpose,
  r.data_sharing, r.risk_level, r.human_reviewed, r.used_at, r.family_status, r.family_status_at, r.created_at
  FROM ai_use_records r LEFT JOIN users u ON u.id = r.actor_user_id`;

function present(r: Row) {
  return {
    id: r.id,
    patientId: r.patient_id,
    actorUserId: r.actor_user_id,
    actorName: r.actor_name ?? "Profissional",
    tool: r.tool,
    purpose: r.purpose,
    dataSharing: r.data_sharing,
    riskLevel: r.risk_level,
    humanReviewed: r.human_reviewed === 1,
    usedAt: r.used_at,
    familyStatus: r.family_status,
    familyStatusAt: r.family_status_at,
    createdAt: r.created_at,
    suggestedChartLine: buildAiChartLine({
      tool: r.tool,
      purpose: r.purpose,
      dataSharing: r.data_sharing,
      humanReviewed: r.human_reviewed === 1,
      usedAt: r.used_at,
      actorName: r.actor_name ?? "o profissional",
      familyStatus: r.family_status,
      familyAt: r.family_status_at,
    }),
  };
}

function pending(): Response {
  return tenantError("Registro de IA indisponível até a migration 0036 ser aplicada.", "AI_REGISTRY_MIGRATION_PENDING", 503);
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = await request.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const url = new URL(context.request.url);
  const clinicId = (url.searchParams.get("clinicId") ?? "").trim().slice(0, 80);
  const patientId = (url.searchParams.get("patientId") ?? "").trim();
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  if (patientId && !OPAQUE_ID.test(patientId)) return tenantError("patientId inválido.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanReadClinical(membership)) return tenantError("Acesso clínico negado para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  try {
    const stmt = patientId
      ? db.prepare(`${SELECT} WHERE r.clinic_id = ? AND r.patient_id = ? ORDER BY r.used_at DESC LIMIT 100`).bind(clinicId, patientId)
      : db.prepare(`${SELECT} WHERE r.clinic_id = ? ORDER BY r.used_at DESC LIMIT 100`).bind(clinicId);
    const rows = await stmt.all<Row>();
    return tenantJson({ data: (rows.results ?? []).map(present) });
  } catch (error) {
    if (isMissingExportTable(error, "ai_use_records")) return pending();
    console.error("[live.ai-use.GET] DB error", error);
    return tenantError("Não foi possível listar o registro de IA.", "DB_ERROR", 500);
  }
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const parsed = validateAiUseInput(body);
  if (!parsed.ok) return tenantError(parsed.message, parsed.code, 400);
  const input = parsed.value;

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;
  if (input.patientId) {
    const p = await db.prepare(`SELECT id FROM live_patients WHERE id = ? AND clinic_id = ? LIMIT 1`).bind(input.patientId, clinicId).first();
    if (!p) return tenantError("Paciente não encontrado nesta clínica.", "PATIENT_NOT_FOUND", 404);
  }

  const id = crypto.randomUUID();
  try {
    const results = await db.batch([
      db
        .prepare(
          `INSERT INTO ai_use_records
             (id, clinic_id, patient_id, actor_user_id, tool, purpose, data_sharing, risk_level, human_reviewed, used_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, clinicId, input.patientId, user.id, input.tool, input.purpose, input.dataSharing, input.riskLevel, input.humanReviewed ? 1 : 0, input.usedAt),
      prepareSaasAudit(
        db,
        {
          clinicId,
          actorUserId: user.id,
          action: "ai_use_recorded",
          targetType: "ai_use_record",
          targetId: id,
          // só enums e flags — sem nome da ferramenta livre, sem paciente, sem conteúdo
          metadata: { purpose: input.purpose, dataSharing: input.dataSharing, humanReviewed: input.humanReviewed, hasPatient: Boolean(input.patientId) },
        },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O registro não foi persistido.", "DB_ERROR", 500);
    }
  } catch (error) {
    if (isMissingExportTable(error, "ai_use_records")) return pending();
    console.error("[live.ai-use.POST] DB error", error);
    return tenantError("Não foi possível registrar o uso de IA.", "DB_ERROR", 500);
  }
  const row = await db.prepare(`${SELECT} WHERE r.id = ? AND r.clinic_id = ?`).bind(id, clinicId).first<Row>();
  return tenantJson(row ? present(row) : { id }, 201);
};

/** Marca a ciência (ou recusa) da família. Só uma vez; o registro é prova e não é reescrito. */
export const onRequestPatch: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco LIVE não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const body = await readJson(context.request);
  if (!body) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  const clinicId = typeof body.clinicId === "string" ? body.clinicId.trim().slice(0, 80) : "";
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!clinicId || !OPAQUE_ID.test(id)) return tenantError("clinicId e id válidos são obrigatórios.", "VALIDATION_ERROR", 400);
  const ack = validateFamilyAck(body);
  if (!ack.ok) return tenantError(ack.message, "VALIDATION_ERROR", 400);

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanWriteClinical(membership)) return tenantError("Escrita clínica negada para esta clínica.", "TENANT_FORBIDDEN", 403);
  const billingError = await requireBillingEntitlement(db, user.id, clinicId, "clinical");
  if (billingError) return billingError;

  try {
    const current = await db.prepare(`SELECT family_status, patient_id FROM ai_use_records WHERE id = ? AND clinic_id = ?`).bind(id, clinicId).first<{ family_status: string; patient_id: string | null }>();
    if (!current) return tenantError("Registro não encontrado nesta clínica.", "NOT_FOUND", 404);
    if (!current.patient_id) return tenantError("Registro sem paciente não tem ciência de família.", "VALIDATION_ERROR", 400);
    if (current.family_status !== "nao_informada") return tenantError("A ciência da família já foi registrada e não pode ser alterada.", "ALREADY_SET", 409);
    const results = await db.batch([
      db
        .prepare(
          `UPDATE ai_use_records SET family_status = ?, family_status_at = ?, family_status_by_user_id = ?
            WHERE id = ? AND clinic_id = ? AND family_status = 'nao_informada'`,
        )
        .bind(ack.value.status, ack.value.informedAt, user.id, id, clinicId),
      prepareSaasAudit(
        db,
        { clinicId, actorUserId: user.id, action: "ai_use_family_status", targetType: "ai_use_record", targetId: id, metadata: { status: ack.value.status } },
        true,
      ),
    ]);
    if (Number(results[0]?.meta?.changes ?? 0) !== 1 || Number(results[1]?.meta?.changes ?? 0) !== 1) {
      return tenantError("O registro mudou durante a operação.", "STALE", 409);
    }
  } catch (error) {
    if (isMissingExportTable(error, "ai_use_records")) return pending();
    console.error("[live.ai-use.PATCH] DB error", error);
    return tenantError("Não foi possível registrar a ciência da família.", "DB_ERROR", 500);
  }
  const row = await db.prepare(`${SELECT} WHERE r.id = ? AND r.clinic_id = ?`).bind(id, clinicId).first<Row>();
  return tenantJson(row ? present(row) : { id });
};

/**
 * POST /api/live/governance/run-export — executa uma requisição de exportação
 * LGPD já aprovada, produzindo um artefato cifrado em storage privado.
 *
 * Fecha a outra metade de #685. O `executeEncryptedExport` (ciphertext-only,
 * readback byte a byte, digest SHA-256, fail-closed) já existia; faltavam o
 * coletor reutilizável — que estava inline no endpoint síncrono e agora vive em
 * tenant/_exportPayload.ts — e o runtime que amarra claim → exportar → concluir.
 *
 * Sem bucket privado provisionado, a rota recusa ANTES de reivindicar o job:
 * queimar uma tentativa no ledger por falta de infraestrutura só sujaria a
 * evidência. Não existe fallback para storage público nem para "devolver o
 * arquivo na resposta" — exportação sem destino privado é operação que não deve
 * acontecer.
 *
 * Escopo: só 'clinic'. Exportação por paciente não existe em lugar nenhum do
 * produto (o endpoint síncrono também é só de tenant), então aceitar aqui seria
 * prometer o que nenhum coletor entrega.
 *
 * Autorização em dois níveis, pela mesma razão da eliminação: membershipCanManage
 * exige clínica ATIVA, e um tenant em encerramento precisa conseguir exportar
 * antes de sumir. Gestor resolve a clínica ativa; encerramento é da plataforma.
 */
import { getContextUser, isAdmin } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";
import {
  clinicalLiveEnabled,
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../../tenant/_core";
import { clinicalCryptoReady } from "../../tenant/_crypto";
import { collectTenantExportPayload } from "../../tenant/_exportPayload";
import {
  resolvePrivateArtifactStore,
  type ArtifactStoreEnv,
} from "./_artifactStore";
import {
  claimLgpdRequest,
  completeExportJob,
  failLgpdJob,
  isExportJobCompletedWithEvidence,
  lgpdWorkerAuditMetadata,
} from "./_worker-core";
import { executeEncryptedExport } from "./_worker-executor";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface ExportRequestRow {
  id: string;
  clinic_id: string;
  patient_id: string | null;
  scope: string;
  status: string;
}

function cleanId(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  return OPAQUE_ID.test(text) ? text : "";
}

export const onRequestPost: PagesFunction<
  TenantEnv & ArtifactStoreEnv
> = async (context) => {
  const db = context.env.DB;
  if (!db)
    return tenantError("Serviço indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!clinicalLiveEnabled(context.env)) {
    return tenantError(
      "Clinical Core LIVE permanece bloqueado.",
      "CLINICAL_LIVE_DISABLED",
      503,
    );
  }
  if (!clinicalCryptoReady(context.env)) {
    return tenantError(
      "Keyring clínico dedicado não configurado.",
      "CLINICAL_CRYPTO_NOT_CONFIGURED",
      503,
    );
  }

  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = cleanId(body.clinicId);
  const requestId = cleanId(body.requestId);
  if (!clinicId || !requestId) {
    return tenantError(
      "clinicId e requestId são obrigatórios.",
      "VALIDATION_ERROR",
      400,
    );
  }

  const platformAdmin = isAdmin(user);
  if (!platformAdmin) {
    const membership = await getClinicMembership(db, clinicId, user);
    if (!membership || !membershipCanManage(membership)) {
      return tenantError(
        "Perfil sem permissão para executar exportação nesta clínica.",
        "FORBIDDEN",
        403,
      );
    }
    const billingFailure = await requireBillingEntitlement(
      db,
      user.id,
      clinicId,
      "clinical",
    );
    if (billingFailure) return billingFailure;
  }

  // Antes de qualquer coisa que toque o ledger: existe destino privado?
  const store = resolvePrivateArtifactStore(context.env);
  if (!store) {
    return tenantError(
      "Storage privado de artefatos não está provisionado; nenhuma exportação foi iniciada.",
      "EXPORT_STORE_NOT_CONFIGURED",
      503,
    );
  }

  // O requestId sozinho nunca decide o tenant.
  const request = await db
    .prepare(
      `SELECT id, clinic_id, patient_id, scope, status
         FROM live_export_requests
        WHERE id = ? AND clinic_id = ?
        LIMIT 1`,
    )
    .bind(requestId, clinicId)
    .first<ExportRequestRow>();
  if (!request) {
    return tenantError(
      "Requisição de exportação não encontrada.",
      "REQUEST_NOT_FOUND",
      404,
    );
  }
  if (!["approved", "processing"].includes(request.status)) {
    return tenantError(
      "A requisição precisa estar aprovada para ser executada.",
      "REQUEST_NOT_APPROVED",
      409,
    );
  }
  if (request.scope !== "clinic") {
    return tenantError(
      "Exportação por paciente ainda não é suportada; nenhum coletor a produz.",
      "EXPORT_SCOPE_UNSUPPORTED",
      409,
    );
  }

  const workerRunId = crypto.randomUUID();
  let claim;
  try {
    claim = await claimLgpdRequest(db, "export", requestId, workerRunId);
  } catch (error) {
    console.error("[governance/run-export] claim falhou", error);
    return tenantError(
      "Não foi possível reivindicar a execução.",
      "CLAIM_FAILED",
      500,
    );
  }
  if (!claim) {
    return tenantError(
      "A execução já está em andamento ou a requisição não está executável.",
      "CLAIM_UNAVAILABLE",
      409,
    );
  }

  // O worker existe justamente para tenants que não cabem numa resposta HTTP:
  // aqui o teto síncrono não se aplica.
  const collected = await collectTenantExportPayload(
    db,
    context.env,
    clinicId,
    {
      enforceSyncLimits: false,
    },
  );
  if (!collected.ok) {
    await failLgpdJob(db, claim, collected.code);
    return tenantError(collected.message, collected.code, collected.status);
  }

  const failures: string[] = [];
  const evidence = await executeEncryptedExport({
    env: context.env,
    claim,
    scope: "clinic",
    data: collected.data,
    store,
    complete: async (exportEvidence) =>
      completeExportJob(db, claim, exportEvidence),
    fail: async (failureCode) => {
      failures.push(failureCode);
      await failLgpdJob(db, claim, failureCode);
    },
    // Se `complete` falhar por ack perdido mas o batch tiver commitado, o
    // artefato é a prova material registrada e NÃO pode ser apagado.
    confirmCompleted: async (exportEvidence) =>
      isExportJobCompletedWithEvidence(db, claim, exportEvidence),
  });

  if (!evidence) {
    return tenantError(
      "A exportação não pôde ser concluída.",
      failures[0] ?? "EXPORT_FAILED",
      500,
    );
  }

  // Metadata-only: chave opaca, digest e tamanho não são conteúdo clínico.
  try {
    await prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "lgpd_export_executed",
      targetType: "export_request",
      targetId: requestId,
      metadata: {
        ...lgpdWorkerAuditMetadata(claim),
        digestSha256: evidence.digestSha256,
        byteLength: evidence.byteLength,
        patientCount: collected.counts.patients,
        eventCount: collected.counts.events,
      },
    }).run();
  } catch (error) {
    // O artefato existe e o ledger já aponta para ele; falhar a resposta faria
    // o operador repetir uma exportação concluída.
    console.error("[governance/run-export] auditoria não registrada", error);
  }

  return tenantJson({
    ok: true,
    requestId,
    artifactKey: evidence.artifactKey,
    digestSha256: evidence.digestSha256,
    byteLength: evidence.byteLength,
  });
};

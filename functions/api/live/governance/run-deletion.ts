/**
 * POST /api/live/governance/run-deletion — executa uma requisição de eliminação
 * LGPD já aprovada.
 *
 * Esta é a peça que faltava para a eliminação ser OPERACIONAL: o ledger com
 * claim/lease (0017), a política (`evaluateDeletionEligibility`) e o purge
 * físico (`executeTenantScopedPurge`) existiam, mas nada os amarrava num
 * runtime. Aqui eles viram uma operação de verdade: reivindicar → apagar →
 * concluir, com trilha.
 *
 * Por que só eliminação, e não exportação: a exportação precisa de um bucket
 * privado provisionado E de um coletor de dados do tenant que ainda não existe
 * como função reutilizável (hoje o payload é montado inline em
 * functions/api/tenants/[id]/export.ts). Meio-ligar a exportação criaria uma
 * rota que promete o que não entrega — ela ganha endpoint próprio quando as
 * duas peças existirem.
 *
 * Autorização em dois níveis, e a razão não é óbvia:
 * `membershipCanManage` exige clínica ATIVA, mas o purge de escopo de clínica
 * só é elegível com o tenant FECHADO (ver `evaluateDeletionEligibility`). Se a
 * autorização fosse só por membership, ninguém conseguiria executar a
 * eliminação de um tenant encerrado — justamente o caso que a LGPD cobra.
 * Então: gestor da clínica ativa resolve o escopo de paciente; encerramento de
 * tenant é operação de plataforma e exige papel global admin.
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
import { executeTenantScopedPurge } from "./_purge";
import {
  claimLgpdRequest,
  completeDeletionJob,
  failLgpdJob,
  lgpdWorkerAuditMetadata,
} from "./_worker-core";
import type { LgpdScope } from "./_worker-executor";

const OPAQUE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/;

interface DeletionRequestRow {
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

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
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

  // Autorização (ver nota no topo): admin de plataforma sempre; gestor de
  // clínica ativa também. Um leitor/profissional comum nunca.
  const platformAdmin = isAdmin(user);
  if (!platformAdmin) {
    const membership = await getClinicMembership(db, clinicId, user);
    if (!membership || !membershipCanManage(membership)) {
      return tenantError(
        "Perfil sem permissão para executar eliminação nesta clínica.",
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

  // A requisição precisa ser DESTA clínica: o requestId sozinho nunca decide o
  // tenant, senão um gestor poderia executar a eliminação de outra clínica.
  const request = await db
    .prepare(
      `SELECT id, clinic_id, patient_id, scope, status
         FROM live_deletion_requests
        WHERE id = ? AND clinic_id = ?
        LIMIT 1`,
    )
    .bind(requestId, clinicId)
    .first<DeletionRequestRow>();
  if (!request) {
    return tenantError(
      "Requisição de eliminação não encontrada.",
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
  if (request.scope !== "patient" && request.scope !== "clinic") {
    return tenantError(
      "Escopo de eliminação inválido.",
      "REQUEST_SCOPE_INVALID",
      409,
    );
  }
  // Encerrar o tenant inteiro é operação de plataforma, não de gestor.
  if (request.scope === "clinic" && !platformAdmin) {
    return tenantError(
      "Eliminação de escopo de clínica exige perfil administrativo da plataforma.",
      "PLATFORM_ADMIN_REQUIRED",
      403,
    );
  }

  const workerRunId = crypto.randomUUID();
  let claim;
  try {
    claim = await claimLgpdRequest(db, "delete", requestId, workerRunId);
  } catch (error) {
    console.error("[governance/run-deletion] claim falhou", error);
    return tenantError(
      "Não foi possível reivindicar a execução.",
      "CLAIM_FAILED",
      500,
    );
  }
  if (!claim) {
    // Outro worker segura o lease, ou a requisição saiu do estado executável.
    return tenantError(
      "A execução já está em andamento ou a requisição não está executável.",
      "CLAIM_UNAVAILABLE",
      409,
    );
  }

  const failures: string[] = [];
  const outcome = await executeTenantScopedPurge({
    db,
    claim,
    targets: {
      scope: request.scope as LgpdScope,
      clinicId,
      patientId: request.patient_id,
    },
    complete: async (deletedCounts) =>
      completeDeletionJob(db, claim, { deletedCounts }),
    fail: async (failureCode) => {
      failures.push(failureCode);
      await failLgpdJob(db, claim, failureCode);
    },
  });

  if (!outcome) {
    const failureCode = failures[0] ?? "PURGE_FAILED";
    // Bloqueio de política (legal hold, retenção, tenant ativo) é 409: o
    // operador precisa distinguir "não pode agora" de "quebrou".
    const policyBlocked = [
      "LEGAL_HOLD",
      "ACTIVE_TENANT",
      "RETENTION_PENDING",
      "RETENTION_NOT_MATERIALIZED",
    ].includes(failureCode);
    return tenantError(
      policyBlocked
        ? "A eliminação está bloqueada pela política vigente."
        : "A eliminação não pôde ser concluída.",
      failureCode,
      policyBlocked ? 409 : 500,
    );
  }

  // Trilha metadata-only: contagens por tabela são números de linhas, não
  // conteúdo clínico. Nenhum patient_id entra no metadata.
  try {
    await prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "lgpd_deletion_executed",
      targetType: "deletion_request",
      targetId: requestId,
      metadata: {
        ...lgpdWorkerAuditMetadata(claim),
        scope: request.scope,
        rowsDeleted: Object.values(outcome.deletedCounts).reduce(
          (sum, n) => sum + n,
          0,
        ),
      },
    }).run();
  } catch (error) {
    // A eliminação já aconteceu e está registrada no ledger; falhar a resposta
    // aqui faria o operador repetir uma operação já concluída.
    console.error("[governance/run-deletion] auditoria não registrada", error);
  }

  return tenantJson({
    ok: true,
    requestId,
    scope: request.scope,
    deletedCounts: outcome.deletedCounts,
  });
};

/**
 * _purge.ts — execução física da eliminação LGPD, tenant-scoped e idempotente.
 *
 * A 0017 criou o ledger com claim/lease e `evaluateDeletionEligibility` decide
 * SE pode apagar. Faltava o que efetivamente apaga. Este módulo é essa peça.
 *
 * Três decisões que valem ser lidas antes do código:
 *
 * 1. A elegibilidade é reavaliada com dado FRESCO imediatamente antes do
 *    purge. O job pode ter ficado na fila por horas; um legal hold aposto
 *    nesse meio-tempo tem que valer. Confiar no snapshot do enfileiramento
 *    seria apagar sob uma autorização vencida.
 *
 * 2. O purge NÃO apaga a trilha que prova que ele aconteceu. Ficam de fora:
 *    saas_audit_log/saas_audit_events (prova de conformidade),
 *    live_export_requests/live_deletion_requests e live_lgpd_worker_jobs (a
 *    própria requisição e seu ledger), e billing/membership/settings (registro
 *    organizacional, não dado clínico do titular). Apagar a prova da
 *    eliminação junto com o dado deixaria a clínica sem como demonstrar que
 *    cumpriu o pedido.
 *
 * 3. A ordem é filha → mãe e o batch é único. Com foreign_keys ligado, uma
 *    ordem errada aborta a transação inteira em vez de deixar órfão — o teste
 *    roda contra o SQL real das migrações justamente para que isso apareça.
 */
import type { LgpdWorkerClaim } from "./_worker-core";
import type { DeletionEligibility, LgpdScope } from "./_worker-executor";
import { evaluateDeletionEligibility } from "./_worker-executor";

/**
 * Tabelas clínicas do Clinical LIVE, em ordem de dependência (filhas antes das
 * mães). `patientColumn` é a coluna que amarra a linha ao titular: em
 * live_patients o vínculo é a própria PK.
 */
const PURGE_ORDER: ReadonlyArray<{ table: string; patientColumn: string }> = [
  { table: "live_assessment_responses", patientColumn: "patient_id" },
  { table: "live_assessments", patientColumn: "patient_id" },
  { table: "live_scale_responses", patientColumn: "patient_id" },
  { table: "live_scale_invitations", patientColumn: "patient_id" },
  { table: "live_intake_submissions", patientColumn: "patient_id" },
  { table: "live_intake_invitations", patientColumn: "patient_id" },
  { table: "live_document_versions", patientColumn: "patient_id" },
  { table: "live_documents", patientColumn: "patient_id" },
  { table: "live_clinical_events", patientColumn: "patient_id" },
  { table: "live_patients", patientColumn: "id" },
];

/**
 * Tabelas de governança que apontam para o titular com ON DELETE RESTRICT e
 * que são preservadas: o ponteiro precisa ser solto antes do DELETE do
 * paciente, senão a própria requisição de eliminação impede a eliminação.
 */
const GOVERNANCE_PATIENT_REFERENCES: ReadonlyArray<string> = [
  "live_export_requests",
  "live_deletion_requests",
];

/** Tabelas deliberadamente preservadas (ver decisão 2 no topo do arquivo). */
export const PURGE_PRESERVED_TABLES: ReadonlyArray<string> = [
  // Política de retenção é configuração da clínica (não tem sequer coluna
  // patient_id): é a regra que autoriza o purge, não dado do titular. Apagá-la
  // junto removeria o registro de sob qual política a eliminação ocorreu.
  "live_retention_policies",
  "saas_audit_log",
  "saas_audit_events",
  "live_export_requests",
  "live_deletion_requests",
  "live_lgpd_worker_jobs",
  "tenant_export_events",
  "tenant_lifecycle",
  "billing_customers",
  "billing_entitlements",
  "clinic_memberships",
  "clinic_settings",
  "clinic_invitations",
];

export interface PurgeTargets {
  scope: LgpdScope;
  clinicId: string;
  /** Obrigatório quando scope === 'patient'. */
  patientId: string | null;
}

export interface ExecuteTenantScopedPurgeParams {
  db: D1Database;
  claim: LgpdWorkerClaim;
  targets: PurgeTargets;
  now?: Date | string;
  complete: (deletedCounts: Record<string, number>) => Promise<boolean>;
  fail: (failureCode: string) => Promise<unknown>;
}

export interface PurgeOutcome {
  deletedCounts: Record<string, number>;
}

interface FreshPolicyRow {
  clinic_status: string;
  lifecycle_status: string | null;
  legal_hold: number | null;
  retention_until: string | null;
}

function isoNow(value: Date | string | undefined): string {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  if (!Number.isFinite(date.getTime()))
    throw new Error("LGPD_PURGE_INVALID_TIME");
  return date.toISOString();
}

/**
 * Relê clinics + tenant_lifecycle no momento do purge. Um legal hold aposto
 * depois do enfileiramento precisa bloquear.
 */
export async function readFreshDeletionEligibility(
  db: D1Database,
  targets: PurgeTargets,
  now: string,
): Promise<DeletionEligibility> {
  const row = await db
    .prepare(
      `SELECT c.status AS clinic_status,
              l.status AS lifecycle_status,
              l.legal_hold AS legal_hold,
              l.retention_until AS retention_until
         FROM clinics c
         LEFT JOIN tenant_lifecycle l ON l.clinic_id = c.id
        WHERE c.id = ?
        LIMIT 1`,
    )
    .bind(targets.clinicId)
    .first<FreshPolicyRow>();

  // Clínica inexistente não é "pode apagar": é estado inesperado.
  if (!row) return { allowed: false, code: "ACTIVE_TENANT" };

  return evaluateDeletionEligibility({
    scope: targets.scope,
    clinicStatus: row.clinic_status as "active" | "suspended" | "closed",
    lifecycleStatus: (row.lifecycle_status ?? "active") as
      | "active"
      | "closure_requested"
      | "closed",
    legalHold: Number(row.legal_hold ?? 0) === 1,
    retentionUntil: row.retention_until,
    now,
  });
}

/**
 * Apaga o dado clínico do titular (scope 'patient') ou da clínica inteira
 * (scope 'clinic'), num único batch e sempre com clinic_id na cláusula.
 *
 * Idempotente por construção: reexecutar sobre um tenant já limpo apaga zero
 * linhas e conclui normalmente — replay depois de um ack perdido não é erro.
 */
export async function executeTenantScopedPurge(
  params: ExecuteTenantScopedPurgeParams,
): Promise<PurgeOutcome | null> {
  const { db, claim, targets } = params;

  if (claim.requestType !== "delete") {
    await params.fail("REQUEST_TYPE_MISMATCH");
    return null;
  }
  // O ledger amarra o job a uma request do mesmo tenant; ainda assim o
  // executor nunca aceita um alvo de outra clínica.
  if (claim.clinicId !== targets.clinicId) {
    await params.fail("PURGE_TENANT_MISMATCH");
    return null;
  }
  if (targets.scope === "patient" && !targets.patientId) {
    await params.fail("PURGE_PATIENT_REQUIRED");
    return null;
  }

  let now: string;
  try {
    now = isoNow(params.now);
  } catch {
    await params.fail("LGPD_PURGE_INVALID_TIME");
    return null;
  }

  let eligibility: DeletionEligibility;
  try {
    eligibility = await readFreshDeletionEligibility(db, targets, now);
  } catch {
    await params.fail("PURGE_POLICY_READ_FAILED");
    return null;
  }
  if (!eligibility.allowed) {
    // O código do bloqueio vira failure_code: quem opera precisa saber que foi
    // legal hold, retenção pendente ou tenant ativo — não um erro genérico.
    await params.fail(eligibility.code ?? "PURGE_BLOCKED");
    return null;
  }

  const deleteFor = ({
    table,
    patientColumn,
  }: {
    table: string;
    patientColumn: string;
  }) =>
    targets.scope === "patient"
      ? db
          .prepare(
            `DELETE FROM ${table} WHERE clinic_id = ? AND ${patientColumn} = ?`,
          )
          .bind(targets.clinicId, targets.patientId)
      : db
          .prepare(`DELETE FROM ${table} WHERE clinic_id = ?`)
          .bind(targets.clinicId);

  // As requisições de governança apontam para o titular com ON DELETE RESTRICT
  // e são preservadas como evidência — ou seja, a própria requisição impediria
  // apagar o paciente. Soltar o ponteiro ANTES do DELETE resolve sem perder a
  // prova: a requisição sobrevive com id, tenant, escopo, status e datas, e o
  // que some é o identificador do titular — exatamente o que a eliminação
  // deveria fazer sumir.
  const detachStatements = GOVERNANCE_PATIENT_REFERENCES.map((table) =>
    targets.scope === "patient"
      ? db
          .prepare(
            `UPDATE ${table} SET patient_id = NULL WHERE clinic_id = ? AND patient_id = ?`,
          )
          .bind(targets.clinicId, targets.patientId)
      : db
          .prepare(
            `UPDATE ${table} SET patient_id = NULL WHERE clinic_id = ? AND patient_id IS NOT NULL`,
          )
          .bind(targets.clinicId),
  );

  const children = PURGE_ORDER.filter(({ table }) => table !== "live_patients");
  const patientsEntry = PURGE_ORDER.find(
    ({ table }) => table === "live_patients",
  )!;
  const statements = [
    ...children.map(deleteFor),
    ...detachStatements,
    deleteFor(patientsEntry),
  ];

  let deletedCounts: Record<string, number>;
  try {
    const results = await db.batch(statements);
    deletedCounts = {};
    children.forEach(({ table }, index) => {
      deletedCounts[table] = Number(results[index]?.meta?.changes ?? 0);
    });
    deletedCounts[patientsEntry.table] = Number(
      results[statements.length - 1]?.meta?.changes ?? 0,
    );
  } catch {
    // Batch é atômico: ou tudo apagou, ou nada. Uma ordem errada (órfão de FK)
    // cai aqui em vez de deixar o tenant meio apagado.
    await params.fail("PURGE_EXECUTION_FAILED");
    return null;
  }

  let completed: boolean;
  try {
    completed = await params.complete(deletedCounts);
  } catch {
    completed = false;
  }
  if (!completed) {
    // O dado já foi apagado — não há como desfazer. Registrar a falha de
    // conclusão deixa o job disponível para replay, que recontará zero linhas
    // e fechará a evidência. Nunca fingir que concluiu.
    await params.fail("PURGE_COMPLETION_FAILED");
    return null;
  }

  return { deletedCounts };
}

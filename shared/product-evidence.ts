/** Evidence DTO: current-tenant SQL observations are not customers, revenue or production attestations. */
export const EVIDENCE_COUNTERS = [
  { id: "users", label: "Usuários ativos vinculados", source: "users + clinic_memberships" },
  { id: "memberships", label: "Vínculos de equipe ativos", source: "clinic_memberships" },
  { id: "trial_records", label: "Assinaturas com status trial no banco", source: "billing_subscriptions + billing_customers" },
  { id: "active_subscription_records", label: "Assinaturas com status active no banco", source: "billing_subscriptions + billing_customers" },
  { id: "patients", label: "Pacientes registrados não mesclados", source: "live_patients" },
  { id: "documents", label: "Documentos com status publicado", source: "live_documents" },
  { id: "clinical_events", label: "Eventos longitudinais ativos", source: "live_clinical_events" },
  { id: "assessments", label: "Avaliações registradas ativas", source: "live_assessments" },
  { id: "audit_records", label: "Registros de auditoria", source: "saas_audit_log" },
] as const;
const UNVERIFIED = [
  ["deployed_sha", "SHA efetivamente publicado", "DEPLOY_ATTESTATION_NOT_ATTACHED"],
  ["uptime", "Disponibilidade histórica", "MONITORING_HISTORY_NOT_ATTACHED"],
  ["last_deploy", "Último deploy verificado", "DEPLOY_ATTESTATION_NOT_ATTACHED"],
  ["critical_tests", "Última bateria crítica verificada", "CI_ATTESTATION_NOT_ATTACHED"],
  ["platform_clinics", "Clínicas da plataforma inteira", "CURRENT_TENANT_SCOPE_ONLY"],
  ["paying_clinics", "Clínicas pagantes reais", "PROVIDER_AND_LEDGER_RECONCILIATION_NOT_ATTESTED"],
  ["real_mrr_brl", "MRR real em reais", "PROVIDER_AND_LEDGER_RECONCILIATION_NOT_ATTESTED"],
  ["real_arpa_brl", "ARPA real em reais", "PROVIDER_AND_LEDGER_RECONCILIATION_NOT_ATTESTED"],
  ["real_churn", "Churn real", "COHORT_AND_PROVIDER_HISTORY_NOT_ATTESTED"],
  ["activation", "Ativação comercial", "CUSTOMER_ZERO_JOURNEY_NOT_ATTESTED"],
  ["instruments", "Instrumentos cadastrados no catálogo", "REGISTRY_ATTESTATION_NOT_ATTACHED"],
  ["authorial_protocols", "Protocolos autorais versionados", "REGISTRY_ATTESTATION_NOT_ATTACHED"],
  ["last_backup", "Último backup verificado", "RECOVERY_ATTESTATION_NOT_ATTACHED"],
  ["last_restore", "Último restore operacional testado", "RECOVERY_ATTESTATION_NOT_ATTACHED"],
  ["last_isolation_test", "Último teste de isolamento", "CI_ATTESTATION_NOT_ATTACHED"],
  ["open_incidents", "Incidentes abertos", "INCIDENT_REGISTER_NOT_ATTACHED"],
  ["policy_version", "Versão das políticas aprovadas", "POLICY_ATTESTATION_NOT_ATTACHED"],
] as const;

export interface ProductEvidence {
  schemaVersion: "neuroped-product-evidence-v1";
  scope: "current_clinic_only";
  clinicId: string;
  observedAt: string;
  counters: Array<{ id: string; label: string; source: string; value: number; status: "OBSERVED_SQL" }>;
  health: { httpStatus: number; reportedStatus: string; reportedApiVersion: string; database: string; reportedAt: string; source: "canonical_health_handler" } | null;
  unverified: Array<{ id: string; label: string; reason: string; value: null; status: "NOT_MEASURED" }>;
  commercialReadinessVerified: false;
  productionRecoveryVerified: false;
}

function healthObservation(input: unknown): ProductEvidence["health"] {
  if (!input || typeof input !== "object") return null;
  const envelope = input as { httpStatus?: unknown; body?: unknown };
  if (typeof envelope.httpStatus !== "number" || !Number.isInteger(envelope.httpStatus) || envelope.httpStatus < 100 || envelope.httpStatus > 599
    || !envelope.body || typeof envelope.body !== "object") return null;
  const body = envelope.body as Record<string, unknown>;
  if (typeof body.status !== "string" || !["ok", "degraded"].includes(body.status)
    || typeof body.database !== "string" || !["ok", "error", "not_configured"].includes(body.database)
    || typeof body.version !== "string" || !body.version || body.version.length > 80
    || typeof body.timestamp !== "string" || !Number.isFinite(Date.parse(body.timestamp))) return null;
  return { httpStatus: envelope.httpStatus, reportedStatus: body.status, reportedApiVersion: body.version,
    database: body.database, reportedAt: new Date(body.timestamp).toISOString(), source: "canonical_health_handler" };
}

export function buildProductEvidence(row: unknown, clinicId: string, health: unknown, now = new Date()): ProductEvidence {
  if (typeof clinicId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(clinicId) || !row || typeof row !== "object" || Array.isArray(row)
    || !Number.isFinite(now.getTime())) throw new Error("EVIDENCE_INVALID_SOURCE");
  const record = row as Record<string, unknown>;
  if (record.clinic_id !== clinicId) throw new Error("EVIDENCE_SCOPE_MISMATCH");
  const counters: ProductEvidence["counters"] = EVIDENCE_COUNTERS.map(item => {
    const value = record[item.id];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("EVIDENCE_INVALID_AGGREGATE");
    return { ...item, value, status: "OBSERVED_SQL" };
  });
  return { schemaVersion: "neuroped-product-evidence-v1", scope: "current_clinic_only", clinicId, observedAt: now.toISOString(),
    counters, health: healthObservation(health),
    unverified: UNVERIFIED.map(([id, label, reason]) => ({ id, label, reason, value: null, status: "NOT_MEASURED" })),
    commercialReadinessVerified: false, productionRecoveryVerified: false };
}

export function parseProductEvidence(value: unknown): ProductEvidence {
  if (!value || typeof value !== "object") throw new Error("EVIDENCE_RESPONSE_INVALID");
  const input = value as ProductEvidence;
  if (input.schemaVersion !== "neuroped-product-evidence-v1" || input.scope !== "current_clinic_only"
    || input.commercialReadinessVerified !== false || input.productionRecoveryVerified !== false
    || !Array.isArray(input.counters) || input.counters.length !== EVIDENCE_COUNTERS.length
    || !Array.isArray(input.unverified) || input.unverified.length !== UNVERIFIED.length) throw new Error("EVIDENCE_RESPONSE_INVALID");
  const row: Record<string, unknown> = { clinic_id: input.clinicId };
  input.counters.forEach((item, index) => {
    const expected = EVIDENCE_COUNTERS[index];
    if (!item || item.id !== expected.id || item.label !== expected.label || item.source !== expected.source || item.status !== "OBSERVED_SQL") throw new Error("EVIDENCE_RESPONSE_INVALID");
    row[item.id] = item.value;
  });
  input.unverified.forEach((item, index) => {
    const [id, label, reason] = UNVERIFIED[index];
    if (!item || item.id !== id || item.label !== label || item.reason !== reason || item.value !== null || item.status !== "NOT_MEASURED") throw new Error("EVIDENCE_RESPONSE_INVALID");
  });
  if (input.health && input.health.source !== "canonical_health_handler") throw new Error("EVIDENCE_RESPONSE_INVALID");
  const health = input.health ? { httpStatus: input.health.httpStatus, body: { status: input.health.reportedStatus,
    version: input.health.reportedApiVersion, database: input.health.database, timestamp: input.health.reportedAt } } : null;
  return buildProductEvidence(row, input.clinicId, health, new Date(input.observedAt));
}

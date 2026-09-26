/**
 * _exportPayload.ts — coleta o payload de exportação de um tenant.
 *
 * Esta lógica vivia inline dentro de functions/api/tenants/[id]/export.ts e por
 * isso o executor assíncrono de LGPD não conseguia reaproveitá-la: era a peça
 * que faltava para a exportação sair do papel (#685). Aqui ela vira função, com
 * o MESMO comportamento do endpoint síncrono.
 *
 * O teto de exportação síncrona é opcional de propósito: ele existe para
 * proteger uma requisição HTTP que precisa responder na hora. O worker é
 * justamente o caminho para tenants grandes, então roda sem esse teto.
 *
 * Falha de decriptação nunca vira exportação parcial: ou o tenant sai inteiro,
 * ou não sai — um arquivo com metade do prontuário legível é pior que nenhum.
 */
import { clinicalCryptoReady, decryptClinicalJson } from "./_crypto";
import type { TenantEnv } from "./_core";
import {
  effectiveTenantLifecycleStatus,
  exportWithinSyncLimits,
  type TenantLifecycleStatus,
} from "../../../shared/tenantLifecycle";

export interface TenantExportCounts {
  patients: number;
  events: number;
  memberships: number;
  encryptedBytes: number;
}

/**
 * Tabelas clínicas do Clinical LIVE com `clinic_id` que
 * `collectTenantExportPayload` AINDA NÃO leva no payload. S12B (2026-09-26,
 * docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md#LTB-02) cobriu as oito
 * originais — documentos versionados, avaliações e respostas,
 * convites/submissões de intake e de escala remota — então esta lista está
 * vazia hoje. Ela continua existindo como o ponto de extensão: um domínio
 * clínico NOVO com `clinic_id` deve entrar aqui primeiro (fail-closed no
 * purge e `complete: false` no export) e só sair quando
 * `collectTenantExportPayload` de fato o levar no payload. A mesma lista é
 * usada por functions/api/live/governance/_purge.ts: o purge de escopo
 * 'clinic' recusa (EXPORT_MANIFEST_INCOMPLETE) se sobrar qualquer linha da
 * clínica em uma tabela ainda listada aqui.
 */
export const EXPORT_UNCOVERED_CLINIC_TABLES: ReadonlyArray<string> = [];

/** Só a ausência da tabela consultada representa schema anterior à migração. */
export function isMissingExportTable(error: unknown, table: string): boolean {
  if (!/^[a-z_]+$/.test(table)) return false;
  const message = error instanceof Error ? error.message : String(error);
  return new RegExp(`\\bno such table: ${table}\\b`, "i").test(message);
}

export function validExportRowCount(row: { n: number } | null): number {
  if (!row || !Number.isSafeInteger(row.n) || row.n < 0) {
    throw new Error("EXPORT_COUNT_INVALID");
  }
  return row.n;
}

/**
 * Conta, por tabela, quantas linhas da clínica ficam FORA do payload
 * exportado hoje. Tabela ausente neste banco conta como zero — o objetivo é
 * nunca afirmar incompletude por um schema mais antigo, só pela lacuna real.
 * `tables` tem `EXPORT_UNCOVERED_CLINIC_TABLES` (hoje vazia, ver acima) como
 * padrão; o parâmetro existe para o teste exercitar as duas ramificações de
 * erro (tabela ausente vs. coluna ausente) mesmo quando a lista real de
 * produção não tem nenhum membro para isso.
 */
export async function countExportUncoveredRows(
  db: D1Database,
  clinicId: string,
  tables: ReadonlyArray<string> = EXPORT_UNCOVERED_CLINIC_TABLES,
): Promise<Record<string, number>> {
  const entries = await Promise.all(
    tables.map(async (table) => {
      try {
        const row = await db
          .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE clinic_id = ?`)
          .bind(clinicId)
          .first<{ n: number }>();
        return [table, validExportRowCount(row)] as const;
      } catch (error) {
        if (isMissingExportTable(error, table)) return [table, 0] as const;
        throw error;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export type TenantExportFailureCode =
  | "TENANT_LIFECYCLE_NOT_CONFIGURED"
  | "TENANT_LIFECYCLE_NOT_FOUND"
  | "TENANT_EXPORT_TOO_LARGE"
  | "CLINICAL_CRYPTO_NOT_CONFIGURED"
  | "TENANT_NOT_FOUND"
  | "TENANT_EXPORT_DECRYPT_FAILED"
  | "TENANT_EXPORT_COVERAGE_FAILED";

export type TenantExportPayloadResult =
  | {
      ok: true;
      data: Record<string, unknown>;
      counts: TenantExportCounts;
      /** Falso quando alguma tabela de EXPORT_UNCOVERED_CLINIC_TABLES tem linha da clínica. */
      complete: boolean;
      uncoveredCounts: Record<string, number>;
    }
  | {
      ok: false;
      code: TenantExportFailureCode;
      message: string;
      status: number;
    };

interface LifecycleRow {
  status: TenantLifecycleStatus;
  reason_code: string | null;
  requested_at: string | null;
  retention_until: string | null;
  canceled_at: string | null;
  finalized_at: string | null;
  legal_hold: number;
}

interface CountRow {
  patients: number;
  events: number;
  memberships: number;
  encrypted_bytes: number;
}

interface PatientRow {
  id: string;
  primary_professional_user_id: string | null;
  profile_encrypted: string;
  encryption_version: string;
  status: string;
  merged_into_patient_id: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: string;
  patient_id: string;
  author_user_id: string;
  event_type: string;
  occurred_at: string;
  encounter_id: string | null;
  provenance_kind: string;
  provenance_source: string;
  payload_encrypted: string;
  encryption_version: string;
  supersedes_event_id: string | null;
  status: string;
  created_at: string;
}

interface ClinicRow {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  timezone: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MembershipRow {
  user_id: string;
  role: string;
  active: number;
  invited_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface BillingCustomerRow {
  provider: string;
  status: string;
  billing_email: string | null;
  trial_ends_at: string | null;
  last_failed_at: string | null;
  canceled_at: string | null;
  grace_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionRow {
  plan_id: string;
  seats: number | null;
  status: string;
  anchored_at: string;
  current_period_starts_at: string;
  current_period_ends_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface AssessmentRow {
  id: string;
  patient_id: string;
  instrument_id: string;
  instrument_version: string;
  applied_by_user_id: string;
  applied_at: string;
  provenance_source: string;
  payload_encrypted: string;
  encryption_version: string;
  supersedes_assessment_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AssessmentResponseRow {
  id: string;
  patient_id: string;
  assessment_id: string;
  item_id: string;
  item_position: number;
  response_encrypted: string;
  encryption_version: string;
  created_at: string;
}

interface DocumentRow {
  id: string;
  patient_id: string;
  author_user_id: string;
  document_type: string;
  origin: string;
  status: string;
  family_visibility: number;
  current_version: number;
  created_at: string;
  updated_at: string;
}

interface DocumentVersionRow {
  id: string;
  document_id: string;
  patient_id: string;
  author_user_id: string;
  version: number;
  content_encrypted: string;
  encryption_version: string;
  origin: string;
  issued_at: string;
  status: string;
  family_visibility: number;
  superseded_at: string | null;
  created_at: string;
}

/** token_hash é o único campo omitido de propósito: segredo de posse do
 * convite, não dado do titular. */
interface IntakeInvitationRow {
  id: string;
  patient_id: string;
  created_by_user_id: string;
  respondent_kind: string;
  form_kind: string;
  form_id: string;
  status: string;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface IntakeSubmissionRow {
  id: string;
  invitation_id: string;
  patient_id: string;
  respondent_kind: string;
  form_kind: string;
  form_id: string;
  payload_encrypted: string;
  encryption_version: string;
  consent_notice_version: string;
  consented_at: string;
  review_status: string;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  clinical_event_id: string | null;
  submitted_at: string;
  created_at: string;
}

/** token_hash omitido pela mesma razão de IntakeInvitationRow. */
interface ScaleInvitationRow {
  id: string;
  patient_id: string;
  created_by_user_id: string;
  respondent_kind: string;
  scale_id: string;
  status: string;
  expires_at: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ScaleResponseRow {
  id: string;
  invitation_id: string;
  patient_id: string;
  respondent_kind: string;
  scale_id: string;
  answers_encrypted: string;
  encryption_version: string;
  consent_notice_version: string;
  consented_at: string;
  review_status: string;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  created_at: string;
}

/** clinic_id é PRIMARY KEY: 0 ou 1 linha por clínica. Sem campo cifrado —
 * timbre institucional (nome/endereço/telefone/e-mail), não PHI. */
interface ClinicSettingsRow {
  display_name: string;
  address_line1: string;
  address_line2: string;
  phone: string;
  public_email: string;
  company_line: string;
  motto: string;
  updated_by_user_id: string | null;
  updated_at: string;
}

/** clinic_id é UNIQUE: 0 ou 1 linha por clínica. Configuração de retenção,
 * não dado do titular — mas parte do que uma clínica configurou e espera
 * ver no próprio export completo. */
interface RetentionPolicyRow {
  retention_days: number;
  auto_delete_enabled: number;
  configured_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export async function collectTenantExportPayload(
  db: D1Database,
  env: TenantEnv,
  clinicId: string,
  options: { enforceSyncLimits: boolean },
): Promise<TenantExportPayloadResult> {
  const coverageFailure = (): TenantExportPayloadResult => ({
    ok: false,
    code: "TENANT_EXPORT_COVERAGE_FAILED",
    message:
      "Não foi possível obter um snapshot consistente da exportação; nenhum arquivo foi entregue.",
    status: 503,
  });
  const normalizeCounts = (counts: CountRow | null): TenantExportCounts => ({
    patients: validExportRowCount(counts ? { n: counts.patients } : null),
    events: validExportRowCount(counts ? { n: counts.events } : null),
    memberships: validExportRowCount(counts ? { n: counts.memberships } : null),
    encryptedBytes: validExportRowCount(
      counts ? { n: counts.encrypted_bytes } : null,
    ),
  });
  const tooLarge = (): TenantExportPayloadResult => ({
    ok: false,
    code: "TENANT_EXPORT_TOO_LARGE",
    message:
      "O tenant excede o limite seguro para exportação síncrona; nenhum arquivo parcial foi gerado.",
    status: 413,
  });

  // S12B (2026-09-26): `encrypted_bytes` precisa somar TODO conteúdo cifrado
  // que o snapshot abaixo vai carregar e decifrar, não só patients/events —
  // do contrário um tenant com poucos pacientes mas muitos documentos/
  // avaliações grandes passaria pela pré-checagem e só falharia (ou
  // travaria) depois de já ter carregado tudo em memória no caminho síncrono.
  const ENCRYPTED_BYTES_SQL = `
         COALESCE((SELECT SUM(length(profile_encrypted)) FROM live_patients WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(payload_encrypted)) FROM live_clinical_events WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(payload_encrypted)) FROM live_assessments WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(response_encrypted)) FROM live_assessment_responses WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(content_encrypted)) FROM live_document_versions WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(payload_encrypted)) FROM live_intake_submissions WHERE clinic_id = ?), 0)
         + COALESCE((SELECT SUM(length(answers_encrypted)) FROM live_scale_responses WHERE clinic_id = ?), 0)
           AS encrypted_bytes`;
  const ENCRYPTED_BYTES_BINDS = Array<string>(7).fill(clinicId);

  // Pré-checagem evita carregar um tenant já grande. Não é a autoridade do
  // manifesto: a contagem é relida e validada dentro do snapshot abaixo.
  if (options.enforceSyncLimits) {
    try {
      const counts = await db
        .prepare(
          `SELECT
         (SELECT COUNT(*) FROM live_patients WHERE clinic_id = ?) AS patients,
         (SELECT COUNT(*) FROM live_clinical_events WHERE clinic_id = ?) AS events,
         (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ?) AS memberships,
         ${ENCRYPTED_BYTES_SQL}`,
        )
        .bind(clinicId, clinicId, clinicId, ...ENCRYPTED_BYTES_BINDS)
        .first<CountRow>();
      if (!exportWithinSyncLimits(normalizeCounts(counts))) return tooLarge();
    } catch {
      return coverageFailure();
    }
  }

  let snapshot: D1Result[];
  try {
    // D1 batch executa sequencialmente na mesma transação: nenhuma escrita
    // concorrente separa dados, lifecycle, contagens ou lacunas de cobertura.
    snapshot = await db.batch([
      db
        .prepare(
          `SELECT status, reason_code, requested_at, retention_until, canceled_at,
                finalized_at, legal_hold
           FROM tenant_lifecycle WHERE clinic_id = ? LIMIT 1`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT
         (SELECT COUNT(*) FROM live_patients WHERE clinic_id = ?) AS patients,
         (SELECT COUNT(*) FROM live_clinical_events WHERE clinic_id = ?) AS events,
         (SELECT COUNT(*) FROM clinic_memberships WHERE clinic_id = ?) AS memberships,
         ${ENCRYPTED_BYTES_SQL}`,
        )
        .bind(clinicId, clinicId, clinicId, ...ENCRYPTED_BYTES_BINDS),
      db
        .prepare(
          `SELECT id, slug, name, legal_name, timezone, status, created_at, updated_at
             FROM clinics WHERE id = ? LIMIT 1`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT user_id, role, active, invited_by_user_id, created_at, updated_at
             FROM clinic_memberships WHERE clinic_id = ? ORDER BY created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, primary_professional_user_id, profile_encrypted, encryption_version,
                  status, merged_into_patient_id, created_at, updated_at
             FROM live_patients WHERE clinic_id = ? ORDER BY created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, patient_id, author_user_id, event_type, occurred_at, encounter_id,
                  provenance_kind, provenance_source, payload_encrypted, encryption_version,
                  supersedes_event_id, status, created_at
             FROM live_clinical_events WHERE clinic_id = ? ORDER BY occurred_at ASC, created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT provider, status, billing_email, trial_ends_at, last_failed_at,
                  canceled_at, grace_ends_at, created_at, updated_at
             FROM billing_customers WHERE clinic_id = ? LIMIT 1`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT bs.plan_id, bs.seats, bs.status, bs.anchored_at,
                  bs.current_period_starts_at, bs.current_period_ends_at, bs.canceled_at,
                  bs.cancel_reason, bs.created_at, bs.updated_at
             FROM billing_subscriptions bs
             JOIN billing_customers bc ON bc.id = bs.customer_id
            WHERE bc.clinic_id = ? ORDER BY bs.created_at ASC`,
        )
        .bind(clinicId),
      db.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS snapshot_at"),
      // S12B — os oito domínios que antes ficavam de fora do export
      // (LTB-02): a mesma disciplina append-only/imutável dessas tabelas
      // permite ler sem lock explícito, dentro do mesmo batch/transação.
      db
        .prepare(
          `SELECT id, patient_id, instrument_id, instrument_version, applied_by_user_id,
                  applied_at, provenance_source, payload_encrypted, encryption_version,
                  supersedes_assessment_id, status, created_at, updated_at
             FROM live_assessments WHERE clinic_id = ? ORDER BY applied_at ASC, created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, patient_id, assessment_id, item_id, item_position,
                  response_encrypted, encryption_version, created_at
             FROM live_assessment_responses WHERE clinic_id = ? ORDER BY assessment_id ASC, item_position ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, patient_id, author_user_id, document_type, origin, status,
                  family_visibility, current_version, created_at, updated_at
             FROM live_documents WHERE clinic_id = ? ORDER BY created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, document_id, patient_id, author_user_id, version, content_encrypted,
                  encryption_version, origin, issued_at, status, family_visibility,
                  superseded_at, created_at
             FROM live_document_versions WHERE clinic_id = ? ORDER BY document_id ASC, version ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          // token_hash é omitido de propósito: segredo de posse do convite, não dado do titular.
          `SELECT id, patient_id, created_by_user_id, respondent_kind, form_kind, form_id,
                  status, expires_at, submitted_at, created_at, updated_at
             FROM live_intake_invitations WHERE clinic_id = ? ORDER BY created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, invitation_id, patient_id, respondent_kind, form_kind, form_id,
                  payload_encrypted, encryption_version, consent_notice_version, consented_at,
                  review_status, reviewed_by_user_id, reviewed_at, clinical_event_id,
                  submitted_at, created_at
             FROM live_intake_submissions WHERE clinic_id = ? ORDER BY submitted_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          // token_hash é omitido de propósito: segredo de posse do convite, não dado do titular.
          `SELECT id, patient_id, created_by_user_id, respondent_kind, scale_id,
                  status, expires_at, submitted_at, created_at, updated_at
             FROM live_scale_invitations WHERE clinic_id = ? ORDER BY created_at ASC`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT id, invitation_id, patient_id, respondent_kind, scale_id, answers_encrypted,
                  encryption_version, consent_notice_version, consented_at, review_status,
                  reviewed_by_user_id, reviewed_at, submitted_at, created_at
             FROM live_scale_responses WHERE clinic_id = ? ORDER BY submitted_at ASC`,
        )
        .bind(clinicId),
      // clinic_settings/live_retention_policies: configuração da clínica, não
      // dado do titular, e nunca bloqueiam purge (estão em
      // PURGE_PRESERVED_TABLES em _purge.ts) — mas o backlog original de
      // S12B pedia os dois no payload exportado, e uma clínica pedindo "todos
      // os meus dados" espera ver a própria configuração/timbre também.
      db
        .prepare(
          `SELECT display_name, address_line1, address_line2, phone, public_email,
                  company_line, motto, updated_by_user_id, updated_at
             FROM clinic_settings WHERE clinic_id = ? LIMIT 1`,
        )
        .bind(clinicId),
      db
        .prepare(
          `SELECT retention_days, auto_delete_enabled, configured_by_user_id, created_at, updated_at
             FROM live_retention_policies WHERE clinic_id = ? LIMIT 1`,
        )
        .bind(clinicId),
      ...EXPORT_UNCOVERED_CLINIC_TABLES.map((table) =>
        db
          .prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE clinic_id = ?`)
          .bind(clinicId),
      ),
    ]);
    // 9 consultas-base (lifecycle, contagens, clínica, memberships, pacientes,
    // eventos, billing customer, subscriptions, snapshot_at) + 8 domínios
    // cobertos por S12B + 2 (clinic_settings/retention_policy) + o que ainda
    // sobrar em EXPORT_UNCOVERED_CLINIC_TABLES (hoje vazio; ponto de extensão
    // para um futuro 9º domínio).
    if (
      snapshot.length !== 9 + 8 + 2 + EXPORT_UNCOVERED_CLINIC_TABLES.length ||
      snapshot.some(
        (result) => !result.success || !Array.isArray(result.results),
      )
    ) {
      return coverageFailure();
    }
  } catch (error) {
    if (isMissingExportTable(error, "tenant_lifecycle")) {
      return {
        ok: false,
        code: "TENANT_LIFECYCLE_NOT_CONFIGURED",
        message: "Lifecycle do tenant ainda não migrado.",
        status: 503,
      };
    }
    return coverageFailure();
  }
  const rows = <T>(index: number): T[] => snapshot[index].results as T[];
  const lifecycle = rows<LifecycleRow>(0)[0];
  if (!lifecycle) {
    return {
      ok: false,
      code: "TENANT_LIFECYCLE_NOT_FOUND",
      message: "Lifecycle do tenant não encontrado.",
      status: 409,
    };
  }
  let safeCounts: TenantExportCounts;
  let uncoveredCounts: Record<string, number>;
  try {
    safeCounts = normalizeCounts(rows<CountRow>(1)[0] ?? null);
    // Slot 19 em diante: 9 consultas-base + 8 domínios cobertos por S12B
    // (índices 9-16) + clinic_settings/retention_policy (17-18) vêm antes de
    // qualquer tabela ainda em EXPORT_UNCOVERED_CLINIC_TABLES — ver o batch acima.
    uncoveredCounts = Object.fromEntries(
      EXPORT_UNCOVERED_CLINIC_TABLES.map((table, index) => [
        table,
        validExportRowCount(rows<{ n: number }>(19 + index)[0] ?? null),
      ]),
    );
  } catch {
    return coverageFailure();
  }
  if (options.enforceSyncLimits && !exportWithinSyncLimits(safeCounts))
    return tooLarge();
  if (
    (safeCounts.patients > 0 || safeCounts.events > 0) &&
    !clinicalCryptoReady(env)
  ) {
    return {
      ok: false,
      code: "CLINICAL_CRYPTO_NOT_CONFIGURED",
      message:
        "Keyring clínico necessário para exportação não está configurado.",
      status: 503,
    };
  }
  const clinic = rows<ClinicRow>(2)[0];
  const membershipRows = rows<MembershipRow>(3);
  const patientRows = rows<PatientRow>(4);
  const eventRows = rows<EventRow>(5);
  const billingCustomer = rows<BillingCustomerRow>(6)[0];
  const subscriptions = rows<SubscriptionRow>(7);
  const snapshotAt = rows<{ snapshot_at: string }>(8)[0]?.snapshot_at;
  const assessmentRows = rows<AssessmentRow>(9);
  const assessmentResponseRows = rows<AssessmentResponseRow>(10);
  const documentRows = rows<DocumentRow>(11);
  const documentVersionRows = rows<DocumentVersionRow>(12);
  const intakeInvitationRows = rows<IntakeInvitationRow>(13);
  const intakeSubmissionRows = rows<IntakeSubmissionRow>(14);
  const scaleInvitationRows = rows<ScaleInvitationRow>(15);
  const scaleResponseRows = rows<ScaleResponseRow>(16);
  const clinicSettings = rows<ClinicSettingsRow>(17)[0] ?? null;
  const retentionPolicy = rows<RetentionPolicyRow>(18)[0] ?? null;
  if (
    !snapshotAt ||
    !Number.isFinite(Date.parse(snapshotAt)) ||
    safeCounts.patients !== patientRows.length ||
    safeCounts.events !== eventRows.length ||
    safeCounts.memberships !== membershipRows.length
  )
    return coverageFailure();

  if (!clinic) {
    return {
      ok: false,
      code: "TENANT_NOT_FOUND",
      message: "Clínica não encontrada.",
      status: 404,
    };
  }

  let patients: unknown[];
  let events: unknown[];
  let assessments: unknown[];
  let assessmentResponses: unknown[];
  let documentVersions: unknown[];
  let intakeSubmissions: unknown[];
  let scaleResponses: unknown[];
  try {
    patients = await Promise.all(
      patientRows.map(async (row) => ({
        id: row.id,
        primaryProfessionalUserId: row.primary_professional_user_id,
        profile: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `patient-profile:${row.id}`,
          row.profile_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        status: row.status,
        mergedIntoPatientId: row.merged_into_patient_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
    events = await Promise.all(
      eventRows.map(async (row) => ({
        id: row.id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        eventType: row.event_type,
        occurredAt: row.occurred_at,
        encounterId: row.encounter_id,
        provenanceKind: row.provenance_kind,
        provenanceSource: row.provenance_source,
        payload: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `clinical-event:${row.id}`,
          row.payload_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        supersedesEventId: row.supersedes_event_id,
        status: row.status,
        createdAt: row.created_at,
      })),
    );
    // S12B — mesma disciplina de patients/events: falha em decriptar
    // qualquer linha de qualquer domínio aborta o export inteiro (nunca um
    // arquivo parcial legível).
    assessments = await Promise.all(
      assessmentRows.map(async (row) => ({
        id: row.id,
        patientId: row.patient_id,
        instrumentId: row.instrument_id,
        instrumentVersion: row.instrument_version,
        appliedByUserId: row.applied_by_user_id,
        appliedAt: row.applied_at,
        provenanceSource: row.provenance_source,
        payload: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `assessment:${row.id}`,
          row.payload_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        supersedesAssessmentId: row.supersedes_assessment_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    );
    assessmentResponses = await Promise.all(
      assessmentResponseRows.map(async (row) => ({
        id: row.id,
        patientId: row.patient_id,
        assessmentId: row.assessment_id,
        itemId: row.item_id,
        itemPosition: row.item_position,
        response: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `assessment-response:${row.id}`,
          row.response_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        createdAt: row.created_at,
      })),
    );
    documentVersions = await Promise.all(
      documentVersionRows.map(async (row) => ({
        id: row.id,
        documentId: row.document_id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        version: row.version,
        content: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `document-version:${row.id}`,
          row.content_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        origin: row.origin,
        issuedAt: row.issued_at,
        status: row.status,
        familyVisibility: row.family_visibility === 1,
        supersededAt: row.superseded_at,
        createdAt: row.created_at,
      })),
    );
    intakeSubmissions = await Promise.all(
      intakeSubmissionRows.map(async (row) => ({
        id: row.id,
        invitationId: row.invitation_id,
        patientId: row.patient_id,
        respondentKind: row.respondent_kind,
        formKind: row.form_kind,
        formId: row.form_id,
        payload: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `remote-intake-submission:${row.id}`,
          row.payload_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        consentNoticeVersion: row.consent_notice_version,
        consentedAt: row.consented_at,
        reviewStatus: row.review_status,
        reviewedByUserId: row.reviewed_by_user_id,
        reviewedAt: row.reviewed_at,
        clinicalEventId: row.clinical_event_id,
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
      })),
    );
    scaleResponses = await Promise.all(
      scaleResponseRows.map(async (row) => ({
        id: row.id,
        invitationId: row.invitation_id,
        patientId: row.patient_id,
        respondentKind: row.respondent_kind,
        scaleId: row.scale_id,
        answers: await decryptClinicalJson<unknown>(
          env,
          clinicId,
          `remote-scale-response:${row.id}`,
          row.answers_encrypted,
        ),
        encryptionVersion: row.encryption_version,
        consentNoticeVersion: row.consent_notice_version,
        consentedAt: row.consented_at,
        reviewStatus: row.review_status,
        reviewedByUserId: row.reviewed_by_user_id,
        reviewedAt: row.reviewed_at,
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
      })),
    );
  } catch (error) {
    console.error("[tenant.export] decrypt", error);
    return {
      ok: false,
      code: "TENANT_EXPORT_DECRYPT_FAILED",
      message:
        "Não foi possível decriptar integralmente o tenant; nenhum arquivo parcial foi entregue.",
      status: 500,
    };
  }

  const effectiveStatus = effectiveTenantLifecycleStatus({
    status: lifecycle.status,
    requestedAt: lifecycle.requested_at,
    retentionUntil: lifecycle.retention_until,
    legalHold: lifecycle.legal_hold === 1,
  });

  const complete = Object.values(uncoveredCounts).every((count) => count === 0);

  return {
    ok: true,
    counts: safeCounts,
    complete,
    uncoveredCounts,
    data: {
      snapshotAt,
      clinic: {
        id: clinic.id,
        slug: clinic.slug,
        name: clinic.name,
        legalName: clinic.legal_name,
        timezone: clinic.timezone,
        status: clinic.status,
        createdAt: clinic.created_at,
        updatedAt: clinic.updated_at,
      },
      lifecycle: {
        status: lifecycle.status,
        effectiveStatus,
        reasonCode: lifecycle.reason_code,
        requestedAt: lifecycle.requested_at,
        retentionUntil: lifecycle.retention_until,
        canceledAt: lifecycle.canceled_at,
        finalizedAt: lifecycle.finalized_at,
        legalHold: lifecycle.legal_hold === 1,
      },
      memberships: membershipRows.map((row) => ({
        userId: row.user_id,
        role: row.role,
        active: row.active === 1,
        invitedByUserId: row.invited_by_user_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      billing: {
        customer: billingCustomer
          ? {
              provider: billingCustomer.provider,
              status: billingCustomer.status,
              billingEmail: billingCustomer.billing_email,
              trialEndsAt: billingCustomer.trial_ends_at,
              lastFailedAt: billingCustomer.last_failed_at,
              canceledAt: billingCustomer.canceled_at,
              graceEndsAt: billingCustomer.grace_ends_at,
              createdAt: billingCustomer.created_at,
              updatedAt: billingCustomer.updated_at,
            }
          : null,
        subscriptions: subscriptions.map((row) => ({
          planId: row.plan_id,
          seats: row.seats,
          status: row.status,
          anchoredAt: row.anchored_at,
          currentPeriodStartsAt: row.current_period_starts_at,
          currentPeriodEndsAt: row.current_period_ends_at,
          canceledAt: row.canceled_at,
          cancelReason: row.cancel_reason,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      },
      patients,
      clinicalEvents: events,
      // S12B (LTB-02): os oito domínios que faltavam para o export declarar
      // `complete: true` honestamente e liberar o purge de encerramento.
      assessments,
      assessmentResponses,
      documents: documentRows.map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        authorUserId: row.author_user_id,
        documentType: row.document_type,
        origin: row.origin,
        status: row.status,
        familyVisibility: row.family_visibility === 1,
        currentVersion: row.current_version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      documentVersions,
      // token_hash nunca aparece aqui: é segredo de posse do convite, não
      // dado do titular (ver IntakeInvitationRow/ScaleInvitationRow).
      intakeInvitations: intakeInvitationRows.map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        createdByUserId: row.created_by_user_id,
        respondentKind: row.respondent_kind,
        formKind: row.form_kind,
        formId: row.form_id,
        status: row.status,
        expiresAt: row.expires_at,
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      intakeSubmissions,
      scaleInvitations: scaleInvitationRows.map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        createdByUserId: row.created_by_user_id,
        respondentKind: row.respondent_kind,
        scaleId: row.scale_id,
        status: row.status,
        expiresAt: row.expires_at,
        submittedAt: row.submitted_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      scaleResponses,
      // Correção de escopo (revisão da PR): o backlog original de S12B pedia
      // clinic_settings e live_retention_policies no payload — nenhum dos
      // dois é PHI nem bloqueia purge (PURGE_PRESERVED_TABLES em
      // _purge.ts), mas ficaram fora da primeira entrega por engano. `null`
      // quando a clínica nunca configurou (0 linhas é o estado normal para
      // uma clínica nova).
      clinicSettings: clinicSettings
        ? {
            displayName: clinicSettings.display_name,
            addressLine1: clinicSettings.address_line1,
            addressLine2: clinicSettings.address_line2,
            phone: clinicSettings.phone,
            publicEmail: clinicSettings.public_email,
            companyLine: clinicSettings.company_line,
            motto: clinicSettings.motto,
            updatedByUserId: clinicSettings.updated_by_user_id,
            updatedAt: clinicSettings.updated_at,
          }
        : null,
      retentionPolicy: retentionPolicy
        ? {
            retentionDays: retentionPolicy.retention_days,
            autoDeleteEnabled: retentionPolicy.auto_delete_enabled === 1,
            configuredByUserId: retentionPolicy.configured_by_user_id,
            createdAt: retentionPolicy.created_at,
            updatedAt: retentionPolicy.updated_at,
          }
        : null,
    },
  };
}

/**
 * POST /api/admin/legacy-patient-migration
 *
 * G3 (S9, decisões D-012/D-013): copia o ÚNICO paciente legado real — o
 * registro não-seed de `patients_demo`, da conta bootstrap — e suas escalas
 * para o prontuário LIVE cifrado da clínica da qual essa conta é titular.
 *
 * Travas (todas conferidas na própria requisição, nada é inferido):
 *  - somente o admin bootstrap (role admin + e-mail = ADMIN_EMAIL);
 *  - confirmação digitada `MIGRAR-PACIENTE-LEGADO`;
 *  - censo refeito na hora: 3 seeds sem owner, 1 não-seed, e ele é da conta;
 *  - a conta tem exatamente 1 vínculo ativo de titular em clínica ativa;
 *  - o registro não tem dependentes que esta rota não migra (consultas,
 *    documentos, memória, Conecta, eventos): se tiver, recusa;
 *  - keyring clínico pronto;
 *  - idempotência: a referência externa `legacy:patients_demo:<id>` vira
 *    blind index único por clínica; segunda execução responde 409.
 *
 * A origem legada NÃO é apagada nem alterada. `dryRun: true` faz todas as
 * checagens e cifra em memória, sem gravar. Respostas e auditoria levam só
 * contagens e IDs opacos — nunca nome, data de nascimento ou conteúdo.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";
import { prepareSaasAudit, tenantError, tenantJson, type TenantEnv } from "../tenant/_core";
import {
  clinicalBlindIndex,
  clinicalCryptoReady,
  currentClinicalEncryptionVersion,
  encryptClinicalJson,
} from "../tenant/_crypto";

export const LEGACY_MIGRATION_CONFIRMATION = "MIGRAR-PACIENTE-LEGADO";
const SEED_IDS = ["demo-001", "demo-002", "demo-003"] as const;
const SEED_SQL = `('${SEED_IDS.join("', '")}')`;
/** Tabelas ligadas a paciente que esta rota NÃO migra: precisam estar vazias para o registro real. */
const UNSUPPORTED_DEPENDENTS = [
  "consultations_demo",
  "documents_demo",
  "clinical_memory_notes_demo",
  "conecta_events_demo",
  "clinical_events_demo",
] as const;

type MigrationEnv = TenantEnv & { ADMIN_EMAIL?: string };

interface LegacyPatientRow {
  id: string;
  owner_user_id: string;
  name: string;
  birth_date: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  diagnosis_code: string | null;
  notes: string | null;
}

interface LegacyScaleRow {
  id: string;
  scale_id: string;
  scale_name: string;
  score: number | null;
  interpretation: string | null;
  details: string | null;
  applied_at: string;
}

function blocked(code: string, status = 409): Response {
  return tenantError("Migração legada bloqueada pelas travas de segurança.", code, status);
}

async function count(db: D1Database, sql: string, ...args: unknown[]): Promise<number> {
  const row = await db.prepare(sql).bind(...args).first<{ total: number }>();
  return Number(row?.total ?? 0);
}

async function tableExists(db: D1Database, name: string): Promise<boolean> {
  return (await count(db, "SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name = ?", name)) === 1;
}

function legacyDate(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match ? match[1] : null;
}

function parsedDetails(value: string | null): unknown {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

interface LegacyResponse { itemId: string; itemPosition: number; value: { question: string; answer: unknown } }

/**
 * Converte as respostas salvas no modelo antigo (`details.responses`, como grava
 * functions/api/results.ts: lista de {question, answer}; ou um mapa item→valor)
 * na estrutura canônica do LIVE, para a ficha e o PDF verem as respostas.
 */
function legacyResponses(details: unknown): LegacyResponse[] {
  if (!details || typeof details !== "object" || Array.isArray(details)) return [];
  const record = details as Record<string, unknown>;
  const source = record.responses ?? record.answers;
  if (Array.isArray(source)) {
    return source.slice(0, 1000).map((item, index) => {
      const entry = item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : null;
      const question = typeof entry?.question === "string" && entry.question.trim() ? entry.question.trim() : `Item ${index + 1}`;
      const answer = entry ? (entry.answer ?? null) : item;
      return { itemId: `item-${index + 1}`, itemPosition: index, value: { question, answer } };
    });
  }
  if (source && typeof source === "object") {
    return Object.entries(source as Record<string, unknown>).slice(0, 1000).map(([key, answer], index) => ({
      itemId: `item-${index + 1}`,
      itemPosition: index,
      value: { question: key, answer },
    }));
  }
  return [];
}

function isoInstant(value: string): string {
  const normalized = /\dT\d/.test(value) ? value : value.replace(" ", "T");
  const date = new Date(/Z|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function isBootstrapAdmin(env: MigrationEnv, user: NonNullable<ReturnType<typeof getContextUser>>): boolean {
  const bootstrapEmail = env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  return isAdmin(user) && Boolean(bootstrapEmail) && user.email.trim().toLowerCase() === bootstrapEmail;
}

/** A tela pergunta se deve exibir o cartão; a resposta não revela censo nem dado clínico. */
export const onRequestGet: PagesFunction<MigrationEnv> = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!isBootstrapAdmin(context.env, user)) return tenantError("Acesso restrito.", "FORBIDDEN", 403);
  return tenantJson({ eligible: true }, 200);
};

export const onRequestPost: PagesFunction<MigrationEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!isBootstrapAdmin(context.env, user)) return tenantError("Acesso restrito.", "FORBIDDEN", 403);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }
  if (body.confirm !== LEGACY_MIGRATION_CONFIRMATION) {
    return tenantError("Confirmação ausente.", "CONFIRMATION_REQUIRED", 400);
  }
  const dryRun = body.dryRun === true;
  if (!clinicalCryptoReady(context.env)) return blocked("CLINICAL_CRYPTO_NOT_CONFIGURED", 503);
  if (!(await tableExists(db, "patients_demo")) || !(await tableExists(db, "scale_results_demo"))) {
    return blocked("LEGACY_SCHEMA_MISSING");
  }

  // Censo refeito no instante da operação (D-013, item 1).
  const seedsWithoutOwner = await count(db, `SELECT COUNT(*) AS total FROM patients_demo WHERE id IN ${SEED_SQL} AND owner_user_id IS NULL`);
  const ownerless = await count(db, "SELECT COUNT(*) AS total FROM patients_demo WHERE owner_user_id IS NULL");
  const nonSeed = await db
    .prepare(`SELECT id, owner_user_id, name, birth_date, guardian_name, guardian_phone, diagnosis_code, notes
                FROM patients_demo WHERE id NOT IN ${SEED_SQL}`)
    .all<LegacyPatientRow>();
  const candidates = nonSeed.results ?? [];
  if (seedsWithoutOwner !== 3 || ownerless !== 3 || candidates.length !== 1) return blocked("CENSUS_MISMATCH");
  const legacy = candidates[0];
  if (legacy.owner_user_id !== user.id) return blocked("CENSUS_MISMATCH");

  // Destino: a única clínica ativa da qual a conta é titular (D-013, item 2).
  const clinics = await db
    .prepare(`SELECT cm.clinic_id AS clinic_id FROM clinic_memberships cm JOIN clinics c ON c.id = cm.clinic_id
               WHERE cm.user_id = ? AND cm.role = 'owner' AND cm.active = 1 AND c.status = 'active'`)
    .bind(user.id)
    .all<{ clinic_id: string }>();
  const owned = clinics.results ?? [];
  if (owned.length !== 1) return blocked("OWNER_CLINIC_NOT_UNIQUE");
  const clinicId = owned[0].clinic_id;

  for (const table of UNSUPPORTED_DEPENDENTS) {
    if (!(await tableExists(db, table))) continue;
    if ((await count(db, `SELECT COUNT(*) AS total FROM ${table} WHERE patient_id = ?`, legacy.id)) > 0) {
      return blocked("UNSUPPORTED_DEPENDENTS");
    }
  }

  const name = (legacy.name ?? "").trim();
  if (name.length < 2) return blocked("LEGACY_PROFILE_INVALID");
  const externalReferenceHash = await clinicalBlindIndex(
    context.env,
    clinicId,
    "external-reference",
    `legacy:patients_demo:${legacy.id}`,
  );
  const already = await count(
    db,
    "SELECT COUNT(*) AS total FROM live_patients WHERE clinic_id = ? AND external_reference_hash = ?",
    clinicId,
    externalReferenceHash,
  );
  if (already > 0) return blocked("ALREADY_MIGRATED");

  const scales = (
    await db
      .prepare(`SELECT id, scale_id, scale_name, score, interpretation, details, applied_at
                  FROM scale_results_demo WHERE patient_id = ? ORDER BY applied_at, id`)
      .bind(legacy.id)
      .all<LegacyScaleRow>()
  ).results ?? [];

  const birthDate = legacyDate(legacy.birth_date);
  const profile = {
    name: name.slice(0, 160),
    birthDate,
    guardianName: legacy.guardian_name?.trim().slice(0, 160) || null,
    guardianPhone: legacy.guardian_phone?.trim().slice(0, 40) || null,
    diagnosisCode: legacy.diagnosis_code?.trim().slice(0, 40) || null,
    notes: legacy.notes?.trim().slice(0, 12_000) || null,
  };
  const patientId = crypto.randomUUID();
  const now = new Date().toISOString();
  const encryptionVersion = currentClinicalEncryptionVersion(context.env);
  const profileEncrypted = await encryptClinicalJson(context.env, clinicId, `patient-profile:${patientId}`, profile);
  const identityHash = birthDate
    ? await clinicalBlindIndex(context.env, clinicId, "patient-identity", `${profile.name}|${birthDate}`)
    : null;

  const assessments = await Promise.all(
    scales.map(async (scale) => {
      const id = crypto.randomUUID();
      const payload = {
        title: scale.scale_name,
        legacy: {
          origin: "scale_results_demo",
          score: scale.score,
          interpretation: scale.interpretation,
          details: parsedDetails(scale.details),
        },
      };
      const responses = await Promise.all(
        legacyResponses(payload.legacy.details).map(async (response) => {
          const responseId = crypto.randomUUID();
          return {
            id: responseId,
            ...response,
            encrypted: await encryptClinicalJson(context.env, clinicId, `assessment-response:${responseId}`, response.value),
          };
        }),
      );
      return {
        id,
        instrumentId: (scale.scale_id || "legado").slice(0, 160),
        appliedAt: isoInstant(scale.applied_at),
        encrypted: await encryptClinicalJson(context.env, clinicId, `assessment:${id}`, payload),
        responses,
      };
    }),
  );

  const summary = {
    dryRun,
    clinicId,
    patientsMigrated: dryRun ? 0 : 1,
    assessmentsMigrated: dryRun ? 0 : assessments.length,
    assessmentsFound: assessments.length,
    responsesFound: assessments.reduce((total, a) => total + a.responses.length, 0),
    legacySourcePreserved: true,
  };
  if (dryRun) return tenantJson(summary, 200);

  const statements: D1PreparedStatement[] = [
    db
      .prepare(`INSERT INTO live_patients
          (id, clinic_id, primary_professional_user_id, created_by_user_id,
           external_reference_hash, patient_identity_hash, profile_encrypted,
           encryption_version, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`)
      .bind(patientId, clinicId, user.id, user.id, externalReferenceHash, identityHash, profileEncrypted, encryptionVersion, now, now),
    ...assessments.flatMap((a) => [
      db
        .prepare(`INSERT INTO live_assessments
            (id, clinic_id, patient_id, instrument_id, instrument_version,
             applied_by_user_id, applied_at, provenance_source, payload_encrypted,
             encryption_version, supersedes_assessment_id, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'legado', ?, ?, 'instrument', ?, ?, NULL, 'active', ?, ?)`)
        .bind(a.id, clinicId, patientId, a.instrumentId, user.id, a.appliedAt, a.encrypted, encryptionVersion, now, now),
      ...a.responses.map((r) =>
        db
          .prepare(`INSERT INTO live_assessment_responses
              (id, clinic_id, patient_id, assessment_id, item_id, item_position,
               response_encrypted, encryption_version, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(r.id, clinicId, patientId, a.id, r.itemId, r.itemPosition, r.encrypted, encryptionVersion, now),
      ),
    ]),
    prepareSaasAudit(
      db,
      {
        clinicId,
        actorUserId: user.id,
        action: "legacy_patient_migrated",
        targetType: "patient",
        targetId: patientId,
        metadata: { assessments: assessments.length, responses: summary.responsesFound, encryptionVersion, legacySourcePreserved: true },
      },
      true,
    ),
  ];
  try {
    const results = await db.batch(statements);
    const ok = results.every((result) => (result?.meta?.changes ?? 0) === 1);
    if (!ok) return tenantError("Migração não concluída.", "DB_ERROR", 500);
  } catch (error) {
    console.error("[admin.legacy-patient-migration] batch failed", error instanceof Error ? error.name : "unknown");
    return tenantError("Migração não concluída.", "DB_ERROR", 500);
  }
  return tenantJson({ ...summary, patientId }, 201);
};

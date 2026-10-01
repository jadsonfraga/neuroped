import type { PublicUser } from "../auth/_shared";
import type { OperationsProviderChoice } from "../../../shared/operations";

export interface OperationsPrincipal {
  actorUserId: string;
  actorRole: string;
  providerUserId: string;
  providerName: string;
  delegated: boolean;
  canConfigure: boolean;
}

export interface OperationsStaffLink {
  staffUserId: string;
  staffName: string;
  staffEmail: string;
  active: boolean;
  createdAt: string;
}

const HARDENING_SCHEMA = [
  // Espelho da forma final da migração 0032: SEM `UNIQUE` em staff_user_id (uma
  // recepção pode ter mais de um profissional). Este CREATE só vale em banco
  // novo; em produção a tabela já existe e a 0032 a reconstruiu.
  `CREATE TABLE IF NOT EXISTS booking_staff_links (
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider_user_id, staff_user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_staff_provider_active
     ON booking_staff_links(provider_user_id, active, staff_user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_booking_staff_staff_active
     ON booking_staff_links(staff_user_id, active, provider_user_id)`,
  `CREATE TABLE IF NOT EXISTS operations_audit_log (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id TEXT,
    actor_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    metadata_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_operations_audit_provider_time
     ON operations_audit_log(provider_user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_operations_audit_actor_time
     ON operations_audit_log(actor_user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_operations_audit_clinic_time
     ON operations_audit_log(clinic_id, created_at DESC)`,
  `CREATE TRIGGER IF NOT EXISTS trg_appointments_respect_blocks_insert
   BEFORE INSERT ON appointments
   WHEN NEW.status IN ('requested','confirmed','checked_in','in_care')
    AND EXISTS (
      SELECT 1 FROM booking_blocks b
       WHERE b.provider_user_id = NEW.provider_user_id
         AND b.starts_at_local < NEW.ends_at_local
         AND b.ends_at_local > NEW.starts_at_local
    )
   BEGIN
     SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
   END`,
  `CREATE TRIGGER IF NOT EXISTS trg_appointments_respect_blocks_update
   BEFORE UPDATE OF provider_user_id, starts_at_local, ends_at_local, status ON appointments
   WHEN NEW.status IN ('requested','confirmed','checked_in','in_care')
    AND EXISTS (
      SELECT 1 FROM booking_blocks b
       WHERE b.provider_user_id = NEW.provider_user_id
         AND b.starts_at_local < NEW.ends_at_local
         AND b.ends_at_local > NEW.starts_at_local
    )
   BEGIN
     SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
   END`,
  `CREATE TRIGGER IF NOT EXISTS trg_blocks_respect_appointments_insert
   BEFORE INSERT ON booking_blocks
   WHEN EXISTS (
      SELECT 1 FROM appointments a
       WHERE a.provider_user_id = NEW.provider_user_id
         AND a.status IN ('requested','confirmed','checked_in','in_care')
         AND a.starts_at_local < NEW.ends_at_local
         AND a.ends_at_local > NEW.starts_at_local
    )
   BEGIN
     SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
   END`,
  `CREATE TRIGGER IF NOT EXISTS trg_blocks_respect_appointments_update
   BEFORE UPDATE OF provider_user_id, starts_at_local, ends_at_local ON booking_blocks
   WHEN EXISTS (
      SELECT 1 FROM appointments a
       WHERE a.provider_user_id = NEW.provider_user_id
         AND a.status IN ('requested','confirmed','checked_in','in_care')
         AND a.starts_at_local < NEW.ends_at_local
         AND a.ends_at_local > NEW.starts_at_local
    )
   BEGIN
     SELECT RAISE(ABORT, 'SCHEDULE_CONFLICT');
   END`,
  // Evidência LGPD do aceite no agendamento público. Espelho exato da migração
  // 0016_public_booking_consent_evidence.sql: o bootstrap de runtime garante a
  // trilha mesmo em bancos onde a migração ainda não rodou — sem isso, um
  // agendamento público criado antes da migração ficaria sem prova de aceite.
  `CREATE TABLE IF NOT EXISTS public_booking_consent_evidence (
    id TEXT PRIMARY KEY,
    appointment_id TEXT UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    waitlist_entry_id TEXT UNIQUE REFERENCES waitlist_entries(id) ON DELETE CASCADE,
    notice_version TEXT NOT NULL,
    notice_sha256 TEXT NOT NULL,
    purpose TEXT NOT NULL,
    accepted_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
      (appointment_id IS NOT NULL AND waitlist_entry_id IS NULL)
      OR (appointment_id IS NULL AND waitlist_entry_id IS NOT NULL)
    )
  )`,
  `CREATE INDEX IF NOT EXISTS idx_public_booking_consent_accepted_at
     ON public_booking_consent_evidence(accepted_at DESC)`,
  `CREATE TRIGGER IF NOT EXISTS trg_public_appointment_consent_evidence
   AFTER INSERT ON appointments
   WHEN NEW.source = 'public'
   BEGIN
     INSERT INTO public_booking_consent_evidence
       (id, appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at, created_at)
     VALUES
       ('consent-appt-' || NEW.id,
        NEW.id,
        NULL,
        'public-booking-privacy-v1',
        'sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece',
        'appointment_scheduling_and_management',
        NEW.created_at,
        NEW.created_at);
   END`,
  `CREATE TRIGGER IF NOT EXISTS trg_public_waitlist_consent_evidence
   AFTER INSERT ON waitlist_entries
   BEGIN
     INSERT INTO public_booking_consent_evidence
       (id, appointment_id, waitlist_entry_id, notice_version, notice_sha256, purpose, accepted_at, created_at)
     VALUES
       ('consent-wait-' || NEW.id,
        NULL,
        NEW.id,
        'public-booking-privacy-v1',
        'sha256:d0a7e8c1ed9dff137adb2532a1ce4b11a3e91accf5ce6880fd3108a918932ece',
        'appointment_scheduling_and_management',
        NEW.created_at,
        NEW.created_at);
   END`,
] as const;

export async function ensureOperationsHardeningSchema(db: D1Database): Promise<void> {
  await db.batch(HARDENING_SCHEMA.map((sql) => db.prepare(sql)));
}

export type { OperationsProviderChoice };

/**
 * Resultado da resolução de acesso à agenda.
 *
 * - `ok`: principal resolvido. `strict` indica que o profissional veio de uma
 *   escolha explícita ou de uma recepção com mais de um vínculo; nesse caminho a
 *   membership `assistant` ativa na clínica é exigida a CADA requisição.
 * - `none`: nenhum vínculo ativo para um profissional válido.
 * - `not_available`: o profissional pedido não é permitido a esta recepção.
 *   Inexistente, sem vínculo, vínculo suspenso e profissional inativo caem aqui e
 *   são indistinguíveis (anti-enumeração).
 * - `selection_required`: mais de um profissional possível e nenhum pedido.
 *   Nunca se escolhe uma agenda por acaso.
 */
export type OperationsAccessResolution =
  | { kind: "ok"; principal: OperationsPrincipal; strict: boolean; availableProviders: OperationsProviderChoice[] }
  | { kind: "none" }
  | { kind: "not_available" }
  | { kind: "selection_required"; providers: OperationsProviderChoice[] };

const MAX_PROVIDER_CHOICES = 100;

const ACTIVE_VALID_PROVIDER_LINK = `l.staff_user_id = ? AND l.active = 1
         AND p.is_active = 1 AND p.role IN ('admin','professional')`;

async function listProviderChoices(db: D1Database, staffUserId: string): Promise<OperationsProviderChoice[]> {
  const { results } = await db
    .prepare(
      `SELECT l.provider_user_id AS id, p.name AS name
         FROM booking_staff_links l
         JOIN users p ON p.id = l.provider_user_id
        WHERE ${ACTIVE_VALID_PROVIDER_LINK}
        ORDER BY p.name, l.provider_user_id
        LIMIT ${MAX_PROVIDER_CHOICES}`,
    )
    .bind(staffUserId)
    .all<{ id: string; name: string }>();
  return (results ?? []).map((row) => ({ id: row.id, name: row.name }));
}

async function getProviderChoice(
  db: D1Database,
  staffUserId: string,
  providerUserId: string,
): Promise<OperationsProviderChoice | null> {
  const row = await db
    .prepare(
      `SELECT l.provider_user_id AS id, p.name AS name
         FROM booking_staff_links l
         JOIN users p ON p.id = l.provider_user_id
        WHERE ${ACTIVE_VALID_PROVIDER_LINK} AND l.provider_user_id = ?
        LIMIT 1`,
    )
    .bind(staffUserId, providerUserId)
    .first<{ id: string; name: string }>();
  return row ? { id: row.id, name: row.name } : null;
}

/**
 * Resolve de qual agenda o usuário opera nesta requisição.
 *
 * `requestedProviderId` é só um ALVO SOLICITADO pelo cliente, nunca autoridade:
 * é validado aqui contra o vínculo ativo persistido da recepção. Profissional e
 * admin operam sempre a própria agenda (o pedido é ignorado); a seleção só existe
 * para o papel `operator`.
 */
export async function resolveOperationsAccess(
  db: D1Database,
  user: PublicUser,
  requestedProviderId: string | null = null,
): Promise<OperationsAccessResolution> {
  if (user.role === "admin" || user.role === "professional") {
    return {
      kind: "ok",
      strict: false,
      availableProviders: [],
      principal: {
        actorUserId: user.id,
        actorRole: user.role,
        providerUserId: user.id,
        providerName: user.name,
        delegated: false,
        canConfigure: true,
      },
    };
  }

  if (user.role !== "operator") return { kind: "none" };

  const choices = await listProviderChoices(db, user.id);
  const asPrincipal = (choice: OperationsProviderChoice): OperationsPrincipal => ({
    actorUserId: user.id,
    actorRole: user.role,
    providerUserId: choice.id,
    providerName: choice.name,
    delegated: true,
    canConfigure: false,
  });

  if (requestedProviderId) {
    // A lista é limitada; só consulta direto se o pedido não está nela e ela
    // pode estar truncada.
    const hit =
      choices.find((choice) => choice.id === requestedProviderId) ??
      (choices.length >= MAX_PROVIDER_CHOICES
        ? await getProviderChoice(db, user.id, requestedProviderId)
        : null);
    if (!hit) return { kind: "not_available" };
    return { kind: "ok", principal: asPrincipal(hit), strict: true, availableProviders: choices };
  }

  if (choices.length === 0) return { kind: "none" };
  // Mais de um profissional e nenhuma escolha: nunca por ordem de armazenamento.
  if (choices.length > 1) return { kind: "selection_required", providers: choices };
  // Um único vínculo e nenhum pedido: comportamento histórico, inalterado.
  return { kind: "ok", principal: asPrincipal(choices[0]), strict: false, availableProviders: choices };
}

/**
 * Compatibilidade: principal quando a resolução é inequívoca, `null` caso
 * contrário (sem vínculo, indisponível ou seleção necessária).
 */
export async function resolveOperationsPrincipal(
  db: D1Database,
  user: PublicUser,
): Promise<OperationsPrincipal | null> {
  const access = await resolveOperationsAccess(db, user, null);
  return access.kind === "ok" ? access.principal : null;
}

/**
 * Membership `assistant` ATIVA da recepção na clínica da requisição. Vale para o
 * caminho com seleção/vários vínculos; o vínculo único histórico não a exige
 * (ver docs/saas/MULTI_PROVIDER_AGENDA.md, risco aberto).
 */
export async function operatorHasActiveAssistantMembership(
  db: D1Database,
  staffUserId: string,
  clinicId: string,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT 1 AS ok WHERE ${STAFF_MEMBERSHIP_PREDICATE}`)
    .bind(clinicId, staffUserId)
    .first<{ ok: number }>();
  return Boolean(row);
}

export async function listOperationsStaff(
  db: D1Database,
  providerUserId: string,
): Promise<OperationsStaffLink[]> {
  const result = await db
    .prepare(
      `SELECT l.staff_user_id, u.name AS staff_name, u.email AS staff_email,
              l.active, l.created_at
         FROM booking_staff_links l
         JOIN users u ON u.id = l.staff_user_id
        WHERE l.provider_user_id = ?
        ORDER BY l.active DESC, u.name`,
    )
    .bind(providerUserId)
    .all<{
      staff_user_id: string;
      staff_name: string;
      staff_email: string;
      active: number;
      created_at: string;
    }>();

  return (result.results ?? []).map((row) => ({
    staffUserId: row.staff_user_id,
    staffName: row.staff_name,
    staffEmail: row.staff_email,
    active: Boolean(row.active),
    createdAt: row.created_at,
  }));
}

// O vínculo de recepção só vale para quem já é membro `assistant` ATIVO da
// mesma clínica — isto é, quem aceitou um convite dela (consentimento do
// titular). Antes, qualquer conta `operator` da plataforma, de qualquer
// clínica, podia ser vinculada sem aceite (AUTHZ-P1-06). A condição é
// repetida no predicado da escrita para não abrir janela entre a checagem e
// o INSERT/UPDATE.
const STAFF_MEMBERSHIP_PREDICATE = `EXISTS (
  SELECT 1 FROM clinic_memberships m
   WHERE m.clinic_id = ? AND m.user_id = ? AND m.role = 'assistant' AND m.active = 1
)`;

export async function linkOperationsOperator(
  db: D1Database,
  principal: OperationsPrincipal,
  email: string,
  clinicId: string,
): Promise<{ ok: true; staffUserId: string } | { ok: false; code: string }> {
  if (!principal.canConfigure) return { ok: false, code: "FORBIDDEN" };
  const normalized = email.trim().toLowerCase();
  const staff = await db
    .prepare(`SELECT id, role, is_active FROM users WHERE lower(email) = ? LIMIT 1`)
    .bind(normalized)
    .first<{ id: string; role: string; is_active: number }>();
  if (!staff) return { ok: false, code: "STAFF_NOT_FOUND" };
  if (!staff.is_active || staff.role !== "operator") {
    return { ok: false, code: "STAFF_ROLE_INVALID" };
  }
  if (staff.id === principal.providerUserId) return { ok: false, code: "SELF_LINK_INVALID" };
  const member = await db
    .prepare(`SELECT 1 AS ok WHERE ${STAFF_MEMBERSHIP_PREDICATE}`)
    .bind(clinicId, staff.id)
    .first<{ ok: number }>();
  if (!member) return { ok: false, code: "STAFF_NOT_CLINIC_MEMBER" };

  // Uma recepção pode atender vários profissionais (migração 0032, issue
  // #1064): o vínculo é do PAR (profissional, recepção). Reativa o deste
  // profissional se já existir; senão cria. Vínculos com outros profissionais
  // não são consultados nem alterados. A membership é repetida no predicado
  // das duas escritas.
  const now = new Date().toISOString();
  const update = await db
    .prepare(
      `UPDATE booking_staff_links
          SET active = 1, created_by_user_id = ?, updated_at = ?
        WHERE provider_user_id = ? AND staff_user_id = ?
          AND ${STAFF_MEMBERSHIP_PREDICATE}`,
    )
    .bind(principal.actorUserId, now, principal.providerUserId, staff.id, clinicId, staff.id)
    .run();
  if ((update.meta?.changes ?? 0) === 1) {
    return { ok: true, staffUserId: staff.id };
  }

  try {
    const inserted = await db
      .prepare(
        `INSERT INTO booking_staff_links
          (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
         SELECT ?, ?, 1, ?, ?, ?
          WHERE ${STAFF_MEMBERSHIP_PREDICATE}`,
      )
      .bind(principal.providerUserId, staff.id, principal.actorUserId, now, now, clinicId, staff.id)
      .run();
    if ((inserted.meta?.changes ?? 0) !== 1) {
      return { ok: false, code: "STAFF_NOT_CLINIC_MEMBER" };
    }
  } catch (cause) {
    // Corrida: outro pedido criou o MESMO par entre o UPDATE e o INSERT. O
    // resultado desejado (vínculo ativo) já existe; qualquer outro erro sobe.
    const winner = await db
      .prepare(
        `SELECT 1 AS found FROM booking_staff_links
          WHERE provider_user_id = ? AND staff_user_id = ? AND active = 1 LIMIT 1`,
      )
      .bind(principal.providerUserId, staff.id)
      .first<{ found: number }>();
    if (!winner) throw cause;
  }

  return { ok: true, staffUserId: staff.id };
}

export async function setOperationsStaffActive(
  db: D1Database,
  principal: OperationsPrincipal,
  staffUserId: string,
  active: boolean,
): Promise<boolean> {
  if (!principal.canConfigure) return false;
  const result = await db
    .prepare(
      `UPDATE booking_staff_links
          SET active = ?, updated_at = ?
        WHERE provider_user_id = ? AND staff_user_id = ?`,
    )
    .bind(active ? 1 : 0, new Date().toISOString(), principal.providerUserId, staffUserId)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

function safeAuditMetadata(value: Record<string, unknown> | undefined): string | null {
  if (!value) return null;
  const allowed: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^(status|previousStatus|source|serviceId|paymentStatus|staffUserId|bookingEnabled|count|modality)$/.test(key)) {
      continue;
    }
    if (typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item === null) {
      allowed[key] = item;
    }
  }
  return Object.keys(allowed).length ? JSON.stringify(allowed) : null;
}

export async function logOperationsAudit(
  db: D1Database,
  principal: OperationsPrincipal,
  clinicId: string,
  input: {
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO operations_audit_log
        (id, provider_user_id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      `ops-audit-${crypto.randomUUID()}`,
      principal.providerUserId,
      clinicId,
      principal.actorUserId,
      input.action.slice(0, 80),
      input.targetType.slice(0, 60),
      input.targetId?.slice(0, 100) ?? null,
      safeAuditMetadata(input.metadata),
      new Date().toISOString(),
    )
    .run();
}

export async function listOperationsAudit(
  db: D1Database,
  providerUserId: string,
  clinicId: string,
  limit = 40,
) {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  const result = await db
    .prepare(
      `SELECT a.id, a.actor_user_id, u.name AS actor_name, a.action,
              a.target_type, a.target_id, a.metadata_json, a.created_at
         FROM operations_audit_log a
         LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.provider_user_id = ? AND a.clinic_id = ?
        ORDER BY a.created_at DESC
        LIMIT ?`,
    )
    .bind(providerUserId, clinicId, safeLimit)
    .all<any>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name ?? "Usuário",
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: (() => {
      try {
        return row.metadata_json ? JSON.parse(row.metadata_json) : null;
      } catch {
        return null;
      }
    })(),
    createdAt: row.created_at,
  }));
}

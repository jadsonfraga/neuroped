import type { PublicUser } from "../auth/_shared";

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
  `CREATE TABLE IF NOT EXISTS booking_staff_links (
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    staff_user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider_user_id, staff_user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_booking_staff_provider_active
     ON booking_staff_links(provider_user_id, active, staff_user_id)`,
  `CREATE TABLE IF NOT EXISTS operations_audit_log (
    id TEXT PRIMARY KEY,
    provider_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
] as const;

export async function ensureOperationsHardeningSchema(db: D1Database): Promise<void> {
  await db.batch(HARDENING_SCHEMA.map((sql) => db.prepare(sql)));
}

export async function resolveOperationsPrincipal(
  db: D1Database,
  user: PublicUser,
  clinicId?: string | null,
): Promise<OperationsPrincipal | null> {
  if (
    user.role !== "operator"
    && user.role !== "admin"
    && user.role !== "professional"
  ) return null;

  if (clinicId) {
    const membership = await db
      .prepare(
        `SELECT role
           FROM clinic_memberships
          WHERE clinic_id = ? AND user_id = ? AND active = 1
          LIMIT 1`,
      )
      .bind(clinicId, user.id)
      .first<{ role: string }>();

    if (!membership) return null;

    if (["owner", "clinic_admin", "professional"].includes(membership.role)) {
      if (user.role !== "admin" && user.role !== "professional") return null;
      return {
        actorUserId: user.id,
        actorRole: user.role,
        providerUserId: user.id,
        providerName: user.name,
        delegated: false,
        canConfigure: true,
      };
    }

    if (membership.role !== "assistant") return null;

    const scoped = await db
      .prepare(
        `SELECT l.provider_user_id, p.name AS provider_name, p.role AS provider_role, p.is_active
           FROM booking_staff_links l
           JOIN users p ON p.id = l.provider_user_id
           JOIN clinic_memberships provider_membership
             ON provider_membership.user_id = l.provider_user_id
            AND provider_membership.clinic_id = ?
            AND provider_membership.active = 1
            AND provider_membership.role IN ('owner','clinic_admin','professional')
          WHERE l.staff_user_id = ? AND l.active = 1
          LIMIT 1`,
      )
      .bind(clinicId, user.id)
      .first<{
        provider_user_id: string;
        provider_name: string;
        provider_role: string;
        is_active: number;
      }>();

    if (!scoped || !scoped.is_active || !["admin", "professional"].includes(scoped.provider_role)) {
      return null;
    }

    return {
      actorUserId: user.id,
      actorRole: user.role,
      providerUserId: scoped.provider_user_id,
      providerName: scoped.provider_name,
      delegated: true,
      canConfigure: false,
    };
  }

  const row = await db
    .prepare(
      `SELECT l.provider_user_id, p.name AS provider_name, p.role AS provider_role, p.is_active
         FROM booking_staff_links l
         JOIN users p ON p.id = l.provider_user_id
        WHERE l.staff_user_id = ? AND l.active = 1
        LIMIT 1`,
    )
    .bind(user.id)
    .first<{
      provider_user_id: string;
      provider_name: string;
      provider_role: string;
      is_active: number;
    }>();

  if (!row || !row.is_active || !["admin", "professional"].includes(row.provider_role)) {
    if (user.role === "admin" || user.role === "professional") {
      return {
        actorUserId: user.id,
        actorRole: user.role,
        providerUserId: user.id,
        providerName: user.name,
        delegated: false,
        canConfigure: true,
      };
    }
    return null;
  }

  return {
    actorUserId: user.id,
    actorRole: user.role,
    providerUserId: row.provider_user_id,
    providerName: row.provider_name,
    delegated: true,
    canConfigure: false,
  };
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

interface ExistingStaffOwner {
  provider_user_id: string;
}

async function getExistingStaffOwner(
  db: D1Database,
  staffUserId: string,
): Promise<ExistingStaffOwner | null> {
  return db
    .prepare(
      `SELECT provider_user_id
         FROM booking_staff_links
        WHERE staff_user_id = ?
        LIMIT 1`,
    )
    .bind(staffUserId)
    .first<ExistingStaffOwner>();
}

export async function linkOperationsOperator(
  db: D1Database,
  principal: OperationsPrincipal,
  email: string,
): Promise<{ ok: true; staffUserId: string } | { ok: false; code: string }> {
  if (!principal.canConfigure) return { ok: false, code: "FORBIDDEN" };
  const normalized = email.trim().toLowerCase();
  const staff = await db
    .prepare(`SELECT id, role, is_active FROM users WHERE email = ? LIMIT 1`)
    .bind(normalized)
    .first<{ id: string; role: string; is_active: number }>();
  if (!staff) return { ok: false, code: "STAFF_NOT_FOUND" };
  if (!staff.is_active || staff.role !== "operator") {
    return { ok: false, code: "STAFF_ROLE_INVALID" };
  }
  if (staff.id === principal.providerUserId) return { ok: false, code: "SELF_LINK_INVALID" };

  const existing = await getExistingStaffOwner(db, staff.id);
  if (existing && existing.provider_user_id !== principal.providerUserId) {
    return { ok: false, code: "STAFF_ALREADY_LINKED" };
  }

  const now = new Date().toISOString();
  if (existing) {
    const update = await db
      .prepare(
        `UPDATE booking_staff_links
            SET active = 1, created_by_user_id = ?, updated_at = ?
          WHERE provider_user_id = ? AND staff_user_id = ?`,
      )
      .bind(principal.actorUserId, now, principal.providerUserId, staff.id)
      .run();
    if ((update.meta?.changes ?? 0) === 1) {
      return { ok: true, staffUserId: staff.id };
    }
    // A linha pode ter sido removida depois do SELECT; nesse caso seguimos para
    // o INSERT protegido pela constraint/checagem de vencedor abaixo.
  }

  try {
    await db
      .prepare(
        `INSERT INTO booking_staff_links
          (provider_user_id, staff_user_id, active, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, 1, ?, ?, ?)`,
      )
      .bind(principal.providerUserId, staff.id, principal.actorUserId, now, now)
      .run();
  } catch (cause) {
    const winner = await getExistingStaffOwner(db, staff.id);
    if (winner && winner.provider_user_id !== principal.providerUserId) {
      return { ok: false, code: "STAFF_ALREADY_LINKED" };
    }
    throw cause;
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
        (id, provider_user_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      `ops-audit-${crypto.randomUUID()}`,
      principal.providerUserId,
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
  limit = 40,
) {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  const result = await db
    .prepare(
      `SELECT a.id, a.actor_user_id, u.name AS actor_name, a.action,
              a.target_type, a.target_id, a.metadata_json, a.created_at
         FROM operations_audit_log a
         LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.provider_user_id = ?
        ORDER BY a.created_at DESC
        LIMIT ?`,
    )
    .bind(providerUserId, safeLimit)
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

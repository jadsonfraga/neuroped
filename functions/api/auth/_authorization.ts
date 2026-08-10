import type { PublicUser } from "./_shared";

export type ClinicalRole = "admin" | "professional" | "reader" | "operator";

export interface AuthContextData {
  authUser?: PublicUser;
}

export interface PatientAccess {
  exists: boolean;
  allowed: boolean;
  ownerUserId: string | null;
}

const KNOWN_ROLES = new Set<ClinicalRole>([
  "admin",
  "professional",
  "reader",
  "operator",
]);

export function getContextUser(context: { data?: unknown }): PublicUser | null {
  const data = context.data as AuthContextData | undefined;
  const user = data?.authUser;
  if (!user || !user.id || !KNOWN_ROLES.has(user.role as ClinicalRole)) return null;
  return user;
}

export function isAdmin(user: PublicUser): boolean {
  return user.role === "admin";
}

export function canWriteClinicalData(user: PublicUser): boolean {
  return user.role === "admin" || user.role === "professional";
}

/** Agenda é domínio operacional: recepção pode operar sem ganhar escrita clínica. */
export function canAccessOperationalAgenda(user: PublicUser): boolean {
  return user.role === "admin" || user.role === "professional" || user.role === "operator";
}

export function canWriteOperationalAgenda(user: PublicUser): boolean {
  return canAccessOperationalAgenda(user);
}

export function canAccessOperationalAgendaAudit(user: PublicUser): boolean {
  return user.role === "admin" || user.role === "professional";
}

export function canReadAuditLog(user: PublicUser): boolean {
  return user.role === "admin";
}

export function canAccessOwnedPatient(
  user: PublicUser,
  ownerUserId: string | null | undefined,
): boolean {
  if (isAdmin(user)) return true;
  return typeof ownerUserId === "string" && ownerUserId === user.id;
}

/**
 * Consulta central de ownership para todas as tabelas clínicas relacionadas.
 * Registros legados sem owner permanecem acessíveis somente ao administrador.
 */
export async function getPatientAccess(
  db: D1Database,
  patientId: string,
  user: PublicUser,
): Promise<PatientAccess> {
  const row = await db
    .prepare(
      `SELECT owner_user_id
         FROM patients_demo
        WHERE id = ? AND is_demo = 1
        LIMIT 1`,
    )
    .bind(patientId)
    .first<{ owner_user_id: string | null }>();

  if (!row) return { exists: false, allowed: false, ownerUserId: null };
  const ownerUserId = row.owner_user_id ?? null;
  return {
    exists: true,
    allowed: canAccessOwnedPatient(user, ownerUserId),
    ownerUserId,
  };
}

export function authorizationError(
  message: string,
  code: string,
  status: number,
): Response {
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

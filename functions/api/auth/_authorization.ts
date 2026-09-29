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
 * Predicado de owner a repetir no SQL FINAL de toda leitura/mutação clínica
 * legada (AGENTS.md, regras de tenant): autorizar com getPatientAccess e
 * depois ler/escrever só por id deixa uma janela em que o paciente muda de
 * dono. Admin global segue sem filtro, como no restante das rotas legadas.
 * - `patientClause`: para `patients_demo` (após `WHERE id = ?`).
 * - `childClause`: para tabelas filhas por `patient_id`.
 * - `existsClause`: para `INSERT ... SELECT ... WHERE <existsClause>`; seus
 *   binds são `[patientId, ...binds]`.
 */
export function patientOwnerPredicate(user: PublicUser): {
  patientClause: string;
  childClause: string;
  existsClause: string;
  binds: string[];
} {
  if (isAdmin(user)) {
    return {
      patientClause: "",
      childClause: "",
      existsClause: "EXISTS (SELECT 1 FROM patients_demo WHERE id = ? AND is_demo = 1)",
      binds: [],
    };
  }
  return {
    patientClause: "AND owner_user_id = ?",
    childClause:
      "AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ? AND is_demo = 1)",
    existsClause:
      "EXISTS (SELECT 1 FROM patients_demo WHERE id = ? AND is_demo = 1 AND owner_user_id = ?)",
    binds: [user.id],
  };
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

export interface AuthzUser {
  id: string;
  role: string;
}

export interface PatientOwnershipRecord {
  ownerUserId?: string | null;
}

export interface ScaleResultOwnershipRecord {
  patientId?: string | null;
  appliedByUserId?: string | null;
}

export type PatientReferenceDecision = "allowed" | "not_found" | "forbidden";

export function isAdmin(user: AuthzUser): boolean {
  return user.role === "admin";
}

export function canAccessPatient(user: AuthzUser, patient: PatientOwnershipRecord | null | undefined): boolean {
  if (!patient) return false;
  if (isAdmin(user)) return true;
  return patient.ownerUserId === user.id;
}

/** Decisão uniforme para qualquer rota que associe um recurso a um paciente. */
export function patientReferenceDecision(
  user: AuthzUser,
  patient: PatientOwnershipRecord | null | undefined,
): PatientReferenceDecision {
  if (!patient) return "not_found";
  return canAccessPatient(user, patient) ? "allowed" : "forbidden";
}

export function canAccessScaleResult(
  user: AuthzUser,
  result: ScaleResultOwnershipRecord | null | undefined,
  patient?: PatientOwnershipRecord | null,
): boolean {
  if (!result) return false;
  if (isAdmin(user)) return true;
  // Resultado vinculado herda SEMPRE o owner do paciente. `appliedByUserId`
  // não pode transformar uma gravação cross-tenant antiga em permissão de leitura.
  if (result.patientId || patient) return canAccessPatient(user, patient);
  return result.appliedByUserId === user.id;
}

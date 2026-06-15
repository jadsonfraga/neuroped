export interface AuthzUser {
  id: string;
  role: string;
}

export interface PatientOwnershipRecord {
  ownerUserId?: string | null;
}

export interface ScaleResultOwnershipRecord {
  appliedByUserId?: string | null;
}

export function isAdmin(user: AuthzUser): boolean {
  return user.role === "admin";
}

export function canAccessPatient(user: AuthzUser, patient: PatientOwnershipRecord | null | undefined): boolean {
  if (!patient) return false;
  if (isAdmin(user)) return true;
  return patient.ownerUserId === user.id;
}

export function canAccessScaleResult(
  user: AuthzUser,
  result: ScaleResultOwnershipRecord | null | undefined,
  patient?: PatientOwnershipRecord | null,
): boolean {
  if (!result) return false;
  if (isAdmin(user)) return true;
  if (result.appliedByUserId === user.id) return true;
  return Boolean(patient && patient.ownerUserId === user.id);
}

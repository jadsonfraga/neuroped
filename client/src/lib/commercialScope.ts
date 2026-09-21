/** Contexto ausente nunca equivale a uma instalação individual. */
export interface CommercialScopeInput {
  accessMode: "checking" | "remote" | "local";
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  clinicId: string | null;
  isClinicLoading: boolean;
  clinicError: string | null;
}

export type CommercialScope =
  | { kind: "individual" }
  | { kind: "loading" }
  | { kind: "unavailable"; error: string; code: string }
  | { kind: "institutional"; clinicId: string; key: string };

export function resolveCommercialScope(input: CommercialScopeInput): CommercialScope {
  if (input.accessMode === "checking" || input.isAuthLoading) return { kind: "loading" };
  if (input.accessMode === "local") return { kind: "individual" };
  if (!input.isAuthenticated || !input.userId) {
    return { kind: "unavailable", error: "Autentique-se para confirmar a licença institucional.", code: "UNAUTHENTICATED" };
  }
  if (input.isClinicLoading) return { kind: "loading" };
  if (input.clinicError) {
    return { kind: "unavailable", error: input.clinicError, code: "COMMERCIAL_CLINIC_UNAVAILABLE" };
  }
  if (!input.clinicId) {
    return { kind: "unavailable", error: "Selecione uma unidade institucional para confirmar a licença.", code: "COMMERCIAL_CLINIC_REQUIRED" };
  }
  return { kind: "institutional", clinicId: input.clinicId, key: JSON.stringify([input.userId, input.clinicId]) };
}

export interface CommercialConfirmation<T> {
  key: string;
  snapshot: T;
  status: "confirmed" | "denied";
  denialCode: string | null;
}

/** Uma resposta anterior não autoriza outro usuário, tenant, material ou snapshot. */
export function commercialConfirmationState<T>(
  result: CommercialConfirmation<T> | null,
  key: string,
  snapshot: T | null,
): "pending" | "confirmed" | "denied" {
  return snapshot !== null && result?.key === key && result.snapshot === snapshot
    ? result.status
    : "pending";
}

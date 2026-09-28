/** UI dependency only. Authentication, membership and billing stay server-side. */
export const CLINIC_CONTEXT_ROUTES = [
  "/agenda", "/conecta", "/pacientes", "/paciente", "/prontuario",
] as const;

export function requiresClinicContext(path: string): boolean {
  const normalized = path.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return CLINIC_CONTEXT_ROUTES.some((route) => normalized === route || normalized.startsWith(`${route}/`));
}

import { roleHasPermission } from "../../../shared/permissions";
import type { PublicUser } from "../auth/_shared";
import { boundedText, isPlainObject } from "../_request";
import { getClinicMembership, membershipCanManage, tenantError } from "./_core";

/**
 * Only these existing management endpoints replace the legacy global write
 * role with a persisted tenant permission. Unknown routes and clinical data
 * retain their existing guards. Each handler repeats its own authorization.
 * Header values never authorize a different target in path/body/query.
 */
export async function tenantManagementAuthorization(
  db: D1Database,
  request: Request,
  user: PublicUser,
): Promise<{ handled: false } | { handled: true; failure: Response | null }> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "");
  const method = request.method.toUpperCase();
  const route = /^\/api\/tenants\/([^/]+)(?:\/(members|lifecycle|features))?$/.exec(path);
  const tenantRoute = route && (
    (!route[2] && method === "PATCH") ||
    (route[2] === "members" && ["POST", "DELETE"].includes(method)) ||
    (route[2] === "lifecycle" && method === "POST") ||
    (route[2] === "features" && method === "PATCH")
  );
  const invitationRoute = path === "/api/billing/invitations" && ["POST", "DELETE"].includes(method);
  const checkoutRoute = path === "/api/billing/checkout" && method === "POST";
  if (!tenantRoute && !invitationRoute && !checkoutRoute) return { handled: false };

  const forbidden = () => ({
    handled: true as const,
    failure: tenantError("Gestão não autorizada para esta clínica.", "TENANT_FORBIDDEN", 403),
  });
  let clinicId: string;
  try {
    if (tenantRoute) clinicId = boundedText(decodeURIComponent(route[1]), 80);
    else if (method === "DELETE") clinicId = boundedText(url.searchParams.get("clinicId"), 80);
    else {
      const body: unknown = await request.clone().json();
      clinicId = isPlainObject(body) ? boundedText(body.clinicId, 80) : "";
    }
  } catch {
    return { handled: true, failure: tenantError("Requisição de clínica inválida.", "VALIDATION_ERROR", 400) };
  }
  if (!clinicId) return { handled: true, failure: tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400) };
  try {
    const membership = await getClinicMembership(db, clinicId, user);
    if (!membership) return forbidden();
    // Lifecycle must remain reachable by the owner while suspended, so the
    // canonical handler can validate retention/cancellation and reopening.
    const allowed = route?.[2] === "lifecycle"
      ? roleHasPermission(membership.role, "organization.lifecycle.manage")
      : membershipCanManage(membership);
    return allowed ? { handled: true, failure: null } : forbidden();
  } catch {
    return { handled: true, failure: tenantError("Autorização da clínica temporariamente indisponível.", "TENANT_AUTH_UNAVAILABLE", 503) };
  }
}

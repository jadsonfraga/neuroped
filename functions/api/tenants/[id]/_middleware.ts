import { getContextUser } from "../../auth/_authorization";
import { requireBillingEntitlement } from "../../billing/_guard";

interface Env {
  DB?: D1Database;
}

function clinicIdFrom(params: Record<string, string | string[]>): string {
  const raw = params.id;
  return String(Array.isArray(raw) ? raw[0] : (raw ?? "")).trim().slice(0, 80);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const path = new URL(context.request.url).pathname.replace(/\/+$/, "");
  if (!path.endsWith("/members") || !context.env.DB) return context.next();

  const user = getContextUser(context);
  if (!user) return context.next();
  const clinicId = clinicIdFrom(context.params as Record<string, string | string[]>);
  if (!clinicId) return context.next();

  const denial = await requireBillingEntitlement(context.env.DB, user.id, clinicId, "admin");
  if (denial) return denial;
  return context.next();
};

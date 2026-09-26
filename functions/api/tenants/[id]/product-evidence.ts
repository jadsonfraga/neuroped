import { getContextUser } from "../../auth/_authorization";
import { onRequestGet as readHealth } from "../../health";
import { tenantError, tenantJson, writeSaasAudit } from "../../tenant/_core";
import { PRODUCT_EVIDENCE_SQL } from "../../tenant/_productEvidence";
import { rolesWithPermission } from "../../../../shared/permissions";
import { buildProductEvidence } from "../../../../shared/product-evidence";

const permittedRoles = JSON.stringify(rolesWithPermission("organization.metrics.read"));

export const onRequestGet: typeof readHealth = async (context) => {
  const user = getContextUser(context);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const clinicId = context.params.id;
  if (typeof clinicId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(clinicId)) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
  if (new URL(context.request.url).search) return tenantError("Filtros não suportados.", "INVALID_QUERY", 400);
  const db = context.env.DB;
  if (!db) return tenantError("Evidências indisponíveis.", "EVIDENCE_UNAVAILABLE", 503);
  try {
    const row = await db.prepare(PRODUCT_EVIDENCE_SQL).bind(clinicId, user.id, permittedRoles).first<Record<string, unknown>>();
    if (!row) return tenantError("Recurso indisponível.", "NOT_FOUND", 404);
    let health: unknown = null;
    try {
      const response = await readHealth(context);
      health = { httpStatus: response.status, body: await response.json() };
    } catch { /* Failure remains unknown health, not fake success or fake zero. */ }
    const result = buildProductEvidence(row, clinicId, health);
    const inheritedId = context.data.requestId;
    const requestId = typeof inheritedId === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(inheritedId) ? inheritedId : crypto.randomUUID();
    // Metadata-only, fail-closed audit for this administrative evidence read.
    await writeSaasAudit(db, { clinicId, actorUserId: user.id, action: "product_evidence.read",
      targetType: "product_evidence", metadata: { requestId, method: "GET", result: "success" } });
    const response = tenantJson(result);
    response.headers.set("X-Request-ID", requestId);
    return response;
  } catch {
    return tenantError("Evidências indisponíveis. Nenhum valor foi estimado.", "EVIDENCE_UNAVAILABLE", 503);
  }
};

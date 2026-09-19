import { getContextUser } from "../../auth/_authorization";
import { getClinicMembership, tenantError, tenantJson } from "../../tenant/_core";
import {
  evaluateCommercialAccess,
  getCommercialLicenseSnapshot,
  isCommercialUserAuthorized,
} from "../_core";
import { COMMERCIAL_MATERIALS, commercialFeatureCodes } from "../../../../shared/commercial";

interface CommercialMaterialsEnv {
  DB?: D1Database;
}

/**
 * GET /api/commercial/materials?clinicId=...
 *
 * Catálogo tenant-scoped do que esta unidade e este usuário podem abrir agora.
 * `licensed` é sempre calculado pelo servidor; a UI não deriva permissão de
 * papel, preço ou estado local. Sem licença, todos os materiais vêm `false` —
 * a lista nunca deixa de existir, para que a tela possa explicar o motivo.
 */
export const onRequestGet: PagesFunction<CommercialMaterialsEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const clinicId = (new URL(context.request.url).searchParams.get("clinicId") ?? "")
    .trim()
    .slice(0, 80);
  if (!clinicId) {
    return tenantError("clinicId é obrigatório.", "COMMERCIAL_CLINIC_REQUIRED", 400);
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership) {
    return tenantError("Clínica indisponível para este usuário.", "TENANT_FORBIDDEN", 403);
  }
  if (membership.clinicStatus === "closed") {
    return tenantError("A clínica está encerrada.", "TENANT_CLOSED", 410);
  }
  if (membership.clinicStatus !== "active") {
    return tenantError(
      "A clínica está suspensa; materiais comerciais não ficam disponíveis neste estado.",
      "TENANT_EXPORT_ONLY",
      423,
    );
  }

  const snapshot = await getCommercialLicenseSnapshot(db, clinicId);
  const authorized = snapshot
    ? await isCommercialUserAuthorized(db, snapshot.licenseId, user.id)
    : false;

  const materials = commercialFeatureCodes.map((code) => {
    const material = COMMERCIAL_MATERIALS[code];
    const access = evaluateCommercialAccess(snapshot, code, authorized);
    return {
      code: material.code,
      title: material.title,
      summary: material.summary,
      routes: [...material.routes],
      surface: material.surface,
      deliveryChannel: material.deliveryChannel,
      licensed: access.ok,
      deniedReason: access.ok ? null : access.reason,
    };
  });

  return tenantJson({
    clinic: { id: membership.clinicId, name: membership.clinicName, role: membership.role },
    licenseStatus: snapshot?.status ?? null,
    currentUserAuthorized: authorized,
    materials,
  });
};

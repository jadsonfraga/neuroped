import { getContextUser } from "../auth/_authorization";
import { getClinicMembership, tenantError, tenantJson } from "../tenant/_core";
import { evaluateCommercialAccess, getCommercialLicenseSnapshot } from "./_core";
import { commercialFeatureCodes } from "../../../shared/commercial";

interface CommercialEnv {
  DB?: D1Database;
}

/**
 * GET /api/commercial/me?clinicId=...
 *
 * Snapshot estritamente tenant-scoped. Não retorna PHI, dados de paciente nem
 * detalhes de cobrança do PSP. Serve para UI decidir quais materiais da licença
 * institucional devem aparecer, mantendo a decisão autoritativa no backend.
 */
export const onRequestGet: PagesFunction<CommercialEnv> = async (context) => {
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

  const snapshot = await getCommercialLicenseSnapshot(db, clinicId);
  const capabilities = Object.fromEntries(
    commercialFeatureCodes.map((feature) => [
      feature,
      evaluateCommercialAccess(snapshot, feature).ok,
    ]),
  );

  return tenantJson({
    clinic: {
      id: membership.clinicId,
      name: membership.clinicName,
      role: membership.role,
      status: membership.clinicStatus,
    },
    license: snapshot
      ? {
          id: snapshot.licenseId,
          offerCode: snapshot.offerCode,
          offerName: snapshot.offerName,
          status: snapshot.status,
          unitLabel: snapshot.unitLabel,
          activatedAt: snapshot.activatedAt,
          expiresAt: snapshot.expiresAt,
          authorizedUsers: snapshot.authorizedUsers,
          maxAuthorizedUsers: snapshot.maxAuthorizedUsers,
          supportMinutes: snapshot.supportMinutes,
          supportMinutesUsed: snapshot.supportMinutesUsed,
        }
      : null,
    capabilities,
    boundary: {
      patientDataAccepted: false,
      medicalServiceIncluded: false,
      clinicalDecisionSupportIncluded: false,
      pantIncluded: false,
      neuroBoardIncluded: false,
    },
  });
};

import type { PublicUser } from "../auth/_shared";
import { getContextUser } from "../auth/_authorization";
import { getClinicMembership, tenantError, type ClinicMembership } from "../tenant/_core";
import {
  evaluateCommercialUserAccess,
  getCommercialLicenseSnapshot,
  type CommercialAccessDeniedReason,
  type CommercialLicenseSnapshot,
} from "./_core";
import { getCommercialMaterial, type CommercialMaterial } from "../../../shared/commercial";

export interface CommercialGuardEnv {
  DB?: D1Database;
}

export interface CommercialGuardContext {
  db: D1Database;
  user: PublicUser;
  membership: ClinicMembership;
  snapshot: CommercialLicenseSnapshot;
  material: CommercialMaterial;
}

export type CommercialGuardResult =
  | { ok: true; context: CommercialGuardContext }
  | { ok: false; response: Response };

/**
 * Cada motivo de recusa devolve o mesmo status para qualquer clínica, de modo
 * que a resposta não diferencie "sua licença não cobre isto" de "esta clínica
 * não é sua". Drift contratual é a única exceção: 409, porque é inconsistência
 * entre o banco e o contrato canônico, não decisão de acesso.
 */
const DENIAL_STATUS: Record<CommercialAccessDeniedReason, number> = {
  COMMERCIAL_LICENSE_MISSING: 403,
  COMMERCIAL_LICENSE_INACTIVE: 403,
  COMMERCIAL_USER_NOT_AUTHORIZED: 403,
  COMMERCIAL_OFFER_UNKNOWN: 409,
  COMMERCIAL_FEATURE_NOT_LICENSED: 403,
};

const DENIAL_MESSAGE: Record<CommercialAccessDeniedReason, string> = {
  COMMERCIAL_LICENSE_MISSING: "Esta unidade não possui licença comercial para materiais.",
  COMMERCIAL_LICENSE_INACTIVE: "A licença comercial não está ativa ou está fora da vigência.",
  COMMERCIAL_USER_NOT_AUTHORIZED: "Este usuário não está autorizado na licença da unidade.",
  COMMERCIAL_OFFER_UNKNOWN: "A licença aponta para um contrato que não corresponde ao catálogo canônico.",
  COMMERCIAL_FEATURE_NOT_LICENSED: "Este material não faz parte da licença da unidade.",
};

export function readClinicId(request: Request): string {
  return (new URL(request.url).searchParams.get("clinicId") ?? "").trim().slice(0, 80);
}

/**
 * Autorização cumulativa e fail-closed para um material licenciado: identidade
 * autenticada, membership ativa persistida, tenant ativo, licença usável na
 * data de hoje, usuário explicitamente autorizado na licença e feature presente
 * no offer. Qualquer etapa ausente recusa; nenhuma delas é inferida das demais.
 *
 * Membership no tenant nunca equivale a entitlement comercial: um profissional
 * pode ser membro da clínica e ainda assim não estar entre os autorizados.
 */
export async function requireCommercialFeature(
  context: { env: CommercialGuardEnv; request: Request; data?: Record<string, unknown> },
  feature: string,
  clinicId: string,
  now: Date = new Date(),
): Promise<CommercialGuardResult> {
  const db = context.env.DB;
  if (!db) {
    return {
      ok: false,
      response: tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503),
    };
  }

  const user = getContextUser(context);
  if (!user) {
    return { ok: false, response: tenantError("Não autenticado.", "UNAUTHENTICATED", 401) };
  }

  if (!clinicId) {
    return {
      ok: false,
      response: tenantError("clinicId é obrigatório.", "COMMERCIAL_CLINIC_REQUIRED", 400),
    };
  }

  const material = getCommercialMaterial(feature);
  if (!material) {
    return {
      ok: false,
      response: tenantError("Material desconhecido.", "COMMERCIAL_MATERIAL_UNKNOWN", 404),
    };
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership) {
    return {
      ok: false,
      response: tenantError("Clínica indisponível para este usuário.", "TENANT_FORBIDDEN", 403),
    };
  }
  if (membership.clinicStatus === "closed") {
    return { ok: false, response: tenantError("A clínica está encerrada.", "TENANT_CLOSED", 410) };
  }
  if (membership.clinicStatus !== "active") {
    return {
      ok: false,
      response: tenantError(
        "A clínica está suspensa; materiais comerciais não ficam disponíveis neste estado.",
        "TENANT_EXPORT_ONLY",
        423,
      ),
    };
  }

  const snapshot = await getCommercialLicenseSnapshot(db, clinicId);
  const access = await evaluateCommercialUserAccess(db, snapshot, user.id, feature, now);
  if (!access.ok) {
    return {
      ok: false,
      response: tenantError(DENIAL_MESSAGE[access.reason], access.reason, DENIAL_STATUS[access.reason]),
    };
  }

  // `evaluateCommercialUserAccess` só devolve ok com snapshot presente; o teste
  // abaixo existe para o compilador, não como caminho alcançável.
  if (!snapshot) {
    return {
      ok: false,
      response: tenantError(
        DENIAL_MESSAGE.COMMERCIAL_LICENSE_MISSING,
        "COMMERCIAL_LICENSE_MISSING",
        403,
      ),
    };
  }

  return { ok: true, context: { db, user, membership, snapshot, material } };
}

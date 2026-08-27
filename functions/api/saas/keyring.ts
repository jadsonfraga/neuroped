import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership,
  membershipCanManage,
  operationalCryptoReady,
  tenantError,
  tenantJson,
  type TenantEnv,
} from "../tenant/_core";
import { clinicalCryptoReady, currentClinicalEncryptionVersion } from "../tenant/_crypto";

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  const clinicId = cleanText(new URL(context.request.url).searchParams.get("clinicId"), 80);
  if (!clinicId) return tenantError("clinicId é obrigatório.", "VALIDATION_ERROR", 400);
  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) return tenantError("Acesso administrativo negado para esta clínica.", "TENANT_FORBIDDEN", 403);

  const ready = clinicalCryptoReady(context.env);
  const operationalReady = operationalCryptoReady(context.env);
  let encryptionVersion: string | null = null;
  if (ready) {
    try {
      encryptionVersion = currentClinicalEncryptionVersion(context.env);
    } catch {
      encryptionVersion = null;
    }
  }
  return tenantJson({
    clinicId,
    ready: ready && operationalReady,
    encryptionVersion,
    keyMaterialExposed: false,
    missing: [
      ...(!ready ? ["Configure CLINICAL_DATA_KEY, CLINICAL_INDEX_KEY e IDs separados."] : []),
      ...(!operationalReady ? ["Configure OPERATIONAL_DATA_KEY no secret manager."] : []),
    ],
    controls: {
      tenantDerivedAesGcm: ready,
      blindIndexSeparated: ready,
      operationalHmac: operationalReady,
      previousKeyRotationSupported: ready,
      failClosedOnMissingKey: true,
    },
  });
};

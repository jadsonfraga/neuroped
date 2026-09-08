import { getContextUser, isAdmin } from "../auth/_authorization";
import { prepareSaasAudit, tenantError, tenantJson } from "../tenant/_core";
import {
  canOrderCommercialOffer,
  getCommercialOffer,
} from "../../../shared/commercial";

interface CommercialProvisionEnv {
  DB?: D1Database;
  /** Gate explícito para provisionar o plano pós-piloto. Fechado por padrão. */
  COMMERCIAL_EXPANSION_GATE_OPEN?: string;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanAuditReason(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

/**
 * POST /api/commercial/provision
 *
 * Operação de plataforma, não de tenant: cria uma licença PENDENTE depois que
 * a oportunidade comercial foi aprovada/conciliada. Não concede acesso e não
 * aceita termos em nome da instituição. Toda ação exige justificativa humana
 * curta e auditável; não inserir PHI nesse campo.
 *
 * A versão contratual é derivada do offer canônico. O cliente pode enviar
 * `termsVersion` somente como precondição otimista; se divergir, a operação
 * falha em vez de criar uma licença contra termos inventados/desatualizados.
 */
export const onRequestPost: PagesFunction<CommercialProvisionEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (!isAdmin(user)) {
    return tenantError("Provisionamento restrito ao operador da plataforma.", "COMMERCIAL_ADMIN_REQUIRED", 403);
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const clinicId = cleanText(body.clinicId, 80);
  const offerCode = cleanText(body.offerCode, 80);
  const unitLabel = cleanText(body.unitLabel, 120);
  const requestedTermsVersion = cleanText(body.termsVersion ?? body.contractVersion, 80);
  const billingReference = cleanText(body.billingReference, 120);
  const reason = cleanAuditReason(body.reason);
  if (!clinicId || !offerCode || !unitLabel || !billingReference || reason.length < 12) {
    return tenantError(
      "clinicId, offerCode, unitLabel, billingReference e reason (mín. 12 caracteres) são obrigatórios.",
      "COMMERCIAL_PROVISION_VALIDATION_ERROR",
      400,
    );
  }

  const offer = getCommercialOffer(offerCode);
  if (!offer) return tenantError("Oferta comercial desconhecida.", "COMMERCIAL_OFFER_UNKNOWN", 400);
  if (requestedTermsVersion && requestedTermsVersion !== offer.termsVersion) {
    return tenantJson(
      {
        error: "Versão contratual informada diverge da versão canônica do SKU.",
        code: "COMMERCIAL_TERMS_VERSION_MISMATCH",
        expectedTermsVersion: offer.termsVersion,
      },
      409,
    );
  }

  const expansionGateOpen = context.env.COMMERCIAL_EXPANSION_GATE_OPEN?.trim().toLowerCase() === "true";
  const orderGate = canOrderCommercialOffer({
    offerCode,
    // Provisionar o piloto pela plataforma equivale a um convite explícito.
    invited: offer.saleMode === "invite_only",
    expansionGateOpen,
  });
  if (!orderGate.ok) {
    return tenantError(
      "Oferta ainda não está liberada para provisionamento.",
      orderGate.reason ?? "COMMERCIAL_OFFER_NOT_ORDERABLE",
      409,
    );
  }

  const clinic = await db
    .prepare(`SELECT id, status FROM clinics WHERE id = ? LIMIT 1`)
    .bind(clinicId)
    .first<{ id: string; status: string }>();
  if (!clinic) return tenantError("Clínica não encontrada.", "COMMERCIAL_CLINIC_NOT_FOUND", 404);
  if (clinic.status !== "active") {
    return tenantError("Clínica não está ativa.", "COMMERCIAL_CLINIC_INACTIVE", 409);
  }

  const existing = await db
    .prepare(
      `SELECT id FROM commercial_licenses
        WHERE clinic_id = ? AND status IN ('pending','active','suspended') LIMIT 1`,
    )
    .bind(clinicId)
    .first<{ id: string }>();
  if (existing) {
    return tenantError("A clínica já possui licença comercial viva.", "COMMERCIAL_LICENSE_EXISTS", 409);
  }

  if (offer.maxLicenses !== null) {
    // maxLicenses é teto histórico do SKU/coorte. Cancelamento/expiração não
    // deve reabrir silenciosamente uma quarta vaga do piloto. O trigger do D1
    // repete esta regra atomicamente para eliminar corrida entre admins.
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) AS total
           FROM commercial_licenses cl
           JOIN commercial_offers co ON co.id = cl.offer_id
          WHERE co.code = ?`,
      )
      .bind(offer.code)
      .first<{ total: number }>();
    if (Number(countRow?.total ?? 0) >= offer.maxLicenses) {
      return tenantError("Coorte piloto já atingiu o limite definido.", "COMMERCIAL_COHORT_FULL", 409);
    }
  }

  const offerRow = await db
    .prepare(
      `SELECT id, terms_version
         FROM commercial_offers
        WHERE code = ? AND lifecycle_status = 'active'
        LIMIT 1`,
    )
    .bind(offer.code)
    .first<{ id: string; terms_version: string | null }>();
  if (!offerRow) {
    return tenantError("Oferta não está persistida/ativa neste ambiente.", "COMMERCIAL_OFFER_NOT_PERSISTED", 503);
  }
  if (offerRow.terms_version !== offer.termsVersion) {
    return tenantError(
      "Versão contratual persistida diverge do domínio canônico.",
      "COMMERCIAL_OFFER_TERMS_DRIFT",
      503,
    );
  }

  const licenseId = crypto.randomUUID();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO commercial_licenses
            (id, clinic_id, offer_id, status, unit_label, contract_version,
             billing_reference, created_by_user_id)
           VALUES (?, ?, ?, 'pending', ?, ?, ?, ?)`,
        )
        .bind(
          licenseId,
          clinicId,
          offerRow.id,
          unitLabel,
          offer.termsVersion,
          billingReference,
          user.id,
        ),
      prepareSaasAudit(db, {
        clinicId,
        actorUserId: user.id,
        action: "commercial_license_provisioned",
        targetType: "commercial_license",
        targetId: licenseId,
        metadata: {
          offerCode: offer.code,
          termsVersion: offer.termsVersion,
          status: "pending",
          scope: "commercial_license_provision",
          reason,
        },
      }),
    ]);
  } catch (error) {
    console.error("[commercial.provision] persistence error", error);
    return tenantError("Não foi possível provisionar a licença.", "COMMERCIAL_PROVISION_FAILED", 409);
  }

  return tenantJson(
    {
      licenseId,
      clinicId,
      offerCode: offer.code,
      termsVersion: offer.termsVersion,
      status: "pending",
      next: "institution_acceptance",
    },
    201,
  );
};

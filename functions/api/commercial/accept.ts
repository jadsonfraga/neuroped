import { getContextUser } from "../auth/_authorization";
import {
  getClinicMembership,
  membershipCanManage,
  prepareSaasAudit,
  tenantError,
  tenantJson,
} from "../tenant/_core";
import { validateCommercialActivation } from "../../../shared/commercial";

interface CommercialAcceptEnv {
  DB?: D1Database;
}

interface PendingLicenseRow {
  id: string;
  clinic_id: string;
  status: string;
  contract_version: string;
  billing_reference: string | null;
  offer_code: string;
  term_days: number;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanUserIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const ids = value.map((item) => cleanText(item, 80)).filter(Boolean);
  if (ids.length !== value.length) return null;
  return [...new Set(ids)];
}

/**
 * POST /api/commercial/accept
 *
 * A própria gestão do tenant aceita a fronteira contratual e escolhe os
 * usuários autorizados. Só então a licença muda de pending -> active.
 */
export const onRequestPost: PagesFunction<CommercialAcceptEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Camada comercial indisponível.", "COMMERCIAL_DB_UNAVAILABLE", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

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
  const licenseId = cleanText(body.licenseId, 80);
  const termsVersion = cleanText(body.termsVersion, 80);
  const authorizedUserIds = cleanUserIds(body.authorizedUserIds);
  if (!clinicId || !licenseId || !termsVersion || !authorizedUserIds?.length) {
    return tenantError(
      "clinicId, licenseId, termsVersion e authorizedUserIds são obrigatórios.",
      "COMMERCIAL_ACCEPT_VALIDATION_ERROR",
      400,
    );
  }

  const membership = await getClinicMembership(db, clinicId, user);
  if (!membership || !membershipCanManage(membership)) {
    return tenantError("Somente a gestão da unidade pode aceitar a licença.", "COMMERCIAL_MANAGER_REQUIRED", 403);
  }

  const license = await db
    .prepare(
      `SELECT cl.id, cl.clinic_id, cl.status, cl.contract_version, cl.billing_reference,
              co.code AS offer_code, co.term_days
         FROM commercial_licenses cl
         JOIN commercial_offers co ON co.id = cl.offer_id
        WHERE cl.id = ? AND cl.clinic_id = ?
        LIMIT 1`,
    )
    .bind(licenseId, clinicId)
    .first<PendingLicenseRow>();
  if (!license) return tenantError("Licença não encontrada.", "COMMERCIAL_LICENSE_NOT_FOUND", 404);
  if (license.status !== "pending") {
    return tenantError("Licença não está pendente de aceite.", "COMMERCIAL_LICENSE_NOT_PENDING", 409);
  }
  if (!license.billing_reference) {
    return tenantError("Conciliação comercial ausente.", "COMMERCIAL_BILLING_REFERENCE_REQUIRED", 409);
  }
  if (license.contract_version !== termsVersion) {
    return tenantError("Versão dos termos diverge da licença.", "COMMERCIAL_TERMS_VERSION_MISMATCH", 409);
  }

  const activation = validateCommercialActivation({
    offerCode: license.offer_code,
    invited: true,
    // Uma licença pending só existe após provisionamento ter passado pelo gate.
    expansionGateOpen: true,
    units: 1,
    authorizedUsers: authorizedUserIds.length,
    acceptsNoPatientData: body.acceptsNoPatientData === true,
    acceptsNoMedicalService: body.acceptsNoMedicalService === true,
    acceptsNoRedistribution: body.acceptsNoRedistribution === true,
  });
  if (!activation.ok) {
    return tenantJson(
      {
        error: "Fronteiras contratuais/limites não aceitos.",
        code: "COMMERCIAL_ACTIVATION_REJECTED",
        reasons: activation.errors,
      },
      409,
    );
  }

  if (!authorizedUserIds.includes(user.id)) {
    return tenantError(
      "O gestor que aceita a licença deve permanecer entre os usuários autorizados.",
      "COMMERCIAL_ACCEPTOR_MUST_BE_AUTHORIZED",
      409,
    );
  }

  const activeMemberships = await db
    .prepare(`SELECT user_id FROM clinic_memberships WHERE clinic_id = ? AND active = 1`)
    .bind(clinicId)
    .all<{ user_id: string }>();
  const memberSet = new Set((activeMemberships.results ?? []).map((row) => row.user_id));
  if (authorizedUserIds.some((id) => !memberSet.has(id))) {
    return tenantError(
      "Todos os usuários autorizados precisam ser membros ativos da unidade.",
      "COMMERCIAL_AUTHORIZED_USER_NOT_MEMBER",
      409,
    );
  }

  const expiryModifier = `+${Number(license.term_days)} days`;
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `UPDATE commercial_licenses
            SET status = 'active',
                activated_at = datetime('now'),
                expires_at = datetime('now', ?),
                updated_at = datetime('now')
          WHERE id = ? AND clinic_id = ? AND status = 'pending'`,
      )
      .bind(expiryModifier, licenseId, clinicId),
    db
      .prepare(
        `INSERT INTO commercial_license_acceptances
          (license_id, accepted_by_user_id, terms_version,
           no_patient_data_accepted, no_medical_service_accepted, no_redistribution_accepted)
         VALUES (?, ?, ?, 1, 1, 1)`,
      )
      .bind(licenseId, user.id, termsVersion),
  ];

  for (const authorizedUserId of authorizedUserIds) {
    statements.push(
      db
        .prepare(
          `INSERT INTO commercial_license_users
            (license_id, user_id, status, authorized_by_user_id)
           VALUES (?, ?, 'active', ?)`,
        )
        .bind(licenseId, authorizedUserId, user.id),
    );
  }

  statements.push(
    prepareSaasAudit(db, {
      clinicId,
      actorUserId: user.id,
      action: "commercial_license_activated",
      targetType: "commercial_license",
      targetId: licenseId,
      metadata: {
        offerCode: license.offer_code,
        authorizedUsers: authorizedUserIds.length,
        contractVersion: termsVersion,
      },
    }),
  );

  try {
    await db.batch(statements);
  } catch (error) {
    console.error("[commercial.accept] activation error", error);
    return tenantError("Não foi possível ativar a licença.", "COMMERCIAL_ACTIVATION_FAILED", 409);
  }

  return tenantJson({
    licenseId,
    clinicId,
    offerCode: license.offer_code,
    status: "active",
    authorizedUsers: authorizedUserIds.length,
  });
};

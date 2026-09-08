import {
  commercialLicenseIsUsable,
  commercialUsageKinds,
  getCommercialOffer,
  offerHasCommercialFeature,
  validateCommercialUsageMetadata,
  type CommercialFeatureCode,
  type CommercialLicenseStatus,
  type CommercialUsageKind,
} from "../../../shared/commercial";
import { prepareSaasAudit } from "../tenant/_core";

export interface CommercialLicenseSnapshot {
  licenseId: string;
  clinicId: string;
  offerCode: string;
  offerName: string;
  priceCents: number;
  currency: string;
  /** Snapshots reais sempre carregam a versão; opcional só preserva fixtures legadas. */
  contractVersion?: string;
  status: CommercialLicenseStatus;
  unitLabel: string;
  activatedAt: string | null;
  expiresAt: string | null;
  maxAuthorizedUsers: number;
  authorizedUsers: number;
  onboardingMinutes: number;
  supportMinutes: number;
  supportMinutesUsed: number;
  features: CommercialFeatureCode[];
}

interface LicenseRow {
  license_id: string;
  clinic_id: string;
  offer_code: string;
  offer_name: string;
  price_cents: number;
  currency: string;
  contract_version: string;
  offer_terms_version: string | null;
  license_status: CommercialLicenseStatus;
  unit_label: string;
  activated_at: string | null;
  expires_at: string | null;
  max_authorized_users: number;
  onboarding_minutes: number;
  support_minutes: number;
}

export async function getCommercialLicenseSnapshot(
  db: D1Database,
  clinicId: string,
): Promise<CommercialLicenseSnapshot | null> {
  const row = await db
    .prepare(
      `SELECT cl.id AS license_id, cl.clinic_id, cl.status AS license_status,
              cl.unit_label, cl.contract_version, cl.activated_at, cl.expires_at,
              co.code AS offer_code, co.name AS offer_name,
              co.price_cents, co.currency, co.terms_version AS offer_terms_version,
              co.max_authorized_users, co.onboarding_minutes, co.support_minutes
         FROM commercial_licenses cl
         JOIN commercial_offers co ON co.id = cl.offer_id
        WHERE cl.clinic_id = ?
          AND cl.status IN ('pending','active','suspended')
        ORDER BY CASE cl.status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,
                 cl.updated_at DESC
        LIMIT 1`,
    )
    .bind(clinicId)
    .first<LicenseRow>();

  if (!row) return null;
  const canonicalOffer = getCommercialOffer(row.offer_code);
  if (
    !canonicalOffer ||
    row.offer_terms_version !== canonicalOffer.termsVersion ||
    row.contract_version !== canonicalOffer.termsVersion
  ) {
    // Drift contratual nunca é normalizado silenciosamente. O chamador vê a
    // licença como indisponível até o catálogo persistido ser reconciliado.
    return null;
  }

  const [usersRow, supportRow, featureRows] = await Promise.all([
    db
      .prepare(
        `SELECT COUNT(*) AS total
           FROM commercial_license_users
          WHERE license_id = ? AND status = 'active'`,
      )
      .bind(row.license_id)
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT COALESCE(SUM(minutes), 0) AS total
           FROM commercial_usage_events
          WHERE license_id = ? AND kind = 'support_minutes'`,
      )
      .bind(row.license_id)
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT cof.feature_code
           FROM commercial_offer_features cof
           JOIN commercial_offers co ON co.id = cof.offer_id
          WHERE co.code = ? AND cof.enabled = 1
          ORDER BY cof.feature_code`,
      )
      .bind(row.offer_code)
      .all<{ feature_code: CommercialFeatureCode }>(),
  ]);

  return {
    licenseId: row.license_id,
    clinicId: row.clinic_id,
    offerCode: row.offer_code,
    offerName: row.offer_name,
    priceCents: Number(row.price_cents),
    currency: row.currency,
    contractVersion: row.contract_version,
    status: row.license_status,
    unitLabel: row.unit_label,
    activatedAt: row.activated_at,
    expiresAt: row.expires_at,
    maxAuthorizedUsers: Number(row.max_authorized_users),
    authorizedUsers: Number(usersRow?.total ?? 0),
    onboardingMinutes: Number(row.onboarding_minutes),
    supportMinutes: Number(row.support_minutes),
    supportMinutesUsed: Number(supportRow?.total ?? 0),
    features: (featureRows.results ?? []).map((item) => item.feature_code),
  };
}

export async function isCommercialUserAuthorized(
  db: D1Database,
  licenseId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS allowed
         FROM commercial_license_users clu
         JOIN commercial_licenses cl ON cl.id = clu.license_id
         JOIN clinic_memberships cm
           ON cm.clinic_id = cl.clinic_id
          AND cm.user_id = clu.user_id
          AND cm.active = 1
        WHERE clu.license_id = ?
          AND clu.user_id = ?
          AND clu.status = 'active'
        LIMIT 1`,
    )
    .bind(licenseId, userId)
    .first<{ allowed: number }>();
  return Boolean(row?.allowed);
}

export type CommercialAccessDeniedReason =
  | "COMMERCIAL_LICENSE_MISSING"
  | "COMMERCIAL_LICENSE_INACTIVE"
  | "COMMERCIAL_USER_NOT_AUTHORIZED"
  | "COMMERCIAL_OFFER_UNKNOWN"
  | "COMMERCIAL_FEATURE_NOT_LICENSED";

export function evaluateCommercialAccess(
  snapshot: CommercialLicenseSnapshot | null,
  feature: string,
  userAuthorized: boolean,
  now: Date = new Date(),
): { ok: true } | { ok: false; reason: CommercialAccessDeniedReason } {
  if (!snapshot) return { ok: false, reason: "COMMERCIAL_LICENSE_MISSING" };
  const offer = getCommercialOffer(snapshot.offerCode);
  if (!offer || (snapshot.contractVersion && snapshot.contractVersion !== offer.termsVersion)) {
    return { ok: false, reason: "COMMERCIAL_OFFER_UNKNOWN" };
  }
  if (
    !commercialLicenseIsUsable(
      {
        status: snapshot.status,
        activatedAt: snapshot.activatedAt,
        expiresAt: snapshot.expiresAt,
      },
      now,
    )
  ) {
    return { ok: false, reason: "COMMERCIAL_LICENSE_INACTIVE" };
  }
  if (!userAuthorized) {
    return { ok: false, reason: "COMMERCIAL_USER_NOT_AUTHORIZED" };
  }
  if (
    !offerHasCommercialFeature(snapshot.offerCode, feature) ||
    !snapshot.features.includes(feature as CommercialFeatureCode)
  ) {
    return { ok: false, reason: "COMMERCIAL_FEATURE_NOT_LICENSED" };
  }
  return { ok: true };
}

export async function evaluateCommercialUserAccess(
  db: D1Database,
  snapshot: CommercialLicenseSnapshot | null,
  userId: string,
  feature: string,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; reason: CommercialAccessDeniedReason }> {
  if (!snapshot) return { ok: false, reason: "COMMERCIAL_LICENSE_MISSING" };
  const authorized = await isCommercialUserAuthorized(db, snapshot.licenseId, userId);
  return evaluateCommercialAccess(snapshot, feature, authorized, now);
}

export interface RecordCommercialUsageInput {
  clinicId: string;
  licenseId: string;
  actorUserId: string | null;
  kind: CommercialUsageKind;
  featureCode?: CommercialFeatureCode | null;
  minutes?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Persiste somente telemetria operacional de baixa cardinalidade.
 * O chamador não tem como mandar um blob clínico arbitrário: metadata usa uma
 * allow-list compartilhada e o banco limita tamanho.
 */
export async function recordCommercialUsage(
  db: D1Database,
  input: RecordCommercialUsageInput,
): Promise<void> {
  if (!commercialUsageKinds.includes(input.kind)) {
    throw new Error("COMMERCIAL_USAGE_KIND_INVALID");
  }
  if (
    input.minutes !== undefined &&
    input.minutes !== null &&
    (!Number.isInteger(input.minutes) || input.minutes < 0 || input.minutes > 1440)
  ) {
    throw new Error("COMMERCIAL_USAGE_MINUTES_INVALID");
  }
  const metadataValidation = validateCommercialUsageMetadata(input.metadata);
  if (!metadataValidation.ok) {
    throw new Error(metadataValidation.reason ?? "COMMERCIAL_METADATA_INVALID");
  }

  const id = crypto.randomUUID();
  const statements = [
    db
      .prepare(
        `INSERT INTO commercial_usage_events
          (id, clinic_id, license_id, actor_user_id, kind, feature_code, minutes, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        input.clinicId,
        input.licenseId,
        input.actorUserId,
        input.kind,
        input.featureCode ?? null,
        input.minutes ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ),
  ];

  if (input.actorUserId) {
    statements.push(
      prepareSaasAudit(db, {
        clinicId: input.clinicId,
        actorUserId: input.actorUserId,
        action: "commercial_usage_recorded",
        targetType: "commercial_license",
        targetId: input.licenseId,
        metadata: {
          kind: input.kind,
          featureCode: input.featureCode ?? null,
          minutes: input.minutes ?? null,
        },
      }),
    );
  }

  await db.batch(statements);
}

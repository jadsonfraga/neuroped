import { rolesWithPermission } from "../../../shared/permissions";
import { EMPTY_BRANDING, validateBrandingInput, type ClinicBranding } from "../../../shared/clinic-branding";

/**
 * Marca da clínica (migração 0035, versionada e NÃO aplicada em produção).
 * Diferente de `_settings.ts`, aqui NÃO há DDL em runtime: sem a migração, a
 * leitura devolve a marca vazia e a escrita responde 503 explícito.
 */
interface BrandingRow {
  primary_color: string | null;
  accent_color: string | null;
  header_text: string;
  footer_text: string;
  logo_data_uri: string | null;
  updated_at: string;
}

export function isMissingBrandingTable(error: unknown): boolean {
  return /no such table: clinic_branding/i.test(error instanceof Error ? error.message : String(error));
}

export async function getClinicBranding(db: D1Database, clinicId: string): Promise<ClinicBranding> {
  try {
    const row = await db
      .prepare(
        `SELECT primary_color, accent_color, header_text, footer_text, logo_data_uri, updated_at
           FROM clinic_branding WHERE clinic_id = ? LIMIT 1`,
      )
      .bind(clinicId)
      .first<BrandingRow>();
    if (!row) return { ...EMPTY_BRANDING };
    return {
      primaryColor: row.primary_color,
      accentColor: row.accent_color,
      headerText: row.header_text,
      footerText: row.footer_text,
      logoDataUri: row.logo_data_uri,
      configured: true,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    if (isMissingBrandingTable(error)) return { ...EMPTY_BRANDING };
    throw error;
  }
}

export { validateBrandingInput };

/**
 * Upsert condicionado, na própria query, a o usuário ser gestor ATIVO da clínica
 * (defesa em profundidade além do guard do handler).
 */
export function prepareBrandingUpsert(
  db: D1Database,
  clinicId: string,
  actorUserId: string,
  value: { primaryColor: string | null; accentColor: string | null; headerText: string; footerText: string; logoDataUri: string | null },
  logoProvided: boolean,
): D1PreparedStatement {
  const roles = rolesWithPermission("organization.manage");
  return db
    .prepare(
      `INSERT INTO clinic_branding
         (clinic_id, primary_color, accent_color, header_text, footer_text, logo_data_uri, updated_by_user_id, updated_at)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?
        WHERE EXISTS (
          SELECT 1 FROM clinic_memberships m
           WHERE m.clinic_id = ? AND m.user_id = ? AND m.active = 1
             AND m.role IN (${roles.map(() => "?").join(", ")})
        )
       ON CONFLICT(clinic_id) DO UPDATE SET
         primary_color = excluded.primary_color,
         accent_color = excluded.accent_color,
         header_text = excluded.header_text,
         footer_text = excluded.footer_text,
         logo_data_uri = CASE WHEN ? = 1 THEN excluded.logo_data_uri ELSE clinic_branding.logo_data_uri END,
         updated_by_user_id = excluded.updated_by_user_id,
         updated_at = excluded.updated_at`,
    )
    .bind(
      clinicId, value.primaryColor, value.accentColor, value.headerText, value.footerText, value.logoDataUri,
      actorUserId, new Date().toISOString(),
      clinicId, actorUserId, ...roles,
      logoProvided ? 1 : 0,
    );
}

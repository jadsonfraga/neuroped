import { getContextUser } from "../auth/_authorization";
import { normalizeClinicSlug, isValidClinicSlug } from "../../../shared/tenant";
import { isValidTimeZone } from "../../../shared/operations";
import { tenantError, tenantJson, type TenantEnv } from "../tenant/_core";

function cleanText(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const user = getContextUser(context);
  if (!context.env.DB) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  const rows = await context.env.DB
    .prepare(
      `SELECT c.id, c.slug, c.name, c.legal_name, c.timezone, c.status,
              m.role, m.created_at AS membership_created_at
         FROM clinic_memberships m
         JOIN clinics c ON c.id = m.clinic_id
        WHERE m.user_id = ? AND m.active = 1
        ORDER BY c.name COLLATE NOCASE`,
    )
    .bind(user.id)
    .all<{
      id: string;
      slug: string;
      name: string;
      legal_name: string | null;
      timezone: string;
      status: string;
      role: string;
      membership_created_at: string;
    }>();

  return tenantJson({
    data: (rows.results ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      legalName: row.legal_name,
      timezone: row.timezone,
      status: row.status,
      role: row.role,
      membershipCreatedAt: row.membership_created_at,
    })),
  });
};

export const onRequestPost: PagesFunction<TenantEnv> = async (context) => {
  const user = getContextUser(context);
  const db = context.env.DB;
  if (!db) return tenantError("Banco SaaS não configurado.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);
  if (user.role !== "admin" && user.role !== "professional") {
    return tenantError("Perfil sem permissão para criar clínica.", "FORBIDDEN", 403);
  }

  // Criar clínica é o ponto em que uma conta de cadastro aberto passa a ter
  // superfície clínica (owner de um tenant, com pacientes e prontuário). Sem
  // prova de posse do e-mail, alguém poderia registrar o endereço de um
  // terceiro e assumir essa posição em nome dele. O gate fica aqui, e não no
  // login: a conta pode existir e entrar, mas não escala privilégio.
  //
  // A consulta lê do banco em vez de confiar no JWT: a verificação pode ter
  // acontecido depois da emissão do token de sessão.
  const verification = await db
    .prepare(`SELECT email_verified_at FROM users WHERE id = ? LIMIT 1`)
    .bind(user.id)
    .first<{ email_verified_at: string | null }>();
  if (!verification?.email_verified_at) {
    return tenantError(
      "Confirme seu e-mail antes de criar uma clínica. Reenviamos o link se você solicitar.",
      "EMAIL_VERIFICATION_REQUIRED",
      403,
    );
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

  const name = cleanText(body.name, 160);
  const legalName = cleanText(body.legalName, 200) || null;
  const timezone = cleanText(body.timezone, 80) || "America/Recife";
  const requestedSlug = cleanText(body.slug, 80);
  const slug = requestedSlug ? normalizeClinicSlug(requestedSlug) : normalizeClinicSlug(name);

  if (name.length < 2) return tenantError("Nome da clínica é obrigatório.", "VALIDATION_ERROR", 400);
  if (!isValidClinicSlug(slug)) return tenantError("Slug da clínica inválido.", "VALIDATION_ERROR", 400);
  if (!isValidTimeZone(timezone)) {
    return tenantError(
      "Timezone IANA inválido: timezone deve ser um identificador IANA válido.",
      "VALIDATION_ERROR",
      400,
    );
  }

  const clinicId = crypto.randomUUID();
  const now = new Date().toISOString();
  const auditId = crypto.randomUUID();

  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO clinics
            (id, slug, name, legal_name, timezone, status, created_by_user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        )
        .bind(clinicId, slug, name, legalName, timezone, user.id, now, now),
      db
        .prepare(
          `INSERT INTO clinic_memberships
            (clinic_id, user_id, role, active, invited_by_user_id, created_at, updated_at)
           VALUES (?, ?, 'owner', 1, ?, ?, ?)`,
        )
        .bind(clinicId, user.id, user.id, now, now),
      db
        .prepare(
          `INSERT INTO saas_audit_log
            (id, clinic_id, actor_user_id, action, target_type, target_id, metadata_json, created_at)
           VALUES (?, ?, ?, 'clinic_create', 'clinic', ?, ?, ?)`,
        )
        .bind(auditId, clinicId, user.id, clinicId, JSON.stringify({ slug }), now),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      return tenantError("Este identificador de clínica já está em uso.", "CLINIC_SLUG_CONFLICT", 409);
    }
    console.error("[tenants.POST] DB error", error);
    return tenantError("Não foi possível criar a clínica.", "DB_ERROR", 500);
  }

  return tenantJson(
    {
      id: clinicId,
      slug,
      name,
      legalName,
      timezone,
      status: "active",
      role: "owner",
    },
    201,
  );
};

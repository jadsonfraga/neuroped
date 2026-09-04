import { getContextUser } from "../auth/_authorization";
import { isPlainObject } from "../_request";
import { tenantError, tenantJson, type TenantEnv } from "../tenant/_core";
import {
  ensureSelfServiceSchema,
  getUserProfile,
  parseUserProfileInput,
  upsertUserProfile,
} from "../tenant/_settings";

/**
 * GET/PUT /api/me/profile — identidade profissional do próprio usuário para
 * emissão de documentos (nome como assina, linha de registro/credenciais,
 * especialidade, e-mail de contato em documentos).
 *
 * É dado da conta, não dado clínico: qualquer papel autenticado pode manter o
 * próprio perfil. Documentos emitidos sem perfil configurado saem com o nome
 * de login e um aviso — identidade profissional nunca é inventada.
 */
export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  await ensureSelfServiceSchema(db);
  const profile = await getUserProfile(db, user.id);
  return tenantJson({
    ...profile,
    fallbackDisplayName: user.name,
    accountEmail: user.email,
  });
};

export const onRequestPut: PagesFunction<TenantEnv> = async (context) => {
  const db = context.env.DB;
  const user = getContextUser(context);
  if (!db) return tenantError("Banco indisponível.", "SAAS_DB_NOT_CONFIGURED", 503);
  if (!user) return tenantError("Não autenticado.", "UNAUTHENTICATED", 401);

  let body: Record<string, unknown>;
  try {
    const parsed = await context.request.json();
    if (!isPlainObject(parsed)) return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
    body = parsed;
  } catch {
    return tenantError("Corpo JSON inválido.", "INVALID_JSON", 400);
  }

  const input = parseUserProfileInput(body);
  if (!input.displayName || input.displayName.length < 2) {
    return tenantError("Informe o nome como deve constar nos documentos.", "VALIDATION_ERROR", 400);
  }

  await ensureSelfServiceSchema(db);
  await upsertUserProfile(db, user.id, input);
  const profile = await getUserProfile(db, user.id);
  return tenantJson({
    ...profile,
    fallbackDisplayName: user.name,
    accountEmail: user.email,
  });
};

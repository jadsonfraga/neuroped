/**
 * POST /api/auth/logout — encerra a sessão.
 *
 * Revoga no D1 toda a família da sessão do refresh informado. A resposta segue
 * idempotente para tokens ausentes/inválidos, evitando enumeração de sessões.
 */
import { type Env, json } from "./_shared";
import { verifyJwt } from "./_crypto";
import { revokeRefreshToken } from "./_sessions";
import { isPlainObject } from "../_request";
import { AUTH_INPUT_LIMITS } from "./_limits";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400);
  }

  if (
    Object.prototype.hasOwnProperty.call(parsed, "refreshToken") &&
    parsed.refreshToken != null &&
    typeof parsed.refreshToken !== "string"
  ) {
    return json({ error: "'refreshToken' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }

  const rawToken = typeof parsed.refreshToken === "string"
    ? parsed.refreshToken.trim()
    : "";
  if (rawToken.length > AUTH_INPUT_LIMITS.jwt) {
    return json({ error: "Refresh token excede o tamanho permitido.", code: "VALIDATION_ERROR" }, 400);
  }
  const secret = env.NEUROPED_JWT_SECRET;
  if (!rawToken) return json({ ok: true }, 200);
  if (!env.DB || (secret?.trim().length ?? 0) < 32) {
    return json({ error: "Auth indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }
  try {
    const payload = await verifyJwt(rawToken, secret);
    if (payload?.type === "refresh") {
      await revokeRefreshToken(env.DB, payload, rawToken, "logout");
    }
  } catch (error) {
    // O cliente ainda apaga suas credenciais no finally, mas o servidor não
    // afirma sucesso quando o D1 não confirmou a revogação.
    console.error("[auth/logout] falha ao revogar sessão:", error);
    return json({ error: "Auth temporariamente indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }
  return json({ ok: true }, 200);
};

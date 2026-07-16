/**
 * POST /api/auth/refresh — rotaciona um refresh token válido uma única vez.
 * Resposta: { accessToken, refreshToken }.
 */
import { type Env, json, getUserById } from "./_shared";
import { verifyJwt } from "./_crypto";
import {
  revokeRefreshToken,
  rotateRefreshSession,
} from "./_sessions";
import { isPlainObject } from "../_request";
import { AUTH_INPUT_LIMITS } from "./_limits";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || secret.trim().length < 32 || !env.DB) {
    return json({ error: "Auth indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }

  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }
  if (!isPlainObject(parsed)) {
    return json({ error: "Corpo deve ser um objeto JSON.", code: "INVALID_JSON" }, 400);
  }
  const body = parsed as { refreshToken?: unknown };

  if (
    Object.prototype.hasOwnProperty.call(body, "refreshToken") &&
    typeof body.refreshToken !== "string"
  ) {
    return json({ error: "'refreshToken' deve ser texto.", code: "VALIDATION_ERROR" }, 400);
  }

  const token = typeof body.refreshToken === "string" ? body.refreshToken.trim() : "";
  if (token.length > AUTH_INPUT_LIMITS.jwt) {
    return json({ error: "Refresh token excede o tamanho permitido.", code: "VALIDATION_ERROR" }, 400);
  }
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "refresh") {
    return json({ error: "Refresh token inválido.", code: "INVALID_REFRESH" }, 401);
  }

  try {
    const user = await getUserById(env.DB, payload.sub);
    if (!user || !user.is_active) {
      if (user) await revokeRefreshToken(env.DB, payload, token, "account_disabled");
      return json({ error: "Sessão inválida.", code: "INVALID_SESSION" }, 401);
    }
    const rotated = await rotateRefreshSession(env.DB, user, secret, payload, token);
    if (!rotated.ok) {
      const message = rotated.code === "REFRESH_REUSE_DETECTED"
        ? "Reutilização de credencial detectada; a sessão foi revogada."
        : "Refresh token inválido.";
      return json({ error: message, code: rotated.code }, 401);
    }
    return json(
      {
        accessToken: rotated.tokens.accessToken,
        refreshToken: rotated.tokens.refreshToken,
        expiresIn: rotated.tokens.expiresIn,
      },
      200,
    );
  } catch (error) {
    console.error("[auth/refresh] erro ao rotacionar sessão:", error);
    return json({ error: "Auth temporariamente indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }
};

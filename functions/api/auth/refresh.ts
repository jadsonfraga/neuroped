/**
 * POST /api/auth/refresh — troca um refresh token válido por novos tokens.
 * Resposta: { accessToken, refreshToken }.
 */
import { type Env, json, getUserById, issueTokens } from "./_shared";
import { verifyJwt } from "./_crypto";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || !env.DB) {
    return json({ error: "Auth indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }

  let body: { refreshToken?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corpo inválido.", code: "INVALID_JSON" }, 400);
  }

  const token = typeof body.refreshToken === "string" ? body.refreshToken : "";
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "refresh") {
    return json({ error: "Refresh token inválido.", code: "INVALID_REFRESH" }, 401);
  }

  const user = await getUserById(env.DB, payload.sub);
  if (!user || !user.is_active) {
    return json({ error: "Sessão inválida.", code: "INVALID_SESSION" }, 401);
  }

  const tokens = await issueTokens(user, secret);
  return json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, 200);
};

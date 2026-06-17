/**
 * GET /api/auth/me — retorna o usuário do access token (Authorization: Bearer).
 */
import { type Env, json, publicUser, getUserById } from "./_shared";
import { verifyJwt } from "./_crypto";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  const secret = env.NEUROPED_JWT_SECRET;
  if (!secret || !env.DB) {
    return json({ error: "Auth indisponível.", code: "AUTH_UNAVAILABLE" }, 503);
  }

  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const payload = token ? await verifyJwt(token, secret) : null;
  if (!payload || payload.type !== "access") {
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  }

  const user = await getUserById(env.DB, payload.sub);
  if (!user || !user.is_active) {
    return json({ error: "Sessão inválida.", code: "INVALID_SESSION" }, 401);
  }

  return json(publicUser(user), 200);
};

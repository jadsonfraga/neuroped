/**
 * POST /api/auth/logout — encerra a sessão.
 *
 * Tokens são stateless (sem store de revogação nesta v1): o client descarta os
 * tokens do sessionStorage. Responde 200 sempre, para o fluxo de logout do
 * client concluir de forma idempotente.
 */
import { type Env, json } from "./_shared";

export const onRequestPost: PagesFunction<Env> = async () => {
  return json({ ok: true }, 200);
};

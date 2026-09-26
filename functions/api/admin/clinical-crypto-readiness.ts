/**
 * GET /api/admin/clinical-crypto-readiness
 *
 * Diagnóstico operacional restrito. Responde somente um booleano e um código
 * allowlisted do keyring clínico; nunca devolve valores, fragmentos, tamanhos
 * exatos ou identificadores das chaves.
 *
 * A identidade E2E reservada pode consultar esta rota porque é uma sentinela
 * técnica sem clinic_membership e com papel global reader, revalidada pelo
 * middleware em toda requisição.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";
import {
  clinicalCryptoStatus,
} from "../tenant/_crypto";
import {
  isReservedTechnicalEmail,
  type TenantEnv,
} from "../tenant/_core";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<TenantEnv> = async (context) => {
  const user = getContextUser(context);
  if (!user) {
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  }

  const technicalSentinel =
    user.role === "reader" &&
    isReservedTechnicalEmail(context.env, user.email);

  if (!isAdmin(user) && !technicalSentinel) {
    return json({ error: "Acesso restrito.", code: "FORBIDDEN" }, 403);
  }

  const status = clinicalCryptoStatus(context.env);
  return json(
    status.configured
      ? { configured: true }
      : { configured: false, code: status.code },
    200,
  );
};

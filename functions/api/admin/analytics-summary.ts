/**
 * GET /api/admin/analytics-summary — DAU/WAU/MAU, novas contas/clínicas,
 * funil de ativação e proxy de retenção.
 *
 * Fecha a lacuna que tanto a auditoria externa de 14/09/2026 quanto a
 * releitura do código confirmaram: os primitivos (`users.last_login_at`,
 * `created_at`, `email_verified_at`, `clinics.created_at`, posse de clínica)
 * já existiam espalhados pelo schema, mas nada os agregava. Sem isto,
 * "quantas famílias/clínicas usam o produto" não tinha resposta — nem para
 * decisão de produto, nem para saber se uma mudança piorou ativação.
 *
 * INVARIANTE: só contagens saem daqui. Nenhuma linha de usuário, nenhum
 * e-mail, nenhum nome, nenhum identificador de clínica. Ver
 * `_productMetrics.ts` para a exclusão de admin/E2E e a definição exata de
 * cada número — em especial o proxy de retenção, que é aproximação
 * declarada, não medição de coorte diária real.
 *
 * RESTRITA A ADMIN: agregado cross-tenant sobre toda a base de contas.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";
import {
  computeActivationFunnel,
  computeActivityWindow,
  computeRetentionProxy,
} from "./_productMetrics";

interface Env {
  DB?: D1Database;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) {
    return json(
      { error: "Serviço indisponível.", code: "SAAS_DB_NOT_CONFIGURED" },
      503,
    );
  }

  const user = getContextUser(context);
  if (!user)
    return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  if (!isAdmin(user)) {
    return json(
      { error: "Somente administradores da plataforma.", code: "FORBIDDEN" },
      403,
    );
  }

  try {
    const [dau, wau, mau, activation30d, retention] = await Promise.all([
      computeActivityWindow(db, 1),
      computeActivityWindow(db, 7),
      computeActivityWindow(db, 30),
      computeActivationFunnel(db, 30),
      computeRetentionProxy(db),
    ]);

    return json(
      {
        ok: true,
        window: { d1: dau, d7: wau, d30: mau },
        activationFunnel30d: activation30d,
        retentionProxy: {
          ...retention,
          note: "Aproximação a partir do último login registrado, não de histórico de eventos. Coorte: contas criadas há 30–60 dias.",
        },
      },
      200,
    );
  } catch (error) {
    console.error("[admin/analytics-summary] agregação falhou", error);
    return json(
      {
        error: "Não foi possível agregar métricas de produto.",
        code: "PRODUCT_METRICS_FAILED",
      },
      500,
    );
  }
};

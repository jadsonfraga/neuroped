/**
 * DELETE /api/results/:id — remove um resultado de escala (demo).
 *
 * Servido pelo D1 (scale_results_demo). A UI (paciente-detalhe) chama este path;
 * antes caía no proxy (Railway) e retornava 404.
 */

interface Env {
  DB?: D1Database;
}

import {
  canWriteClinicalData,
  getContextUser,
  getPatientAccess,
  isAdmin,
} from "../auth/_authorization";
import { hasBoundedIdentifier } from "../_clinicalValidation";
import { json } from "../_request";

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = String(params.id ?? "").trim();

  if (!hasBoundedIdentifier(id)) {
    return json(
      { error: "id inválido ou maior que 128 caracteres.", code: "VALIDATION_ERROR" },
      400,
    );
  }
  if (!env.DB) {
    return json(
      { error: "Persistência indisponível. Nenhum resultado foi removido.", code: "DB_REQUIRED" },
      503,
    );
  }

  try {
    const user = getContextUser(context);
    if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
    if (!canWriteClinicalData(user)) {
      return json({ error: "Sem permissão para remover resultados.", code: "FORBIDDEN" }, 403);
    }

    const result = await env.DB
      .prepare(`SELECT patient_id FROM scale_results_demo WHERE id = ? AND is_demo = 1 LIMIT 1`)
      .bind(id)
      .first<{ patient_id: string }>();
    if (!result) return json({ error: "Resultado não encontrado.", code: "NOT_FOUND" }, 404);

    const access = await getPatientAccess(env.DB, result.patient_id, user);
    // Anti-enumeração (AUTHZ-P2-11/LEG-10, ciclo 4, 2026-09-26): paciente
    // inexistente e paciente de outro owner respondem exatamente igual.
    if (!access.exists || !access.allowed) {
      return json({ error: "Paciente não encontrado.", code: "NOT_FOUND" }, 404);
    }

    // LEG-09/AUTHZ-P2-12 (ciclo 4, 2026-09-26 —
    // docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md): a mutação final repete o
    // owner (via o paciente do resultado) no predicado — não basta autorizar
    // antes e apagar por `WHERE id = ?` sozinho — e verifica `changes()` em
    // vez de responder sucesso (200) mesmo quando nada foi de fato apagado.
    const ownershipClause = isAdmin(user)
      ? ""
      : "AND patient_id IN (SELECT id FROM patients_demo WHERE owner_user_id = ?)";
    const deletion = await env.DB
      .prepare(`DELETE FROM scale_results_demo WHERE id = ? AND is_demo = 1 ${ownershipClause}`)
      .bind(...(isAdmin(user) ? [id] : [id, user.id]))
      .run();
    if ((deletion.meta?.changes ?? 0) !== 1) {
      return json({ error: "Resultado não encontrado.", code: "NOT_FOUND" }, 404);
    }
    return json({ deleted: true, id }, 200);
  } catch (err) {
    console.error("[results/:id.DELETE] DB error:", err);
    return json({ error: "Erro ao remover resultado.", code: "DB_ERROR" }, 500);
  }
};

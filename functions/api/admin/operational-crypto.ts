/**
 * GET /api/admin/operational-crypto — prontidão para rotacionar a chave de PII operacional.
 * Responde somente contagens/rótulos públicos; nunca decifra PII.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";
import { operationalKeyringStatus, type OperationsEnv } from "../operations/_core";
import {
  assessPreviousKeyRetirement,
  collectOperationalEnvelopeInventory,
} from "./_operationalEnvelopes";

interface Env extends OperationsEnv {
  DB?: D1Database;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const db = context.env.DB;
  if (!db) return json({ error: "Serviço indisponível.", code: "SAAS_DB_NOT_CONFIGURED" }, 503);

  const user = getContextUser(context);
  if (!user) return json({ error: "Não autenticado.", code: "UNAUTHENTICATED" }, 401);
  if (!isAdmin(user)) {
    return json({ error: "Somente administradores da plataforma.", code: "FORBIDDEN" }, 403);
  }

  const keyring = operationalKeyringStatus(context.env);
  let inventory;
  try {
    inventory = await collectOperationalEnvelopeInventory(db);
  } catch (error) {
    console.error("[admin/operational-crypto] inventário falhou", error);
    return json({ error: "Não foi possível inventariar os envelopes.", code: "ENVELOPE_INVENTORY_FAILED" }, 500);
  }

  // A decisão de aposentadoria precisa conhecer as DUAS identidades válidas do
  // keyring. Um terceiro keyId, embora sintaticamente válido, é dado órfão e
  // deve bloquear o go/no-go.
  const retirement = assessPreviousKeyRetirement(
    inventory,
    keyring.ok ? keyring.previousId : null,
    keyring.ok ? keyring.currentId : null,
  );
  const schemaComplete = inventory.missingTables.length === 0;

  return json(
    {
      ok: true,
      keyring: keyring.ok
        ? {
            configured: true,
            currentKeyId: keyring.currentId,
            previousKeyId: keyring.previousId,
          }
        : { configured: false, code: keyring.code },
      schema: {
        complete: schemaComplete,
        missingTables: inventory.missingTables,
        columnsInspected: inventory.columns.length,
      },
      envelopes: {
        total: retirement.total,
        legacyV1: retirement.legacyV1,
        citingPreviousKey: retirement.citingPrevious,
        citingUnconfiguredKey: retirement.citingUnconfiguredKey,
        unreadable: retirement.unreadable,
        byColumn: inventory.columns.map((column) => ({
          table: column.table,
          column: column.column,
          buckets: column.buckets,
        })),
      },
      previousKeyRetirementSafe:
        keyring.ok && schemaComplete && retirement.previousKeyRetirementSafe,
    },
    200,
  );
};

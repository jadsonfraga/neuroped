/**
 * GET /api/admin/operational-crypto — prontidão para rotacionar a chave de PII
 * operacional.
 *
 * Por que existe: a #575 pediu para remover o fallback que derivava
 * `OPERATIONAL_DATA_KEY` de `NEUROPED_JWT_SECRET` "somente depois de garantir
 * leitura/migração versionada dos envelopes existentes". O fallback saiu e o
 * envelope v2 com keyring entrou — mas ninguém consegue responder a pergunta
 * que a rotação exige: **sobrou algum registro dependendo da chave antiga?**
 *
 * Registros v1 só viram v2 quando alguém os reescreve. Um agendamento antigo
 * que ninguém edita fica em v1 indefinidamente. Aposentar
 * `OPERATIONAL_DATA_KEY_PREVIOUS` com v1 remanescente transforma nome de
 * responsável em `OPERATIONAL_DECRYPT_FAILED` — e o operador só descobre pela
 * tela de agenda quebrada.
 *
 * INVARIANTE DE SEGREDO: responde apenas contagens, identificadores de chave e
 * códigos. Nunca devolve valor de segredo — nem prefixo, nem comprimento, nem
 * últimos dígitos. O `keyId` é rótulo público do envelope, não material
 * criptográfico.
 *
 * INVARIANTE DE PHI: nunca decifra e nunca lê o corpo do envelope. Só conta
 * cabeçalhos. Nenhum nome, e-mail ou telefone atravessa esta rota.
 *
 * RESTRITA A ADMIN: o estado do keyring é informação de infraestrutura e
 * atravessa todos os tenants. Exposta a um profissional viraria oráculo sobre
 * o provisionamento da instalação inteira.
 *
 * Travado por tests/unit/operational-crypto-rotation-readiness.test.ts.
 */
import { getContextUser, isAdmin } from "../auth/_authorization";
import {
  operationalKeyringStatus,
  type OperationsEnv,
} from "../operations/_core";
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

  const keyring = operationalKeyringStatus(context.env);

  let inventory;
  try {
    inventory = await collectOperationalEnvelopeInventory(db);
  } catch (error) {
    console.error("[admin/operational-crypto] inventário falhou", error);
    return json(
      {
        error: "Não foi possível inventariar os envelopes.",
        code: "ENVELOPE_INVENTORY_FAILED",
      },
      500,
    );
  }

  // O inventário não depende do keyring estar configurado — contar cabeçalhos
  // não exige chave nenhuma. Quando o keyring está quebrado, ainda assim é útil
  // (e mais urgente) saber quantos registros existem e a que chave apontam.
  const previousKeyId = keyring.ok ? keyring.previousId : null;
  const retirement = assessPreviousKeyRetirement(inventory, previousKeyId);

  // Deriva de schema não pode se disfarçar de rotação concluída.
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
        unreadable: retirement.unreadable,
        byColumn: inventory.columns.map((column) => ({
          table: column.table,
          column: column.column,
          buckets: column.buckets,
        })),
      },
      // Só verdadeiro quando o keyring está íntegro, o schema está completo e
      // nada depende da chave anterior. Qualquer incerteza responde `false`:
      // esta rota autoriza uma operação irreversível.
      previousKeyRetirementSafe:
        keyring.ok && schemaComplete && retirement.previousKeyRetirementSafe,
    },
    200,
  );
};

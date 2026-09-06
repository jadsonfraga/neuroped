/**
 * Inventário dos envelopes de PII operacional, por versão e por chave citada.
 *
 * Por que existe: o keyring v2 tornou a rotação de `OPERATIONAL_DATA_KEY`
 * POSSÍVEL, mas não EXECUTÁVEL. Registros v1 só migram para v2 quando alguém os
 * reescreve, e um registro que ninguém edita fica em v1 para sempre. Sem contar
 * quantos sobraram, o operador não tem como saber se já pode aposentar
 * `OPERATIONAL_DATA_KEY_PREVIOUS` — e descobre que não podia no dia em que a
 * agenda começa a devolver `OPERATIONAL_DECRYPT_FAILED`.
 *
 * INVARIANTE DE SEGREDO E DE PHI: este módulo NUNCA decifra. Ele lê apenas o
 * cabeçalho do envelope (`v1.` / `v2.<keyId>.`), que por construção é escrito
 * pelo próprio produto e não carrega dado de pessoa alguma. O corpo cifrado
 * nunca é selecionado, contado por conteúdo, nem devolvido.
 *
 * INVARIANTE DE INJEÇÃO: nomes de tabela e coluna não podem ser bound
 * parameters em SQL. Por isso vêm de uma allowlist congelada neste arquivo e
 * jamais da requisição. É a allowlist — não a sanitização — que torna a
 * interpolação segura.
 */
import { OPERATIONAL_KEY_ID_PATTERN } from "../operations/_core";

export interface EnvelopeColumn {
  table: string;
  column: string;
}

/**
 * As 11 colunas de PII operacional criadas pela 0007. Mantida à mão de
 * propósito: uma coluna nova de PII deve exigir uma decisão explícita aqui,
 * não entrar no inventário por descoberta automática — descoberta automática
 * falha em silêncio quando o padrão do nome muda.
 */
export const OPERATIONAL_ENVELOPE_COLUMNS: readonly EnvelopeColumn[] =
  Object.freeze([
    { table: "appointments", column: "guardian_name_encrypted" },
    { table: "appointments", column: "guardian_email_encrypted" },
    { table: "appointments", column: "guardian_phone_encrypted" },
    { table: "appointments", column: "patient_name_encrypted" },
    { table: "waitlist_entries", column: "guardian_name_encrypted" },
    { table: "waitlist_entries", column: "guardian_email_encrypted" },
    { table: "waitlist_entries", column: "guardian_phone_encrypted" },
    { table: "waitlist_entries", column: "patient_name_encrypted" },
    { table: "appointment_reviews", column: "comment_encrypted" },
    { table: "notification_outbox", column: "recipient_encrypted" },
    { table: "notification_outbox", column: "payload_encrypted" },
  ]);

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,63}$/;

export interface EnvelopeBucket {
  /** `v1`, `v2` ou `unknown` — nunca o conteúdo do envelope. */
  version: "v1" | "v2" | "unknown";
  /** Só para v2, e só quando bate no padrão do escritor. `null` caso contrário. */
  keyId: string | null;
  /** v2 cujo keyId não bate no padrão: contado, nunca ecoado. */
  malformedKeyId: boolean;
  total: number;
}

export interface ColumnInventory extends EnvelopeColumn {
  buckets: EnvelopeBucket[];
}

export interface EnvelopeInventory {
  columns: ColumnInventory[];
  /** Tabelas da allowlist ausentes do schema. Não é o mesmo que zero linhas. */
  missingTables: string[];
}

/**
 * Conta os envelopes de uma coluna agrupando por versão e chave citada.
 *
 * `substr`/`instr` recortam só o cabeçalho: `v2.<keyId>.<iv>.<cipher>` vira
 * `<keyId>`, e o restante nunca sai do banco.
 */
function inventoryQuery(table: string, column: string): string {
  return `SELECT version, key_id, COUNT(*) AS total FROM (
            SELECT
              CASE
                WHEN substr(c, 1, 3) = 'v1.' THEN 'v1'
                WHEN substr(c, 1, 3) = 'v2.' THEN 'v2'
                ELSE 'unknown'
              END AS version,
              CASE
                WHEN substr(c, 1, 3) = 'v2.' AND instr(substr(c, 4), '.') > 1
                  THEN substr(substr(c, 4), 1, instr(substr(c, 4), '.') - 1)
                ELSE NULL
              END AS key_id
            FROM (
              SELECT ${column} AS c FROM ${table}
               WHERE ${column} IS NOT NULL AND ${column} <> ''
            )
          )
          GROUP BY version, key_id`;
}

interface InventoryRow {
  version: string;
  key_id: string | null;
  total: number;
}

async function tableExists(db: D1Database, table: string): Promise<boolean> {
  const row = await db
    .prepare(
      `SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
    )
    .bind(table)
    .first<{ present: number }>();
  return Boolean(row);
}

/**
 * Percorre a allowlist e devolve as contagens.
 *
 * Tabela ausente entra em `missingTables` em vez de virar zero: "não há
 * registro nenhum" e "a tabela nem existe" são fatos diferentes, e tratá-los
 * como o mesmo é o que faria um deriva de schema se disfarçar de rotação
 * concluída. É a mesma doutrina do `decryptText`, que distingue campo vazio de
 * campo ilegível.
 */
export async function collectOperationalEnvelopeInventory(
  db: D1Database,
): Promise<EnvelopeInventory> {
  const columns: ColumnInventory[] = [];
  const missingTables: string[] = [];
  const checked = new Map<string, boolean>();

  for (const entry of OPERATIONAL_ENVELOPE_COLUMNS) {
    // Cinto e suspensório: a allowlist já é congelada, mas um identificador
    // que não case aqui é defeito de programação e deve explodir no teste.
    if (
      !SAFE_IDENTIFIER.test(entry.table) ||
      !SAFE_IDENTIFIER.test(entry.column)
    ) {
      throw new Error("OPERATIONAL_ENVELOPE_IDENTIFIER_INVALID");
    }

    let exists = checked.get(entry.table);
    if (exists === undefined) {
      exists = await tableExists(db, entry.table);
      checked.set(entry.table, exists);
      if (!exists) missingTables.push(entry.table);
    }
    if (!exists) continue;

    const result = await db
      .prepare(inventoryQuery(entry.table, entry.column))
      .all<InventoryRow>();
    const buckets: EnvelopeBucket[] = (result.results ?? []).map((row) => {
      const version =
        row.version === "v1" || row.version === "v2"
          ? row.version
          : ("unknown" as const);
      const rawKeyId = row.key_id;
      const valid =
        typeof rawKeyId === "string" &&
        OPERATIONAL_KEY_ID_PATTERN.test(rawKeyId);
      return {
        version,
        // Um keyId fora do padrão do escritor é bytes arbitrários guardados no
        // banco. Contamos, nunca ecoamos: uma rota de status não pode virar
        // canal de leitura do que está armazenado.
        keyId: version === "v2" && valid ? (rawKeyId as string) : null,
        malformedKeyId: version === "v2" && !valid,
        total: Number(row.total) || 0,
      };
    });

    columns.push({ table: entry.table, column: entry.column, buckets });
  }

  return { columns, missingTables };
}

export interface RetirementAssessment {
  /** Envelopes v1: não citam chave, logo dependem do keyring inteiro. */
  legacyV1: number;
  /** Envelopes v2 que citam explicitamente a chave anterior. */
  citingPrevious: number;
  /** Envelopes ilegíveis por este inventário (versão ou keyId inesperados). */
  unreadable: number;
  /** Total de envelopes cobertos pela allowlist. */
  total: number;
  /** Verdadeiro só quando NADA depende da chave anterior. */
  previousKeyRetirementSafe: boolean;
}

/**
 * Decide se `OPERATIONAL_DATA_KEY_PREVIOUS` já pode ser aposentada.
 *
 * Fail-closed em três frentes: v1 (não diz qual chave usou, então pode
 * depender da anterior), v2 citando a anterior, e qualquer envelope que este
 * inventário não saiba classificar. Só é seguro quando os três são zero —
 * "não encontrei problema" e "não sei dizer" não podem virar a mesma resposta.
 *
 * Sem chave anterior configurada nada há para aposentar, mas v1 e ilegíveis
 * continuam bloqueando: são exatamente os registros que uma rotação anterior
 * pode ter deixado órfãos.
 */
export function assessPreviousKeyRetirement(
  inventory: EnvelopeInventory,
  previousKeyId: string | null,
): RetirementAssessment {
  let legacyV1 = 0;
  let citingPrevious = 0;
  let unreadable = 0;
  let total = 0;

  for (const column of inventory.columns) {
    for (const bucket of column.buckets) {
      total += bucket.total;
      if (bucket.version === "v1") legacyV1 += bucket.total;
      else if (bucket.version === "unknown" || bucket.malformedKeyId)
        unreadable += bucket.total;
      else if (previousKeyId && bucket.keyId === previousKeyId)
        citingPrevious += bucket.total;
    }
  }

  return {
    legacyV1,
    citingPrevious,
    unreadable,
    total,
    previousKeyRetirementSafe:
      legacyV1 === 0 && citingPrevious === 0 && unreadable === 0,
  };
}

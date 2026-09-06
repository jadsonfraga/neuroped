/**
 * Inventário dos envelopes de PII operacional, por versão e por chave citada.
 * Nunca decifra: lê somente cabeçalhos de envelopes em uma allowlist congelada.
 */
import { OPERATIONAL_KEY_ID_PATTERN } from "../operations/_core";

export interface EnvelopeColumn {
  table: string;
  column: string;
}

export const OPERATIONAL_ENVELOPE_COLUMNS: readonly EnvelopeColumn[] = Object.freeze([
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
  version: "v1" | "v2" | "unknown";
  keyId: string | null;
  malformedKeyId: boolean;
  total: number;
}

export interface ColumnInventory extends EnvelopeColumn {
  buckets: EnvelopeBucket[];
}

export interface EnvelopeInventory {
  columns: ColumnInventory[];
  missingTables: string[];
}

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
    .prepare(`SELECT 1 AS present FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
    .bind(table)
    .first<{ present: number }>();
  return Boolean(row);
}

export async function collectOperationalEnvelopeInventory(
  db: D1Database,
): Promise<EnvelopeInventory> {
  const columns: ColumnInventory[] = [];
  const missingTables: string[] = [];
  const checked = new Map<string, boolean>();

  for (const entry of OPERATIONAL_ENVELOPE_COLUMNS) {
    if (!SAFE_IDENTIFIER.test(entry.table) || !SAFE_IDENTIFIER.test(entry.column)) {
      throw new Error("OPERATIONAL_ENVELOPE_IDENTIFIER_INVALID");
    }

    let exists = checked.get(entry.table);
    if (exists === undefined) {
      exists = await tableExists(db, entry.table);
      checked.set(entry.table, exists);
      if (!exists) missingTables.push(entry.table);
    }
    if (!exists) continue;

    const result = await db.prepare(inventoryQuery(entry.table, entry.column)).all<InventoryRow>();
    const buckets: EnvelopeBucket[] = (result.results ?? []).map((row) => {
      const version = row.version === "v1" || row.version === "v2"
        ? row.version
        : ("unknown" as const);
      const rawKeyId = row.key_id;
      const valid = typeof rawKeyId === "string" && OPERATIONAL_KEY_ID_PATTERN.test(rawKeyId);
      return {
        version,
        // Bytes arbitrários do banco nunca são ecoados como keyId.
        keyId: version === "v2" && valid ? rawKeyId : null,
        malformedKeyId: version === "v2" && !valid,
        total: Number(row.total) || 0,
      };
    });
    columns.push({ table: entry.table, column: entry.column, buckets });
  }

  return { columns, missingTables };
}

export interface RetirementAssessment {
  legacyV1: number;
  citingPrevious: number;
  /** v2 válido, mas citando uma chave que não é nem a atual nem a anterior. */
  citingUnconfiguredKey: number;
  /** Envelopes que o inventário não consegue classificar com segurança. */
  unreadable: number;
  total: number;
  previousKeyRetirementSafe: boolean;
}

/**
 * Decide se a chave anterior pode ser aposentada.
 *
 * O parâmetro `currentKeyId` é opcional apenas por compatibilidade com os testes
 * históricos da própria PR; a rota de produção SEMPRE o fornece. Quando
 * fornecido, qualquer v2 com keyId válido mas fora do keyring configurado é
 * tratado como dado órfão/ilegível e bloqueia a aposentadoria.
 */
export function assessPreviousKeyRetirement(
  inventory: EnvelopeInventory,
  previousKeyId: string | null,
  currentKeyId?: string | null,
): RetirementAssessment {
  let legacyV1 = 0;
  let citingPrevious = 0;
  let citingUnconfiguredKey = 0;
  let unreadable = 0;
  let total = 0;

  for (const column of inventory.columns) {
    for (const bucket of column.buckets) {
      total += bucket.total;
      if (bucket.version === "v1") {
        legacyV1 += bucket.total;
        continue;
      }
      if (bucket.version === "unknown" || bucket.malformedKeyId || !bucket.keyId) {
        unreadable += bucket.total;
        continue;
      }
      if (previousKeyId && bucket.keyId === previousKeyId) {
        citingPrevious += bucket.total;
        continue;
      }
      if (currentKeyId && bucket.keyId !== currentKeyId) {
        // Um terceiro keyId sintaticamente válido não é "outra chave segura";
        // é um envelope que o keyring atual não consegue provar que lê.
        citingUnconfiguredKey += bucket.total;
        unreadable += bucket.total;
      }
    }
  }

  return {
    legacyV1,
    citingPrevious,
    citingUnconfiguredKey,
    unreadable,
    total,
    previousKeyRetirementSafe:
      legacyV1 === 0 && citingPrevious === 0 && unreadable === 0,
  };
}

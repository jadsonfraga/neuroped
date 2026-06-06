/**
 * Adapter de banco de dados.
 *
 * Auto-deteccao via env:
 *  - Se DATABASE_URL definido e comecar com "postgres://" ou "postgresql://"
 *    usa drizzle-orm/postgres-js (producao recomendada). Requer chamar initDb().
 *  - Caso contrario, usa drizzle-orm/better-sqlite3 (dev) — inicializado sincronamente.
 *
 * O resto do app importa { db } daqui. Em modo Postgres, chamar initDb() no boot.
 *
 * Migracoes:
 *  - dev SQLite: schema criado idempotentemente em storage.ts
 *  - prod Postgres: usar drizzle-kit migrate com schemas em shared/schema-pg.ts
 *
 * NOTA: Top-level await foi removido para compatibilidade com output CJS do esbuild.
 * Postgres e inicializado via initDb() (async) chamado em server/index.ts.
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATABASE_URL = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(DATABASE_URL);

export const dbProvider: "postgres" | "sqlite" = isPostgres ? "postgres" : "sqlite";

let _db: any = null;
let _client: any = null;

// SQLite: inicializa sincronamente (sem top-level await)
if (!isPostgres) {
  const dbPath = process.env.DATABASE_PATH || "neuroped.db";
  const dbDir = path.dirname(path.resolve(dbPath));
  if (dbDir && !fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  _client = sqlite;
  _db = drizzleSqlite(sqlite);
  console.log(`[db] Conectado ao SQLite: ${dbPath}`);
}

/**
 * Inicializa conexao Postgres (deve ser chamado no boot do server antes de aceitar requests).
 * Em modo SQLite, e no-op.
 */
export async function initDb(): Promise<void> {
  if (_db) return; // Ja inicializado
  if (!isPostgres) return; // SQLite ja foi inicializado sincronamente

  const { default: postgres } = await import("postgres");
  const { drizzle: drizzlePg } = await import("drizzle-orm/postgres-js");

  _client = postgres(DATABASE_URL, {
    max: parseInt(process.env.DATABASE_POOL_MAX || "10", 10),
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : (process.env.DATABASE_SSL === "true" as any),
    prepare: false,
  });
  _db = drizzlePg(_client);
  console.log(`[db] Conectado ao Postgres: ${redactUrl(DATABASE_URL)}`);
}

/**
 * Proxy lazy: delega para _db assim que inicializado.
 * Permite importar { db } de forma sincrona mesmo em modo Postgres,
 * desde que initDb() seja chamado antes do primeiro uso real.
 */
export const db: any = new Proxy(Object.create(null) as Record<string, unknown>, {
  get(_target, prop: string | symbol) {
    if (!_db) {
      throw new Error(
        `[db] Banco nao inicializado. Certifique-se de que initDb() foi chamado no boot (modo Postgres).`,
      );
    }
    return (_db as Record<string, unknown>)[prop as string];
  },
});

export function getRawClient(): any {
  return _client;
}

function redactUrl(url: string): string {
  return url.replace(/:[^:@]+@/, ":***@");
}

export async function shutdownDb(): Promise<void> {
  if (isPostgres && _client && typeof _client.end === "function") {
    await _client.end();
  } else if (!isPostgres && _client && typeof _client.close === "function") {
    _client.close();
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  shutdownDb().finally(() => process.exit(0));
});
process.on("SIGINT", () => {
  shutdownDb().finally(() => process.exit(0));
});

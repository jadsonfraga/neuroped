/**
 * BLOCO 1: Banco de dados aprimorado com camada de repositório
 *
 * Auto-deteccao via env:
 *  - Se DATABASE_URL definido e começar com "postgres://" ou "postgresql://"
 *    usa drizzle-orm/postgres-js (produção recomendada)
 *  - Caso contrário, usa drizzle-orm/better-sqlite3 (dev)
 *
 * Pooling, índices e otimizações para performance ≥ 8.0
 */

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { boundedIntegerEnv } from "./runtimeConfig.js";
import { createRepositories } from "./repositories/factory";
import type { IRepositories } from "./repositories";

const DATABASE_URL = process.env.DATABASE_URL || "";
const isPostgres = /^postgres(ql)?:\/\//i.test(DATABASE_URL);

export const dbProvider: "postgres" | "sqlite" = isPostgres ? "postgres" : "sqlite";

let _db: any = null;
let _client: any = null;
let _repositories: IRepositories | null = null;

// SQLite: inicializa sincronamente
if (!isPostgres) {
  const dbPath = process.env.DATABASE_PATH || "neuroped.db";
  const dbDir = path.dirname(path.resolve(dbPath));
  if (dbDir && !fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  // Otimizações SQLite
  sqlite.pragma("synchronous = NORMAL");
  sqlite.pragma("cache_size = -64000"); // 64MB
  sqlite.pragma("temp_store = MEMORY");

  _client = sqlite;
  _db = drizzleSqlite(sqlite);
  _repositories = createRepositories(_db);
  console.log(`[db] ✅ Conectado ao SQLite: ${dbPath}`);
}

/**
 * Inicializa conexão Postgres com pooling otimizado
 * Deve ser chamado no boot antes de aceitar requests
 */
export async function initDb(): Promise<void> {
  if (_db) return;
  if (!isPostgres) return;

  const { default: postgres } = await import("postgres");
  const { drizzle: drizzlePg } = await import("drizzle-orm/postgres-js");

  // Pool configuration otimizado para produção
  _client = postgres(DATABASE_URL, {
    max: boundedIntegerEnv("DATABASE_POOL_MAX", 20, 1, 100), // Aumentado para 20 (default Postgres)
    idle_timeout: 30, // 30 segundos
    connect_timeout: 10,
    connection: { statement_timeout: 30000 }, // 30s timeout nas queries (parâmetro de conexão)
    ssl: process.env.NODE_ENV === "production" ? "require" : (process.env.DATABASE_SSL === "true" as any),
    prepare: false,
    backoff: (attempt: number) => 100 * Math.pow(2, attempt), // Exponential backoff
    onnotice: () => {}, // Suprimir avisos
  });

  _db = drizzlePg(_client);
  _repositories = createRepositories(_db);
  console.log(`[db] ✅ Conectado ao Postgres: ${redactUrl(DATABASE_URL)}`);
  console.log(`[db] 📊 Pool config: max=${process.env.DATABASE_POOL_MAX || 20}, min=${process.env.DATABASE_POOL_MIN || 2}`);
}

/**
 * Exporta o db para queries diretas (legado)
 */
export const db: any = new Proxy(Object.create(null), {
  get(_target, prop: string | symbol) {
    if (!_db) {
      throw new Error(`[db] Banco não inicializado. Chame initDb() no boot (modo Postgres).`);
    }
    return (_db as Record<string, unknown>)[prop as string];
  },
});

/**
 * Exporta repositories (novo padrão)
 */
export function getRepositories(): IRepositories {
  if (!_repositories) {
    throw new Error(`[db] Repositories não inicializados. Chame initDb() no boot.`);
  }
  return _repositories;
}

export function getRawClient(): any {
  return _client;
}

function redactUrl(url: string): string {
  return url.replace(/:[^:@]+@/, ":***@");
}

export async function shutdownDb(): Promise<void> {
  if (isPostgres && _client && typeof _client.end === "function") {
    await _client.end();
    console.log("[db] ✅ Postgres connection closed");
  } else if (!isPostgres && _client && typeof _client.close === "function") {
    _client.close();
    console.log("[db] ✅ SQLite connection closed");
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[db] SIGTERM recebido, fechando conexões...");
  shutdownDb().finally(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[db] SIGINT recebido, fechando conexões...");
  shutdownDb().finally(() => process.exit(0));
});

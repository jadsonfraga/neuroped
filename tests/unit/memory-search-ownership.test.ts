import assert from "node:assert/strict";
import { onRequestGet as searchMemory } from "../../functions/api/memory/search";

interface CapturedQuery {
  sql: string;
  binds: unknown[];
}

function captureDb() {
  const queries: CapturedQuery[] = [];
  return {
    queries,
    db: {
      prepare(sql: string) {
        const captured: CapturedQuery = { sql, binds: [] };
        queries.push(captured);
        return {
          bind(...binds: unknown[]) {
            captured.binds = binds;
            return {
              all: async () => ({ results: [] }),
            };
          },
        };
      },
    },
  };
}

function authUser(role: "admin" | "professional", id: string) {
  return {
    id,
    email: `${id}@example.com`,
    name: id,
    role,
    mustChangePassword: false,
  };
}

async function invoke(db: unknown, user?: ReturnType<typeof authUser>) {
  return searchMemory({
    request: new Request("https://neuroped.test/api/memory/search?q=atenção"),
    env: { DB: db },
    data: user ? { authUser: user } : {},
  } as never);
}

const unauthenticated = captureDb();
assert.equal((await invoke(unauthenticated.db)).status, 401);
assert.equal(unauthenticated.queries.length, 0, "sem usuário não consulta memória clínica");

const professional = captureDb();
assert.equal(
  (await invoke(professional.db, authUser("professional", "owner-a"))).status,
  200,
);
assert.equal(
  professional.queries.length,
  1,
  "sem chaves e antes do modo estrito, somente o fallback legado owner-scoped é permitido",
);
const professionalQuery = professional.queries[0];
assert.match(professionalQuery.sql, /FROM memory_notes/);
assert.match(professionalQuery.sql, /patient_id IN[\s\S]*patients_demo/);
assert.match(professionalQuery.sql, /owner_user_id\s*=\s*\?/);
assert.ok(professionalQuery.binds.includes("owner-a"));
assert.doesNotMatch(
  professionalQuery.sql,
  /memory_notes_fts/i,
  "FTS clínico em plaintext não pode reaparecer durante a transição",
);

const admin = captureDb();
assert.equal((await invoke(admin.db, authUser("admin", "admin-1"))).status, 200);
assert.equal(admin.queries.length, 1);
assert.doesNotMatch(admin.queries[0].sql, /owner_user_id/);
assert.doesNotMatch(admin.queries[0].sql, /memory_notes_fts/i);

console.log("✓ memory search preserva ownership sem reintroduzir FTS clínico plaintext");

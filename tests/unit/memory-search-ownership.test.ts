import assert from "node:assert/strict";
import { onRequestGet as searchMemory } from "../../functions/api/memory/search";

interface CapturedQuery {
  sql: string;
  binds: unknown[];
}

const TEST_CLINICAL_KEY = "memory-search-test-key-0123456789-abcdefghijklmnopqrstuvwxyz";

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

async function invoke(
  db: unknown,
  user?: ReturnType<typeof authUser>,
  strict = false,
) {
  return searchMemory({
    request: new Request("https://neuroped.test/api/memory/search?q=atenção"),
    env: {
      DB: db,
      CLINICAL_DATA_KEY: TEST_CLINICAL_KEY,
      CLINICAL_ENCRYPTION_STRICT: strict ? "true" : "false",
    },
    data: user ? { authUser: user } : {},
  } as never);
}

const unauthenticated = captureDb();
assert.equal((await invoke(unauthenticated.db)).status, 401);
assert.equal(unauthenticated.queries.length, 0, "sem usuário não consulta memória clínica");

const professionalDualRead = captureDb();
assert.equal(
  (await invoke(professionalDualRead.db, authUser("professional", "owner-a"), false)).status,
  200,
);
assert.equal(professionalDualRead.queries.length, 1, "dual-read usa uma seleção autorizada e limitada");
assert.match(professionalDualRead.queries[0].sql, /n\.patient_id IN/);
assert.match(professionalDualRead.queries[0].sql, /p\.owner_user_id = \?/);
assert.ok(professionalDualRead.queries[0].binds.includes("owner-a"));
assert.doesNotMatch(professionalDualRead.queries[0].sql, /memory_notes_fts|\bLIKE\b/i,
  "nem a janela dual-read deve pesquisar conteúdo clínico em plaintext");

const professionalStrict = captureDb();
assert.equal(
  (await invoke(professionalStrict.db, authUser("professional", "owner-b"), true)).status,
  200,
);
assert.equal(professionalStrict.queries.length, 1);
assert.match(professionalStrict.queries[0].sql, /clinical_search_tokens/);
assert.match(professionalStrict.queries[0].sql, /p\.owner_user_id = \?/);
assert.ok(professionalStrict.queries[0].binds.includes("owner-b"));
assert.doesNotMatch(professionalStrict.queries[0].sql, /memory_notes_fts|\bLIKE\b/i);

const admin = captureDb();
assert.equal((await invoke(admin.db, authUser("admin", "admin-1"), true)).status, 200);
assert.equal(admin.queries.length, 1);
assert.match(admin.queries[0].sql, /clinical_search_tokens/);
assert.doesNotMatch(admin.queries[0].sql, /owner_user_id\s*=\s*\?/);

console.log("✓ memory search isola owner e usa blind index sem FTS/LIKE clínico");

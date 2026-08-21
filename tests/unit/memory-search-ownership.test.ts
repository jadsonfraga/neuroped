import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
            return { all: async () => ({ results: [] }) };
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
assert.equal((await invoke(professional.db, authUser("professional", "owner-a"))).status, 200);
assert.equal(professional.queries.length, 2, "FTS vazio cai no LIKE");
for (const query of professional.queries) {
  assert.match(query.sql, /n\.patient_id IN/);
  assert.match(query.sql, /p\.owner_user_id = \?/);
  assert.ok(query.binds.includes("owner-a"));
}
assert.match(professional.queries[0].sql, /n\.patient_id IN[\s\S]*patients_demo/);
assert.match(professional.queries[1].sql, /n\.patient_id IN[\s\S]*patients_demo/);

const admin = captureDb();
assert.equal((await invoke(admin.db, authUser("admin", "admin-1"))).status, 200);
for (const query of admin.queries) assert.doesNotMatch(query.sql, /owner_user_id/);

const memorySources = {
  "memory/search.ts": readFileSync(new URL("../../functions/api/memory/search.ts", import.meta.url), "utf8"),
  "memory/index.ts": readFileSync(new URL("../../functions/api/memory/index.ts", import.meta.url), "utf8"),
  "memory/[id].ts": readFileSync(new URL("../../functions/api/memory/[id].ts", import.meta.url), "utf8"),
  "patients/[id].ts": readFileSync(new URL("../../functions/api/patients/[id].ts", import.meta.url), "utf8"),
};

for (const [name, source] of Object.entries(memorySources)) {
  const legacy = source.match(/\b(?:FROM|INTO|UPDATE|DELETE FROM)\s+memory_notes\b/);
  assert.equal(legacy, null, `${name} ainda aponta para memory_notes; use clinical_memory_notes_demo`);
}

assert.match(memorySources["memory/search.ts"], /clinical_memory_notes_demo/);
assert.match(
  memorySources["patients/[id].ts"],
  /DELETE FROM clinical_memory_notes_demo WHERE patient_id/,
  "exclusão de paciente precisa apagar as notas na tabela canônica",
);

console.log("✓ memory search isola owner e usa tabela canônica");
console.log("✓ exclusão de paciente remove memória clínica explicitamente");

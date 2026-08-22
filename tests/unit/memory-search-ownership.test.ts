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
assert.equal(professional.queries.length, 2, "FTS vazio cai no LIKE");
for (const query of professional.queries) {
  assert.match(query.sql, /clinical_memory_notes_demo/,
    "FTS e LIKE devem ler da mesma tabela usada para gravar as notas");
  assert.doesNotMatch(query.sql, /(?:FROM|JOIN)\s+memory_notes\b/,
    "a busca não pode voltar para a tabela legada memory_notes");
  assert.match(query.sql, /n\.patient_id IN/);
  assert.match(query.sql, /p\.owner_user_id = \?/);
  assert.ok(query.binds.includes("owner-a"));
}
assert.match(
  professional.queries[0].sql,
  /n\.patient_id IN[\s\S]*patients_demo/,
  "FTS exclui paciente alheio e patient_id NULL",
);
assert.match(
  professional.queries[1].sql,
  /n\.patient_id IN[\s\S]*patients_demo/,
  "fallback LIKE aplica a mesma fronteira de owner",
);

const admin = captureDb();
assert.equal((await invoke(admin.db, authUser("admin", "admin-1"))).status, 200);
for (const query of admin.queries) {
  assert.match(query.sql, /clinical_memory_notes_demo/);
  assert.doesNotMatch(query.sql, /(?:FROM|JOIN)\s+memory_notes\b/);
  assert.doesNotMatch(query.sql, /owner_user_id/);
}

console.log("✓ memory search usa tabela canônica e isola owner em FTS/LIKE");

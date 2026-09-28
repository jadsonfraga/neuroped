/**
 * memory-search-like-escape.test.mjs — LEG-17 (docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md):
 * GET /api/memory construía o LIKE com `%${query}%` sem escapar `%`/`_`, então
 * um termo de busca com um underscore literal era lido como curinga de um
 * caractere e distorcia o resultado. Sem impacto de isolamento — o predicado
 * de patient_id já restringe o escopo a um paciente autorizado; este teste
 * prova só a precisão da busca dentro desse escopo.
 *
 * RED contra o código anterior: a nota "underscoreXtest" aparecia na busca
 * por "underscore_test" porque `_` era tratado como curinga.
 *
 * Rodar: node --import tsx tests/unit/memory-search-like-escape.test.mjs
 */
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { onRequestGet as memoryGet, onRequestPost as memoryPost } from "../../functions/api/memory/index.ts";

const raw = new DatabaseSync(":memory:");
raw.exec(`
  CREATE TABLE patients_demo (id TEXT PRIMARY KEY, owner_user_id TEXT, is_demo INTEGER NOT NULL DEFAULT 1);
`);

function makeDb(database) {
  const prepare = (sql) => {
    const bound = (args) => ({
      async first() {
        return database.prepare(sql).get(...args) ?? null;
      },
      async run() {
        const info = database.prepare(sql).run(...args);
        return { meta: { changes: Number(info.changes) } };
      },
      async all() {
        return { results: database.prepare(sql).all(...args) };
      },
    });
    return { ...bound([]), bind: (...args) => bound(args) };
  };
  return { prepare };
}
const db = makeDb(raw);

const PATIENT = "patient-like-escape-synthetic";
raw.prepare("INSERT INTO patients_demo (id, owner_user_id, is_demo) VALUES (?, ?, 1)").run(PATIENT, "owner-synthetic");

const user = { id: "owner-synthetic", role: "professional" };
const ctx = (request) => ({ env: { DB: db }, request, data: { authUser: user } });
const req = (url, body) =>
  new Request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

async function criarNota(title) {
  const resposta = await memoryPost(ctx(req("https://x.test/api/memory", { patientId: PATIENT, title, content: "conteúdo sintético" })));
  assert.equal(resposta.status, 201, `criação da nota "${title}"`);
}

await criarNota("underscore_test");
await criarNota("underscoreXtest");

const busca = await memoryGet(ctx(new Request(`https://x.test/api/memory?patient_id=${PATIENT}&q=underscore_test`)));
assert.equal(busca.status, 200);
const corpo = await busca.json();
const titulos = corpo.data.map((nota) => nota.title).sort();

assert.deepEqual(
  titulos,
  ["underscore_test"],
  `busca por "underscore_test" deve casar só o título literal, não "underscoreXtest" (recebido: ${JSON.stringify(titulos)})`,
);

// Controle: sem o "_" no termo, o comportamento normal de substring continua.
const buscaAmpla = await memoryGet(ctx(new Request(`https://x.test/api/memory?patient_id=${PATIENT}&q=underscore`)));
const corpoAmplo = await buscaAmpla.json();
assert.equal(corpoAmplo.data.length, 2, "busca sem curinga literal continua casando as duas notas");

console.log("✓ LEG-17: busca de memória clínica escapa % e _ no termo de busca (LIKE literal, sem impacto de isolamento)");

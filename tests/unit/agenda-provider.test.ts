/**
 * agenda-provider.test.ts — issue #1064, etapa C. Funções puras da escolha de
 * profissional pela recepção (client/src/lib/agendaProvider.ts).
 *
 * Rodar: node --import tsx tests/unit/agenda-provider.test.ts
 */
import assert from "node:assert/strict";

import {
  DASHBOARD_BASE_KEY,
  agendaOfSuffix,
  dashboardKeyFor,
  isProviderUnavailable,
  operationsUrlFor,
  parseSelectionRequired,
  readStoredProvider,
  storageKeyFor,
  storeProvider,
} from "../../client/src/lib/agendaProvider";

// ── chave da consulta e URL do POST ───────────────────────────────────────
assert.equal(dashboardKeyFor(null), DASHBOARD_BASE_KEY);
assert.equal(dashboardKeyFor("prof-2"), `${DASHBOARD_BASE_KEY}&provider=prof-2`);
assert.notEqual(dashboardKeyFor("prof-1"), dashboardKeyFor("prof-2"), "caches de profissionais diferentes nunca se misturam");
assert.equal(operationsUrlFor(null), "/api/operations");
assert.equal(operationsUrlFor("prof-2"), "/api/operations?provider=prof-2");
for (const hostile of ["a&clinic=x", "../etc", "x y", "id#frag", "a/b", "", " ", "x".repeat(101), "<script>"]) {
  assert.equal(dashboardKeyFor(hostile), DASHBOARD_BASE_KEY, `id hostil descartado: ${JSON.stringify(hostile)}`);
  assert.equal(operationsUrlFor(hostile), "/api/operations", `id hostil nunca vai à URL: ${JSON.stringify(hostile)}`);
}

// ── leitura do 409 (o fetcher lança Error("<status>: <corpo>")) ───────────
const body = {
  error: "Escolha de qual profissional você vai operar a agenda.",
  code: "PROVIDER_SELECTION_REQUIRED",
  providers: [{ id: "prof-2", name: "Profissional Dois" }, { id: "prof-1", name: "Profissional Um" }],
};
assert.deepEqual(parseSelectionRequired(new Error(`409: ${JSON.stringify(body)}`)), body.providers);
assert.equal(parseSelectionRequired(new Error("403: {\"code\":\"STAFF_LINK_REQUIRED\"}")), null);
assert.equal(parseSelectionRequired(new Error("409: not json PROVIDER_SELECTION_REQUIRED")), null);
assert.equal(parseSelectionRequired(null), null);
assert.equal(parseSelectionRequired(new Error(`409: ${JSON.stringify({ ...body, code: "OUTRO" })}`)), null, "o código no corpo precisa conferir");
assert.equal(parseSelectionRequired(new Error(`409: ${JSON.stringify({ ...body, providers: body.providers.slice(0, 1) })}`)), null, "uma só opção não é escolha");
assert.deepEqual(
  parseSelectionRequired(new Error(`409: ${JSON.stringify({ ...body, providers: [...body.providers, { id: "x y", name: "Inválido" }, { id: "p3", name: "  " }, { id: 7, name: "N" }, null] })}`)),
  body.providers,
  "entradas inválidas são descartadas, as válidas ficam",
);
assert.equal(isProviderUnavailable(new Error('403: {"code":"PROVIDER_NOT_AVAILABLE"}')), true);
assert.equal(isProviderUnavailable(new Error("403: STAFF_LINK_REQUIRED")), false);
assert.equal(isProviderUnavailable(undefined), false);

// ── armazenamento: por conta, tolerante a falha ───────────────────────────
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    snapshot: () => Object.fromEntries(data),
  };
}
const store = fakeStorage();
storeProvider("sec-a", "prof-2", store);
assert.equal(readStoredProvider("sec-a", store), "prof-2");
assert.equal(readStoredProvider("sec-b", store), null, "outra conta no mesmo dispositivo não herda a escolha");
assert.deepEqual(Object.keys(store.snapshot()), [storageKeyFor("sec-a")!], "uma chave por conta");
storeProvider("sec-a", null, store);
assert.equal(readStoredProvider("sec-a", store), null, "null esquece a escolha");
assert.deepEqual(store.snapshot(), {});

assert.equal(storageKeyFor(null), null);
assert.equal(storageKeyFor("../x"), null);
storeProvider(null, "prof-1", store);
assert.deepEqual(store.snapshot(), {}, "sem conta identificada nada é gravado");
assert.equal(readStoredProvider(undefined, store), null);

const corrupt = fakeStorage({ [storageKeyFor("sec-a")!]: "<script>alert(1)</script>" });
assert.equal(readStoredProvider("sec-a", corrupt), null, "valor corrompido é ignorado");

const explosive = {
  getItem: () => { throw new Error("blocked"); },
  setItem: () => { throw new Error("blocked"); },
  removeItem: () => { throw new Error("blocked"); },
};
assert.equal(readStoredProvider("sec-a", explosive), null, "armazenamento que lança nunca derruba a tela");
assert.doesNotThrow(() => storeProvider("sec-a", "prof-1", explosive));
assert.doesNotThrow(() => storeProvider("sec-a", null, explosive));
assert.equal(readStoredProvider("sec-a", null), null, "sem armazenamento disponível");
assert.doesNotThrow(() => storeProvider("sec-a", "prof-1", null));

// ── sufixo das mensagens ──────────────────────────────────────────────────
assert.equal(agendaOfSuffix(true, "Profissional Um"), " — agenda de Profissional Um");
assert.equal(agendaOfSuffix(false, "Profissional Um"), "", "o profissional não recebe o sufixo");

console.log("agenda-provider: chave e URL sem injeção, 409 lido com validação, escolha por conta e armazenamento que lança nunca derruba a tela OK");

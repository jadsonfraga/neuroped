/**
 * Regressão: o app roteia por hash (`#/prontuario?patientId=...`). Ler apenas
 * `window.location.search` devolvia string vazia e a tela abria sem paciente —
 * sem erro visível e sem possibilidade de salvar. O helper precisa ler o hash
 * primeiro e só então cair para a query real da URL.
 */
import assert from "node:assert/strict";

interface FakeLocation {
  hash: string;
  search: string;
}

function withLocation(location: FakeLocation, run: () => void): void {
  const previous = (globalThis as Record<string, unknown>).window;
  (globalThis as Record<string, unknown>).window = { location };
  try {
    run();
  } finally {
    if (previous === undefined) delete (globalThis as Record<string, unknown>).window;
    else (globalThis as Record<string, unknown>).window = previous;
  }
}

const { readRouteParam } = await import("../../client/src/lib/routeQuery.ts");

withLocation({ hash: "#/prontuario?patientId=pac-123", search: "" }, () => {
  assert.equal(
    readRouteParam("patientId"),
    "pac-123",
    "parâmetro dentro do hash precisa ser lido (é o formato que o app gera)",
  );
});

withLocation({ hash: "#/laudo-neuroped?patientId=%20pac-9%20", search: "" }, () => {
  assert.equal(readRouteParam("patientId"), "pac-9", "valor precisa vir sem espaços");
});

withLocation({ hash: "#/receita-c1", search: "?patientId=externo-1" }, () => {
  assert.equal(
    readRouteParam("patientId"),
    "externo-1",
    "link externo com query real continua funcionando",
  );
});

withLocation({ hash: "#/prontuario?patientId=do-hash", search: "?patientId=da-url" }, () => {
  assert.equal(
    readRouteParam("patientId"),
    "do-hash",
    "o hash é a navegação corrente e tem precedência",
  );
});

withLocation({ hash: "#/prontuario", search: "" }, () => {
  assert.equal(readRouteParam("patientId"), "", "ausência de parâmetro devolve string vazia");
});

withLocation({ hash: "#/prontuario?patientId=", search: "" }, () => {
  assert.equal(readRouteParam("patientId"), "", "parâmetro vazio não vira id");
});

// ─── Casamento de rota quando a query vem dentro do hash ───
// Regressão: `.../#/prontuario?patientId=x` é a forma que uma pessoa escreve,
// copia ou salva. O hook do wouter devolvia isso inteiro como caminho e
// NENHUMA <Route> casava — o app respondia "Página não encontrada".
const { hashPathWithoutQuery } = await import("../../client/src/lib/hashLocation.ts");

assert.equal(hashPathWithoutQuery("/prontuario?patientId=abc"), "/prontuario");
assert.equal(hashPathWithoutQuery("/prontuario"), "/prontuario");
assert.equal(hashPathWithoutQuery("/"), "/");
assert.equal(hashPathWithoutQuery(""), "/");
assert.equal(hashPathWithoutQuery("/paciente/abc-1?tab=escalas"), "/paciente/abc-1");
assert.equal(hashPathWithoutQuery("prontuario?x=1"), "/prontuario");
assert.equal(
  hashPathWithoutQuery("/filtro-escalas?mode=flash"),
  "/filtro-escalas",
  "atalho de triagem rápida da home precisa resolver",
);

console.log("[route-query] ✓ leitura de parâmetros e casamento de rota em hash cobertos.");

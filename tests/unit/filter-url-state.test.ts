import assert from "node:assert/strict";
import {
  buildFilterUrl,
  currentFilterUrlParams,
  parseFilterUrlParams,
  serializeFilterUrlParams,
  parseUrlExactAge,
  formatUrlExactAge,
  FILTER_URL_KEYS,
} from "../../client/src/lib/filterUrlState.ts";

const validators = { queixaIds: new Set(["tea", "tdah", "sono"]), ageBandIds: new Set(["2-4a", "6-12a"]) };
const parse = (query: string) => parseFilterUrlParams(new URLSearchParams(query), validators);

// Ida e volta completa.
const full = {
  search: "mchat", queixas: ["tea", "sono"], exactAge: { years: "5", months: "6" }, respondente: "pais" as const,
  communication: "nonverbal" as const, literacy: "preliterate" as const, assessmentType: "monitoring" as const,
  signals: ["tea-nao-aponta"], timeBudget: 10,
};
const round = parse(serializeFilterUrlParams(full).toString());
assert.deepEqual(round, { present: true, ...full });

// Faixa só vale sem idade exata; idade exata prevalece (mesma regra de resolveFilterAge).
assert.equal(parse("faixa=2-4a").ageBand, "2-4a");
assert.equal(parse("faixa=2-4a&idade=18m").ageBand, undefined);
assert.deepEqual(parse("faixa=2-4a&idade=18m").exactAge, { years: "1", months: "6" }, "18m normalizado para os campos do app");
assert.deepEqual(parseUrlExactAge("6m"), { years: "", months: "6" });
assert.equal(parseUrlExactAge("300m"), undefined, "acima de 18 anos");
assert.equal(serializeFilterUrlParams({ ageBand: "2-4a", exactAge: { years: "3", months: "" } }).get("faixa"), null);

// Valores inválidos caem um a um, sem derrubar os válidos.
const dirty = parse("queixas=tea,INVALIDA,<script>&faixa=99&idade=19a&resp=hacker&com=x&alf=y&tipo=z&tempo=999&q=snap");
assert.deepEqual(dirty, { present: true, queixas: ["tea"], search: "snap" });
assert.equal(parse("idade=5a12m").exactAge, undefined, "12 meses não existe");
assert.deepEqual(parseUrlExactAge("5a6m"), { years: "5", months: "6" });
assert.deepEqual(parseUrlExactAge("0a"), { years: "0", months: "" });
assert.equal(parseUrlExactAge("abc"), undefined);
assert.equal(formatUrlExactAge({ years: "5", months: "6" }), "5a6m");
assert.equal(formatUrlExactAge({ years: "", months: "" }), undefined);
assert.equal(parse("").present, false);
assert.equal(parse("q=" + "x".repeat(400)).search!.length, 300, "busca limitada a 300 caracteres");

// Leitura aceita hash e query real; hash prevalece.
const merged = currentFilterUrlParams("https://app.test/?q=antigo&autoral=acervo#/filtro?q=novo&resp=pais");
assert.equal(merged.get("q"), "novo");
assert.equal(merged.get("resp"), "pais");
assert.equal(merged.get("autoral"), "acervo");

// Escrita preserva parâmetros alheios (aba autoral, modo) e limpa chaves próprias vazias.
const written = buildFilterUrl("https://app.test/?utm=1&q=stale#/filtro?autoral=acervo&q=old&tempo=5", { search: "snap iv", queixas: ["tdah"], timeBudget: undefined });
const url = new URL(written);
assert.equal(url.searchParams.get("utm"), "1", "query real alheia preservada");
assert.equal(url.searchParams.get("q"), null, "chave própria removida da query real");
const hashQuery = new URLSearchParams(url.hash.split("?")[1]);
assert.equal(url.hash.split("?")[0], "#/filtro");
assert.equal(hashQuery.get("autoral"), "acervo");
assert.equal(hashQuery.get("q"), "snap iv");
assert.equal(hashQuery.get("queixas"), "tdah");
assert.equal(hashQuery.get("tempo"), null, "tempo vazio não fica na URL");
assert.equal(new URL(buildFilterUrl("https://app.test/#/filtro-escalas?mode=flash", { search: "x" })).hash.split("?")[0], "#/filtro-escalas", "rota preservada");
assert.equal(buildFilterUrl("https://app.test/#/filtro?q=a", {}), "https://app.test/#/filtro", "estado vazio limpa a URL");
assert.ok(FILTER_URL_KEYS.includes("q") && FILTER_URL_KEYS.includes("tempo"));
console.log("✓ deep-link do filtro: ida e volta, validação campo a campo, preservação de parâmetros alheios");

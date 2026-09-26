import assert from "node:assert/strict";
import {
  sameFilterUrlState,
  buildFilterUrl,
  currentFilterUrlParams,
  parseFilterUrlParams,
  serializeFilterUrlParams,
  parseUrlExactAge,
  formatUrlExactAge,
  FILTER_URL_KEYS,
  writeFilterUrlState,
} from "../../client/src/lib/filterUrlState.ts";

const validators = { queixaIds: new Set(["tea", "tdah", "sono"]), ageBandIds: new Set(["2-4a", "6-12a"]) };
const parse = (query: string) => parseFilterUrlParams(new URLSearchParams(query), validators);

// Ida e volta dos filtros estruturados; texto livre permanece em memória.
const full = {
  search: "mchat", queixas: ["tea", "sono"], exactAge: { years: "5", months: "6" }, respondente: "pais" as const,
  communication: "nonverbal" as const, literacy: "preliterate" as const, assessmentType: "monitoring" as const,
  signals: ["tea-nao-aponta"], timeBudget: 10,
};
const round = parse(serializeFilterUrlParams(full).toString());
const expectedRound: ReturnType<typeof parse> = { present: true, ...full };
delete expectedRound.search;
assert.deepEqual(round, expectedRound);

// Privacidade: texto livre arbitrário nunca sai da memória pela URL gerada.
const syntheticSearch = "PACIENTE_CANARIO_FICTICIO_20260926 relato livre";
assert.equal(serializeFilterUrlParams({ search: syntheticSearch }).has("q"), false, "texto livre não deve ser serializado na URL");
const scrubbed = buildFilterUrl(`https://app.test/?q=${encodeURIComponent(syntheticSearch)}&utm=1#/filtro?q=${encodeURIComponent(syntheticSearch)}&autoral=acervo`, { ...full, search: syntheticSearch });
assert.equal(currentFilterUrlParams(scrubbed).has("q"), false, "q legado removido da query real e do hash");
assert.ok(!decodeURIComponent(scrubbed).includes(syntheticSearch), "canário ausente mesmo após decodificar a URL");
assert.equal(parseFilterUrlParams(currentFilterUrlParams(scrubbed), validators).respondente, "pais", "filtros estruturados preservados");
assert.equal(parse(`q=${encodeURIComponent(syntheticSearch)}`).search, syntheticSearch, "entrada legada ainda pode ser lida sem ser reemitida");
assert.equal(full.search, "mchat", "serialização não altera o estado de busca em memória");

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
// Mesmos limites do formulário: entrada inválida na tela nunca vira idade na URL.
assert.equal(formatUrlExactAge({ years: "", months: "18" }), undefined, "18 meses no campo de meses é inválido, não 1a6m");
assert.equal(formatUrlExactAge({ years: "5", months: "12" }), undefined);
assert.equal(formatUrlExactAge({ years: "19", months: "0" }), undefined);
assert.equal(formatUrlExactAge({ years: "18", months: "0" }), "18a0m");
assert.equal(serializeFilterUrlParams({ exactAge: { years: "", months: "18" }, ageBand: "2-4a" }).get("idade"), null);
assert.equal(serializeFilterUrlParams({ exactAge: { years: "", months: "18" }, ageBand: "2-4a" }).get("faixa"), null, "idade inválida não cai na faixa por engano");
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
assert.equal(hashQuery.get("q"), null, "texto livre não é reemitido no hash");
assert.equal(hashQuery.get("queixas"), "tdah");
assert.equal(hashQuery.get("tempo"), null, "tempo vazio não fica na URL");
assert.equal(new URL(buildFilterUrl("https://app.test/#/filtro-escalas?mode=flash", { search: "x" })).hash.split("?")[0], "#/filtro-escalas", "rota preservada");
assert.equal(buildFilterUrl("https://app.test/#/filtro?q=a", {}), "https://app.test/#/filtro", "estado vazio limpa a URL");
assert.ok(FILTER_URL_KEYS.includes("q") && FILTER_URL_KEYS.includes("tempo"));

// Espelho da própria aba × link diferente: a idade inválida (que a URL não
// carrega) não distingue os dois; um respondente diferente distingue.
assert.equal(sameFilterUrlState({ queixas: ["tea"], exactAge: { years: "5", months: "12" } }, { present: true, queixas: ["tea"] } as never), true, "URL sem idade espelha sessão com idade inválida");
assert.equal(sameFilterUrlState({ queixas: ["tea"], respondente: "professor" }, { queixas: ["tea"] }), false, "link sem respondente difere da sessão com respondente");
assert.equal(sameFilterUrlState({ queixas: ["tea", "sono"], signals: ["a"] }, { queixas: ["tea", "sono"], signals: ["a"] }), true);

// Executor real com adaptador de History sintético: sem texto livre, sem mutação
// do estado do roteador, idempotente e tolerante à indisponibilidade do History.
const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const routerState = { route: "synthetic-route-state" };
const historyCalls: string[] = [];
const browser = {
  location: { href: "https://app.test/#/filtro?q=legado&mode=clinical" },
  history: {
    state: routerState,
    replaceState(state: unknown, _unused: string, next: string) {
      assert.equal(state, routerState);
      historyCalls.push(next);
      browser.location.href = next;
    },
  },
};
try {
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  writeFilterUrlState({ ...full, search: syntheticSearch });
  assert.equal(historyCalls.length, 1);
  assert.equal(currentFilterUrlParams(historyCalls[0]).has("q"), false);
  assert.equal(currentFilterUrlParams(historyCalls[0]).get("mode"), "clinical");
  writeFilterUrlState({ ...full, search: "OUTRO_CANARIO_FICTICIO" });
  assert.equal(historyCalls.length, 1, "alterar só a busca não grava histórico");
  browser.history.replaceState = () => { throw new Error("synthetic history unavailable"); };
  assert.doesNotThrow(() => writeFilterUrlState({ ...full, timeBudget: 15 }));
} finally {
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
  else Reflect.deleteProperty(globalThis, "window");
}

console.log("✓ deep-link do filtro: filtros estruturados, compatibilidade legada, texto livre ausente e History idempotente");

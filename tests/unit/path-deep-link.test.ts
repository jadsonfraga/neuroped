import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathDeepLinkToHash } from "../../client/src/lib/pathDeepLink";

const at = (pathname: string, search = "", hash = "") => pathDeepLinkToHash({ pathname, search, hash });

// Links públicos por caminho viram a rota por hash, preservando a query.
assert.equal(at("/agendar"), "/#/agendar");
assert.equal(at("/agendar", "?provider=administrador"), "/#/agendar?provider=administrador");
assert.equal(at("/agendar/", "?provider=a&clinic=b"), "/#/agendar?provider=a&clinic=b");
assert.equal(at("/planos"), "/#/planos");
assert.equal(at("/termos-de-uso"), "/#/termos-de-uso");
assert.equal(at("/paciente/abc-123"), "/#/paciente/abc-123");

// Já roteado por hash ou na raiz: nada muda.
assert.equal(at("/", "", "#/agendar"), null);
assert.equal(at("/agendar", "", "#/planos"), null);
assert.equal(at("/"), null);
assert.equal(at(""), null);
assert.equal(at("/index.html"), null);

// Microsites estáticos e arquivos nunca são reescritos.
for (const path of ["/nesplora", "/nesplora/index.html", "/obs10-global/", "/integracoes/boaconsulta", "/recognition-v2", "/api/health", "/assets/x.js", "/sw.js", "/deploy-check.json"]) {
  assert.equal(at(path), null, path);
}

// Callback do SNCR (session_id na query) é consumido em outro ponto.
assert.equal(at("/receita-c1", "?session_id=abc"), null);

// Caminhos estranhos não viram hash.
assert.equal(at("/<script>"), null);
assert.equal(at(`/${"a".repeat(200)}`), null);

// O bootstrap aplica a conversão antes de forçar `#/`.
const main = readFileSync(new URL("../../client/src/main.tsx", import.meta.url), "utf8");
const convert = main.indexOf("pathDeepLinkToHash(window.location)");
const forceRoot = main.indexOf('window.location.hash = "#/"');
assert.ok(convert > 0 && forceRoot > convert, "conversão precisa rodar antes do fallback para #/");
assert.match(main, /history\.replaceState\(/);

console.log("✓ links por caminho abrem a rota por hash certa, sem tocar microsites nem callbacks");

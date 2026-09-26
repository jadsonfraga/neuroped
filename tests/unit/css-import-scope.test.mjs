import assert from "node:assert/strict";
import fs from "node:fs";

// Regressão: escuta-clinica.css é um chunk lazy (só carrega quando /escuta-clinica
// monta), enquanto tokens.css já é global via client/src/index.css. Um @import de
// tokens.css dentro do chunk lazy insere o :root inteiro de novo, mais tarde na
// ordem do documento — mudando raio de foco e outras variáveis do resto da SPA
// depois de uma única visita à rota. Nenhum arquivo de estilo lazy pode reimportar
// tokens.css; ele deve assumir os tokens já carregados globalmente.
const GLOBAL_TOKENS_ENTRY = "client/src/index.css";
const source = fs.readFileSync(GLOBAL_TOKENS_ENTRY, "utf8");
assert.match(source, /@import\s+['"]\.\/styles\/tokens\.css['"]/,
  "tokens.css precisa continuar importado globalmente em index.css");

const lazyStyleFiles = fs.readdirSync("client/src/styles")
  .filter((f) => f.endsWith(".css") && f !== "tokens.css")
  .map((f) => `client/src/styles/${f}`);
assert.ok(lazyStyleFiles.length > 0, "nenhum arquivo de estilo por rota encontrado para checar");

for (const file of lazyStyleFiles) {
  const css = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(css, /@import\s+['"]\.{0,2}\/?tokens\.css['"]/,
    `${file}: reimporta tokens.css — duplica :root no chunk lazy e vaza para outras rotas na mesma sessão`);
}

console.log(`✓ Nenhum estilo por rota reimporta tokens.css (${lazyStyleFiles.length} arquivo(s) checado(s))`);

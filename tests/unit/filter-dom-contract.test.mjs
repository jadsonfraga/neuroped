import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = readFileSync(
  resolve(root, "client/src/pages/filtro-engine.tsx"),
  "utf8",
);

const cardStart = source.indexOf("const cardInner = (");
assert.ok(cardStart >= 0, "card do pódio não encontrado");
assert.doesNotMatch(
  source,
  /return item\.hasScale \? \(\s*<Link[\s\S]*?\{cardInner\}/,
  "o card inteiro não pode ser envolvido por um Link com outro link dentro",
);
assert.match(
  source.slice(cardStart),
  /href=\{item\.route\}/,
  "o card precisa manter uma ação interna navegável",
);
assert.match(
  source.slice(cardStart),
  /target="_blank"[\s\S]*?PubMed/,
  "a referência PubMed precisa continuar externa e explícita",
);

for (const label of [
  "Direto — respondente: criança (teste direto preenchível)",
  "Fala — comunicação: criança verbal",
  "Pré-Alfab. — alfabetização: criança pré-alfabetizada",
]) {
  assert.ok(
    source.includes(`aria-label="${label}"`),
    `o nome acessível precisa começar pelo texto visível: ${label}`,
  );
}

console.log(
  "✓ filtro: DOM preserva aplicação, PubMed e nomes acessíveis visíveis",
);

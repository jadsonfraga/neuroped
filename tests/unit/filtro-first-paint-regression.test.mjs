import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const tour = read("client/src/components/WelcomeTour.tsx");
const engine = read("client/src/pages/filtro-engine.tsx");
const filtro = read("client/src/pages/filtro.tsx");

assert.match(
  tour,
  /className="fixed inset-0 z-\[99998\]"/,
  "o tour guiado deve ser overlay fixed de alta precedência e nunca ocupar o fluxo de layout do /filtro",
);
assert.match(
  tour,
  /role="dialog"/,
  "o tour guiado deve se anunciar como dialog acessível",
);
assert.match(
  tour,
  /aria-modal="true"/,
  "o tour guiado deve ser declarado modal para leitores de tela",
);
assert.doesNotMatch(
  tour,
  /position:\s*["']?(static|relative)/,
  "o tour guiado não pode voltar ao fluxo do documento (regressão do filtro lá embaixo)",
);

assert.match(
  engine,
  /\{q\.emoji && <span aria-hidden="true">\{q\.emoji\}<\/span>\}/,
  "cada queixa do filtro deve renderizar seu emoji em span aria-hidden quando presente",
);
assert.doesNotMatch(
  engine,
  /\[class\*="emoji"\]/,
  "nenhum seletor CSS pode esconder emojis das queixas",
);
assert.doesNotMatch(
  engine,
  /display:\s*none/,
  "o filtro não pode aplicar display:none sobre os chips de queixa",
);

assert.match(
  filtro,
  /role="tabpanel"/,
  "a página do filtro deve manter painéis de tabpanel com conteúdo imediatamente no fluxo",
);
assert.doesNotMatch(
  filtro,
  /localStorage\.setItem\("np_tour/,
  "a página do filtro não pode marcar o tour como concluído por efeito colateral de montagem",
);

console.log(
  "✓ regressão do primeiro paint do /filtro travada: tour é overlay e queixas renderizam emoji",
);

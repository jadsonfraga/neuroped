import assert from "node:assert/strict";
import fs from "node:fs";

// Regressão: `#main-content button:not([data-size="icon"])` tinha especificidade
// (1,1,1) — ID + atributo dentro de :not() — o que batia qualquer classe utilitária
// Tailwind isolada como `min-h-20`/`min-h-24` (especificidade (0,1,0)). Resultado
// medido: os botões "gigantes" do Modo Fácil (Sonda, OBS-10, Reconhecimento Visual,
// Cognitivos) ficavam presos em 44px em todo viewport/dispositivo, sem depender de
// nenhum @media — não era um bug de mouse/desktop, era incondicional. O piso de
// acessibilidade de 44px precisa continuar valendo para botões sem tamanho próprio,
// então a correção não remove a regra: neutraliza a especificidade do escopo de
// página (`#main-content`) e do atributo dentro de `:not()` com `:where()`, seguindo
// o mesmo padrão já validado em obs10.css/visual-recognition.css (PR #981), até
// sobrar apenas a especificidade do seletor de tipo `button` — que perde para
// qualquer classe utilitária, preservando o piso apenas quando nada mais o disputa.
//
// `[role="tab"]` NÃO leva o mesmo :where() no `#main-content`: `TabsTrigger`
// (client/src/components/ui/tabs.tsx) usa `min-h-8` (32px) e depende do piso do
// app-shell para chegar a 44px em abas compactas (agenda, prontuário do
// paciente, inventário). Zerar essa especificidade também — erro cometido e
// corrigido nesta mesma PR após revisão automatizada — devolveria essas abas a
// 32px reais. Este teste prova as duas invariantes ao mesmo tempo.
const FILES = [
  "client/src/styles/premium-app-shell-v12.css",
  "client/src/styles/premium-polish-10.css",
];

// Especificidade simplificada de um seletor: (#ids, .classes/atributos/pseudo-classes, tipos).
// Tudo dentro de :where(...) conta zero (é essa a garantia que estamos testando).
function specificity(selector) {
  let ids = 0, classes = 0, types = 0;
  let depth = 0;
  let i = 0;
  while (i < selector.length) {
    if (selector.startsWith(":where(", i)) {
      depth++;
      i += ":where(".length;
      continue;
    }
    const ch = selector[i];
    if (ch === "(") { depth++; i++; continue; }
    if (ch === ")") { depth = Math.max(0, depth - 1); i++; continue; }
    if (depth === 0) {
      if (ch === "#") ids++;
      else if (ch === "." || ch === "[" || ch === ":") classes++;
      else if (/[a-zA-Z]/.test(ch) && (i === 0 || !/[a-zA-Z0-9_-]/.test(selector[i - 1]))) types++;
    }
    i++;
  }
  return [ids, classes, types];
}

// Especificidade de uma única classe utilitária Tailwind isolada, ex.: `.min-h-20 { ... }`.
const UTILITY_CLASS_SPECIFICITY = [0, 1, 0];

function beatsUtilityClass([ids, classes, types]) {
  if (ids !== 0) return true;
  if (classes > UTILITY_CLASS_SPECIFICITY[1]) return true;
  if (classes === UTILITY_CLASS_SPECIFICITY[1] && types > 0) return true;
  return false;
}

// Extrai o prelúdio completo de seletores (pode ter várias linhas, separadas por
// vírgula) que antecede a declaração `min-height: 44px;` de #main-content — sem
// depender de fronteira de linha, para não parar num `#main-content` errado
// quando o seletor real está espalhado por mais de uma linha.
function extractMainContentFloorSelectors(css) {
  const declaration = css.indexOf("min-height: 44px;");
  assert.ok(declaration >= 0, "declaração min-height: 44px; não encontrada");
  const openBrace = css.lastIndexOf("{", declaration);
  assert.ok(openBrace >= 0, "abertura de bloco não encontrada antes da declaração");
  const previousClose = css.lastIndexOf("}", openBrace);
  const selectorList = css.slice(previousClose + 1, openBrace);
  assert.match(selectorList, /#main-content/, "prelúdio capturado não contém #main-content — âncora errada");
  return selectorList.split(",").map((s) => s.trim()).filter(Boolean);
}

for (const file of FILES) {
  const css = fs.readFileSync(file, "utf8");
  const selectors = extractMainContentFloorSelectors(css);

  const buttonSelector = selectors.find((s) => s.includes("button"));
  const tabSelector = selectors.find((s) => s.includes('[role="tab"]'));
  assert.ok(buttonSelector, `${file}: seletor de button não encontrado no prelúdio capturado (${JSON.stringify(selectors)})`);
  assert.ok(tabSelector, `${file}: seletor de [role="tab"] não encontrado no prelúdio capturado (${JSON.stringify(selectors)})`);

  const buttonSpec = specificity(buttonSelector);
  assert.equal(
    beatsUtilityClass(buttonSpec),
    false,
    `${file}: "${buttonSelector}" (especificidade ${JSON.stringify(buttonSpec)}) ainda bate uma classe utilitária isolada — o botão "gigante" do Modo Fácil voltaria a ficar preso em 44px`,
  );

  const tabSpec = specificity(tabSelector);
  assert.equal(
    beatsUtilityClass(tabSpec),
    true,
    `${file}: "${tabSelector}" (especificidade ${JSON.stringify(tabSpec)}) não bate mais uma classe utilitária isolada — abas compactas com min-h-8 (TabsTrigger) voltariam a renderizar em 32px em vez do piso de 44px`,
  );
}

console.log(`✓ Piso de 44px de #main-content: button não bate classe utilitária (fix aplicado), [role="tab"] continua batendo (sem regressão em abas compactas) — ${FILES.length} arquivo(s).`);

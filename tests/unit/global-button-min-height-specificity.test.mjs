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

for (const file of FILES) {
  const css = fs.readFileSync(file, "utf8");
  const match = css.match(/([^\n{}]*#main-content[^\n{}]*\{\s*min-height:\s*44px[^}]*\})/);
  assert.ok(match, `${file}: regra do piso de 44px de #main-content não encontrada`);
  const ruleText = match[1];
  const selectorList = ruleText.slice(0, ruleText.indexOf("{"));

  assert.match(selectorList, /:where\(#main-content\)/,
    `${file}: #main-content precisa estar neutralizado com :where() para não bater classe utilitária`);
  assert.doesNotMatch(selectorList, /(?<!:where\()#main-content\s+button/,
    `${file}: não pode sobrar um #main-content button fora de :where()`);

  for (const selector of selectorList.split(",")) {
    const spec = specificity(selector.trim());
    assert.equal(
      beatsUtilityClass(spec),
      false,
      `${file}: seletor "${selector.trim()}" com especificidade ${JSON.stringify(spec)} ainda bate uma classe utilitária isolada (${JSON.stringify(UTILITY_CLASS_SPECIFICITY)}) — o botão "gigante" do Modo Fácil voltaria a ficar preso em 44px`,
    );
  }
}

console.log(`✓ Piso de 44px de #main-content neutralizado (${FILES.length} arquivo(s)): não bate mais classe utilitária Tailwind isolada.`);

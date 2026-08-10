import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const main = read("client/src/main.tsx");
const css = read("client/src/styles/visual-reset.css");

const proportionImport = main.indexOf('import "./styles/proportion-guards.css"');
const resetImport = main.indexOf('import "./styles/visual-reset.css"');
assert.ok(proportionImport >= 0, "proportion guards devem continuar carregados");
assert.ok(resetImport > proportionImport, "visual-reset deve carregar por último para ser uma camada reversível");
assert.match(main, /prefers-color-scheme:\s*dark/, "primeiro paint deve respeitar tema do sistema quando não houver preferência salva");
assert.match(main, /savedTheme === "dark"/, "preferência escura salva deve continuar autoritativa");
assert.match(main, /savedTheme !== "light" && prefersDark/, "ausência de preferência não pode mais forçar dark mode");
assert.doesNotMatch(main, /if \(savedTheme !== "light"\)\s*\{\s*document\.documentElement\.classList\.add\("dark"\)/,
  "primeiro paint não pode forçar escuro independentemente do sistema");

assert.match(css, /#main-content > \.sticky\s*\{[\s\S]*?display:\s*none\s*!important;/,
  "barra visual duplicada de fluxo deve permanecer removida");
const legalRootMatch = css.match(/#main-content aside\[aria-label="Aviso de finalidade educativa"\]\s*\{([^}]*)\}/);
assert.ok(legalRootMatch, "aviso legal deve continuar presente, apenas reestilizado como rodapé");
assert.doesNotMatch(legalRootMatch[1], /display:\s*none/i,
  "aviso legal raiz não pode ser escondido");

assert.match(css, /aria-label="Métricas do app"/,
  "inventário técnico da home deve permanecer fora da hierarquia clínica principal");
assert.match(css, /header\[class\*="bg-gradient-to-br"\]/,
  "reset de gradiente deve permanecer restrito a headers decorativos");
assert.doesNotMatch(css, /#main-content\s+\[class\*="bg-gradient-to-br"\]/,
  "não pode existir reset global de gradientes que apague estados semânticos");

assert.doesNotMatch(css, /\.shadcn-card\s*\{[^}]*display:\s*none/is,
  "cards funcionais não podem ser ocultados");
assert.doesNotMatch(css, /(?:input|textarea|select)[^{]*\{[^}]*display:\s*none/is,
  "controles de formulário não podem ser ocultados");
assert.match(css, /@media \(max-width: 767px\)/, "reset deve manter tratamento mobile explícito");
assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/,
  "animação/interaction reset deve respeitar preferência de movimento");

console.log("✓ Visual reset: menos ruído sem remover conteúdo clínico, legal ou controles");

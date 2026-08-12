import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const main = read("client/src/main.tsx");
const css = read("client/src/styles/visual-reset.css");
const pageHero = read("client/src/components/PageHero.tsx");
const button = read("client/src/components/ui/button.tsx");
const card = read("client/src/components/ui/card.tsx");
const input = read("client/src/components/ui/input.tsx");
const tabs = read("client/src/components/ui/tabs.tsx");
const badge = read("client/src/components/ui/badge.tsx");

const proportionImport = main.indexOf('import "./styles/proportion-guards.css"');
const resetImport = main.indexOf('import "./styles/visual-reset.css"');
assert.ok(proportionImport >= 0, "proportion guards devem continuar carregados");
assert.ok(resetImport > proportionImport, "visual-reset deve carregar por último para ser uma camada reversível");
assert.match(main, /prefers-color-scheme:\s*dark/, "primeiro paint deve respeitar tema do sistema quando não houver preferência salva");
assert.match(main, /savedTheme === "dark"/, "preferência escura salva deve continuar autoritativa");
assert.match(main, /savedTheme !== "light" && prefersDark/, "ausência de preferência não pode mais forçar dark mode");
assert.doesNotMatch(main, /if \(savedTheme !== "light"\)\s*\{\s*document\.documentElement\.classList\.add\("dark"\)/,
  "primeiro paint não pode forçar escuro independentemente do sistema");

assert.match(css, /Signature Clinical \/ Premium Product v2/,
  "camada visual deve manter identidade explícita de produto premium v2");
assert.match(css, /--np-premium-surface:/, "design system deve declarar superfície premium sem depender de página específica");
assert.match(css, /--np-premium-shadow-raised:/, "design system deve possuir elevação controlada e reutilizável");
assert.match(css, /--primary:\s*173\s+52%\s+28%/, "modo claro deve usar deep teal institucional com contraste forte");
assert.match(css, /\.dark\s*\{[\s\S]*?--primary:\s*172\s+44%\s+57%/, "dark mode deve ter primary próprio, não mera inversão automática");

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
assert.match(css, /data-testid="patient-cockpit"/,
  "Patient Cockpit deve receber acabamento executivo específico sem alterar o componente clínico");

assert.match(pageHero, /np-page-hero/, "PageHero deve usar superfície editorial canônica");
assert.match(pageHero, /tracking-\[0\.16em\] text-primary/,
  "eyebrow de PageHero deve usar primary pleno sobre a superfície clara");
assert.doesNotMatch(pageHero, /tracking-\[0\.16em\] text-primary\/70/,
  "PageHero não pode reintroduzir contraste insuficiente no eyebrow");
assert.doesNotMatch(pageHero, /-right-12|-bottom-16/,
  "PageHero premium não deve reintroduzir orbs decorativos grandes");

assert.doesNotMatch(button, /hover-elevate|active-elevate-2/,
  "botões premium não devem depender do lift global legado");
assert.match(button, /rounded-\[0\.9rem\]/, "botões devem usar geometria premium consistente");
assert.match(card, /rounded-\[1\.25rem\]/, "cards devem usar raio premium canônico");
assert.match(input, /rounded-\[0\.9rem\]/, "inputs devem compartilhar geometria dos controles premium");
assert.match(tabs, /rounded-\[0\.95rem\]/, "tabs devem usar segmented control premium");
assert.match(badge, /rounded-full/, "badges devem permanecer compactos e silenciosos");

assert.doesNotMatch(css, /\.shadcn-card\s*\{[^}]*display:\s*none/is,
  "cards funcionais não podem ser ocultados");
assert.doesNotMatch(css, /(?:input|textarea|select)[^{]*\{[^}]*display:\s*none/is,
  "controles de formulário não podem ser ocultados");
assert.match(css, /@media \(max-width: 767px\)/, "reset deve manter tratamento mobile explícito");
assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/,
  "motion premium deve respeitar preferência de movimento");

console.log("✓ Signature Clinical v2: premium, acessível e sem remover conteúdo clínico, legal ou controles");

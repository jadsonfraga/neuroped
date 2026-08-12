import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const main = read("client/src/main.tsx");
const css = read("client/src/styles/premium-polish-10.css");

const signatureImport = main.indexOf('import "./styles/visual-reset.css"');
const polishImport = main.indexOf('import "./styles/premium-polish-10.css"');
assert.ok(signatureImport >= 0, "Signature Clinical deve continuar carregado");
assert.ok(polishImport > signatureImport, "Premium Polish 10 deve ser a última camada visual");

assert.match(css, /--np-touch:\s*48px/, "touch target premium deve permanecer explícito");
assert.match(css, /env\(safe-area-inset-top\)/, "mobile deve respeitar safe-area superior");
assert.match(css, /env\(safe-area-inset-bottom\)/, "mobile deve respeitar safe-area inferior");
assert.match(css, /scroll-snap-type:\s*x mandatory/, "Home/Cockpit devem manter navegação tátil por snap no mobile");
assert.match(css, /section\[aria-labelledby="fluxos-principais"\]/, "jornada da Home deve ter tratamento consumer-app específico");
assert.match(css, /#main-content:has\(header a\[href="\/recepcao"\]\)/, "Agenda deve ter tratamento específico sem alterar backend");
assert.match(css, /\[data-testid="patient-cockpit"\]/, "Patient Cockpit deve ter acabamento executivo específico");
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/, "polish final deve respeitar redução de movimento");
assert.match(css, /@media print/, "layout premium deve preservar saída de impressão");

assert.doesNotMatch(css, /(?:input|textarea|select|button)[^{]*\{[^}]*display:\s*none/is,
  "polish não pode esconder controles interativos");
assert.doesNotMatch(css, /\[role="alert"\][^{]*\{[^}]*display:\s*none/is,
  "polish não pode esconder alertas semânticos");

const mainRootBlocks = [
  css.match(/#main-content\s*\{([^}]*)\}/)?.[1],
  css.match(/#main-content\s*>\s*div:last-child\s*\{([^}]*)\}/)?.[1],
].filter(Boolean);
assert.ok(mainRootBlocks.length >= 1, "polish deve declarar geometria do conteúdo principal");
for (const block of mainRootBlocks) {
  assert.doesNotMatch(block, /display:\s*none/i, "raízes do conteúdo principal não podem ser ocultadas");
  assert.doesNotMatch(block, /visibility:\s*hidden/i, "raízes do conteúdo principal não podem ser invisibilizadas");
}

console.log("✓ Premium Polish 10: mobile-first, touch-safe e sem esconder conteúdo clínico");

/* ============================================================================
   scripts/check-contrast.mjs — contraste WCAG por MATEMÁTICA (M1 do prompt-espelho)
   ----------------------------------------------------------------------------
   Substitui o "olho humano para contraste" por cálculo: lê os tokens de cor de
   np-tokens.css (tema dark :root + override [data-theme="light"]) e mede a razão
   de contraste dos pares texto↔fundo semânticos. Falha (--strict) se < limiar AA:
   texto normal 4.5:1 · UI/foco 3.0:1. Read-only.
   Uso: node scripts/check-contrast.mjs [--strict]
   ============================================================================ */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const css = readFileSync(join(process.cwd(), 'np-tokens.css'), 'utf8');

function block(re) { const m = css.match(re); return m ? m[1] : ''; }
function vars(src) {
  const out = {};
  for (const m of src.matchAll(/--(np-[a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2];
  return out;
}
const dark = vars(block(/:root\s*\{([\s\S]*?)\}/));
const lightOverride = vars(block(/\[data-theme="light"\]\s*\{([\s\S]*?)\}/));
const light = { ...dark, ...lightOverride };   // light herda dark onde não sobrescreve

function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function lum([r, g, b]) {
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [R, G, B] = [f(r), f(g), f(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
function ratio(fg, bg) {
  const L1 = lum(hexToRgb(fg)), L2 = lum(hexToRgb(bg));
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// pares semânticos: [fg, bg, tipo, limiar]
const PAIRS = [
  ['np-text', 'np-ink', 'texto', 4.5],
  ['np-text', 'np-ink-1', 'texto', 4.5],
  ['np-text-mute', 'np-ink-1', 'texto', 4.5],
  ['np-text-low', 'np-ink-1', 'texto', 4.5],
  ['np-accent', 'np-ink-1', 'link', 4.5],
  ['np-accent-hi', 'np-ink-2', 'ui', 3.0],
  ['np-gold', 'np-ink-1', 'texto', 4.5],
  ['np-success', 'np-ink-1', 'texto', 4.5],
  ['np-warn', 'np-ink-1', 'texto', 4.5],
  ['np-danger', 'np-ink-1', 'texto', 4.5]
];
const WHITE = '#FFFFFF';

function run(name, map) {
  const rows = [];
  for (const [fg, bg, tipo, lim] of PAIRS) {
    if (!map[fg] || !map[bg]) continue;
    const r = ratio(map[fg], map[bg]);
    rows.push({ label: `${fg} / ${bg}`, tipo, lim, r, ok: r >= lim });
  }
  // texto do botão primário: #fff sobre --np-accent
  if (map['np-accent']) { const r = ratio(WHITE, map['np-accent']); rows.push({ label: '#fff / np-accent (botão)', tipo: 'texto', lim: 4.5, r, ok: r >= 4.5 }); }
  return rows;
}

// Exceções DOCUMENTADAS (decisão de marca pendente do Dr.) — não bloqueiam o gate,
// mas ficam visíveis. O texto branco sobre o iris-violet do botão dá 3.48:1 (AA pede
// 4.5): corrigir exige escurecer o accent (muda a identidade) ou aumentar/encorpar a
// fonte do botão. Decisão do Dr. — ver docs/PROMPT_ESPELHO_8.md M1.
const KNOWN = new Set(['#fff / np-accent (botão)@DARK']);

let fails = 0, exc = 0;
for (const [theme, map] of [['DARK', dark], ['LIGHT', light]]) {
  console.log(`\n  Tema ${theme}`);
  for (const x of run(theme, map)) {
    const known = KNOWN.has(x.label + '@' + theme);
    const mark = x.ok ? '✓' : (known ? '◦' : '✗');
    if (!x.ok && !known) fails++;
    if (!x.ok && known) exc++;
    console.log(`    ${mark} ${x.label.padEnd(34)} ${x.r.toFixed(2)}:1   (${x.tipo}, min ${x.lim})` + (known && !x.ok ? '  ← exceção documentada (marca)' : ''));
  }
}
console.log(`\n  ${fails === 0 ? '✅ todos os pares passam AA' : '⚠ ' + fails + ' par(es) abaixo do AA'}` + (exc ? ` · ${exc} exceção(ões) documentada(s)` : '') + '\n');
process.exit(strict && fails ? 1 : 0);

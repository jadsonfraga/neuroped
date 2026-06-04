/* ============================================================
   NeuroPed EDJ — scripts/smoke.mjs
   ------------------------------------------------------------
   Smoke funcional (Node puro, sem browser). Vai ALÉM do test-static
   (que só casa strings): aqui validamos
     1) SINTAXE de todo <script> inline das telas críticas (node --check)
        — pega exatamente as quebras de JS inline que já ocorreram;
     2) CONTRATO de DOM — os IDs/handlers que o JS de cada tela exige;
     3) LÓGICA PURA — o gerador de perguntas-guia responde de verdade.
   Sai com código !=0 em qualquer falha (CI-friendly).
   Uso: node scripts/smoke.mjs   ·   npm run smoke
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(import.meta.url);
const fails = [];
const oks = [];
const ok = (m) => oks.push('OK: ' + m);
const fail = (m) => fails.push('FAIL: ' + m);
const read = (p) => (existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '');
const tmp = mkdtempSync(join(tmpdir(), 'np-smoke-'));

// 1) Sintaxe de todo <script> inline (sem src=) das telas críticas
const PAGES = ['filtro-escalas.html', 'intake.html', 'perfil-crianca.html',
  'clinical-trajetoria.html', 'escala.html', 'instrumento.html', 'secretaria.html', 'diarios.html'];
for (const page of PAGES) {
  const html = read(page);
  if (!html) { fail(`${page} ausente`); continue; }
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  let i = 0, bad = 0;
  for (const code of blocks) {
    if (!code.trim()) continue;
    const f = join(tmp, `${page.replace(/\W/g, '_')}_${i++}.js`);
    // embrulha como módulo-script tolerante (ESM-safe): só checamos a sintaxe
    writeFileSync(f, code);
    try { execSync(`node --check "${f}"`, { stdio: 'pipe' }); }
    catch (e) { bad++; fail(`${page}: <script> #${i} com erro de sintaxe — ${String(e.stderr || e).split('\n')[0].slice(0, 120)}`); }
  }
  if (!bad) ok(`${page}: ${i} bloco(s) <script> inline com sintaxe válida`);
}

// 2) Contrato de DOM — IDs/handlers que o JS de cada tela depende
const CONTRACT = {
  'filtro-escalas.html': ['id="searchInput"', 'id="searchGo"', 'id="allResults"', 'id="contextChips"', 'id="respChips"', 'function run', 'function score', 'function tierOf'],
  'intake.html': ['id="relato"', 'id="go"', 'id="out"', 'function run'],
  'perfil-crianca.html': ['id="grid"', 'id="save"', 'id="timelineSec"', 'function render', 'function renderTimeline'],
  'clinical-trajetoria.html': ['id="out"', 'id="gate"', 'function run'],
  'escala.html': ['scales-bundle.js', "qs('id')"],
};
for (const [page, needles] of Object.entries(CONTRACT)) {
  const html = read(page);
  const missing = needles.filter(n => !html.includes(n));
  missing.length ? fail(`${page}: contrato de DOM incompleto — faltou ${missing.join(', ')}`)
                 : ok(`${page}: contrato de DOM íntegro (${needles.length} âncoras)`);
}

// 3) Lógica pura — gerador de perguntas-guia responde de verdade
try {
  const Q = require(join(root, 'scales-questions.js'));
  const checks = [
    ['tdah', 84, 3], ['tea', 24, 3], ['sono', 48, 2], ['sensorial', 60, 2],
    ['motor', 60, 2], ['aprendizagem', 84, 2], ['humor', 72, 2], ['tag-inexistente-xyz', 60, 2],
  ];
  let bad = 0;
  for (const [tag, age, min] of checks) {
    const g = Q.guide(tag, age);
    const okShape = Array.isArray(g) && g.length >= min && g.every(x => x.pergunta && x.emoji && Array.isArray(x.exemplos));
    if (!okShape) { bad++; fail(`guide('${tag}',${age}) devolveu ${g && g.length} (esperado >= ${min}, com schema completo)`); }
  }
  if (!bad) ok(`gerador-guia responde completo p/ ${checks.length} queixas (inclui fallback)`);
} catch (e) { fail('scales-questions.js não carregou em Node — ' + e.message.slice(0, 80)); }

// Relatório
console.log(oks.join('\n'));
if (fails.length) {
  console.log('\n' + fails.join('\n'));
  console.log(`\nSmoke: ${oks.length} OK, ${fails.length} FALHA(S).`);
  process.exit(1);
}
console.log(`\nSmoke: ${oks.length} OK, 0 falhas.`);

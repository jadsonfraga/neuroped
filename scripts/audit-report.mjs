/* ============================================================================
   scripts/audit-report.mjs — SCORECARD 7,0 → 9,0 (instrumentação do plano).
   ----------------------------------------------------------------------------
   Mede os déficits que pesam na nota (ver docs/PLANO_7_PARA_9.md) para que o
   progresso seja CIENTÍFICO (cada PR vê a métrica cair). Read-only.
   Uso: node scripts/audit-report.mjs            (informativo, exit 0)
        node scripts/audit-report.mjs --strict   (exit 1 se algum alvo falhar)
   ============================================================================ */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const rows = [];
function metric(nome, valor, alvo, ok, detalhe) { rows.push({ nome, valor, alvo, ok, detalhe }); }

function lsFiles(dir, re) {
  const out = [];
  (function walk(d) {
    let names; try { names = readdirSync(d); } catch { return; }
    for (const n of names) {
      if (['node_modules', '.git', 'dist', 'build'].includes(n)) continue;
      const f = join(d, n);
      const st = statSync(f);
      if (st.isDirectory()) walk(f);
      else if (re.test(n)) out.push(f.slice(root.length + 1));
    }
  })(dir);
  return out;
}

// ── WS1: endpoints /api/* chamados pela SPA mas ausentes em functions/api/ ──
const assetJs = (existsSync(join(root, 'assets')) ? readdirSync(join(root, 'assets')) : [])
  .filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(root, 'assets', f), 'utf8')).join('\n');
const apiCalls = [...new Set([...assetJs.matchAll(/\/api\/([a-z0-9/_-]+)/gi)].map((m) => m[1].replace(/\/$/, '')))]
  .filter((p) => p && !/^v\d/.test(p));
function apiServed(p) {
  const cands = [`functions/api/${p}.js`, `functions/api/${p}.ts`, `functions/api/${p}/index.js`, `functions/api/${p}/index.ts`];
  if (cands.some((c) => existsSync(join(root, c)))) return true;
  // catch-all [[path]] em functions/api
  try { if (readdirSync(join(root, 'functions/api')).some((f) => /\[\[/.test(f))) return true; } catch {}
  return false;
}
const orphans = apiCalls.filter((p) => !apiServed(p));
metric('API órfãos (SPA→404)', orphans.length, 0, orphans.length === 0, orphans.join(', '));

// ── WS2a: sistemas de estilo coexistindo ──
const styleSystems = ['tokens.css', 'np-tokens.css', 'ds-tokens.css', 'app-skin.css', 'np-skin.css',
  'escalas-hero.css', 'premium-override.css', 'design-system-premium.css'].filter((f) => existsSync(join(root, f)));
metric('Sistemas de estilo', styleSystems.length, '≤3', styleSystems.length <= 3, styleSystems.join(', '));

// ── WS2b: cobertura da skin premium ──
const htmls = lsFiles(root, /\.html$/).filter((f) => !f.includes('/'));
const skinned = htmls.filter((f) => /np-skin/.test(readFileSync(join(root, f), 'utf8')));
const cov = Math.round((skinned.length / htmls.length) * 100);
metric('Cobertura skin (np-skin)', `${cov}% (${skinned.length}/${htmls.length})`, '≥60%', cov >= 60, '');

// ── WS3: console.log/.debug em produção (debug noise) ──
const prodJs = lsFiles(root, /\.js$/).filter((f) => !/^(scripts|tests|assets|node_modules)\//.test(f) && !/clinical-.*tests/.test(f));
let consoleHits = 0; const consoleFiles = [];
for (const f of prodJs) { const c = (readFileSync(join(root, f), 'utf8').match(/console\.(log|debug)\(/g) || []).length; if (c) { consoleHits += c; consoleFiles.push(f); } }
metric('console.log/.debug (prod)', consoleHits, 0, consoleHits === 0, consoleFiles.join(', '));

// ── WS5: marcadores de conflito ──
const conf = lsFiles(root, /\.(js|json|html|css|mjs|yml|md)$/).filter((f) => /^(?:<{7}|>{7})/m.test(readFileSync(join(root, f), 'utf8')) && !/PLANO_7|PROMPT/.test(f));
metric('Marcadores de conflito', conf.length, 0, conf.length === 0, conf.join(', '));

// ── Relatório ──
console.log('\n  NEUROPED · SCORECARD 7,0 → 9,0  (docs/PLANO_7_PARA_9.md)\n  ' + '─'.repeat(58));
let fails = 0;
for (const r of rows) {
  const mark = r.ok ? '✓' : '⚠';
  if (!r.ok) fails++;
  console.log(`  ${mark}  ${r.nome.padEnd(26)} ${String(r.valor).padStart(10)}   alvo ${r.alvo}`);
  if (!r.ok && r.detalhe) console.log(`        └ ${r.detalhe.slice(0, 120)}`);
}
console.log('  ' + '─'.repeat(58));
console.log(`  ${rows.length - fails}/${rows.length} métricas no alvo.` + (fails ? `  ${fails} déficit(s) restante(s).` : '  ✅ tudo no alvo.') + '\n');
process.exit(strict && fails ? 1 : 0);

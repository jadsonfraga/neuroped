/* ============================================================================
   scripts/check-no-conflicts.mjs — guarda anti-marcador de conflito de merge.
   ----------------------------------------------------------------------------
   Falha se QUALQUER arquivo de código tiver marcadores `<<<<<<<` / `>>>>>>>`
   commitados. Causa-raiz do incidente que deixou package.json/sw.js inválidos
   (PWA quebrado em produção). Checa só `<<<<<<<`/`>>>>>>>` (nunca legítimos),
   não `=======` (que é régua de markdown). Roda no verify e no CI.
   ============================================================================ */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const IGNORE_DIRS = new Set(['node_modules', '.git', '.cache', 'dist', 'build', 'assets']);
const EXT = /\.(js|mjs|cjs|ts|json|html|css|md|yml|yaml|sql)$/i;
const MARKER = /^(?:<{7}|>{7})(?:\s|$)/m;   // <<<<<<< ou >>>>>>> no início de linha

const hits = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full); continue; }
    if (!EXT.test(name)) continue;
    const src = readFileSync(full, 'utf8');
    if (MARKER.test(src)) {
      const rel = full.slice(root.length + 1);
      const line = src.split('\n').findIndex((l) => /^(?:<{7}|>{7})(?:\s|$)/.test(l)) + 1;
      hits.push(`${rel}:${line}`);
    }
  }
}
walk(root);

if (hits.length) {
  console.error('✗ Marcadores de conflito de merge encontrados (NÃO commitar conflitos):\n  ' + hits.join('\n  '));
  console.error('  Resolva o conflito e remova as linhas <<<<<<< / ======= / >>>>>>> antes do merge.');
  process.exit(1);
}
console.log('✓ Sem marcadores de conflito de merge no código.');
process.exit(0);

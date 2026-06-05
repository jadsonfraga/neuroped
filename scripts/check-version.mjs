/* ============================================================================
   scripts/check-version.mjs — trava de DRIFT de versão (M4 / vetor V1).
   ----------------------------------------------------------------------------
   Exige que package.json .version == sw.js CACHE_NAME. (verificar-app.html VERSAO
   e o selo em app-polish-mobile.js já são cobertos pelo test-static.) Junto, a
   versão operacional vira fonte única. Sai !=0 se divergirem.
   ============================================================================ */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const m = sw.match(/CACHE_NAME\s*=\s*['"]neuroped-edj-v([0-9.]+)['"]/);
const swV = m ? m[1] : null;

const fails = [];
if (!swV) fails.push('sw.js: CACHE_NAME não casou neuroped-edj-vX.Y.Z');
if (swV && swV !== pkg) fails.push(`sw.js (${swV}) != package.json (${pkg})`);

if (fails.length) {
  console.error('✗ Versão dissonante (fonte única violada):\n  ' + fails.join('\n  '));
  console.error('  Sincronize package.json e sw.js (CACHE_NAME). O selo/verificar são travados pelo test-static.');
  process.exit(1);
}
console.log(`✓ Versão única e coerente: v${pkg} (package.json = sw.js)`);
process.exit(0);

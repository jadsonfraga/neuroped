import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const files = ['index.html', '404.html', 'manifest.json', 'sw.js', ...readdirSync('assets').filter((f) => f.endsWith('.js')).map((f) => join('assets', f))];
const errors = [];
const warnings = [];
for (const file of files) {
  if (!statSync(file).isFile()) continue;
  const text = readFileSync(file, 'utf8');
  if (/Perplexity Computer|data-pplx-inline-edit|INLINE_EDIT_CAPTURE_REQUEST/.test(text)) errors.push(`${file}: metadado de edição/protótipo encontrado`);
  if (/Soli Deo Gloria|\bSDG\b/.test(text) && !file.startsWith('docs/')) warnings.push(`${file}: lema técnico/espiritual detectado fora de documentação`);
  if (/showNotification\("[^"]*[💊✅⏰]/.test(text)) warnings.push(`${file}: notificação do service worker ainda usa emoji em microcopy operacional`);
}
if (errors.length) {
  console.error('Lint estático com errors:\n' + errors.join('\n'));
  process.exit(1);
}
if (warnings.length) console.warn('Lint estático com warnings:\n' + warnings.join('\n'));
console.log(`Lint estático aprovado com ${warnings.length} warning(s) não bloqueante(s).`);

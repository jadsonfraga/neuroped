#!/usr/bin/env node
/* Auditoria da taxonomia contra o catálogo REAL.
   Carrega os scales-*.js num shim de window, classifica cada instrumento e
   reporta a distribuição de tipos + casos suspeitos (default/questionario alto,
   teste direto não detectado etc.). Diagnóstico — não altera nada. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const tax = require(join(root, 'scales-taxonomy.js'));

// shim de window p/ rodar os IIFEs dos catálogos
const win = {};
const files = readdirSync(root).filter(f => /^scales-.*\.js$/.test(f) && f !== 'scales-bundle.js' && f !== 'scales-taxonomy.js' && f !== 'scales-questions.js' && f !== 'scales-progress.js' && f !== 'scales-enhance.js');
for (const f of files) {
  try { new Function('window', 'self', 'document', readFileSync(join(root, f), 'utf8'))(win, win, { addEventListener() {} }); }
  catch (e) { /* alguns arquivos podem depender de DOM; ignora */ }
}

// coleta arrays de objetos-escala (com id/title)
const scales = [];
for (const k of Object.keys(win)) {
  const v = win[k];
  if (Array.isArray(v)) v.forEach(s => { if (s && typeof s === 'object' && (s.id || s.title)) scales.push(s); });
}
// dedup por id
const seen = {}, uniq = [];
scales.forEach(s => { const id = s.id || s.title; if (!seen[id]) { seen[id] = 1; uniq.push(s); } });

const dist = {};
const samples = {};
uniq.forEach(s => {
  const k = tax.classify(s).kind;
  dist[k] = (dist[k] || 0) + 1;
  (samples[k] = samples[k] || []).push(s.title || s.id);
});

console.log('Auditoria da taxonomia — catálogo real');
console.log('='.repeat(48));
console.log('instrumentos únicos classificados:', uniq.length, '\n');
Object.keys(dist).sort((a, b) => dist[b] - dist[a]).forEach(k => {
  console.log(String(dist[k]).padStart(4), k);
});
console.log('\n— amostras por tipo (até 4) —');
Object.keys(samples).forEach(k => {
  console.log('\n[' + k + ']');
  samples[k].slice(0, 4).forEach(t => console.log('   · ' + String(t).slice(0, 70)));
});
// sinal de heurística fraca: muitos "questionario" (default)
const pctDefault = uniq.length ? Math.round(100 * (dist.questionario || 0) / uniq.length) : 0;
console.log('\ndefault (questionario): ' + pctDefault + '% — ' + (pctDefault > 60 ? '⚠ heurística pode estar fraca' : 'ok'));

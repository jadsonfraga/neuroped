#!/usr/bin/env node
/* PVI-L — gerador da Declaração de Lacunas e Pendências a partir do registro VIVO.
   Lê evidence-registry.json e emite, sem maquiar, o estado de proveniência de cada
   instrumento (✔ verificado / ◻ operador / ⚠ ausente / _needs_curation pendente).
   Não inventa nada: só transcreve o que está no dado. Uso: node scripts/pvi-l-report.mjs */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ev = JSON.parse(readFileSync(join(root, 'evidence-registry.json'), 'utf8'));
const inst = ev.instruments || {};
const ids = Object.keys(inst).filter(k => k.charAt(0) !== '_');

const pend = [], flagged = [], clean = [];
for (const id of ids) {
  const e = inst[id];
  if (e._needs_curation === true) {
    pend.push({ id, note: e._note || 'sem referência-âncora; aguardando PMID.' });
    continue;
  }
  const vs = e.validation_sources || [];
  const marks = vs.map(s => String(s.verification || '⚠ sem verification')).join(' | ');
  if (/◻|⚠/.test(marks)) flagged.push({ id, marks, pmids: vs.map(s => s.pmid).join(', ') });
  else clean.push({ id, pmids: vs.map(s => s.pmid).join(', ') });
}

const L = [];
L.push('# PVI-L — Declaração de Lacunas e Pendências (gerado de evidence-registry.json)');
L.push('');
L.push('## O que ficou de fora — e por quê');
L.push('');
L.push('### Pendentes (`_needs_curation` — slot rastreável, sem claim)');
pend.length ? pend.forEach(p => L.push(`- **${p.id}** — ${p.note}`)) : L.push('- (nenhum)');
L.push('');
L.push('### Curados com ressalva (`◻` operador / `⚠` ausente da fonte)');
flagged.length ? flagged.forEach(f => L.push(`- **${f.id}** (PMID ${f.pmids}) — ${f.marks}`)) : L.push('- (nenhum)');
L.push('');
L.push('### Curados totalmente verificados na fonte (`✔`)');
clean.length ? clean.forEach(c => L.push(`- **${c.id}** (PMID ${c.pmids})`)) : L.push('- (nenhum)');
L.push('');
L.push('## Limite real declarado');
L.push('- ' + (ev._meta.env_limit || 'não declarado.'));
L.push('');
L.push('## Para fechar 100% (acionável)');
pend.forEach(p => L.push(`- **${p.id}:** enviar PMID seminal citável da fonte primária.`));
flagged.forEach(f => L.push(`- **${f.id}:** reconfirmar na fonte os valores marcados ◻/⚠ (ou enviar o número conferido).`));
L.push('');
L.push('## Portão');
L.push(`- ✔ ${ids.length} instrumentos; ${clean.length} verificados, ${flagged.length} com ressalva, ${pend.length} pendentes.`);
L.push('- ✔ nenhuma pendência mascarada: pendentes não expõem claim; ressalvas declaradas no dado.');

console.log(L.join('\n'));

// Gera scales-bundle.js concatenando os módulos de escalas na ordem de carga
// do filtro-escalas.html — 13 requests viram 1. Rode após editar qualquer
// scales-*.js: `node scripts/build-scales-bundle.mjs`. O test-static valida frescor.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const BUNDLE_ORDER = [
  'scales-enhance.js',
  'scales-editorial.js',
  'scales-453-authorial.js',
  'scales-global-max.js',
  'scales-featured-extra.js',
  'scales-featured-10.js',
  'scales-priority-uploaded.js',
  'scales-diarios-uteis.js',
  'scales-autorais-npe.js',
  'scales-impacto-medicacao.js',
  'scales-oficiais.js',
  'scales-curate.js',
  'scales-red-flags.js',
  'scales-direct-tasks.js',          // biblioteca de tarefas diretas (fonte de verdade)
  'scales-direct-tests-catalog.js',  // promove as tarefas a instrumentos filtráveis (top-3 pré-consulta)
  'scales-med-eficacia.js',          // escala autoral de eficácia da medicação (pré-consulta)
  'scales-intl-livres.js',           // curadoria de instrumentos internacionais de licença livre (referência)
  'scales-smart-rank.js',            // motor de seleção inteligente (expansão por construto + mix de modalidade)
  'scales-official-questions.js',    // ÚLTIMO: perguntas-guia autorais p/ instrumentos de referência (abrem completos)
];

export function buildBundle(root = process.cwd()) {
  const header = '/* scales-bundle.js — GERADO por scripts/build-scales-bundle.mjs.\n'
    + '   NÃO editar à mão. Edite os scales-*.js e rode o build. */\n';
  const parts = BUNDLE_ORDER.map((f) => {
    const code = readFileSync(join(root, f), 'utf8');
    return '\n/* ===== ' + f + ' ===== */\n' + code;
  });
  return header + parts.join('\n');
}

// execução direta (não em import)
if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildBundle();
  writeFileSync(join(process.cwd(), 'scales-bundle.js'), out);
  console.log('scales-bundle.js gerado (' + BUNDLE_ORDER.length + ' módulos, ' + out.length + ' bytes)');
}

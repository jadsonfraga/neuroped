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
  'scales-oficiais-lote3.js',        // lote 3: instrumentos padronizados (TEA/TDAH/neuropsico/adaptativo) como referência
  'scales-curate.js',
  'scales-red-flags.js',
  'scales-direct-tasks.js',          // biblioteca de tarefas diretas (fonte de verdade)
  'scales-direct-tests-catalog.js',  // promove as tarefas a instrumentos filtráveis (top-3 pré-consulta)
  'scales-med-eficacia.js',          // escala autoral de eficácia da medicação (pré-consulta)
  'scales-intl-livres.js',           // curadoria de instrumentos internacionais de licença livre (referência)
  'scales-autoral-funcional.js',     // autorais Dr. Jadson: autonomia, risco cognitivo, risco de dislexia
  'scales-sensorial-perfil.js',      // autoral: Perfil Sensorial NeuroPed (7 sistemas × 5 faixas etárias)
  'scales-tempo-tela.js',            // autoral: Tempo de Tela e Hábitos Digitais (7 dimensões × 5 faixas)
  'scales-coordenacao-motora.js',    // autoral: Coordenação Motora e Praxia / TDC (7 áreas × 5 faixas)
  'scales-estudo-restrito.js',       // proprietários como REFERÊNCIA DE ESTUDO (senha, não clínico)
  'scales-smart-rank.js',            // motor de seleção inteligente (expansão por construto + mix de modalidade)
  'scales-official-questions.js',    // perguntas-guia autorais p/ instrumentos de referência (abrem completos)
  'scales-robustez.js',              // ÚLTIMO: aprofunda (facetas autorais extras) + orientação de interpretação
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

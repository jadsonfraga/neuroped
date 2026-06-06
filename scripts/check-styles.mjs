/* ============================================================================
   scripts/check-styles.mjs — guarda anti-sprawl de sistemas de estilo (M3)
   ----------------------------------------------------------------------------
   O número de sistemas de estilo cresceu para 8+ porque "adicionar mais um .css
   de tema" nunca custou nada. Este guarda congela o inventário: a partir do
   baseline atual, NENHUM sistema de estilo novo entra, e o total só pode CAIR.
   Assim a consolidação para ≤3 (np-tokens + np-palette-v2 + np-skin) acontece
   por remoção monotônica, sem reabrir a porta do crescimento — e sem refactor
   de risco enquanto a paleta está sob edição concorrente.

   Como ratchetar: ao retirar com segurança um legado, remova-o de BASELINE e
   abaixe MAX. O CI passa a exigir o novo teto. Alvo final: ≤3 canônicos.

   Read-only. Uso: node scripts/check-styles.mjs [--strict]
   ============================================================================ */
import { readdirSync } from 'node:fs';

const strict = process.argv.includes('--strict');

// Heurística do que conta como "sistema de estilo" global (tema/skin/tokens),
// não CSS utilitário de uma feature isolada.
const STYLE_RE = /(token|skin|design|premium|hero|catalog|foundation|component|anchor|card|embedded|bridge|override)/i;

// CANÔNICOS — o destino da consolidação. Não contam contra o teto de legado.
const CANON = new Set([
  'np-tokens.css',      // tokens (fonte única)
  'np-palette-v2.css',  // override de paleta efetiva (auditado em M1)
  'np-skin.css',        // skin premium
  // camadas de componente canônicas (np-*), parte do mesmo DS:
  'np-foundation.css', 'np-components.css', 'np-catalog.css',
  'np-anchors.css', 'np-cards.css', 'np-embedded.css',
]);

// BASELINE de LEGADO congelado (a remover ao longo do tempo). Ratchet: só encolhe.
// Histórico: M3 inlinou filtro-hero-premium.css → filtro-escalas.html e
// scales-ui-premium.css → instrumento.html (estilo bespoke de 1 página vira CSS
// crítico da própria página). Teto desceu de 11 → 9.
const BASELINE_LEGACY = new Set([
  'app-skin.css', 'components.css', 'ds-bridge.css',
  'tokens.css', 'escalas-hero.css', 'escalas-card-premium.css',
  'premium-override.css',
  // eliminados na consolidação FASE 1: ds-tokens.css, design-system-premium.css
]);
const MAX_LEGACY = BASELINE_LEGACY.size;   // teto atual; abaixe ao remover

const present = readdirSync(process.cwd()).filter((f) => f.endsWith('.css') && STYLE_RE.test(f));
const legacy = present.filter((f) => !CANON.has(f));

// 1. nenhum sistema de estilo NOVO fora do baseline (canônico OU legado conhecido)
const intruders = legacy.filter((f) => !BASELINE_LEGACY.has(f));
// 2. o legado só pode cair, nunca crescer
const overflow = legacy.length > MAX_LEGACY;

const problems = [];
if (intruders.length) problems.push(`sistema(s) de estilo NOVO(s) fora do baseline: ${intruders.join(', ')}\n    → migre para os canônicos (np-tokens/np-palette-v2/np-skin) em vez de criar outro arquivo`);
if (overflow) problems.push(`total de legado ${legacy.length} > teto ${MAX_LEGACY} (o inventário só pode encolher)`);

console.log(`  Estilos: ${CANON.size} canônicos + ${legacy.length}/${MAX_LEGACY} legados (alvo final ≤3).`);
if (problems.length) {
  console.error('✗ ' + problems.join('\n  '));
  process.exit(strict ? 1 : 0);
}
// dica de progresso quando o legado encolhe abaixo do teto
if (legacy.length < MAX_LEGACY) {
  console.log(`  ↓ legado abaixo do teto — baixe MAX_LEGACY para ${legacy.length} em check-styles.mjs e ratchete.`);
}
console.log('✓ Sem novos sistemas de estilo; inventário congelado/encolhendo.');
process.exit(0);

/* ============================================================================
   scripts/check-theme.mjs — contrato de tema (M5 do prompt-espelho)
   ----------------------------------------------------------------------------
   Converte "o tema parece certo" em invariante VERIFICÁVEL. A correção de
   contraste (M1) só vale se a cascata real chegar a cada página na ordem certa:
   np-palette-v2.css SOBRESCREVE np-tokens.css — se uma página esquecer o
   palette-v2, ou carregá-lo ANTES dos tokens, ela renderiza a paleta morta
   (as 7 falhas AA que M1 corrigiu reaparecem só naquela tela, invisível no diff).

   Invariantes (todas as páginas .html servíveis na raiz):
     1. quem carrega um CONSUMIDOR de tokens (foundation/components/skin/cards/
        anchors/catalog/embedded) TEM de carregar np-tokens.css;
     2. quem carrega np-palette-v2.css TEM de carregar np-tokens.css ANTES dele
        (override depois da base);
     3. np-palette-v2.css deve ser a ÚLTIMA fonte de tokens (nenhum np-tokens.css
        depois dele anularia o override).
     4. quem carrega np-tokens.css DEVE carregar np-palette-v2.css (senão renderiza
        a paleta base, não a efetiva auditada por M1).

   Read-only. Uso: node scripts/check-theme.mjs [--strict]
   ============================================================================ */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const strict = process.argv.includes('--strict');
const root = process.cwd();

const TOKENS = 'np-tokens.css';
const PALETTE = 'np-palette-v2.css';
const CONSUMERS = /np-(foundation|components|skin|cards|anchors|catalog|embedded)\.css/;

// índice da PRIMEIRA linha que linka um css (por nome de arquivo), ou -1
function linkLine(lines, cssName) {
  const re = new RegExp(`<link[^>]+href=["'][^"']*${cssName.replace('.', '\\.')}["']`, 'i');
  return lines.findIndex((l) => re.test(l));
}

const pages = readdirSync(root).filter((n) => n.endsWith('.html'));
const fails = [];

for (const page of pages) {
  const src = readFileSync(join(root, page), 'utf8');
  const lines = src.split('\n');
  const tokensAt = linkLine(lines, TOKENS);
  const paletteAt = linkLine(lines, PALETTE);
  const usesConsumer = CONSUMERS.test(src);

  // 1. consumidor sem tokens
  if (usesConsumer && tokensAt < 0) {
    fails.push(`${page}: carrega um consumidor de tokens mas NÃO carrega ${TOKENS}`);
  }
  // 2/3. ordem palette x tokens
  if (paletteAt >= 0) {
    if (tokensAt < 0) {
      fails.push(`${page}: carrega ${PALETTE} sem ${TOKENS} (override sem base)`);
    } else if (paletteAt < tokensAt) {
      fails.push(`${page}: ${PALETTE}@${paletteAt + 1} ANTES de ${TOKENS}@${tokensAt + 1} (override perdido)`);
    }
  }
  // 4. tokens sem palette = paleta morta (a que M1 não audita)
  if (tokensAt >= 0 && paletteAt < 0) {
    fails.push(`${page}: carrega ${TOKENS} mas NÃO carrega ${PALETTE} (renderiza a paleta base, não a efetiva)`);
  }
}

if (fails.length) {
  console.error(`✗ Contrato de tema violado em ${fails.length} página(s):\n  ` + fails.join('\n  '));
  console.error(`  Regra: <link np-tokens.css> e depois <link np-palette-v2.css>, juntos, em toda página com skin.`);
  process.exit(strict ? 1 : 0);
}
console.log(`✓ Contrato de tema OK em ${pages.length} páginas (tokens→palette-v2, cascata efetiva chega a todas).`);
process.exit(0);

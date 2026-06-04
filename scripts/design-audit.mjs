#!/usr/bin/env node
/* NeuroPed SDG — design-audit.mjs
 *
 * Fase 2 da spec SUPERNEUROPED: auditoria de valores crus.
 * Lista todos os arquivos com valores de design fora dos tokens.
 *
 * Usage:
 *   node scripts/design-audit.mjs            # relatorio resumido
 *   node scripts/design-audit.mjs --json     # JSON estruturado (CI)
 *   node scripts/design-audit.mjs --strict   # exit 1 se houver QUALQUER pendencia
 *                                             (so na Onda 4 / "zero legacy")
 *   node scripts/design-audit.mjs --check     # GATE de NAO-REGRESSAO (CI por PR):
 *                                             exit 1 se o total subir acima do baseline.
 *                                             Migracao (total cai) passa e pode "catracar".
 *   node scripts/design-audit.mjs --update-baseline  # grava o total atual como baseline
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const asJson  = args.includes('--json');
const strict  = args.includes('--strict');
const check   = args.includes('--check');
const updateBaseline = args.includes('--update-baseline');

const BASELINE_PATH = join(root, 'scripts', 'design-audit-baseline.json');
function readBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); }
  catch { return null; }
}

// Arquivos canonicos do design system (fonte da verdade)
const TOKEN_FILES = new Set(['tokens.css', 'components.css']);

// Arquivos a ignorar (assets/build, configs)
const IGNORE_DIRS = new Set(['node_modules', '.git', '.cache', 'dist', 'build', 'assets']);
const IGNORE_FILES = new Set([
  'tokens.css', 'components.css',
  'design-system-premium.css',  // legado, sera migrado
  'safe-public-layer.css',       // overlay especifico, ok
]);

// Padroes que ainda sao cru (procurar fora de tokens):
const PATTERNS = {
  hex_color:    /#[0-9a-fA-F]{3,8}\b/g,
  rgb_color:    /\b(?:rgb|rgba|hsl|hsla)\(/g,
  // px crus FORA de var(--...). clamp() e calc() com var() sao ok.
  px_value:     /\b\d+(?:\.\d+)?px\b/g,
  // box-shadow nao-token: regra inteira sem var(--shadow-*)
  shadow_inline: /box-shadow\s*:\s*(?!var\(--shadow)[^;}]+(?:;|})/g,
  // border-radius cru: regra sem var(--radius-*)
  border_radius: /border-radius\s*:\s*(?!var\(--radius)[^;}]+(?:;|})/g,
  // font-size cru: regra sem var(--t-*-size). clamp() ainda conta.
  font_size:    /font-size\s*:\s*(?!var\(--t-)[^;}]+(?:;|})/g,
};

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel  = full.slice(root.length + 1);
    if (IGNORE_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) { walk(full, acc); continue; }
    if (/\.(css|html)$/i.test(name) && !IGNORE_FILES.has(name)) acc.push(rel);
  }
}

function scan(file) {
  const src = readFileSync(join(root, file), 'utf8');
  const findings = {};
  // Para HTML, so olhamos dentro de <style> ... </style>
  let css = src;
  if (file.endsWith('.html')) {
    const styles = src.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
    css = styles.join('\n');
    if (!css) return null;
  }
  // Conta ocorrencias unicas (Set para nao inflar)
  for (const [name, re] of Object.entries(PATTERNS)) {
    const hits = css.match(re);
    if (hits && hits.length) findings[name] = hits.length;
  }
  return Object.keys(findings).length ? findings : null;
}

function main() {
  const files = [];
  walk(root, files);
  const report = {};
  let totalFindings = 0;
  for (const f of files.sort()) {
    const r = scan(f);
    if (r) {
      report[f] = r;
      totalFindings += Object.values(r).reduce((a, b) => a + b, 0);
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    files_scanned: files.length,
    files_with_findings: Object.keys(report).length,
    total_findings: totalFindings,
    report
  };

  if (asJson) { console.log(JSON.stringify(summary, null, 2)); }
  else {
    console.log('NeuroPed Design Audit (fase 2 SUPERNEUROPED)');
    console.log('='.repeat(60));
    console.log(`Arquivos varridos: ${summary.files_scanned}`);
    console.log(`Com valores crus:  ${summary.files_with_findings}`);
    console.log(`Total de hits:     ${summary.total_findings}\n`);
    const top = Object.entries(report)
      .map(([f, r]) => [f, Object.values(r).reduce((a,b)=>a+b,0), r])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25);
    console.log('Top 25 (mais valores crus):');
    for (const [f, n, r] of top) {
      const parts = Object.entries(r).map(([k, v]) => `${k}:${v}`).join(' · ');
      console.log(`  ${String(n).padStart(5)} ${f}  (${parts})`);
    }
    console.log('\nUse --json para saida estruturada, --strict para falhar em CI.');
    console.log('Migracao tela a tela (fase 4) reduz isso. Nao ativar --strict ate fase 4 fechar.');
  }

  // --update-baseline: grava o total atual como teto permitido.
  if (updateBaseline) {
    const payload = {
      generated_at: new Date().toISOString(),
      files_scanned: summary.files_scanned,
      files_with_findings: summary.files_with_findings,
      max_total_findings: totalFindings,
      note: 'Gate de nao-regressao. design-audit --check falha se o total subir acima deste numero. A migracao (Ondas 1-4) so pode FAZER cair este teto, nunca subir. Atualize com --update-baseline DEPOIS de migrar uma tela.'
    };
    writeFileSync(BASELINE_PATH, JSON.stringify(payload, null, 2) + '\n');
    if (!asJson) console.log(`\nBaseline atualizado: max_total_findings = ${totalFindings} (${BASELINE_PATH})`);
    return;
  }

  // --check: GATE de nao-regressao por delta contra o baseline.
  if (check) {
    const baseline = readBaseline();
    if (!baseline || typeof baseline.max_total_findings !== 'number') {
      console.error('design-audit --check: baseline ausente/invalido em scripts/design-audit-baseline.json. Rode `node scripts/design-audit.mjs --update-baseline`.');
      process.exit(1);
    }
    const max = baseline.max_total_findings;
    if (totalFindings > max) {
      console.error(`\n❌ REGRESSAO VISUAL: total de valores crus subiu de ${max} (baseline) para ${totalFindings} (+${totalFindings - max}).`);
      console.error('   Tela nova/tocada deve consumir tokens.css + components.css (.np-*), sem hex/rgb/px/raio/sombra/fonte/motion crus.');
      console.error('   Rode `node scripts/design-audit.mjs` para ver os ofensores. Nao subir o baseline para "passar".');
      process.exit(1);
    }
    if (totalFindings < max) {
      console.log(`\n✅ OK e MELHOROU: ${totalFindings} <= baseline ${max} (-${max - totalFindings}). Considere catracar: \`node scripts/design-audit.mjs --update-baseline\`.`);
    } else {
      console.log(`\n✅ OK: ${totalFindings} == baseline ${max}. Sem regressao.`);
    }
    return;
  }

  if (strict && totalFindings > 0) process.exit(1);
}

main();

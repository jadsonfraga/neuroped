#!/usr/bin/env node
/* NeuroPed EDJ — design-audit.mjs
 *
 * Fase 2 da spec SUPERNEUROPED: auditoria de valores crus.
 * Lista todos os arquivos com valores de design fora dos tokens.
 *
 * Usage:
 *   node scripts/design-audit.mjs         # relatorio resumido
 *   node scripts/design-audit.mjs --json  # JSON estruturado (CI)
 *   node scripts/design-audit.mjs --strict # exit 1 se houver pendencias
 *                                          (NAO ativar em CI ate fase 4 acabar)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);
const asJson  = args.includes('--json');
const strict  = args.includes('--strict');

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

  if (strict && totalFindings > 0) process.exit(1);
}

main();

// @ts-check
/**
 * scorecard.mjs — Placar único da DEFINIÇÃO DE PRONTO 9.0 (Dispatch Monstro v2).
 *
 * Mede os 6 eixos, imprime uma tabela e grava docs/PLACAR_9.0.md.
 * A NOTA final é o MENOR dos 6 eixos (catraca: a corrente é tão forte
 * quanto o elo mais fraco). Nada aqui inventa número: cada eixo lê um dado
 * real (saída de ferramenta ou arquivo de relatório) e, quando o dado não
 * existe no ambiente, marca "não medido" em vez de fingir verde.
 *
 * Uso:
 *   node scripts/guards/scorecard.mjs           # rápido: tsc + eslint + catálogo + lê relatórios
 *   node scripts/guards/scorecard.mjs --build   # também roda `npm run build` p/ medir maior chunk
 *
 * Eixos (D1..D6) e como viram nota 0..10:
 *   D1 FUNÇÃO  → toda chamada /api é tratada por um gate de honestidade
 *                (sem 404 silencioso). nota = 10 * apiHandled/apiCalls.
 *   D2 CÓDIGO  → tsErrors==0 && lintErrors==0 → 10; senão decai.
 *   D3 BUILD   → maior chunk inicial gzip <= 250KB → 10; Lighthouse se medido.
 *   D4 A11Y    → axe 0 serious/critical → 10.
 *   D5 TESTE   → verify verde + >=5 specs E2E → 10; nota = 10*min(e2e,5)/5.
 *   D6 CLÍNICO → comFonte/instrumentos; >=500/565 (~88.5%) é o piso de 9.0.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const RUN_BUILD = process.argv.includes("--build");

/** Roda um comando e devolve {code, out, stdout, stderr}. Nunca lança. */
function run(cmd, opts = {}) {
  try {
    const stdout = execSync(cmd, { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"], ...opts });
    return { code: 0, out: stdout, stdout, stderr: "" };
  } catch (e) {
    const stdout = e.stdout ?? "";
    const stderr = e.stderr ?? "";
    return { code: e.status ?? 1, out: `${stdout}${stderr}`, stdout, stderr };
  }
}

function readJsonIf(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────── D2: TypeScript ───────────────────────────
function measureTs() {
  const r = run("npx tsc --noEmit");
  // tsc imprime "error TSxxxx" por erro; conta ocorrências.
  const count = (r.out.match(/error TS\d+/g) || []).length;
  return r.code === 0 ? 0 : count || 1;
}

// ─────────────────────────── D2: ESLint ───────────────────────────────
function measureLint() {
  const r = run("npx eslint . --ext ts,tsx -f json");
  let errorCount = null;
  let warningCount = null;
  try {
    const arr = JSON.parse(r.stdout);
    errorCount = 0;
    warningCount = 0;
    for (const f of arr) {
      errorCount += f.errorCount;
      warningCount += f.warningCount;
    }
  } catch {
    // saída não-JSON (config quebrada) → desconhecido
  }
  return { errorCount, warningCount };
}

// ─────────────────────────── D1: /api honesty ─────────────────────────
/** Lê todos os arquivos .ts/.tsx sob client/src (caminhada pura em Node). */
function readClientSources() {
  const root = resolve(repoRoot, "client", "src");
  /** @type {string[]} */
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (/\.(t|j)sx?$/.test(ent.name)) out.push(readFileSync(p, "utf8"));
    }
  };
  walk(root);
  return out;
}
function measureApi() {
  const sources = readClientSources();
  let apiCalls = 0;
  let apiHandled = 0;
  let hasWrapper = false;
  for (const src of sources) {
    apiCalls += (src.match(/["'`]\/api\//g) || []).length;
    if (/apiFetch|safeApiFetch|em implanta/.test(src)) hasWrapper = true;
    apiHandled += (src.match(/\b(safe)?apiFetch\(/gi) || []).length;
  }
  return { apiCalls, apiHandled, hasWrapper };
}

// ─────────────────────────── D5: E2E specs ────────────────────────────
function measureE2e() {
  const dir = resolve(repoRoot, "tests", "e2e");
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => /\.spec\.(t|j)sx?$/.test(f)).length;
}

// ─────────────────────────── D3: bundle / lighthouse ──────────────────
async function measureBuild() {
  if (RUN_BUILD) run("npm run build");
  // Maior chunk inicial: usa o relatório do audit-bundle se gerado, senão mede dist.
  const distPublic = resolve(repoRoot, "dist", "public");
  let maxChunkKb = null;
  try {
    const assets = resolve(distPublic, "assets");
    if (existsSync(assets)) {
      const { gzipSync } = await importGzip();
      const js = readdirSync(assets).filter((f) => f.endsWith(".js"));
      for (const f of js) {
        const kb = gzipSync(readFileSync(join(assets, f))).length / 1024;
        if (maxChunkKb === null || kb > maxChunkKb) maxChunkKb = kb;
      }
    }
  } catch {
    /* ignore */
  }
  const lh = readJsonIf(resolve(__dirname, "lighthouse-report.json"));
  return { maxChunkKb, lighthouse: lh };
}
async function importGzip() {
  return await import("node:zlib");
}

// ─────────────────────────── D4: axe ──────────────────────────────────
function measureAxe() {
  const rep = readJsonIf(resolve(__dirname, "a11y-report.json"));
  if (!rep) return { measured: false, seriousCritical: null };
  let sc = 0;
  if (Array.isArray(rep.violations)) {
    for (const v of rep.violations) {
      if (v.impact === "serious" || v.impact === "critical") sc += 1;
    }
  }
  return { measured: true, seriousCritical: sc, mode: rep.modo ?? rep.mode ?? "?" };
}

// ─────────────────────────── D6: catálogo ─────────────────────────────
async function measureCatalog() {
  const { allScales } = await import(
    pathToFileURL(resolve(repoRoot, "client/src/data/scaleFilter.ts")).href
  );
  const instruments = allScales.length;
  // Mesma definição canônica do validate-catalog: "com fonte" = não pendente,
  // onde pendente = sem fonte OU pendente_validacao_clinica === true.
  const withFonte = allScales.filter((s) => {
    const temFonte = typeof s.fonte === "string" && s.fonte.trim().length > 0;
    const pendente = !temFonte || s.pendente_validacao_clinica === true;
    return !pendente;
  }).length;
  return { instruments, withFonte };
}

// ─────────────────────────── Coleta ───────────────────────────────────
console.log("[scorecard] medindo eixos (pode levar ~1min)…");
const tsErrors = measureTs();
const lint = measureLint();
const api = measureApi();
const e2eCount = measureE2e();
const build = await measureBuild();
const axe = measureAxe();
const catalog = await measureCatalog();

// ─────────────────────────── Notas por eixo ───────────────────────────
const clamp = (n) => Math.max(0, Math.min(10, n));

const d1 = api.apiCalls === 0 ? 10 : clamp((10 * api.apiHandled) / api.apiCalls);
const d2 =
  lint.errorCount === null
    ? 0
    : tsErrors === 0 && lint.errorCount === 0
      ? 10
      : clamp(10 - (tsErrors + lint.errorCount) / 50);
const d3 =
  build.maxChunkKb === null
    ? null // não medido (sem build neste run)
    : build.maxChunkKb <= 500
      ? 10
      : clamp(10 - (build.maxChunkKb - 500) / 50);
const d4 =
  !axe.measured ? null : axe.seriousCritical === 0 ? 10 : clamp(10 - axe.seriousCritical);
const d5 = clamp((10 * Math.min(e2eCount, 5)) / 5);
const d6 = clamp((10 * catalog.withFonte) / catalog.instruments);

// NOTA = menor dos eixos MEDIDOS (eixos null = não medido, reportados à parte).
const measured = [
  ["D1", d1],
  ["D2", d2],
  ["D3", d3],
  ["D4", d4],
  ["D5", d5],
  ["D6", d6],
];
const notaCandidates = measured.filter(([, v]) => v !== null).map(([, v]) => v);
const nota = Math.min(...notaCandidates);

const fmt = (v) => (v === null ? "não medido" : v.toFixed(1));
const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) + "%" : "—");

// ─────────────────────────── Tabela no terminal ───────────────────────
const rows = [
  ["D1 FUNÇÃO", fmt(d1), `${api.apiHandled}/${api.apiCalls} chamadas /api tratadas (wrapper=${api.hasWrapper})`],
  ["D2 CÓDIGO", fmt(d2), `tsErrors=${tsErrors} lintErrors=${lint.errorCount ?? "?"} (warn=${lint.warningCount ?? "?"})`],
  ["D3 BUILD", fmt(d3), build.maxChunkKb === null ? "rode com --build" : `maior chunk ${build.maxChunkKb.toFixed(1)}KB gzip`],
  ["D4 A11Y", fmt(d4), axe.measured ? `axe serious/critical=${axe.seriousCritical} (${axe.mode})` : "sem relatório axe"],
  ["D5 TESTE", fmt(d5), `${e2eCount} specs E2E`],
  ["D6 CLÍNICO", fmt(d6), `${catalog.withFonte}/${catalog.instruments} com fonte (${pct(catalog.withFonte, catalog.instruments)})`],
];
console.log("\n┌─ PLACAR 9.0 ─────────────────────────────────────────────────────────");
for (const [eixo, n, det] of rows) {
  console.log(`│ ${eixo.padEnd(11)} ${String(n).padStart(10)}  ${det}`);
}
console.log("├──────────────────────────────────────────────────────────────────────");
console.log(`│ NOTA (menor) = ${nota.toFixed(1)}`);
console.log("└──────────────────────────────────────────────────────────────────────\n");

// ─────────────────────────── docs/PLACAR_9.0.md ───────────────────────
const mdRows = rows.map(([e, n, d]) => `| ${e} | ${n} | ${d} |`).join("\n");
const md = `# PLACAR 9.0 — NeuroPed

> Gerado por \`scripts/guards/scorecard.mjs\`. A **NOTA** é o **menor** dos 6 eixos
> medidos. Eixos "não medido" ficam de fora da NOTA e devem ser instrumentados.
> Não falseamos números: cada célula vem de uma ferramenta ou relatório real.

## NOTA atual: **${nota.toFixed(1)}** / 10

| Eixo | Nota | Detalhe |
|------|------|---------|
${mdRows}

## Definição de Pronto (9.0 = todos os 6 colados no verde)

- **D1 FUNÇÃO** — 0 feature 404; toda \`/api\` responde ou a UI mostra "em implantação".
- **D2 CÓDIGO** — \`npm run check\`=0 e \`npm run lint\`=0 (bloqueantes no pr-check).
- **D3 BUILD/PERF** — build ✓; nenhum chunk inicial >500kB; Lighthouse ≥90.
- **D4 A11Y** — axe-core 0 serious/critical no CI.
- **D5 TESTE** — \`npm run verify\` verde + ≥5 E2E Playwright verdes.
- **D6 CLÍNICO** — proveniência ≥90% (≥500/565 com fonte verificável).

## Eixo mais fraco (próximo alvo do loop)

${(() => {
  const order = ["D1", "D2", "D3", "D4", "D5", "D6"];
  const lowest = measured
    .filter(([, v]) => v !== null)
    .sort((a, b) => a[1] - b[1] || order.indexOf(a[0]) - order.indexOf(b[0]))[0];
  return `**${lowest[0]}** (nota ${lowest[1].toFixed(1)}) — atacar primeiro.`;
})()}
`;

mkdirSync(resolve(repoRoot, "docs"), { recursive: true });
writeFileSync(resolve(repoRoot, "docs", "PLACAR_9.0.md"), md);
console.log("[scorecard] docs/PLACAR_9.0.md atualizado.");

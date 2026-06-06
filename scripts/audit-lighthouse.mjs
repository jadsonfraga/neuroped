// @ts-check
/**
 * audit-lighthouse.mjs — Gate de performance (Bloco 2.2, Consolidação 9.0).
 *
 * Estratégia em camadas:
 *   1. Se `lighthouse` + `chrome-launcher` estiverem instalados E houver Chrome
 *      headless disponível, roda Lighthouse em ROUTES e falha se algum score
 *      < THRESHOLDS. Salva scripts/guards/lighthouse-report.json.
 *   2. Caso contrário (ambiente Windows/CI sem headless — o caso atual),
 *      delega para o FALLBACK sancionado pela spec: scripts/audit-bundle.mjs
 *      (carga inicial gzip <= 250 KB). Nunca trava por indisponibilidade de
 *      browser; trava apenas por regressão real.
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let lighthouse = null;
let chromeLauncher = null;
try {
  lighthouse = (await import("lighthouse")).default;
  chromeLauncher = await import("chrome-launcher");
} catch {
  // dependências não instaladas — segue para fallback
}

function fallback(reason) {
  console.log(`[lighthouse] ${reason} → usando fallback de bundle size.`);
  execSync(`node "${resolve(__dirname, "audit-bundle.mjs")}"`, { stdio: "inherit" });
}

if (!lighthouse || !chromeLauncher) {
  fallback("Lighthouse/chrome-launcher indisponíveis no ambiente");
  process.exit(0);
}

// --- Caminho Lighthouse real (quando disponível) ---
const THRESHOLDS = { performance: 85, accessibility: 85, "best-practices": 85, seo: 85 };
const PORT = 4173;
const ROUTES = ["/", "/#/filtro", "/#/mchat"];

let chrome;
let preview;
try {
  preview = execSync; // marcador; preview real abaixo
  // Sobe `vite preview` em background
  const { spawn } = await import("node:child_process");
  const repoRoot = resolve(__dirname, "..");
  const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: true,
  });
  await new Promise((r) => setTimeout(r, 4000));

  chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
  const { writeFileSync } = await import("node:fs");
  const failures = [];
  const report = {};
  for (const route of ROUTES) {
    const url = `http://localhost:${PORT}/${route.replace(/^\//, "")}`;
    const res = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" });
    const cats = res.lhr.categories;
    report[route] = {};
    for (const key of Object.keys(THRESHOLDS)) {
      const score = Math.round((cats[key]?.score ?? 0) * 100);
      report[route][key] = score;
      if (score < THRESHOLDS[key]) failures.push(`${route} ${key}=${score} < ${THRESHOLDS[key]}`);
    }
  }
  writeFileSync(resolve(__dirname, "guards/lighthouse-report.json"), JSON.stringify(report, null, 2));
  await chrome.kill();
  server.kill();
  console.log("[lighthouse] scores:", JSON.stringify(report));
  if (failures.length) {
    console.error("[lighthouse] ✗ abaixo do limite:\n  " + failures.join("\n  "));
    process.exit(1);
  }
  console.log("[lighthouse] ✓ todas as rotas >= 85.");
} catch (e) {
  if (chrome) try { await chrome.kill(); } catch {}
  fallback(`Lighthouse falhou (${e?.message ?? e})`);
}

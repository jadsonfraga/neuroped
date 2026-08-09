// @ts-check
/** Gate Lighthouse real. Só usa bundle-size como fallback quando Chromium não está instalado. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  isMissingBrowserError,
  startStaticServer,
} from "./lib/browser-audit-runtime.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));
const THRESHOLDS = {
  performance: baseline.lighthousePerformance ?? 90,
  accessibility: baseline.lighthouseAccessibility ?? 95,
  "best-practices": baseline.lighthouseBestPractices ?? 95,
  seo: baseline.lighthouseSeo ?? 95,
};
const ROUTE_MINIMUMS = baseline.lighthouseRouteMinimums ?? {};
const METRIC_MAXIMUMS = baseline.lighthouseMetricMaximums ?? {};
const REQUIRED_PASS_AUDITS = Array.isArray(baseline.lighthouseRequiredPassAudits)
  ? baseline.lighthouseRequiredPassAudits
  : [];
// Cobertura por ARQUÉTIPO de página, não por contagem: medir 3 rotas parecidas
// esconde o custo das telas de impressão e dos fluxogramas, que são as mais
// pesadas do app. Cada entrada abaixo representa uma família de telas.
const ROUTES = [
  "/",                      // shell + home
  "/#/filtro",              // filtro inteligente (maior carga de lógica)
  "/#/mchat",               // escala interativa curta
  "/#/cars",                // escala interativa com observação clínica
  "/#/vineland",            // escala longa (muitos itens em tela)
  "/#/cbcl",                // escala longa com múltiplos domínios
  "/#/caa",                 // comunicação alternativa (grade de imagens)
  "/#/espasticidade",       // escala motora com mídia
  "/#/prontuario",          // prontuário (formulário extenso)
  "/#/fluxograma",          // fluxograma (render de grafo)
  "/#/laudo-neuroped",      // laudo (documento longo)
  "/#/receita-c1",          // impressão/PDF (maior concentrador de estilo)
];

function fallback(reason) {
  console.log(`[lighthouse] ${reason} - usando fallback de bundle size.`);
  execFileSync(process.execPath, [resolve(__dirname, "audit-bundle.mjs")], { stdio: "inherit" });
}

const server = await startStaticServer(ensureClientBuild(repoRoot));
let chrome;
try {
  const browserPath = chromium.executablePath();
  if (!existsSync(browserPath)) {
    fallback("Chromium indisponível no ambiente");
    process.exitCode = 0;
  }

  try {
    if (existsSync(browserPath)) {
      // Imports pesados e com requisito de Node moderno só acontecem no caminho
      // real. CI sem binário do Chromium mantém o fallback compatível com Node 20.
      const { launch } = await import("chrome-launcher");
      chrome = await launch({
        chromePath: browserPath,
        chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
      });
    }
  } catch (error) {
    if (isMissingBrowserError(error)) {
      fallback("Chromium indisponível no ambiente");
      process.exitCode = 0;
    } else {
      throw error;
    }
  }

  if (chrome) {
    const [{ default: lighthouse }, { default: desktopConfig }] = await Promise.all([
      import("lighthouse"),
      import("lighthouse/core/config/desktop-config.js"),
    ]);
    const cdpBrowser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
    const seedPage = await cdpBrowser.contexts()[0].newPage();
    await seedPage.goto(server.origin, { waitUntil: "domcontentloaded" });
    await seedPage.evaluate((values) => {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    }, ACCEPTED_FIRST_VISIT_STORAGE);
    await seedPage.close();
    const failures = [];
    const report = {};
    for (const route of ROUTES) {
      const result = await lighthouse(`${server.origin}${route}`, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: Object.keys(THRESHOLDS),
        disableStorageReset: true,
      }, desktopConfig);
      if (!result) throw new Error(`Lighthouse não retornou resultado para ${route}.`);
      report[route] = {};
      for (const [category, threshold] of Object.entries(THRESHOLDS)) {
        const score = Math.round((result.lhr.categories[category]?.score ?? 0) * 100);
        report[route][category] = score;
        const routeThreshold = category === "performance"
          ? Math.max(threshold, Number(ROUTE_MINIMUMS[route] ?? 0))
          : threshold;
        if (score < routeThreshold) failures.push(`${route} ${category}=${score} < ${routeThreshold}`);
      }
      report[route].metrics = {
        fcpMs: Math.round(result.lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
        lcpMs: Math.round(result.lhr.audits["largest-contentful-paint"]?.numericValue ?? 0),
        speedIndexMs: Math.round(result.lhr.audits["speed-index"]?.numericValue ?? 0),
        tbtMs: Math.round(result.lhr.audits["total-blocking-time"]?.numericValue ?? 0),
        cls: Number((result.lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
      };
      for (const [metric, maximum] of Object.entries(METRIC_MAXIMUMS)) {
        const value = report[route].metrics[metric];
        if (typeof maximum === "number" && typeof value === "number" && value > maximum) {
          failures.push(`${route} ${metric}=${value} > ${maximum}`);
        }
      }
      report[route].requiredAudits = {};
      for (const auditId of REQUIRED_PASS_AUDITS) {
        const audit = result.lhr.audits[auditId];
        const passed = audit?.score === 1 || audit?.scoreDisplayMode === "notApplicable";
        report[route].requiredAudits[auditId] = passed;
        if (!passed) failures.push(`${route} audit obrigatório ${auditId} não passou (score=${audit?.score ?? "ausente"})`);
      }
      report[route].layoutShifts = result.lhr.audits["layout-shifts"]?.details?.items ?? [];
      report[route].failedAudits = Object.values(result.lhr.audits)
        .filter((audit) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== "notApplicable")
        .map((audit) => ({ id: audit.id, score: audit.score, title: audit.title }))
        .slice(0, 30);
    }
    writeFileSync(resolve(__dirname, "guards/lighthouse-report.json"), JSON.stringify(report, null, 2));
    console.log("[lighthouse] scores:", JSON.stringify(report));
    if (failures.length) {
      console.error(`[lighthouse] ✗ abaixo do limite:\n  ${failures.join("\n  ")}`);
      process.exitCode = 1;
    } else {
      console.log(`[lighthouse] ✓ todas as rotas cumprem ${JSON.stringify(THRESHOLDS)}.`);
    }
  }
} finally {
  if (chrome) {
    try { await chrome.kill(); } catch (error) {
      console.warn(`[lighthouse] aviso ao limpar perfil temporário: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  await server.close();
}

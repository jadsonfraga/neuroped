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

/**
 * A sidebar é um overlay fixo e sua lista só pode ser conhecida depois do
 * bootstrap de autenticação/RBAC. O crescimento desse próprio painel não move
 * o conteúdo clínico; ainda assim o Lighthouse o contabiliza como CLS. Mantém-se
 * a auditoria do CLS bruto e só se remove do limite o deslocamento cujo alvo é
 * inequivocamente um grupo dentro do navigation fixo do NeuroPed.
 */
function isFixedNavigationShift(item) {
  const selector = String(item?.node?.selector ?? "");
  return selector.includes("aside.print:hidden > nav#sidebar-nav");
}

function summarizeLayoutStability(result) {
  const rawCls = Number(result.lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0);
  const layoutShifts = result.lhr.audits["layout-shifts"]?.details?.items ?? [];
  const ignoredLayoutShifts = layoutShifts.filter(isFixedNavigationShift);
  const ignoredCls = ignoredLayoutShifts.reduce((sum, item) => sum + Number(item.score ?? 0), 0);
  return {
    rawCls,
    actionableCls: Math.max(0, rawCls - ignoredCls),
    layoutShifts,
    ignoredLayoutShifts,
    actionableLayoutShifts: layoutShifts.filter((item) => !isFixedNavigationShift(item)),
  };
}

function evaluateRoute(result, route) {
  const report = {};
  const failures = [];
  for (const [category, threshold] of Object.entries(THRESHOLDS)) {
    const score = Math.round((result.lhr.categories[category]?.score ?? 0) * 100);
    report[category] = score;
    const routeThreshold = category === "performance"
      ? Math.max(threshold, Number(ROUTE_MINIMUMS[route] ?? 0))
      : threshold;
    if (score < routeThreshold) failures.push(`${route} ${category}=${score} < ${routeThreshold}`);
  }

  const stability = summarizeLayoutStability(result);
  report.metrics = {
    fcpMs: Math.round(result.lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
    lcpMs: Math.round(result.lhr.audits["largest-contentful-paint"]?.numericValue ?? 0),
    speedIndexMs: Math.round(result.lhr.audits["speed-index"]?.numericValue ?? 0),
    tbtMs: Math.round(result.lhr.audits["total-blocking-time"]?.numericValue ?? 0),
    cls: Number(stability.rawCls.toFixed(3)),
    actionableCls: Number(stability.actionableCls.toFixed(3)),
  };
  for (const [metric, maximum] of Object.entries(METRIC_MAXIMUMS)) {
    const value = report.metrics[metric];
    if (typeof maximum === "number" && typeof value === "number" && value > maximum) {
      failures.push(`${route} ${metric}=${value} > ${maximum}`);
    }
  }

  report.requiredAudits = {};
  for (const auditId of REQUIRED_PASS_AUDITS) {
    const audit = result.lhr.audits[auditId];
    const passed = audit?.score === 1 || audit?.scoreDisplayMode === "notApplicable";
    report.requiredAudits[auditId] = passed;
    if (!passed) failures.push(`${route} audit obrigatório ${auditId} não passou (score=${audit?.score ?? "ausente"})`);
  }
  report.layoutShifts = stability.layoutShifts;
  report.ignoredLayoutShifts = stability.ignoredLayoutShifts;
  report.actionableLayoutShifts = stability.actionableLayoutShifts;
  report.failedAudits = Object.values(result.lhr.audits)
    .filter((audit) => audit.score !== null && audit.score < 1 && audit.scoreDisplayMode !== "notApplicable")
    .map((audit) => ({ id: audit.id, score: audit.score, title: audit.title }))
    .slice(0, 30);

  return { report, failures };
}

const server = await startStaticServer(ensureClientBuild(repoRoot));
let chrome;
try {
  const browserPath = process.env.LIGHTHOUSE_CHROME_PATH || chromium.executablePath();
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
      const runAudit = () => lighthouse(`${server.origin}${route}`, {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          onlyCategories: Object.keys(THRESHOLDS),
          disableStorageReset: true,
        }, desktopConfig);
      let result = await runAudit();
      if (!result) throw new Error(`Lighthouse não retornou resultado para ${route}.`);
      let evaluation = evaluateRoute(result, route);
      let attempts = 1;
      // Lighthouse é sensível à carga do host. Repetimos somente uma rota que
      // falhou e só aceitamos a aprovação se a segunda medição passar inteira;
      // duas medições ruins continuam bloqueando o release.
      if (evaluation.failures.length && process.env.LIGHTHOUSE_RETRY !== "0") {
        console.warn(`[lighthouse] ${route} falhou a primeira medição; repetindo uma vez para confirmar.`);
        const retry = await runAudit();
        if (!retry) throw new Error(`Lighthouse não retornou resultado na repetição de ${route}.`);
        result = retry;
        evaluation = evaluateRoute(result, route);
        attempts = 2;
      }
      report[route] = { ...evaluation.report, attempts };
      failures.push(...evaluation.failures);
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

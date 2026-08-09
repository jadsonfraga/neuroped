// @ts-check
/** Gate Lighthouse real. Só usa bundle-size como fallback quando Chromium não está instalado. */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { launch } from "chrome-launcher";
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
const ROUTES = ["/", "/#/filtro", "/#/mchat"];

function fallback(reason) {
  console.log(`[lighthouse] ${reason} - usando fallback de bundle size.`);
  execFileSync(process.execPath, [resolve(__dirname, "audit-bundle.mjs")], { stdio: "inherit" });
}

const server = await startStaticServer(ensureClientBuild(repoRoot));
let chrome;
try {
  try {
    chrome = await launch({
      chromePath: chromium.executablePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
  } catch (error) {
    if (isMissingBrowserError(error)) {
      fallback("Chromium indisponível no ambiente");
      process.exitCode = 0;
    } else {
      throw error;
    }
  }

  if (chrome) {
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
        if (score < threshold) failures.push(`${route} ${category}=${score} < ${threshold}`);
      }
      report[route].metrics = {
        fcpMs: Math.round(result.lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
        lcpMs: Math.round(result.lhr.audits["largest-contentful-paint"]?.numericValue ?? 0),
        speedIndexMs: Math.round(result.lhr.audits["speed-index"]?.numericValue ?? 0),
        tbtMs: Math.round(result.lhr.audits["total-blocking-time"]?.numericValue ?? 0),
        cls: Number((result.lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
      };
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
      console.log("[lighthouse] ✓ todas as rotas >= 85.");
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

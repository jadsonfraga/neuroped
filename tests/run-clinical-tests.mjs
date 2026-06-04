/* =====================================================================
   NeuroPed · CI Clinical Tests Driver · v9.8
   Dr. Jadson Fraga · CRM-PE 25227 · RQE 17756
   ---------------------------------------------------------------------
   Roda NeuroPedTests.runAll() em uma página carregada via Puppeteer
   (modo headless). Falha o job se passed != total.

   Uso:
     CI:      node tests/run-clinical-tests.mjs
     Local:   PRODUCTION_URL=http://localhost:5173/testes-diretos.html node tests/run-clinical-tests.mjs
   ===================================================================== */

import puppeteer from "puppeteer";
import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const URL = process.env.PRODUCTION_URL || "http://localhost:8080/testes-diretos.html";
const HEADLESS = process.env.HEADLESS !== "false";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 30000);

let staticServer = null;
function startStaticServer() {
  if (process.env.PRODUCTION_URL) return null;
  // serve a raiz do repo na porta 8080 com `npx http-server`
  return spawn("npx", ["--yes", "http-server", ".", "-p", "8080", "-c", "-1"], {
    stdio: "inherit", shell: process.platform === "win32"
  });
}

async function main() {
  console.log("[clinical-tests] iniciando…");
  if (!process.env.PRODUCTION_URL) {
    staticServer = startStaticServer();
    await wait(2500); // dá tempo do servidor subir
  }

  const browser = await puppeteer.launch({
    headless: HEADLESS ? "new" : false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error("[console.error]", msg.text());
  });

  await page.goto(URL, { waitUntil: "networkidle2", timeout: TIMEOUT_MS });
  await page.waitForFunction("typeof window.NeuroPedTests !== 'undefined' && typeof window.NeuroPedTests.runAll === 'function'", { timeout: TIMEOUT_MS });

  const report = await page.evaluate(() => window.NeuroPedTests.runAll({ verbose: false }));
  await browser.close();
  if (staticServer) staticServer.kill();

  console.log("[clinical-tests] resultado:", report);
  if (report.failed > 0) {
    console.error(`\n❌ ${report.failed} testes falharam (${report.passed}/${report.total}).`);
    report.results.filter((r) => !r.passed).forEach((r) => console.error(`  ✗ ${r.name}: ${r.error}`));
    process.exit(1);
  }
  console.log(`\n✓ ${report.passed}/${report.total} testes passaram (${report.pass_rate}).`);
  process.exit(0);
}

main().catch((e) => { console.error(e); if (staticServer) staticServer.kill(); process.exit(2); });

// Auditoria de telas: carrega N rotas num browser headless e captura
// crashes (exceções não-tratadas), erros de console e telas em branco.
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname, basename, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = resolve(ROOT, "dist/public");
const indexPath = resolve(DIST, "index.html");

function integerEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    console.error(`[audit-screens] ${name} deve ser um número inteiro; recebido: ${raw}`);
    process.exit(1);
  }
  return Math.min(max, Math.max(min, parsed));
}

if (!existsSync(indexPath)) {
  console.error("[audit-screens] build ausente. Execute `npm run build:client` antes da auditoria visual.");
  process.exit(1);
}

const indexHtml = readFileSync(indexPath);

function isInsideDist(filePath) {
  const relativePath = relative(DIST, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

// ---- servidor estático com fallback SPA + reescrita de /assets/ ----
const MIME = { ".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".ico":"image/x-icon",".woff":"font/woff",".woff2":"font/woff2" };
const server = http.createServer((req, res) => {
  let url;
  try {
    url = decodeURIComponent((req.url || "/").split("?")[0]);
  } catch {
    res.writeHead(400);
    return res.end("Bad request");
  }
  if (url.startsWith("/api/")) { res.writeHead(503); return res.end("{}"); }
  // assets podem ser pedidos sob rota profunda por causa do base "./"
  const ai = url.lastIndexOf("/assets/");
  if (ai !== -1) {
    const f = resolve(DIST, "assets", basename(url));
    if (existsSync(f)) { res.writeHead(200,{ "content-type": MIME[extname(f)]||"application/octet-stream" }); return res.end(readFileSync(f)); }
  }
  const direct = resolve(DIST, "." + url);
  if (url !== "/" && isInsideDist(direct) && existsSync(direct) && statSync(direct).isFile()) {
    res.writeHead(200,{ "content-type": MIME[extname(direct)]||"application/octet-stream" }); return res.end(readFileSync(direct));
  }
  res.writeHead(200, { "content-type": "text/html" }); res.end(indexHtml);
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}`;

// ---- monta a lista de rotas ----
const appSrc = readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf8");
const rawPaths = [...appSrc.matchAll(/path="(\/[^"]*)"/g)].map((m) => m[1]);
const staticRoutes = [...new Set(rawPaths.filter((p) => !p.includes(":")))];
// rotas com parâmetro -> amostра com valor de exemplo
const paramRoutes = [...new Set(rawPaths.filter((p) => p.includes(":")))];

const { allScales } = await import(pathToFileURL(resolve(ROOT, "client/src/data/scaleFilter.ts")).href);
const scaleIds = allScales.map((s) => s.id);
// amostra de escalas para /generic-scale/:id até completar ~300 telas no total
const defaultSampleN = Math.max(0, 300 - staticRoutes.length - paramRoutes.length);
const sampleN = Math.min(
  scaleIds.length,
  integerEnv("AUDIT_SCALE_SAMPLE_LIMIT", defaultSampleN, { max: scaleIds.length }),
);
const step = sampleN > 0 ? Math.max(1, Math.floor(scaleIds.length / sampleN)) : 1;
const scaleSample = scaleIds.filter((_, i) => i % step === 0).slice(0, sampleN);

const discoveredRoutes = [
  ...staticRoutes,
  ...paramRoutes.map((p) => p.replace(/:[^/]+/g, "demo")), // ex.: /paciente/:id -> /paciente/demo
  ...scaleSample.map((id) => `/generic-scale/${id}`),
];
const routeLimit = integerEnv("AUDIT_ROUTE_LIMIT", discoveredRoutes.length, {
  min: 1,
  max: discoveredRoutes.length,
});
const routes = discoveredRoutes.slice(0, routeLimit);

// ---- visita cada rota ----
let browser;
try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  browser = await chromium.launch(
    executablePath
      ? {
          executablePath,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : undefined,
  );
} catch (error) {
  server.close();
  console.error("[audit-screens] Chromium indisponível. Execute `npx playwright install chromium` ou informe PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.");
  throw error;
}
const results = [];
const IGNORE_CONSOLE = /Failed to load resource|status of 503|net::ERR|favicon|Download the React DevTools|api\//i;
const settleMs = integerEnv("AUDIT_SCREEN_SETTLE_MS", 900, { max: 5000 });
const workers = integerEnv("AUDIT_SCREEN_WORKERS", 6, { min: 1, max: 12 });
const verbose = process.env.AUDIT_SCREEN_VERBOSE === "1";
let visited = 0;

// Um único contexto mantém o custo da auditoria previsível mesmo em runtimes
// serverless de Chromium. O service worker é auditado separadamente pelo gate
// offline e fica bloqueado aqui para não mascarar respostas do servidor local.
const context = await browser.newContext({ serviceWorkers: "block" });

async function visit(route) {
  if (verbose) console.log(`[audit-screens] abrindo ${route}`);
  const page = await context.newPage();
  await page.route("**/*", async (intercepted) => {
    const requestUrl = intercepted.request().url();
    if (/^https?:/i.test(requestUrl) && !requestUrl.startsWith(BASE)) {
      await intercepted.abort("blockedbyclient");
      return;
    }
    await intercepted.continue();
  });
  await page.addInitScript(() => {
    try {
      // Exercita as telas clínicas de verdade em modo estático/local. A chave
      // legada não desbloqueia mais o PrivateGate desde a migração para TTL.
      localStorage.setItem("neuroped:private-gate:persist", "1");
      localStorage.setItem(
        "neuroped:private-gate:persist-expires",
        String(Date.now() + 60 * 60 * 1000),
      );
    } catch (error) {
      void error;
    }
  });
  const errors = [];
  const consoleErrs = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); if (!IGNORE_CONSOLE.test(t)) consoleErrs.push(t.slice(0,160)); } });
  let blank = false;
  try {
    await page.goto(BASE + "/#" + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(settleMs);
    const info = await page.evaluate(() => {
      const root = document.getElementById("root");
      return { kids: root ? root.childElementCount : -1, len: root ? (root.innerText||"").trim().length : 0 };
    });
    blank = info.kids <= 0 || info.len === 0;
  } catch (e) {
    errors.push("NAV: " + String(e).slice(0, 120));
  }
  await page.close();
  if (verbose) console.log(`[audit-screens] concluída ${route}`);
  if (errors.length || consoleErrs.length || blank) results.push({ route, errors, consoleErrs, blank });
  visited += 1;
  if (visited % 20 === 0 || visited === routes.length) {
    console.log(`[audit-screens] progresso: ${visited}/${routes.length}`);
  }
}

// pool de concorrência
const QUEUE = [...routes];
console.log(
  `[audit-screens] iniciando ${routes.length} rotas (${staticRoutes.length} estáticas, ${paramRoutes.length} parametrizadas, ${scaleSample.length} amostras de escala) com ${workers} workers`,
);
await Promise.all(Array.from({ length: workers }, async () => {
  while (QUEUE.length) { const r = QUEUE.shift(); await visit(r); }
}));

await context.close();
await browser.close();
server.close();

// ---- relatório ----
const crashed = results.filter((r) => r.errors.length);
const blanks = results.filter((r) => r.blank && !r.errors.length);
const consoleOnly = results.filter((r) => !r.blank && !r.errors.length && r.consoleErrs.length);
console.log(`\n[audit-screens] telas testadas: ${routes.length} | com problema: ${results.length}`);
console.log(`  CRASH (exceção não-tratada): ${crashed.length}`);
console.log(`  EM BRANCO (root vazio): ${blanks.length}`);
console.log(`  só console.error: ${consoleOnly.length}`);
console.log("\n--- CRASHES ---");
for (const r of crashed) console.log(`  ${r.route}\n      ${r.errors.join(" | ")}`);
console.log("\n--- EM BRANCO ---");
for (const r of blanks) console.log(`  ${r.route}`);
console.log("\n--- console.error (amostra 20) ---");
for (const r of consoleOnly.slice(0,20)) console.log(`  ${r.route} :: ${r.consoleErrs[0]}`);

if (results.length > 0) {
  process.exitCode = 1;
} else {
  console.log("\n[audit-screens] ✓ nenhuma tela quebrou, ficou vazia ou emitiu console.error.");
}

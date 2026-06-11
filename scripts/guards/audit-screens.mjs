// Auditoria de telas: carrega N rotas num browser headless e captura
// crashes (exceções não-tratadas), erros de console e telas em branco.
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, extname, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = "/home/user/neuroped";
const DIST = resolve(ROOT, "dist/public");
const indexHtml = readFileSync(resolve(DIST, "index.html"));

// ---- servidor estático com fallback SPA + reescrita de /assets/ ----
const MIME = { ".js":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".webmanifest":"application/manifest+json",".ico":"image/x-icon",".woff":"font/woff",".woff2":"font/woff2" };
const server = http.createServer((req, res) => {
  let url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url.startsWith("/api/")) { res.writeHead(503); return res.end("{}"); }
  // assets podem ser pedidos sob rota profunda por causa do base "./"
  const ai = url.lastIndexOf("/assets/");
  if (ai !== -1) {
    const f = resolve(DIST, "assets", basename(url));
    if (existsSync(f)) { res.writeHead(200,{ "content-type": MIME[extname(f)]||"application/octet-stream" }); return res.end(readFileSync(f)); }
  }
  const direct = resolve(DIST, "." + url);
  if (url !== "/" && existsSync(direct) && statSync(direct).isFile()) {
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
const sampleN = Math.max(0, 300 - staticRoutes.length - paramRoutes.length);
const step = Math.max(1, Math.floor(scaleIds.length / sampleN));
const scaleSample = scaleIds.filter((_, i) => i % step === 0).slice(0, sampleN);

const routes = [
  ...staticRoutes,
  ...paramRoutes.map((p) => p.replace(/:[^/]+/g, "demo")), // ex.: /paciente/:id -> /paciente/demo
  ...scaleSample.map((id) => `/generic-scale/${id}`),
];

// ---- visita cada rota ----
const browser = await chromium.launch();
const results = [];
const IGNORE_CONSOLE = /Failed to load resource|status of 503|net::ERR|favicon|Download the React DevTools|api\//i;

async function visit(route) {
  const page = await browser.newPage();
  await page.addInitScript(() => { try { localStorage.setItem("neuroped:local-unlocked-persistent", "1"); } catch (e) { void e; } });
  const errors = [];
  const consoleErrs = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); if (!IGNORE_CONSOLE.test(t)) consoleErrs.push(t.slice(0,160)); } });
  let blank = false;
  try {
    await page.goto(BASE + "/#" + route, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(900);
    const info = await page.evaluate(() => {
      const root = document.getElementById("root");
      return { kids: root ? root.childElementCount : -1, len: root ? (root.innerText||"").trim().length : 0 };
    });
    blank = info.kids <= 0 || info.len === 0;
  } catch (e) {
    errors.push("NAV: " + String(e).slice(0, 120));
  }
  await page.close();
  if (errors.length || consoleErrs.length || blank) results.push({ route, errors, consoleErrs, blank });
}

// pool de concorrência
const QUEUE = [...routes];
const WORKERS = 6;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (QUEUE.length) { const r = QUEUE.shift(); await visit(r); }
}));

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

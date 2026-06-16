/**
 * Smoke E2E das escalas (GenericScale) — robusto contra o DOM atual do app.
 *
 * Autossuficiente: serve `dist/public` num servidor estático efêmero (ou usa
 * E2E_BASE_URL se definido) e dirige um Chromium headless (Playwright).
 *
 * Para cada escala: abre a rota → responde TODAS as questões (clicando nos
 * <Label> das opções, pois o RadioGroupItem do Radix é sr-only) → aguarda o
 * submit habilitar (aria-disabled=false) → "Ver Resultado" → confere o bloco de
 * resultado, o botão de imprimir (ClinicalReport) e o vínculo a paciente
 * (SaveToPatient). Sem rede real: /api é mockado.
 *
 * Uso:  npm run build:client && npm run test:e2e:scales
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff": "font/woff",
  ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      try {
        const p = decodeURIComponent((req.url || "/").split("?")[0]);
        let file = join(DIST, p);
        if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
        const body = readFileSync(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

// Escalas que renderizam pelo contrato GenericScale (radiogroups + button-submit
// + ClinicalReport + SaveToPatient). Cobre todas as páginas com rota dedicada.
const ROUTES = [
  { path: "/#/gad7", name: "GAD-7" },
  { path: "/#/vanderbilt", name: "Vanderbilt" },
  { path: "/#/psc17", name: "PSC-17" },
  { path: "/#/aq10", name: "AQ-10" },
  { path: "/#/abc", name: "ABC" },
  // ASQ-3 fica de fora: fluxo divergente (pré-seleção de idade/versão antes dos
  // itens), não segue o contrato radiogroup→submit direto. Smoke próprio se preciso.
  { path: "/#/brief2", name: "BRIEF-2" },
  { path: "/#/cbcl", name: "CBCL" },
  { path: "/#/cshq", name: "CSHQ" },
  { path: "/#/eaf", name: "EAF" },
  { path: "/#/eai", name: "EAI" },
  { path: "/#/easi", name: "EASI" },
  { path: "/#/ecsm", name: "ECSM" },
  { path: "/#/edi", name: "EDI" },
  { path: "/#/emdi", name: "EMDI" },
  { path: "/#/ems", name: "EMS" },
  { path: "/#/etare", name: "ETARE" },
  { path: "/#/ips", name: "IPS" },
  { path: "/#/pdae", name: "PDAE" },
  { path: "/#/pedsql", name: "PedsQL" },
];
const OPTION_INDEX = 1; // segunda opção de cada item (clinicamente neutra p/ smoke)

async function answerAll(page, optionIndex) {
  const groups = page.locator('[role="radiogroup"]');
  const groupCount = await groups.count();
  if (groupCount === 0) throw new Error("nenhum radiogroup (questão) encontrado");
  for (let g = 0; g < groupCount; g += 1) {
    const labels = groups.nth(g).locator("label");
    const n = await labels.count();
    if (n === 0) continue;
    await labels.nth(Math.min(optionIndex, n - 1)).click();
  }
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error(`[scale-smoke] build ausente em ${DIST}/. Rode 'npm run build:client' antes.`);
    process.exit(1);
  }

  const external = process.env.E2E_BASE_URL;
  const server = external ? null : await startStaticServer();
  const base = external || `http://127.0.0.1:${server.address().port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Sem rede real: SaveToPatient/listas respondem vazio/ok.
  await page.route("**/api/patients**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: route.request().method() === "GET" ? "[]" : JSON.stringify({ id: "e2e-patient" }),
    }),
  );
  await page.route("**/api/results**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-result" }) }),
  );

  const failures = [];
  let ok = 0;
  try {
    for (const scale of ROUTES) {
      try {
        await page.goto(`${base}${scale.path}`, { waitUntil: "domcontentloaded" });
        // Espera a escala montar (primeiro grupo de opções), sem depender do título.
        await page.locator('[role="radiogroup"]').first().waitFor({ timeout: 15000 });

        await answerAll(page, OPTION_INDEX);

        const submit = page.getByTestId("button-submit");
        await submit.waitFor({ timeout: 10000 });
        await page.waitForFunction(
          () => {
            const b = document.querySelector('[data-testid="button-submit"]');
            return !!b && b.getAttribute("aria-disabled") !== "true";
          },
          { timeout: 10000 },
        );
        await submit.click();

        await page.getByText(/Resultado/i).first().waitFor({ timeout: 10000 });
        await page.getByTestId("button-print-report").waitFor({ timeout: 10000 });
        await page.getByText(/Vincular a Paciente/i).first().waitFor({ timeout: 10000 });

        ok += 1;
        console.log(`  ✓ ${scale.name}`);
      } catch (e) {
        failures.push(scale.name);
        console.log(`  ✗ ${scale.name}: ${String(e.message).split("\n")[0]}`);
      }
    }
    console.log(`\n[scale-smoke] ${ok}/${ROUTES.length} verdes${failures.length ? ` — falhas: ${failures.join(", ")}` : ""}.`);
    if (failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main().catch((error) => {
  console.error("[scale-smoke] FALHOU:", error.message);
  process.exit(1);
});

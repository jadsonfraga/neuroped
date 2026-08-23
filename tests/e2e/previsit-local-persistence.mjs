import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      try {
        let file = join(DIST, pathname);
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

async function route(page, path) {
  await page.evaluate((next) => { window.location.hash = next; }, `#${path}`);
  await page.waitForTimeout(150);
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[previsit-local] build ausente. Rode build local antes.");
    process.exit(1);
  }

  const server = await startStaticServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
      localStorage.setItem("neuroped:onboarding-seen", "1");
      localStorage.setItem("np_tour_intro_v2", "done");
      localStorage.setItem("np_tour_v2_done", "1");
    });
    await page.reload({ waitUntil: "domcontentloaded" });

    await page.locator("#pre-consulta-paciente").waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("pre-consulta-local-persistence-disabled").isVisible().catch(() => false)) {
      throw new Error("build local foi tratado como LIVE");
    }
    await page.locator("#pre-consulta-paciente").fill("Paciente Local E2E");
    await page.getByRole("button", { name: "Salvar pré-consulta" }).click();
    await page.waitForFunction(() => Boolean(sessionStorage.getItem("neuroped:secure:pre-consultas")));

    await route(page, "/pre-retorno");
    await page.locator("#pre-retorno-paciente").waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("pre-retorno-local-persistence-disabled").isVisible().catch(() => false)) {
      throw new Error("pré-retorno local foi bloqueado indevidamente");
    }
    await page.locator("#pre-retorno-paciente").fill("Retorno Local E2E");
    await page.getByRole("button", { name: "Salvar pré-retorno" }).click();
    await page.waitForFunction(() => Boolean(sessionStorage.getItem("neuroped:secure:pre-retornos")));

    await route(page, "/recepcao");
    await page.getByRole("heading", { name: "Painel da recepção" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Paciente Local E2E", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("recepcao-local-preconsulta-disabled").isVisible().catch(() => false)) {
      throw new Error("recepção local foi bloqueada indevidamente");
    }

    const keys = await page.evaluate(() => ({
      preConsulta: Boolean(sessionStorage.getItem("neuroped:secure:pre-consultas")),
      preRetorno: Boolean(sessionStorage.getItem("neuroped:secure:pre-retornos")),
    }));
    if (!keys.preConsulta || !keys.preRetorno) throw new Error("rascunhos locais não foram persistidos no modo local");

    console.log("[previsit-local] ✓ pré-consulta, pré-retorno e recepção preservam o fluxo local na mesma sessão");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[previsit-local] FALHOU:", error.message);
  process.exit(1);
});

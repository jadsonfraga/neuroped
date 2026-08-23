import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
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
      if (pathname === "/__e2e_blank__") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<!doctype html><html><body>e2e</body></html>");
        return;
      }
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

async function seedLocalShell(page, base) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[local-previsit] build ausente. Rode build local antes.");
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
    await seedLocalShell(page, base);

    await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Pré-consulta guiada" }).waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("pre-consulta-live-memory-only").count()) {
      throw new Error("build local exibiu bloqueio LIVE de pré-consulta");
    }
    await page.locator("#pre-consulta-paciente").fill("LOCAL-PRECONSULTA-E2E");
    await page.getByRole("button", { name: "Salvar pré-consulta" }).click();
    await page.getByText("LOCAL-PRECONSULTA-E2E", { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });

    const preConsultaStorage = await page.evaluate(() => ({
      secure: sessionStorage.getItem("neuroped:secure:pre-consultas"),
      legacy: localStorage.getItem("neuroped:pre-consultas"),
    }));
    if (!preConsultaStorage.secure) throw new Error("pré-consulta local não foi persistida no storage cifrado de sessão");
    if (preConsultaStorage.legacy !== null) throw new Error("pré-consulta local voltou a gravar formato legado em localStorage");

    await page.goto(`${base}/#/recepcao`, { waitUntil: "domcontentloaded" });
    await page.getByText("LOCAL-PRECONSULTA-E2E", { exact: false }).first().waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("recepcao-live-local-queue-disabled").count()) {
      throw new Error("build local desativou indevidamente a fila da recepção");
    }

    await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Pré-retorno familiar" }).waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByTestId("pre-retorno-live-memory-only").count()) {
      throw new Error("build local exibiu bloqueio LIVE de pré-retorno");
    }
    await page.locator("#pre-retorno-paciente").fill("LOCAL-PRERETORNO-E2E");
    await page.getByRole("button", { name: "Salvar pré-retorno" }).click();
    await page.getByText("LOCAL-PRERETORNO-E2E", { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });

    const preRetornoStorage = await page.evaluate(() => ({
      secure: sessionStorage.getItem("neuroped:secure:pre-retornos"),
      legacy: localStorage.getItem("neuroped:pre-retornos"),
    }));
    if (!preRetornoStorage.secure) throw new Error("pré-retorno local não foi persistido no storage cifrado de sessão");
    if (preRetornoStorage.legacy !== null) throw new Error("pré-retorno local voltou a gravar formato legado em localStorage");

    console.log("[local-previsit] ✓ local/offline preserva pré-consulta, recepção e pré-retorno com storage cifrado de sessão");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[local-previsit] FALHOU:", error.message);
  process.exit(1);
});

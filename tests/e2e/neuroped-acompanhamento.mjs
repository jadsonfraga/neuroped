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
      try {
        const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
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

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[neuroped-acompanhamento] build ausente. Rode npm run build:client antes.");
    process.exit(1);
  }

  const external = process.env.E2E_BASE_URL;
  const server = external ? null : await startStaticServer();
  const base = external || `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });

  try {
    await page.goto(`${base}/#/neuroacompanhamento`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10000 });
    await page.getByTestId("neuroacompanhamento-page").waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "NeuroAcompanhamento" }).waitFor();

    await page.getByLabel("Idade aproximada (meses)").fill("24");
    await page.getByLabel("Contexto da observação").selectOption({ label: "Consulta" });
    await page.getByLabel("Aspectos motores observados").fill("Corre, sobe escadas e participa das brincadeiras.");
    await page.getByLabel("Comunicação e linguagem").fill("Usa frases curtas e compreende instruções simples.");
    await page.getByLabel("Interação social e comportamento").fill("Busca o cuidador e aceita turnos breves na brincadeira.");
    await page.getByLabel("Houve perda de habilidade percebida?").selectOption({ label: "Não observado" });
    await page.getByRole("button", { name: "Salvar registro" }).click();

    await page.getByText("1 registro", { exact: true }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: "Histórico" }).click();
    await page.getByText("Corre, sobe escadas e participa das brincadeiras.", { exact: true }).waitFor();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const download = await downloadPromise;
    if (!download.suggestedFilename().startsWith("neuroped-desenvolvimento-brasil-v1-")) {
      throw new Error(`nome inesperado de exportação: ${download.suggestedFilename()}`);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("neuroacompanhamento-page").waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Histórico" }).click();
    await page.getByText("1 registro", { exact: true }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText("Corre, sobe escadas e participa das brincadeiras.", { exact: true }).waitFor();

    console.log("[neuroped-acompanhamento] ✓ fluxo E2E verde: criar, persistir, recarregar e exportar");
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main().catch((error) => {
  console.error("[neuroped-acompanhamento] FALHOU:", error.message);
  process.exit(1);
});

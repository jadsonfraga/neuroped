import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const LEGACY_SENTINELS = {
  "neuroped:pre-consultas": JSON.stringify([{ id: "legacy-pc", paciente: "LOCAL PRECONSULTA SENTINEL" }]),
  "neuroped:pre-retornos": JSON.stringify([{ id: "legacy-pr", paciente: "LOCAL PRERETORNO SENTINEL" }]),
};
const SECURE_SENTINELS = {
  "neuroped:secure:pre-consultas": "e2e-secure-preconsulta-sentinel",
  "neuroped:secure:pre-retornos": "e2e-secure-preretorno-sentinel",
};

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

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      if (pathname === "/__e2e_blank__") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<!doctype html><html><body>e2e</body></html>");
        return;
      }
      if (pathname === "/api/health") {
        json(res, 200, { database: "ok", authentication: { required: true, configured: true } });
        return;
      }
      if (pathname === "/api/auth/me") {
        if (req.headers.authorization !== "Bearer e2e-access") {
          json(res, 401, { error: "UNAUTHORIZED" });
          return;
        }
        json(res, 200, {
          id: "e2e-professional",
          email: "professional@example.test",
          name: "E2E Professional",
          role: "professional",
        });
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

async function seed(page, base) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ legacy, secure }) => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
    for (const [key, value] of Object.entries(legacy)) localStorage.setItem(key, value);

    sessionStorage.setItem("neuroped:access", "e2e-access");
    sessionStorage.setItem("neuroped:refresh", "e2e-refresh");
    sessionStorage.setItem("neuroped:user", JSON.stringify({
      id: "e2e-professional",
      email: "professional@example.test",
      name: "E2E Professional",
      role: "professional",
    }));
    for (const [key, value] of Object.entries(secure)) sessionStorage.setItem(key, value);
  }, { legacy: LEGACY_SENTINELS, secure: SECURE_SENTINELS });
}

async function snapshot(page) {
  return page.evaluate(({ legacyKeys, secureKeys }) => ({
    legacy: Object.fromEntries(legacyKeys.map((key) => [key, localStorage.getItem(key)])),
    secure: Object.fromEntries(secureKeys.map((key) => [key, sessionStorage.getItem(key)])),
  }), {
    legacyKeys: Object.keys(LEGACY_SENTINELS),
    secureKeys: Object.keys(SECURE_SENTINELS),
  });
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-previsit-block] build ausente. Rode build remoto antes.");
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
    await seed(page, base);

    await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("pre-consulta-local-persistence-disabled").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#pre-consulta-paciente").fill("MEMORY PRECONSULTA E2E");
    await page.getByText(/Paciente: MEMORY PRECONSULTA E2E/).waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByRole("button", { name: "Salvar pré-consulta" }).isVisible().catch(() => false)) {
      throw new Error("botão de persistência da pré-consulta ficou disponível em LIVE");
    }

    await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("pre-retorno-local-persistence-disabled").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#pre-retorno-paciente").fill("MEMORY PRERETORNO E2E");
    await page.getByText(/Paciente: MEMORY PRERETORNO E2E/).waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByRole("button", { name: "Salvar pré-retorno" }).isVisible().catch(() => false)) {
      throw new Error("botão de persistência do pré-retorno ficou disponível em LIVE");
    }

    await page.goto(`${base}/#/recepcao`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("recepcao-local-preconsulta-disabled").waitFor({ state: "visible", timeout: 15000 });
    await page.getByTestId("recepcao-live-tenant-source-required").waitFor({ state: "visible", timeout: 15000 });
    if (await page.getByText("LOCAL PRECONSULTA SENTINEL", { exact: true }).isVisible().catch(() => false)) {
      throw new Error("recepção exibiu dado local legado no LIVE");
    }

    const stored = await snapshot(page);
    if (JSON.stringify(stored.legacy) !== JSON.stringify(LEGACY_SENTINELS)) {
      throw new Error(`localStorage legado foi alterado em LIVE: ${JSON.stringify(stored.legacy)}`);
    }
    if (JSON.stringify(stored.secure) !== JSON.stringify(SECURE_SENTINELS)) {
      throw new Error(`sessionStorage cifrado/sentinela foi alterado em LIVE: ${JSON.stringify(stored.secure)}`);
    }

    const loginVisible = await page.getByRole("heading", { name: /entrar|login/i }).isVisible().catch(() => false);
    if (loginVisible) throw new Error("sessão remota E2E não foi reconhecida como autenticada");

    console.log("[live-previsit-block] ✓ LIVE: pré-consulta/pré-retorno só em memória, recepção sem fila local e storages preservados byte-a-byte");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-previsit-block] FALHOU:", error.message);
  process.exit(1);
});

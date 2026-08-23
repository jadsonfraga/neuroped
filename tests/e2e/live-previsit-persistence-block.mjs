import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const SENTINEL = {
  legacyPreConsulta: JSON.stringify([{
    id: "pc-local-sentinel",
    paciente: "TENANT-LOCAL-PRECONSULTA-SENTINEL",
    idadeMeses: 72,
    queixa: "tea",
    respondente: "pais",
    contexto: "primeira-consulta",
    status: "pronto-medico",
    createdAt: "2026-08-20T12:00:00.000Z",
  }]),
  legacyPreRetorno: JSON.stringify([{
    id: "pr-local-sentinel",
    paciente: "TENANT-LOCAL-PRERETORNO-SENTINEL",
    idade: "6 anos e 0 meses",
    ultimaConsulta: "2026-08-01",
    motivo: "sentinel",
    evolucao: "igual",
    sono: "igual",
    comportamento: "igual",
    escola: "sem informação",
    alimentacao: "igual",
    comunicacao: "igual",
    crises: "não tem",
    medicacao: "sem medicação",
    duvida: "sentinel",
    prioridade: "sentinel",
    observacoes: "sentinel",
    createdAt: "2026-08-20T12:00:00.000Z",
  }]),
  securePreConsulta: "OPAQUE-SECURE-PRECONSULTA-SENTINEL",
  securePreRetorno: "OPAQUE-SECURE-PRERETORNO-SENTINEL",
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
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
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
        json(res, 200, {
          database: "ok",
          authentication: { required: true, configured: true },
        });
        return;
      }
      if (pathname === "/api/auth/me") {
        if (req.headers.authorization !== "Bearer e2e-access") {
          json(res, 401, { error: "UNAUTHORIZED" });
          return;
        }
        json(res, 200, {
          id: "e2e-admin",
          email: "admin@example.test",
          name: "E2E Admin",
          role: "admin",
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

async function seedRemoteSessionAndSentinels(page, base) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate((sentinel) => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");

    sessionStorage.setItem("neuroped:access", "e2e-access");
    sessionStorage.setItem("neuroped:refresh", "e2e-refresh");
    sessionStorage.setItem("neuroped:user", JSON.stringify({
      id: "e2e-admin",
      email: "admin@example.test",
      name: "E2E Admin",
      role: "admin",
    }));

    localStorage.setItem("neuroped:pre-consultas", sentinel.legacyPreConsulta);
    localStorage.setItem("neuroped:pre-retornos", sentinel.legacyPreRetorno);
    sessionStorage.setItem("neuroped:secure:pre-consultas", sentinel.securePreConsulta);
    sessionStorage.setItem("neuroped:secure:pre-retornos", sentinel.securePreRetorno);
  }, SENTINEL);
}

async function snapshotPrevisitStorage(page) {
  return page.evaluate(() => ({
    legacyPreConsulta: localStorage.getItem("neuroped:pre-consultas"),
    legacyPreRetorno: localStorage.getItem("neuroped:pre-retornos"),
    securePreConsulta: sessionStorage.getItem("neuroped:secure:pre-consultas"),
    securePreRetorno: sessionStorage.getItem("neuroped:secure:pre-retornos"),
  }));
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
    await seedRemoteSessionAndSentinels(page, base);
    const before = await snapshotPrevisitStorage(page);

    await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("pre-consulta-live-memory-only").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#pre-consulta-paciente").fill("LIVE-MEMORY-PRECONSULTA");
    await page.getByRole("button", { name: "Preparar resumo" }).click();
    await page.getByText("LIVE-MEMORY-PRECONSULTA", { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });

    await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("pre-retorno-live-memory-only").waitFor({ state: "visible", timeout: 15000 });
    await page.locator("#pre-retorno-paciente").fill("LIVE-MEMORY-PRERETORNO");
    await page.getByRole("button", { name: "Preparar resumo" }).click();
    await page.getByText("LIVE-MEMORY-PRERETORNO", { exact: false }).first().waitFor({ state: "visible", timeout: 5000 });

    await page.goto(`${base}/#/recepcao`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("recepcao-live-local-queue-disabled").waitFor({ state: "visible", timeout: 15000 });
    await page.getByTestId("recepcao-live-local-queue-empty").waitFor({ state: "visible", timeout: 5000 });
    if (await page.getByText("TENANT-LOCAL-PRECONSULTA-SENTINEL", { exact: false }).count()) {
      throw new Error("Recepção exibiu pré-consulta local em LIVE");
    }

    const after = await snapshotPrevisitStorage(page);
    if (JSON.stringify(after) !== JSON.stringify(before)) {
      throw new Error(`storage clínico local foi alterado em LIVE: antes=${JSON.stringify(before)} depois=${JSON.stringify(after)}`);
    }

    if (before.legacyPreConsulta !== SENTINEL.legacyPreConsulta) throw new Error("sentinel legado de pré-consulta não foi semeado");
    if (before.legacyPreRetorno !== SENTINEL.legacyPreRetorno) throw new Error("sentinel legado de pré-retorno não foi semeado");
    if (before.securePreConsulta !== SENTINEL.securePreConsulta) throw new Error("sentinel secure de pré-consulta não foi semeado");
    if (before.securePreRetorno !== SENTINEL.securePreRetorno) throw new Error("sentinel secure de pré-retorno não foi semeado");

    console.log("[live-previsit-block] ✓ remoto autenticado: formulários em memória, recepção sem fila local e storage preservado byte a byte");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-previsit-block] FALHOU:", error.message);
  process.exit(1);
});

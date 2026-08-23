import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const EXPECT_LIVE_BLOCKED = process.env.EXPECT_LIVE_BLOCKED === "1";
const PRE_CONSULTA_KEY = "neuroped:pre-consultas";
const PRE_RETORNO_KEY = "neuroped:pre-retornos";
const SECURE_PRE_CONSULTA_KEY = "neuroped:secure:pre-consultas";
const SECURE_PRE_RETORNO_KEY = "neuroped:secure:pre-retornos";
const SECURE_SENTINEL_CONSULTA = "e2e-secure-pre-consulta-sentinel";
const SECURE_SENTINEL_RETORNO = "e2e-secure-pre-retorno-sentinel";

const legacyPreConsulta = [{
  id: "pc-tenant-b-legacy",
  paciente: "Tenant B legado",
  idadeMeses: 96,
  queixa: "tdah",
  respondente: "pais",
  contexto: "retorno",
  observacoes: "não deve aparecer no tenant LIVE",
  status: "pronto-medico",
  createdAt: "2026-08-22T12:00:00.000Z",
}];

const legacyPreRetorno = [{
  id: "pr-tenant-b-legacy",
  paciente: "Tenant B retorno legado",
  idade: "8 anos e 0 meses",
  ultimaConsulta: "2026-07-01",
  motivo: "revisão",
  evolucao: "igual",
  sono: "igual",
  comportamento: "igual",
  escola: "sem informação",
  alimentacao: "igual",
  comunicacao: "igual",
  crises: "não tem",
  medicacao: "sem medicação",
  sintomasTratamento: "",
  duvida: "",
  prioridade: "",
  observacoes: "não deve ser migrado em LIVE",
  createdAt: "2026-08-22T12:00:00.000Z",
}];

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
  await page.evaluate((payload) => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
    localStorage.setItem(payload.preConsultaKey, payload.preConsultaRaw);
    localStorage.setItem(payload.preRetornoKey, payload.preRetornoRaw);
    sessionStorage.setItem(payload.securePreConsultaKey, payload.secureConsultaSentinel);
    sessionStorage.setItem(payload.securePreRetornoKey, payload.secureRetornoSentinel);
    sessionStorage.setItem("neuroped:access", "e2e-access");
    sessionStorage.setItem("neuroped:refresh", "e2e-refresh");
    sessionStorage.setItem("neuroped:user", JSON.stringify({
      id: "e2e-professional",
      email: "professional@example.test",
      name: "E2E Professional",
      role: "professional",
    }));
  }, {
    preConsultaKey: PRE_CONSULTA_KEY,
    preRetornoKey: PRE_RETORNO_KEY,
    preConsultaRaw: JSON.stringify(legacyPreConsulta),
    preRetornoRaw: JSON.stringify(legacyPreRetorno),
    securePreConsultaKey: SECURE_PRE_CONSULTA_KEY,
    securePreRetornoKey: SECURE_PRE_RETORNO_KEY,
    secureConsultaSentinel: SECURE_SENTINEL_CONSULTA,
    secureRetornoSentinel: SECURE_SENTINEL_RETORNO,
  });
}

async function readStorageSentinels(page) {
  return page.evaluate((keys) => ({
    preConsulta: localStorage.getItem(keys.preConsulta),
    preRetorno: localStorage.getItem(keys.preRetorno),
    securePreConsulta: sessionStorage.getItem(keys.securePreConsulta),
    securePreRetorno: sessionStorage.getItem(keys.securePreRetorno),
  }), {
    preConsulta: PRE_CONSULTA_KEY,
    preRetorno: PRE_RETORNO_KEY,
    securePreConsulta: SECURE_PRE_CONSULTA_KEY,
    securePreRetorno: SECURE_PRE_RETORNO_KEY,
  });
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[previsit-persistence] build ausente. Rode build:client antes.");
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

    await page.goto(`${base}/#/recepcao`, { waitUntil: "domcontentloaded" });
    if (EXPECT_LIVE_BLOCKED) {
      await page.getByTestId("recepcao-live-local-queue-disabled").waitFor({ state: "visible", timeout: 15000 });
      if (await page.getByText("Tenant B legado", { exact: true }).isVisible().catch(() => false)) {
        throw new Error("recepção LIVE restaurou fila clínica local de outro tenant");
      }
    } else {
      await page.getByText("Tenant B legado", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    }

    await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
    if (EXPECT_LIVE_BLOCKED) {
      await page.getByTestId("pre-consulta-live-memory-only").waitFor({ state: "visible", timeout: 15000 });
      await page.locator("#pre-consulta-paciente").fill("Tenant A sessão");
      await page.getByRole("button", { name: "Manter nesta sessão" }).click();
    }

    await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
    if (EXPECT_LIVE_BLOCKED) {
      await page.getByTestId("pre-retorno-live-memory-only").waitFor({ state: "visible", timeout: 15000 });
      await page.locator("#pre-retorno-paciente").fill("Tenant A retorno sessão");
      await page.getByRole("button", { name: "Manter nesta sessão" }).click();
    } else {
      await page.locator("#pre-retorno-paciente").fill("Paciente local novo");
      await page.getByRole("button", { name: "Salvar pré-retorno" }).click();
    }

    const stored = await readStorageSentinels(page);
    if (EXPECT_LIVE_BLOCKED) {
      const expectedPreConsulta = JSON.stringify(legacyPreConsulta);
      const expectedPreRetorno = JSON.stringify(legacyPreRetorno);
      if (stored.preConsulta !== expectedPreConsulta) throw new Error("LIVE alterou/migrou legacy de pré-consulta");
      if (stored.preRetorno !== expectedPreRetorno) throw new Error("LIVE alterou/migrou legacy de pré-retorno");
      if (stored.securePreConsulta !== SECURE_SENTINEL_CONSULTA) throw new Error("LIVE tocou secureStorage de pré-consulta");
      if (stored.securePreRetorno !== SECURE_SENTINEL_RETORNO) throw new Error("LIVE tocou secureStorage de pré-retorno");
      console.log("[previsit-persistence] ✓ LIVE: recepção + pré-consulta + pré-retorno preservaram storage local byte a byte");
    } else {
      if (stored.preConsulta !== null) throw new Error("modo local deixou legacy de pré-consulta sem migrar");
      if (stored.preRetorno !== null) throw new Error("modo local deixou legacy de pré-retorno sem migrar");
      if (!stored.securePreConsulta || stored.securePreConsulta === SECURE_SENTINEL_CONSULTA) throw new Error("modo local não restaurou/migrou pré-consulta para secureStorage");
      if (!stored.securePreRetorno || stored.securePreRetorno === SECURE_SENTINEL_RETORNO) throw new Error("modo local não salvou pré-retorno em secureStorage");
      console.log("[previsit-persistence] ✓ local: restauração/migração protegida continua funcional");
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[previsit-persistence] FALHOU:", error.message);
  process.exit(1);
});

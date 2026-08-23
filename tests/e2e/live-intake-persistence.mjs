import { createServer } from "node:http";
import { existsSync, extname, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const mode = process.argv[2] || "remote";
if (!new Set(["local", "remote"]).has(mode)) {
  console.error("[live-intake] modo inválido; use local ou remote");
  process.exit(2);
}

const LEGACY = {
  preConsulta: "neuroped:pre-consultas",
  preRetorno: "neuroped:pre-retornos",
};
const SECURE = {
  preConsulta: "neuroped:secure:pre-consultas",
  preRetorno: "neuroped:secure:pre-retornos",
};
const SENTINELS = {
  [LEGACY.preConsulta]: JSON.stringify([
    {
      id: "pc-legacy-e2e",
      paciente: "SENTINELA PRÉ-CONSULTA LOCAL",
      idadeMeses: 72,
      queixa: "tea",
      respondente: "pais",
      contexto: "primeira-consulta",
      observacoes: "não migrar em LIVE",
      status: "pronto-medico",
      createdAt: "2026-08-23T00:00:00.000Z",
    },
  ]),
  [LEGACY.preRetorno]: JSON.stringify([
    {
      id: "pr-legacy-e2e",
      paciente: "SENTINELA PRÉ-RETORNO LOCAL",
      idade: "6 anos e 0 meses",
      ultimaConsulta: "2026-07",
      motivo: "não migrar em LIVE",
      evolucao: "igual",
      sono: "igual",
      comportamento: "igual",
      escola: "sem informação",
      alimentacao: "igual",
      comunicacao: "igual",
      crises: "não tem",
      medicacao: "sem medicação",
      duvida: "sentinela",
      prioridade: "sentinela",
      observacoes: "não migrar em LIVE",
      createdAt: "2026-08-23T00:00:00.000Z",
    },
  ]),
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
          authentication: {
            required: mode === "remote",
            configured: mode === "remote",
          },
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

async function seed(page, base, { authenticated }) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ sentinels, authenticated }) => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
    for (const [key, value] of Object.entries(sentinels)) localStorage.setItem(key, value);

    if (authenticated) {
      sessionStorage.setItem("neuroped:access", "e2e-access");
      sessionStorage.setItem("neuroped:refresh", "e2e-refresh");
      sessionStorage.setItem("neuroped:user", JSON.stringify({
        id: "e2e-professional",
        email: "professional@example.test",
        name: "E2E Professional",
        role: "professional",
      }));
    }
  }, { sentinels: SENTINELS, authenticated });
}

async function storageSnapshot(page) {
  return page.evaluate(({ legacy, secure }) => ({
    legacyPreConsulta: localStorage.getItem(legacy.preConsulta),
    legacyPreRetorno: localStorage.getItem(legacy.preRetorno),
    securePreConsulta: sessionStorage.getItem(secure.preConsulta),
    securePreRetorno: sessionStorage.getItem(secure.preRetorno),
  }), { legacy: LEGACY, secure: SECURE });
}

async function installTargetedStorageAudit(page) {
  await page.addInitScript(({ targets }) => {
    const targetSet = new Set(targets);
    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    window.__neuropedStorageTouches = [];

    Storage.prototype.getItem = function patchedGetItem(key) {
      if (targetSet.has(String(key))) {
        window.__neuropedStorageTouches.push({ op: "get", key: String(key), scope: this === localStorage ? "local" : "session" });
      }
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      if (targetSet.has(String(key))) {
        window.__neuropedStorageTouches.push({ op: "set", key: String(key), scope: this === localStorage ? "local" : "session" });
      }
      return originalSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function patchedRemoveItem(key) {
      if (targetSet.has(String(key))) {
        window.__neuropedStorageTouches.push({ op: "remove", key: String(key), scope: this === localStorage ? "local" : "session" });
      }
      return originalRemove.call(this, key);
    };
  }, { targets: [...Object.values(LEGACY), ...Object.values(SECURE)] });
}

async function runLocal(page, base) {
  await seed(page, base, { authenticated: false });

  await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Pré-consulta guiada" }).waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Paciente").fill("Novo paciente local");
  await page.getByRole("button", { name: "Salvar pré-consulta" }).click();

  let snapshot = await storageSnapshot(page);
  if (snapshot.legacyPreConsulta !== null) throw new Error("local: legado de pré-consulta não foi migrado/limpo");
  if (!snapshot.securePreConsulta) throw new Error("local: pré-consulta não foi gravada no cofre efêmero");

  await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Pré-retorno familiar" }).waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Paciente").fill("Novo retorno local");
  await page.getByRole("button", { name: "Salvar pré-retorno" }).click();

  snapshot = await storageSnapshot(page);
  if (snapshot.legacyPreRetorno !== null) throw new Error("local: legado de pré-retorno não foi migrado/limpo");
  if (!snapshot.securePreRetorno) throw new Error("local: pré-retorno não foi gravado no cofre efêmero");

  console.log("[live-intake] ✓ local/offline: pré-consulta e pré-retorno preservam persistência cifrada + migração legada");
}

async function runRemote(page, base) {
  await seed(page, base, { authenticated: true });
  await installTargetedStorageAudit(page);

  await page.goto(`${base}/#/pre-consulta`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("pre-consulta-local-persistence-disabled").waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Paciente").fill("Paciente LIVE somente memória");
  if (await page.getByRole("button", { name: "Salvar pré-consulta" }).count()) {
    throw new Error("remote: botão de salvar pré-consulta local permaneceu disponível");
  }

  await page.goto(`${base}/#/pre-retorno`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("pre-retorno-local-persistence-disabled").waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Paciente").fill("Retorno LIVE somente memória");
  if (await page.getByRole("button", { name: "Salvar pré-retorno" }).count()) {
    throw new Error("remote: botão de salvar pré-retorno local permaneceu disponível");
  }

  await page.goto(`${base}/#/recepcao`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("recepcao-local-queue-disabled").waitFor({ state: "visible", timeout: 15000 });
  if (await page.getByText("SENTINELA PRÉ-CONSULTA LOCAL").count()) {
    throw new Error("remote: Recepção exibiu fila proveniente do navegador");
  }

  const snapshot = await storageSnapshot(page);
  if (snapshot.legacyPreConsulta !== SENTINELS[LEGACY.preConsulta]) {
    throw new Error("remote: legado de pré-consulta foi lido/migrado/alterado");
  }
  if (snapshot.legacyPreRetorno !== SENTINELS[LEGACY.preRetorno]) {
    throw new Error("remote: legado de pré-retorno foi lido/migrado/alterado");
  }
  if (snapshot.securePreConsulta !== null || snapshot.securePreRetorno !== null) {
    throw new Error("remote: foi criada persistência cifrada local para intake");
  }

  const touches = await page.evaluate(() => window.__neuropedStorageTouches || []);
  if (touches.length) {
    throw new Error(`remote: storage clínico de intake foi tocado em LIVE: ${JSON.stringify(touches)}`);
  }

  const loginVisible = await page.getByRole("heading", { name: /entrar|login/i }).isVisible().catch(() => false);
  if (loginVisible) throw new Error("remote: sessão E2E não foi reconhecida como autenticada");

  console.log("[live-intake] ✓ remote/LIVE: 3 superfícies fail-closed, sem leitura, escrita ou migração do storage local");
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-intake] build ausente. Rode build:client antes do teste.");
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
    if (mode === "local") await runLocal(page, base);
    else await runRemote(page, base);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(`[live-intake] ${mode} FALHOU:`, error.message);
  process.exit(1);
});

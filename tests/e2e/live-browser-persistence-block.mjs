import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const DIST = "dist/public";
const PERSISTENT_DB = "neuroped-persistent-secure-v1";

const LEGACY_SENTINELS = {
  "neuroped:pre-consultas": "sentinel-pre-consulta",
  "neuroped:pre-retornos": "sentinel-pre-retorno",
  "neuroped:cognitive-lab:sessions": "sentinel-cognitive",
  "neuroped:caa:board:v1": "sentinel-caa-board",
  "neuroped:caa:favs:v1": "sentinel-caa-favs",
  "neuroped:caa:hist:v1": "sentinel-caa-hist",
  "neuroped:assinatura:registros:v1": "sentinel-signature",
  "neuroped:diario:sono:v1": "sentinel-diary",
  "neuroped:scale-draft:synthetic": "sentinel-scale-draft",
};

const SECURE_SENTINELS = {
  "neuroped:secure:pre-consultas": "sentinel-secure-pre-consulta",
  "neuroped:secure:pre-retornos": "sentinel-secure-pre-retorno",
  "neuroped:secure:cognitive-lab:sessions:v2": "sentinel-secure-cognitive",
  "neuroped:secure:caa:workspace:v3": "sentinel-secure-caa",
  "neuroped:secure:assinatura:registros:v2": "sentinel-secure-signature",
  "neuroped:secure:scale-draft:synthetic": "sentinel-secure-scale-draft",
};

const IDB_SENTINEL_KEYS = [
  "cognitive-lab:sessions:v2",
  "caa:workspace:v3",
  "assinatura:registros:v2",
  "agenda:workspace:v1",
  "conecta:events:synthetic-patient:v1",
  "diario:diario-sono",
];

const ROUTES = [
  "/pre-consulta",
  "/pre-retorno",
  "/caa",
  "/assinatura-digital",
  "/agenda",
  "/conecta",
  "/diario-sono",
  "/epilepsia",
  "/cefaleia",
];

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

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
      if (pathname === "/__e2e_blank__") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<!doctype html><html><body>e2e seed</body></html>");
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
      if (pathname === "/api/tenants") {
        json(res, 200, {
          data: [{
            id: "tenant-red-synthetic",
            slug: "tenant-red-synthetic",
            name: "Tenant RED Synthetic",
            legalName: null,
            timezone: "America/Recife",
            status: "active",
            role: "professional",
          }],
        });
        return;
      }
      if (pathname === "/api/patients") {
        json(res, 200, { data: [], pagination: { limit: 100, offset: 0, hasMore: false } });
        return;
      }
      if (pathname.startsWith("/api/")) {
        json(res, 404, { error: "E2E_ENDPOINT_NOT_STUBBED" });
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
  await page.evaluate(async ({ legacy, secure, idbKeys, dbName }) => {
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

    await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("keys")) db.createObjectStore("keys");
        if (!db.objectStoreNames.contains("values")) db.createObjectStore("values");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("values", "readwrite");
        const store = tx.objectStore("values");
        for (const key of idbKeys) store.put({ sentinel: true, key }, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, {
    legacy: LEGACY_SENTINELS,
    secure: SECURE_SENTINELS,
    idbKeys: IDB_SENTINEL_KEYS,
    dbName: PERSISTENT_DB,
  });
}

async function installAudit(page) {
  await page.addInitScript(({ dbName }) => {
    const clinicalKey = (raw) => {
      const key = String(raw || "").replace(/^neuroped:secure:/, "");
      if ([
        "pre-consultas",
        "pre-retornos",
        "cognitive-lab:sessions:v2",
        "caa:workspace:v3",
        "assinatura:registros:v2",
        "agenda:workspace:v1",
        "neuroped:pre-consultas",
        "neuroped:pre-retornos",
        "neuroped:cognitive-lab:sessions",
        "neuroped:caa:board:v1",
        "neuroped:caa:favs:v1",
        "neuroped:caa:hist:v1",
        "neuroped:assinatura:registros:v1",
        "np_filtro_state_v1",
        "neuroped:filter-flash",
      ].includes(key)) return true;
      return [
        "scale-draft:",
        "neuroped:scale-draft:",
        "diario:",
        "neuroped:diario:",
        "conecta:events:",
      ].some((prefix) => key.startsWith(prefix));
    };

    window.__neuropedGlobalPersistenceTouches = [];
    const touch = (entry) => window.__neuropedGlobalPersistenceTouches.push(entry);

    // O app instala sua própria fronteira de Storage. O auditor precisa permanecer
    // do lado de fora dela para provar a TENTATIVA de chamada, e não apenas o
    // acesso que conseguiu ultrapassar o guard. Um accessor preserva essa camada
    // mesmo quando o app reassina Storage.prototype.{get,set,remove}Item.
    const installStorageAudit = (method, operation) => {
      const descriptor = Object.getOwnPropertyDescriptor(Storage.prototype, method);
      let implementation = descriptor?.value;
      if (typeof implementation !== "function") return;

      Object.defineProperty(Storage.prototype, method, {
        configurable: true,
        enumerable: descriptor?.enumerable ?? false,
        get() {
          const captured = implementation;
          return function auditedStorageMethod(...args) {
            const key = args[0];
            if (clinicalKey(key)) {
              touch({ surface: "Storage", op: operation, key: String(key) });
            }
            return captured.apply(this, args);
          };
        },
        set(next) {
          if (typeof next === "function") implementation = next;
        },
      });
    };

    installStorageAudit("getItem", "get");
    installStorageAudit("setItem", "set");
    installStorageAudit("removeItem", "remove");

    const originalOpen = indexedDB.open.bind(indexedDB);
    const originalDeleteDatabase = indexedDB.deleteDatabase.bind(indexedDB);
    const originalCachePut = globalThis.Cache?.prototype?.put;

    indexedDB.open = function auditedOpen(name, version) {
      if (String(name) === dbName) touch({ surface: "IndexedDB", op: "open", key: String(name) });
      return version === undefined ? originalOpen(name) : originalOpen(name, version);
    };
    indexedDB.deleteDatabase = function auditedDeleteDatabase(name) {
      if (String(name) === dbName) touch({ surface: "IndexedDB", op: "deleteDatabase", key: String(name) });
      return originalDeleteDatabase(name);
    };

    if (originalCachePut) {
      globalThis.Cache.prototype.put = async function auditedCachePut(request, response) {
        const raw = typeof request === "string" ? request : request?.url || "";
        try {
          const url = new URL(raw, location.href);
          if (url.pathname.startsWith("/api/") || url.pathname.includes("/patients")) {
            touch({ surface: "Cache", op: "put", key: url.pathname });
          }
        } catch {
          // URL não analisável não contém evidência suficiente de PHI.
        }
        return originalCachePut.call(this, request, response);
      };
    }
  }, { dbName: PERSISTENT_DB });
}

async function assertNoTouches(page, label) {
  const touches = await page.evaluate(() => window.__neuropedGlobalPersistenceTouches);
  assert.ok(Array.isArray(touches), `${label}: auditor de persistência precisa estar instalado`);
  assert.equal(touches.length, 0,
    `${label}: persistência clínica browser-side tocada em LIVE: ${JSON.stringify(touches)}`);
}

async function exerciseCaa(page, base) {
  const customText = "Mensagem sintética CAA E2E";
  await page.getByRole("heading", { name: "Vou Falar!", exact: true }).waitFor({ timeout: 15000 });
  await page.waitForFunction(() => sessionStorage.getItem("neuroped:active-clinic-id") === "tenant-red-synthetic");
  await page.getByTestId("caa-session-only").waitFor();
  assert.equal(await page.getByTestId("live-browser-local-clinical-route-blocked").count(), 0);
  await assertNoTouches(page, "CAA: mount sem restauração de sentinelas legadas");

  // Instrumenta somente a saída para o sistema de voz; usa os handlers reais
  // da prancha e o SpeechSynthesisUtterance real. Não comprova áudio audível.
  await page.evaluate(() => {
    window.__caaSpeechRequests = [];
    window.speechSynthesis.speak = (utterance) => {
      window.__caaSpeechRequests.push({ text: utterance.text, lang: utterance.lang });
    };
    window.speechSynthesis.cancel = () => {};
  });
  const core = page.locator('section[aria-label="Palavras essenciais"] button');
  const speakPhrase = page.getByRole("button", { name: "Falar frase", exact: true });
  assert.equal(await speakPhrase.isDisabled(), true);
  await core.first().click();
  await speakPhrase.click();
  await page.getByRole("button", { name: "Repetir último", exact: true }).click();
  const speech = await page.evaluate(() => window.__caaSpeechRequests);
  assert.ok(speech.length >= 3, "cartão, frase e repetir precisam acionar síntese de voz");
  assert.ok(speech.every((item) => item.text && item.lang === "pt-BR"));
  await page.getByRole("button", { name: "Apagar último", exact: true }).click();
  assert.equal(await speakPhrase.isDisabled(), true);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await speakPhrase.click();
  await page.getByRole("button", { name: "Limpar", exact: true }).click();
  assert.equal(await speakPhrase.isDisabled(), true);

  for (const mode of ["Criança", "Família", "Terapeuta"]) {
    const button = page.getByRole("group", { name: "Selecionar modo de uso da CAA" })
      .getByRole("button", { name: mode, exact: true });
    await button.click();
    assert.equal(await button.getAttribute("aria-pressed"), "true");
  }
  await page.getByLabel("Cartão personalizado", { exact: true }).fill(customText);
  await page.getByRole("button", { name: "Adicionar à categoria", exact: true }).click();
  const search = page.getByLabel("Buscar palavra ou situação", { exact: true });
  await search.fill(customText);
  const customCard = page.locator(".np-scale-item").filter({ hasText: customText });
  await customCard.waitFor();
  await customCard.getByRole("button", { name: `Adicionar ${customText} aos favoritos`, exact: true }).click();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await customCard.waitFor();
  await customCard.getByRole("button").first().click();
  await speakPhrase.click();
  await page.getByRole("heading", { name: "Mensagens recentes", exact: true }).waitFor();
  await page.getByRole("button", { name: "Usados", exact: true }).click();
  await customCard.waitFor();

  await page.getByRole("button", { name: "Primeiro → Depois", exact: true }).click();
  await core.nth(0).click();
  await core.nth(1).click();
  await page.getByRole("button", { name: "Falar sequência", exact: true }).click();
  await page.getByRole("button", { name: "Ver status de salvamento da prancha", exact: true }).click();
  await page.getByText("Prancha disponível nesta sessão", { exact: true }).waitFor();
  assert.equal(await page.getByText("Prancha protegida e salva", { exact: true }).count(), 0);
  await assertNoTouches(page, "CAA: interações reais sem salvamento automático");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar prancha", exact: true }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  assert.ok(stream, "exportação explícita precisa entregar bytes");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const exportedBytes = Buffer.concat(chunks);
  const exported = JSON.parse(exportedBytes.toString("utf8"));
  assert.ok(Object.values(exported.board).some((category) => category.items.some((item) => item[1] === customText)));
  assert.ok(exported.favs.length && exported.hist.length && exported.messages.length);
  await assertNoTouches(page, "CAA: exportação explícita não usa storage clínico");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByTestId("caa-session-only").waitFor({ timeout: 15000 });
  await page.waitForFunction(() => sessionStorage.getItem("neuroped:active-clinic-id") === "tenant-red-synthetic");
  assert.equal(await speakPhrase.isDisabled(), true);
  await search.fill(customText);
  await page.getByText("Nenhum cartão encontrado neste filtro.", { exact: true }).waitFor();
  assert.equal(await customCard.count(), 0, "reload não pode restaurar a personalização LIVE");
  await assertNoTouches(page, "CAA: reload sem leitura/gravação legada");

  await page.getByLabel("Importar prancha de um arquivo JSON", { exact: true }).setInputFiles({
    name: "caa-synthetic.json",
    mimeType: "application/json",
    buffer: exportedBytes,
  });
  await customCard.waitFor();
  await assertNoTouches(page, "CAA: importação explícita somente em memória");

  await page.goto(`${base}/#/familia`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Vou Falar!", exact: true }).waitFor({ state: "hidden" });
  await page.goto(`${base}/#/caa`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("caa-session-only").waitFor();
  assert.equal(await speakPhrase.isDisabled(), true);
  await search.fill(customText);
  await page.getByText("Nenhum cartão encontrado neste filtro.", { exact: true }).waitFor();
  assert.equal(await customCard.count(), 0, "sair da rota precisa descartar o workspace LIVE");
  await assertNoTouches(page, "CAA: retorno à rota inicia nova prancha em memória");
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-browser-persistence] build ausente; gere build remote antes do E2E");
    process.exit(1);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch(auditBrowserLaunchOptions());
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    await seed(page, base);
    await installAudit(page);

    for (const route of ROUTES) {
      await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
      await page.locator("body").waitFor({ state: "visible", timeout: 15000 });
      await page.waitForTimeout(250);
      const loginVisible = await page.getByRole("heading", { name: /entrar|login/i }).isVisible().catch(() => false);
      if (loginVisible) throw new Error(`sessão E2E não foi reconhecida em ${route}`);
      if (route === "/caa") await exerciseCaa(page, base);
      if (route === "/assinatura-digital") {
        await page.getByTestId("live-browser-local-clinical-route-blocked").waitFor({ timeout: 15000 });
      }
      await assertNoTouches(page, route);
    }

    await assertNoTouches(page, "matriz LIVE completa");

    // Nova aba sem sessionStorage de autenticação: a rota pública deve continuar
    // utilizável sem PIN/assinatura e sem herdar dados da sessão profissional.
    const guest = await context.newPage();
    await installAudit(guest);
    await guest.goto(`${base}/#/caa`, { waitUntil: "domcontentloaded" });
    await guest.getByTestId("caa-session-only").waitFor({ timeout: 15000 });
    assert.equal(await guest.evaluate(() => sessionStorage.getItem("neuroped:access")), null);
    await guest.locator('section[aria-label="Palavras essenciais"] button').first().click();
    await guest.getByRole("button", { name: "Falar frase", exact: true }).click();
    const guestTouches = await guest.evaluate(() => window.__neuropedGlobalPersistenceTouches);
    assert.ok(Array.isArray(guestTouches), "auditor da CAA pública deve estar instalado");
    // Sem sessão, o shell pode REMOVER o estado legado do filtro (observado no
    // CI 36424834616). Isso não é leitura/persistência da CAA. Não mudar o app
    // nem impedir uma limpeza legítima para satisfazer um teste sobre o LIVE
    // autenticado. A exceção é exata: nenhum get/set, outra chave, IDB ou Cache.
    // A matriz autenticada acima permanece estritamente zero, inclusive remove.
    for (const touch of guestTouches) {
      assert.deepEqual(touch, { surface: "Storage", op: "remove", key: "np_filtro_state_v1" },
        "CAA pública não pode ler/gravar/remover workspace nem tocar IndexedDB/Cache clínico");
    }
    await guest.close();

    console.log(`[live-browser-persistence] ✓ ${ROUTES.length} jornadas LIVE + CAA pública; fala/interações/exportação/importação/reset sem Storage/IndexedDB/Cache clínico proibido`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-browser-persistence] FALHOU:", error.message);
  process.exit(1);
});

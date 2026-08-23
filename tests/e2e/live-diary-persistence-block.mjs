import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const DB_NAME = "neuroped-persistent-secure-v1";
const DB_VERSION = 1;
const KEY_STORE = "keys";
const VALUE_STORE = "values";
const SENTINELS = {
  "diario:neuroped-desenvolvimento-brasil-v1": "development-existing-local",
  "diario:diario-escola": "school-existing-local",
  "diario:diario-sono": "sleep-existing-local",
  "diario:diario-alimentar": "food-existing-local",
  "diario:epilepsia:v1": "epilepsy-existing-local",
  "diario:cefaleia:v1": "headache-existing-local",
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

async function seedRemoteSessionAndLocalDiaries(page, base) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate(async ({ dbName, dbVersion, keyStore, valueStore, sentinels }) => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
    sessionStorage.setItem("neuroped:access", "e2e-access");
    sessionStorage.setItem("neuroped:refresh", "e2e-refresh");
    sessionStorage.setItem("neuroped:user", JSON.stringify({
      id: "e2e-professional",
      email: "professional@example.test",
      name: "E2E Professional",
      role: "professional",
    }));

    await new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(keyStore)) db.createObjectStore(keyStore);
        if (!db.objectStoreNames.contains(valueStore)) db.createObjectStore(valueStore);
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(valueStore, "readwrite");
        const store = tx.objectStore(valueStore);
        for (const [key, marker] of Object.entries(sentinels)) {
          store.put({ e2eSentinel: marker }, key);
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      };
    });
  }, {
    dbName: DB_NAME,
    dbVersion: DB_VERSION,
    keyStore: KEY_STORE,
    valueStore: VALUE_STORE,
    sentinels: SENTINELS,
  });
}

async function readDiarySentinels(page) {
  return page.evaluate(async ({ dbName, valueStore }) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(valueStore, "readonly");
        const store = tx.objectStore(valueStore);
        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();
        tx.oncomplete = () => {
          const output = {};
          keysRequest.result.forEach((key, index) => {
            output[String(key)] = valuesRequest.result[index];
          });
          db.close();
          resolve(output);
        };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, { dbName: DB_NAME, valueStore: VALUE_STORE });
}

async function assertBlockedRoute(page, base, route, testId) {
  await page.goto(`${base}/#${route}`, { waitUntil: "domcontentloaded" });
  await page.getByTestId(testId).waitFor({ state: "visible", timeout: 15000 });
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-diary-block] build ausente. Rode build remoto antes.");
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
    await seedRemoteSessionAndLocalDiaries(page, base);

    await page.goto(`${base}/#/neuroacompanhamento`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("neuroacompanhamento-page").waitFor({ state: "visible", timeout: 15000 });
    await page.getByTestId("clinical-school-correlation-live-blocked").waitFor({ state: "visible", timeout: 15000 });
    await page.getByTestId("diario-local-persistence-disabled").waitFor({ state: "visible", timeout: 15000 });

    await assertBlockedRoute(page, base, "/diario-escola", "diario-local-persistence-disabled");
    await assertBlockedRoute(page, base, "/diario-sono", "diario-local-persistence-disabled");
    await assertBlockedRoute(page, base, "/diario-alimentar", "diario-local-persistence-disabled");
    await assertBlockedRoute(page, base, "/epilepsia", "epilepsy-diary-local-persistence-disabled");
    await assertBlockedRoute(page, base, "/cefaleia", "headache-diary-local-persistence-disabled");

    const stored = await readDiarySentinels(page);
    const storedKeys = Object.keys(stored).sort();
    const expectedKeys = Object.keys(SENTINELS).sort();
    if (JSON.stringify(storedKeys) !== JSON.stringify(expectedKeys)) {
      throw new Error(`cofre local alterado em LIVE; chaves=${JSON.stringify(storedKeys)}`);
    }
    for (const [key, marker] of Object.entries(SENTINELS)) {
      if (stored[key]?.e2eSentinel !== marker) {
        throw new Error(`dado local foi lido/migrado/alterado em LIVE: ${key}`);
      }
    }

    const loginVisible = await page.getByRole("heading", { name: /entrar|login/i }).isVisible().catch(() => false);
    if (loginVisible) throw new Error("sessão remota E2E não foi reconhecida como autenticada");

    console.log("[live-diary-block] ✓ remoto autenticado: 6 superfícies bloqueadas e IndexedDB local preservado sem migração");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-diary-block] FALHOU:", error.message);
  process.exit(1);
});

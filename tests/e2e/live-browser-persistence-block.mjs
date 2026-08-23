import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

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
  "/cognitive-lab",
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

    const originalGet = Storage.prototype.getItem;
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    const originalOpen = indexedDB.open.bind(indexedDB);
    const originalCachePut = globalThis.Cache?.prototype?.put;

    window.__neuropedGlobalPersistenceTouches = [];
    const touch = (entry) => window.__neuropedGlobalPersistenceTouches.push(entry);

    Storage.prototype.getItem = function auditedGet(key) {
      if (clinicalKey(key)) touch({ surface: "Storage", op: "get", key: String(key) });
      return originalGet.call(this, key);
    };
    Storage.prototype.setItem = function auditedSet(key, value) {
      if (clinicalKey(key)) touch({ surface: "Storage", op: "set", key: String(key) });
      return originalSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function auditedRemove(key) {
      if (clinicalKey(key)) touch({ surface: "Storage", op: "remove", key: String(key) });
      return originalRemove.call(this, key);
    };

    indexedDB.open = function auditedOpen(name, version) {
      if (String(name) === dbName) touch({ surface: "IndexedDB", op: "open", key: String(name) });
      return version === undefined ? originalOpen(name) : originalOpen(name, version);
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

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-browser-persistence] build ausente; gere build remote antes do E2E");
    process.exit(1);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
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
    }

    const touches = await page.evaluate(() => window.__neuropedGlobalPersistenceTouches || []);
    if (touches.length > 0) {
      throw new Error(`persistência clínica browser-side tocada em LIVE: ${JSON.stringify(touches)}`);
    }

    console.log(`[live-browser-persistence] ✓ ${ROUTES.length} jornadas LIVE sem Storage/IndexedDB/Cache clínico proibido`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-browser-persistence] FALHOU:", error.message);
  process.exit(1);
});

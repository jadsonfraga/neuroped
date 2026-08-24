import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";

const DIST = "dist/public";
const RED_CLINIC = "tenant-red-synthetic";
const BLUE_CLINIC = "tenant-blue-synthetic";
const RED_SENTINEL = "SENTINEL_RED_PATIENT_SYNTHETIC";
const BLUE_SENTINEL = "SENTINEL_BLUE_PATIENT_SYNTHETIC";
const SYNTHETIC_PASSWORD = "SyntheticOnly!123";

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

const accounts = new Map([
  ["switch@example.test", {
    accessToken: "switch-access",
    refreshToken: "switch-refresh",
    user: { id: "switch-user", email: "switch@example.test", name: "Switch User Synthetic", role: "professional", mustChangePassword: false },
    clinics: [RED_CLINIC, BLUE_CLINIC],
  }],
  ["blue@example.test", {
    accessToken: "blue-access",
    refreshToken: "blue-refresh",
    user: { id: "blue-user", email: "blue@example.test", name: "Blue User Synthetic", role: "professional", mustChangePassword: false },
    clinics: [BLUE_CLINIC],
  }],
]);

const byAccess = new Map(Array.from(accounts.values(), (account) => [account.accessToken, account]));
const requestLog = [];

function tokenLabel(token) {
  if (!token) return "anonymous";
  if (token === "switch-access") return "switch-account";
  if (token === "blue-access") return "blue-account";
  return "unknown-synthetic-token";
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function bodyJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function bearer(req) {
  const raw = String(req.headers.authorization || "");
  return raw.startsWith("Bearer ") ? raw.slice(7) : "";
}

function clinicMembership(id) {
  return {
    id,
    slug: id,
    name: id === RED_CLINIC ? "TENANT RED Synthetic" : "TENANT BLUE Synthetic",
    legalName: null,
    timezone: "America/Recife",
    status: "active",
    role: "professional",
  };
}

function patientForClinic(id) {
  return {
    id: id === RED_CLINIC ? "patient-red-synthetic" : "patient-blue-synthetic",
    clinicId: id,
    status: "active",
    profile: {
      name: id === RED_CLINIC ? RED_SENTINEL : BLUE_SENTINEL,
      birthDate: "2018-01-01",
      notes: "synthetic-only-security-e2e",
    },
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  };
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const rawUrl = req.url || "/";
      const url = new URL(rawUrl, "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      const token = bearer(req);
      const account = byAccess.get(token);
      requestLog.push({
        method: req.method || "GET",
        pathname,
        search: url.search,
        auth: tokenLabel(token),
      });

      if (pathname === "/__e2e_blank__") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<!doctype html><html><body>tenant boundary seed</body></html>");
        return;
      }
      if (pathname === "/api/health") {
        json(res, 200, { database: "ok", authentication: { required: true, configured: true } });
        return;
      }
      if (pathname === "/api/auth/login" && req.method === "POST") {
        const body = await bodyJson(req);
        const selected = accounts.get(String(body.email || "").toLocaleLowerCase("en-US"));
        if (!selected || body.password !== SYNTHETIC_PASSWORD) {
          json(res, 401, { error: "INVALID_SYNTHETIC_CREDENTIALS" });
          return;
        }
        json(res, 200, {
          accessToken: selected.accessToken,
          refreshToken: selected.refreshToken,
          expiresIn: 900,
          user: selected.user,
        });
        return;
      }
      if (pathname === "/api/auth/logout" && req.method === "POST") {
        json(res, 200, { ok: true });
        return;
      }
      if (pathname === "/api/auth/me") {
        if (!account) {
          json(res, 401, { error: "UNAUTHORIZED" });
          return;
        }
        json(res, 200, account.user);
        return;
      }
      if (pathname === "/api/tenants") {
        if (!account) {
          json(res, 401, { error: "UNAUTHORIZED" });
          return;
        }
        json(res, 200, { data: account.clinics.map(clinicMembership) });
        return;
      }
      if (pathname === "/api/live/patients") {
        if (!account) {
          json(res, 401, { error: "UNAUTHORIZED" });
          return;
        }
        const clinicId = url.searchParams.get("clinicId") || "";
        if (!account.clinics.includes(clinicId)) {
          json(res, 404, { error: "NOT_FOUND" });
          return;
        }
        json(res, 200, { data: [patientForClinic(clinicId)], total: 1, page: 1, limit: 50 });
        return;
      }
      if (pathname.startsWith("/api/")) {
        json(res, 404, { error: "E2E_ENDPOINT_NOT_STUBBED" });
        return;
      }

      try {
        let file = join(DIST, pathname);
        if (!existsSync(file) || statSync(file).isDirectory()) file = join(DIST, "index.html");
        const response = readFileSync(file);
        res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
        res.end(response);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function prepareBrowser(page, base) {
  await page.goto(`${base}/__e2e_blank__`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });
}

async function login(page, base, email) {
  await page.goto(`${base}/#/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("E-mail profissional").fill(email);
  await page.getByLabel("Senha").fill(SYNTHETIC_PASSWORD);
  await page.getByRole("button", { name: "Entrar com segurança" }).click();
  await page.waitForFunction((expectedEmail) => {
    const access = sessionStorage.getItem("neuroped:access");
    const rawUser = sessionStorage.getItem("neuroped:user");
    if (!access || !rawUser) return false;
    try {
      return JSON.parse(rawUser)?.email === expectedEmail;
    } catch {
      return false;
    }
  }, email);
}

async function openPatients(page, base, expectedSentinel) {
  await page.goto(`${base}/#/pacientes`, { waitUntil: "domcontentloaded" });
  await page.getByText(expectedSentinel, { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
}

async function syntheticDiagnostics(page, phase) {
  const browserState = await page.evaluate(() => ({
    url: location.href,
    storedClinicId: sessionStorage.getItem("neuroped:active-clinic-id"),
    hasAccessToken: Boolean(sessionStorage.getItem("neuroped:access")),
    hasStoredUser: Boolean(sessionStorage.getItem("neuroped:user")),
    timeOrigin: performance.timeOrigin,
  })).catch(() => ({
    url: page.url(),
    storedClinicId: "page-evaluation-failed",
    hasAccessToken: false,
    hasStoredUser: false,
    timeOrigin: null,
  }));

  const switcher = page.getByTestId("select-active-clinic");
  const switcherVisible = await switcher.isVisible().catch(() => false);
  const switcherValue = switcherVisible ? await switcher.inputValue().catch(() => "unreadable") : "not-visible";
  const redVisible = await page.getByText(RED_SENTINEL, { exact: true }).isVisible().catch(() => false);
  const blueVisible = await page.getByText(BLUE_SENTINEL, { exact: true }).isVisible().catch(() => false);

  return {
    phase,
    browserState,
    switcherValue,
    redVisible,
    blueVisible,
    requests: requestLog.slice(-30),
  };
}

async function switchClinic(page, clinicId, expectedSentinel, phase) {
  const select = page.getByTestId("select-active-clinic");
  await select.waitFor({ state: "visible", timeout: 15_000 });
  const previousTimeOrigin = await page.evaluate(() => performance.timeOrigin);
  const navigation = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame(),
    timeout: 15_000,
  });

  try {
    await select.selectOption(clinicId);
    await navigation;
    await page.waitForLoadState("domcontentloaded");
    const nextTimeOrigin = await page.evaluate(() => performance.timeOrigin);
    if (nextTimeOrigin === previousTimeOrigin) {
      throw new Error(`${phase}: navegação ocorreu sem recriar o documento`);
    }
  } catch (error) {
    console.error(
      `[live-tenant-session-boundary] ${phase} sem hard reload válido:`,
      JSON.stringify(await syntheticDiagnostics(page, phase)),
    );
    throw error;
  }

  try {
    await page.getByText(expectedSentinel, { exact: true }).waitFor({ state: "visible", timeout: 15_000 });
  } catch (error) {
    console.error(
      `[live-tenant-session-boundary] ${phase} sem sentinela esperada:`,
      JSON.stringify(await syntheticDiagnostics(page, phase)),
    );
    throw error;
  }
}

async function scanForNeedle(page, needle) {
  return page.evaluate(async (needleValue) => {
    const hits = [];
    const inspect = (surface, key, value) => {
      let serialized = "";
      try { serialized = typeof value === "string" ? value : JSON.stringify(value); } catch { serialized = String(value); }
      if (serialized.includes(needleValue)) hits.push({ surface, key });
    };

    inspect("DOM", "body.innerText", document.body.innerText || "");
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      inspect("localStorage", key, localStorage.getItem(key));
    }
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index) || "";
      inspect("sessionStorage", key, sessionStorage.getItem(key));
    }

    const databases = typeof indexedDB.databases === "function" ? await indexedDB.databases() : [];
    for (const descriptor of databases) {
      if (!descriptor.name) continue;
      try {
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(descriptor.name);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          for (const storeName of Array.from(db.objectStoreNames)) {
            const values = await new Promise((resolve, reject) => {
              const tx = db.transaction(storeName, "readonly");
              const request = tx.objectStore(storeName).getAll();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            });
            inspect("IndexedDB", `${descriptor.name}/${storeName}`, values);
          }
        } finally {
          db.close();
        }
      } catch {
        // Banco inacessível não é tratado como prova positiva; os stores clínicos
        // conhecidos continuam cobertos pelo gate global de persistência LIVE.
      }
    }

    if ("caches" in globalThis) {
      for (const cacheName of await caches.keys()) {
        const cache = await caches.open(cacheName);
        for (const request of await cache.keys()) {
          const response = await cache.match(request);
          inspect("Cache", `${cacheName}:${request.url}`, response ? await response.clone().text() : "");
        }
      }
    }
    return hits;
  }, needle);
}

function requireNoHits(hits, phase) {
  if (hits.length > 0) {
    throw new Error(`${phase}: dado RED permaneceu acessível no cliente: ${JSON.stringify(hits)}`);
  }
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[live-tenant-session-boundary] build ausente; gere build remote antes do E2E");
    process.exit(1);
  }

  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  try {
    await prepareBrowser(page, base);

    // 1) Troca RED→BLUE é uma fronteira forte: limpa queries/memória, persiste
    // somente o novo clinic_id não clínico e recria o shell antes de consultar BLUE.
    await login(page, base, "switch@example.test");
    await openPatients(page, base, RED_SENTINEL);
    await switchClinic(page, BLUE_CLINIC, BLUE_SENTINEL, "clinic switch RED→BLUE");
    if (await page.getByText(RED_SENTINEL, { exact: true }).count()) {
      throw new Error("clinic switch: paciente RED continuou renderizado após troca para BLUE");
    }
    requireNoHits(await scanForNeedle(page, RED_SENTINEL), "clinic switch");
    const blueFetches = requestLog.filter((entry) => entry.pathname === "/api/live/patients" && entry.search.includes(`clinicId=${BLUE_CLINIC}`));
    if (blueFetches.length === 0) throw new Error("clinic switch: BLUE não disparou nova consulta tenant-scoped");

    // Volta a RED para provar o boundary de logout exatamente RED -> login BLUE.
    await switchClinic(page, RED_CLINIC, RED_SENTINEL, "clinic switch BLUE→RED");

    // 2) Logout RED e login BLUE no MESMO BrowserContext. O botão executa
    // logout, clear do React Query/secure store e reload. Depois do relogin, RED
    // não pode existir em DOM, Storage, IndexedDB ou Cache API.
    await page.getByTestId("button-session-exit").click();
    await page.getByRole("heading", { name: "Entrar na área profissional" }).waitFor({ state: "visible", timeout: 15_000 });
    requireNoHits(await scanForNeedle(page, RED_SENTINEL), "post-logout RED");

    // Reutiliza a mesma rotina de login e só avança quando a identidade BLUE
    // estiver de fato persistida. Isso impede que page.goto() aborte o POST de
    // autenticação e transforme uma condição de corrida do teste em falso P0.
    await login(page, base, "blue@example.test");
    await openPatients(page, base, BLUE_SENTINEL);
    requireNoHits(await scanForNeedle(page, RED_SENTINEL), "BLUE after RED logout");

    const activeClinic = await page.getByTestId("select-active-clinic").inputValue();
    if (activeClinic !== BLUE_CLINIC) throw new Error(`relogin: clínica ativa inesperada ${activeClinic}`);
    if (await page.getByText(RED_SENTINEL, { exact: true }).count()) {
      throw new Error("relogin: paciente RED reapareceu para usuário BLUE");
    }

    console.log("[live-tenant-session-boundary] ✓ hard reload RED→BLUE/BLUE→RED recria shell e consulta somente o tenant selecionado");
    console.log("[live-tenant-session-boundary] ✓ logout RED→login BLUE no mesmo Chromium sem RED em DOM/Storage/IndexedDB/Cache");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[live-tenant-session-boundary] FALHOU:", error.message);
  process.exit(1);
});

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

const DIST = "dist/public";
const SESSION_KEY = "np_filtro_session_v1";
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

const E2E_USER = {
  id: "filter-roundtrip-professional",
  email: "filter-roundtrip@neuroped.invalid",
  name: "Filter Roundtrip",
  role: "professional",
};

const FILTER_STATE = {
  search: "",
  selectedAge: "2-4a",
  selectedQueixas: ["tea"],
  selectedRespondente: "pais",
  selectedCommunication: "nonverbal",
  selectedLiteracy: "preliterate",
  selectedAssessmentType: "diagnostic",
  selectedSignalIds: [],
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      try {
        const pathname = decodeURIComponent((req.url || "/").split("?")[0]);
        let file = join(DIST, pathname);
        if (!existsSync(file) || statSync(file).isDirectory()) {
          file = join(DIST, "index.html");
        }
        const body = readFileSync(file);
        res.writeHead(200, {
          "Content-Type": MIME[extname(file)] || "application/octet-stream",
        });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function waitForApp(page) {
  await page
    .getByTestId("splash-screen")
    .waitFor({ state: "detached", timeout: 15_000 })
    .catch(() => {});
}

async function openFilterEngine(page) {
  const ageBands = page.getByTestId("age-band-scroll");
  if (await ageBands.isVisible().catch(() => false)) return;

  try {
    // O `main` trazia um retry externo em volta do clique em
    // `button-open-filter`, porque a tela do filtro entra sob PageTransition e
    // o botão podia ser trocado por uma instância nova no meio do retry
    // interno do Playwright. Esse botão deixou de existir: o filtro carrega o
    // motor sozinho, então não há clique a repetir — só a espera pelo
    // conteúdo, com folga para a mesma transição animada. Se o filtro não
    // abrir de verdade, o timeout sobe com o mesmo diagnóstico de antes.
    await ageBands.waitFor({ state: "visible", timeout: 30_000 });
  } catch (error) {
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `filtro não abriu; url=${page.url()} body=${body.replace(/\s+/g, " ").slice(0, 500)}; ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function assertPressed(page, locator, label) {
  await locator.waitFor({ state: "visible", timeout: 15_000 });
  const value = await locator.getAttribute("aria-pressed");
  if (value !== "true") {
    throw new Error(`${label}: aria-pressed=${String(value)}; filtro não foi restaurado`);
  }
}

async function assertFilterUi(page) {
  await assertPressed(
    page,
    page.getByRole("button", { name: "Faixa etária 2–4 anos" }),
    "idade 2–4 anos",
  );
  await assertPressed(
    page,
    page.getByRole("button", { name: /Autismo \/ TEA/ }),
    "queixa TEA",
  );
  await assertPressed(
    page,
    page.getByRole("button", { name: "Respondente: pais ou cuidador" }),
    "respondente pais",
  );
  await assertPressed(
    page,
    page.getByRole("button", { name: "Comunicação: criança não-verbal" }),
    "comunicação não-verbal",
  );
  await assertPressed(
    page,
    page.getByRole("button", { name: "Alfabetização: criança pré-alfabetizada" }),
    "pré-alfabetização",
  );
}

async function answerInteractiveScale(page) {
  const groups = page.locator('[role="radiogroup"]');
  await groups.first().waitFor({ state: "visible", timeout: 15_000 });
  const total = await groups.count();
  if (total < 1) throw new Error("Q-CHAT-10: nenhum item interativo encontrado");

  for (let index = 0; index < total; index += 1) {
    const options = groups.nth(index).locator('[role="radio"]');
    const optionCount = await options.count();
    if (optionCount < 1) {
      throw new Error(`Q-CHAT-10 item ${index + 1}: sem opções`);
    }
    await options.nth(Math.min(1, optionCount - 1)).click();
  }
}

async function assertPdf(page) {
  const button = page.getByTestId("button-print-report");
  await button.waitFor({ state: "visible", timeout: 15_000 });

  const reportSnapshot = page.locator("[data-scale-response-report] pre").first();
  await reportSnapshot.waitFor({ state: "attached", timeout: 15_000 });
  const beforePdf = await reportSnapshot.textContent();
  if (!beforePdf?.trim()) throw new Error("Q-CHAT-10 PDF: snapshot textual vazio");

  const pending = page.waitForEvent("download", { timeout: 20_000 });
  await button.click();
  const download = await pending;
  const failure = await download.failure();
  if (failure) throw new Error(`Q-CHAT-10 PDF: ${failure}`);

  const afterPdf = await reportSnapshot.textContent();
  if (afterPdf !== beforePdf) {
    throw new Error("Q-CHAT-10 PDF: data/perguntas/respostas mudaram durante exportação");
  }

  const path = await download.path();
  if (!path) throw new Error("Q-CHAT-10 PDF: arquivo temporário ausente");
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error("Q-CHAT-10 PDF: assinatura inválida");
  }
  const parsed = await PDFDocument.load(bytes);
  if (parsed.getPageCount() < 1) throw new Error("Q-CHAT-10 PDF: sem páginas");
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("build ausente; execute npm run build:client antes do roundtrip");
  }

  const server = await startStaticServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath
      ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
      : undefined,
  );
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
    acceptDownloads: true,
  });

  try {
    await page.addInitScript(
      ({ user, filterState, sessionKey }) => {
        localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
        localStorage.setItem("neuroped:onboarding-seen", "1");
        localStorage.setItem("np_tour_intro_v2", "done");
        localStorage.setItem("np_tour_v2_done", "1");
        sessionStorage.setItem("neuroped:access", "filter-roundtrip-access");
        sessionStorage.setItem("neuroped:refresh", "filter-roundtrip-refresh");
        sessionStorage.setItem("neuroped:user", JSON.stringify(user));
        sessionStorage.setItem(sessionKey, JSON.stringify(filterState));
      },
      { user: E2E_USER, filterState: FILTER_STATE, sessionKey: SESSION_KEY },
    );

    await page.route("**/api/health", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "ok",
          authentication: { required: true, configured: true },
        }),
      }),
    );
    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(E2E_USER),
      }),
    );
    await page.route("**/api/tenants", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      }),
    );
    await page.route("**/api/patients**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" }),
    );

    await page.goto(`${base}/#/filtro`, { waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await openFilterEngine(page);
    await assertFilterUi(page);

    const before = await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY);
    if (!before) throw new Error("estado do filtro não existe antes de abrir escala");

    await page.goto(`${base}/#/generic-scale/q-chat-10`, {
      waitUntil: "domcontentloaded",
    });
    await waitForApp(page);
    await answerInteractiveScale(page);
    const submit = page.getByTestId("button-submit");
    await submit.waitFor({ state: "visible", timeout: 15_000 });
    if (await submit.isDisabled()) throw new Error("Q-CHAT-10: submit permaneceu desabilitado");
    await submit.click();
    await page
      .locator("[data-scale-response-report]")
      .waitFor({ state: "visible", timeout: 15_000 });
    await assertPdf(page);

    await page.goBack({ waitUntil: "domcontentloaded" });
    await waitForApp(page);
    await openFilterEngine(page);
    await assertFilterUi(page);

    const after = await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY);
    if (!after) throw new Error("estado do filtro desapareceu após ida-e-volta");
    const parsedAfter = JSON.parse(after);
    for (const [key, expected] of Object.entries(FILTER_STATE)) {
      if (JSON.stringify(parsedAfter[key]) !== JSON.stringify(expected)) {
        throw new Error(
          `roundtrip filtro: ${key} mudou de ${JSON.stringify(expected)} para ${JSON.stringify(parsedAfter[key])}`,
        );
      }
    }

    console.log(
      "[filter-interactive-pdf-roundtrip] ✓ filtro restaurado + Q-CHAT-10 concluído + PDF/snapshot estáveis + retorno sem perda de contexto",
    );
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error("[filter-interactive-pdf-roundtrip] FALHOU:", error.message);
  process.exit(1);
});

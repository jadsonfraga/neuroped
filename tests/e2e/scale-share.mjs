/**
 * Regressão E2E do envio de escala extensa.
 *
 * Executa um clique real no botão do ClinicalReport e confirma que a folha
 * nativa recebe o relatório completo. O teste também impede que o fluxo volte
 * a copiar silenciosamente para o clipboard ou a abrir um fallback incompleto.
 *
 * Uso: npm run build:client && npm run test:e2e:scale-share
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
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
  ".webmanifest": "application/manifest+json",
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
        res.writeHead(200, {
          "Content-Type": MIME[extname(file)] || "application/octet-stream",
        });
        res.end(readFileSync(file));
      } catch {
        res.writeHead(404);
        res.end("not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function answerAll(page) {
  const groups = page.locator('[role="radiogroup"]');
  const count = await groups.count();
  assert.ok(count > 0, "a escala deve renderizar perguntas");
  for (let index = 0; index < count; index += 1) {
    const labels = groups.nth(index).locator("label");
    const optionCount = await labels.count();
    assert.ok(optionCount > 0, `a pergunta ${index + 1} deve ter opções`);
    await labels.nth(Math.min(1, optionCount - 1)).click();
  }
}

async function main() {
  assert.ok(
    existsSync(join(DIST, "index.html")),
    "build ausente: rode npm run build:client antes do E2E",
  );

  const external = process.env.E2E_BASE_URL;
  const server = external ? null : await startStaticServer();
  const base = external || `http://127.0.0.1:${server.address().port}`;
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath
      ? {
          executablePath,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : undefined,
  );

  try {
    const context = await browser.newContext({
      serviceWorkers: "block",
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => {
      console.error(`[scale-share-e2e] erro da página: ${error.message}`);
    });
    page.on("requestfailed", (request) => {
      if (request.url().startsWith("https://fonts.")) return;
      console.error(
        `[scale-share-e2e] recurso falhou: ${request.url()} — ${request.failure()?.errorText}`,
      );
    });
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message.text().includes("Failed to load resource")
      ) {
        console.error(`[scale-share-e2e] console: ${message.text()}`);
      }
    });

    await page.addInitScript(() => {
      try {
        localStorage.setItem("neuroped:private-gate:persist", "1");
        localStorage.setItem(
          "neuroped:private-gate:persist-expires",
          String(Date.now() + 60 * 60 * 1000),
        );
        localStorage.setItem(
          "neuroped:aviso-educativo-aceito-v1",
          JSON.stringify({
            accepted: true,
            at: new Date().toISOString(),
            v: 1,
          }),
        );
        localStorage.setItem("neuroped:onboarding-seen", "1");
        localStorage.setItem("np_tour_v2_done", "1");
      } catch {
        // O primeiro documento about:blank pode não expor localStorage.
      }

      window.__scaleSharePayload = null;
      window.__scaleClipboardCalls = 0;
      window.__scaleWindowOpenCalls = 0;

      Object.defineProperty(navigator, "canShare", {
        configurable: true,
        value: () => false,
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data) => {
          window.__scaleSharePayload = {
            title: data.title || "",
            text: data.text || "",
            files: data.files?.length || 0,
          };
        },
      });
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            window.__scaleClipboardCalls += 1;
          },
        },
      });
      window.open = () => {
        window.__scaleWindowOpenCalls += 1;
        return null;
      };
    });

    await page.route("**/api/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    // Fontes externas não participam do comportamento e podem bloquear o
    // primeiro módulo em ambientes de CI sem acesso à internet pública.
    await page.route("https://fonts.googleapis.com/**", (route) =>
      route.abort(),
    );
    await page.route("https://fonts.gstatic.com/**", (route) => route.abort());

    // Vanderbilt é extensa o bastante para reproduzir o antigo corte de 1.800
    // caracteres que transformava "Enviar" em uma simples cópia.
    await page.goto(`${base}/#/vanderbilt`, { waitUntil: "commit" });
    try {
      await page
        .locator('[role="radiogroup"]')
        .first()
        .waitFor({ timeout: 15000 });
    } catch (error) {
      console.error(`[scale-share-e2e] URL atual: ${page.url()}`);
      console.error(
        `[scale-share-e2e] tela: ${(await page.locator("body").innerText()).slice(0, 800)}`,
      );
      throw error;
    }
    await page.waitForTimeout(1500);
    await answerAll(page);

    const submit = page.getByTestId("button-submit");
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-testid="button-submit"]')
          ?.getAttribute("aria-disabled") !== "true",
      { timeout: 10000 },
    );
    await submit.click();

    const report = page.locator("[data-scale-response-report]");
    await report.waitFor({ timeout: 10000 });
    const items = await report.locator("ol > li").evaluateAll((nodes) =>
      nodes.map((node) => {
        const paragraphs = [...node.querySelectorAll("p")]
          .map((paragraph) => paragraph.textContent?.trim() || "")
          .filter(Boolean);
        return {
          question: paragraphs[0] || "",
          answer: paragraphs.at(-1) || "",
        };
      }),
    );
    assert.ok(items.length >= 20, "o cenário deve produzir uma escala extensa");

    await page.getByTestId("button-whatsapp-report").click();
    await page.waitForFunction(() => Boolean(window.__scaleSharePayload), {
      timeout: 5000,
    });

    const state = await page.evaluate(() => ({
      payload: window.__scaleSharePayload,
      clipboardCalls: window.__scaleClipboardCalls,
      windowOpenCalls: window.__scaleWindowOpenCalls,
    }));
    assert.ok(state.payload?.text, "o clique deve abrir o compartilhamento");
    assert.ok(
      encodeURIComponent(state.payload.text).length > 1800,
      "o relatório testado deve ultrapassar o antigo limite de URL",
    );
    assert.equal(
      state.payload.files,
      0,
      "sem suporte a arquivo, deve compartilhar texto",
    );
    assert.equal(state.clipboardCalls, 0, "não pode copiar silenciosamente");
    assert.equal(
      state.windowOpenCalls,
      0,
      "não deve acionar fallback após compartilhar",
    );

    for (const item of [items[0], items.at(-1)]) {
      assert.ok(state.payload.text.includes(item.question));
      assert.ok(state.payload.text.includes(item.answer));
    }

    console.log(
      `✓ clique real compartilhou ${items.length} perguntas e respostas integrais, sem clipboard`,
    );
  } finally {
    await browser.close();
    if (server) server.close();
  }
}

main().catch((error) => {
  console.error("[scale-share-e2e] FALHOU:", error.message);
  process.exit(1);
});

import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const clinicalApi = createSyntheticClinicalApi();
const server = await startStaticServer(ensureClientBuild(process.cwd(), "authenticated"), {
  port: 4668,
  apiHandler(request, response, pathname, query) {
    if (pathname === "/api/operations" && query.get("resource") === "financial_report") {
      // O GET de relatório não retorna a mesma estrutura do dashboard.
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        period: { from: query.get("from"), to: query.get("to"), basis: "appointment_date" },
        summary: {
          appointments: 0, attended: 0, completed: 0, cancelled: 0, noShow: 0,
          expectedCents: 0, paidCents: 0, pendingCents: 0, refundedCents: 0, waivedCount: 0, noAmountCount: 0,
        },
        byPaymentMethod: [], byService: [], rows: [], truncated: false,
      }));
      return true;
    }
    return clinicalApi(request, response, pathname, query);
  },
});
let browser;
try {
  const response = await fetch(`${server.origin}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(SYNTHETIC_CREDENTIALS),
  });
  assert.equal(response.status, 200);
  const session = await response.json();
  browser = await chromium.launch(auditBrowserLaunchOptions());
  for (const width of [360, 390, 820, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, hasTouch: width < 1024, reducedMotion: "reduce" });
    try {
      await context.addInitScript(({ storage, session }) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        sessionStorage.setItem("neuroped:access", session.accessToken);
        sessionStorage.setItem("neuroped:refresh", session.refreshToken);
        sessionStorage.setItem("neuroped:user", JSON.stringify(session.user));
      }, { storage: ACCEPTED_FIRST_VISIT_STORAGE, session });
      const page = await context.newPage();
      await page.goto(`${server.origin}/#/agenda`);
      const shell = page.getByTestId("agenda-shell");
      const list = shell.getByRole("tablist");
      await list.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const cramped = await list.getByRole("tab").evaluateAll(nodes => nodes
        .map(tab => {
          const rect = tab.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(tab);
          const text = range.getBoundingClientRect();
          return { label: tab.innerText, textWidth: text.width, buttonWidth: rect.width };
        }).filter(tab => (tab.buttonWidth + 1) < tab.textWidth));
      assert.deepEqual(cramped, [], `rótulos devem caber em suas abas a ${width}px`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const first = list.getByRole("tab", { name: "Agenda", exact: true });
      const last = list.getByRole("tab").last();
      await first.focus();
      await page.keyboard.press("End");
      await last.and(list.getByRole("tab", { selected: true })).waitFor({ timeout: 4000 });
      await page.getByTestId("financial-summary").waitFor({ timeout: 4000 });
      await page.waitForFunction(() => {
        const tab = document.activeElement;
        const bar = tab?.closest('[role="tablist"]');
        if (!tab || !bar) return false;
        const a = tab.getBoundingClientRect(), b = bar.getBoundingClientRect();
        return a.left >= b.left - 1 && a.right <= b.right + 1;
      });
      await page.keyboard.press("Home");
      await first.and(list.getByRole("tab", { selected: true })).waitFor({ timeout: 4000 });
      if (process.env.NEUROPED_AGENDA_SCREENSHOT && width === 390) {
        await page.screenshot({ path: process.env.NEUROPED_AGENDA_SCREENSHOT, animations: "disabled" });
      }
      console.log(`✓ Agenda ${width}px: rótulos legíveis, sem overflow e teclado alcança as abas`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser?.close();
  await server.close();
}

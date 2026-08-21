import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const origins = ["https://neuroped.pages.dev", "https://superneuroped.vercel.app"];
const routes = ["/#/", "/#/filtro", "/#/mchat", "/#/marcacao", "/#/missao-saude", "/#/prontuario"];
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const output = { startedAt: new Date().toISOString(), environments: [] };
const browser = await chromium.launch(executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined);
try {
  for (const origin of origins) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e-error-trace");
      localStorage.setItem("neuroped:onboarding-seen", "1");
      localStorage.setItem("np_tour_intro_v2", "done");
      localStorage.setItem("np_tour_v2_done", "1");
    });
    const page = await context.newPage();
    const env = { origin, routes: [], consoleErrors: [], pageErrors: [], responses: [] };
    page.on("console", (message) => { if (message.type() === "error") env.consoleErrors.push({ url: page.url(), text: message.text() }); });
    page.on("pageerror", (error) => env.pageErrors.push({ url: page.url(), text: error.message }));
    page.on("response", async (response) => {
      const status = response.status();
      if (status < 400) return;
      const request = response.request();
      let body = "";
      try { body = (await response.text()).replace(/\s+/g, " ").slice(0, 300); } catch {}
      env.responses.push({ page: page.url(), url: response.url(), method: request.method(), status, resource: request.resourceType(), body });
    });
    for (const route of routes) {
      try { await page.goto(origin + route, { waitUntil: "domcontentloaded", timeout: 30000 }); await page.waitForTimeout(2500); env.routes.push({ route, finalUrl: page.url(), title: await page.title() }); } catch (error) { env.routes.push({ route, error: String(error?.message ?? error) }); }
    }
    await context.close();
    output.environments.push(env);
  }
} finally { await browser.close(); }
output.finishedAt = new Date().toISOString();
await mkdir("artifacts/e2e", { recursive: true });
await writeFile("artifacts/e2e/published-error-trace.json", JSON.stringify(output, null, 2));
for (const env of output.environments) {
  console.log(`\n[${env.origin}]`);
  console.log("console:", JSON.stringify(env.consoleErrors, null, 2));
  console.log("pageerrors:", JSON.stringify(env.pageErrors, null, 2));
  console.log("responses:", JSON.stringify(env.responses, null, 2));
}

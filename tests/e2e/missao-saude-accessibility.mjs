import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  startStaticServer,
} from "../../scripts/lib/browser-audit-runtime.mjs";

const repoRoot = process.cwd();
const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist, 0);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const browser = await chromium.launch(
  executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
);

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await context.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();

  await page.goto(`${server.origin}/#/missao-saude`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /pequenas explorações/i }).waitFor();
  assert.equal(await page.locator("main").count(), 1, "microsite deve expor exatamente um landmark main");
  assert.equal(await page.locator("h1").count(), 1, "microsite deve expor exatamente um h1");
  assert.equal(await page.getByRole("button", { name: /entrar na estação/i }).count(), 3, "as três estações precisam estar disponíveis por teclado");

  await page.getByRole("button", { name: /entrar na estação/i }).first().click();
  await page.getByRole("button", { name: /passos curiosos/i }).click();
  await page.getByRole("button", { name: /voltar ao mapa/i }).click();
  await page.locator("article").filter({ hasText: "Uma conversa por vez" }).getByRole("button").click();
  await page.getByRole("button", { name: /mover .* para baixo/i }).first().click();
  await page.getByRole("button", { name: /marcar minha exploração/i }).click();
  await page.getByRole("button", { name: /voltar ao mapa/i }).click();
  await page.locator("article").filter({ hasText: "Ritmo que acolhe" }).getByRole("button").click();
  await page.getByRole("button", { name: /guardar esta ideia/i }).click();
  await page.getByRole("button", { name: /voltar ao mapa/i }).click();

  await page.getByRole("heading", { name: /toda descoberta merece espaço/i }).waitFor();
  assert.equal(await page.getByRole("link", { name: /falar com a secretaria ia/i }).count(), 1, "resultado deve oferecer encaminhamento administrativo");
  assert.equal(await page.getByRole("link", { name: /ver horários/i }).count(), 1, "resultado deve oferecer acesso à agenda pública");

  const axe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(axe.violations, [], `violações axe: ${axe.violations.map((item) => item.id).join(", ")}`);
  await context.close();
  console.log("✓ Missão Saúde: fluxo touch, landmarks e auditoria axe aprovados");
} finally {
  await browser.close();
  await server.close();
}

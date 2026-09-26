/** Real built navigation with the existing synthetic login API. No auth bypass,
 * clinical endpoint replacement, React-state injection or patient writes. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import {
  startStaticServer,
  auditBrowserLaunchOptions,
  ACCEPTED_FIRST_VISIT_STORAGE,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

const artifactDir = process.env.NAVIGATION_ARTIFACT_DIR || "/tmp/featured-navigation-proof";
await mkdir(artifactDir, { recursive: true });
const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
await context.addInitScript((storage) => {
  for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
}, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
const clinicalWrites = [];
const screens = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
      /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) {
    clinicalWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
  }
});
const sidebar = page.locator(".np-app-sidebar");
const game = () => sidebar.locator('a[href="/super-neuropad-game"]:visible');
const sonda = () => sidebar.locator('a[href="/testes-diretos"]:visible');
const obs = () => sidebar.locator('a[href="/avaliacao-pre-consulta-faixa-etaria"]:visible');
const preSection = () => sidebar.getByRole("button", { name: "PRÉ-CONSULTA GUIADA", exact: true });
const hrefs = (locator) => locator.evaluateAll((nodes) =>
  nodes.map((node) => node.closest("a")?.getAttribute("href")));

async function screenshot(name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false,
    `${name}: shell sem rolagem horizontal`);
  await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: true });
  screens.push(name);
}

async function assertExpandedNavigation() {
  assert.deepEqual(await hrefs(sidebar.locator(".np-side-hero:visible")), ["/super-neuropad-game"], "Super NeuroPad Game é o cartão-herói");
  assert.equal(await game().count(), 1, "Super NeuroPad Game aparece uma única vez no destaque");
  assert.equal(await sonda().count(), 1, "Sonda permanece imediatamente disponível após o jogo");
  assert.equal(await obs().count(), 1, "OBS permanece disponível no destaque");
  assert.equal((await sonda().textContent())?.includes("Sonda Dez · Avaliação Direta"), true);
  assert.equal((await obs().textContent())?.includes("OBS-10 · Pré-Consulta"), true);
  assert.deepEqual(await hrefs(sidebar.locator(".np-side-connection:visible")), [
    "/marcacao", "/conecta", "/eletroencefalograma", "/nesplora/",
  ], "os quatro destinos aparecem exclusivamente no bloco Conexões");
  assert.equal(await sidebar.getByText("Conexões", { exact: true }).count(), 1);
  const clinicalHrefs = await hrefs(sidebar.locator(".np-side-hero:visible, .np-side-tile:visible"));
  for (const href of ["/marcacao", "/conecta", "/eletroencefalograma", "/nesplora/"]) {
    assert.equal(clinicalHrefs.includes(href), false, `${href} não ocupa cartão clínico`);
  }
}

async function waitForObsAutoScroll() {
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  // Observe geometry without clicking/scrolling the target itself: only the
  // application's route effect can make this item visible.
  await page.waitForFunction(() => {
    const item = document.querySelector('#sidebar-nav [data-testid="nav-OBS-10 · Pré-Consulta"]');
    const scroll = document.querySelector(".np-sidebar-scroll");
    if (!item || !scroll || item.getAttribute("data-active") !== "true") return false;
    const rect = item.getBoundingClientRect();
    const visible = scroll.getBoundingClientRect();
    return rect.height > 0 && rect.top >= visible.top - 1 && rect.bottom <= visible.bottom + 1;
  });
  assert.equal(await preSection().getAttribute("aria-expanded"), "true");
  assert.equal(await sidebar.locator('#sidebar-nav [data-testid="nav-OBS-10 · Pré-Consulta"]').count(), 1);
}

try {
  await page.goto(`${server.origin}/#/testes-diretos`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.getByTestId("sonda-digital").waitFor({ timeout: 20000 });
  await preSection().waitFor();
  assert.equal(await preSection().getAttribute("aria-expanded"), "false",
    "pré-consulta começa fechada antes da navegação por OBS");
  await assertExpandedNavigation();
  await sonda().scrollIntoViewIfNeeded();
  await screenshot("01-desktop-clinico");
  await sidebar.locator(".np-side-connection:visible").last().scrollIntoViewIfNeeded();
  await screenshot("02-desktop-conexoes");
  await obs().click();
  await waitForObsAutoScroll();
  assert.equal(new URL(page.url()).hash, "#/avaliacao-pre-consulta-faixa-etaria");
  await screenshot("03-obs-secao-ativa");

  // Persist a closed section through the UI, then load the OBS route directly.
  // The auth/bootstrap path must reveal it after navigation hydration as well.
  await preSection().click();
  assert.equal(await preSection().getAttribute("aria-expanded"), "false");
  await page.reload();
  await waitForObsAutoScroll();

  // Exploring another group must preserve the user's scroll position, rather
  // than running the active-route positioning effect again after every toggle.
  const reference = sidebar.getByRole("button", { name: "REFERÊNCIA", exact: true });
  assert.equal(await reference.getAttribute("aria-expanded"), "false");
  await reference.scrollIntoViewIfNeeded();
  const referenceBefore = await reference.boundingBox();
  assert.ok(referenceBefore);
  await reference.click();
  assert.equal(await reference.getAttribute("aria-expanded"), "true");
  // Let the group's 320 ms expansion finish before reading stable geometry.
  await page.waitForTimeout(400);
  const referenceAfter = await reference.boundingBox();
  assert.ok(referenceAfter);
  assert.ok(Math.abs(referenceAfter.y - referenceBefore.y) <= 2,
    "abrir Referência mantém seu título no lugar, sem voltar ao item OBS ativo");
  assert.equal(await reference.evaluate((heading) => {
    const viewport = heading.closest(".np-sidebar-scroll").getBoundingClientRect();
    const rect = heading.getBoundingClientRect();
    return rect.top >= viewport.top - 1 && rect.bottom <= viewport.bottom + 1;
  }), true, "o grupo escolhido continua visível após a expansão");

  await page.getByTestId("button-sidebar-toggle").click();
  const rail = sidebar.locator(".np-side-rail-icon:visible");
  assert.deepEqual((await hrefs(rail)).slice(0, 3), [
    "/super-neuropad-game", "/testes-diretos", "/avaliacao-pre-consulta-faixa-etaria",
  ], "menu recolhido preserva Super NeuroPad Game, Sonda e OBS no topo");
  assert.equal((await hrefs(rail)).at(-1), "/nesplora/", "Nesplora mantém link real no menu recolhido");
  await rail.first().scrollIntoViewIfNeeded();
  await screenshot("04-desktop-recolhido");
  await rail.first().click();
  await page.getByText("1 · Idade da criança (anos)", { exact: true }).waitFor({ timeout: 20000 });
  await rail.nth(1).click();
  await page.getByTestId("sonda-digital").waitFor({ timeout: 20000 });
  await rail.nth(2).click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  await page.getByTestId("button-sidebar-toggle").click();
  await sonda().click();
  await page.getByTestId("sonda-digital").waitFor({ timeout: 20000 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("button-mobile-menu").click();
  await assertExpandedNavigation();
  await sonda().scrollIntoViewIfNeeded();
  await screenshot("05-celular-clinico");
  await sidebar.locator(".np-side-connection:visible").last().scrollIntoViewIfNeeded();
  await screenshot("06-celular-conexoes");
  // Close via the UI so the next featured click must auto-expand the section.
  if (await preSection().getAttribute("aria-expanded") === "true") await preSection().click();
  assert.equal(await preSection().getAttribute("aria-expanded"), "false");
  await obs().click();
  await page.getByTestId("obs10-workspace").waitFor({ timeout: 20000 });
  assert.equal(await page.getByTestId("button-mobile-menu").getAttribute("aria-expanded"), "false",
    "navegação por OBS fecha o drawer móvel");
  await page.getByTestId("button-mobile-menu").click();
  await waitForObsAutoScroll();
  await sonda().click();
  await page.getByTestId("sonda-digital").waitFor({ timeout: 20000 });
  assert.equal(await page.getByTestId("button-mobile-menu").getAttribute("aria-expanded"), "false");
  assert.deepEqual(errors, [], "sem exceções JavaScript");
  assert.deepEqual(clinicalWrites, [], "navegação não grava dados clínicos");
  await writeFile(`${artifactDir}/result.json`, JSON.stringify({
    passed: true, screens, exceptions: errors, clinicalWrites,
    scope: "Built React UI, synthetic authenticated login, desktop/mobile/collapsed links and OBS section auto-scroll.",
  }, null, 2));
  console.log("✓ navegação: hierarquia Super NeuroPad/Sonda/OBS, Conexões, Nesplora, desktop/celular/recolhido e auto-scroll OBS");
} catch (error) {
  await page.screenshot({ path: `${artifactDir}/failure.png`, fullPage: true });
  await writeFile(`${artifactDir}/failure.txt`, String(error.stack || error));
  throw error;
} finally {
  await context.close();
  await browser.close();
  await server.close();
}

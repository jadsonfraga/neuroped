import { chromium } from "playwright";
import fs from "node:fs/promises";

const root = process.env.OUTPUT_ROOT ?? "/home/ubuntu/neuroped/premium-audit/before";
const base = process.env.BASE_URL ?? "http://localhost:5173";
await fs.rm(root, { recursive: true, force: true });
await fs.mkdir(root, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [];

async function settle(page, wait = 2800) {
  await page.waitForTimeout(wait);
  await page.addStyleTag({
    content: '[role="dialog"] { display: none !important; pointer-events: none !important; }',
  });
  await page.evaluate(() => {
    document.body.style.overflow = "auto";
  });
}

async function capture(page, name, extra = {}) {
  const metrics = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    activeNav: [...document.querySelectorAll('#sidebar-nav a[aria-current="page"]')].map((el) => el.textContent?.replace(/\s+/g, " ").trim()),
    groups: [...document.querySelectorAll('#sidebar-nav button[aria-expanded]')].map((el) => ({ label: el.textContent?.replace(/\s+/g, " ").trim(), expanded: el.getAttribute("aria-expanded") })),
    tabs: [...document.querySelectorAll('[role="tab"]')].map((el) => ({ label: el.textContent?.replace(/\s+/g, " ").trim(), selected: el.getAttribute("aria-selected") })),
    featured: [...document.querySelectorAll('[data-testid^="featured-"]')].map((el) => el.textContent?.replace(/\s+/g, " ").trim()),
  }));
  const path = `${root}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  results.push({ name, path, metrics, ...extra });
}

for (const viewport of [{ key: "desktop", width: 1440, height: 900 }, { key: "mobile", width: 390, height: 844 }]) {
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await page.goto(`${base}/#/`, { waitUntil: "networkidle" });
  await settle(page);
  await capture(page, `home-${viewport.key}`, { scenario: "primeira impressão" });

  if (viewport.key === "desktop") {
    const documentGroup = page.locator('#sidebar-nav button[aria-controls]').filter({ hasText: "DOCUMENTAR" }).first();
    await documentGroup.click();
    await page.waitForTimeout(200);
    await capture(page, "home-sidebar-documentar-desktop", { scenario: "sidebar com grupo Documentar expandido" });

    await page.getByTestId("input-search").fill("laudo");
    await page.waitForTimeout(500);
    await capture(page, "home-search-laudo-desktop", { scenario: "busca contextual por laudo" });

    await page.goto(`${base}/#/`, { waitUntil: "networkidle" });
    await settle(page);
    await page.getByTestId("button-command-palette").click();
    await page.waitForTimeout(300);
    await capture(page, "home-command-palette-desktop", { scenario: "paleta de comando aberta" });
  } else {
    await page.getByTestId("button-mobile-menu").click();
    await page.waitForTimeout(300);
    await capture(page, "home-sidebar-open-mobile", { scenario: "sidebar móvel aberta" });
  }
  await page.close();

  const explore = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await explore.goto(`${base}/#/explorar`, { waitUntil: "networkidle" });
  await settle(explore);
  await capture(explore, `explorar-${viewport.key}`, { scenario: "catálogo por seções" });
  const exploreDoc = explore.locator('[data-testid="explore-section-documentar"] button').first();
  if (await exploreDoc.count()) {
    await exploreDoc.click();
    await explore.waitForTimeout(200);
    await capture(explore, `explorar-documentar-open-${viewport.key}`, { scenario: "catálogo com Documentar aberto" });
  } else {
    await capture(explore, `explorar-documentar-open-${viewport.key}`, { scenario: "catálogo completo no estado anterior" });
  }
  await explore.close();

  const agenda = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await agenda.goto(`${base}/#/agenda`, { waitUntil: "networkidle" });
  await settle(agenda);
  const agendaTabs = agenda.locator('[role="tab"]');
  if (await agendaTabs.count() > 1) {
    await agendaTabs.nth(1).click();
    await agenda.waitForTimeout(180);
  }
  await capture(agenda, `agenda-tab-${viewport.key}`, { scenario: "Agenda com aba secundária selecionada" });
  await agenda.close();

  const tea = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
  await tea.goto(`${base}/#/tea-checklists`, { waitUntil: "networkidle" });
  await settle(tea);
  const teaTabs = tea.locator('[role="tab"]');
  if (await teaTabs.count() > 2) {
    await teaTabs.nth(2).click();
    await tea.waitForTimeout(180);
  }
  await capture(tea, `tea-checklists-tab-${viewport.key}`, { scenario: "Checklists TEA com aba ativa" });
  await tea.close();
}

await browser.close();
await fs.writeFile(`${root}/report.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));

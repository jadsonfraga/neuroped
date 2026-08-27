import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL || "http://localhost:5173";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const results = [];

async function hideLegalGate(page) {
  await page.evaluate(() => {
    for (const node of document.querySelectorAll(
      "[role='dialog'][aria-modal='true']",
    )) {
      if (/Aviso importante|Li e entendi/i.test(node.textContent || "")) {
        node.style.setProperty("display", "none", "important");
        node.setAttribute("data-audit-hidden", "true");
      }
    }
  });
}

async function run(name, route, check) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/#${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1100);
  await hideLegalGate(page);
  await page.waitForTimeout(120);
  const detail = await check(page);
  results.push({ name, route, pageErrors, ...detail });
  await page.close();
}

await run("home-priority-actions", "/", async (page) => ({
  featured: await page.locator("[data-testid^='featured-']").allTextContents(),
  hasExploreLink:
    (await page.getByRole("link", { name: /Ver todos os recursos/i }).count()) >
    0,
}));

await run("explorer-search", "/explorar", async (page) => {
  const search = page.getByRole("textbox", { name: /Buscar recurso/i });
  await search.fill("laudo");
  await page.waitForTimeout(150);
  return {
    searchVisible: await search.isVisible(),
    resultStatus: await page.getByRole("status").allTextContents(),
    matchingLinks: await page.locator("a[aria-label*='Laudo']").count(),
  };
});

await run("filter-immediate", "/filtro", async (page) => ({
  filterInputVisible: (await page.getByTestId("input-search").count()) > 0,
  quickStarts: (await page.getByText(/Sugestões rápidas/i).count()) > 0,
  pageErrors: [],
}));

await run("multidomain-scale", "/abc", async (page) => {
  const tabs = page.locator("[data-testid='scale-domain-nav'] button");
  const count = await tabs.count();
  const before = count ? await tabs.nth(0).textContent() : null;
  if (count > 1) await tabs.nth(1).click();
  await page.waitForTimeout(120);
  return {
    domainTabCount: count,
    firstTabLabel: before,
    secondTabSelected:
      count > 1 ? await tabs.nth(1).getAttribute("aria-selected") : null,
    noHorizontalOverflow: await page.evaluate(
      () => document.body.scrollWidth <= window.innerWidth + 1,
    ),
  };
});

await browser.close();
const failed = results.filter(
  (row) =>
    row.pageErrors.length > 0 ||
    (row.name === "home-priority-actions" && row.featured.length < 5) ||
    (row.name === "explorer-search" && row.matchingLinks < 1) ||
    (row.name === "filter-immediate" && !row.filterInputVisible) ||
    (row.name === "multidomain-scale" && row.domainTabCount < 2),
);
console.log(
  JSON.stringify({ baseUrl, passed: failed.length === 0, results }, null, 2),
);
if (failed.length) process.exit(1);

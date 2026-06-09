import { mkdirSync } from "node:fs";
import { launchBrowser } from "./browser-launch.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
const outDir = "test-results/filter-visual";

async function assertCardsFit(page) {
  const cards = page.locator(".filter-260-card");
  const count = Math.min(await cards.count(), 8);
  if (count === 0) throw new Error("nenhum card do filtro foi renderizado");

  for (let i = 0; i < count; i += 1) {
    const card = cards.nth(i);
    const box = await card.boundingBox();
    if (!box || box.width < 120 || box.height < 80) throw new Error(`card ${i} sem dimensao util`);

    const overflowing = await card.evaluate((node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT);
      while (walker.nextNode()) {
        const element = walker.currentNode;
        if (!(element instanceof HTMLElement)) continue;
        if (!["A", "BUTTON", "H1", "H2", "H3", "P", "SPAN"].includes(element.tagName)) continue;
        const className = String(element.className);
        if (className.includes("filter-260-card-content") || className.includes("filter-260-card") || className.includes("filter-260-head")) continue;
        if (className.includes("line-clamp")) continue;
        if (element.scrollWidth > element.clientWidth + 2) {
          return `${element.tagName}.${className}`;
        }
      }
      return "";
    });
    if (overflowing) throw new Error(`overflow visual no card ${i}: ${overflowing}`);
  }
}

async function selectScenario(page) {
  await page.goto(`${baseUrl}/#/filtro`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Filtro/i).first().waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: /2/i }).first().click();
  await page.getByRole("button", { name: /Autismo|TEA/i }).first().click();
  await page.getByText(/Recomenda/i).first().waitFor({ timeout: 10000 });
}

async function run() {
  mkdirSync(outDir, { recursive: true });
  const browser = await launchBrowser();

  for (const viewport of [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport });
    await selectScenario(page);
    await assertCardsFit(page);
    await page.screenshot({ path: `${outDir}/${viewport.name}.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
  console.log(`[filter-visual] screenshots salvos em ${outDir}; cards PR260 renderizados sem overflow detectado.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

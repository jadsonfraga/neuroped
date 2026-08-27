import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
await page.goto("http://localhost:5173/#/manus", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(1200);
await page.evaluate(() => {
  for (const node of document.querySelectorAll(
    "[role='dialog'][aria-modal='true']",
  )) {
    if (/Aviso importante|Li e entendi/i.test(node.textContent || "")) {
      node.style.setProperty("display", "none", "important");
    }
  }
});

const tabs = await page.getByRole("tab").allTextContents();
const title = await page
  .getByRole("heading", { name: "Experiências dentro do NeuroPed" })
  .count();
const localNotice = await page
  .getByText(/microsite versionado no deploy do NeuroPed/i)
  .count();

const destinations = [];
for (const label of ["Secretaria", "Jogo", "Nesplora", "Institucional"]) {
  const tab = page.getByRole("tab", { name: label, exact: true });
  if ((await tab.count()) !== 1) continue;
  await tab.click();
  await page.waitForTimeout(120);
  const frame = page.locator("iframe[title]").first();
  destinations.push({
    label,
    active: await tab.getAttribute("aria-selected"),
    src: await frame.getAttribute("src"),
    note: await page
      .getByRole("tabpanel")
      .getByText(/incorporada|versionada|rota do próprio NeuroPed/i)
      .count(),
  });
}

const result = {
  passed:
    pageErrors.length === 0 &&
    title === 1 &&
    localNotice === 1 &&
    tabs.length === 4 &&
    destinations.length === 4 &&
    destinations.every(
      (entry) =>
        entry.active === "true" &&
        entry.src &&
        !/manus\.space|manus-analytics/i.test(entry.src),
    ),
  pageErrors,
  title,
  tabs,
  destinations,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);

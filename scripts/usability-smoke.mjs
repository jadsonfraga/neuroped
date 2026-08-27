import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
await page.waitForTimeout(3500);
await page.evaluate(() => document.querySelector('[role="dialog"]')?.remove());

const featuredLabels = await page.locator('[data-testid^="featured-"]').evaluateAll((items) => items.map((item) => item.textContent?.replace(/\s+/g, " ").trim()));
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:5173/#/", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('[role="dialog"]')?.remove());
const input = page.getByTestId("input-search");
await input.fill("laudo");
await page.keyboard.press("Enter");
await page.waitForTimeout(700);
const searchNavigation = await page.evaluate(() => window.location.hash);

await page.goto("http://localhost:5173/#/explorar", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('[role="dialog"]')?.remove());
const beforeOpen = await page.locator('[data-testid^="explore-section-"]').evaluateAll((sections) => sections.map((section) => ({ open: section.querySelector('button[aria-expanded="true"]') !== null, title: section.querySelector("h2")?.textContent?.trim() })));
const documentSection = page.locator('[data-testid="explore-section-documentar"]');
await documentSection.getByRole("button").first().click();
await page.waitForTimeout(180);
const afterOpen = await documentSection.evaluate((section) => ({ open: section.querySelector('button[aria-expanded="true"]') !== null, cards: section.querySelectorAll('[data-testid^="explore-item-"]').length }));
const exploreInput = page.getByTestId("input-explore-search");
await exploreInput.fill("receita");
await page.waitForTimeout(250);
const searchState = await page.evaluate(() => ({
  status: document.querySelector("#explore-search-status")?.textContent?.replace(/\s+/g, " ").trim(),
  openSections: [...document.querySelectorAll('[data-testid^="explore-section-"]')].filter((section) => section.querySelector('button[aria-expanded="true"]')).map((section) => section.querySelector("h2")?.textContent?.trim()).filter(Boolean),
  visibleCards: [...document.querySelectorAll('[data-testid^="explore-item-"]')].filter((el) => getComputedStyle(el).display !== "none").length,
}));

await page.goto("http://localhost:5173/#/tea-checklists", { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
await page.evaluate(() => document.querySelector('[role="dialog"]')?.remove());
const horizontalOverflow = await page.evaluate(() => ({
  width: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
}));
const focused = await page.evaluate(() => {
  const tab = document.querySelector('[role="tab"]');
  if (!tab) return null;
  tab.focus();
  return document.activeElement?.getAttribute("role");
});

console.log(JSON.stringify({ featuredLabels, searchNavigation, beforeOpen, afterOpen, searchState, horizontalOverflow, focused, errors }, null, 2));
await browser.close();
if (errors.length || horizontalOverflow.scrollWidth > horizontalOverflow.width || searchNavigation === "#/") process.exit(1);

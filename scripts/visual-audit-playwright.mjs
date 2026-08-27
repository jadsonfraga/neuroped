import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = "http://localhost:5173/#";
const targets = [
  { name: "home", hash: "/" },
  { name: "explorar", hash: "/explorar" },
  { name: "tea-checklists", hash: "/tea-checklists" },
];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const results = [];
await fs.mkdir("/tmp/neuroped-visual-audit", { recursive: true });

for (const viewport of viewports) {
  for (const target of targets) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const runtimeErrors = [];
    const failedResponses = [];
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });
    page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
    });
    await page.goto(`${base}${target.hash}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2200);
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog instanceof HTMLElement) dialog.style.display = "none";
      document.body.style.overflow = "auto";
    });
    const metrics = await page.evaluate(() => {
      const tablists = [...document.querySelectorAll('[role="tablist"]')].map((list) => ({
        clientWidth: list.clientWidth,
        scrollWidth: list.scrollWidth,
        overflowX: getComputedStyle(list).overflowX,
        tabs: [...list.querySelectorAll('[role="tab"]')].map((tab) => ({
          label: tab.textContent?.replace(/\s+/g, " ").trim(),
          selected: tab.getAttribute("aria-selected"),
        })),
      }));
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        activeNavigation: [...document.querySelectorAll('#sidebar-nav a[aria-current="page"]')].map((el) => el.textContent?.replace(/\s+/g, " ").trim()),
        sidebarGroups: [...document.querySelectorAll('#sidebar-nav button[aria-expanded]')].map((el) => ({
          label: el.textContent?.replace(/\s+/g, " ").trim(),
          expanded: el.getAttribute("aria-expanded"),
        })),
        mobileDock: [...document.querySelectorAll('[data-testid="mobile-primary-dock"] button')].map((el) => el.textContent?.replace(/\s+/g, " ").trim()),
        homeActions: [...document.querySelectorAll('[data-testid^="home-action-"]')].map((el) => el.textContent?.replace(/\s+/g, " ").trim()),
        tablists,
        documentHeight: document.documentElement.scrollHeight,
      };
    });
    const screenshotPath = `/tmp/neuroped-visual-audit/${viewport.name}-${target.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.push({ viewport: viewport.name, target: target.name, screenshotPath, metrics, runtimeErrors, failedResponses });
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

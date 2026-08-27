import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://localhost:5173";
const outputRoot =
  process.env.OUTPUT_ROOT || "/home/ubuntu/neuroped/master-audit/baseline";
const scenarios = [
  { id: "home", route: "/" },
  { id: "explorar", route: "/explorar" },
  { id: "filtro", route: "/filtro" },
  { id: "escala-mchat", route: "/mchat" },
  { id: "escala-abc", route: "/abc" },
];
const viewports = [
  { id: "desktop", width: 1440, height: 1000, deviceScaleFactor: 1 },
  { id: "mobile", width: 390, height: 844, deviceScaleFactor: 1 },
];

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const results = [];

async function hideLegalGate(page) {
  await page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll("[role='dialog'], [aria-modal='true']"),
    ];
    for (const node of nodes) {
      const text = node.textContent || "";
      if (/Aviso importante|Li e entendi/i.test(text)) {
        node.setAttribute("data-audit-hidden", "true");
        node.style.display = "none";
      }
    }
    document.documentElement.classList.add("audit-gate-hidden");
  });
}

for (const viewport of viewports) {
  for (const scenario of scenarios) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const url = `${baseUrl}/#${scenario.route}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await hideLegalGate(page);
    await page.waitForTimeout(300);
    const screenshotPath = path.join(
      outputRoot,
      `${scenario.id}-${viewport.id}.png`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const main = document.querySelector("main");
      const active = document.querySelector(
        "[aria-current='page'], [aria-selected='true'], :focus-visible",
      );
      return {
        bodyHeight: body?.scrollHeight ?? 0,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        mainHeight: main?.scrollHeight ?? 0,
        links: document.querySelectorAll("a[href]").length,
        buttons: document.querySelectorAll("button").length,
        inputs: document.querySelectorAll("input, textarea, select").length,
        tabs: document.querySelectorAll("[role='tab'], [data-state='active']")
          .length,
        activeText: active?.textContent?.trim().slice(0, 120) || null,
        horizontalOverflow: body.scrollWidth > window.innerWidth + 1,
      };
    });
    results.push({
      scenario: scenario.id,
      route: scenario.route,
      viewport: viewport.id,
      screenshotPath,
      metrics,
      consoleErrors,
      pageErrors,
    });
    await page.close();
  }
}

await fs.writeFile(
  path.join(outputRoot, "metrics.json"),
  JSON.stringify({ baseUrl, results }, null, 2),
);
await browser.close();
console.log(JSON.stringify({ outputRoot, results }, null, 2));

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:5000/";
const output = process.env.VISUAL_OUTPUT ?? "artifacts/visual";
const routes = [
  ["login", "#/login"],
  ["portal-familia", "#/portal-familia"],
  ["brincando-e-aprendendo", "#/brincando-e-aprendendo"],
  ["sobre-neuroped", "#/sobre-neuroped"],
  ["eletroencefalograma", "#/eletroencefalograma"],
  ["ajuda", "#/ajuda"],
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const results = [];

async function capture(page, name, hash, viewport, suffix = "desktop") {
  await page.setViewportSize(viewport);
  await page.goto(`${base}?visual=1${hash}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(
    () => !document.body.innerText.includes("Preparando o NeuroPed"),
    { timeout: 15_000 },
  ).catch(() => undefined);
  await page.waitForTimeout(1_200);
  const legalButton = page.getByRole("button", { name: /Li e entendi/i });
  if (await legalButton.count()) {
    await legalButton.first().click();
    await page.waitForTimeout(350);
  }
  const screenshot = `${output}/${name}-${suffix}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });
  const bodyText = await page.locator("body").innerText();
  results.push({ name, suffix, screenshot, title: await page.title(), hasRuntimeError: /encontrou uma falha|Unexpected Application Error/i.test(bodyText), bodyTextLength: bodyText.length });
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
for (const [name, hash] of routes) await capture(page, name, hash, { width: 1440, height: 1000 });
for (const [name, hash] of routes.slice(0, 3)) await capture(page, name, hash, { width: 390, height: 844 }, "mobile");
await browser.close();
console.log(JSON.stringify({ base, output, captures: results }, null, 2));

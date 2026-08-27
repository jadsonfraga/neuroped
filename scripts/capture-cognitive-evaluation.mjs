import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const output = process.env.OUTPUT_ROOT || "/tmp/neuroped-cognitive-evidence";
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.goto("http://localhost:5173/#/avaliacao-cognitiva-infantil", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.evaluate(() => {
  for (const node of document.querySelectorAll("[role='dialog'][aria-modal='true']")) {
    if (/Aviso importante|Li e entendi/i.test(node.textContent || "")) node.style.setProperty("display", "none", "important");
  }
});
await page.screenshot({ path: `${output}/01-inicio-mobile.png`, fullPage: true });
await page.locator("#idade-av").fill("7");
await page.getByRole("combobox", { name: "Etapa escolar" }).selectOption({ label: "1º–2º ano do Ensino Fundamental" });
await page.getByRole("combobox", { name: "Quem acompanha a resposta" }).selectOption({ label: "Criança respondeu com autonomia" });
await page.screenshot({ path: `${output}/02-contexto-mobile.png`, fullPage: true });
await page.getByRole("button", { name: "Iniciar amostra de 15 min" }).click();
await page.getByRole("button", { name: /Iniciar módulo/i }).click();
await page.getByRole("button", { name: /Não sei \/ prefiro não responder/i }).click();
await page.screenshot({ path: `${output}/03-modulo-nao-informado-mobile.png`, fullPage: true });
console.log(JSON.stringify({ output, screenshots: 3 }, null, 2));
await browser.close();

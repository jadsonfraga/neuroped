import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

async function hideLegalGate() {
  await page.evaluate(() => {
    for (const node of document.querySelectorAll(
      "[role='dialog'][aria-modal='true']",
    )) {
      if (/Aviso importante|Li e entendi/i.test(node.textContent || ""))
        node.style.setProperty("display", "none", "important");
    }
  });
}

async function visit(path, heading, selector = "heading") {
  await page.goto(`http://localhost:5173/#${path}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1000);
  await hideLegalGate();
  return {
    path,
    heading,
    headingCount:
      selector === "text"
        ? await page.getByText(heading, { exact: true }).count()
        : await page.getByRole("heading", { name: heading }).count(),
    bodyHasError: await page
      .getByText(/Algo deu errado|ReferenceError|não encontrado/i)
      .count(),
  };
}

const legacyCognitive = await visit(
  "/avaliacao-cognitiva-infantil",
  "Avaliação Cognitiva Infantil",
);
const visual = await visit(
  "/conhecimento-visual",
  "Conhecimento Visual",
  "text",
);
const newCognitive = await visit(
  "/nova-avaliacao-cognitiva",
  "Nova avaliação cognitiva",
);
const result = {
  passed:
    pageErrors.length === 0 &&
    legacyCognitive.headingCount === 1 &&
    legacyCognitive.bodyHasError === 0 &&
    visual.headingCount === 1 &&
    visual.bodyHasError === 0 &&
    newCognitive.headingCount === 1 &&
    newCognitive.bodyHasError === 0,
  pageErrors,
  legacyCognitive,
  visual,
  newCognitive,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);

import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
await page.goto("http://localhost:5173/#/nova-avaliacao-cognitiva", {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(1200);
await page.evaluate(() => {
  for (const node of document.querySelectorAll(
    "[role='dialog'][aria-modal='true']",
  )) {
    if (/Aviso importante|Li e entendi/i.test(node.textContent || ""))
      node.style.setProperty("display", "none", "important");
  }
});
const beforeStart = {
  title: await page
    .getByRole("heading", { name: "Nova avaliação cognitiva" })
    .count(),
  age: await page.locator("#idade-av").count(),
  stage: await page.getByRole("combobox", { name: "Etapa escolar" }).count(),
  informant: await page
    .getByRole("combobox", { name: "Quem acompanha a resposta" })
    .count(),
  safeCopy: await page
    .getByText(/não produz QI, percentil ou diagnóstico/i)
    .count(),
};
await page.locator("#idade-av").fill("7");
await page
  .getByRole("combobox", { name: "Etapa escolar" })
  .selectOption({ label: "1º–2º ano do Ensino Fundamental" });
await page
  .getByRole("combobox", { name: "Quem acompanha a resposta" })
  .selectOption({ label: "Criança respondeu com autonomia" });
const start = page.getByRole("button", { name: "Iniciar amostra de 15 min" });
const canStart = await start.isEnabled();
await start.click();
await page.waitForTimeout(180);
const afterStart = {
  timer: await page.getByLabel("Tempo da amostra pedagógica").count(),
  domains: await page
    .getByRole("navigation", { name: "Módulos de avaliação" })
    .count(),
  visualModule: await page
    .getByRole("button", { name: /Iniciar módulo/i })
    .count(),
};
await page.getByRole("button", { name: /Iniciar módulo/i }).click();
await page.waitForTimeout(100);
const notInformed = page.getByRole("button", {
  name: /Não sei \/ prefiro não responder/i,
});
const canSkip = (await notInformed.count()) === 1;
await notInformed.click();
const neutralFeedback = await page
  .getByText(/não será interpretada como erro/i)
  .count();
const next = page.getByRole("button", { name: /Próxima/i });
const canAdvance = (await next.count()) === 1;
await next.click();
const finishEarly = page.getByRole("button", {
  name: /Encerrar e gerar resumo/i,
});
const canFinishEarly = (await finishEarly.count()) === 1;
await finishEarly.click();
await page.waitForTimeout(100);
const partialSummary = {
  visible:
    (await page
      .getByRole("heading", { name: "Resumo para a consulta" })
      .count()) === 1,
  partial: (await page.getByText(/0 de 4 domínios concluídos/i).count()) === 1,
  notDiagnostic:
    (await page.getByText(/não (é )?um diagnóstico/i).count()) >= 1,

  noClinicalReport:
    (await page.getByText(/Leitura descritiva da amostra/i).count()) === 0,
};
const result = {
  passed:
    pageErrors.length === 0 &&
    beforeStart.title === 1 &&
    beforeStart.age === 1 &&
    beforeStart.stage === 1 &&
    beforeStart.informant === 1 &&
    beforeStart.safeCopy === 1 &&
    canStart &&
    afterStart.timer === 1 &&
    afterStart.domains === 1 &&
    afterStart.visualModule === 1 &&
    canSkip &&
    neutralFeedback === 1 &&
    canAdvance &&
    canFinishEarly &&
    partialSummary.visible &&
    partialSummary.partial &&
    partialSummary.notDiagnostic &&
    partialSummary.noClinicalReport,
  pageErrors,

  beforeStart,
  canStart,
  afterStart,
  canSkip,
  neutralFeedback,
  canAdvance,
  canFinishEarly,
  partialSummary,
};
console.log(JSON.stringify(result, null, 2));
await browser.close();
if (!result.passed) process.exit(1);

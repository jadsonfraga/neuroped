import { launchBrowser } from "./browser-launch.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";

const routes = [
  { path: "/#/gad7", name: "GAD-7", option: 1 },
  { path: "/#/cdi2", name: "CDI-2", option: 1 },
  { path: "/#/phqa", name: "PHQ-A", option: 1 },
  { path: "/#/sdq", name: "SDQ", option: 1 },
];

async function answerScale(page, optionIndex) {
  const radios = page.locator('[role="radio"], input[type="radio"]');
  const count = await radios.count();
  if (count === 0) throw new Error("nenhuma opcao de escala encontrada");

  const groups = new Map();
  for (let i = 0; i < count; i += 1) {
    const radio = radios.nth(i);
    const name = await radio.getAttribute("name");
    const id = await radio.getAttribute("id");
    const group = name || id?.replace(/-o\d+$/, "") || `single-${i}`;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(i);
  }

  for (const indexes of groups.values()) {
    const target = indexes[Math.min(optionIndex, indexes.length - 1)];
    await radios.nth(target).click({ force: true });
  }
}

async function run() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });

  await page.route("**/api/patients", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-patient" }) });
  });
  await page.route("**/api/results", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: "e2e-result" }) });
  });

  for (const scale of routes) {
    await page.goto(`${baseUrl}${scale.path}`, { waitUntil: "domcontentloaded" });
    await page.getByText(scale.name, { exact: false }).first().waitFor({ timeout: 15000 });
    await answerScale(page, scale.option);

    const calculate = page.getByTestId("button-calculate").or(page.getByRole("button", { name: /calcular|resultado|concluir/i }));
    await calculate.first().click();

    await page.getByText(/Resultado|Avalia/i).first().waitFor({ timeout: 10000 });
    await page.getByTestId("button-print-report").waitFor({ timeout: 10000 });
    await page.getByTestId("button-save-to-patient").waitFor({ timeout: 10000 });
    await page.getByText(/respostas|pontua/i).first().waitFor({ timeout: 10000 });
  }

  await browser.close();
  console.log(`[scale-smoke] ${routes.length} escalas abriram, preencheram, calcularam e expuseram imprimir/salvar.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

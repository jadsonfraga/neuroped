import { chromium } from "playwright";

const base = process.env.E2E_BASE_URL || "http://127.0.0.1:5174";
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
const modules = [
  ["01", "Workspace multi-tenant"],
  ["02", "Planos e entitlements"],
  ["03", "Onboarding e migração"],
  ["04", "Equipe e políticas de acesso"],
  ["05", "Marca branca e domínio"],
  ["06", "Observabilidade e SLA"],
  ["07", "Backup e continuidade"],
  ["08", "Governança LGPD e direitos"],
  ["09", "Mensageria segura"],
  ["10", "Fluxo de documentos e ciência"],
  ["11", "Lembretes e faltas"],
  ["12", "Intake pré-consulta"],
  ["13", "Rede multiprofissional"],
  ["14", "Portal escola-família"],
  ["15", "Coordenação de planos"],
  ["16", "Desfechos e qualidade"],
  ["17", "Governança do catálogo"],
  ["18", "Templates e playbooks"],
  ["19", "Interoperabilidade"],
  ["20", "API, webhooks e portal"],
];

async function main() {
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(`${base}/#/saas`, { waitUntil: "networkidle" });
    const notice = page.getByRole("button", { name: "Li e entendi — continuar" });
    if (await notice.isVisible().catch(() => false)) await notice.click();
    await page.getByTestId("saas-console-page").waitFor({ state: "visible", timeout: 15_000 });
    const tabs = page.getByRole("tab");
    if (await tabs.count() !== 20) throw new Error(`esperadas 20 abas, encontradas ${await tabs.count()}`);

    for (const [number, title] of modules) {
      await page.getByRole("tab", { name: new RegExp(`^${number}`) }).click();
      await page.getByRole("heading", { name: new RegExp(title, "i") }).waitFor({ state: "visible", timeout: 5_000 });
    }

    await page.getByLabel("Filtrar abas").fill("API");
    await page.getByRole("tab", { name: /^20/ }).waitFor({ state: "visible" });
    if (await page.getByRole("tab").count() !== 1) throw new Error("filtro de abas não reduziu a lista para API");
    await page.getByLabel("Filtrar abas").fill("");

    await page.getByRole("tab", { name: /^04/ }).click();
    await page.getByText("Convites de equipe", { exact: true }).waitFor({ state: "visible" });
    await page.getByRole("tab", { name: /^08/ }).click();
    await page.getByText("Fila de direitos do titular", { exact: true }).waitFor({ state: "visible" });
    await page.getByRole("tab", { name: /^20/ }).click();
    await page.getByText("Integrações tenant-aware", { exact: true }).waitFor({ state: "visible" });

    await page.getByRole("tab", { name: /^01/ }).click();
    await page.getByRole("button", { name: "Salvar workspace" }).click();
    await page.getByRole("status").filter({ hasText: "Workspace piloto salvo" }).waitFor({ state: "visible" });
    await page.reload({ waitUntil: "networkidle" });
    if (await notice.isVisible().catch(() => false)) await notice.click();
    await page.getByText("Workspace piloto salvo com isolamento lógico.", { exact: true }).waitFor({ state: "visible", timeout: 5_000 });
    if (errors.length) throw new Error(`erros de página: ${errors.join(" | ")}`);
    console.log("[saas-central] ✓ 20 abas, filtro, interação e persistência local aprovados");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[saas-central] FALHOU:", error.message);
  process.exit(1);
});

import { createServer as createViteServer } from "vite";
import { chromium } from "playwright";

/**
 * Este E2E valida explicitamente a instalação local, não o bundle LIVE.
 * O bundle de produção exige sessão remota por desenho; servi-lo aqui fazia o
 * teste cair no login e nunca exercitar os rascunhos locais. O modo aberto é
 * habilitado somente no processo Vite efêmero deste teste.
 */
async function startLocalViteServer() {
  const previousOpenAccess = process.env.VITE_OPEN_ACCESS;
  process.env.VITE_OPEN_ACCESS = "true";
  try {
    const server = await createViteServer({
      configFile: "vite.config.ts",
      server: { host: "127.0.0.1", port: 0 },
      logLevel: "error",
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === "string") {
      await server.close();
      throw new Error("Vite local não informou uma porta de escuta");
    }
    return { server, base: `http://127.0.0.1:${address.port}` };
  } finally {
    if (previousOpenAccess === undefined) delete process.env.VITE_OPEN_ACCESS;
    else process.env.VITE_OPEN_ACCESS = previousOpenAccess;
  }
}

async function main() {
  const external = process.env.E2E_BASE_URL;
  const local = external ? null : await startLocalViteServer();
  const server = local?.server ?? null;
  const base = external || local.base;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  const browser = await chromium.launch(
    executablePath ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] } : undefined,
  );
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });

  try {
    await page.goto(`${base}/#/neuroacompanhamento`, { waitUntil: "domcontentloaded" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10000 });
    await page.getByTestId("neuroacompanhamento-page").waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "NeuroAcompanhamento" }).waitFor();

    await page.getByLabel("Idade aproximada (meses)").fill("24");
    await page.getByLabel("Contexto da observação").selectOption({ label: "Consulta" });
    await page.getByLabel("Aspectos motores observados").fill("Corre, sobe escadas e participa das brincadeiras.");
    await page.getByLabel("Comunicação e linguagem").fill("Usa frases curtas e compreende instruções simples.");
    await page.getByLabel("Interação social e comportamento").fill("Busca o cuidador e aceita turnos breves na brincadeira.");
    await page.getByLabel("Houve perda de habilidade percebida?").selectOption({ label: "Não observado" });
    await page.getByRole("button", { name: "Salvar rascunho local" }).click();

    await page.getByText("1 registro", { exact: true }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: "Histórico" }).click();
    await page.getByText("Corre, sobe escadas e participa das brincadeiras.", { exact: true }).waitFor();

    await page.goto(`${base}/#/diario-escola`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Diário Escolar" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByLabel("Rendimento acadêmico (1–5)").fill("3");
    await page.getByLabel("Comportamento (1–5)").fill("3");
    await page.getByLabel("Atenção / foco (1–5)").fill("2");
    await page.getByLabel("Humor predominante").selectOption({ label: "tranquilo" });
    await page.getByLabel("Ocorrências").fill("Precisou de duas retomadas durante a atividade.");
    await page.getByLabel("Antecedente (o que veio antes)").fill("Atividade longa após o recreio.");
    await page.getByRole("button", { name: "Salvar rascunho local" }).click();
    await page.getByText("1 registro", { exact: true }).waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(1000);

    await page.goto(`${base}/#/neuroacompanhamento`, { waitUntil: "domcontentloaded" });
    const correlation = page.getByTestId("clinical-school-correlation");
    await correlation.waitFor({ state: "visible", timeout: 15000 });
    const correlationText = await correlation.innerText();
    if (!/Observações escolares\s*1/.test(correlationText) || !/Mesma data\s*1/.test(correlationText)) {
      throw new Error(`relação clínica–escola não consolidada: ${correlationText}`);
    }

    await page.getByRole("button", { name: "Histórico" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const download = await downloadPromise;
    if (!download.suggestedFilename().startsWith("neuroped-desenvolvimento-brasil-v1-")) {
      throw new Error(`nome inesperado de exportação: ${download.suggestedFilename()}`);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("neuroacompanhamento-page").waitFor({ state: "visible", timeout: 15000 });
    const persistedCorrelation = page.getByTestId("clinical-school-correlation");
    await persistedCorrelation.waitFor({ state: "visible", timeout: 15000 });
    const persistedText = await persistedCorrelation.innerText();
    if (!/Observações escolares\s*1/.test(persistedText) || !/Mesma data\s*1/.test(persistedText)) {
      throw new Error(`relação não persistiu após recarregar: ${persistedText}`);
    }
    await page.getByRole("button", { name: "Histórico" }).click();
    await page.getByText("1 registro", { exact: true }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText("Corre, sobe escadas e participa das brincadeiras.", { exact: true }).waitFor();

    console.log("[neuroped-acompanhamento] ✓ modo local: desenvolvimento + escola relacionados, persistidos e exportados");
  } finally {
    await browser.close();
    if (server) await server.close();
  }
}

main().catch((error) => {
  console.error("[neuroped-acompanhamento] FALHOU:", error.message);
  process.exit(1);
});

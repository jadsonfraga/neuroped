// E2E do Laudo em um clique, com API sintética (nenhum dado real).
// Cobre: carga do paciente + escalas pontuadas, geração, anexo técnico,
// bloqueio por estilo, revisão obrigatória, prompt pseudonimizado sem
// identificadores e reidentificação local.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.LAUDO_UM_CLIQUE_ARTIFACT_DIR || "/tmp/laudo-um-clique";
await mkdir(dir, { recursive: true });
const PATIENT = "paciente-sintetico-alfa";
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "populated" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const outbound = [];
page.on("request", (r) => { if (!r.url().startsWith(server.origin) && !r.url().startsWith("data:")) outbound.push(r.url()); });

// Resultados pontuados fictícios para o paciente sintético.
await page.route(`**/api/patients/${PATIENT}/results**`, (route) => route.fulfill({
  status: 200, contentType: "application/json",
  body: JSON.stringify({ data: [
    { id: "r1", scaleName: "SNAP-IV (rastreio)", totalScore: 38, classification: "Sugestivo", createdAt: "2026-09-20T12:00:00.000Z" },
    { id: "r2", scaleName: "M-CHAT-R/F", totalScore: 3, classification: "", createdAt: "2026-09-21T12:00:00.000Z" },
    { id: "r3", scaleName: "Escala sem escore", totalScore: null, classification: "Resultado registrado", createdAt: "2026-09-22T12:00:00.000Z" },
  ], total: 3, page: 1, limit: 200, hasMore: false }),
}));

const fill = (id, v) => page.getByTestId(id).fill(v);
try {
  await page.goto(`${server.origin}/#/laudo-um-clique?patientId=${PATIENT}`);
  await page.waitForLoadState("networkidle");
  const login = page.locator("#login-email");
  if (await login.count()) {
    await login.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
  await page.getByTestId("page-laudo-um-clique").waitFor({ timeout: 20000 });

  // Aviso de revisão médica sempre visível.
  assert.match(await page.getByTestId("aviso-revisao").innerText(), /lido, editado e assumido pelo médico/);

  // Paciente e escalas vêm do backend; sem escore não inventa número.
  await page.waitForFunction(() => document.querySelector('[data-testid="luc-paciente"]')?.value);
  assert.equal(await page.getByTestId("luc-paciente").inputValue(), "Paciente Sintético Alfa");
  await page.getByTestId("luc-escala-0").waitFor();
  const escalasTxt = await page.getByTestId("luc-escalas").innerText();
  assert.match(escalasTxt, /escore 38/);
  assert.match(escalasTxt, /sem escore salvo/);
  // M-CHAT-R/F saiu do app (17/10/2026): o escore salvo aparece, sem classificação derivada.
  assert.match(escalasTxt, /escore 3\b/);
  assert.doesNotMatch(escalasTxt, /derivada do corte oficial/);

  // Gerar está disponível e, com conteúdo mínimo, entrega o laudo.
  await fill("luc-dataConsulta", "2026-10-15");
  await fill("luc-responsaveis", "Responsável Sintético Alfa\nEscola Fictícia Modelo");
  await fill("luc-quemE", "Ele conta histórias longas sobre planetas e desenha com cuidado.");
  await fill("luc-historia", "A gestação transcorreu sem intercorrências. Andou aos catorze meses.");
  await fill("luc-historiaFonte", "a caderneta, de março de 2026");
  await fill("luc-familia", "A mãe conta que a escola liga com frequência. O pai nega crises.");
  await fill("luc-escola", "A professora descreve que ele levanta da carteira e perde a linha na leitura.");
  await fill("luc-escolaFonte", "o relatório da escola, de setembro de 2026");
  await fill("luc-exameNeuro", "A marcha saiu simétrica e os reflexos vieram presentes e iguais.");
  await fill("luc-leitura", "Os relatos de casa e da escola descrevem o mesmo padrão, e o exame não mostra outra causa.");
  await fill("luc-conduta", "Iniciar terapia ocupacional por oito semanas. A escola recebe orientações por escrito.");
  await fill("luc-escolaOrienta", "Sentar perto da professora e dar pausas curtas a cada vinte minutos.");
  await fill("luc-retorno", "Retorno em 15 de janeiro de 2027, ou antes se surgirem crises.");
  await page.getByTestId("luc-add-dx").click();
  await fill("luc-dx-nome-0", "Transtorno do déficit de atenção com hiperatividade");
  await fill("luc-dx-cid10-0", "F90.0");
  await fill("luc-dx-cid11-0", "6A05.2");
  await page.getByTestId("luc-anexo").check();
  await page.getByTestId("luc-alto-risco").check();

  await page.getByTestId("luc-gerar").click();
  const texto = await page.getByTestId("luc-laudo-texto").innerText();
  assert.match(texto, /Em uma página/);
  assert.match(texto, /Quem é Paciente/);
  assert.match(texto, /CID-10 F90\.0; CID-11 6A05\.2/);
  assert.match(texto, /sem verificação direta nesta consulta/);
  assert.match(texto, /Soli Deo Gloria/);
  // Escalas só no Anexo técnico.
  const [corpo, anexo] = texto.split("Anexo técnico");
  assert.ok(anexo?.includes("SNAP-IV") && anexo.includes("escore 38"), "anexo traz a escala pontuada");
  assert.ok(!/SNAP|M-CHAT|escore/i.test(corpo), "corpo sem escala");
  assert.match(await page.getByTestId("luc-estilo-status").innerText(), /aprovada/);
  assert.equal(await page.getByTestId("luc-segunda-leitura").locator("li").count(), 5);
  assert.match(await page.getByTestId("luc-lacunas").innerText(), /fonte ausente no material/);

  // Emissão exige a revisão explícita do médico.
  assert.equal(await page.getByTestId("luc-copiar").isDisabled(), true);
  assert.equal(await page.getByTestId("luc-imprimir").isDisabled(), true);
  await page.getByTestId("luc-revisado").check();
  assert.equal(await page.getByTestId("luc-copiar").isDisabled(), false);
  assert.equal(await page.getByTestId("luc-imprimir").isDisabled(), false);
  await page.screenshot({ path: `${dir}/laudo-gerado.png`, fullPage: true });

  // Editar invalida a revisão: o laudo precisa ser regerado e relido.
  await fill("luc-serie", "o segundo ano");
  assert.equal(await page.getByTestId("luc-resultado").count(), 0);
  await page.getByTestId("luc-gerar").click();
  assert.equal(await page.getByTestId("luc-copiar").isDisabled(), true);

  // Bloqueio por estilo: travessão e perfumaria impedem a emissão.
  await fill("luc-leitura", "Vale ressaltar que o padrão - em suma - é de desatenção.");
  await page.getByTestId("luc-gerar").click();
  assert.match(await page.getByTestId("luc-estilo-status").innerText(), /bloqueios de estilo/);
  assert.match(await page.getByTestId("luc-checklist").innerText(), /Léxico vetado/);
  await page.getByTestId("luc-revisado").check();
  assert.equal(await page.getByTestId("luc-imprimir").isDisabled(), true, "bloqueio de estilo impede emissão mesmo revisado");
  await fill("luc-leitura", "Os relatos de casa e da escola descrevem o mesmo padrão, e o exame não mostra outra causa.");
  await page.getByTestId("luc-gerar").click();

  // Prompt pseudonimizado: nenhum identificador, e reidentificação local.
  await page.getByTestId("luc-prompt-ia").click();
  const prompt = await page.getByTestId("luc-prompt-texto").inputValue();
  for (const proibido of ["Paciente Sintético Alfa", "Sintético", "Responsável Sintético Alfa", "Escola Fictícia Modelo", "2026-10-15"]) {
    assert.ok(!prompt.includes(proibido), `prompt vazou: ${proibido}`);
  }
  assert.match(prompt, /PACIENTE_\d+/);
  assert.match(prompt, /--- LAUDO \(pseudonimizado\) ---/);
  await fill("luc-devolvido", "Laudo de PACIENTE_1 revisado.");
  assert.match(await page.getByTestId("luc-reidentificado").innerText(), /Paciente Sintético Alfa/);

  assert.deepEqual(outbound, [], "nenhuma chamada a origem externa");
  assert.deepEqual(errors, [], "sem erros de página");
  console.log("Laudo em um clique: carga de paciente, escalas pontuadas, geração, bloqueios, revisão e pseudonimização verificados.");
} finally {
  await browser.close();
  await server.close();
}

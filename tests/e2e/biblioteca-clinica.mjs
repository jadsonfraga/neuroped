/** Biblioteca Clínica 365 no build real, com o login sintético existente.
 * Sem bypass de autenticação, sem escrita clínica e sem dado de paciente.
 * Prova: catálogo com os 10 capítulos da Trilha 365 na ordem do índice, navegação
 * por cartão (clique e teclado) com foco no capítulo, link profundo que sobrevive
 * ao recarregamento, fluxogramas nomeados, referências seguras, estado de revisão
 * médica, ausência de duplicação, layout sem rolagem horizontal no celular e axe
 * sem violação séria/crítica na área da Biblioteca. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import {
  startStaticServer,
  auditBrowserLaunchOptions,
  ACCEPTED_FIRST_VISIT_STORAGE,
} from "../../scripts/lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../../scripts/lib/synthetic-clinical-api.mjs";

// Perguntas literais da aba "Trilha 365" do índice-mestre (Dias 01–10).
const TRAIL = [
  { day: 1, slug: "tea-timidez-primeira-infancia", anchor: "capitulo-tea-timidez", title: "Como distinguir sinais de TEA de timidez na primeira infância?" },
  { day: 2, slug: "desatencao-imaturidade-etaria", anchor: "capitulo-desatencao-imaturidade", title: "Como diferenciar desatenção de imaturidade etária?" },
  { day: 3, slug: "primeira-crise-afebril", anchor: "capitulo-primeira-crise-afebril", title: "Primeira crise convulsiva afebril: qual a abordagem inicial?" },
  { day: 4, slug: "alfabetizacao-dislexia", anchor: "capitulo-alfabetizacao-dislexia", title: "Como diferenciar dificuldade de alfabetização de dislexia?" },
  { day: 5, slug: "atraso-fala-avaliacao-global", anchor: "capitulo-atraso-fala-avaliacao-global", title: "Quando o atraso de fala exige avaliação global?" },
  { day: 6, slug: "ansiedade-separacao", anchor: "capitulo-ansiedade-separacao", title: "Como reconhecer ansiedade de separação que ultrapassa o esperado?" },
  { day: 7, slug: "audicao-urgente", anchor: "capitulo-audicao-urgente", title: "Quando a criança que não fala precisa de avaliação auditiva urgente?" },
  { day: 8, slug: "insonia-pre-escolar", anchor: "capitulo-insonia-pre-escolar", title: "Como avaliar insônia comportamental no pré-escolar?" },
  { day: 9, slug: "wisc-indices-dia09", anchor: "capitulo-wisc-indices-dia09", title: "O que cada índice do WISC-IV informa ao neuropediatra?" },
  { day: 10, slug: "agressividade-dia10", anchor: "capitulo-agressividade-dia10", title: "Como analisar agressividade infantil antes de propor medicação?" },
];
const PAGE = '[data-testid="biblioteca-clinica-page"]';

const artifactDir = process.env.BIBLIOTECA_ARTIFACT_DIR || "artifacts/e2e/biblioteca-clinica";
await mkdir(artifactDir, { recursive: true });
const server = await startStaticServer("dist/public", {
  port: 0,
  apiHandler: createSyntheticClinicalApi({ patients: "empty" }),
});
const browser = await chromium.launch(auditBrowserLaunchOptions());
const report = { checks: [], axe: {}, screenshots: [] };
const pageErrors = [];
const clinicalWrites = [];

function check(name) {
  report.checks.push(name);
}

async function newPage(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript((storage) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) {
      clinicalWrites.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  return { context, page };
}

async function login(page, hash) {
  await page.goto(`${server.origin}/#${hash}`);
  await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);
  await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
  await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  await page.locator(PAGE).waitFor({ timeout: 30000 });
}

async function activeElementId(page) {
  return page.evaluate(() => document.activeElement?.id ?? "");
}

async function assertChapterInView(page, anchor, label) {
  try {
    await page.waitForFunction((id) => document.activeElement?.id === id, anchor, { timeout: 8000 });
  } catch (error) {
    const state = await page.evaluate(() => ({ url: location.href, active: `${document.activeElement?.tagName}#${document.activeElement?.id}` }));
    throw new Error(`${label}: foco esperado em ${anchor}; estado ${JSON.stringify(state)}`, { cause: error });
  }
  const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, anchor);
  assert.ok(top > -8 && top < 260, `${label}: capítulo ${anchor} deve ficar no topo da área visível (top=${top})`);
}

async function runAxe(page, name) {
  const result = await new AxeBuilder({ page }).include(PAGE).analyze();
  const blocking = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  report.axe[name] = result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  assert.deepEqual(
    blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
    [],
    `${name}: axe sem violação séria/crítica na Biblioteca`,
  );
}

try {
  // ---------- Desktop ----------
  const desktop = await newPage({ width: 1440, height: 1000 });
  const page = desktop.page;
  await login(page, "/biblioteca-clinica");

  const badge = (await page.getByTestId("biblioteca-review-badge").textContent())?.trim();
  assert.equal(badge, "Material educacional em revisão médica", "selo do topo não pode sugerir revisão concluída");
  check("selo do topo declara revisão médica pendente");

  const trailCards = page.locator('[data-testid="biblioteca-trilha"] > li');
  assert.equal(await trailCards.count(), TRAIL.length, "Trilha 365 deve listar exatamente 10 capítulos");
  const cardTitles = await trailCards.locator("h4").allTextContents();
  assert.deepEqual(cardTitles.map((t) => t.trim()), TRAIL.map((t) => t.title), "títulos e ordem idênticos ao índice-mestre");
  const statuses = await trailCards.getByTestId("biblioteca-card-status").allTextContents();
  assert.deepEqual(statuses.map((t) => t.trim()), TRAIL.map(() => "Revisão médica pendente"), "cartões refletem revisao_medica");
  assert.equal(await page.locator('[data-testid="biblioteca-estudos-previos"] > li').count(), 1, "WISC-IV fica separado como estudo prévio");
  check("catálogo: 6 capítulos da Trilha 365 + 1 estudo prévio separado");

  for (const chapter of TRAIL) {
    const article = page.locator(`article#${chapter.anchor}`);
    assert.equal(await article.count(), 1, `${chapter.anchor} renderizado uma única vez`);
    const heading = (await article.locator("h2").first().textContent())?.trim() ?? "";
    assert.ok(heading.includes(`Dia ${String(chapter.day).padStart(2, "0")}/365`), `${chapter.anchor}: cabeçalho com Dia`);
    assert.ok(heading.includes(chapter.title), `${chapter.anchor}: título canônico no cabeçalho`);
    assert.equal(await page.locator("h2", { hasText: `Dia ${String(chapter.day).padStart(2, "0")}/365` }).count(), 1, `Dia ${chapter.day} sem duplicação`);
    const flows = article.locator('[role="group"][aria-label]');
    assert.ok(await flows.count() >= 1, `${chapter.anchor}: fluxograma com papel e nome acessível`);
    const external = article.locator('a[target="_blank"]');
    const total = await external.count();
    assert.ok(total >= 5, `${chapter.anchor}: ao menos 5 referências clicáveis (encontradas ${total})`);
    const rels = await external.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("rel") ?? ""));
    assert.ok(rels.every((rel) => rel.includes("noopener")), `${chapter.anchor}: links externos com noopener`);
    const hrefs = await external.evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href") ?? ""));
    assert.ok(hrefs.every((href) => href.startsWith("https://")), `${chapter.anchor}: referências apenas https`);
    const text = (await article.textContent()) ?? "";
    assert.match(text, /revis[ãa]o m[ée]dica/i, `${chapter.anchor}: estado de revisão médica visível`);
    assert.doesNotMatch(text, /CRM[- ]?\d/, `${chapter.anchor}: sem assinatura médica`);
  }
  check("6 capítulos únicos, com fluxograma nomeado, referências https/noopener e revisão médica visível");

  // Navegação por clique em cada cartão.
  for (const chapter of TRAIL) {
    await page.getByTestId(`biblioteca-card-${chapter.slug}`).click();
    await assertChapterInView(page, chapter.anchor, "clique");
    assert.ok(page.url().endsWith(`#/biblioteca-clinica?capitulo=${chapter.slug}`), `URL estável para ${chapter.slug}`);
  }
  check("clique em cada cartão leva ao capítulo, foca o artigo e grava o link profundo");

  // Navegação por teclado (Enter no cartão focado).
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByTestId(`biblioteca-card-${TRAIL[2].slug}`).focus();
  await page.keyboard.press("Enter");
  await assertChapterInView(page, TRAIL[2].anchor, "teclado");
  check("teclado: Enter no cartão leva ao capítulo e move o foco");

  await page.screenshot({ path: `${artifactDir}/desktop-capitulo-03.png` });
  report.screenshots.push("desktop-capitulo-03.png");
  await runAxe(page, "desktop");
  check("axe desktop sem violação séria/crítica");

  // Busca e estado vazio.
  const search = page.getByRole("searchbox", { name: "Buscar capítulos" });
  await search.fill("dislexia");
  assert.equal(await trailCards.count(), 1, "busca filtra a trilha");
  await search.fill("termo-inexistente-xyz");
  await page.getByText("Nenhum capítulo encontrado.").waitFor();
  await search.fill("");
  assert.equal(await trailCards.count(), TRAIL.length);
  check("busca filtra e mostra estado vazio");

  // Link profundo + recarregamento.
  await page.goto(`${server.origin}/#/biblioteca-clinica?capitulo=${TRAIL[3].slug}`);
  await page.reload();
  await page.locator(PAGE).waitFor({ timeout: 30000 });
  await assertChapterInView(page, TRAIL[3].anchor, "link profundo após recarregar");
  check("link profundo funciona após recarregar a página, mantendo a sessão");
  assert.equal(await activeElementId(page), TRAIL[3].anchor);
  await desktop.context.close();

  // ---------- Celular ----------
  const mobile = await newPage({ width: 390, height: 844 });
  await login(mobile.page, `/biblioteca-clinica?capitulo=${TRAIL[0].slug}`);
  await assertChapterInView(mobile.page, TRAIL[0].anchor, "celular");
  for (const chapter of TRAIL) {
    await mobile.page.locator(`article#${chapter.anchor}`).scrollIntoViewIfNeeded();
    const overflow = await mobile.page.evaluate((id) => {
      const article = document.getElementById(id);
      // Borda direita VISÍVEL: recorte por ancestral com overflow-x diferente de
      // visible (decoração clipada por overflow-hidden ou tabela em contêiner
      // rolável não empurra a página para os lados).
      const visibleRight = (node) => {
        let right = node.getBoundingClientRect().right;
        for (let parent = node.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
          if (getComputedStyle(parent).overflowX !== "visible") right = Math.min(right, parent.getBoundingClientRect().right);
        }
        return right;
      };
      const wide = [...article.querySelectorAll("*")].filter((node) => visibleRight(node) > window.innerWidth + 1);
      return { page: document.documentElement.scrollWidth > window.innerWidth, wide: wide.slice(0, 3).map((n) => n.tagName + "." + String(n.className).slice(0, 60)) };
    }, chapter.anchor);
    assert.equal(overflow.page, false, `${chapter.anchor}: sem rolagem horizontal no celular`);
    assert.deepEqual(overflow.wide, [], `${chapter.anchor}: nenhum elemento ultrapassa a largura do celular`);
    await mobile.page.screenshot({ path: `${artifactDir}/celular-${chapter.slug}.png` });
    report.screenshots.push(`celular-${chapter.slug}.png`);
  }
  check("celular 390px: sem rolagem horizontal e nenhum quadro ultrapassa a tela");
  await runAxe(mobile.page, "celular");
  check("axe celular sem violação séria/crítica");
  await mobile.context.close();

  assert.deepEqual(pageErrors, [], "sem erro de JavaScript na página");
  assert.deepEqual(clinicalWrites, [], "Biblioteca não grava dado clínico");
  check("sem pageerror e sem escrita clínica");
  report.ok = true;
} finally {
  await writeFile(`${artifactDir}/report.json`, JSON.stringify({ ...report, pageErrors, clinicalWrites }, null, 2));
  await browser.close();
  await server.close?.();
}

console.log(`biblioteca-clinica e2e ok (${report.checks.length} verificações)`);
for (const name of report.checks) console.log(`  ✓ ${name}`);
process.exit(0);

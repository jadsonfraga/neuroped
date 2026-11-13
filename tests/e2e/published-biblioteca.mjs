/** Smoke autenticado e SOMENTE LEITURA da Biblioteca Clínica 365 no site publicado.
 * Usa a conta técnica dedicada (NEUROPED_E2E_*), não grava nada (qualquer
 * POST/PUT/PATCH/DELETE fora de /api/auth reprova) e falha fechado sem
 * credenciais: sem login real não há "validação autenticada".
 * Verifica: SHA servido (deploy-check.json) quando EXPECTED_SHA é informado,
 * catálogo com os 4 capítulos da Trilha 365 na ordem do índice-mestre, cada
 * capítulo único com fluxograma e estado de revisão médica, navegação por
 * cartão, link profundo após login e após recarregar, e celular sem rolagem
 * horizontal. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const origin = (process.env.PUBLISHED_ORIGIN ?? "https://neuroped.pages.dev").replace(/\/$/, "");
const email = process.env.PUBLISHED_E2E_EMAIL?.trim();
const password = process.env.PUBLISHED_E2E_PASSWORD;
const expectedSha = process.env.EXPECTED_SHA?.trim() || null;
const artifactDir = process.env.PUBLISHED_BIBLIOTECA_ARTIFACT_DIR || "artifacts/e2e/published-biblioteca";
// A trilha esperada vem do catálogo do PRÓPRIO commit implantado (o workflow faz
// checkout do SHA do deploy): cada Dia novo entra no smoke sem editar este
// arquivo, e a produção continua comparada com a fonte exata do que foi publicado.
// Antes, a lista fixa de 4 capítulos reprovou o deploy do Dia 05 (5 ≠ 4).
function readTrailFromCatalog() {
  const data = readFileSync(new URL("../../client/src/data/clinicalLibrary.ts", import.meta.url), "utf8");
  const trail = [...data.matchAll(/\{\n\s+slug: "([^"]+)",\n\s+anchor: "([^"]+)",\n(?:\s+day: (\d+),\n)?\s+title: "([^"]+)",[\s\S]*?status: "([a-z_]+)",/g)]
    .map(([, slug, anchor, day, title, status]) => ({ slug, anchor, day: day ? Number(day) : null, title, status }))
    .filter((chapter) => chapter.day !== null)
    .sort((a, b) => a.day - b.day);
  const labels = Object.fromEntries([...data.matchAll(/^\s+(revisao_medica|publicado): "([^"]+)",$/gm)].map(([, key, value]) => [key, value]));
  assert.ok(trail.length >= 3, `catálogo deve ter ao menos 3 Dias para o smoke (achou ${trail.length})`);
  assert.deepEqual(trail.map((chapter) => chapter.day), trail.map((_, index) => index + 1), "Dias do catálogo contíguos a partir de 01");
  assert.ok(labels.revisao_medica && labels.publicado, "rótulos de status ausentes no catálogo");
  return { trail, labels };
}
const { trail: TRAIL, labels: STATUS_LABEL } = readTrailFromCatalog();
const ALL_IN_REVIEW = TRAIL.every((chapter) => chapter.status === "revisao_medica");
const PAGE = '[data-testid="biblioteca-clinica-page"]';

assert.match(origin, /^https:\/\/([a-z0-9-]+\.)?neuroped\.pages\.dev$/, "origem fora do Pages do projeto: a senha técnica não sai daqui");
if (!email || !password) {
  console.error("::error::NEUROPED_E2E_EMAIL/NEUROPED_E2E_PASSWORD ausentes: validação autenticada NÃO executada.");
  process.exit(1);
}

await mkdir(artifactDir, { recursive: true });
const report = { origin, startedAt: new Date().toISOString(), expectedSha, servedSha: null, checks: [], pageErrors: [], writes: [], ok: false };
const check = (name) => report.checks.push(name);

const sentinel = await fetch(`${origin}/deploy-check.json`, { cache: "no-store" }).then((r) => r.json());
report.servedSha = sentinel.commit ?? null;
if (expectedSha) {
  assert.equal(report.servedSha, expectedSha, `produção serve ${report.servedSha}, esperado ${expectedSha}`);
  check(`deploy-check.json serve o SHA esperado ${expectedSha}`);
}

const browser = await chromium.launch(auditBrowserLaunchOptions());

async function openSession(viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  await context.addInitScript(() => {
    localStorage.setItem("neuroped:aviso-educativo-aceito-v1", "e2e-published");
    localStorage.setItem("neuroped:onboarding-seen", "1");
    localStorage.setItem("np_tour_intro_v2", "done");
    localStorage.setItem("np_tour_v2_done", "1");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => report.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
        /\/api\//.test(request.url()) && !/\/api\/auth\//.test(request.url())) {
      report.writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  return { context, page };
}

async function login(page, hash) {
  await page.goto(`${origin}/#${hash}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.getByTestId("login-form").waitFor({ timeout: 30000 });
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: /entrar com segurança/i }).click();
  await page.locator(PAGE).waitFor({ timeout: 45000 });
}

async function expectFocused(page, anchor, label) {
  await page.waitForFunction((id) => document.activeElement?.id === id, anchor, { timeout: 10000 })
    .catch(async (error) => {
      const state = await page.evaluate(() => ({ url: location.href, active: `${document.activeElement?.tagName}#${document.activeElement?.id}` }));
      throw new Error(`${label}: foco esperado em ${anchor}; estado ${JSON.stringify(state)}`, { cause: error });
    });
}

try {
  const desktop = await openSession({ width: 1440, height: 1000 });
  const page = desktop.page;
  await login(page, `/biblioteca-clinica?capitulo=${TRAIL[1].slug}`);
  await expectFocused(page, TRAIL[1].anchor, "link profundo pelo login");
  check("login real com a conta técnica dedicada e link profundo preservado após o login");

  assert.equal((await page.getByTestId("biblioteca-review-badge").textContent())?.trim(), ALL_IN_REVIEW ? "Material educacional em revisão médica" : "Estado de revisão indicado em cada capítulo");
  const cards = page.locator('[data-testid="biblioteca-trilha"] > li');
  assert.equal(await cards.count(), TRAIL.length, `Trilha 365 com exatamente ${TRAIL.length} capítulos, como o catálogo implantado`);
  assert.deepEqual((await cards.locator("h4").allTextContents()).map((t) => t.trim()), TRAIL.map((t) => t.title));
  assert.deepEqual((await cards.getByTestId("biblioteca-card-status").allTextContents()).map((t) => t.trim()), TRAIL.map((chapter) => STATUS_LABEL[chapter.status]));
  check(`catálogo publicado: ${TRAIL.length} capítulos, títulos e status idênticos ao catálogo do commit implantado`);

  for (const chapter of TRAIL) {
    const article = page.locator(`article#${chapter.anchor}`);
    assert.equal(await article.count(), 1, `${chapter.anchor} único`);
    const heading = (await article.locator("h2").first().textContent()) ?? "";
    assert.ok(heading.includes(`Dia ${String(chapter.day).padStart(2, "0")}/365`) && heading.includes(chapter.title), `${chapter.anchor}: cabeçalho canônico`);
    assert.ok(await article.locator('[role="group"][aria-label]').count() >= 1, `${chapter.anchor}: fluxograma`);
    assert.ok(await article.locator('a[target="_blank"][rel*="noopener"]').count() >= 5, `${chapter.anchor}: referências`);
    await page.getByTestId(`biblioteca-card-${chapter.slug}`).click();
    await expectFocused(page, chapter.anchor, "clique");
  }
  check("cada capítulo é único, tem fluxograma e referências, e abre pelo cartão");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(PAGE).waitFor({ timeout: 45000 });
  await expectFocused(page, TRAIL.at(-1).anchor, "recarregar");
  check("após recarregar, sessão mantida e capítulo do link reaberto");
  await page.screenshot({ path: `${artifactDir}/producao-desktop.png` });
  await desktop.context.close();

  const mobile = await openSession({ width: 390, height: 844 });
  await login(mobile.page, `/biblioteca-clinica?capitulo=${TRAIL[2].slug}`);
  await expectFocused(mobile.page, TRAIL[2].anchor, "celular");
  assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "celular sem rolagem horizontal");
  await mobile.page.screenshot({ path: `${artifactDir}/producao-celular.png` });
  check("celular 390 px: capítulo aberto pelo link, sem rolagem horizontal");
  await mobile.context.close();

  assert.deepEqual(report.pageErrors, [], "sem erro de JavaScript em produção");
  assert.deepEqual(report.writes, [], "smoke somente leitura");
  check("sem pageerror e sem escrita");
  report.ok = true;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(`${artifactDir}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}

console.log(`published-biblioteca ok em ${origin} (SHA ${report.servedSha})`);
for (const name of report.checks) console.log(`  ✓ ${name}`);

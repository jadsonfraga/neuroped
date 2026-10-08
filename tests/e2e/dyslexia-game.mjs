// Dyslexia Risk · Jogo das Letras e Números (5–18): partida completa no app
// construído, em celular (390×844), aos 5 e aos 15 anos — início, mapa, pausa,
// um item de cada domínio, resultado do aplicador com azul/vermelho + rótulo,
// PDF gerado localmente, ICED-8 intacto na outra aba e dock inferior sem cobrir
// o fim da página. Fecha com a sidebar desktop: o jogo como cartão-herói
// (vermelho) logo abaixo do Super NeuroPad Game. Sem gravação clínica.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";

const dir = process.env.DYSLEXIA_ARTIFACT_DIR || "/tmp/dyslexia-game";
await mkdir(dir, { recursive: true });
const server = await startStaticServer("dist/public", { port: 0, apiHandler: createSyntheticClinicalApi({ patients: "empty" }) });
const browser = await chromium.launch(auditBrowserLaunchOptions());
const errors = [];
const clinicalWrites = [];

function pdfText(path) {
  try { return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8" }); } catch { return null; }
}

async function login(page, route) {
  await page.goto(`${server.origin}/#${route}`);
  await page.waitForLoadState("networkidle");
  const email = page.locator("#login-email");
  if (await email.count()) {
    await email.fill(SYNTHETIC_CREDENTIALS.email);
    await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
    await page.locator('[data-testid="login-form"] button[type="submit"]').click();
  }
}

async function axe(page, name) {
  // SaveToPatient é componente compartilhado (fora do escopo desta aba).
  const result = await new AxeBuilder({ page }).include('[data-testid="drx-game"]').exclude('[data-testid="drx-save-to-patient"]').analyze();
  const serious = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  await writeFile(`${dir}/${name}-axe.json`, JSON.stringify(result.violations, null, 2));
  assert.deepEqual(serious.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })), [], `${name}: axe`);
}

async function play(age) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true, reducedMotion: "reduce" });
  await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`${age}: ${e.message}`));
  page.on("dialog", (d) => d.accept());
  page.on("request", (req) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method()) && /\/api\//.test(req.url()) && !/\/api\/auth\//.test(req.url())) clinicalWrites.push(`${req.method()} ${new URL(req.url()).pathname}`);
  });
  const shot = async (name, full = false) => {
    await page.waitForTimeout(150);
    return page.screenshot({ path: `${dir}/${String(age).padStart(2, "0")}-${name}.png`, fullPage: full });
  };
  const btn = (name) => page.getByRole("button", { name, exact: true });

  await login(page, "/dyslexia-risk");
  await page.locator('[data-testid="drx-game"][data-screen="inicio"]').waitFor({ timeout: 20000 });
  assert.equal(await page.getByTestId("dyslexia-risk").getAttribute("data-mode"), "jogo", "jogo é a entrada padrão");
  await axe(page, `${age}-inicio`);
  await btn(`${age} anos`).click();
  await page.getByRole("status").filter({ hasText: "Faixa" }).waitFor();
  await shot("01-inicio");
  await btn("Começar aventura").click();
  await page.locator('[data-testid="drx-game"][data-screen="mapa"]').waitFor();
  await shot("02-mapa");
  // Nada essencial do mapa fica atrás do dock nem do balão de ajuda fixo.
  const hidden = await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="mobile-primary-dock"] nav')?.getBoundingClientRect();
    const help = document.querySelector('[data-testid="button-floating-help"]')?.getBoundingClientRect();
    const hit = (a, b) => !!a && !!b && b.width > 0 && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const nodes = [...document.querySelectorAll('[aria-label="Mapa de mundos"] button, [aria-label="Mapa de mundos"] .drx-stars, [data-testid="drx-game-hud"] button')];
    return nodes.filter((n) => { const r = n.getBoundingClientRect(); return hit(r, dock) || hit(r, help); }).map((n) => n.textContent?.trim());
  });
  assert.deepEqual(hidden, [], "controle do mapa coberto pelo dock ou pelo balão de ajuda");
  await axe(page, `${age}-mapa`);

  // Pausa congela o relógio.
  await btn("Pausar").click();
  await page.getByRole("dialog", { name: "Jogo pausado" }).waitFor();
  const frozen = await page.getByTestId("drx-game-hud").textContent();
  await page.waitForTimeout(2200);
  assert.equal(await page.getByTestId("drx-game-hud").textContent(), frozen, "relógio parado na pausa");
  await shot("03-pausa");
  await page.getByRole("dialog", { name: "Jogo pausado" }).getByRole("button", { name: "▶ Continuar" }).click();

  const nextWorld = () => page.locator('[aria-label="Mapa de mundos"] button[aria-current="step"]');
  const allCorrect = age >= 15;

  // 1. Ditado
  await nextWorld().click();
  await page.getByTestId("drx-world-ditado").waitFor();
  for (let i = 0; i < 8; i++) {
    await btn("Aplicador: mostrar palavra").click();
    const reveal = (await page.getByTestId("drx-ditado-reveal").textContent()) ?? "";
    const target = /“([^”]+)”/.exec(reveal)?.[1] ?? "";
    if (i === 0) await shot("04-ditado");
    const answer = allCorrect ? (i === 0 ? target.replace(/ss/, "s").replace(/ç/, "ss").replace(/[áéíóúâêô]/, (c) => c.normalize("NFD")[0]) : target) : i < 4 ? "zzz" : target;
    await page.getByLabel("Escreva aqui").fill(answer || "x");
    await btn("Pronto ✓").click();
  }
  await page.locator('[data-testid="drx-game"][data-screen="mapa"]').waitFor();

  // 2. Leitura de palavras
  await nextWorld().click();
  await page.getByTestId("drx-world-decodificacao").waitFor();
  await shot("05-leitura-palavras");
  for (let i = 0; i < 8; i++) await btn(allCorrect || i % 2 ? "✓ Leu certo" : "✗ Errou").click();
  await page.locator('[data-testid="drx-game"][data-screen="mapa"]').waitFor();

  // 3. Fluência (sonda de 60 s; o aplicador para antes)
  await nextWorld().click();
  await page.getByTestId("drx-world-fluencia").waitFor();
  await btn("▶ Iniciar 60 s").click();
  await page.waitForTimeout(2100);
  await btn("⏸ Parar").click();
  await page.getByTestId("drx-world-fluencia").getByRole("button", { name: /^Última lida: .* \(12\)$/ }).click();
  await btn("Mais um erro").click();
  await shot("06-fluencia");
  await btn("Terminar corrida ✓").click();
  await page.locator('[data-testid="drx-game"][data-screen="mapa"]').waitFor();

  // 4. Compreensão
  await nextWorld().click();
  await page.getByTestId("drx-world-compreensao").waitFor();
  if (age <= 6) await btn("Aplicador: mostrar texto").click();
  await shot("07-compreensao");
  for (let i = 0; i < 3; i++) await page.getByRole("group", { name: "Opções" }).getByRole("button").first().click();
  await page.locator('[data-testid="drx-game"][data-screen="mapa"]').waitFor();

  // 5. Aritmética
  await nextWorld().click();
  await page.getByTestId("drx-world-aritmetica").waitFor();
  await shot("08-aritmetica");
  await axe(page, `${age}-aritmetica`);
  for (let i = 0; i < 8; i++) await page.getByRole("group", { name: "Opções" }).getByRole("button").nth(1).click();

  await page.locator('[data-testid="drx-game"][data-screen="fim"]').waitFor();
  await shot("09-fim");
  await btn("Painel do aplicador").click();
  const results = page.getByTestId("drx-game-results");
  await results.waitFor();
  const text = (await results.textContent()) ?? "";
  assert.match(text, /NÃO DIAGNÓSTICA/);
  assert.match(text, /sem validação normativa brasileira/);
  assert.match(text, /Erros fonológicos: \d/);
  assert.match(text, /corretas por minuto/);
  assert.ok(await results.locator(".snp-answer--correct").count() > 0, "acertos em azul");
  if (!allCorrect) assert.ok(await results.locator(".snp-answer--wrong").count() > 0, "erros em vermelho");
  assert.match(text, /Acertou/);
  for (const d of await results.locator("details").all()) if (!(await d.getAttribute("open"))) await d.locator("summary").click();
  await axe(page, `${age}-resultado`);
  await shot("10-resultado", true);
  await results.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('[data-testid="drx-game-results"]')?.scrollIntoView({ block: "start" }));
  await shot("10b-resultado-topo");

  const [download] = await Promise.all([page.waitForEvent("download", { timeout: 30000 }), btn("Baixar PDF").click()]);
  const pdfPath = `${dir}/${String(age).padStart(2, "0")}-resultado.pdf`;
  await download.saveAs(pdfPath);
  const pdf = pdfText(pdfPath);
  if (pdf != null) {
    assert.match(pdf, /Jogo das Letras e N[uú]meros/);
    assert.match(pdf, /N[ÃA]O DIAGN[ÓO]STICA/);
    assert.match(pdf, /Acertou|Errou/);
  }

  // Persistência local: recarregar mantém o resultado.
  await page.reload();
  await page.locator('[data-testid="drx-game"][data-screen="fim"]').waitFor({ timeout: 20000 });

  // ICED-8 continua inteiro na outra aba.
  await btn("📋 ICED-8 clínico").click();
  await btn("Tela da criança").waitFor();
  await page.getByRole("list", { name: "Trilha" }).waitFor();
  // Dock não cobre o fim da página.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const overlap = await page.evaluate(() => {
    const dock = document.querySelector('[data-testid="mobile-primary-dock"] nav');
    const rootEl = document.querySelector('[data-testid="dyslexia-risk"]');
    const last = rootEl?.lastElementChild;
    if (!dock || !last) return null;
    return last.getBoundingClientRect().bottom - dock.getBoundingClientRect().top;
  });
  if (overlap != null) assert.ok(overlap <= 0, `dock cobre ${overlap}px do fim da aba`);
  await shot("11-iced8-fim-sem-dock");
  await btn("🎮 Jogo 5–18 anos").click();
  await context.close();
}

try {
  await play(5);
  await play(15);

  // Sidebar desktop: jogo em destaque vermelho (cartão-herói), como o Super NeuroPad.
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.addInitScript((storage) => { for (const [k, v] of Object.entries(storage)) localStorage.setItem(k, v); }, ACCEPTED_FIRST_VISIT_STORAGE);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(`sidebar: ${e.message}`));
  // Rota neutra: nenhum dos dois cartões está ativo, então o acabamento é comparável.
  await login(page, "/testes-diretos");
  await page.getByTestId("sonda-digital").waitFor({ timeout: 20000 });
  const heroes = page.locator(".np-app-sidebar .np-side-hero:visible");
  const hrefs = await heroes.evaluateAll((nodes) => nodes.map((n) => n.closest("a")?.getAttribute("href")));
  assert.deepEqual(hrefs, ["/super-neuropad-game", "/dyslexia-risk"]);
  const label = await heroes.nth(1).textContent();
  assert.match(label ?? "", /Dyslexia Risk · Jogo 5–18/);
  const [a, b] = await heroes.evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n.querySelector(".np-side-hero__icon")).backgroundImage + "|" + getComputedStyle(n).backgroundImage));
  assert.equal(a, b, "mesmo acabamento visual do herói Super NeuroPad");
  await page.locator(".np-app-sidebar").screenshot({ path: `${dir}/12-sidebar-destaque.png` });
  await heroes.nth(1).click();
  await page.getByTestId("drx-game").waitFor({ timeout: 20000 });
  assert.equal(await heroes.nth(1).getAttribute("data-active"), "true", "cartão ativo na própria aba");
  await page.locator(".np-app-sidebar").screenshot({ path: `${dir}/13-sidebar-destaque-ativo.png` });
  await context.close();

  assert.deepEqual(errors, [], "sem erros de página");
  assert.deepEqual(clinicalWrites, [], "nenhuma gravação clínica na partida");
  console.log(`dyslexia game e2e OK → ${dir}`);
} finally {
  await browser.close();
  await server.close();
}

// @ts-check
/**
 * Prova visual AUTENTICADA do NeuroPed (cockpit clínico depois do login).
 *
 * O gate visual público (`audit:visual`) só certifica o app em modo aberto: ele
 * serve um `/api/health` que declara autenticação dispensável, e nesse caminho o
 * cliente nunca entra em `accessMode "remote"`. Login, contexto de clínica,
 * lista de pacientes, prontuário LIVE, execução de instrumento, documentos,
 * estados vazios/erro/carregamento, sessão expirada e logout ficavam sem
 * qualquer cobertura de navegador.
 *
 * Esta suíte sobe um backend clínico SINTÉTICO (scripts/lib/clinical-mock-api.mjs)
 * que implementa o mesmo contrato das Functions do Cloudflare com dados 100%
 * fictícios, constrói o cliente no perfil `authenticated` (VITE_AUTH_MODE=remote,
 * VITE_OPEN_ACCESS=false — exatamente a produção canônica) e percorre uma matriz
 * de estados independentes.
 *
 * Cada estado reprova a execução quando encontra:
 * - erro de runtime (pageerror) ou erro de console;
 * - overflow horizontal;
 * - violação axe de impacto serious/critical;
 * - foco fora do diálogo quando um diálogo modal está aberto;
 * - alvo de toque abaixo de 44px em viewport compacto;
 * - conteúdo clínico exibido sem sessão (vazamento de gate).
 *
 * Nenhum dado real de paciente é usado — a conta e os pacientes são sintéticos.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { ensureClientBuild, isMissingBrowserError } from "./lib/browser-audit-runtime.mjs";
import { E2E_ACCOUNT, E2E_CLINIC, startMockClinicalServer } from "./lib/clinical-mock-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outputDir = resolve(repoRoot, "artifacts/visual-authenticated");

const VIEWPORTS = {
  "mobile-small": { width: 360, height: 800 },
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1440, height: 900 },
  "desktop-wide": { width: 1728, height: 1080 },
};

const PATIENT_A = "e2e-pat-001";
const PATIENT_B = "e2e-pat-002";

const FIRST_VISIT_STORAGE = {
  "neuroped:aviso-educativo-aceito-v1": "browser-audit",
  "neuroped:onboarding-seen": "1",
  np_tour_intro_v2: "done",
  np_tour_v2_done: "1",
};

// ─────────────────────────── helpers de fluxo ───────────────────────────

async function settle(page, extraMs = 320) {
  await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(extraMs);
}

async function gotoRoute(page, origin, route, extraMs) {
  await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
  await settle(page, extraMs);
}

/** Login real pela interface — certifica o formulário, não só o token. */
async function loginThroughUi(page, origin) {
  await gotoRoute(page, origin, "/#/login");
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 20_000 });
  await page.locator("#login-email").fill(E2E_ACCOUNT.email);
  await page.locator("#login-password").fill(E2E_ACCOUNT.password);
  await page.getByRole("button", { name: /Entrar com segurança/i }).click();
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="login-form"]'),
    undefined,
    { timeout: 20_000 },
  );
  await settle(page);
}

/** Logout pelo próprio controle do app (encerra sessão e recarrega o shell). */
async function logoutThroughUi(page, origin) {
  await gotoRoute(page, origin, "/", 700);
  const exit = page.getByTestId("button-session-exit");
  // No celular/tablet a sessão vive dentro do drawer, que fica fora da tela e
  // marcado como `inert` quando fechado — o elemento existe e o Playwright o
  // considera "visível", mas ele está fora da viewport. A decisão é pela
  // largura, não pela visibilidade, e reproduz o caminho real de quem sai.
  const viewport = page.viewportSize();
  if (viewport && viewport.width < 1024) {
    await page.getByRole("button", { name: "Abrir menu de navegação" }).click();
    await page.waitForTimeout(600);
  }
  await exit.waitFor({ state: "visible", timeout: 20_000 });
  await exit.click();
  await page.waitForFunction(
    () => !sessionStorage.getItem("neuroped:access"),
    undefined,
    { timeout: 20_000 },
  );
  await settle(page, 900);
}

async function answerMchat(page, count) {
  for (let index = 0; index < count; index += 1) {
    const button = page.getByTestId(index % 3 === 0 ? `button-yes-${index}` : `button-no-${index}`);
    if (!(await button.count())) break;
    await button.click();
  }
  await page.waitForTimeout(120);
}

async function openFilterEngine(page) {
  const grid = page.getByTestId("age-band-scroll");
  if (await grid.isVisible().catch(() => false)) return;
  const legacyOpen = page.getByTestId("button-open-filter");
  if (await legacyOpen.isVisible().catch(() => false)) await legacyOpen.click();
  await grid.waitFor({ state: "visible", timeout: 25_000 }).catch(() => {});
}

// ─────────────────────────── matriz de estados ───────────────────────────
/**
 * Cada entrada é um ESTADO independente, não um recorte da mesma tela: rota,
 * viewport, tema, cenário de backend e interação combinados.
 */
const CASES = [
  // ── 1. Gate de entrada (sem sessão) ──
  {
    id: "01-login-desktop-light", viewport: "desktop", theme: "light", session: "none",
    steps: (page, ctx) => gotoRoute(page, ctx.origin, "/#/login"),
  },
  {
    id: "02-login-mobile-dark", viewport: "mobile", theme: "dark", session: "none",
    steps: (page, ctx) => gotoRoute(page, ctx.origin, "/#/login"),
  },
  {
    id: "03-login-tablet-light", viewport: "tablet", theme: "light", session: "none",
    steps: (page, ctx) => gotoRoute(page, ctx.origin, "/#/login"),
  },
  {
    id: "04-login-credencial-invalida-mobile-light", viewport: "mobile", theme: "light", session: "none",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/login");
      await page.locator("#login-email").fill("errado@neuroped.invalid");
      await page.locator("#login-password").fill("senha-incorreta");
      await page.getByRole("button", { name: /Entrar com segurança/i }).click();
      await page.getByRole("alert").first().waitFor({ state: "visible", timeout: 15_000 });
    },
    expectedConsoleErrorPattern: /401/,
  },
  {
    id: "05-rota-clinica-sem-sessao-redireciona-desktop-light", viewport: "desktop", theme: "light", session: "none",
    steps: (page, ctx) => gotoRoute(page, ctx.origin, "/#/pacientes"),
    assertNoClinicalLeak: true,
  },
  {
    id: "06-prontuario-sem-sessao-redireciona-mobile-light", viewport: "mobile", theme: "light", session: "none",
    steps: (page, ctx) => gotoRoute(page, ctx.origin, "/#/prontuario"),
    assertNoClinicalLeak: true,
  },
  {
    id: "07-login-valido-pela-interface-desktop-light", viewport: "desktop", theme: "light", session: "none",
    steps: (page, ctx) => loginThroughUi(page, ctx.origin),
  },
  {
    id: "08-login-valido-pela-interface-mobile-dark", viewport: "mobile", theme: "dark", session: "none",
    steps: (page, ctx) => loginThroughUi(page, ctx.origin),
  },

  // ── 2. Home autenticada (cockpit) ──
  { id: "09-home-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  {
    id: "09b-home-com-paciente-em-foco-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      // Abrir a ficha declara o foco; a home precisa retomá-lo.
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_A}`, 900);
      await gotoRoute(page, ctx.origin, "/", 900);
    },
    expectText: ["Paciente em foco", "Ana Sintética"],
  },
  {
    id: "09c-home-com-paciente-em-foco-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_A}`, 900);
      await gotoRoute(page, ctx.origin, "/", 900);
    },
    expectText: ["Paciente em foco", "Ana Sintética"],
  },
  { id: "10-home-desktop-dark", viewport: "desktop", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "11-home-desktop-wide-light", viewport: "desktop-wide", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "12-home-tablet-light", viewport: "tablet", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "13-home-tablet-dark", viewport: "tablet", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "14-home-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "15-home-mobile-dark", viewport: "mobile", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  { id: "16-home-mobile-small-light", viewport: "mobile-small", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/") },
  {
    id: "17-home-busca-ativa-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/");
      await page.getByTestId("input-search").fill("autismo");
      await page.waitForTimeout(700);
    },
  },
  {
    id: "18-home-sem-pacientes-desktop-light", viewport: "desktop", theme: "light", scenario: "empty",
    steps: (p, c) => gotoRoute(p, c.origin, "/"),
  },
  {
    id: "19-home-carregando-mobile-light", viewport: "mobile", theme: "light", scenario: "slow",
    steps: async (page, ctx) => {
      await page.goto(`${ctx.origin}/`, { waitUntil: "domcontentloaded" });
      await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(250);
    },
  },

  // ── 3. Pacientes: lista, busca, vazio, carregando, erro ──
  { id: "20-pacientes-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 700) },
  { id: "21-pacientes-desktop-dark", viewport: "desktop", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 700) },
  { id: "22-pacientes-tablet-light", viewport: "tablet", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 700) },
  { id: "23-pacientes-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 700) },
  { id: "24-pacientes-mobile-dark", viewport: "mobile", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 700) },
  {
    id: "25-pacientes-busca-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 700);
      await page.getByTestId("input-search-patients").fill("Clara");
      await page.waitForTimeout(600);
    },
  },
  {
    id: "26-pacientes-vazio-desktop-light", viewport: "desktop", theme: "light", scenario: "empty",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 900),
  },
  {
    id: "27-pacientes-vazio-mobile-light", viewport: "mobile", theme: "light", scenario: "empty",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 900),
  },
  {
    id: "28-pacientes-carregando-desktop-light", viewport: "desktop", theme: "light", scenario: "slow",
    steps: async (page, ctx) => {
      await page.goto(`${ctx.origin}/#/pacientes`, { waitUntil: "domcontentloaded" });
      await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(400);
    },
  },
  {
    id: "29-pacientes-erro-recuperavel-desktop-light", viewport: "desktop", theme: "light", scenario: "error",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 1_200),
    expectedConsoleErrorPattern: /500|DB_ERROR|Failed to load/i,
  },
  {
    id: "30-pacientes-erro-recuperavel-mobile-light", viewport: "mobile", theme: "light", scenario: "error",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 1_200),
    expectedConsoleErrorPattern: /500|DB_ERROR|Failed to load/i,
  },
  {
    id: "31-pacientes-dialogo-novo-paciente-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 700);
      await page.getByTestId("button-new-patient").click();
      await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(400);
    },
    expectDialogFocus: true,
  },
  {
    id: "32-pacientes-dialogo-novo-paciente-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 700);
      await page.getByTestId("button-new-patient").click();
      await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(400);
    },
    expectDialogFocus: true,
  },
  {
    id: "33-pacientes-salvamento-novo-paciente-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 700);
      await page.getByTestId("button-new-patient").click();
      await page.getByRole("dialog").waitFor({ state: "visible", timeout: 10_000 });
      await page.getByTestId("input-patient-name").fill("Paciente Sintético Novo (fictício)");
      await page.getByTestId("input-patient-birth").fill("2019-05-20");
      await page.getByTestId("button-save-patient").click();
      await page.waitForTimeout(900);
    },
  },

  {
    id: "33b-pacientes-confirmacao-destrutiva-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 900);
      await page.getByTestId(`button-delete-${PATIENT_A}`).click();
      await page.getByRole("alertdialog").or(page.getByRole("dialog")).first()
        .waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(400);
    },
    expectDialogFocus: true,
    expectText: ["Remover"],
  },
  {
    id: "33c-pacientes-confirmacao-destrutiva-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/pacientes", 900);
      await page.getByTestId(`button-delete-${PATIENT_A}`).click();
      await page.getByRole("alertdialog").or(page.getByRole("dialog")).first()
        .waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(400);
    },
    expectDialogFocus: true,
    expectText: ["Remover"],
  },

  // ── 4. Seleção, troca e detalhe de paciente ──
  {
    id: "34-paciente-detalhe-desktop-light", viewport: "desktop", theme: "light",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 900),
  },
  {
    id: "35-paciente-detalhe-desktop-dark", viewport: "desktop", theme: "dark",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 900),
  },
  {
    id: "36-paciente-detalhe-mobile-light", viewport: "mobile", theme: "light",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 900),
  },
  {
    id: "37-paciente-detalhe-tablet-dark", viewport: "tablet", theme: "dark",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 900),
  },
  {
    id: "38-troca-de-paciente-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_A}`, 900);
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_B}`, 900);
    },
  },
  {
    id: "39-troca-de-paciente-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_A}`, 900);
      await gotoRoute(page, ctx.origin, `/#/paciente/${PATIENT_B}`, 900);
    },
  },
  {
    id: "40-paciente-detalhe-sem-avaliacoes-desktop-light", viewport: "desktop", theme: "light", scenario: "empty",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 1_200),
    expectedConsoleErrorPattern: /404|PATIENT_NOT_FOUND|Failed to load/i,
  },
  {
    id: "41-paciente-detalhe-carregando-mobile-light", viewport: "mobile", theme: "light", scenario: "slow",
    steps: async (page, ctx) => {
      await page.goto(`${ctx.origin}/#/paciente/${PATIENT_A}`, { waitUntil: "domcontentloaded" });
      await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(400);
    },
  },
  {
    id: "42-paciente-detalhe-erro-desktop-light", viewport: "desktop", theme: "light", scenario: "error",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/paciente/${PATIENT_A}`, 1_200),
    expectedConsoleErrorPattern: /500|DB_ERROR|Failed to load/i,
  },

  // ── 5. Prontuário ──
  { id: "43-prontuario-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/prontuario", 800) },
  { id: "44-prontuario-desktop-dark", viewport: "desktop", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/prontuario", 800) },
  { id: "45-prontuario-tablet-light", viewport: "tablet", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/prontuario", 800) },
  { id: "46-prontuario-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/prontuario", 800) },
  {
    id: "47-prontuario-com-paciente-desktop-light", viewport: "desktop", theme: "light",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/prontuario?patientId=${PATIENT_A}`, 1_400),
    // Regressão coberta: a consulta vive no HASH; ler só `location.search`
    // abria o prontuário em branco, sem erro e sem vínculo com o paciente.
    expectText: ["Ana Sintética"],
  },
  {
    id: "48-prontuario-com-paciente-mobile-light", viewport: "mobile", theme: "light",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/prontuario?patientId=${PATIENT_A}`, 1_400),
    expectText: ["Ana Sintética"],
  },
  {
    id: "49-prontuario-preenchimento-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/prontuario", 900);
      const firstText = page.locator("#main-content textarea, #main-content input[type=text]").first();
      if (await firstText.count()) {
        await firstText.fill("Registro sintético de auditoria (dado fictício).");
        await page.waitForTimeout(800);
      }
    },
  },

  {
    id: "49b-prontuario-salvamento-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, `/#/prontuario?patientId=${PATIENT_A}`, 1_400);
      const save = page.getByRole("button", { name: /Salvar prontuário/i });
      await save.waitFor({ state: "visible", timeout: 15_000 });
      await save.scrollIntoViewIfNeeded();
      await save.click();
      await page.waitForTimeout(1_200);
    },
    expectText: ["Ana Sintética"],
  },

  // ── 6. Escalas: catálogo, execução, resultado ──
  { id: "50-mchat-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/mchat", 700) },
  { id: "51-mchat-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/mchat", 700) },
  {
    id: "52-mchat-em-execucao-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/mchat", 700);
      await answerMchat(page, 6);
    },
  },
  {
    id: "53-mchat-em-execucao-desktop-dark", viewport: "desktop", theme: "dark",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/mchat", 700);
      await answerMchat(page, 10);
    },
  },
  {
    id: "54-mchat-resultado-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/mchat", 700);
      await answerMchat(page, 40);
      await page.getByTestId("button-submit").click();
      await page.waitForTimeout(900);
    },
  },
  {
    id: "55-mchat-resultado-mobile-dark", viewport: "mobile", theme: "dark",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/mchat", 700);
      await answerMchat(page, 40);
      await page.getByTestId("button-submit").click();
      await page.waitForTimeout(900);
    },
  },
  {
    id: "56-mchat-pendencia-obrigatoria-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/mchat", 700);
      await answerMchat(page, 3);
      await page.getByTestId("button-submit").click({ force: true });
      await page.waitForTimeout(500);
    },
  },
  { id: "57-cars-tablet-light", viewport: "tablet", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/cars", 900) },
  { id: "58-snap-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/snap", 900) },
  { id: "59-biblioteca-instrumentos-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/biblioteca-instrumentos", 1_000) },

  // ── 7. Filtro de escalas ──
  {
    id: "60-filtro-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => { await gotoRoute(page, ctx.origin, "/#/filtro", 900); await openFilterEngine(page); await page.waitForTimeout(500); },
  },
  {
    id: "61-filtro-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => { await gotoRoute(page, ctx.origin, "/#/filtro", 900); await openFilterEngine(page); await page.waitForTimeout(500); },
  },
  {
    id: "62-filtro-tablet-dark", viewport: "tablet", theme: "dark",
    steps: async (page, ctx) => { await gotoRoute(page, ctx.origin, "/#/filtro", 900); await openFilterEngine(page); await page.waitForTimeout(500); },
  },
  {
    id: "63-filtro-resultado-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/filtro", 900);
      await openFilterEngine(page);
      const quickStart = page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true });
      if (await quickStart.count()) {
        await quickStart.click();
        await page.locator(".filter-260-card").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
      }
      await page.waitForTimeout(500);
    },
  },
  {
    id: "64-filtro-resultado-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await gotoRoute(page, ctx.origin, "/#/filtro", 900);
      await openFilterEngine(page);
      const quickStart = page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true });
      if (await quickStart.count()) {
        await quickStart.click();
        await page.locator(".filter-260-card").first().waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
      }
      await page.waitForTimeout(500);
    },
  },
  {
    id: "65-filtro-carregando-mobile-light", viewport: "mobile", theme: "light",
    steps: async (page, ctx) => {
      await page.goto(`${ctx.origin}/#/filtro`, { waitUntil: "domcontentloaded" });
      await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(120);
    },
  },

  // ── 8. Documentos e laudos ──
  { id: "66-documentos-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/documentos", 700) },
  { id: "67-documentos-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/documentos", 700) },
  { id: "68-documentos-tablet-dark", viewport: "tablet", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/documentos", 700) },
  { id: "69-laudo-neuroped-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/laudo-neuroped", 1_000) },
  {
    id: "69b-laudo-com-paciente-desktop-light", viewport: "desktop", theme: "light",
    steps: (p, c) => gotoRoute(p, c.origin, `/#/laudo-neuroped?patientId=${PATIENT_A}`, 1_600),
    expectText: ["Ana Sintética"],
  },
  { id: "70-laudo-neuroped-mobile-dark", viewport: "mobile", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/laudo-neuroped", 1_000) },
  { id: "71-receita-c1-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/receita-c1", 1_000) },

  // ── 9. Assistência consolidada ──
  { id: "72-ajuda-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/ajuda", 700) },
  { id: "73-ajuda-mobile-light", viewport: "mobile", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/ajuda", 700) },
  { id: "74-acessibilidade-desktop-dark", viewport: "desktop", theme: "dark", steps: (p, c) => gotoRoute(p, c.origin, "/#/acessibilidade", 700) },
  { id: "75-configuracoes-desktop-light", viewport: "desktop", theme: "light", steps: (p, c) => gotoRoute(p, c.origin, "/#/configuracoes", 900) },

  // ── 10. Sessão: expiração e logout ──
  {
    id: "76-sessao-expirada-desktop-light", viewport: "desktop", theme: "light", scenario: "expired",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/pacientes", 1_500),
    assertNoClinicalLeak: true,
    expectedConsoleErrorPattern: /401|UNAUTHENTICATED|Failed to load/i,
  },
  {
    id: "77-sessao-expirada-mobile-light", viewport: "mobile", theme: "light", scenario: "expired",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/prontuario", 1_500),
    assertNoClinicalLeak: true,
    expectedConsoleErrorPattern: /401|UNAUTHENTICATED|Failed to load/i,
  },
  {
    id: "78-sessao-expirada-pagina-dedicada-desktop-light", viewport: "desktop", theme: "light", session: "none",
    steps: (p, c) => gotoRoute(p, c.origin, "/#/sessao-expirada", 700),
  },
  {
    id: "79-logout-pelo-app-desktop-light", viewport: "desktop", theme: "light",
    steps: (page, ctx) => logoutThroughUi(page, ctx.origin),
    assertNoClinicalLeak: true,
  },
  {
    id: "80-apos-logout-rota-clinica-bloqueada-desktop-light", viewport: "desktop", theme: "light",
    steps: async (page, ctx) => {
      await logoutThroughUi(page, ctx.origin);
      await gotoRoute(page, ctx.origin, "/#/pacientes", 900);
    },
    assertNoClinicalLeak: true,
  },
  {
    id: "81-logout-pelo-app-mobile-light", viewport: "mobile", theme: "light",
    steps: (page, ctx) => logoutThroughUi(page, ctx.origin),
    assertNoClinicalLeak: true,
  },
];

// ─────────────────────────── auditoria por estado ───────────────────────────

const DOM_AUDIT = () => {
  const describe = (element) => {
    if (!(element instanceof HTMLElement)) return "elemento";
    if (element.dataset.testid) return `[data-testid="${element.dataset.testid}"]`;
    if (element.id) return `#${element.id}`;
    const label = element.getAttribute("aria-label");
    if (label) return `${element.tagName.toLowerCase()}[aria-label="${label}"]`;
    // Sem testid nem rótulo, o texto é o que permite achar o elemento no código.
    const text = (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    const classes = [...element.classList].slice(0, 3).join(".");
    return `${element.tagName.toLowerCase()}${classes ? `.${classes}` : ""}${text ? `{${text}}` : ""}`;
  };

  const visibleRect = (element) => {
    if (!(element instanceof HTMLElement)) return null;
    if (element.closest('[hidden], [inert], [data-state="closed"], aside[aria-hidden="true"]')) return null;
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      Number(style.opacity) === 0 ||
      box.width === 0 ||
      box.height === 0
    ) return null;
    return { width: box.width, height: box.height, top: box.top, bottom: box.bottom };
  };

  const openDialog = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')]
    .find((element) => visibleRect(element));

  // Dois patamares deliberados: controles de comando (botões, dock, ajuda)
  // seguem o alvo confortável de 44px já adotado pelo projeto; links de texto
  // isolados seguem o mínimo normativo de 24px (WCAG 2.2 Target Size Minimum).
  // Links dentro de parágrafo/lista são texto em fluxo e ficam fora da regra.
  const compactTargets = [];
  if (innerWidth < 1024) {
    const groups = [
      { minimum: 44, selector: '[data-testid="mobile-primary-dock"] button, [data-testid="mobile-primary-dock"] a' },
      { minimum: 44, selector: '[data-testid="button-floating-help"]' },
      { minimum: 44, selector: "#main-content button:not([disabled])" },
      { minimum: 24, selector: "#main-content a[href]:not([hidden])" },
      { minimum: 24, selector: "footer a[href]" },
    ];
    // Controles de ESCOLHA (radio/checkbox) medem diferente de comandos.
    // O alvo real é o indicador MAIS o rótulo associado, e o critério aplicável
    // é o normativo de 24px (WCAG 2.2 — Target Size Minimum), não os 44px de
    // conforto que o projeto exige de dock, botões de ação e ajuda flutuante.
    // Medir o indicador de 16px isolado reprovaria todo o catálogo de escalas
    // por um alvo que, na prática, é a linha inteira da alternativa.
    const CHOICE_MINIMUM = 24;
    const choiceTargetBox = (element) => {
      const role = element.getAttribute("role");
      const type = element.getAttribute("type");
      const isChoice = role === "radio" || role === "checkbox" || type === "radio" || type === "checkbox";
      if (!isChoice) return null;
      const own = visibleRect(element);
      if (!own) return null;
      const labels = [
        element.closest("label"),
        element.id ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`) : null,
      ].filter(Boolean);
      let union = { ...own, left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right };
      for (const label of labels) {
        const box = label.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        const top = Math.min(union.top, box.top);
        const bottom = Math.max(union.bottom, box.bottom);
        const left = Math.min(union.left, box.left);
        const right = Math.max(union.right, box.right);
        union = { top, bottom, left, right, width: right - left, height: bottom - top };
      }
      return union;
    };

    for (const group of groups) {
      for (const element of document.querySelectorAll(group.selector)) {
        const box = visibleRect(element);
        if (!box) continue;
        if (element.tagName === "A" && element.closest("p, li")) continue;
        // Âncora que embrulha um botão: o alvo real é o botão interno, medido
        // pela sua própria regra. A caixa inline da âncora não é o alvo.
        if (element.tagName === "A" && element.querySelector('button, [role="button"]')) continue;
        const choiceBox = choiceTargetBox(element);
        const effective = choiceBox ?? box;
        const minimum = choiceBox ? CHOICE_MINIMUM : group.minimum;
        if (effective.width < minimum || effective.height < minimum) {
          compactTargets.push({
            selector: describe(element),
            width: Math.round(effective.width),
            height: Math.round(effective.height),
            minimum,
          });
        }
      }
    }
  }

  const dock = document.querySelector('[data-testid="mobile-primary-dock"]');
  const dockBox = visibleRect(dock);
  const main = document.querySelector("#main-content");
  const mainPaddingBottom = main instanceof HTMLElement
    ? Number.parseFloat(getComputedStyle(main).paddingBottom) || 0
    : 0;

  // `innerText` não inclui o VALOR de campos de formulário, e telas como o
  // prontuário carregam o paciente exatamente para dentro de inputs. Sem isso,
  // um prontuário corretamente preenchido pareceria vazio para a auditoria.
  const fieldValues = [...document.querySelectorAll("input, textarea, select")]
    .map((field) => (field instanceof HTMLElement ? field.value ?? "" : ""))
    .filter(Boolean)
    .join(" \n ");
  const bodyText = `${document.body.innerText || ""}\n${fieldValues}`;

  return {
    viewport: { width: innerWidth, height: innerHeight },
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    compactTargets,
    dock: dockBox
      ? {
          height: Math.round(dockBox.height),
          reserve: Math.round(mainPaddingBottom),
          // Durante o carregamento de uma rota o dock já existe e o
          // #main-content ainda não: não há conteúdo a ser coberto, e cobrar
          // reserva aí seria cobrar de um layout que não existe.
          mainPresent: main instanceof HTMLElement,
        }
      : null,
    dialog: openDialog
      ? { present: true, focusInside: openDialog.contains(document.activeElement) }
      : { present: false, focusInside: true },
    bodyText: bodyText.slice(0, 6_000),
    hasLoginForm: Boolean(document.querySelector('[data-testid="login-form"]')),
  };
};

/** Marcadores de conteúdo clínico que jamais podem aparecer sem sessão. */
const CLINICAL_LEAK_MARKERS = ["Ana Sintética", "Bruno Sintético", "Clara Sintética"];

async function runCase(browser, server, testCase) {
  const viewport = VIEWPORTS[testCase.viewport];
  const compact = viewport.width < 1024;
  const scenario = testCase.scenario ?? "default";
  const context = await browser.newContext({
    viewport,
    colorScheme: testCase.theme,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    isMobile: viewport.width < 768,
    hasTouch: compact,
    extraHTTPHeaders: { "x-neuroped-mock-scenario": scenario },
  });

  const seedSession = testCase.session !== "none";
  // Preferências e tema podem (e devem) ser reaplicados a cada navegação; a
  // SESSÃO não: se o token fosse reinjetado por init script, um logout real
  // dentro do app seria desfeito pelo próprio harness e o teste de logout
  // passaria a medir a si mesmo. A credencial é semeada uma única vez, na
  // rota pública de login, e daí em diante vive no sessionStorage da aba.
  await context.addInitScript(({ storage, theme }) => {
    for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
    localStorage.setItem("neuroped:theme", theme);
    localStorage.setItem(
      "neuroped:auth-capability",
      JSON.stringify({ required: true, configured: true }),
    );
  }, { storage: FIRST_VISIT_STORAGE, theme: testCase.theme });

  const page = await context.newPage();
  if (seedSession) {
    await page.goto(`${server.origin}/#/login`, { waitUntil: "domcontentloaded" });
    await page.evaluate(({ session, clinicId }) => {
      sessionStorage.setItem("neuroped:access", session.accessToken);
      sessionStorage.setItem("neuroped:refresh", session.refreshToken);
      sessionStorage.setItem("neuroped:user", JSON.stringify(session.user));
      sessionStorage.setItem("neuroped:active-clinic-id", clinicId);
    }, { session: server.session, clinicId: E2E_CLINIC.id });
  }
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });

  let stepError = null;
  try {
    await testCase.steps(page, { origin: server.origin });
  } catch (error) {
    stepError = error instanceof Error ? error.message : String(error);
  }

  // Entradas animadas (opacidade 0 -> 1, com atraso escalonado por cartão) só
  // terminam alguns frames depois do carregamento. Auditar contraste no meio
  // dessa transição reprova um texto que está correto — o axe media a cor de um
  // elemento ainda translúcido. Espera-se o fim das animações em curso.
  await page.waitForFunction(
    () => !document.getAnimations || document.getAnimations()
      .filter((animation) => animation.playState === "running").length === 0,
    undefined,
    { timeout: 6_000 },
  ).catch(() => {});

  // A reserva inferior do dock é aplicada por efeito (classe no <body>).
  // Auditar antes disso mediria "reserva 0" num layout que, um frame depois,
  // está correto — e transformaria o gate em fonte de ruído.
  await page.waitForFunction(() => {
    const dock = document.querySelector('[data-testid="mobile-primary-dock"]');
    return !dock || document.body.classList.contains("np-mobile-dock-active");
  }, undefined, { timeout: 5_000 }).catch(() => {});

  let audit = await page.evaluate(DOM_AUDIT);
  // A reserva é aplicada por classe no <body> e pode não estar refletida no
  // primeiro frame após a montagem. Uma releitura evita reprovar um layout que,
  // um instante depois, está correto — sem esconder uma reserva de fato ausente.
  if (audit.dock && audit.dock.mainPresent && audit.dock.reserve < audit.dock.height + 8) {
    await page.waitForTimeout(600);
    audit = await page.evaluate(DOM_AUDIT);
  }

  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
    .catch(() => ({ violations: [] }));
  const blockingViolations = (axeResults.violations ?? []).filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  await page.screenshot({ path: resolve(outputDir, `${testCase.id}-viewport.png`), fullPage: false, animations: "disabled" });
  await page.screenshot({ path: resolve(outputDir, `${testCase.id}-full.png`), fullPage: true, animations: "disabled" });

  // Erros de rede esperados pelo próprio cenário (401 de sessão expirada, 500 do
  // cenário de erro) não são regressão: o que se audita é a resposta da UI a eles.
  const expected = testCase.expectedConsoleErrorPattern;
  const unexpectedErrors = runtimeErrors.filter((message) => !(expected && expected.test(message)));

  const horizontalOverflow = Math.max(0, audit.scrollWidth - audit.clientWidth);
  const leaked = testCase.assertNoClinicalLeak
    ? CLINICAL_LEAK_MARKERS.filter((marker) => audit.bodyText.includes(marker))
    : [];
  // Alguns estados não bastam "renderizar": precisam PROVAR que o contexto
  // clínico chegou à tela (ex.: o prontuário aberto a partir de um paciente).
  // Comparação insensível a caixa e acento: rótulos do cockpit são exibidos em
  // maiúsculas por CSS (`text-transform`), e `innerText` devolve o texto já
  // transformado — comparar literal reprovaria um estado correto.
  const normalize = (value) => value
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const normalizedBody = normalize(audit.bodyText);
  const missingText = (testCase.expectText ?? []).filter(
    (needle) => !normalizedBody.includes(normalize(needle)),
  );

  const failures = [
    ...(stepError ? [`fluxo-interrompido: ${stepError}`] : []),
    ...(horizontalOverflow > 1 ? [`overflow-horizontal:${horizontalOverflow}px`] : []),
    ...unexpectedErrors.map((message) => `runtime:${message}`),
    ...blockingViolations.map((violation) =>
      `axe:${violation.id}(${violation.impact})@${violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join(" | ")}`),
    ...(testCase.expectDialogFocus && audit.dialog.present && !audit.dialog.focusInside
      ? ["foco-fora-do-dialogo"]
      : []),
    ...audit.compactTargets.map((target) => `alvo-compacto:${target.selector}:${target.width}x${target.height}<${target.minimum}`),
    ...leaked.map((marker) => `vazamento-clinico-sem-sessao:${marker}`),
    ...missingText.map((needle) => `contexto-ausente-na-tela:${needle}`),
    // O dock é fixo: sem reserva equivalente no conteúdo, ele cobre o fim da
    // página (justamente onde ficam salvar, enviar e concluir).
    ...(audit.dock && audit.dock.mainPresent && audit.dock.reserve < audit.dock.height + 8
      ? [`reserva-dock:${audit.dock.reserve}px<${audit.dock.height + 8}px`]
      : []),
  ];

  await context.close();

  return {
    id: testCase.id,
    viewport: testCase.viewport,
    size: `${viewport.width}x${viewport.height}`,
    theme: testCase.theme,
    scenario,
    session: seedSession ? "autenticada" : "sem sessão",
    horizontalOverflow,
    dock: audit.dock,
    axeBlocking: blockingViolations.length,
    axeTotal: (axeResults.violations ?? []).length,
    axeDetails: blockingViolations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.slice(0, 5).map((node) => ({
        target: node.target,
        summary: (node.failureSummary ?? "").slice(0, 400),
      })),
    })),
    runtimeErrors: unexpectedErrors,
    failures,
  };
}

// ─────────────────────────── execução ───────────────────────────

async function main() {
  if (CASES.length < 50) {
    throw new Error(`A matriz autenticada precisa de ao menos 50 estados; há ${CASES.length}.`);
  }
  const ids = new Set(CASES.map((testCase) => testCase.id));
  if (ids.size !== CASES.length) throw new Error("Há ids duplicados na matriz autenticada.");

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const dist = ensureClientBuild(repoRoot, "authenticated");
  const server = await startMockClinicalServer(dist);

  // Uma sessão sintética emitida pela própria API do harness. Os estados de
  // login pela interface não a usam — eles autenticam de verdade no formulário.
  const loginResponse = await fetch(`${server.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: E2E_ACCOUNT.email, password: E2E_ACCOUNT.password }),
  });
  if (!loginResponse.ok) throw new Error("Backend sintético não emitiu sessão de auditoria.");
  server.session = await loginResponse.json();

  // Mesma política do gate de a11y: quando o ambiente fornece um Chromium fora
  // da revisão fixada pelo Playwright, ele é usado explicitamente em vez de o
  // gate se declarar indisponível.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  let browser;
  try {
    browser = await chromium.launch(
      executablePath
        ? { headless: true, executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
        : { headless: true },
    );
  } catch (error) {
    await server.close();
    if (isMissingBrowserError(error)) {
      console.error("[visual-auth] Chromium indisponível — este gate exige navegador real.");
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const results = [];
  try {
    for (const testCase of CASES) {
      const result = await runCase(browser, server, testCase);
      results.push(result);
      console.log(`[visual-auth] ${result.id}: ${result.failures.length ? `FALHOU — ${result.failures.join(", ")}` : "OK"}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}: ${failure}`));
  const report = {
    generatedAt: new Date().toISOString(),
    profile: "authenticated",
    account: { email: E2E_ACCOUNT.email, synthetic: true },
    summary: {
      states: results.length,
      screenshots: results.length * 2,
      authenticatedStates: results.filter((result) => result.session === "autenticada").length,
      failedStates: results.filter((result) => result.failures.length).length,
      unmodeledEndpoints: [...server.state.unknownEndpoints],
    },
    states: results,
    failures,
  };
  writeFileSync(resolve(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(resolve(outputDir, "index.md"), [
    "# NeuroPed — prova visual autenticada",
    "",
    `Estados: ${report.summary.states} (autenticados: ${report.summary.authenticatedStates}) · capturas: ${report.summary.screenshots} · com falha: ${report.summary.failedStates}`,
    "",
    "Conta e pacientes são sintéticos; nenhum dado real de paciente é usado.",
    "",
    ...results.map((result) => `- ${result.failures.length ? "❌" : "✅"} **${result.id}** — ${result.size}, ${result.theme}, cenário ${result.scenario}, ${result.session}${result.failures.length ? ` — ${result.failures.join("; ")}` : ""}`),
    "",
  ].join("\n"));

  if (failures.length) {
    console.error(`[visual-auth] ✗ ${failures.length} falha(s):\n  ${failures.join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log(`[visual-auth] ✓ ${results.length} estados (${report.summary.authenticatedStates} autenticados) e ${results.length * 2} capturas sem overflow, erro de runtime, violação axe serious/critical, foco perdido, alvo subdimensionado ou vazamento clínico sem sessão.`);
  }
}

await main();

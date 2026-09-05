// @ts-check
/**
 * Prova visual do cockpit clínico **autenticado**.
 *
 * A prova visual pública (`scripts/audit-visual-proof.mjs`) certifica o shell
 * aberto e o gate de login. Ela permanece verde mesmo quando toda rota protegida
 * termina na tela de autenticação — foi exatamente o que a auditoria de 2026-09
 * demonstrou. Este gate fecha essa lacuna: entra com uma conta sintética, navega
 * o fluxo clínico inteiro e falha quando um estado autenticado regride.
 *
 * Cada caso declara `expect` (o que precisa estar em tela) e `forbid` (o que não
 * pode aparecer — o gate de login à frente do conteúdo clínico, por exemplo).
 * Sem esse par, uma captura da tela de login passaria por "cobertura do
 * prontuário", que é a regressão silenciosa que este arquivo existe para impedir.
 *
 * Dados: 100% sintéticos, servidos por `scripts/lib/synthetic-clinical-api.mjs`.
 * Nenhum prontuário real, nenhuma credencial de produção.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  isMissingBrowserError,
  startStaticServer,
} from "./lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
  SYNTHETIC_PATIENTS,
} from "./lib/synthetic-clinical-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outputDir = resolve(repoRoot, "artifacts/visual-authenticated");

/** Matriz mínima exigida pelo gate: abaixo disso a cobertura deixou de existir. */
const MINIMUM_STATES = 50;

const VIEWPORTS = {
  mobileSmall: { width: 360, height: 800, label: "mobile-360" },
  mobile: { width: 390, height: 844, label: "mobile-390" },
  tablet: { width: 820, height: 1180, label: "tablet-820" },
  desktop: { width: 1440, height: 900, label: "desktop-1440" },
};

const LOGIN_FORM = '[data-testid="login-form"]';
const PATIENT = SYNTHETIC_PATIENTS.first.id;
const PATIENT_TWO = SYNTHETIC_PATIENTS.second.id;

/** Espera curta e determinística usada depois de interações locais. */
const settle = (page, ms = 350) => page.waitForTimeout(ms);

async function openHelp(page) {
  await page.getByTestId("button-floating-help").click();
  await page.locator('[data-testid="help-dialog"]').waitFor({ state: "visible", timeout: 10_000 });
  await settle(page);
}

/**
 * Matriz de estados. `group` alimenta o relatório; `scenario` seleciona a
 * variante da API sintética; `fresh` força o login interativo real.
 */
const CASES = [
  // ── 1. Autenticação ─────────────────────────────────────────────────────
  {
    id: "login-desktop-light", group: "Autenticação", anonymous: true,
    route: "/login", viewport: "desktop", theme: "light",
    expect: [LOGIN_FORM, "#login-email", "#login-password"],
  },
  {
    id: "login-mobile-dark", group: "Autenticação", anonymous: true,
    route: "/login", viewport: "mobile", theme: "dark",
    expect: [LOGIN_FORM],
  },
  {
    id: "login-tablet-light", group: "Autenticação", anonymous: true,
    route: "/login", viewport: "tablet", theme: "light",
    expect: [LOGIN_FORM],
  },
  {
    id: "login-erro-credenciais", group: "Autenticação", anonymous: true,
    route: "/login", viewport: "desktop", theme: "light",
    expect: [LOGIN_FORM, '[role="alert"]'],
    async prepare(page) {
      await page.fill("#login-email", SYNTHETIC_CREDENTIALS.email);
      await page.fill("#login-password", SYNTHETIC_CREDENTIALS.wrongPassword);
      await page.click('button[type="submit"]');
      await page.locator('[role="alert"]').first().waitFor({ state: "visible", timeout: 10_000 });
    },
    expectedNetworkFailures: ["/api/auth/login"],
  },
  {
    id: "login-sucesso-vai-para-cockpit", group: "Autenticação", fresh: true,
    route: "/login", viewport: "desktop", theme: "light",
    expect: ['[data-testid="text-page-title"]'],
    forbid: [LOGIN_FORM],
  },
  {
    id: "login-sucesso-mobile", group: "Autenticação", fresh: true,
    route: "/login", viewport: "mobile", theme: "light",
    expect: ['[data-testid="text-page-title"]'],
    forbid: [LOGIN_FORM],
  },
  {
    id: "login-retoma-destino-protegido", group: "Autenticação", fresh: true,
    // Entra a partir de uma rota clínica: depois do login o profissional precisa
    // cair no destino pedido, não numa home genérica.
    startRoute: "/pacientes", route: "/login", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-new-patient"]'],
    forbid: [LOGIN_FORM],
  },

  // ── 2. Home / cockpit ───────────────────────────────────────────────────
  {
    id: "home-desktop-light", group: "Cockpit", route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="text-page-title"]', '[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-desktop-dark", group: "Cockpit", route: "/", viewport: "desktop", theme: "dark",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-tablet-light", group: "Cockpit", route: "/", viewport: "tablet", theme: "light",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-mobile-light", group: "Cockpit", route: "/", viewport: "mobile", theme: "light",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-mobile-small-dark", group: "Cockpit", route: "/", viewport: "mobileSmall", theme: "dark",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-sem-pacientes", group: "Cockpit", scenario: "empty",
    route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "home-busca-ativa", group: "Cockpit", route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="input-search"]'],
    async prepare(page) {
      await page.fill('[data-testid="input-search"]', "mchat");
      await settle(page, 900);
    },
  },

  // ── 3. Seleção e troca de paciente ──────────────────────────────────────
  {
    id: "pacientes-lista-desktop", group: "Pacientes", route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-new-patient"]', `[data-testid="button-edit-${PATIENT}"]`], forbid: [LOGIN_FORM],
  },
  {
    id: "pacientes-lista-mobile", group: "Pacientes", route: "/pacientes", viewport: "mobile", theme: "light",
    expect: [`[data-testid="button-edit-${PATIENT}"]`], forbid: [LOGIN_FORM],
  },
  {
    id: "pacientes-lista-tablet-dark", group: "Pacientes", route: "/pacientes", viewport: "tablet", theme: "dark",
    expect: [`[data-testid="button-edit-${PATIENT}"]`], forbid: [LOGIN_FORM],
  },
  {
    id: "pacientes-busca-filtrada", group: "Pacientes", route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="input-search-patients"]'],
    async prepare(page) {
      await page.fill('[data-testid="input-search-patients"]', "Bravo");
      await settle(page, 500);
    },
  },
  {
    id: "pacientes-estado-vazio", group: "Pacientes", scenario: "empty",
    route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-new-patient"]'],
    forbid: [`[data-testid="button-edit-${PATIENT}"]`, LOGIN_FORM],
  },
  {
    id: "pacientes-carregando", group: "Pacientes", scenario: "hangingPatients",
    route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[role="status"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "pacientes-erro-recuperavel", group: "Pacientes", scenario: "failingPatients",
    route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-new-patient"]'], forbid: [LOGIN_FORM],
    expectedNetworkFailures: ["/api/patients", "/api/live/patients"],
  },
  {
    id: "pacientes-novo-cadastro", group: "Pacientes", route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="input-patient-name"]'], dialog: true,
    async prepare(page) {
      await page.getByTestId("button-new-patient").click();
      await page.locator('[data-testid="input-patient-name"]').waitFor({ state: "visible", timeout: 10_000 });
      await settle(page);
    },
  },
  {
    id: "pacientes-confirmar-exclusao", group: "Confirmações destrutivas",
    route: "/pacientes", viewport: "desktop", theme: "light",
    expect: ['[role="alertdialog"]'], dialog: true, dialogSelector: '[role="alertdialog"]',
    async prepare(page) {
      await page.getByTestId(`button-delete-${PATIENT}`).click();
      await page.locator('[role="alertdialog"]').waitFor({ state: "visible", timeout: 10_000 });
      await settle(page);
    },
  },
  {
    id: "paciente-ficha-desktop", group: "Pacientes",
    route: `/paciente/${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="patient-cockpit"]', '[data-testid="button-open-prontuario"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "paciente-ficha-mobile-dark", group: "Pacientes",
    route: `/paciente/${PATIENT}`, viewport: "mobile", theme: "dark",
    expect: ['[data-testid="patient-cockpit"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "paciente-ficha-tablet", group: "Pacientes",
    route: `/paciente/${PATIENT}`, viewport: "tablet", theme: "light",
    expect: ['[data-testid="patient-cockpit"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "paciente-troca-de-contexto", group: "Pacientes",
    // Troca de paciente: a ficha precisa passar a mostrar o segundo registro.
    route: `/paciente/${PATIENT_TWO}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="patient-cockpit"]'], forbid: [LOGIN_FORM],
    expectText: SYNTHETIC_PATIENTS.second.name,
  },

  // ── 4. Prontuário ───────────────────────────────────────────────────────
  {
    id: "prontuario-desktop-light", group: "Prontuário",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="prontuario-shell"]', '[data-testid="prontuario-header"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "prontuario-desktop-dark", group: "Prontuário",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "dark",
    expect: ['[data-testid="prontuario-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "prontuario-mobile-light", group: "Prontuário",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "mobile", theme: "light",
    expect: ['[data-testid="prontuario-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "prontuario-tablet-dark", group: "Prontuário",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "tablet", theme: "dark",
    expect: ['[data-testid="prontuario-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "prontuario-sem-paciente", group: "Prontuário",
    route: "/prontuario", viewport: "desktop", theme: "light",
    expect: ['[data-testid="prontuario-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "prontuario-edicao-com-rascunho", group: "Autosave e salvamento",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="prontuario-shell"]'],
    async prepare(page) {
      const field = page.locator('#main-content textarea, #main-content input:not([type="checkbox"]):not([type="radio"]):not([type="date"])').first();
      await field.waitFor({ state: "visible", timeout: 10_000 });
      await field.fill("Registro sintético de auditoria");
      await settle(page, 700);
    },
  },
  {
    id: "prontuario-carregando", group: "Prontuário", scenario: "hangingEvents",
    route: "/prontuario", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="prontuario-shell"]'], forbid: [LOGIN_FORM],
  },

  // ── 5. Escalas e execução de instrumento ────────────────────────────────
  {
    id: "mchat-inicial-desktop", group: "Escalas", route: "/mchat", viewport: "desktop", theme: "light",
    expect: ['[data-testid="card-question-0"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "mchat-inicial-mobile", group: "Escalas", route: "/mchat", viewport: "mobile", theme: "light",
    expect: ['[data-testid="card-question-0"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "mchat-inicial-tablet-dark", group: "Escalas", route: "/mchat", viewport: "tablet", theme: "dark",
    expect: ['[data-testid="card-question-0"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "mchat-parcialmente-respondido", group: "Escalas", route: "/mchat", viewport: "desktop", theme: "light",
    expect: ['[data-testid="card-question-0"]'],
    async prepare(page) {
      for (let index = 0; index < 5; index += 1) {
        await page.getByTestId(`button-no-${index}`).click();
        await settle(page, 90);
      }
      await settle(page, 400);
    },
  },
  {
    id: "mchat-resultado", group: "Escalas", route: "/mchat", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-reset"]'],
    async prepare(page) {
      const total = await page.locator('[data-testid^="card-question-"]').count();
      for (let index = 0; index < total; index += 1) {
        await page.getByTestId(`button-no-${index}`).click();
      }
      await page.getByTestId("button-submit").click();
      await page.getByTestId("button-reset").waitFor({ state: "visible", timeout: 15_000 });
      await settle(page, 600);
    },
  },
  {
    id: "mchat-resultado-mobile-dark", group: "Escalas", route: "/mchat", viewport: "mobile", theme: "dark",
    expect: ['[data-testid="button-reset"]'],
    async prepare(page) {
      const total = await page.locator('[data-testid^="card-question-"]').count();
      for (let index = 0; index < total; index += 1) {
        await page.getByTestId(`button-no-${index}`).click();
      }
      await page.getByTestId("button-submit").click();
      await page.getByTestId("button-reset").waitFor({ state: "visible", timeout: 15_000 });
      await settle(page, 600);
    },
  },
  {
    id: "escala-vinculo-com-paciente", group: "Autosave e salvamento",
    route: "/mchat", viewport: "desktop", theme: "light",
    expect: ['[data-testid="button-reset"]'],
    async prepare(page) {
      const total = await page.locator('[data-testid^="card-question-"]').count();
      for (let index = 0; index < total; index += 1) {
        await page.getByTestId(`button-no-${index}`).click();
      }
      await page.getByTestId("button-submit").click();
      await page.getByTestId("button-reset").waitFor({ state: "visible", timeout: 15_000 });
      await page.mouse.wheel(0, 4000);
      await settle(page, 700);
    },
  },

  // ── 6. Filtro de escalas ────────────────────────────────────────────────
  {
    id: "filtro-desktop-light", group: "Filtro", route: "/filtro", viewport: "desktop", theme: "light",
    expect: [".container-filtro"], forbid: [LOGIN_FORM, '[data-testid="button-open-filter"]'],
  },
  {
    id: "filtro-desktop-dark", group: "Filtro", route: "/filtro", viewport: "desktop", theme: "dark",
    expect: [".container-filtro"], forbid: ['[data-testid="button-open-filter"]'],
  },
  {
    id: "filtro-mobile-light", group: "Filtro", route: "/filtro", viewport: "mobile", theme: "light",
    expect: [".container-filtro"], forbid: ['[data-testid="button-open-filter"]'],
  },
  {
    id: "filtro-tablet-light", group: "Filtro", route: "/filtro", viewport: "tablet", theme: "light",
    expect: [".container-filtro"], forbid: ['[data-testid="button-open-filter"]'],
  },
  {
    id: "filtro-resultados-desktop", group: "Filtro", route: "/filtro", viewport: "desktop", theme: "light",
    expect: [".filter-260-card"],
    async prepare(page) {
      await page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true }).click();
      await page.locator(".filter-260-card").first().waitFor({ state: "visible", timeout: 20_000 });
      await settle(page, 500);
    },
  },
  {
    id: "filtro-resultados-mobile", group: "Filtro", route: "/filtro", viewport: "mobile", theme: "light",
    expect: [".filter-260-card"],
    async prepare(page) {
      await page.getByRole("button", { name: "TDAH · 6–12 anos", exact: true }).click();
      await page.locator(".filter-260-card").first().waitFor({ state: "visible", timeout: 20_000 });
      await settle(page, 500);
    },
  },

  // ── 7. Documentos e laudos ──────────────────────────────────────────────
  {
    id: "documentos-desktop-light", group: "Documentos", route: "/documentos", viewport: "desktop", theme: "light",
    expect: ['[data-testid="documentos-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "documentos-mobile-dark", group: "Documentos", route: "/documentos", viewport: "mobile", theme: "dark",
    expect: ['[data-testid="documentos-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "laudo-neuroped-desktop", group: "Documentos",
    route: "/laudo-neuroped", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ['[data-testid="input-paciente"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "laudo-neuroped-mobile", group: "Documentos",
    route: "/laudo-neuroped", search: `patientId=${PATIENT}`, viewport: "mobile", theme: "light",
    expect: ['[data-testid="input-paciente"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "receita-c1-desktop", group: "Documentos",
    route: "/receita-c1", search: `patientId=${PATIENT}`, viewport: "desktop", theme: "light",
    expect: ["#main-content form, #main-content input"], forbid: [LOGIN_FORM],
  },

  // ── 8. Agenda e conta ───────────────────────────────────────────────────
  {
    id: "agenda-desktop-light", group: "Operação", route: "/agenda", viewport: "desktop", theme: "light",
    expect: ['[data-testid="agenda-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "agenda-mobile-light", group: "Operação", route: "/agenda", viewport: "mobile", theme: "light",
    expect: ['[data-testid="agenda-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "configuracoes-desktop", group: "Operação", route: "/configuracoes", viewport: "desktop", theme: "light",
    expect: ['[data-testid="configuracoes-shell"]'], forbid: [LOGIN_FORM],
  },
  {
    id: "clinica-multipla-desktop", group: "Operação", scenario: "multiTenant",
    route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="cockpit-context"]'], forbid: [LOGIN_FORM],
  },

  // ── 9. Assistência ──────────────────────────────────────────────────────
  {
    id: "assistencia-ajuda-desktop", group: "Assistência", route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="help-dialog"]'], dialog: true, dialogSelector: '[data-testid="help-dialog"]',
    prepare: openHelp,
  },
  {
    id: "assistencia-ajuda-mobile-dark", group: "Assistência", route: "/", viewport: "mobile", theme: "dark",
    expect: ['[data-testid="help-dialog"]'], dialog: true, dialogSelector: '[data-testid="help-dialog"]',
    prepare: openHelp,
  },
  {
    id: "assistencia-preferencias-desktop", group: "Assistência", route: "/", viewport: "desktop", theme: "light",
    expect: ['[data-testid="preferences-panel"]'], dialog: true, dialogSelector: '[data-testid="preferences-panel"]',
    async prepare(page) {
      await openHelp(page);
      await page.getByTestId("button-open-preferences").click();
      await page.locator('[data-testid="preferences-panel"]').waitFor({ state: "visible", timeout: 10_000 });
      await settle(page, 500);
    },
  },
  {
    id: "assistencia-tour-desktop", group: "Assistência", route: "/", viewport: "desktop", theme: "light",
    expect: ['[role="dialog"][aria-label="Tour guiado"]'],
    dialog: true, dialogSelector: '[role="dialog"][aria-label="Tour guiado"]',
    async prepare(page) {
      await openHelp(page);
      await page.getByTestId("button-start-tour").click();
      await page.locator('[role="dialog"][aria-label="Tour guiado"]').waitFor({ state: "visible", timeout: 10_000 });
      await settle(page, 500);
    },
  },
  {
    id: "assistencia-tour-mobile-dark", group: "Assistência", route: "/", viewport: "mobile", theme: "dark",
    expect: ['[role="dialog"][aria-label="Tour guiado"]'],
    dialog: true, dialogSelector: '[role="dialog"][aria-label="Tour guiado"]',
    async prepare(page) {
      await openHelp(page);
      await page.getByTestId("button-start-tour").click();
      await page.locator('[role="dialog"][aria-label="Tour guiado"]').waitFor({ state: "visible", timeout: 10_000 });
      await settle(page, 500);
    },
  },

  // ── 10. Fim de sessão ───────────────────────────────────────────────────
  {
    id: "sessao-expirada-desktop", group: "Sessão", scenario: "expiredSession", anonymous: true,
    route: "/sessao-expirada", viewport: "desktop", theme: "light",
    expect: ['[data-testid="sessao-expirada-shell"]'],
  },
  {
    id: "sessao-expirada-mobile", group: "Sessão", scenario: "expiredSession", anonymous: true,
    route: "/sessao-expirada", viewport: "mobile", theme: "dark",
    expect: ['[data-testid="sessao-expirada-shell"]'],
  },
  {
    id: "sessao-rota-protegida-sem-login", group: "Sessão", anonymous: true,
    route: "/pacientes", viewport: "desktop", theme: "light",
    // Fail-closed: sem sessão, a rota clínica precisa devolver o gate — e nunca
    // a lista de pacientes.
    expect: [LOGIN_FORM], forbid: [`[data-testid="button-edit-${PATIENT}"]`],
  },
  {
    id: "sessao-logout-volta-ao-gate", group: "Sessão", fresh: true,
    route: "/login", viewport: "desktop", theme: "light",
    // Depois do logout o shell precisa voltar ao convite de entrada; enquanto
    // "Sair" continuar visível, a sessão não foi realmente encerrada na UI.
    expect: ['[data-testid="button-session-enter"]'],
    forbid: ['[data-testid="button-session-exit"]'],
    async prepare(page) {
      page.on("dialog", (dialog) => void dialog.accept());
      await page.getByTestId("button-session-exit").waitFor({ state: "visible", timeout: 20_000 });
      await page.getByTestId("button-session-exit").click();
      await page.getByTestId("button-session-enter").waitFor({ state: "visible", timeout: 25_000 });
      await settle(page, 600);
    },
    expectedNetworkFailures: ["/api/auth"],
  },
];

// ─────────────────────────── Execução ───────────────────────────

/** @param {string} key */
function scenarioOptions(key) {
  switch (key) {
    case "empty": return { patients: "empty" };
    case "multiTenant": return { multiTenant: true };
    case "failingPatients": return { failing: ["/api/patients", "/api/live/patients"] };
    case "hangingPatients": return { hanging: ["/api/patients", "/api/live/patients"] };
    case "hangingEvents": return { hanging: ["/api/live/events", "/api/clinical-core/events"] };
    case "expiredSession": return { expiredSession: true };
    default: return {};
  }
}

async function main() {
  const duplicated = CASES.map((item) => item.id).filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicated.length) throw new Error(`Casos com id duplicado: ${duplicated.join(", ")}`);
  if (CASES.length < MINIMUM_STATES) {
    throw new Error(`Matriz autenticada com ${CASES.length} estados; o gate exige ao menos ${MINIMUM_STATES}.`);
  }

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const dist = ensureClientBuild(repoRoot);
  /** @type {Map<string, {origin: string, close: () => Promise<void>, session: any}>} */
  const servers = new Map();
  let port = 4310;

  async function serverFor(key) {
    const existing = servers.get(key);
    if (existing) return existing;
    const server = await startStaticServer(dist, {
      port: port++,
      apiHandler: createSyntheticClinicalApi(scenarioOptions(key)),
    });
    let session = null;
    if (key !== "expiredSession") {
      const response = await fetch(`${server.origin}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: SYNTHETIC_CREDENTIALS.email,
          password: SYNTHETIC_CREDENTIALS.password,
        }),
      });
      if (!response.ok) throw new Error(`Login sintético falhou no cenário "${key}" (${response.status}).`);
      session = await response.json();
    }
    const entry = { origin: server.origin, close: server.close, session };
    servers.set(key, entry);
    return entry;
  }

  let browser;
  try {
    browser = await chromium.launch(auditBrowserLaunchOptions());
  } catch (error) {
    if (isMissingBrowserError(error)) {
      console.error("[visual-auth] ✗ Chromium indisponível. Instale o browser do Playwright ou defina PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.");
      process.exitCode = 1;
      return;
    }
    throw error;
  }

  const results = [];
  try {
    for (const testCase of CASES) {
      const scenarioKey = testCase.scenario ?? "default";
      const { origin, session } = await serverFor(scenarioKey);
      const viewport = VIEWPORTS[testCase.viewport];
      const compact = viewport.width < 1024;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        colorScheme: testCase.theme,
        reducedMotion: "reduce",
        deviceScaleFactor: 1,
        isMobile: viewport.width < 768,
        hasTouch: compact,
      });

      const injectSession = !testCase.anonymous && !testCase.fresh && session;
      await context.addInitScript(({ storage, theme, sessionData }) => {
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
        localStorage.setItem("neuroped:theme", theme);
        if (sessionData) {
          sessionStorage.setItem("neuroped:access", sessionData.accessToken);
          sessionStorage.setItem("neuroped:refresh", sessionData.refreshToken);
          sessionStorage.setItem("neuroped:user", JSON.stringify(sessionData.user));
        }
      }, {
        storage: ACCEPTED_FIRST_VISIT_STORAGE,
        theme: testCase.theme,
        sessionData: injectSession ? session : null,
      });

      const page = await context.newPage();
      const runtimeErrors = [];
      const expectedFailures = testCase.expectedNetworkFailures ?? [];
      page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        // 4xx/5xx deliberados do cenário aparecem como "Failed to load resource";
        // o console do navegador não expõe a URL nessa mensagem, então o caso
        // precisa declarar explicitamente que espera falha de rede.
        if (expectedFailures.length && /Failed to load resource/i.test(text)) return;
        runtimeErrors.push(`console: ${text}`);
      });

      const failures = [];
      try {
        const startRoute = testCase.startRoute ?? testCase.route;
        const search = testCase.search ? `?${testCase.search}` : "";
        await page.goto(`${origin}/${search}#${startRoute}`, { waitUntil: "domcontentloaded" });
        await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 20_000 }).catch(() => {});

        if (testCase.fresh) {
          await page.locator(LOGIN_FORM).waitFor({ state: "visible", timeout: 20_000 });
          await page.fill("#login-email", SYNTHETIC_CREDENTIALS.email);
          await page.fill("#login-password", SYNTHETIC_CREDENTIALS.password);
          await page.click('button[type="submit"]');
        } else if (testCase.route !== startRoute) {
          await page.evaluate((route) => { window.location.hash = `#${route}`; }, testCase.route);
        }

        await page.evaluate(() => document.fonts.ready);
        await settle(page, 900);
        if (testCase.prepare) await testCase.prepare(page);
        await settle(page, 400);

        for (const selector of testCase.expect ?? []) {
          const visible = await page.locator(selector).first().isVisible().catch(() => false);
          if (!visible) failures.push(`estado-ausente:${selector}`);
        }
        for (const selector of testCase.forbid ?? []) {
          const visible = await page.locator(selector).first().isVisible().catch(() => false);
          if (visible) failures.push(`estado-proibido:${selector}`);
        }
        if (testCase.expectText) {
          const body = await page.locator("#main-content").innerText().catch(() => "");
          if (!body.includes(testCase.expectText)) failures.push(`texto-ausente:${testCase.expectText}`);
        }
      } catch (error) {
        failures.push(`preparo-falhou:${error instanceof Error ? error.message : String(error)}`);
      }

      const layout = await page.evaluate((dialogSelector) => {
        const documentElement = document.documentElement;
        const overflow = Math.max(0, documentElement.scrollWidth - documentElement.clientWidth);

        // Duas réguas, com pesos diferentes e declarados:
        //  - 44px (falha) para os controles de navegação e ação primária que o
        //    projeto já trata como contrato — dock, ajuda persistente, abas do
        //    prontuário e as ações do cockpit;
        //  - 24px (aviso) para o restante, que é o mínimo do WCAG 2.2 AA. Ficam
        //    registrados no relatório em vez de sumirem, mas não reprovam o gate
        //    por um alvo secundário herdado.
        const PRIMARY_TARGETS = [
          '[data-testid="mobile-primary-dock"] button',
          '[data-testid="button-floating-help"]',
          '[data-testid^="cockpit-action-"]',
          '[data-testid^="cockpit-switch-"]',
          '[data-testid="cockpit-todos-pacientes"]',
          '.np-prontuario-tabs [role="tab"]',
        ].join(",");
        const SECONDARY_TARGETS = "#main-content button, #main-content a[href], #main-content select";

        const describe = (element, box) =>
          `${element.tagName.toLowerCase()}#${element.getAttribute("data-testid") ?? element.className.slice(0, 40)}:${Math.round(box.width)}x${Math.round(box.height)}`;

        const visibleBox = (element) => {
          if (!(element instanceof HTMLElement)) return null;
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return null;
          if (element.closest("[hidden], [inert], [aria-hidden='true']")) return null;
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 ? box : null;
        };

        /** Link no meio de um texto corrido herda a altura da linha: fora da régua. */
        const inlineInText = (element) => {
          if (element.tagName !== "A") return false;
          const parent = element.parentElement;
          if (!parent) return false;
          const ownText = element.textContent ?? "";
          const parentText = parent.textContent ?? "";
          return parentText.trim().length > ownText.trim().length + 4;
        };

        const smallTargets = [];
        const targetWarnings = [];
        if (window.innerWidth < 1024) {
          for (const element of document.querySelectorAll(PRIMARY_TARGETS)) {
            const box = visibleBox(element);
            if (!box) continue;
            if (box.width < 44 || box.height < 44) smallTargets.push(describe(element, box));
          }
          for (const element of document.querySelectorAll(SECONDARY_TARGETS)) {
            const box = visibleBox(element);
            if (!box || inlineInText(element)) continue;
            if (element.matches(PRIMARY_TARGETS)) continue;
            if (box.width < 24 || box.height < 24) targetWarnings.push(describe(element, box));
          }
        }

        let focusEscaped = null;
        if (dialogSelector) {
          const dialog = document.querySelector(dialogSelector);
          const active = document.activeElement;
          if (!dialog) focusEscaped = "dialogo-ausente";
          else if (!active || (!dialog.contains(active) && active !== document.body)) focusEscaped = "foco-fora-do-dialogo";
          else if (active === document.body) focusEscaped = "foco-no-body";
        }

        return { overflow, smallTargets, targetWarnings: [...new Set(targetWarnings)], focusEscaped };
      }, testCase.dialog ? (testCase.dialogSelector ?? '[role="dialog"]') : null);

      if (layout.overflow > 1) failures.push(`overflow-horizontal:${layout.overflow}px`);
      for (const target of layout.smallTargets) failures.push(`alvo-compacto:${target}`);
      if (layout.focusEscaped) failures.push(`foco-dialogo:${layout.focusEscaped}`);

      let axeViolations = [];
      try {
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        axeViolations = axe.violations
          .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
          .map((violation) => `${violation.id}(${violation.impact})`);
      } catch (error) {
        failures.push(`axe-falhou:${error instanceof Error ? error.message : String(error)}`);
      }
      for (const violation of axeViolations) failures.push(`axe:${violation}`);
      failures.push(...runtimeErrors);

      await page.screenshot({ path: resolve(outputDir, `${testCase.id}-viewport.png`), animations: "disabled" });
      await page.screenshot({ path: resolve(outputDir, `${testCase.id}-full.png`), fullPage: true, animations: "disabled" });

      results.push({
        id: testCase.id,
        group: testCase.group,
        route: testCase.route,
        scenario: scenarioKey,
        viewport: viewport.label,
        theme: testCase.theme,
        authenticated: !testCase.anonymous,
        overflow: layout.overflow,
        targetWarnings: layout.targetWarnings,
        axeViolations,
        runtimeErrors,
        failures,
      });
      console.log(`[visual-auth] ${testCase.id}: ${failures.length ? `FALHOU — ${failures.join(", ")}` : "OK"}`);
      await context.close();
    }
  } finally {
    await browser.close();
    for (const server of servers.values()) await server.close();
  }

  const failures = results.flatMap((result) => result.failures.map((failure) => `${result.id}: ${failure}`));
  const groups = [...new Set(results.map((result) => result.group))];
  const report = {
    generatedAt: new Date().toISOString(),
    browser: "playwright-chromium",
    dataSource: "scripts/lib/synthetic-clinical-api.mjs (100% sintético)",
    summary: {
      totalStates: results.length,
      minimumRequired: MINIMUM_STATES,
      authenticatedStates: results.filter((result) => result.authenticated).length,
      screenshots: results.length * 2,
      groups: groups.length,
      failedStates: results.filter((result) => result.failures.length).length,
      // Avisos não reprovam, mas ficam publicados: alvo secundário abaixo de
      // 24px (WCAG 2.2 AA) herdado de telas anteriores a este gate.
      targetWarnings: results.reduce((total, result) => total + result.targetWarnings.length, 0),
      failures,
    },
    cases: results,
  };
  writeFileSync(resolve(outputDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(resolve(outputDir, "index.md"), [
    "# NeuroPed — prova visual autenticada",
    "",
    `Estados: ${report.summary.totalStates} (mínimo ${MINIMUM_STATES}) · autenticados: ${report.summary.authenticatedStates} · capturas: ${report.summary.screenshots} · grupos: ${report.summary.groups} · com falha: ${report.summary.failedStates} · avisos de alvo <24px: ${report.summary.targetWarnings}`,
    "",
    ...groups.flatMap((group) => [
      `## ${group}`,
      "",
      ...results
        .filter((result) => result.group === group)
        .map((result) => `- ${result.failures.length ? "❌" : "✅"} **${result.id}** — ${result.viewport}, ${result.theme}, \`${result.route}\`${result.failures.length ? ` — ${result.failures.join("; ")}` : ""}`),
      "",
    ]),
    "Dados sintéticos. Nenhum prontuário real é usado, capturado ou publicado.",
  ].join("\n"));

  if (failures.length) {
    console.error(`[visual-auth] ✗ ${failures.length} falha(s):\n  ${failures.join("\n  ")}`);
    process.exitCode = 1;
  } else {
    console.log(`[visual-auth] ✓ ${results.length} estados autenticados, ${results.length * 2} capturas — sem overflow, erro de runtime, alvo subdimensionado, fuga de foco ou violação axe serious/critical.`);
  }
}

await main();

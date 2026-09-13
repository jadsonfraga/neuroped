// @ts-check
/**
 * audit-surface-contrast.mjs — contraste medido em pixels reais.
 *
 * Por que este gate existe: em 06/09/2026 a camada Brand Signature pintou a
 * sidebar de azul-marinho com `!important` sem inverter a tinta. Toda a
 * navegação do modo claro ficou com texto quase invisível — e nenhum gate viu.
 * O axe não reprova esse caso: quando o fundo é gradiente ou imagem ele não
 * consegue resolver a cor e devolve o nó como `incomplete`, que não entra em
 * `violations`. O gate de a11y passava com zero violações sobre uma sidebar
 * ilegível.
 *
 * Este gate não deduz o fundo do CSS: ele apaga o texto da superfície, fotografa
 * o que sobrou e lê o pixel exatamente sob cada linha de texto. Gradiente,
 * imagem, translucidez e sobreposição entram na conta porque a medida é feita
 * no que o navegador realmente pintou.
 *
 * Contrato: WCAG 2.1 AA — 4.5:1 para texto normal, 3:1 para texto grande
 * (>=24px, ou >=18.66px em negrito).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  auditBrowserLaunchOptions,
  ensureClientBuild,
  isMissingBrowserError,
  startStaticServer,
} from "../lib/browser-audit-runtime.mjs";
import {
  createSyntheticClinicalApi,
  SYNTHETIC_CREDENTIALS,
} from "../lib/synthetic-clinical-api.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");

/**
 * Superfícies auditadas. São as que recebem tinta de marca por cima de tokens
 * de tema — precisamente onde fundo e texto podem divergir sem ninguém notar.
 */
const CASES = [
  { id: "sidebar-desktop-light", route: "/", width: 1440, height: 1000, theme: "light", surface: ".np-app-sidebar" },
  { id: "sidebar-desktop-dark", route: "/", width: 1440, height: 1000, theme: "dark", surface: ".np-app-sidebar" },
  { id: "mobile-header-light", route: "/", width: 390, height: 844, theme: "light", surface: ".np-app-mobile-header" },
  { id: "mobile-header-dark", route: "/", width: 390, height: 844, theme: "dark", surface: ".np-app-mobile-header" },
  { id: "home-hero-light", route: "/", width: 1440, height: 1000, theme: "light", surface: ".np-home-hero" },
  { id: "home-hero-dark", route: "/", width: 1440, height: 1000, theme: "dark", surface: ".np-home-hero" },
  { id: "especialidades-light", route: "/#/especialidades", width: 1440, height: 2200, theme: "light", surface: '[data-testid="especialidades-premium-surface"]' },
  { id: "especialidades-dark", route: "/#/especialidades", width: 1440, height: 2200, theme: "dark", surface: '[data-testid="especialidades-premium-surface"]' },
  // Ficha canônica de instrumento (/generic-scale/:id sem itens interativos).
  // Em 09/2026 ela ainda usava paleta escura hardcoded (slate-*) e ficou
  // ilegível quando o tema claro repintou os cards — este par de casos trava
  // a superfície nos dois temas. Usa uma ficha externa (portage) que renderiza
  // sem exigir sessão sintética.
  { id: "ficha-instrumento-light", route: "/#/generic-scale/portage", width: 1440, height: 2400, theme: "light", surface: '[data-testid="scale-ficha-surface"]', auth: true },
  { id: "ficha-instrumento-dark", route: "/#/generic-scale/portage", width: 1440, height: 2400, theme: "dark", surface: '[data-testid="scale-ficha-surface"]', auth: true },
  // Ficha de licença LIVRE: exercita o ramo emerald do badge de licença (que
  // já esteve ilegível no tema claro com text-emerald-200) e o card de
  // registro autoral interno, suprimido nas fichas external_only acima.
  { id: "ficha-livre-light", route: "/#/generic-scale/pedmidas", width: 1440, height: 2400, theme: "light", surface: '[data-testid="scale-ficha-surface"]', auth: true },
  { id: "ficha-livre-dark", route: "/#/generic-scale/pedmidas", width: 1440, height: 2400, theme: "dark", surface: '[data-testid="scale-ficha-surface"]', auth: true },
];

const NORMAL_MIN = 4.5;
const LARGE_MIN = 3;

/** Canal sRGB linearizado, conforme WCAG 2.1. */
function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

/** Compõe uma cor com alfa sobre o fundo já medido. */
function flatten([r, g, b, alpha], background) {
  if (alpha >= 1) return [r, g, b];
  return [0, 1, 2].map((index) => Math.round(alpha * [r, g, b][index] + (1 - alpha) * background[index]));
}

function parseColor(value) {
  const match = /rgba?\(([^)]+)\)/.exec(value);
  if (!match) return null;
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return null;
  return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
}

// Dois servidores sobre o mesmo build: o anônimo (sem API) preserva o
// comportamento offline/local dos casos públicos; o sintético serve os casos
// `auth: true` (rotas atrás do gate) com uma sessão real do login sintético.
const dist = ensureClientBuild(repoRoot);
const server = await startStaticServer(dist);
const authServer = await startStaticServer(dist, {
  port: 4321,
  apiHandler: createSyntheticClinicalApi({}),
});
const loginResponse = await fetch(`${authServer.origin}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: SYNTHETIC_CREDENTIALS.email,
    password: SYNTHETIC_CREDENTIALS.password,
  }),
});
if (!loginResponse.ok) {
  await server.close();
  await authServer.close();
  throw new Error(`login sintético falhou (${loginResponse.status})`);
}
const syntheticSession = await loginResponse.json();
let browser;
try {
  browser = await chromium.launch(auditBrowserLaunchOptions());
} catch (error) {
  await server.close();
  await authServer.close();
  if (isMissingBrowserError(error)) {
    console.log("[contraste] Chromium indisponível — gate ignorado nesta máquina.");
    process.exit(0);
  }
  throw error;
}

const failures = [];
const report = [];

try {
  for (const testCase of CASES) {
    const context = await browser.newContext({
      viewport: { width: testCase.width, height: testCase.height },
      colorScheme: testCase.theme,
      reducedMotion: "reduce",
      deviceScaleFactor: 1,
      isMobile: testCase.width < 768,
      hasTouch: testCase.width < 1024,
    });
    await context.addInitScript(({ storage, theme, session }) => {
      for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
      localStorage.setItem("neuroped:theme", theme);
      if (session) {
        sessionStorage.setItem("neuroped:access", session.accessToken);
        sessionStorage.setItem("neuroped:refresh", session.refreshToken);
        sessionStorage.setItem("neuroped:user", JSON.stringify(session.user));
      }
    }, {
      storage: ACCEPTED_FIRST_VISIT_STORAGE,
      theme: testCase.theme,
      session: testCase.auth ? syntheticSession : null,
    });

    const page = await context.newPage();
    await page.goto(`${(testCase.auth ? authServer : server).origin}${testCase.route}`, { waitUntil: "networkidle" });
    await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(600);

    // Cada linha de texto visível da superfície, com a caixa exata do texto
    // (Range sobre o nó de texto, não a caixa do elemento: um rótulo curto num
    // bloco largo seria medido sobre pixels onde texto nenhum é pintado).
    const samples = await page.evaluate((surfaceSelector) => {
      const surface = document.querySelector(surfaceSelector);
      if (!surface) return null;
      const surfaceRect = surface.getBoundingClientRect();
      if (surfaceRect.width < 1 || surfaceRect.height < 1) return [];
      const found = [];
      const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const text = node.nodeValue?.trim() ?? "";
        if (!text) continue;
        const element = node.parentElement;
        if (!element) continue;
        const style = getComputedStyle(element);
        if (style.visibility === "hidden" || style.display === "none") continue;
        if (Number(style.opacity) === 0) continue;
        // Texto só para leitor de tela não é pintado — não tem contraste a medir.
        if (element.closest(".sr-only, [aria-hidden='true']")) continue;
        // WCAG 1.4.3 isenta componentes INATIVOS de mínimo de contraste; medir
        // texto de controle desabilitado geraria reprovação sistêmica falsa.
        if (element.closest("[disabled], [aria-disabled='true']")) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        if (rect.bottom < surfaceRect.top || rect.top > surfaceRect.bottom) continue;
        if (rect.right < surfaceRect.left || rect.left > surfaceRect.right) continue;
        const fontSize = Number.parseFloat(style.fontSize);
        const weight = Number.parseInt(style.fontWeight, 10) || 400;
        found.push({
          text: text.slice(0, 40),
          color: style.color,
          fontSize,
          large: fontSize >= 24 || (fontSize >= 18.66 && weight >= 700),
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        });
      }
      return found;
    }, testCase.surface);

    if (samples === null) {
      failures.push(`${testCase.id}: superfície ${testCase.surface} não existe nesta viewport`);
      await context.close();
      continue;
    }

    // Apaga apenas a tinta do texto: o fundo real (gradiente, foto, vidro)
    // continua pintado, então o pixel sob a linha é o fundo verdadeiro.
    await page.addStyleTag({
      content: `${testCase.surface}, ${testCase.surface} * {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        text-shadow: none !important;
      }
      ${testCase.surface} svg, ${testCase.surface} img { visibility: hidden !important; }`,
    });
    await page.waitForTimeout(150);
    const background = PNG.sync.read(await page.screenshot({ type: "png" }));

    for (const sample of samples) {
      if (sample.x < 0 || sample.y < 0 || sample.x >= background.width || sample.y >= background.height) continue;
      const offset = (background.width * sample.y + sample.x) << 2;
      const backdrop = [background.data[offset], background.data[offset + 1], background.data[offset + 2]];
      const parsed = parseColor(sample.color);
      if (!parsed) continue;
      if (parsed[3] === 0) continue;
      const ink = flatten(parsed, backdrop);
      const ratio = contrast(ink, backdrop);
      const minimum = sample.large ? LARGE_MIN : NORMAL_MIN;
      const row = {
        case: testCase.id,
        text: sample.text,
        ratio: Number(ratio.toFixed(2)),
        minimum,
        ink: `rgb(${ink.join(" ")})`,
        backdrop: `rgb(${backdrop.join(" ")})`,
      };
      report.push(row);
      if (ratio < minimum) {
        failures.push(
          `${testCase.id}: "${sample.text}" ${ratio.toFixed(2)}:1 (mínimo ${minimum}:1) — tinta ${row.ink} sobre ${row.backdrop}`,
        );
      }
    }

    const worst = report.filter((row) => row.case === testCase.id).reduce(
      (accumulator, row) => (accumulator === null || row.ratio < accumulator.ratio ? row : accumulator),
      /** @type {null | typeof report[number]} */ (null),
    );
    console.log(
      `[contraste] ${testCase.id}: ${samples.length} linha(s)` +
        (worst ? ` | pior ${worst.ratio}:1 ("${worst.text}")` : " | nenhuma linha de texto"),
    );
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
  await authServer.close();
}

mkdirSync(resolve(repoRoot, "artifacts"), { recursive: true });
writeFileSync(
  resolve(repoRoot, "artifacts/surface-contrast.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), failures, report }, null, 2)}\n`,
);

if (failures.length > 0) {
  console.error(`[contraste] ✗ ${failures.length} linha(s) de texto abaixo do mínimo WCAG AA:`);
  for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`);
  if (failures.length > 40) console.error(`  … e mais ${failures.length - 40}.`);
  process.exit(1);
}
console.log(`[contraste] ✓ ${report.length} linha(s) de texto medidas em pixel real, todas em conformidade AA.`);

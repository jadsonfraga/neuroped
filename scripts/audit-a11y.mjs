// @ts-check
/** Gate híbrido de acessibilidade: axe real quando Chromium existe; lint estático caso contrário. */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import {
  ACCEPTED_FIRST_VISIT_STORAGE,
  ensureClientBuild,
  isMissingBrowserError,
  startStaticServer,
} from "./lib/browser-audit-runtime.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const reportPath = resolve(__dirname, "guards/a11y-report.json");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));
const MAX = typeof baseline.axeSeriousCriticalViolations === "number" ? baseline.axeSeriousCriticalViolations : 0;
const ROUTES = ["/", "/#/filtro", "/#/mchat", "/#/cars", "/#/espasticidade", "/#/caa", "/#/prontuario"];

function reportAndExit(violations, mode, details = {}) {
  writeFileSync(reportPath, JSON.stringify({ mode, total: violations.length, violations, ...details }, null, 2));
  console.log(`[a11y] modo=${mode} | violações serious/critical=${violations.length} (teto ${MAX})`);
  if (violations.length > MAX) {
    for (const violation of violations.slice(0, 50)) console.error(`  ✗ ${violation.id} - ${violation.where}`);
    process.exitCode = 1;
  } else {
    console.log("[a11y] ✓ sem violações serious/critical acima do teto.");
  }
}

async function runAxe() {
  const server = await startStaticServer(ensureClientBuild(repoRoot));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    await server.close();
    if (isMissingBrowserError(error)) return false;
    throw error;
  }

  const all = [];
  const routeSummary = {};
  try {
    for (const route of ROUTES) {
      const context = await browser.newContext({ reducedMotion: "reduce" });
      await context.addInitScript((values) => {
        for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      }, ACCEPTED_FIRST_VISIT_STORAGE);
      const page = await context.newPage();
      await page.goto(`${server.origin}${route}`, { waitUntil: "networkidle" });
      await page.getByTestId("splash-screen").waitFor({ state: "detached", timeout: 10_000 });
      const results = await new AxeBuilder({ page }).analyze();
      const relevant = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
      routeSummary[route] = {
        total: results.violations.length,
        seriousCritical: relevant.length,
        violations: results.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          targets: violation.nodes.flatMap((node) => node.target).slice(0, 10),
        })),
      };
      for (const violation of relevant) {
        all.push({
          id: violation.id,
          impact: violation.impact,
          where: `${route} (${violation.nodes.length} nós)`,
          targets: violation.nodes.flatMap((node) => node.target).slice(0, 10),
          help: violation.help,
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }
  reportAndExit(all, "axe-playwright", { routes: routeSummary });
  return true;
}

function runStatic() {
  const src = resolve(repoRoot, "client/src");
  const walk = (directory) => readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : extname(name) === ".tsx" ? [path] : [];
  });
  const violations = [];
  const indexHtml = resolve(repoRoot, "client/index.html");
  if (existsSync(indexHtml)) {
    const html = readFileSync(indexHtml, "utf8");
    if (!/<html\b[^>]*\blang\s*=/.test(html)) violations.push({ id: "html-has-lang", where: "client/index.html" });
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0*)?\b/.test(html)) violations.push({ id: "meta-viewport", where: "client/index.html" });
  }
  const hasName = (attributes) => /aria-label|aria-labelledby|title=/.test(attributes);
  // Nome acessível de campo: rótulo programático (aria/label htmlFor via id)
  // ou, na heurística estática, placeholder — melhor que falso positivo em
  // massa; o axe real cobre o resto quando o Chromium está disponível.
  // Elementos que recebem atributos via spread ({...props}) são primitivos de
  // UI cujo nome chega pelo chamador — fora do alcance do lint estático.
  const hasFieldName = (attributes) => hasName(attributes) || /\bid\s*=|placeholder\s*=|\{\s*\.\.\./.test(attributes);
  for (const file of walk(src)) {
    // Comentários (// e /* */) podem citar tags de exemplo — não são JSX real.
    const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/[^\n]*/g, "$1");
    const relative = file.slice(repoRoot.length + 1).replaceAll("\\", "/");
    for (const match of source.matchAll(/<img\b[^>]*>/g)) if (!/\balt\s*=/.test(match[0])) violations.push({ id: "image-alt", where: relative });
    for (const match of source.matchAll(/<button\b([^>]*)>\s*(<[A-Z][A-Za-z0-9]*\b[^>]*\/>)\s*<\/button>/g)) if (!hasName(match[1])) violations.push({ id: "button-name", where: relative });
    for (const match of source.matchAll(/<Label\b[^>]*\baria-pressed\s*=/g)) violations.push({ id: "aria-allowed-attr", where: `${relative} (<Label aria-pressed>)` });
    for (const match of source.matchAll(/<a\b([^>]*)>\s*(<[A-Z][A-Za-z0-9]*\b[^>]*\/>)\s*<\/a>/g)) if (!hasName(match[1])) violations.push({ id: "link-name", where: relative });
    for (const match of source.matchAll(/<input\b((?:=>|[^>])*?)\/?>/g)) if (!/type\s*=\s*["']hidden["']/.test(match[1]) && !hasFieldName(match[1])) violations.push({ id: "input-name", where: relative });
    for (const match of source.matchAll(/<select\b((?:=>|[^>])*?)>/g)) if (!hasFieldName(match[1])) violations.push({ id: "select-name", where: relative });
    for (const match of source.matchAll(/<textarea\b((?:=>|[^>])*?)\/?>/g)) if (!hasFieldName(match[1])) violations.push({ id: "textarea-name", where: relative });
    for (const match of source.matchAll(/<iframe\b((?:=>|[^>])*?)\/?>/g)) if (!/\btitle\s*=/.test(match[1])) violations.push({ id: "iframe-title", where: relative });
    for (const match of source.matchAll(/<area\b((?:=>|[^>])*?)\/?>/g)) if (!/\balt\s*=/.test(match[1])) violations.push({ id: "area-alt", where: relative });
    for (const match of source.matchAll(/tabIndex\s*=\s*\{?\s*([1-9][0-9]*)\s*\}?/g)) violations.push({ id: "tabindex-positive", where: `${relative} (tabIndex=${match[1]})` });
    // id literal duplicado no mesmo arquivo (axe: duplicate-id) — leitores de
    // tela e label htmlFor quebram silenciosamente com ids repetidos.
    const idCounts = new Map();
    for (const match of source.matchAll(/\bid\s*=\s*"([^"{}]+)"/g)) idCounts.set(match[1], (idCounts.get(match[1]) ?? 0) + 1);
    for (const [idValue, count] of idCounts) if (count > 1) violations.push({ id: "duplicate-id", where: `${relative} (id="${idValue}" ×${count})` });
    // controle interativo escondido de leitores mas focável pelo teclado
    for (const match of source.matchAll(/<(button|a|input|select|textarea)\b(?:=>|[^>])*?aria-hidden\s*=\s*(?:"true"|\{true\})/g)) violations.push({ id: "aria-hidden-focus", where: `${relative} (<${match[1]}>)` });
    // alt que é apenas nome de arquivo não descreve a imagem
    for (const match of source.matchAll(/alt\s*=\s*["'][^"']*\.(?:png|jpe?g|svg|gif|webp)["']/gi)) violations.push({ id: "image-alt-filename", where: relative });
  }
  reportAndExit(violations, "static-lint", { reason: "Chromium não instalado no ambiente" });
}

if (!(await runAxe())) {
  console.log("[a11y] Chromium indisponível - executando lint estático determinístico.");
  runStatic();
}

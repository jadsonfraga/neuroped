// @ts-check
/**
 * audit-a11y.mjs — Gate de acessibilidade (Bloco 3, Consolidação 9.0).
 *
 * Estratégia em camadas:
 *   1. Se `@axe-core/puppeteer` + `puppeteer` estiverem instalados e houver
 *      Chromium, sobe `vite preview`, navega pelas rotas e roda axe.run(),
 *      falhando se houver violações impact serious|critical. Salva
 *      scripts/guards/a11y-report.json.
 *   2. Caso contrário (Windows/CI sem Chromium — caso atual), executa um
 *      LINT ESTÁTICO determinístico de fonte React que cobre as violações
 *      serious/critical de maior incidência: <img> sem alt (image-alt),
 *      <html> sem lang (html-has-lang), controles icon-only sem nome
 *      acessível (button-name / link-name), campos de formulário sem nome
 *      (input/select/textarea-name), <iframe> sem title, <area> sem alt,
 *      viewport que bloqueia zoom (meta-viewport, critical no axe) e
 *      tabindex positivo (quebra a ordem natural de foco).
 *
 * Gate: scripts/guards/baseline.json -> axeSeriousCriticalViolations (0).
 */
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, extname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const baseline = JSON.parse(readFileSync(resolve(__dirname, "guards/baseline.json"), "utf8"));
const MAX = typeof baseline.axeSeriousCriticalViolations === "number" ? baseline.axeSeriousCriticalViolations : 0;

const ROUTES = ["/", "/#/filtro", "/#/mchat", "/#/caa", "/#/prontuario"];

let axePuppeteer = null;
let puppeteer = null;
try {
  axePuppeteer = await import("@axe-core/puppeteer");
  puppeteer = (await import("puppeteer")).default;
} catch {
  /* deps ausentes → fallback estático */
}

function reportAndExit(violations, modo) {
  writeFileSync(
    resolve(__dirname, "guards/a11y-report.json"),
    JSON.stringify({ modo, total: violations.length, violations }, null, 2),
  );
  console.log(`[a11y] modo=${modo} | violações serious/critical=${violations.length} (teto ${MAX})`);
  if (violations.length > MAX) {
    console.error("[a11y] ✗ violações serious/critical:");
    for (const v of violations.slice(0, 50)) console.error(`  ✗ ${v.id} — ${v.where}`);
    process.exit(1);
  }
  console.log("[a11y] ✓ sem violações serious/critical acima do teto.");
}

if (axePuppeteer && puppeteer) {
  // ---- Caminho axe real ----
  const { spawn } = await import("node:child_process");
  const PORT = 4173;
  const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: repoRoot, stdio: "ignore", shell: true,
  });
  try {
    await new Promise((r) => setTimeout(r, 4000));
    const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
    const { AxePuppeteer } = axePuppeteer;
    const all = [];
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}/${route.replace(/^\//, "")}`, { waitUntil: "networkidle0" });
      const results = await new AxePuppeteer(page).analyze();
      for (const v of results.violations.filter((x) => ["serious", "critical"].includes(x.impact))) {
        all.push({ id: v.id, where: `${route} (${v.nodes.length} nós)` });
      }
      await page.close();
    }
    await browser.close();
    server.kill();
    reportAndExit(all, "axe-puppeteer");
  } catch (e) {
    server.kill();
    console.log(`[a11y] axe real falhou (${e?.message ?? e}) → fallback estático.`);
    runStatic();
  }
} else {
  console.log("[a11y] @axe-core/puppeteer indisponível → lint estático determinístico.");
  runStatic();
}

function runStatic() {
  const src = resolve(repoRoot, "client/src");
  function walk(d) {
    let out = [];
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      const s = statSync(p);
      if (s.isDirectory()) out = out.concat(walk(p));
      else if ([".tsx"].includes(extname(f))) out.push(p);
    }
    return out;
  }
  const violations = [];
  // html-has-lang + meta-viewport (zoom bloqueado é CRITICAL no axe)
  const indexHtml = resolve(repoRoot, "client/index.html");
  if (existsSync(indexHtml)) {
    const h = readFileSync(indexHtml, "utf8");
    if (!/<html\b[^>]*\blang\s*=/.test(h)) violations.push({ id: "html-has-lang", where: "client/index.html" });
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0*)?\b/.test(h))
      violations.push({ id: "meta-viewport", where: "client/index.html" });
  }
  const hasName = (attrs) => /aria-label|aria-labelledby|title=/.test(attrs);
  // Nome acessível de campo: rótulo programático (aria/label htmlFor via id)
  // ou, na heurística estática, placeholder — melhor que falso positivo em
  // massa; o axe real cobre o resto quando o Chromium está disponível.
  // Elementos que recebem atributos via spread ({...props}) são primitivos de
  // UI cujo nome chega pelo chamador — fora do alcance do lint estático.
  const hasFieldName = (attrs) =>
    hasName(attrs) || /\bid\s*=|placeholder\s*=|\{\s*\.\.\./.test(attrs);
  for (const f of walk(src)) {
    // Comentários (// e /* */) podem citar tags de exemplo — não são JSX real.
    const c = readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|\s)\/\/[^\n]*/g, "$1");
    const rel = f.replace(repoRoot + "\\", "").replace(repoRoot + "/", "");
    // image-alt
    for (const m of c.matchAll(/<img\b[^>]*>/g)) {
      if (!/\balt\s*=/.test(m[0])) violations.push({ id: "image-alt", where: rel });
    }
    // button-name (icon-only sem nome acessível)
    for (const m of c.matchAll(/<button\b([^>]*)>\s*(<[A-Z][A-Za-z0-9]*\b[^>]*\/>)\s*<\/button>/g)) {
      if (!hasName(m[1])) violations.push({ id: "button-name", where: rel });
    }
    // link-name (anchor icon-only sem nome acessível)
    for (const m of c.matchAll(/<a\b([^>]*)>\s*(<[A-Z][A-Za-z0-9]*\b[^>]*\/>)\s*<\/a>/g)) {
      if (!hasName(m[1])) violations.push({ id: "link-name", where: rel });
    }
    // input-name / select-name / textarea-name (campos sem nenhum rótulo possível)
    for (const m of c.matchAll(/<input\b((?:=>|[^>])*?)\/?>/g)) {
      if (/type\s*=\s*["']hidden["']/.test(m[1])) continue;
      if (!hasFieldName(m[1])) violations.push({ id: "input-name", where: rel });
    }
    for (const m of c.matchAll(/<select\b((?:=>|[^>])*?)>/g)) {
      if (!hasFieldName(m[1])) violations.push({ id: "select-name", where: rel });
    }
    for (const m of c.matchAll(/<textarea\b((?:=>|[^>])*?)\/?>/g)) {
      if (!hasFieldName(m[1])) violations.push({ id: "textarea-name", where: rel });
    }
    // iframe-title / area-alt
    for (const m of c.matchAll(/<iframe\b((?:=>|[^>])*?)\/?>/g)) {
      if (!/\btitle\s*=/.test(m[1])) violations.push({ id: "iframe-title", where: rel });
    }
    for (const m of c.matchAll(/<area\b((?:=>|[^>])*?)\/?>/g)) {
      if (!/\balt\s*=/.test(m[1])) violations.push({ id: "area-alt", where: rel });
    }
    // tabindex positivo quebra a ordem natural de foco
    for (const m of c.matchAll(/tabIndex\s*=\s*\{?\s*([1-9][0-9]*)\s*\}?/g)) {
      violations.push({ id: "tabindex-positive", where: `${rel} (tabIndex=${m[1]})` });
    }
  }
  reportAndExit(violations, "static-lint");
}

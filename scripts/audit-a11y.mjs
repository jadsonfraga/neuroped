#!/usr/bin/env node
/**
 * NeuroPed · audit-a11y.mjs · MP9.0 WS4
 * Roda axe-core contra produção. Reporta violações WCAG 2.1 AA.
 */
import { writeFile } from "node:fs/promises";
const BASE = process.env.NP_BASE || "https://jadsonfraga.github.io/neuroped";
const TARGETS = [
  BASE + "/", BASE + "/filtro-escalas.html", BASE + "/testes-diretos.html",
  BASE + "/escalas-questionarios.html", BASE + "/diarios-clinicos.html"
];
let puppeteer, AxeBuilder;
try {
  puppeteer = (await import("puppeteer")).default;
  AxeBuilder = (await import("@axe-core/puppeteer")).default;
} catch (_) {
  console.error("[audit-a11y] npm i -D puppeteer @axe-core/puppeteer");
  process.exit(2);
}
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox","--disable-setuid-sandbox"] });
const allViolations = [];
for (const url of TARGETS) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  const results = await new AxeBuilder({ page }).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  console.log(`\n== ${url}`);
  console.log(`  ${results.violations.length} violations · ${results.passes.length} passes`);
  results.violations.slice(0, 5).forEach(v => {
    console.log(`  ✗ [${v.impact}] ${v.id}: ${v.help}`);
  });
  allViolations.push({ url, violations: results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
  await page.close();
}
await browser.close();
await writeFile("a11y-report.json", JSON.stringify(allViolations, null, 2));
const total = allViolations.reduce((s,p) => s + p.violations.length, 0);
const critical = allViolations.reduce((s,p) => s + p.violations.filter(v => v.impact === "critical" || v.impact === "serious").length, 0);
console.log(`\nTotal: ${total} violations · ${critical} críticas/sérias`);
if (critical > 0) { console.error("✗ falhas críticas em a11y"); process.exit(1); }
console.log("✓ a11y AA sem críticas");

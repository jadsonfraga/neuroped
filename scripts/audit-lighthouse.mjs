#!/usr/bin/env node
/**
 * NeuroPed · audit-lighthouse.mjs · MP9.0 WS4
 * Roda Lighthouse contra produção. Reporta scores LH + Web Vitals.
 * Exit 1 se algum score < threshold.
 */
import { writeFile } from "node:fs/promises";
const BASE = process.env.NP_BASE || "https://jadsonfraga.github.io/neuroped";
const TARGETS = [
  { url: BASE + "/", name: "home" },
  { url: BASE + "/filtro-escalas.html", name: "filtro" },
  { url: BASE + "/testes-diretos.html", name: "testes" },
  { url: BASE + "/escalas-questionarios.html", name: "escalas" },
  { url: BASE + "/diarios-clinicos.html", name: "diarios" }
];
const THRESHOLDS = { performance: 90, accessibility: 90, "best-practices": 90, seo: 90 };
let chromeLauncher, lighthouse;
try {
  chromeLauncher = await import("chrome-launcher");
  lighthouse = (await import("lighthouse")).default;
} catch (_) {
  console.error("[audit-lighthouse] dependências ausentes. npm i -D chrome-launcher lighthouse");
  process.exit(2);
}
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new","--no-sandbox","--disable-gpu"] });
const results = [];
for (const t of TARGETS) {
  console.log(`\n== ${t.name} (${t.url})`);
  const r = await lighthouse(t.url, { port: chrome.port, output: "json", logLevel: "error",
    onlyCategories: ["performance","accessibility","best-practices","seo"],
    formFactor: "mobile", throttlingMethod: "simulate"
  });
  const cats = r.lhr.categories;
  const audit = {};
  ["performance","accessibility","best-practices","seo"].forEach(k => {
    audit[k] = Math.round(cats[k].score * 100);
    const ok = audit[k] >= (THRESHOLDS[k] || 90);
    console.log(`  ${ok ? "✓" : "✗"} ${k}: ${audit[k]}`);
  });
  const a = r.lhr.audits;
  audit.lcp = a["largest-contentful-paint"]?.numericValue;
  audit.cls = a["cumulative-layout-shift"]?.numericValue;
  audit.tbt = a["total-blocking-time"]?.numericValue;
  console.log(`  LCP ${(audit.lcp/1000).toFixed(2)}s · CLS ${audit.cls?.toFixed(3)} · TBT ${audit.tbt?.toFixed(0)}ms`);
  results.push({ ...t, audit });
}
await chrome.kill();
await writeFile("lighthouse-report.json", JSON.stringify(results, null, 2));
const fails = results.filter(r =>
  Object.entries(THRESHOLDS).some(([k,v]) => (r.audit[k] || 0) < v)
);
if (fails.length) {
  console.error(`\n✗ ${fails.length}/${results.length} pages abaixo do threshold`);
  process.exit(1);
}
console.log(`\n✓ ${results.length}/${results.length} pages ≥ thresholds`);

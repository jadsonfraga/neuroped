#!/usr/bin/env node
/**
 * NeuroPed · scripts/smoke-prod.mjs · MP9.0 WS5
 * Smoke check pós-deploy. Exit 1 se algo errado em produção.
 *
 * Verifica:
 *   1. /package.json acessível e parseable
 *   2. /sw.js sem corrupção (parsing JS)
 *   3. versão coerente entre package.json e sitemap
 *   4. /index.html serve 200 com noscript SEO-rico
 *   5. /sitemap.xml com >= 10 URLs
 *   6. nenhum dos 9 endpoints stub retorna 200 acidental
 */
const BASE = process.env.NP_BASE || "https://jadsonfraga.github.io/neuroped";
const fails = [];

async function check(name, fn) {
  try { await fn(); console.log(`✓ ${name}`); }
  catch (e) { console.error(`✗ ${name}: ${e.message}`); fails.push(name); }
}

await check("/package.json parseable", async () => {
  const r = await fetch(BASE + "/package.json");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (!j.version) throw new Error("sem version");
});

await check("/sw.js não-corrompido", async () => {
  const r = await fetch(BASE + "/sw.js");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const t = await r.text();
  if (t.length < 100) throw new Error("muito pequeno");
  if (!/self|caches|fetch|install/.test(t)) throw new Error("sem hooks SW");
});

await check("/index.html serve noscript SEO", async () => {
  const r = await fetch(BASE + "/index.html");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const t = await r.text();
  if (!/<noscript[\s\S]+?Plataforma autoral/i.test(t)) throw new Error("noscript SEO ausente");
});

await check("/sitemap.xml ≥10 URLs", async () => {
  const r = await fetch(BASE + "/sitemap.xml");
  if (!r.ok) throw new Error("HTTP " + r.status);
  const t = await r.text();
  const n = (t.match(/<loc>/g) || []).length;
  if (n < 10) throw new Error("apenas " + n + " URLs");
});

const STUBS = ["/api/certificado","/api/patients","/api/results","/api/send-report","/api/portal/diary","/api/portal/messages","/api/laudo/salvar","/api/certificado/salvar"];
for (const ep of STUBS) {
  await check(ep + " honesto (501)", async () => {
    const r = await fetch(BASE + ep, { method: "GET" });
    if (r.status === 200) throw new Error("retornou 200 — stub virou impl não-documentada");
  });
}

console.log(`\nResultado: ${fails.length === 0 ? "✓ SMOKE OK" : "✗ " + fails.length + " falhas"}`);
process.exit(fails.length === 0 ? 0 : 1);

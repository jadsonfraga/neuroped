/**
 * platform-term-neutral-static.test.mjs — S23 / LEG-06 / AUTHZ-P2-19
 * (docs/audits/SAAS_TENANCY_AUDIT_2026-09-26.md).
 *
 * O termo de uso da PLATAFORMA, validado byte a byte pelo servidor e aceito
 * por todo usuário de toda clínica, declarava que a ferramenta era "do Dr.
 * Jadson Fraga (CRM-PE 25227, RQE 17756)". Todo profissional de uma segunda
 * clínica era obrigado a aceitar um texto que nomeava outra pessoa como
 * responsável.
 *
 * Trava estática:
 *  1) nenhum identificador pessoal do cliente zero em código de servidor
 *     (functions/**, server/**, shared/**) — o backend serve todas as clínicas;
 *  2) API canônica, espelho Express e UI leem o contrato da fonte única
 *     shared/consentContract.ts, e a UI não carrega texto legal literal;
 *  3) a versão vigente não é mais a que nomeava o cliente zero.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const FORBIDDEN_IN_BACKEND = ["Jadson", "CRM-PE 25227", "25227", "RQE 17756"];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      walk(full, out);
    } else if (/\.(ts|mts|mjs|js)$/.test(entry) && !/\.d\.ts$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const backendFiles = ["functions", "server", "shared"].flatMap((dir) =>
  walk(join(root.pathname, dir)),
);
assert.ok(backendFiles.length > 50, "varredura precisa cobrir o backend inteiro");
for (const file of backendFiles) {
  const text = readFileSync(file, "utf8");
  for (const needle of FORBIDDEN_IN_BACKEND) {
    assert.ok(
      !text.includes(needle),
      `identidade pessoal do cliente zero em código de servidor: ${file} contém "${needle}"`,
    );
  }
}

const shared = read("shared/consentContract.ts");
assert.match(shared, /export const CURRENT_CONSENT_VERSION = "2026-09-27-v2"/);
assert.doesNotMatch(shared, /2026-05-08-v1/, "versão que nomeava o cliente zero não pode voltar a ser a vigente");
assert.match(shared, /termo_uso:[\s\S]{0,80}consentText:[\s\S]{0,40}"O NeuroPed é uma plataforma clínica de apoio/);

const api = read("functions/api/consents.ts");
const express = read("server/lib/consentContract.ts");
const ui = read("client/src/pages/lgpd-consent.tsx");
for (const [name, text, importPath] of [
  ["functions/api/consents.ts", api, "../../shared/consentContract"],
  ["server/lib/consentContract.ts", express, "../../shared/consentContract"],
  ["client/src/pages/lgpd-consent.tsx", ui, "@shared/consentContract"],
]) {
  assert.match(text, new RegExp(`from "${importPath.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}"`), `${name} lê o contrato da fonte única`);
  assert.doesNotMatch(text, /consentText:\s*"O NeuroPed/, `${name} não pode carregar texto legal literal próprio`);
  assert.doesNotMatch(text, /CURRENT_CONSENT_VERSION = "/, `${name} não pode declarar versão própria`);
}
assert.match(ui, /text: CANONICAL_CONSENTS\.termo_uso\.consentText/);
assert.match(ui, /const CONSENT_VERSION = CURRENT_CONSENT_VERSION/);

console.log("✓ termo da plataforma é neutro, versionado e lido de fonte única por API, Express e UI (S23/LEG-06)");

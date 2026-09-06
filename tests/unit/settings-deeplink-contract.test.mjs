/**
 * Contrato do link profundo de Configurações (`#/configuracoes?secao=…`).
 *
 * Falha silenciosa que este teste impede: o aviso "Assinatura pendente" leva a
 * Configurações e a página abre em "Perfil". A pessoa clicou pedindo a
 * assinatura e recebeu outra tela — sem erro, sem log, sem ninguém perceber.
 * Basta renomear um id em SECTIONS, ou o href do aviso perder a query, para o
 * comportamento voltar.
 *
 * O segundo bloco é de segurança, não de UX: acrescentar query string a uma
 * rota clínica não pode reclassificá-la como pública.
 *
 * Rodar: node tests/unit/settings-deeplink-contract.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

const settings = read("client/src/pages/configuracoes.tsx");
const switcher = read("client/src/components/ClinicSwitcher.tsx");

// 1) A página lê a seção pedida na URL.
assert.match(
  settings,
  /function initialSectionFromLocation\(\): SectionId/,
  "configuracoes precisa derivar a seção inicial do link",
);
assert.match(
  settings,
  /useState<SectionId>\(initialSectionFromLocation\)/,
  "a seção inicial precisa vir do link, não do default fixo",
);

// 2) Valor desconhecido cai em "perfil": a URL é entrada externa, não comando.
assert.match(
  settings,
  /SECTIONS\.some\(\(entry\) => entry\.id === requested\)/,
  "a seção pedida precisa ser validada contra SECTIONS antes de ser usada",
);

// 3) O aviso de assinatura aponta para a aba de assinatura.
const sectionIds = [...settings.matchAll(/\{ id: "([a-z]+)", label:/g)].map(
  (match) => match[1],
);
assert.ok(sectionIds.includes("plano"), "a seção 'plano' sumiu de SECTIONS");
assert.match(
  switcher,
  /href="#\/configuracoes\?secao=plano"/,
  "o aviso de assinatura precisa levar direto à aba Plano",
);

// 4) Segurança: query string não reclassifica rota clínica como pública.
const { isPublicRoute, normalizePath } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/lib/publicRoutes.ts")).href
);
assert.equal(normalizePath("/configuracoes?secao=plano"), "/configuracoes");
assert.equal(
  isPublicRoute("/configuracoes?secao=plano"),
  false,
  "Configurações com query string continuaria clínica — nunca pública",
);

console.log(
  "✅ link profundo de Configurações: seção validada contra SECTIONS, aviso de assinatura chega na aba Plano e query string não abre rota clínica.",
);

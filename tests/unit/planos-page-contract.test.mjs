/**
 * Contrato da página comercial pública (/planos).
 *
 * O que está sendo protegido: a página que um desconhecido usa para decidir se
 * compra. Dois modos de ela mentir sem ninguém perceber:
 *
 * 1. Preço escrito à mão. No dia em que o plano mudar, `shared/billing.ts` e o
 *    checkout mudam juntos — e a vitrine continua anunciando o valor antigo.
 *    Só o domínio pode ser fonte do preço.
 * 2. A rota deixar de ser pública. Se /planos cair atrás do gate, o funil
 *    comercial volta a começar em /cadastro, que já pede senha de quem ainda
 *    não sabe o que está comprando.
 *
 * Rodar: node tests/unit/planos-page-contract.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

const page = read("client/src/pages/planos.tsx");
const billing = read("shared/billing.ts");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const publicSplitGuard = read("scripts/guards/validate-public-split.mjs");
const app = read("client/src/App.tsx");

// 1) O preço vem do domínio.
assert.match(
  page,
  /import\s*\{[^}]*CANONICAL_PRICE_CENTS[^}]*\}\s*from\s*"@shared\/billing"/s,
  "a página de planos precisa importar o preço canônico de @shared/billing",
);
assert.match(
  page,
  /CANONICAL_PRICE_CENTS\s*\/\s*100/,
  "o valor exibido precisa ser derivado de CANONICAL_PRICE_CENTS, não escrito à mão",
);

// 2) Nenhum preço literal na vitrine. Procuramos a forma como um preço em real
//    apareceria escrito (R$ 99, 99,00, 9900) fora de comentário.
const priceCents = Number(
  /export const CANONICAL_PRICE_CENTS\s*=\s*(\d+)/.exec(billing)?.[1],
);
assert.ok(Number.isInteger(priceCents) && priceCents > 0, "CANONICAL_PRICE_CENTS ilegível");
const reais = String(Math.trunc(priceCents / 100));

const codeOnly = page
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
for (const literal of [
  new RegExp(`R\\$\\s*${reais}\\b`),
  new RegExp(`\\b${reais},\\d{2}\\b`),
  new RegExp(`\\b${priceCents}\\b`),
]) {
  assert.doesNotMatch(
    codeOnly,
    literal,
    `preço literal (${literal}) na página — o único preço válido é o derivado do domínio`,
  );
}

// 3) A rota é pública nos três lugares que decidem isso.
assert.match(publicRoutes, /"\/planos"/, "/planos precisa estar em PUBLIC_ROUTES");
assert.match(
  publicSplitGuard,
  /"\/planos"/,
  "/planos precisa estar em MUST_BE_PUBLIC do guard de split público",
);
assert.match(
  app,
  /<Route path="\/planos" component=\{PlanosPage\} \/>/,
  "/planos precisa estar registrada no roteador",
);

// 4) A página leva a algum lugar: sem CTA, é um panfleto.
assert.match(
  page,
  /href="\/cadastro"/,
  "a página de planos precisa oferecer o caminho para criar conta",
);

// 5) Verdade clínica na vitrine: a página não pode prometer diagnóstico.
assert.match(
  page,
  /Não emite diagnóstico/,
  "a vitrine precisa dizer explicitamente que o produto não emite diagnóstico",
);

console.log(
  "✅ /planos: preço derivado do domínio, rota pública nos três registros, CTA presente e sem promessa de diagnóstico.",
);

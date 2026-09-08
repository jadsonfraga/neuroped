/**
 * Contrato da página comercial pública (/planos).
 *
 * A vitrine pública deve refletir o PRODUTO COMERCIAL CANÔNICO, não o billing
 * genérico por assento do SaaS amplo. O piloto é invite_only; o plano anual é
 * gated. Portanto esta página informa e coleta interesse, mas não pode abrir
 * checkout/cadastro self-service por acidente.
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
const commercial = read("shared/commercial.ts");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const publicSplitGuard = read("scripts/guards/validate-public-split.mjs");
const app = read("client/src/App.tsx");

// 1) Preço e escopo vêm do domínio comercial, não do billing por assento.
assert.match(
  page,
  /from\s*"@shared\/commercial"/,
  "a página precisa importar o domínio canônico @shared/commercial",
);
assert.match(page, /INSTITUTIONAL_PILOT_OFFER/, "offer piloto precisa vir do domínio comercial");
assert.match(page, /INSTITUTIONAL_ANNUAL_OFFER/, "offer anual precisa vir do domínio comercial");
assert.doesNotMatch(
  page,
  /CANONICAL_PRICE_CENTS|@shared\/billing/,
  "a vitrine institucional não pode usar o billing genérico por assento como fonte do produto",
);
assert.match(page, /INSTITUTIONAL_PILOT_OFFER\.priceCents\s*\/\s*100/);
assert.match(page, /INSTITUTIONAL_ANNUAL_OFFER\.priceCents\s*\/\s*100/);

// 2) Os preços estão no domínio e a página não os duplica como centavos.
const pilotCents = Number(
  /INSTITUTIONAL_PILOT_OFFER[\s\S]*?priceCents:\s*([\d_]+)/.exec(commercial)?.[1]?.replaceAll("_", ""),
);
const annualCents = Number(
  /INSTITUTIONAL_ANNUAL_OFFER[\s\S]*?priceCents:\s*([\d_]+)/.exec(commercial)?.[1]?.replaceAll("_", ""),
);
assert.equal(pilotCents, 149000, "preço piloto canônico inesperado");
assert.equal(annualCents, 249000, "preço anual canônico inesperado");

const codeOnly = page
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
for (const cents of [pilotCents, annualCents]) {
  assert.doesNotMatch(
    codeOnly,
    new RegExp(`\\b${cents}\\b`),
    "centavos literais na página duplicariam a fonte comercial canônica",
  );
}

// 3) A rota continua pública nos três lugares que decidem isso.
assert.match(publicRoutes, /"\/planos"/, "/planos precisa estar em PUBLIC_ROUTES");
assert.match(publicSplitGuard, /"\/planos"/, "/planos precisa estar em MUST_BE_PUBLIC");
assert.match(app, /<Route path="\/planos" component=\{PlanosPage\} \/>/);

// 4) Piloto invite_only: CTA pode pedir convite, mas NÃO pode abrir cadastro ou checkout.
assert.match(page, /Solicitar convite/);
assert.match(page, /mailto:/, "o piloto fechado precisa de um canal explícito de interesse");
assert.doesNotMatch(
  page,
  /href="\/cadastro"|href="\/billing|Criar conta e avaliar/,
  "o piloto invite_only não pode ser convertido em self-service pela vitrine",
);

// 5) Verdade de produto e fronteira clínica precisam estar visíveis.
assert.match(page, /Não recebe dado identificável de paciente/);
assert.match(page, /Não inclui consulta, parecer de caso, diagnóstico, prescrição ou apoio à decisão clínica/);
assert.match(page, /Não disponível para contratação/);
assert.match(page, /cinco materiais/i);

console.log(
  "✅ /planos alinhado ao SKU institucional: preços canônicos, piloto por convite, anual gated e sem checkout público.",
);

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Trava anti-regressão da vitrine comercial (/planos e /para-clinicas).
//
// Protege quatro invariantes:
//   1. as rotas comerciais continuam registradas (App.tsx, navegação, allowlist
//      pública e contrato independente do guard público);
//   2. o preço exibido vem SEMPRE de shared/billing.ts — nunca hardcoded no
//      cliente, para não divergir do valor cobrado pelo backend;
//   3. a página de planos honra os contratos reais de billing
//      (GET /api/billing/me?scope=finance e POST /api/billing/checkout com
//      clinicId + seats) e degrada graciosamente sem backend;
//   4. as páginas públicas comerciais não importam módulos de dados clínicos.

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8").replace(/\r\n?/g, "\n");

const app = read("client/src/App.tsx");
const navigation = read("client/src/data/navigation.ts");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const publicSplitGuard = read("scripts/guards/validate-public-split.mjs");
const planos = read("client/src/pages/planos.tsx");
const paraClinicas = read("client/src/pages/para-clinicas.tsx");
const sharedBilling = read("shared/billing.ts");

// 1) Rotas registradas de ponta a ponta.
for (const route of ["/planos", "/para-clinicas"]) {
  assert.match(
    app,
    new RegExp(`<Route path="${route}"`),
    `${route} deve continuar registrada no roteador (App.tsx)`,
  );
  assert.match(
    navigation,
    new RegExp(`href: "${route}"`),
    `${route} deve continuar acessível pela navegação`,
  );
  assert.match(
    publicRoutes,
    new RegExp(`"${route}"`),
    `${route} deve constar na allowlist pública exata`,
  );
  assert.match(
    publicSplitGuard,
    new RegExp(`"${route}"`),
    `${route} deve constar no contrato independente do guard público`,
  );
}

// 2) Preço com fonte única em shared/billing.ts.
assert.match(sharedBilling, /export const CANONICAL_PRICE_CENTS = 9900;/);
assert.match(sharedBilling, /export const CANONICAL_TRIAL_DAYS = 14;/);
assert.match(
  planos,
  /import \{ CANONICAL_PRICE_CENTS, CANONICAL_TRIAL_DAYS \} from "@shared\/billing"/,
  "a página de planos deve importar preço/trial do domínio compartilhado",
);
assert.doesNotMatch(
  planos,
  /R\$\s*99|9900|99,00/,
  "o preço não pode ser hardcoded na página de planos",
);
assert.match(
  paraClinicas,
  /CANONICAL_TRIAL_DAYS/,
  "a página B2B deve derivar o período de avaliação do domínio compartilhado",
);

// 3) Contratos de billing honrados + degradação graciosa.
assert.match(planos, /\/api\/billing\/me\?scope=finance/);
assert.match(planos, /apiRequest\("POST", "\/api\/billing\/checkout", \{\s*clinicId: activeClinic\.id,\s*seats,?\s*\}\)/);
assert.match(
  planos,
  /status === 503/,
  "a página de planos deve tratar backend de billing indisponível (503)",
);
assert.match(
  planos,
  /isAuthenticated \?/,
  "a página de planos deve funcionar como vitrine sem sessão",
);
assert.match(
  planos,
  /Math\.min\(500, Math\.max\(1, next\)\)/,
  "os assentos devem respeitar os limites do backend (1..500)",
);

// 4) Zona pública sem dados clínicos.
for (const [name, source] of [
  ["planos", planos],
  ["para-clinicas", paraClinicas],
]) {
  assert.doesNotMatch(
    source,
    /from "@\/data\//,
    `a página pública ${name} não deve importar catálogos/dados clínicos`,
  );
  assert.doesNotMatch(
    source,
    /\/api\/patients|\/api\/results/,
    `a página pública ${name} não deve consultar dados de pacientes`,
  );
}

// 5) Onboarding self-service (/minha-clinica) — rota CLÍNICA, nunca pública.
const minhaClinica = read("client/src/pages/minha-clinica.tsx");
assert.match(
  app,
  /<Route path="\/minha-clinica"/,
  "/minha-clinica deve continuar registrada no roteador",
);
assert.match(
  navigation,
  /href: "\/minha-clinica"/,
  "/minha-clinica deve continuar acessível pela navegação",
);
assert.doesNotMatch(
  publicRoutes,
  /"\/minha-clinica"/,
  "/minha-clinica gerencia o tenant e NUNCA pode entrar na allowlist pública",
);
assert.match(
  minhaClinica,
  /apiRequest\("POST", "\/api\/tenants"/,
  "a criação de clínica deve usar o contrato POST /api/tenants",
);
assert.match(
  minhaClinica,
  /\/api\/billing\/invitations\?clinicId=/,
  "a listagem de convites deve enviar clinicId",
);
assert.match(
  minhaClinica,
  /canManageClinic/,
  "a UI deve reutilizar a regra de gestão do domínio compartilhado (shared/tenant)",
);
assert.match(
  minhaClinica,
  /action: "resend",\s*invitationId/,
  "o reenvio de convite deve honrar o contrato {action: 'resend', invitationId}",
);

console.log("✅ commercial-pages-static: vitrine comercial protegida (rotas, preço único, contratos de billing, onboarding gated e zona pública limpa).");

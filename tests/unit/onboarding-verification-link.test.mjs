/**
 * Contrato do onboarding diante de EMAIL_VERIFICATION_REQUIRED.
 *
 * O backend recusa POST /api/tenants para conta não verificada com uma
 * mensagem que o onboarding exibe — mas mensagem sem caminho é beco: a
 * pessoa lê "confirme seu e-mail" e não sabe onde reenviar o link. O
 * degrau seguinte da jornada é #/verificar-email, e a tela da recusa
 * precisa levá-la até lá, não descrever a existência do lugar.
 *
 * Rodar: node tests/unit/onboarding-verification-link.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (relative) => readFileSync(join(repoRoot, relative), "utf8");

const page = read("client/src/pages/onboarding.tsx");
const tenants = read("functions/api/tenants/index.ts");

// O código do backend é o contrato: se ele mudar de nome, este teste quebra
// junto, em vez de o onboarding comparar contra uma string órfã.
assert.ok(
  tenants.includes('"EMAIL_VERIFICATION_REQUIRED"'),
  "o gate de verificação precisa continuar respondendo o código nomeado",
);
assert.ok(
  page.includes('"EMAIL_VERIFICATION_REQUIRED"'),
  "o onboarding precisa reconhecer o código da recusa, não só exibir a mensagem",
);
assert.ok(
  page.includes("#/verificar-email"),
  "a recusa por e-mail não verificado precisa levar direto à página de reenvio",
);
assert.match(
  page,
  /Reenviar link de verificação/,
  "a ação precisa dizer o que faz, no vocabulário da página de verificação",
);

console.log(
  "✅ onboarding: recusa por e-mail não verificado leva à página de reenvio, ancorada no código do backend.",
);

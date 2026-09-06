import assert from "node:assert/strict";
import fs from "node:fs";
import { invitationDeliveryConfigured } from "../../functions/api/billing/_invitationDelivery";

assert.equal(invitationDeliveryConfigured({}), false);
assert.equal(
  invitationDeliveryConfigured({
    AUTH_PUBLIC_APP_URL: "http://neuroped.example",
    AUTH_RESEND_API_KEY: "key",
    AUTH_EMAIL_FROM: "NeuroPed <no-reply@example.com>",
  }),
  false,
  "convite com bearer secret nunca pode ser entregue a partir de base HTTP",
);
assert.equal(
  invitationDeliveryConfigured({
    AUTH_PUBLIC_APP_URL: "https://neuroped.example",
    AUTH_RESEND_API_KEY: "key",
    AUTH_EMAIL_FROM: "NeuroPed <no-reply@example.com>",
  }),
  true,
);

const handler = fs.readFileSync("functions/api/billing/invitations.ts", "utf8");
const delivery = fs.readFileSync("functions/api/billing/_invitationDelivery.ts", "utf8");
const teamUi = fs.readFileSync("client/src/pages/configuracoes.tsx", "utf8");

assert.match(handler, /INVITATION_DELIVERY_NOT_CONFIGURED/);
assert.match(handler, /INVITATION_EMAIL_DELIVERY_FAILED/);
assert.match(handler, /if \(!invitationDeliveryConfigured\(context\.env\)\)/);
assert.doesNotMatch(handler, /delivery:\s*["']manual["']/);
assert.doesNotMatch(delivery, /["']manual["']/);
assert.doesNotMatch(handler, /invitationUrl:\s*params\.invitationUrl/);
assert.doesNotMatch(handler, /APP_BASE_URL/);
assert.match(
  handler,
  /buildInvitationUrl\(context\.env\.AUTH_PUBLIC_APP_URL, generated\.token\)/,
  "o bearer link deve usar a mesma origem HTTPS canônica validada pelo transporte",
);

const preflight = handler.indexOf("if (!invitationDeliveryConfigured(context.env))");
const tokenGeneration = handler.indexOf("const generated = await generateInvitationToken()");
assert.ok(preflight >= 0 && tokenGeneration > preflight, "preflight de e-mail deve ocorrer antes da geração do bearer token");

assert.match(handler, /async function revokeUndeliveredInvitation/);
const revokeCalls = [...handler.matchAll(/await revokeUndeliveredInvitation\(auth\.db, clinicId,/g)];
assert.equal(
  revokeCalls.length,
  2,
  "create e resend devem revogar token pending quando a entrega não for confirmada",
);
assert.match(
  handler,
  /UPDATE clinic_invitations SET status = 'revoked'[\s\S]*WHERE id = \? AND clinic_id = \? AND status = 'pending'/,
  "revogação de token órfão precisa ser tenant-scoped e não sobrescrever estado concorrente",
);

assert.doesNotMatch(teamUi, /delivery\?:\s*["']email["']\s*\|\s*["']manual["']/);
assert.doesNotMatch(teamUi, /inviteUrl/);
assert.doesNotMatch(teamUi, /Entrega por e-mail não configurada nesta instalação/);
assert.doesNotMatch(teamUi, /Copiar link|Link copiado/);
assert.match(teamUi, /body\.delivery !== ["']email["']/);

console.log("✓ invitation delivery: fail-closed, origem canônica única, sem bearer URL/token órfão e sem UI de fallback manual");

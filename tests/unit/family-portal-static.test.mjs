// Portal da família: garantias estruturais lidas do código-fonte.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");
const pub = read("functions/api/public-family-portal.ts");
const staff = read("functions/api/live/family-portal/index.ts");
const shared = read("functions/api/family-portal/_shared.ts");
const middleware = read("functions/api/_middleware.ts");
const html = read("client/public/portal.html");
const js = read("client/public/portal.js");
const headers = read("client/public/_headers");
const migration = read("db/migrations/0034_family_portal.sql");
const panel = read("client/src/components/clinical/FamilyPortalPanel.tsx");

// Acesso público só por token; nada de sessão
assert.match(middleware, /"\/api\/public-family-portal"/);
assert.match(pub, /readFamilyPortalToken/);
// GET não consome abertura; POST exige consentimento e consome atomicamente
const getPart = pub.slice(pub.indexOf("onRequestGet"), pub.indexOf("onRequestPost"));
assert.doesNotMatch(getPart, /CONSUME_SHARE_SQL/);
assert.doesNotMatch(getPart, /decryptClinicalJson/, "GET não entrega conteúdo");
const postPart = pub.slice(pub.indexOf("onRequestPost"));
assert.match(postPart, /consentAccepted !== true/);
assert.match(postPart, /CONSUME_SHARE_SQL/);
assert.match(postPart, /changes \?\? 0\) !== 1/);
// verificação de estado reaplicada no SQL
assert.match(shared, /expires_at > \?/);
assert.match(shared, /view_count < max_views/);
assert.match(shared, /status = 'active'/);
// Segredo nunca em claro e comparação em tempo constante
assert.match(shared, /clinicalBlindIndex/);
assert.match(shared, /constantTimeEqual/);
assert.doesNotMatch(migration, /\btoken TEXT\b/);
assert.match(migration, /token_hash TEXT NOT NULL/);
assert.match(migration, /content_encrypted TEXT NOT NULL/);
// Migração versionada: nada a aplica sozinho no runtime
for (const file of [pub, staff, shared]) assert.doesNotMatch(file, /CREATE TABLE/i);
// Nenhum envio externo no backend nem no painel
for (const file of [pub, staff, shared, panel]) {
  assert.doesNotMatch(file, /sendgrid|resend\.com|twilio|wa\.me|api\.whatsapp|mailto:|smtp|fetch\(\s*["']https?:/i);
}
// Nenhuma IA externa
for (const file of [pub, staff, shared, panel, js]) assert.doesNotMatch(file, /openai|anthropic|api\.x\.ai|generativelanguage/i);
// Médico: revisão obrigatória, documentos só os liberados, sem resultado de instrumento
assert.match(staff, /doctorReviewed !== true/);
assert.match(staff, /family_visibility/);
assert.match(staff, /origin === "instrument"/);
assert.match(staff, /document_type === "scale"/);
assert.match(staff, /membershipCanWriteClinical/);
assert.match(staff, /requireBillingEntitlement/);
assert.match(staff, /prepareSaasAudit/);
// A auditoria de criação guarda só contagens
assert.doesNotMatch(staff, /metadata:\s*{[^}]*(titulo|texto|token|name)/);
// Página estática: CSP restrita, sem innerHTML, token removido da URL, noindex
assert.match(html, /default-src 'none'/);
assert.match(html, /noindex/);
assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|localStorage|sessionStorage|document\.write|eval\(/);
assert.match(js, /removeTokenFromAddressBar\(\)/);
assert.match(js, /credentials: "omit"/);
assert.match(headers, /\/portal\.html\n\s+Cache-Control: no-store/);
// Painel não envia nada
assert.match(panel, /Nada foi enviado|nada foi enviado/);
console.log("family-portal-static ok");

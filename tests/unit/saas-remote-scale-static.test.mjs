import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration = read("db/migrations/0021_remote_scale_response.sql");
const catalog = read("shared/remoteScaleCatalog.ts");
const publicEndpoint = read("functions/api/public-scale.ts");
const staffEndpoint = read("functions/api/live/scale-invitations/index.ts");
const shared = read("functions/api/scale/_shared.ts");
const middleware = read("functions/api/_middleware.ts");
const publicJs = read("client/public/escala.js");
const publicHtml = read("client/public/escala.html");
const publicHeaders = read("client/public/_headers");
const cockpit = read("client/src/components/clinical/PatientCockpit.tsx");
const scalePanel = read("client/src/components/clinical/RemoteScalePanel.tsx");

// ── Migração: hash-only, allowlist explícita, sem cross-tenant ────────────
assert.match(migration, /token_hash TEXT NOT NULL/);
assert.doesNotMatch(migration, /\btoken\s+TEXT\b/);
assert.match(migration, /answers_encrypted TEXT NOT NULL/);
assert.match(
  migration,
  /scale_id TEXT NOT NULL CHECK \(scale_id IN \('mchat','q-chat-10','psc17','ari','gad7ped','smfq'\)\)/,
);
assert.match(migration, /review_status[^\n]+pending[^\n]+reviewed/);
assert.match(migration, /trg_live_scale_response_matches_invitation/);

// ── Catálogo: allowlist fechada, reaproveita dado real (não inventa) ──────
assert.match(catalog, /getInteractiveScale/);
assert.match(catalog, /mchatQuestions/);
assert.doesNotMatch(catalog, /\bvalue:\s*option\.value\b/, "nunca expõe peso de pontuação à família");
assert.doesNotMatch(catalog, /scale\.bands/, "descritor público nunca reaproveita a banda de interpretação da escala");
assert.doesNotMatch(catalog, /^\s*bands:/m, "RemoteScaleDescriptor não pode declarar campo de interpretação");
assert.match(catalog, /"mchat",\s*\n\s*"q-chat-10",\s*\n\s*"psc17",\s*\n\s*"ari",\s*\n\s*"gad7ped",\s*\n\s*"smfq",/);
// Instrumentos clínico-administrados/observacionais nunca podem entrar na allowlist.
for (const forbidden of ["viking-speech", "mini-macs", "bfmf", "cssrs"]) {
  assert.doesNotMatch(catalog, new RegExp(`"${forbidden}"`));
}

// ── Backend público: token via header, nunca query string; sem score exposto ──
assert.match(shared, /clinicalBlindIndex\(env, clinicId, "remote-scale-token", secret\)/);
assert.match(shared, /crypto\.getRandomValues/);
assert.match(shared, /constantTimeTextEqual/);

assert.match(publicEndpoint, /readRemoteScaleToken\(context\.request\)/);
assert.doesNotMatch(publicEndpoint, /searchParams\.get\(["']token["']\)/);
assert.match(publicEndpoint, /encryptClinicalJson/);
assert.match(publicEndpoint, /review_status, submitted_at/);
assert.doesNotMatch(publicEndpoint, /descriptor\.bands|scale\.bands/, "GET público nunca envia banda de interpretação");

// ── Backend profissional: RBAC + billing entitlement em toda mutação ──────
assert.match(staffEndpoint, /membershipCanReadClinical/);
assert.match(staffEndpoint, /membershipCanWriteClinical/);
assert.match(staffEndpoint, /requireBillingEntitlement/);
assert.match(staffEndpoint, /patientBelongsToClinic/);

// ── Middleware: rota pública allowlisted ───────────────────────────────────
assert.match(middleware, /"\/api\/public-scale"/);

// ── Página pública estática: fora do PIN/login, CSP restrita ───────────────
assert.match(publicHtml, /meta name="referrer" content="no-referrer"/);
assert.match(publicHtml, /noindex,nofollow,noarchive/);
assert.match(publicHtml, /http-equiv="Content-Security-Policy"/);
assert.match(publicHtml, /default-src 'none'/);
assert.match(publicHeaders, /\/escala\.html/);

// ── JS público: token só no fragmento, nunca vira query/URL persistida ────
assert.match(publicJs, /window\.location\.hash/);
assert.match(publicJs, /removeTokenFromAddressBar/);
assert.match(publicJs, /Authorization: `Scale \$\{scaleToken\}`/);
assert.doesNotMatch(publicJs, /searchParams\.get\(["']token["']\)/);

// ── Painel do profissional: montado no Cockpit, gera link com token no fragmento ──
assert.match(cockpit, /<RemoteScalePanel patientId=\{patientId\} \/>/);
assert.match(scalePanel, /escala\.html#token=/);
assert.doesNotMatch(scalePanel, /escala\.html\?token=/);

console.log("✓ remote-scale-response: allowlist fechada, token hash-only, sem score exposto à família, RBAC no lado profissional");

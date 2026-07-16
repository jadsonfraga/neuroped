import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const auth = read("client/src/contexts/AuthContext.tsx");
assert.doesNotMatch(auth, /VITE_APP_SECRET|FIXED_EMAIL/);
assert.match(auth, /getAuthCapability/);

const authClient = read("client/src/lib/authClient.ts");
assert.match(authClient, /CAPABILITY_KEY/);
assert.match(authClient, /cachedAuthCapability/);
assert.match(authClient, /refreshInFlight/);
assert.match(authClient, /authEpoch !== epochAtStart/);
assert.match(
  authClient,
  /const refreshToken = getRefreshToken\(\);[\s\S]*?clearAuth\(\);[\s\S]*?keepalive: true/,
);
assert.match(auth, /async function logout\(\) \{\s*setUser\(null\);\s*await logoutRequest\(\)/);

const app = read("client/src/App.tsx");
for (const component of [
  "AppErrorBoundary",
  "PrivateGate",
  "RouteGuard",
  "ServiceWorkerManager",
  "MotionConfig",
]) {
  assert.match(app, new RegExp(component));
}
assert.match(app, /<MotionConfig reducedMotion="user">/);

const restoredRoutes = [
  "/recepcao",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/prontuario",
  "/documentos",
  "/assinatura-digital",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/fichas-registro",
  "/laudo-neuroped",
  "/receita-c1",
  "/receita-c1-express",
  "/verificar",
  "/diario-escola",
  "/inventarios-escola",
];
for (const route of restoredRoutes) {
  assert.match(
    app,
    new RegExp(`<Route\\s+path="${route.replaceAll("/", "\\/")}"`),
    `${route} deve permanecer registrada`,
  );
}
assert.match(
  app,
  /<Route\s+path="\/efeitos-colaterais"\s+component=\{PreRetornoPage\}/,
  "o alias familiar deve reutilizar o fluxo completo de pré-retorno",
);
const publicRoutesSource = read("client/src/lib/publicRoutes.ts");
assert.match(
  publicRoutesSource,
  /"\/verificar"/,
  "QRs de receita devem abrir a verificação local sem login/PIN",
);
for (const qrSource of [
  read("client/src/components/AssinaturaIcpPanel.tsx"),
  read("client/src/pages/receita-c1.tsx"),
  read("client/src/pages/receita-c1-express.tsx"),
  read("client/src/lib/documentPdf.ts"),
]) {
  assert.match(qrSource, /buildAppHashUrl\("\/verificar"/);
  assert.doesNotMatch(qrSource, /location\.origin.*#\/verificar/);
}

for (const route of [
  "/prontuario",
  "/documentos",
  "/assinatura-digital",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/fichas-registro",
  "/laudo-neuroped",
  "/receita-c1",
  "/receita-c1-express",
  "/diario-escola",
  "/inventarios-escola",
]) {
  const escapedRoute = route.replaceAll("/", "\\/");
  assert.match(
    app,
    new RegExp(
      `<Route\\s+path="${escapedRoute}">[\\s\\S]*?<RouteGuard\\s+roles=\\{\\["admin",\\s*"professional"\\]\\}>[\\s\\S]*?<\\/Route>`,
    ),
    `${route} deve exigir perfil clínico elevado`,
  );
}

const report = read("client/src/components/ClinicalReport.tsx");
assert.match(report, /shareWhatsAppDocument/);
assert.doesNotMatch(report, /\/api\/send-report/);
assert.doesNotMatch(
  report,
  /wa\.me\/\?text=\$\{encodeURIComponent\(reportText\)\}/,
);
for (const emailUi of [
  report,
  read("client/src/pages/fichas-registro.tsx"),
  read("client/src/pages/plano-terapeutico.tsx"),
]) {
  assert.match(emailUi, /openEmailDraft/);
  assert.doesNotMatch(emailUi, /\/api\/send-report|\.slice\(0,\s*1800\)/);
}

const battery = read("client/src/components/BatteryReportCard.tsx");
assert.match(battery, /printPlainTextDocument/);
assert.doesNotMatch(battery, /document\.write\(`<pre>\$\{report\}/);

for (const printableSource of [
  read("client/src/components/ClinicalReport.tsx"),
  read("client/src/pages/fichas-registro.tsx"),
  read("client/src/pages/laudo-neuroped.tsx"),
  read("client/src/pages/plano-terapeutico.tsx"),
  read("client/src/pages/prontuario.tsx"),
  read("client/src/pages/receita-c1.tsx"),
  read("client/src/pages/receita-c1-express.tsx"),
]) {
  assert.match(
    printableSource,
    /\.opener = null/,
    "janelas de impressão não devem manter acesso à aplicação clínica",
  );
}
for (const printableClinicalSource of [
  read("client/src/pages/fichas-registro.tsx"),
  read("client/src/pages/plano-terapeutico.tsx"),
  read("client/src/pages/prontuario.tsx"),
]) {
  assert.match(
    printableClinicalSource,
    /escapeHtml/,
    "campos clínicos devem ser escapados antes de document.write",
  );
}

const layout = read("client/src/components/Layout.tsx");
assert.match(layout, /clearMasterPinUnlock\(\)/);
assert.match(layout, /secureClearAll\(\)/);
assert.match(layout, /const \{ accessMode, logout \} = useAuth\(\)/);
assert.match(layout, /await logout\(\)/, "bloqueio remoto deve revogar refresh no servidor");
assert.doesNotMatch(layout, /clearAuth\(\)/);

const filter = read("client/src/pages/filtro.tsx");
assert.match(filter, /type AvailabilityMode = "complete" \| "all"/);
assert.match(filter, /aria-pressed=\{availabilityMode === "all"\}/);

const worker = read("client/public/sw.js");
assert.match(worker, /__NEUROPED_BUILD_ID__/);
assert.match(worker, /GET_VERSION/);
assert.match(worker, /key\.startsWith\("neuroped-"\)/);
assert.match(worker, /importScripts\("\.\/sw-assets\.js"\)/);
assert.match(worker, /\.\.\.PRECACHE_ASSETS/);
assert.match(worker, /Promise\.all\(/);
assert.match(worker, /return Promise\.all\(\[\s*self\.clients\.claim\(\)/);
assert.match(worker, /request\.mode === "navigate" && response\.status >= 500/);
assert.doesNotMatch(worker, /Promise\.allSettled\(/);
assert.doesNotMatch(worker, /ONLINE_STATUS[\s\S]*online: true/);
assert.doesNotMatch(worker, /neuroped-v7/);

const vite = read("vite.config.ts");
assert.match(vite, /serviceWorkerPrecacheManifest/);
assert.match(vite, /sw-assets\.js/);

const genericScale = read("client/src/components/GenericScale.tsx");
const interactiveScale = read(
  "client/src/components/InteractiveScaleRunner.tsx",
);
for (const scaleRunner of [genericScale, interactiveScale]) {
  assert.match(scaleRunner, /useSecureScaleDraft/);
}
assert.doesNotMatch(genericScale, /localStorage\.setItem\(\s*draftKey/);

const news = read("client/src/pages/portal-novidades.tsx");
const sanitizer = read("client/src/lib/sanitizeArticleHtml.ts");
assert.match(news, /sanitizeArticleHtml\(open\.content\)/);
assert.match(news, /__html: sanitizedContent/);
assert.match(sanitizer, /DOMPurify\.sanitize/);
assert.match(sanitizer, /FORBID_TAGS/);

const main = read("client/src/main.tsx");
assert.match(main, /installChunkRecovery\(\)/);
assert.match(main, /purgeLegacyCertificateCache\(\)/);

const routeGuard = read("client/src/components/RouteGuard.tsx");
assert.match(routeGuard, /decideRouteAccess/);
assert.match(routeGuard, /decision === "checking"/);
assert.match(routeGuard, /decision === "login"/);
assert.match(routeGuard, /decision === "forbidden"/);

for (const certificateUi of [
  read("client/src/components/AssinaturaIcpPanel.tsx"),
  read("client/src/pages/receita-c1-express.tsx"),
]) {
  assert.doesNotMatch(certificateUi, /indexedDB\.open/);
  assert.doesNotMatch(certificateUi, /objectStore\([^)]*\)\.put/);
  assert.match(certificateUi, /purgeLegacyCertificateCache/);
}
assert.match(
  read("client/src/pages/receita-c1-express.tsx"),
  /role !== "admin"\) \{[\s\S]{0,240}setCertStatus\("missing"\)/,
  "profissional sem certificado administrativo deve receber upload manual",
);

const secureStorage = read("client/src/lib/secureStorage.ts");
assert.match(secureStorage, /crypto\.subtle\.generateKey/);
assert.match(secureStorage, /v:\s*2/);
assert.doesNotMatch(
  secureStorage,
  /new TextEncoder\(\)\.encode\(`neuroped-session-\$\{_sessionSalt/,
  "chave nova não pode ser derivável do salt persistido ao lado do ciphertext",
);

const fileRoutes = read("server/routes/files.ts");
assert.match(fileRoutes, /from "\.\.\/storage\.js"/);
assert.doesNotMatch(fileRoutes, /from "\.\.\/lib\/db\.js"/);

const localSignatureRegistry = read("client/src/pages/assinatura-digital.tsx");
assert.match(localSignatureRegistry, /secureGet<Registro\[\]>/);
assert.match(localSignatureRegistry, /secureSet\(SECURE_REGISTRY_KEY/);
assert.doesNotMatch(localSignatureRegistry, /localStorage\.setItem\(LS_KEY/);
assert.doesNotMatch(localSignatureRegistry, /pin:\s*pin\.trim/);

for (const protectedClinicalStorage of [
  read("client/src/components/DiarioClinico.tsx"),
  read("client/src/features/cognitive-lab/storage.ts"),
  read("client/src/pages/caa.tsx"),
]) {
  assert.match(protectedClinicalStorage, /secureGet/);
  assert.match(protectedClinicalStorage, /secureSet/);
  assert.doesNotMatch(protectedClinicalStorage, /localStorage\.setItem/);
}

const d1Schema = read("db/schema.d1.sql");
const d1Seed = read("db/seed.d1.sql");
assert.doesNotMatch(d1Schema, /DROP TABLE/i);
assert.doesNotMatch(d1Seed, /^\s*DELETE\s+FROM/gim);
assert.match(d1Schema, /owner_user_id/);
assert.match(d1Schema, /CREATE TABLE IF NOT EXISTS auth_refresh_sessions/);
assert.match(d1Schema, /token_hash TEXT NOT NULL UNIQUE/);
assert.match(d1Schema, /CREATE TABLE IF NOT EXISTS consents/);
assert.match(d1Schema, /UNIQUE \(user_id, consent_type, consent_version, accepted_at\)/);
const refreshMigration = read("db/migrations/0003_refresh_sessions.sql");
assert.match(refreshMigration, /CREATE TABLE IF NOT EXISTS auth_refresh_sessions/);
assert.doesNotMatch(refreshMigration, /DROP|DELETE\s+FROM/i);
const consentMigration = read("db/migrations/0004_consents.sql");
assert.match(consentMigration, /CREATE TABLE IF NOT EXISTS consents/);
assert.match(consentMigration, /user_id TEXT NOT NULL REFERENCES users/);
assert.doesNotMatch(consentMigration, /DROP|DELETE\s+FROM/i);
for (const workflow of [
  read(".github/workflows/provision-d1.yml"),
  read(".github/workflows/deploy-cloudflare.yml"),
]) {
  assert.match(workflow, /0003_refresh_sessions\.sql/);
  assert.match(workflow, /auth_refresh_sessions/);
  assert.match(workflow, /0004_consents\.sql/);
  assert.match(workflow, /idx_consents_user_accepted|consents.*user_id/);
}

const authorization = read("functions/api/auth/_authorization.ts");
assert.match(
  authorization,
  /function canUseCertificate[\s\S]*return user\.role === "admin"/,
);
const memorySearch = read("functions/api/memory/search.ts");
assert.match(memorySearch, /n\.patient_id IN/);
assert.match(memorySearch, /p\.owner_user_id = \?/);

const consentUi = read("client/src/pages/lgpd-consent.tsx");
assert.match(consentUi, /authFetch\("\/api\/consents"[\s\S]*JSON\.stringify\(payload\)/);
assert.match(consentUi, /localOnly:\s*true/);
assert.match(consentUi, /Não há sessão autenticada/);
assert.doesNotMatch(consentUi, /for \(const item of payload\.consents\)/);

const skipNav = read("client/src/components/SkipNav.tsx");
assert.match(skipNav, /event\.preventDefault\(\)/);
assert.match(skipNav, /getElementById\("main-content"\)/);
assert.match(skipNav, /main\.focus/);

assert.match(layout, /id="main-content"[\s\S]{0,120}tabIndex=\{-1\}/);
assert.match(layout, /setAttribute\("inert", ""\)/);
assert.match(layout, /event\.key === "Escape"/);
assert.match(layout, /mobileMenuButtonRef\.current\?\.focus\(\)/);

const commandPalette = read("client/src/components/CommandPalette.tsx");
assert.match(commandPalette, /IS_PUBLIC_ZONE/);
assert.match(
  commandPalette,
  /filter\(\(page\) => isPublicRoute\(page\.href\)\)/,
);

const familyPortal = read("client/src/pages/portal-familia.tsx");
assert.match(familyPortal, /const canPreviewDocuments/);
assert.match(familyPortal, /enabled: canPreviewDocuments && !!patientId/);
assert.match(familyPortal, /O ID do paciente nunca funciona como senha/);

const splash = read("client/src/components/SplashScreen.tsx");
assert.match(splash, /useReducedMotion/);
assert.match(splash, /reduceMotion\s*\?\s*\{ duration: 0 \}/);

console.log("✓ proteções das melhorias críticas permanecem conectadas ao app");

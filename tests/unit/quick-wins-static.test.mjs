import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const auth = read("client/src/contexts/AuthContext.tsx");
assert.doesNotMatch(auth, /VITE_APP_SECRET|FIXED_EMAIL/);
assert.match(
  auth,
  /getStoredUser,[\s\S]{0,120}loginRequest,[\s\S]{0,120}logoutRequest,[\s\S]{0,120}getAuthCapability/,
  "o fluxo autenticado deve usar a capacidade e a sessão remota",
);
assert.doesNotMatch(
  auth,
  /OPEN_ACCESS_USER|const LOCAL_USER|accessMode:\s*"local"/,
  "não pode existir usuário administrativo local automático",
);
assert.match(
  auth,
  /useState<AccessMode>\("checking"\)[\s\S]{0,900}getAuthCapability\(\)/,
  "a autenticação deve iniciar fechada durante o bootstrap",
);

const authClient = read("client/src/lib/authClient.ts");
assert.match(authClient, /CAPABILITY_KEY/);
assert.match(authClient, /cachedAuthCapability/);
assert.match(authClient, /refreshInFlight/);
assert.match(authClient, /authEpoch !== epochAtStart/);
assert.match(
  authClient,
  /const refreshToken = getRefreshToken\(\);[\s\S]*?clearAuth\(\);[\s\S]*?keepalive: true/,
);
// O contrato protegido é o logout aguardar a limpeza local; aceita declaração
// clássica ou arrow memoizada via useCallback.
assert.match(
  auth,
  /(?:async function logout\(\)(?:: Promise<void>)? \{|const logout = useCallback\(async \(\)(?:: Promise<void>)? => \{)[\s\S]{0,200}await clearSessionScopedClientState\(\);/,
);

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
assert.match(
  app,
  /if \(location === "\/brincando-e-aprendendo"\)[\s\S]*?<Route path="\/brincando-e-aprendendo" component=\{BrincandoAprendendoPage\} \/>[\s\S]*?<\/Switch>/,
  "a experiência educativa deve ser renderizada como microsite público fora do Layout clínico",
);
assert.doesNotMatch(
  app,
  /<Layout>[\s\S]*?<Route path="\/brincando-e-aprendendo" component=\{BrincandoAprendendoPage\} \/>/,
  "a experiência educativa não deve herdar o landmark main do Layout clínico",
);
const kidsPage = read("client/src/pages/brincando-e-aprendendo.tsx");
assert.match(kidsPage, /<header className="kids-hero/);
assert.doesNotMatch(kidsPage, /<section className="kids-hero/);
assert.match(kidsPage, /--kids-orange-strong|kids-orange-strong/);
assert.match(kidsPage, /color:\s*[\s\S]{0,180}var\(--kids-white\)/);
const asq3 = read("client/src/pages/asq3.tsx");
assert.match(asq3, /role="button"[\s\S]{0,180}tabIndex=\{0\}/, "faixas etárias do ASQ-3 devem ser acessíveis por teclado");
assert.match(asq3, /onKeyDown=\{\(event\) => \{[\s\S]{0,180}event\.key === "Enter"[\s\S]{0,120}event\.key === " "/, "ASQ-3 deve aceitar Enter e Espaço na seleção de idade");
assert.match(asq3, /<button[\s\S]{0,120}type="button"[\s\S]{0,160}setSelectedAge\(null\)/, "o retorno do ASQ-3 não pode submeter formulários");
const installPrompt = read("client/src/components/InstallPrompt.tsx");
assert.match(installPrompt, /<button[\s\S]{0,120}type="button"[\s\S]{0,160}onClick=\{handleDismiss\}/);
const agenda = read("client/src/pages/agenda.tsx");
assert.match(agenda, /<button[\s\S]{0,120}type="button"[\s\S]{0,180}action: "delete_rule"/);

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

const clinicalReport = read("client/src/components/ClinicalReport.tsx");
assert.match(clinicalReport, /printPlainTextDocument/);

for (const printableSource of [
  read("client/src/lib/printDocument.ts"),
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
assert.match(layout, /const \{[^}]*accessMode[^}]*logout[^}]*\} = useAuth\(\)/);
assert.match(
  layout,
  /await logout\(\)/,
  "bloqueio remoto deve revogar refresh no servidor",
);
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
assert.match(
  worker,
  /const cache = await caches\.open\(CACHE_NAME\);[\s\S]*const cached = await cache\.match\(request\)/,
);
assert.match(worker, /const legacy = await caches\.match\(request\)/);
assert.doesNotMatch(
  worker,
  /async function cacheFirst\(request\) \{\s*const cached = await caches\.match/,
  "cache-first não pode preferir indefinidamente um asset não-hasheado do build anterior",
);
assert.doesNotMatch(worker, /Promise\.allSettled\(/);
assert.doesNotMatch(worker, /ONLINE_STATUS[\s\S]*online: true/);
assert.doesNotMatch(worker, /neuroped-v7/);

const vite = read("vite.config.ts");
assert.match(vite, /serviceWorkerPrecacheManifest/);
assert.match(vite, /sw-assets\.js/);
assert.match(
  vite,
  /async writeBundle\(\)/,
  "precache só pode rodar após os artefatos serem gravados",
);
assert.doesNotMatch(
  vite,
  /async closeBundle\(\)/,
  "closeBundle reintroduz a corrida do manifesto",
);

const a11yAudit = read("scripts/audit-a11y.mjs");
assert.match(a11yAudit, /process\.env\.A11Y_FULL === "1"/);
assert.match(a11yAudit, /client\/src\/data\/navigation\.ts/);
assert.match(a11yAudit, /allSeverityViolations/);
const lighthouseAudit = read("scripts/audit-lighthouse.mjs");
assert.match(lighthouseAudit, /REQUIRED_PASS_AUDITS/);
assert.match(lighthouseAudit, /METRIC_MAXIMUMS/);
const bundleAudit = read("scripts/audit-bundle.mjs");
assert.match(bundleAudit, /largestJsChunkMaxKb/);
assert.match(bundleAudit, /largestJsChunkMaxGzipKb/);
const qualityBaseline = JSON.parse(read("scripts/guards/baseline.json"));
assert.equal(qualityBaseline.axeTotalViolations, 0);
assert.equal(qualityBaseline.lighthouseAccessibility, 100);
assert.equal(qualityBaseline.lighthouseBestPractices, 100);
assert.equal(qualityBaseline.lighthouseSeo, 100);
assert.ok(qualityBaseline.lighthouseRouteMinimums["/#/filtro"] >= 92);
const spiralWorkflow = read(".github/workflows/filter-spiral.yml");
assert.match(spiralWorkflow, /playwright install --with-deps chromium/);
assert.match(spiralWorkflow, /npm run audit:a11y:full/);
assert.match(spiralWorkflow, /npm run audit:lighthouse/);

const genericScale = read("client/src/components/GenericScale.tsx");
const interactiveScale = read(
  "client/src/components/InteractiveScaleRunner.tsx",
);
for (const scaleRunner of [genericScale, interactiveScale]) {
  assert.match(scaleRunner, /useSecureScaleDraft/);
}
assert.doesNotMatch(genericScale, /localStorage\.setItem\(\s*draftKey/);
assert.match(
  genericScale,
  /if \(showResult\)[\s\S]{0,220}clearPersistedDraft/,
  "conclusão deve remover o draft armazenado antes de outra aplicação",
);
assert.match(
  interactiveScale,
  /if \(showResult\)[\s\S]{0,160}clearPersistedDraft/,
  "runner interativo deve isolar respostas entre aplicações",
);

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
assert.match(routeGuard, /hasConfiguredMasterPin/);
assert.match(routeGuard, /isMasterPinUnlocked/);

const loginPage = read("client/src/pages/login.tsx");
assert.match(loginPage, /PUBLIC_HOME/);
assert.match(loginPage, /useAuth/);
assert.match(loginPage, /login\(email\.trim\(\), password\)/);
assert.match(loginPage, /type="password"/);
assert.match(loginPage, /data-testid="login-form"/);
assert.doesNotMatch(loginPage, /<Redirect\s+to=["']\/["']\s*\/>/);
assert.doesNotMatch(loginPage, /FIXED_EMAIL|FIXED_PASSWORD|ADMIN_INITIAL_PASSWORD|Clarice11/);

const servicesPage = read("client/src/pages/servicos-clinica.tsx");
assert.match(app, /<Route\s+path="\/servicos-clinica"\s+component=\{ServicosClinicaPage\}\s+\/>/);
assert.match(publicRoutesSource, /"\/servicos-clinica"/);
assert.match(servicesPage, /Nesplora/);
assert.match(servicesPage, /vídeo-EEG domiciliar noturno prolongado/i);
assert.match(servicesPage, /EEG prolongado particular em domicílio/i);
assert.match(servicesPage, /não confirma nem exclui TDAH sozinho/i);
assert.match(servicesPage, /Cobertura, credenciamento, autorização/);
assert.match(servicesPage, /Vantagens potenciais/);
assert.match(servicesPage, /Limitações e cuidados/);

const viteServer = read("server/vite.ts");
assert.match(viteServer, /typeof viteConfig === "function"/);
assert.match(viteServer, /command:\s*"serve"/);
assert.match(viteServer, /\.\.\.viteConfigInput/);

const securityMiddleware = read("server/middleware/security.ts");
assert.match(securityMiddleware, /const isProduction = process\.env\.NODE_ENV === "production"/);
assert.match(securityMiddleware, /contentSecurityPolicy:\s*isProduction\s*\?/);
assert.match(securityMiddleware, /: false/);

const accessPolicy = read("client/src/security/accessPolicy.ts");
// O modo aberto é somente opt-in para instalações locais e nunca pode ser o
// default do bundle publicado. A API continua sendo a barreira real dos dados.
assert.match(accessPolicy, /VITE_OPEN_ACCESS/);
assert.match(accessPolicy, /===\s*["']true["']/);
assert.doesNotMatch(accessPolicy, /export const OPEN_ACCESS\s*=\s*true/);
const privateGate = read("client/src/components/PrivateGate.tsx");
assert.match(privateGate, /pinConfigured && unlocked/);
assert.match(privateGate, /showLocalConfigurationError/);
assert.match(
  privateGate,
  /const \[remember, setRemember\] = useState\(false\)/,
  "perfil compartilhado não deve persistir desbloqueio por padrão",
);
assert.match(privateGate, /desbloqueado por 14 dias/);
assert.doesNotMatch(privateGate, /storeDeviceMasterPin/);

const queryClient = read("client/src/lib/queryClient.ts");
assert.match(queryClient, /authFetch/);
assert.doesNotMatch(queryClient, /openAccessFetch|routedFetch/);

for (const certificateUi of [
  read("client/src/components/AssinaturaIcpPanel.tsx"),
  read("client/src/pages/receita-c1-express.tsx"),
]) {
  assert.doesNotMatch(certificateUi, /indexedDB\.open/);
  assert.doesNotMatch(certificateUi, /objectStore\([^)]*\)\.put/);
  assert.doesNotMatch(certificateUi, /\/api\/cert|CERT_P12|authFetch/);
  assert.match(certificateUi, /purgeLegacyCertificateCache/);
  assert.match(certificateUi, /type="file"/);
}
const retiredCertificateEndpoint = read("functions/api/cert.ts");
assert.match(retiredCertificateEndpoint, /CERT_ENDPOINT_RETIRED/);
assert.match(retiredCertificateEndpoint, /status:\s*410/);
assert.doesNotMatch(
  retiredCertificateEndpoint,
  /CERT_P12|password|cert:\s*/,
  "endpoint aposentado nunca pode serializar certificado ou senha",
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
assert.match(
  d1Schema,
  /UNIQUE \(user_id, consent_type, consent_version, accepted_at\)/,
);
const refreshMigration = read("db/migrations/0003_refresh_sessions.sql");
assert.match(
  refreshMigration,
  /CREATE TABLE IF NOT EXISTS auth_refresh_sessions/,
);
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
assert.doesNotMatch(
  authorization,
  /canUseCertificate/,
  "autorização não deve manter caminho de exportação de certificado",
);
const memorySearch = read("functions/api/memory/search.ts");
assert.match(memorySearch, /n\.patient_id IN/);
assert.match(memorySearch, /p\.owner_user_id = \?/);
assert.match(memorySearch, /DB_REQUIRED/);
assert.doesNotMatch(memorySearch, /DEMO_NOTES|mem-demo-/);

const memoryApi = read("functions/api/memory/index.ts");
const memoryMutationApi = read("functions/api/memory/[id].ts");
const memoryUi = read("client/src/pages/memoria-clinica.tsx");
const memoryMigration = read("db/migrations/0011_clinical_memory.sql");
assert.match(memoryApi, /getPatientAccess/);
assert.match(memoryApi, /canWriteClinicalData/);
assert.match(memoryApi, /Nenhuma nota foi simulada/);
assert.match(memoryMutationApi, /getPatientAccess/);
assert.match(memoryMutationApi, /onRequestPatch/);
assert.match(memoryMutationApi, /onRequestDelete/);
assert.match(memoryUi, /\/api\/memory\?patient_id=/);
assert.match(memoryUi, /A gravação foi confirmada pelo backend/);
assert.match(memoryMigration, /FOREIGN KEY\(patient_id\) REFERENCES patients_demo/);
assert.match(memoryMigration, /idx_clinical_memory_patient_updated/);
for (const workflow of [
  read(".github/workflows/provision-d1.yml"),
  read(".github/workflows/deploy-cloudflare.yml"),
]) {
  assert.match(workflow, /0011_clinical_memory\.sql/);
  assert.match(workflow, /clinical_memory_notes_demo/);
}

const consentUi = read("client/src/pages/lgpd-consent.tsx");
assert.match(
  consentUi,
  /authFetch\("\/api\/consents"[\s\S]*JSON\.stringify\(payload\)/,
);
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

const terms = read("client/src/pages/termos.tsx");
assert.match(terms, /rascunhos locais no navegador/);
assert.doesNotMatch(
  terms,
  /não coleta nem armazena dados\s+identificáveis de pacientes/,
  "o aviso público deve refletir o armazenamento local dos formulários",
);

const familyPage = read("client/src/pages/familia.tsx");
assert.match(familyPage, /Projeto autoral/);
assert.match(familyPage, /Um espaço criado pelo Dr\. Jadson Fraga/);
assert.match(familyPage, /href="\/sobre"/);

const layoutAuthor = read("client/src/components/Layout.tsx");
assert.match(layoutAuthor, /NeuroPed é um projeto autoral de/);
assert.match(layoutAuthor, /<Link href="\/sobre"/);

const documentHead = read("client/index.html");
assert.match(documentHead, /name="author" content="Dr\. Jadson Fraga Araújo Júnior"/);
assert.match(documentHead, /property="og:title"/);
assert.match(documentHead, /projeto autoral do Dr\. Jadson Fraga/);

const publicTerms = read("client/public/terms-of-use.html");
assert.match(publicTerms, /disponibilizado gratuitamente como projeto educativo e institucional/);
assert.doesNotMatch(publicTerms, /pagamento da licença \(R\$ 20,00\)/);
assert.doesNotMatch(publicTerms, /Pagamento e Reembolso/);

const familyPortal = read("client/src/pages/portal-familia.tsx");
assert.match(familyPortal, /const canPreviewDocuments/);
assert.match(familyPortal, /enabled: canPreviewDocuments && !!patientId/);
assert.match(familyPortal, /O ID do paciente nunca funciona como senha/);

const splash = read("client/src/components/SplashScreen.tsx");
assert.match(splash, /useReducedMotion/);
assert.match(splash, /reduceMotion\s*\?\s*\{ duration: 0 \}/);

console.log("✓ proteções das melhorias críticas permanecem conectadas ao app");

// CORS de produção deve falhar fechado mesmo se a env receber wildcard.
const expressSecurity = read("server/middleware/security.ts");
assert.match(expressSecurity, /export function isCorsOriginAllowed/);
assert.match(
  expressSecurity,
  /return !isProduction && corsOrigins\.includes\("\*"\)/,
);
assert.doesNotMatch(
  expressSecurity,
  /corsOrigins\.includes\(origin\) \|\| corsOrigins\.includes\("\*"\)/,
  "produção não pode aceitar wildcard CORS com credenciais",
);

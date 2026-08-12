import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

const home = read("client/src/pages/home.tsx");
const filtro = read("client/src/pages/filtro.tsx");
const publicRoutes = read("client/src/lib/publicRoutes.ts");
const portalFamilia = read("client/src/pages/portal-familia.tsx");
const buildInfo = read("scripts/gen-build-info.mjs");
const authContext = read("client/src/contexts/AuthContext.tsx");
const cloudflareAuthShared = read("functions/api/auth/_shared.ts");
const cloudflareLogin = read("functions/api/auth/login.ts");
const cloudflareRateLimit = read("functions/api/auth/_rateLimit.ts");
const dailyAuthorialCatalog = read("client/src/data/dailyAuthorialCatalog.ts");
const dailyAuthorialWorkflow = read(".github/workflows/daily-authorial-inventory.yml");
const visualStates = read("client/src/components/ui/VisualStates.tsx");
const toastSystem = read("client/src/components/Toast.tsx");
const cognitiveRunner = read("client/src/features/cognitive-lab/CognitiveTaskRunner.tsx");
const serverCrypto = read("server/lib/crypto.ts");
const skipNav = read("client/src/components/SkipNav.tsx");
const pageMascotDecor = read("client/src/components/PageMascotDecor.tsx");
const secureStorage = read("client/src/lib/secureStorage.ts");
const persistentSecureStorage = read("client/src/lib/persistentSecureStorage.ts");
const diarioClinico = read("client/src/components/DiarioClinico.tsx");
const epilepsyDiary = read("client/src/pages/epilepsy-diary.tsx");
const headacheCalendar = read("client/src/pages/headache-calendar.tsx");
const cognitiveStorage = read("client/src/features/cognitive-lab/storage.ts");
const signatureRegistry = read("client/src/pages/assinatura-digital.tsx");
const pkg = JSON.parse(read("package.json"));
const clinicalFiles = [
  "functions/api/patients/index.ts",
  "functions/api/consultations/index.ts",
  "functions/api/documents/index.ts",
  "functions/api/scales/results.ts",
  "functions/api/results.ts",
];

// Triagem sem cadastro: deve continuar pública, efêmera e sem contaminar o estado persistente.
assert.match(home, /filtro-escalas\?mode=flash/);
assert.match(filtro, /Modo efêmero — saia da tela e os dados somem/);
assert.match(filtro, /sessionStorage\.setItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /sessionStorage\.removeItem\(FLASH_STORAGE_KEY/);
assert.match(filtro, /if \(flashMode\) return;/);
assert.match(publicRoutes, /"\/filtro-escalas"/);

// Portal familiar não pode reintroduzir CPF-como-senha nem liberar documentos remotos anonimamente.
assert.doesNotMatch(portalFamilia, /CPF\s+como\s+senha|senha\s*=\s*CPF/i);
assert.match(portalFamilia, /const canPreviewDocuments/);
assert.match(portalFamilia, /accessMode === "remote" && isAuthenticated/);
assert.match(portalFamilia, /O ID do paciente nunca funciona como senha/);

// Build/versionamento continua derivado do package.json, sem versão duplicada manual no gerador.
assert.equal(typeof pkg.version, "string");
assert.match(buildInfo, /JSON\.parse\(readFileSync\(new URL/);
assert.match(buildInfo, /pkg\.version/);

// Nenhum endpoint clínico pode mentir que persistiu quando DB não existe.
for (const path of clinicalFiles) {
  const source = read(path);
  assert.match(source, /DB_REQUIRED/);
  assert.doesNotMatch(source, /Registro simulado|registro simulado/);
}

// Compatibilidade criptográfica: o secret Base64 é texto opaco historicamente.
// Reinterpretá-lo como bytes Base64 rompe ciphertexts e blind/deterministic hashes existentes.
assert.match(serverCrypto, /Buffer\.from\(raw, "utf8"\)/);
assert.doesNotMatch(serverCrypto, /Buffer\.from\(raw, "base64"\)/);
assert.match(serverCrypto, /nunca reinterpretar um secret existente/i);

// AuthContext: o contrato importante é a limpeza local em qualquer resultado do logout remoto.
assert.match(authContext, /async function logout\(\)(?:: Promise<void>)? \{/);
assert.match(authContext, /await logoutRequest\(\)/);
assert.match(authContext, /finally\s*\{\s*await clearSessionScopedClientState\(\)/s);

// O lockout canônico D1 precisa incrementar no próprio UPDATE. Read + write absoluto
// perde tentativas quando bcrypts concorrentes terminam quase ao mesmo tempo.
assert.match(
  cloudflareAuthShared,
  /failed_login_attempts = COALESCE\(failed_login_attempts, 0\) \+ 1/,
);
assert.match(
  cloudflareAuthShared,
  /WHEN COALESCE\(failed_login_attempts, 0\) \+ 1 >= \? THEN \?/,
);
assert.doesNotMatch(
  cloudflareAuthShared,
  /const attempts = \(u\.failed_login_attempts \?\? 0\) \+ 1/,
);

// Credential stuffing entre contas diferentes precisa de bucket distribuído no D1,
// pseudonimizado por HMAC do IP — não depender só de memória por isolate.
assert.match(cloudflareRateLimit, /CREATE TABLE IF NOT EXISTS auth_login_rate_limits/);
assert.match(cloudflareRateLimit, /idx_auth_login_rate_limits_updated/);
assert.match(cloudflareRateLimit, /CF-Connecting-IP/);
assert.match(cloudflareRateLimit, /name: "HMAC", hash: "SHA-256"/);
assert.match(cloudflareRateLimit, /ON CONFLICT\(bucket_hash\) DO UPDATE SET/);
assert.match(cloudflareRateLimit, /failed_attempts \+ 1 >= \?/);
assert.match(cloudflareRateLimit, /DELETE FROM auth_login_rate_limits WHERE updated_at < \?/);
assert.doesNotMatch(cloudflareRateLimit, /INSERT[^]*CF-Connecting-IP/i);
assert.match(cloudflareLogin, /enforceLoginAbuseLimit\(env, request, secret\)/);
assert.ok(
  (cloudflareLogin.match(/registerLoginAbuseFailure\(env, request, secret\)/g) ?? []).length >= 2,
  "e-mail inexistente e senha incorreta devem alimentar o bucket distribuído",
);

// Geração autoral não equivale a publicação clínica. Somente conteúdo promovido
// por revisão humana explícita pode atravessar para a Biblioteca operacional.
assert.match(dailyAuthorialCatalog, /export const dailyAuthorialReviewCatalog/);
assert.match(
  dailyAuthorialCatalog,
  /dailyAuthorialReviewCatalog\.filter\(\s*\(record\) => record\.status === "revisado_clinicamente"/s,
);
assert.doesNotMatch(
  dailyAuthorialCatalog,
  /export const dailyAuthorialCatalog = loaded\s*\.filter/s,
  "rascunho gerado automaticamente não pode virar catálogo operacional só por ser JSON válido",
);

// A automação diária não pode mais ser uma exceção que escreve diretamente na main.
// Ela deve versionar o rascunho em branch datada e abrir PR draft para revisão/checks independentes.
assert.doesNotMatch(dailyAuthorialWorkflow, /git push origin HEAD:main/);
assert.match(dailyAuthorialWorkflow, /automation\/daily-authorial-\$\{NEUROPED_GENERATION_DATE\}/);
assert.match(dailyAuthorialWorkflow, /gh pr create[\s\S]{0,240}--draft/);
assert.match(dailyAuthorialWorkflow, /pull-requests: write/);
assert.match(dailyAuthorialWorkflow, /NEUROPED_AUTOMATION_TOKEN é obrigatório/);

// Toasts: callbacks novos não podem reiniciar timers existentes nem vazar texto no console.
assert.match(visualStates, /const onDismissRef = useRef\(onDismiss\)/);
assert.match(visualStates, /onDismissRef\.current = onDismiss/);
assert.match(visualStates, /onDismissRef\.current\?\.\(\)/);
assert.match(visualStates, /\}, \[durationMs\]\);/);
assert.match(toastSystem, /const onDismissRef = useRef\(onDismiss\)/);
assert.match(toastSystem, /setTimeout\(\(\) => onDismissRef\.current\(\), toast\.duration \?\? 3600\)/);
assert.match(toastSystem, /\}, \[toast\.duration\]\);/);
assert.doesNotMatch(toastSystem, /console\.(?:warn|error|log)\([^\n]*toast/i);

// Cognitive Lab: AudioContext tem lifecycle próprio; o timer de encerramento não pode ser
// registrado em `after`, pois clearTimers() roda entre trials e poderia cancelar ctx.close().
assert.match(cognitiveRunner, /window\.setTimeout\(\(\) => \{/);
assert.match(cognitiveRunner, /void ctx\.close\(\)/);
assert.match(cognitiveRunner, /beep\(correct \? 880 : 220\);/);
assert.doesNotMatch(cognitiveRunner, /beep\([^\n]*after\)/);

// Mascotes globais: toda página atravessa SkipNav no início do Layout, portanto a camada
// decorativa deve continuar montada ali. Os mascotes não podem capturar clique/foco e a
// geração nova (Nino) deve coexistir com o acervo histórico de forma contextual por rota.
assert.match(skipNav, /PageMascotDecor/);
assert.match(pageMascotDecor, /useLocation\(\)/);
assert.match(pageMascotDecor, /pointer-events-none/);
assert.match(pageMascotDecor, /aria-hidden="true"/);
assert.match(pageMascotDecor, /data-mascot-era="novo"/);
assert.match(pageMascotDecor, /data-mascot-era="legado"/);
assert.match(pageMascotDecor, /\/neuroped-mascot-premium\.webp/);
assert.match(pageMascotDecor, /routesWithInlineNino/);
assert.match(pageMascotDecor, /path\.startsWith\("\/generic-scale\/"\)/);
assert.doesNotMatch(pageMascotDecor, /onClick=/);
for (const fileName of [
  "dr-jadson-logo-super.jpeg",
  "dr-jadson-consultorio-superman.jpeg",
  "dr-jadson-arte.jpeg",
  "dr-jadson-selfie.jpeg",
  "dr-jadson-consultorio-batman.jpeg",
  "dr-jadson-consultorio-full.jpeg",
]) {
  assert.match(pageMascotDecor, new RegExp(fileName.replaceAll(".", "\\.")));
}
assert.equal(
  existsSync(resolve(root, "client/public/neuroped-mascot-premium.webp")),
  true,
  "Nino premium precisa permanecer publicado para a assinatura global das páginas",
);

// Artefatos locais que se apresentam como longitudinais precisam sobreviver a reload,
// mas continuar cifrados e destrutíveis no logout. O cofre persistente usa CryptoKey
// não exportável no IndexedDB; rascunhos comuns continuam efêmeros.
assert.match(secureStorage, /const PERSISTENT_SECURE_KEYS = new Set\(\[/);
for (const key of ["caa:workspace:v3", "assinatura:registros:v2", "cognitive-lab:sessions:v2"]) {
  assert.match(secureStorage, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(secureStorage, /const PERSISTENT_SECURE_PREFIXES = \["diario:"\]/);
assert.match(secureStorage, /PERSISTENT_SECURE_PREFIXES\.some\(\(prefix\) => key\.startsWith\(prefix\)\)/);
assert.match(secureStorage, /await persistentSecureClearAll\(\)/);
assert.match(persistentSecureStorage, /extractable false|false,\s*\["encrypt", "decrypt"\]/s);
// O cofre separa chave-mestra e valores em object stores distintas: a CryptoKey
// não exportável vive em KEY_STORE e nunca se mistura aos envelopes cifrados.
assert.match(persistentSecureStorage, /const KEY_STORE = "keys"/);
assert.match(persistentSecureStorage, /const VALUE_STORE = "values"/);
assert.match(persistentSecureStorage, /const MASTER_KEY_ID = "aes-gcm-master-v1"/);
assert.match(persistentSecureStorage, /deleteDatabase/);

// Diário genérico e os dois diários dedicados não podem voltar a estado apenas em memória.
assert.match(diarioClinico, /const secureKey = `diario:\$\{config\.id\}`/);
assert.match(diarioClinico, /secureGet<DiarioEntry\[]>\(secureKey\)/);
assert.match(diarioClinico, /secureSet\(secureKey, snapshot\)/);
for (const [name, source, key] of [
  ["epilepsia", epilepsyDiary, "diario:epilepsia:v1"],
  ["cefaleia", headacheCalendar, "diario:cefaleia:v1"],
]) {
  assert.match(source, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${name}: chave cifrada longitudinal ausente`);
  assert.match(source, /secureGet<[^>]+>\(STORAGE_KEY\)/, `${name}: leitura cifrada ausente`);
  assert.match(source, /secureSet\(STORAGE_KEY, snapshot\)/, `${name}: escrita cifrada ausente`);
  assert.match(source, /storageError/, `${name}: falha de persistência deve ser visível`);
  assert.doesNotMatch(source, /localStorage\.(?:getItem|setItem)/, `${name}: não pode persistir PHI em texto puro`);
  assert.match(source, /setTimeout\(\(\) => URL\.revokeObjectURL\(url\), 2_000\)/, `${name}: blob deve sobreviver ao click`);
}

// Sessões explicitamente salvas do Cognitive Lab e o registro local de assinatura
// usam chaves roteadas para o mesmo cofre persistente; logout destrói a chave comum.
assert.match(cognitiveStorage, /const SECURE_KEY = "cognitive-lab:sessions:v2"/);
assert.match(cognitiveStorage, /secureGet<CognitiveSession\[]>\(SECURE_KEY\)/);
assert.match(cognitiveStorage, /secureSet\(SECURE_KEY, all\)/);
assert.match(signatureRegistry, /const SECURE_REGISTRY_KEY = "assinatura:registros:v2"/);
assert.match(signatureRegistry, /secureGet<Registro\[]>\(SECURE_REGISTRY_KEY\)/);
assert.match(signatureRegistry, /secureSet\(SECURE_REGISTRY_KEY/);

// Ferramentas temporárias/legadas capazes de reescrever clínica ou simular auditorias
// não devem reaparecer na raiz ativa sem um workflow e contrato explícitos.
for (const path of [
  "analyze-a11y.sh",
  "run-audit-loop-20min.sh",
  "audit-filter-random-patients.mjs",
  "add-clinical-report.cjs",
  "generate-report.cjs",
  "fix-audit-issues.mjs",
  "add-child-respondent.mjs",
  "audit-advanced-250.mjs",
  "audit-230-integrated.mjs",
  "audit-250-combinations.mjs",
]) {
  assert.equal(existsSync(resolve(root, path)), false, `${path} não deve existir na raiz ativa`);
}

// O mini-backend CommonJS de laudo/receita/P12 foi aposentado. A assinatura atual
// é local no cliente; reintroduzir este diretório recriaria uma segunda arquitetura
// de certificado e uma superfície para exemplos clínicos identificáveis.
assert.equal(
  existsSync(resolve(root, "server/modules")),
  false,
  "server/modules aposentado não deve reaparecer",
);

// O Express efetivo persiste via server/storage.ts. Adapters Postgres/SQLite e
// repositories sem qualquer import de runtime criavam uma segunda DAL enganosa,
// com documentação dizendo que initDb() rodava no boot quando isso não ocorria.
for (const path of [
  "server/lib/db.ts",
  "server/lib/db-enhanced.ts",
  "server/lib/repositories",
  "shared/schema-pg.ts",
]) {
  assert.equal(existsSync(resolve(root, path)), false, `${path} não deve reaparecer sem wiring real`);
}

console.log("✓ Pontas soltas críticas protegidas por regressão estática");

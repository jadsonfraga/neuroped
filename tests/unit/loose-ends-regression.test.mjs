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
const visualStates = read("client/src/components/ui/VisualStates.tsx");
const toastSystem = read("client/src/components/Toast.tsx");
const cognitiveRunner = read("client/src/features/cognitive-lab/CognitiveTaskRunner.tsx");
const serverCrypto = read("server/lib/crypto.ts");
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

// Ferramentas temporárias/legadas capazes de reescrever clínica ou simular auditorias
// não devem reaparecer na raiz ativa sem um workflow e contrato explícitos.
for (const path of [
  "analyze-a11y.sh",
  "run-audit-loop-20min.sh",
  "audit-filter-random-patients.mjs",
  "add-clinical-report.cjs",
  "generate-report.cjs",
]) {
  assert.equal(existsSync(resolve(root, path)), false, `${path} não deve existir na raiz ativa`);
}

console.log("✓ Pontas soltas críticas protegidas por regressão estática");

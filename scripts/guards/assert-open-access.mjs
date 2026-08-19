// @ts-check
/**
 * TRAVA ANTI-REGRESSÃO DA POLÍTICA DE ACESSO.
 *
 * O modo aberto é somente opt-in por VITE_OPEN_ACCESS=true para instalações
 * locais de demonstração. O bundle de produção deve permanecer fechado por
 * padrão: rotas clínicas exigem autenticação/role e somente a allowlist pública
 * dispensa a sessão. Este guard falha o CI se o modo aberto voltar a ser ligado
 * por literal ou se uma catraca de acesso clínico desaparecer.
 *
 * A senha local do certificado A1 (.p12/.pfx) é a única exceção: ela pertence ao
 * arquivo criptográfico escolhido pelo próprio usuário, é processada em memória
 * e não funciona como credencial de entrada no aplicativo.
 *
 * A autorização dos dados persistidos permanece na API e não é alterada por
 * esta política de interface.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const read = (rel) => readFileSync(resolve(repoRoot, rel), "utf8");
const importTs = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const absolute = resolve(directory, entry);
    if (statSync(absolute).isDirectory()) walk(absolute, files);
    else files.push(absolute);
  }
  return files;
}

const errors = [];
async function check(label, assertion) {
  try {
    await assertion();
    console.log(`  ✓ ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`${label}: ${message}`);
    console.error(`  ✗ ${label}`);
  }
}

console.log("[open-access] verificando trava anti-regressão de senha…");

const accessPolicySrc = read("client/src/security/accessPolicy.ts");
await check("OPEN_ACCESS é opt-in e não fica ligado por literal", () => {
  assert.match(accessPolicySrc, /VITE_OPEN_ACCESS/);
  assert.doesNotMatch(
    accessPolicySrc,
    /export const OPEN_ACCESS\s*=\s*true\s*;/,
    "OPEN_ACCESS não pode ser ligado por literal no código-fonte",
  );
});

const { getAccessLevel, OPEN_ACCESS } = await importTs(
  "client/src/security/accessPolicy.ts",
);
await check("OPEN_ACCESS fica desligado sem VITE_OPEN_ACCESS=true", () => {
  assert.equal(OPEN_ACCESS, false);
});

const CLINICAL_ROUTE_SENTINELS = [
  "/",
  "/prontuario",
  "/pacientes",
  "/paciente/abc",
  "/documentos",
  "/receita-c1",
  "/receita-c1-express",
  "/laudo-neuroped",
  "/recepcao",
  "/mchat",
  "/cars",
  "/wisc5",
  "/bayley",
  "/generic-scale/smfq",
  "/calculadora-dose",
  "/pant",
  "/rota-clinica-inventada-no-futuro",
];
const PUBLIC_ROUTE_SENTINELS = [
  "/login",
  "/familia",
  "/agendar",
  "/verificar",
  "/brincando-e-aprendendo",
  "/filtro-escalas",
];
await check("rotas clínicas permanecem fechadas por padrão", () => {
  for (const path of CLINICAL_ROUTE_SENTINELS) {
    assert.equal(getAccessLevel(path), "clinical", `${path} deveria exigir gate clínico`);
  }
});
await check("somente rotas públicas sentinela dispensam a sessão", () => {
  for (const path of PUBLIC_ROUTE_SENTINELS) {
    assert.equal(getAccessLevel(path), "public", `${path} deveria ser pública`);
  }
});

const { decideRouteAccess } = await importTs(
  "client/src/security/routeGuardPolicy.ts",
);
await check("RouteGuard exige login para rota clínica remota e permite allowlist pública", () => {
  for (const path of CLINICAL_ROUTE_SENTINELS) {
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: false,
        isLoading: false,
      }),
      "login",
      `${path} deve mandar para /login quando não há sessão`,
    );
  }
  for (const path of PUBLIC_ROUTE_SENTINELS) {
    assert.equal(
      decideRouteAccess({
        path,
        accessMode: "remote",
        isAuthenticated: false,
        isLoading: false,
      }),
      "allow",
      `${path} pública não deve mandar para /login`,
    );
  }
});

const appSrc = read("client/src/App.tsx");
const loginPageSrc = read("client/src/pages/login.tsx");
await check("rota legada /login é somente redirecionamento", () => {
  assert.match(appSrc, /<Route\s+path="\/login"\s+component=\{LoginPage\}\s*\/>/);
  assert.match(loginPageSrc, /<Redirect\s+to="\/"\s*\/>/);
  assert.doesNotMatch(
    loginPageSrc,
    /type\s*=\s*["']password["']|loginRequest|useAuth|input-login-password|Acesso profissional/i,
    "a página /login não pode conter formulário ou chamada de autenticação",
  );
});

const privateGateSrc = read("client/src/components/PrivateGate.tsx");
await check("PrivateGate permanece neutralizado por OPEN_ACCESS", () => {
  assert.match(privateGateSrc, /OPEN_ACCESS/);
  assert.match(
    privateGateSrc,
    /const showGate\s*=\s*[\s\S]{0,80}!OPEN_ACCESS\s*&&/,
  );
  assert.match(privateGateSrc, /if \(!showGate\) return <>{children}<\/>;/);
});

const masterPinSrc = read("client/src/lib/masterPin.ts");
const masterPin = await importTs("client/src/lib/masterPin.ts");
await check("PIN legado está funcionalmente desativado", async () => {
  assert.equal(masterPin.hasConfiguredMasterPin(), true);
  assert.equal(masterPin.isMasterPinUnlocked(), true);
  assert.equal(masterPin.getMasterPinLockSeconds(), 0);
  assert.equal(await masterPin.verifyMasterPin("qualquer-valor"), true);
});
await check("módulo de PIN não cria nem persiste segredo", () => {
  assert.doesNotMatch(
    masterPinSrc,
    /VITE_PIN_HASH|PBKDF2|crypto\.subtle|DEVICE_HASH_KEY|sessionStorage|localStorage/,
    "masterPin.ts não pode voltar a armazenar ou comparar credenciais",
  );
});

const genericScaleSrc = read("client/src/pages/generic-scale.tsx");
await check("prompt legado de escala permanece inalcançável", () => {
  assert.match(
    genericScaleSrc,
    /useState\(\(\) => isMasterPinUnlocked\(\)\)/,
    "a escala genérica deve iniciar pelo estado central, que é sempre aberto",
  );
});

const clientSourceRoot = resolve(repoRoot, "client", "src");
const passwordInputFiles = walk(clientSourceRoot)
  .filter((path) => /\.(?:ts|tsx|js|jsx)$/.test(path))
  .filter((path) => /type\s*=\s*["']password["']/i.test(readFileSync(path, "utf8")))
  .map((path) => relative(repoRoot, path).replaceAll("\\", "/"))
  .sort();

const EXPECTED_PASSWORD_INPUT_FILES = [
  "client/src/components/AssinaturaIcpPanel.tsx",
  "client/src/components/PrivateGate.tsx",
  "client/src/pages/generic-scale.tsx",
].sort();

await check("nenhum novo campo de senha foi criado na interface", () => {
  assert.deepEqual(
    passwordInputFiles,
    EXPECTED_PASSWORD_INPUT_FILES,
    "campo type=password novo ou remoção não revisada detectada",
  );
});

const certificatePanelSrc = read("client/src/components/AssinaturaIcpPanel.tsx");
await check("única senha operacional é a do certificado A1 local", () => {
  assert.match(certificatePanelSrc, /Senha do certificado/);
  assert.match(certificatePanelSrc, /accept="\.p12,\.pfx"/);
  assert.match(certificatePanelSrc, /input-p12-senha/);
  assert.doesNotMatch(certificatePanelSrc, /loginRequest|\/api\/auth\/login|input-login-password/);
});

const pageAndComponentFiles = walk(clientSourceRoot)
  .filter((path) => /\.(?:tsx|jsx)$/.test(path))
  .map((path) => ({
    path: relative(repoRoot, path).replaceAll("\\", "/"),
    source: readFileSync(path, "utf8"),
  }));

await check("nenhuma tela nova chama o login da API", () => {
  const offenders = pageAndComponentFiles
    .filter(({ path }) => path !== "client/src/contexts/AuthContext.tsx")
    .filter(({ source }) => /loginRequest\s*\(|\/api\/auth\/login/.test(source))
    .map(({ path }) => path);
  assert.deepEqual(offenders, [], `telas com chamada de login: ${offenders.join(", ")}`);
});

if (errors.length) {
  console.error(`\n[open-access] ✗ ${errors.length} regressão(ões) detectada(s):`);
  for (const error of errors) console.error(`  · ${error}`);
  console.error(
    "\nO NeuroPed deve permanecer aberto. Mudança de política exige decisão explícita\n" +
      "do autor e remoção consciente desta catraca — nunca uma regressão silenciosa.",
  );
  process.exit(1);
}

console.log(
  "[open-access] ✓ modo aberto é opt-in; rotas clínicas permanecem protegidas e login/PIN não reaparecem indevidamente",
);

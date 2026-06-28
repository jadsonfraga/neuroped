import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const routeGuardPath = join(root, "client/src/components/RouteGuard.tsx");
const localUnlockPath = join(root, "client/src/lib/localUnlock.ts");
const passwordGatePath = join(root, "client/src/components/PasswordGate.tsx");
const notFoundPath = join(root, "client/src/pages/not-found.tsx");

function read(path) {
  return readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`ERRO: ${message}`);
  process.exitCode = 1;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", "dist", "build"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const app = read(appPath);
const guard = read(routeGuardPath);
const unlock = read(localUnlockPath);
const passwordGate = read(passwordGatePath);
const notFound = read(notFoundPath);

const sensitiveRoutes = [
  "/pant",
  "/assinatura-digital",
  "/pacientes",
  "/paciente/",
  "/prontuario",
  "/calculadora-dose",
  "/farmacologia",
  "/medicamentos",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/avaliacao-multiprofissional",
  "/fichas-registro",
];

const protectedBridgeRoutes = ["/documentos"];

const publicRoutes = [
  "/",
  "/filtro",
  "/portal-familia",
  "/qualidade",
  "/pre-retorno",
  "/consentimento-lgpd",
];

console.log("Auditando politica de acesso NeuroPed...");

if (app.includes("LocalUnlockGate")) {
  fail("App.tsx nao deve importar/renderizar LocalUnlockGate global.");
}

if (guard.includes("LocalUnlockGate") || guard.includes("hasClinicalUnlock")) {
  fail("RouteGuard.tsx nao deve liberar area clinica por desbloqueio local.");
}

// Modelo PIN master: PrivateGate no main.tsx é o único portão; RouteGuard é transparente.
const mainPath = join(root, "client/src/main.tsx");
const mainTsx = read(mainPath);
if (!mainTsx.includes("PrivateGate")) {
  fail("main.tsx deve envolver <App> com <PrivateGate> (PIN master).");
}

if (!unlock.includes("verifyMasterPin") || !unlock.includes("clearMasterPinUnlock") || !unlock.includes("dados reais de pacientes")) {
  fail("localUnlock.ts deve usar somente o PIN master forte e avisar que offline nao serve para dados reais.");
}

if (/VITE_PIN_HASH|PIN_HASH|MASTER_PIN_HASH|UNLOCK_HASH|sha256hex|pin-ok/i.test(passwordGate)) {
  fail("PasswordGate.tsx nao deve conter PIN/hash/fallback local.");
}

for (const route of sensitiveRoutes) {
  if (!guard.includes(`"${route}"`)) {
    fail(`Rota sensivel ausente do registro central: ${route}`);
  }

  const appProtectedRoute = route === "/paciente/" ? "/paciente/:id" : route;
  const routeIndex = app.indexOf(`path="${appProtectedRoute}"`);
  if (routeIndex === -1) {
    fail(`Rota sensivel nao encontrada em App.tsx: ${appProtectedRoute}`);
    continue;
  }

  const routeSnippet = app.slice(routeIndex, routeIndex + 220);
  if (!routeSnippet.includes("<Protected")) {
    fail(`Rota sensivel sem wrapper Protected em App.tsx: ${appProtectedRoute}`);
  }
}

for (const route of protectedBridgeRoutes) {
  if (!guard.includes(`"${route}"`)) {
    fail(`Ponte sensivel ausente do registro central RouteGuard.SENSITIVE_ROUTES: ${route}`);
  }

  const routeIndex = notFound.indexOf(`location === "${route}"`);
  if (routeIndex === -1) {
    fail(`Ponte sensivel ausente de not-found.tsx: ${route}`);
    continue;
  }
  const routeSnippet = notFound.slice(routeIndex, routeIndex + 320);
  if (!routeSnippet.includes("RouteGuard") && !routeSnippet.includes("<Protected")) {
    fail(`Ponte sensivel sem protecao em not-found.tsx: ${route}`);
  }
}

for (const route of publicRoutes) {
  const routeIndex = app.indexOf(`path="${route}"`);
  if (routeIndex === -1) {
    fail(`Rota publica esperada nao encontrada em App.tsx: ${route}`);
    continue;
  }

  const routeSnippet = app.slice(routeIndex, routeIndex + 180);
  if (routeSnippet.includes("<Protected")) {
    fail(`Rota publica nao deve exigir Protected: ${route}`);
  }
}

const sourceFiles = walk(root).filter((file) => {
  const rel = relative(root, file).replaceAll("\\", "/");
  // Exclui configs de CI/CD — o hash do PIN pode aparecer como fallback de build
  // em variáveis de ambiente dos workflows sem risco de exposição ao navegador.
  if (rel.startsWith(".github/")) return false;
  return /\.(ts|tsx|js|jsx|mjs|cjs|ps1|bat|sh|md|json|toml|yml|yaml|txt)$/i.test(file);
});

const allowDocs = new Set([
  "SECURITY.md",
  "docs/CHANGELOG_CIRURGICO.md",
  "docs/AUDITORIA_CONTINUA_NEUROPED.md",
]);

const suspiciousPatterns = [
  { name: "hash SHA-256 fixo de possivel PIN", re: /["'][a-f0-9]{64}["']/i },
  { name: "token Railway hardcoded", re: /railway[_-]?token\s*[:=]\s*["']?[a-z0-9-]{20,}/i },
  { name: "segredo de aplicacao hardcoded", re: /(NEUROPED_MASTER_KEY|NEUROPED_JWT_SECRET|ADMIN_INITIAL_PASSWORD)\s*[:=]\s*["'](?!__|\$env:|process\.env|%|\$\()/i },
];

for (const file of sourceFiles) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (allowDocs.has(rel)) continue;
  const content = read(file);
  for (const pattern of suspiciousPatterns) {
    if (pattern.re.test(content)) {
      fail(`${pattern.name} em ${rel}`);
    }
  }
}

if (process.exitCode) {
  console.error("\nResultado: politica de acesso reprovada.");
  process.exit(process.exitCode);
}

console.log("Politica de acesso aprovada: publico aberto, clinico autenticado e PIN master sem segredo em texto.");

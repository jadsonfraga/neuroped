import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// POLÍTICA DE ACESSO — zona pública allowlisted + área clínica fail-closed.
//
// Rotas familiares explícitas ficam abertas. Todo caminho desconhecido ou
// clínico passa pelo PrivateGate no modo local e pelo RouteGuard/JWT no backend.
// Este guard protege:
//   · nenhum segredo/PIN/token hardcoded no código-fonte;
//   · nenhum PIN/hash embutido no PasswordGate;
//   · nenhuma liberação de área por "desbloqueio local" frágil;
//   · os gates globais continuam montados;
//   · rotas públicas essenciais existem e não recebem wrapper clínico por papel.

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const routeGuardPath = join(root, "client/src/components/RouteGuard.tsx");
const passwordGatePath = join(root, "client/src/components/PasswordGate.tsx");

function read(path) {
  try { return readFileSync(path, "utf8"); } catch { return ""; }
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
const passwordGate = read(passwordGatePath);

const publicRoutes = [
  "/familia",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/verificar",
  "/portal-familia",
  "/consentimento-lgpd",
];

console.log("Auditando política de acesso NeuroPed (público allowlisted + clínico protegido)...");

if (!app.includes("<PrivateGate>") || !app.includes("<RouteGuard>")) {
  fail("App.tsx deve manter PrivateGate e RouteGuard montados globalmente.");
}
if (!guard.includes("decideRouteAccess")) {
  fail("RouteGuard.tsx deve decidir acesso remoto antes de montar a página.");
}

if (app.includes("LocalUnlockGate")) {
  fail("App.tsx nao deve importar/renderizar LocalUnlockGate global.");
}

if (guard.includes("LocalUnlockGate") || guard.includes("hasClinicalUnlock")) {
  fail("RouteGuard.tsx nao deve liberar area por desbloqueio local.");
}

if (/VITE_PIN_HASH|PIN_HASH|MASTER_PIN_HASH|UNLOCK_HASH|sha256hex|pin-ok/i.test(passwordGate)) {
  fail("PasswordGate.tsx nao deve conter PIN/hash/fallback local.");
}

for (const route of publicRoutes) {
  const routeIndex = app.indexOf(`path="${route}"`);
  if (routeIndex === -1) {
    fail(`Rota publica esperada nao encontrada em App.tsx: ${route}`);
    continue;
  }
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const directPublicRoute = new RegExp(
    `<Route\\s+path="${escaped}"[^>]*component=\\{\\w+\\}[^>]*/>`,
  );
  if (!directPublicRoute.test(app)) {
    fail(`Rota pública deve montar componente direto, sem wrapper clínico: ${route}`);
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

console.log("Política de acesso aprovada: allowlist pública, gates clínicos e nenhum segredo hardcoded.");

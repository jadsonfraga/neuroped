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
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
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
  "/marcacao",
  "/eletroencefalograma",
  "/pre-consulta",
  "/pre-retorno",
  "/efeitos-colaterais",
  "/verificar",
  "/portal-familia",
  "/consentimento-lgpd",
];

console.log(
  "Auditando política de acesso NeuroPed (público allowlisted + clínico protegido)...",
);

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

if (
  /VITE_PIN_HASH|PIN_HASH|MASTER_PIN_HASH|UNLOCK_HASH|sha256hex|pin-ok/i.test(
    passwordGate,
  )
) {
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
    fail(
      `Rota pública deve montar componente direto, sem wrapper clínico: ${route}`,
    );
  }
}

const sourceFiles = walk(root).filter((file) => {
  return /\.(ts|tsx|js|jsx|mjs|cjs|ps1|bat|sh|md|json|toml|yml|yaml|txt)$/i.test(
    file,
  );
});

const allowDocs = new Set([
  "SECURITY.md",
  "docs/CHANGELOG_CIRURGICO.md",
  "docs/AUDITORIA_CONTINUA_NEUROPED.md",
]);

const suspiciousPatterns = [
  { name: "hash SHA-256 fixo de possivel PIN", re: /["'][a-f0-9]{64}["']/i },
  {
    name: "verificador de PIN hardcoded",
    re: /\bVITE_PIN_HASH\s*[:=]\s*["']?(?:pbkdf2\$[^\s"']+|[a-f0-9]{64})/i,
  },
  {
    name: "PIN literal hardcoded",
    re: /\b(?:MASTER_?PIN|PIN_MASTER|DEFAULT_PIN|HARDCODED_PIN)\b\s*[:=]\s*["'][^"'$\r\n]{4,}["']/i,
  },
  {
    name: "fallback literal de secret do GitHub",
    re: /\$\{\{\s*secrets\.[A-Z0-9_]+\s*\|\|\s*["'][^"']+["']\s*\}\}/i,
  },
  {
    name: "token Railway hardcoded",
    re: /railway[_-]?token\s*[:=]\s*["']?[a-z0-9-]{20,}/i,
  },
  {
    name: "segredo de aplicacao hardcoded",
    re: /(NEUROPED_MASTER_KEY|NEUROPED_JWT_SECRET|ADMIN_INITIAL_PASSWORD)\s*[:=]\s*["'](?!__|\$env:|process\.env|%|\$\()/i,
  },
];

const workflowSecretKeys = new Set([
  "VITE_PIN_HASH",
  "NEUROPED_MASTER_KEY",
  "NEUROPED_JWT_SECRET",
  "JWT_SECRET",
  "ADMIN_INITIAL_PASSWORD",
  "ADMIN_PW",
  "ADMIN_MAIL",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CF_TOKEN",
  "CF_ACCOUNT",
  "VERCEL_TOKEN",
  "VERCEL_ORG_ID",
  "VERCEL_PROJECT_ID",
  "CERT_P12_B64",
  "CERT_P12_PASSWORD",
  "CERT_B64",
  "CERT_PW",
  "RAILWAY_TOKEN",
]);
const githubSecretReference = /^["']?\$\{\{\s*secrets\.[A-Z0-9_]+\s*\}\}["']?$/;

function auditWorkflowSecretAssignments(rel, content) {
  if (!rel.startsWith(".github/workflows/") || !/\.ya?ml$/i.test(rel)) return;

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const assignment = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*:\s*(.*?)\s*$/);
    if (!assignment || !workflowSecretKeys.has(assignment[1])) continue;
    if (!githubSecretReference.test(assignment[2])) {
      fail(
        `secret/fallback literal em ${rel}:${index + 1} (${assignment[1]} deve referenciar apenas secrets.*)`,
      );
    }
  }
}

for (const file of sourceFiles) {
  const rel = relative(root, file).replaceAll("\\", "/");
  if (allowDocs.has(rel)) continue;
  const content = read(file);
  auditWorkflowSecretAssignments(rel, content);
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

console.log(
  "Política de acesso aprovada: allowlist pública, gates clínicos e nenhum segredo hardcoded.",
);

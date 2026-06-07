import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const routeGuardPath = join(root, "client/src/components/RouteGuard.tsx");
const localUnlockPath = join(root, "client/src/lib/localUnlock.ts");

function read(path) {
  return readFileSync(path, "utf8");
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

const app = read(appPath);
const guard = read(routeGuardPath);
const unlock = read(localUnlockPath);

const sensitiveRoutes = [
  "/pant",
  "/assinatura-digital",
  "/pacientes",
  "/paciente/",
  "/prontuario",
  "/calculadora-dose",
  "/farmacologia",
  "/satisfacao-medicacao",
  "/plano-terapeutico",
  "/plano-intervencao",
  "/avaliacao-multiprofissional",
  "/fichas-registro",
];

const publicRoutes = [
  "/",
  "/filtro",
  "/portal-familia",
  "/qualidade",
  "/pre-retorno",
  "/consentimento-lgpd",
];

console.log("🔐 Auditando política de acesso NeuroPed...");

if (app.includes("LocalUnlockGate")) {
  fail("App.tsx não deve importar/renderizar LocalUnlockGate global. O PIN deve ficar apenas em RouteGuard.");
}

if (app.includes("isAppUnlocked") || app.includes("localUnlockEventName")) {
  fail("App.tsx não deve depender de isAppUnlocked/localUnlockEventName para abrir a casca pública.");
}

if (!guard.includes("export const SENSITIVE_ROUTES")) {
  fail("RouteGuard.tsx deve exportar SENSITIVE_ROUTES como registro central.");
}

if (!guard.includes("hasClinicalUnlock")) {
  fail("RouteGuard.tsx deve usar hasClinicalUnlock para PIN master local nas rotas sensíveis.");
}

if (!guard.includes("LocalUnlockGate")) {
  fail("RouteGuard.tsx deve renderizar LocalUnlockGate para rotas sensíveis quando necessário.");
}

for (const route of sensitiveRoutes) {
  if (!guard.includes(`"${route}"`)) {
    fail(`Rota sensível ausente do registro central: ${route}`);
  }

  const appProtectedRoute = route === "/paciente/" ? "/paciente/:id" : route;
  const routeIndex = app.indexOf(`path="${appProtectedRoute}"`);
  if (routeIndex === -1) {
    fail(`Rota sensível não encontrada em App.tsx: ${appProtectedRoute}`);
    continue;
  }

  const routeSnippet = app.slice(routeIndex, routeIndex + 180);
  if (!routeSnippet.includes("<Protected")) {
    fail(`Rota sensível sem wrapper Protected em App.tsx: ${appProtectedRoute}`);
  }
}

for (const route of publicRoutes) {
  const routeIndex = app.indexOf(`path="${route}"`);
  if (routeIndex === -1) {
    fail(`Rota pública esperada não encontrada em App.tsx: ${route}`);
    continue;
  }

  const routeSnippet = app.slice(routeIndex, routeIndex + 180);
  if (routeSnippet.includes("<Protected")) {
    fail(`Rota pública não deve exigir PIN/Protected: ${route}`);
  }
}

if (!/export function isAppUnlocked\(\): boolean\s*{[\s\S]*return true;/.test(unlock)) {
  fail("isAppUnlocked() deve permanecer true para manter a casca pública aberta.");
}

if (!unlock.includes("export function hasClinicalUnlock")) {
  fail("hasClinicalUnlock() deve existir para proteger áreas sensíveis.");
}

if (process.exitCode) {
  console.error("\nResultado: política de acesso reprovada.");
  process.exit(process.exitCode);
}

console.log("✅ Política de acesso aprovada: app público aberto, PIN reservado às rotas sensíveis.");

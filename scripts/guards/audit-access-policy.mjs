import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const routeGuardPath = join(root, "client/src/components/RouteGuard.tsx");
const localUnlockPath = join(root, "client/src/lib/localUnlock.ts");
const localUnlockGatePath = join(root, "client/src/components/LocalUnlockGate.tsx");
const notFoundPath = join(root, "client/src/pages/not-found.tsx");

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
const unlockGate = read(localUnlockGatePath);
const notFound = read(notFoundPath);

const CURRENT_PIN_HASH = "c578adbb17446d51d8cb58e05d5e83fcc41c3a85771b207db0f2f7e5d530f4fd";
const OLD_PIN_HASHES = [
  "d48b2da02ca999eddf04ea7acc0f5673423f2cf618c014bf3863f4452a6ec207",
];

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

const protectedBridgeRoutes = ["/documentos"];

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

if (!app.includes("function getCurrentHashPath")) {
  fail("App.tsx deve ter getCurrentHashPath() para evitar onboarding bloqueando rotas diretas.");
}

if (!app.includes('if (currentPath !== "/") return;')) {
  fail("Onboarding automático só deve aparecer na Home; rotas diretas públicas não podem ser cobertas pelo tour inicial.");
}

if (!unlock.includes(CURRENT_PIN_HASH)) {
  fail("localUnlock.ts não contém o hash autorizado atual do PIN master.");
}

for (const oldHash of OLD_PIN_HASHES) {
  if (unlock.includes(oldHash)) {
    fail("localUnlock.ts ainda contém hash antigo de PIN master.");
  }
}

if (/Clarice11@08|vasco1108/i.test(unlock) || /Clarice11@08|vasco1108/i.test(unlockGate)) {
  fail("PIN master não deve aparecer em texto claro no código-fonte.");
}

if (/maiúsculas|maiusculas|símbolo|simbolo|números|numeros/i.test(unlockGate)) {
  fail("Mensagem de senha incorreta não deve dar pistas sobre composição da senha.");
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

if (!guard.includes("localUnlockEventName") || !guard.includes("addEventListener(localUnlockEventName")) {
  fail("RouteGuard.tsx deve escutar localUnlockEventName para reagir a lockApp()/unlockApp().");
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

  const routeSnippet = app.slice(routeIndex, routeIndex + 220);
  if (!routeSnippet.includes("<Protected")) {
    fail(`Rota sensível sem wrapper Protected em App.tsx: ${appProtectedRoute}`);
  }
}

for (const route of protectedBridgeRoutes) {
  if (!guard.includes(`"${route}"`)) {
    fail(`Ponte sensível ausente do registro central RouteGuard.SENSITIVE_ROUTES: ${route}`);
  }

  const routeIndex = notFound.indexOf(`location === "${route}"`);
  if (routeIndex === -1) {
    fail(`Ponte sensível ausente de not-found.tsx: ${route}`);
    continue;
  }
  const routeSnippet = notFound.slice(routeIndex, routeIndex + 320);
  if (!routeSnippet.includes("RouteGuard") && !routeSnippet.includes("<Protected")) {
    fail(`Ponte sensível sem proteção em not-found.tsx: ${route}`);
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

if (!unlock.includes("detail: { unlocked: hasClinicalUnlock() }")) {
  fail("Evento de lock/unlock deve emitir hasClinicalUnlock(), não isAppUnlocked().");
}

if (process.exitCode) {
  console.error("\nResultado: política de acesso reprovada.");
  process.exit(process.exitCode);
}

console.log("✅ Política de acesso aprovada: app público aberto, PIN reservado às rotas sensíveis.");

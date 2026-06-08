import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const navigationPath = join(root, "client/src/data/navigation.ts");
const appPath = join(root, "client/src/App.tsx");

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function read(path) {
  return readFileSync(path, "utf8");
}

function normalizeRoute(route) {
  if (route === "/") return "/";
  return route.replace(/\/$/, "");
}

function extractNavigationHrefs(source) {
  const matches = [...source.matchAll(/href:\s*["']([^"']+)["']/g)];
  return [...new Set(matches.map((match) => normalizeRoute(match[1])))].sort();
}

function extractAppRoutes(source) {
  const matches = [...source.matchAll(/<Route\s+path=["']([^"']+)["']/g)];
  return [...new Set(matches.map((match) => normalizeRoute(match[1])))].sort();
}

function routeExists(href, appRoutes) {
  if (appRoutes.includes(href)) return true;

  // /paciente/:id covers deep patient detail paths used in navigation/search.
  for (const appRoute of appRoutes) {
    if (!appRoute.includes(":")) continue;
    const prefix = appRoute.split(":")[0].replace(/\/$/, "");
    if (href === prefix || href.startsWith(`${prefix}/`)) return true;
  }

  return false;
}

console.log("🧭 Auditando rotas da navegação NeuroPed...");

const navigation = read(navigationPath);
const app = read(appPath);
const hrefs = extractNavigationHrefs(navigation);
const appRoutes = extractAppRoutes(app);

if (hrefs.length === 0) fail("Nenhum href encontrado em client/src/data/navigation.ts.");
if (appRoutes.length === 0) fail("Nenhuma rota encontrada em client/src/App.tsx.");

for (const href of hrefs) {
  if (!href.startsWith("/")) {
    fail(`Link de navegação deve ser rota interna absoluta: ${href}`);
    continue;
  }

  if (!routeExists(href, appRoutes)) {
    fail(`Link de navegação sem rota registrada: ${href}`);
  }
}

if (navigation.includes("/efeitos-colaterais") && !appRoutes.includes("/efeitos-colaterais")) {
  fail("/efeitos-colaterais aparece na navegação, mas não está registrado em App.tsx.");
}

if (process.exitCode) {
  console.error("\nResultado: navegação reprovada.");
  process.exit(process.exitCode);
}

console.log("✅ Navegação aprovada: todos os itens do menu apontam para rotas registradas.");

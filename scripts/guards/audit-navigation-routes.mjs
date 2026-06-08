import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const navigationPath = resolve("client/src/data/navigation.ts");
const appPath = resolve("client/src/App.tsx");

const navigationSource = readFileSync(navigationPath, "utf8");
const appSource = readFileSync(appPath, "utf8");

const hrefs = [...navigationSource.matchAll(/href:\s*["']([^"']+)["']/g)].map((match) => match[1]);
const routePaths = [...appSource.matchAll(/<Route\b[^>]*\bpath=["']([^"']+)["']/g)].map((match) => match[1]);

function normalizePath(path) {
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

function routeCoversHref(routePath, href) {
  const normalizedRoute = normalizePath(routePath);
  const normalizedHref = normalizePath(href);

  if (normalizedRoute === normalizedHref) return true;
  if (!normalizedRoute.includes(":")) return false;

  const routeSegments = normalizedRoute.split("/").filter(Boolean);
  const hrefSegments = normalizedHref.split("/").filter(Boolean);

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const hrefSegment = hrefSegments[index];

    if (routeSegment.startsWith(":")) {
      // A dynamic route such as /paciente/:id covers concrete menu links under
      // /paciente/ and also the prefix used by some menus while composing IDs.
      return hrefSegments.length >= index;
    }

    if (routeSegment !== hrefSegment) return false;
  }

  return false;
}

const missingHrefs = [...new Set(hrefs)].filter(
  (href) => !routePaths.some((routePath) => routeCoversHref(routePath, href)),
);

if (missingHrefs.length > 0) {
  for (const href of missingHrefs) {
    console.error(`❌ Link de navegação sem rota registrada: ${href}`);
  }
  process.exit(1);
}

console.log("✅ Navegação aprovada: todos os itens do menu apontam para rotas registradas.");

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { routePatternMatches } from "./lib/route-matcher.mjs";

const navigationPath = resolve("client/src/data/navigation.ts");
const appPath = resolve("client/src/App.tsx");

const navigationSource = readFileSync(navigationPath, "utf8");
const appSource = readFileSync(appPath, "utf8");

const hrefs = [...navigationSource.matchAll(/href:\s*["']([^"']+)["']/g)].map(
  (match) => match[1],
);
const routePaths = [
  ...appSource.matchAll(/<Route\b[^>]*\bpath=["']([^"']+)["']/g),
].map((match) => match[1]);

// Microsites estáticos são servidos diretamente pelo servidor/CDN e não
// aparecem como <Route> no App.tsx. Mantemos a exceção explícita para que a
// auditoria continue acusando links React quebrados.
const staticMicrositeHrefs = new Set(["/nesplora/"]);
const missingHrefs = [...new Set(hrefs)].filter(
  (href) =>
    !staticMicrositeHrefs.has(href) &&
    !routePaths.some((routePath) => routePatternMatches(routePath, href)),
);

if (missingHrefs.length > 0) {
  for (const href of missingHrefs) {
    console.error(`❌ Link de navegação sem rota registrada: ${href}`);
  }
  process.exit(1);
}

console.log(
  "✅ Navegação aprovada: todos os itens do menu apontam para rotas registradas.",
);

// @ts-check
/**
 * validate-public-split.mjs — Catraca da separação PÚBLICO × MÉDICO.
 *
 * Trava o invariante de segurança: rotas clínicas/sensíveis NUNCA podem cair na
 * allowlist pública (que dispensa PIN/JWT). A allowlist é exata: uma nova
 * subrota não herda acesso público silenciosamente.
 *
 * Executado via tsx: npm run validate:public (e dentro de `npm run verify`).
 */
import { readFileSync } from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const { isPublicRoute, normalizePath, PUBLIC_ROUTES } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/lib/publicRoutes.ts")).href
);
const appSource = readFileSync(resolve(repoRoot, "client/src/App.tsx"), "utf8");
const registeredRoutes = new Set(
  [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]),
);

// Rotas que DEVEM ficar SEMPRE atrás do PIN (nunca públicas).
const MUST_BE_GATED = [
  "/", "/pacientes", "/prontuario", "/recepcao", "/agenda",
  "/receita-c1", "/receita-c1-express", "/laudo-neuroped", "/documentos",
  "/medicamentos", "/farmacologia", "/calculadora-dose", "/valores-referencia",
  "/pant", "/fichas-registro", "/prescricao",
  "/diario-escola", "/inventarios-escola", "/assinatura-digital",
  "/plano-terapeutico", "/plano-intervencao",
  "/mchat", "/cars", "/denver", "/vineland", "/bayley", "/wisc5",
];

// Rotas que DEVEM ficar públicas (para as famílias).
const MUST_BE_PUBLIC = [
  "/login", "/sessao-expirada", "/familia", "/agendar", "/pre-consulta", "/pre-retorno", "/efeitos-colaterais", "/verificar",
  "/orientacao-parental", "/glossario", "/portal-familia",
  "/portal-familia/novidades", "/portal-familia/acesso",
  "/marcos-desenvolvimento", "/curvas-crescimento", "/caa",
  "/sobre", "/sobre-neuroped", "/termos", "/ajuda", "/acessibilidade", "/consentimento-lgpd",
  // Filtro Clínico de Escalas: recomenda escalas por queixa/idade, sem exibir
  // nem armazenar dado de paciente — aberto por decisão do autor.
  "/filtro", "/filtro-escalas",
];

const errors = [];
const expectedPublicRouteSet = new Set(MUST_BE_PUBLIC);

for (const route of MUST_BE_GATED) {
  if (isPublicRoute(route)) {
    errors.push(`Rota sensível "${route}" está PÚBLICA — deveria exigir PIN.`);
  }
}
for (const route of MUST_BE_PUBLIC) {
  if (!isPublicRoute(route)) {
    errors.push(`Rota de família "${route}" NÃO está pública — famílias ficariam travadas.`);
  }
}

if (new Set(PUBLIC_ROUTES).size !== PUBLIC_ROUTES.length) {
  errors.push("A allowlist pública contém rotas duplicadas.");
}

for (const route of PUBLIC_ROUTES) {
  if (!expectedPublicRouteSet.has(route)) {
    errors.push(`Rota pública não aprovada pelo contrato independente: "${route}".`);
  }
  if (normalizePath(route) !== route || route.includes(":") || route.includes("*")) {
    errors.push(`Entrada pública não canônica ou dinâmica: "${route}".`);
  }
  if (!registeredRoutes.has(route)) {
    errors.push(`Entrada pública sem rota correspondente em App.tsx: "${route}".`);
  }

  const descendantProbe = `${route}/__neuroped_access_regression_probe__`;
  if (isPublicRoute(descendantProbe)) {
    errors.push(
      `A subrota futura "${descendantProbe}" herdou acesso público de "${route}".`,
    );
  }
}

for (const registeredRoute of registeredRoutes) {
  const samplePath = registeredRoute.replace(/:[^/]+/g, "__test_param__");
  const expectedPublic = expectedPublicRouteSet.has(registeredRoute);
  if (isPublicRoute(samplePath) !== expectedPublic) {
    errors.push(
      `Classificação divergente em App.tsx: "${registeredRoute}" deveria ser ${expectedPublic ? "pública" : "clínica"}.`,
    );
  }
}

if (errors.length) {
  console.error(`\n[public-split] ✗ ${errors.length} problema(s):`);
  for (const error of errors) console.error(`  · ${error}`);
  console.error("\nRevise a allowlist em client/src/lib/publicRoutes.ts.");
  process.exit(1);
}

console.log(
  `[public-split] ✓ ${PUBLIC_ROUTES.length} rotas públicas exatas; ${MUST_BE_GATED.length} rotas sensíveis confirmadas atrás dos gates clínicos.`,
);

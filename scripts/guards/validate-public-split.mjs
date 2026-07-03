// @ts-check
/**
 * validate-public-split.mjs — Catraca da separação PÚBLICO × MÉDICO.
 *
 * Trava o invariante de segurança: rotas clínicas/sensíveis NUNCA podem cair na
 * allowlist pública (que dispensa o PIN). Se alguém adicionar, por engano, uma
 * rota de receita/prontuário/escala à lista pública, o CI falha.
 *
 * Executado via tsx:  npm run validate:public  (e dentro de `npm run verify`)
 */
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");

const { isPublicRoute, PUBLIC_ROUTE_PREFIXES } = await import(
  pathToFileURL(resolve(repoRoot, "client/src/lib/publicRoutes.ts")).href
);

// Rotas que DEVEM ficar SEMPRE atrás do PIN (nunca públicas).
const MUST_BE_GATED = [
  "/", "/filtro", "/filtro-escalas", "/pacientes", "/prontuario",
  "/receita-c1", "/receita-c1-express", "/laudo-neuroped", "/documentos",
  "/medicamentos", "/farmacologia", "/calculadora-dose", "/valores-referencia",
  "/pant", "/fichas-registro", "/prescricao", "/verificar",
  "/mchat", "/cars", "/denver", "/vineland", "/bayley", "/wisc5",
];

// Rotas que DEVEM ficar públicas (para as famílias).
const MUST_BE_PUBLIC = [
  "/orientacao-parental", "/glossario", "/portal-familia",
  "/marcos-desenvolvimento", "/curvas-crescimento", "/caa",
  "/sobre", "/ajuda", "/acessibilidade", "/consentimento-lgpd",
];

const errors = [];

for (const r of MUST_BE_GATED) {
  if (isPublicRoute(r)) errors.push(`Rota sensível "${r}" está PÚBLICA — deveria exigir PIN.`);
}
for (const r of MUST_BE_PUBLIC) {
  if (!isPublicRoute(r)) errors.push(`Rota de família "${r}" NÃO está pública — famílias ficariam travadas.`);
}

if (errors.length) {
  console.error(`\n[public-split] ✗ ${errors.length} problema(s):`);
  for (const e of errors) console.error(`  · ${e}`);
  console.error(`\nRevise a allowlist em client/src/lib/publicRoutes.ts.`);
  process.exit(1);
}

console.log(`[public-split] ✓ ${PUBLIC_ROUTE_PREFIXES.length} rotas públicas; ${MUST_BE_GATED.length} rotas sensíveis confirmadas atrás do PIN.`);

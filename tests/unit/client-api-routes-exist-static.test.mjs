// Guard (diagnóstico 07/11/2026, achado 1): toda rota /api/* citada no código
// do cliente precisa existir nas Cloudflare Pages Functions (produção
// canônica), salvo exceções explícitas e justificadas abaixo. A ficha do
// paciente chamava /api/clinical-core/events, que só existe no adaptador
// Express; os testes passavam porque a API sintética simulava a rota.
// Limite: confere a existência do caminho, não o método HTTP exportado.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Rotas que NÃO devem existir nas Functions, cada uma com o motivo.
const ALLOWED_NON_FUNCTION_ROUTES = new Map([
  // Clinical Core legado: só modo local/Express. Em LIVE o cliente usa
  // /api/live/events (client/src/lib/clinicalEventsSource.ts, PR #1280).
  ["/api/clinical-core/events", "modo local (Express); LIVE usa /api/live/events"],
  // Upload em object storage: só Express. Em LIVE, PDFs vão para
  // /api/live/documents (clinicalDocumentsClient.archiveInClinicalLive).
  ["/api/files", "modo local (Express); LIVE arquiva em /api/live/documents"],
  ["/api/files/sign-upload", "modo local (Express); LIVE arquiva em /api/live/documents"],
  ["/api/files/:param", "modo local (Express); LIVE arquiva em /api/live/documents"],
  // Conecta legado: GET/DELETE por evento só no Express; em LIVE a tela é
  // bloqueada antes de montar (LiveLegacyBlockedNotice, PR #1282).
  ["/api/conecta/events/:param", "modo local (Express); Conecta bloqueado em LIVE"],
  // SNCR/Anvisa: host externo (SNCR_API_URL), não é rota deste backend.
  ["/api/v1/auth/login", "API externa SNCR"],
  ["/api/v1/auth/token", "API externa SNCR"],
  ["/api/v1/receita-branca", "API externa SNCR"],
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(full);
  }
  return out;
}

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n");
}

// Pages Functions: X.ts, X/index.ts, [param].ts / [param]/ e [[catchall]].
// Segmento ":param" (vindo de `${...}` no cliente) só casa rota dinâmica.
function functionRouteExists(path) {
  const segments = path.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  function resolve(dir, rest) {
    if (rest.length === 0) return existsSync(join(dir, "index.ts"));
    if (!existsSync(dir)) return false;
    const entries = readdirSync(dir);
    if (entries.some((e) => /^\[\[.+\]\](\.ts)?$/.test(e))) return true;
    const [head, ...tail] = rest;
    const dynamicHead = head === ":param";
    if (!dynamicHead) {
      if (tail.length === 0 && entries.includes(`${head}.ts`)) return true;
      if (entries.includes(head) && statSync(join(dir, head)).isDirectory() && resolve(join(dir, head), tail)) return true;
    }
    for (const e of entries) {
      if (/^\[[^\]]+\]\.ts$/.test(e) && tail.length === 0) return true;
      if (/^\[[^\]]+\]$/.test(e) && statSync(join(dir, e)).isDirectory() && resolve(join(dir, e), tail)) return true;
    }
    return false;
  }
  return resolve("functions/api", segments);
}

/**
 * Extrai o caminho /api/... de literais e templates, inclusive depois de uma
 * base interpolada (`${API_BASE}/api/...`). Cada segmento com `${...}` vira
 * ":param"; a consulta (?...) e o fragmento são descartados.
 */
export function extractApiPaths(src) {
  const paths = [];
  for (const match of src.matchAll(/["'`](?:\$\{[^}]*\})?(\/api\/(?:[A-Za-z0-9_\-/]|\$\{[^}]*\})*)/g)) {
    const raw = match[1].replace(/\/+$/, "");
    const normalized = raw
      .split("/")
      .map((segment) => (segment.includes("${") ? ":param" : segment))
      .join("/");
    paths.push(normalized);
  }
  return paths;
}

// Autoverificação do extrator (achado de revisão na #1284): base interpolada e
// segmentos dinâmicos com sufixo não podem escapar do guard.
assert.deepEqual(extractApiPaths("fetch(`${API_BASE}/api/auth/login`)"), ["/api/auth/login"]);
assert.deepEqual(extractApiPaths("`/api/tenants/${clinicId}/members`"), ["/api/tenants/:param/members"]);
assert.deepEqual(extractApiPaths("`/api/live/patients/${encodeURIComponent(id)}?clinicId=${c}`"), ["/api/live/patients/:param"]);
assert.deepEqual(extractApiPaths('"/api/patients"'), ["/api/patients"]);

const found = new Map();
for (const file of walk("client/src")) {
  const src = stripComments(readFileSync(file, "utf8"));
  for (const path of extractApiPaths(src)) {
    if (!found.has(path)) found.set(path, file);
  }
}
assert.ok(found.size > 20, "o scanner encontrou as rotas do cliente");

const missing = [];
for (const [path, file] of found) {
  if (ALLOWED_NON_FUNCTION_ROUTES.has(path)) continue;
  if (!functionRouteExists(path)) missing.push(`${path} (${file})`);
}
assert.deepEqual(missing, [], `rotas do cliente sem Function de produção:\n${missing.join("\n")}`);

// Exceção obsoleta precisa sair da lista: se a rota passar a existir nas
// Functions, a justificativa deixou de valer.
for (const path of ALLOWED_NON_FUNCTION_ROUTES.keys()) {
  if (path.startsWith("/api/v1/")) continue;
  assert.equal(functionRouteExists(path), false, `${path} já existe nas Functions; remova a exceção`);
}

console.log(`✓ ${found.size} rotas /api do cliente resolvem para Functions de produção (${ALLOWED_NON_FUNCTION_ROUTES.size} exceções justificadas)`);

// @ts-check
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";

const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

/** Fontes que, se mudarem, invalidam o build servido aos gates de navegador. */
const BUILD_INPUTS = ["client", "vite.config.ts", "tailwind.config.ts", "postcss.config.js", "index.html"];

/**
 * Timestamp de modificação mais recente sob `path`, ignorando o que não entra no
 * bundle (node_modules e o próprio dist). Retorna 0 quando o caminho não existe.
 */
function newestMtime(path) {
  if (!existsSync(path)) return 0;
  const stats = statSync(path);
  if (!stats.isDirectory()) return stats.mtimeMs;
  let newest = stats.mtimeMs;
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const child = newestMtime(join(path, entry.name));
    if (child > newest) newest = child;
  }
  return newest;
}

/**
 * Perfis de build servidos aos gates de navegador.
 *
 * `open` reproduz a instalação sem backend obrigatório (a maioria dos gates:
 * a11y, Lighthouse, prova visual pública). `authenticated` reproduz a produção
 * canônica — login remoto obrigatório e nenhuma tranca de UI dispensável — e é
 * o único perfil capaz de certificar o cockpit clínico depois do login.
 */
export const BUILD_PROFILES = {
  open: {
    VITE_AUTH_MODE: "auto",
    VITE_API_URL: "",
    VITE_ZONE: "full",
  },
  authenticated: {
    VITE_AUTH_MODE: "remote",
    VITE_OPEN_ACCESS: "false",
    VITE_API_URL: "",
    VITE_ZONE: "full",
  },
};

const BUILD_MARKER = ".audit-build-profile.json";

export function ensureClientBuild(repoRoot, profileName = "open") {
  const profile = BUILD_PROFILES[profileName];
  if (!profile) throw new Error(`Perfil de build desconhecido: ${profileName}`);
  const dist = resolve(repoRoot, "dist/public");
  const indexHtml = resolve(dist, "index.html");
  const markerPath = resolve(dist, BUILD_MARKER);
  // Antes esta função só reconstruía quando dist/public NÃO existia. Um dist
  // deixado por uma execução anterior era servido como se fosse o código atual,
  // então a11y e Lighthouse podiam aprovar (ou reprovar) fonte que já não é o
  // do repositório — o resultado dependia de sobra em disco, não do commit.
  // Reconstruir quando qualquer entrada do bundle é mais nova que o build torna
  // o gate determinístico.
  const built = existsSync(indexHtml) ? statSync(indexHtml).mtimeMs : 0;
  const newestSource = Math.max(...BUILD_INPUTS.map((input) => newestMtime(resolve(repoRoot, input))));
  // O perfil de build também invalida o dist: um build `authenticated` deixado
  // em disco redireciona todo o app para /login e faria um gate `open` medir
  // uma tela de login achando que mediu o app.
  let builtProfile = null;
  try {
    builtProfile = JSON.parse(readFileSync(markerPath, "utf8")).profile ?? null;
  } catch {
    builtProfile = null;
  }
  const reason = built === 0
    ? "dist/public ausente"
    : newestSource > built
      ? "fonte mais novo que o build"
      : builtProfile !== profileName
        ? `build atual é do perfil "${builtProfile ?? "desconhecido"}", necessário "${profileName}"`
        : null;
  if (reason) {
    console.log(`[browser-audit] ${reason} - executando build:client (perfil ${profileName}).`);
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    execFileSync(npm, ["run", "build:client"], {
      cwd: repoRoot,
      stdio: "inherit",
      // Windows does not execute .cmd shims through CreateProcess when
      // execFileSync is called without a shell. The browser audits must be
      // able to rebuild a stale dist on both the developer machine and CI.
      shell: process.platform === "win32",
      env: {
        ...process.env,
        ...profile,
      },
    });
    writeFileSync(
      markerPath,
      `${JSON.stringify({ profile: profileName, env: profile, builtAt: new Date().toISOString() }, null, 2)}\n`,
    );
  }
  return dist;
}

// Espelha client/public/_headers (produção Cloudflare) + o middleware das
// Functions. Antes o servidor de auditoria mandava `no-store` em TUDO, inclusive
// no documento HTML e nos bundles JS — o que fazia o Lighthouse reprovar bf-cache
// (MainResourceHasCacheControlNoStore / JsNetworkRequestReceivedCacheControlNoStore)
// medindo uma política de cache que NÃO é a de produção. Em produção o documento
// é `no-cache` e os assets com hash são `immutable`, e nenhum bloqueia bf-cache.
function cacheControlFor(pathname) {
  if (pathname === "/sw.js" || pathname === "/sw-build.js") return "no-cache, no-store, must-revalidate";
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  // documento, manifest e demais estáticos: revalida, mas pode ser guardado —
  // compatível com bf-cache, fiel ao _headers.
  return "no-cache";
}

/**
 * @param {string} root
 * @param {number|{port?: number, apiHandler?: (request: any, response: any, pathname: string, searchParams: URLSearchParams) => Promise<boolean>}} [options]
 *   Número mantém a assinatura histórica (porta preferida). O objeto habilita
 *   `apiHandler`, usado pela prova visual autenticada para servir o contrato
 *   clínico sintético na mesma origem do bundle — sem isso o app não sai do gate
 *   de login e a auditoria só certifica a tela pública.
 */
export async function startStaticServer(root, options = 4173) {
  const { port: preferredPort = 4173, apiHandler = null } = typeof options === "number"
    ? { port: options }
    : options;
  const rootPrefix = `${resolve(root)}${sep}`;
  const server = createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url ?? "/", "http://audit.local");
      const pathname = decodeURIComponent(requestUrl.pathname);
      if (apiHandler && pathname.startsWith("/api/")) {
        void Promise.resolve(apiHandler(request, response, pathname, requestUrl.searchParams))
          .then((handled) => {
            if (!handled && !response.writableEnded) response.writeHead(404).end("Not found");
          })
          .catch((error) => {
            if (!response.writableEnded) {
              response.writeHead(500).end(error instanceof Error ? error.message : String(error));
            }
          });
        return;
      }
      if (pathname === "/api/health") {
        // Capacidade não-sensível, buscada em todo carregamento: `no-cache`
        // (não `no-store`) para não bloquear bf-cache — igual ao middleware real.
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
        response.end(JSON.stringify({ status: "ok", authentication: { required: false, configured: false } }));
        return;
      }
      if (pathname === "/api/auth/me") {
        // Endpoint sensível (dados do usuário): mantém `no-store`, fiel à
        // política de produção. Não é buscado no load quando auth não é exigido.
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        response.end(JSON.stringify({ id: "browser-audit", email: "audit@localhost", name: "Auditoria local", role: "admin" }));
        return;
      }
      const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const target = resolve(root, relative);
      if (!target.startsWith(rootPrefix) || !existsSync(target)) {
        response.writeHead(404).end("Not found");
        return;
      }
      const body = readFileSync(target);
      const acceptsGzip = /\bgzip\b/.test(String(request.headers["accept-encoding"] ?? ""));
      const compressible = /\.(?:css|html|js|json|svg)$/.test(target) && body.length >= 1024;
      const payload = acceptsGzip && compressible ? gzipSync(body, { level: 6 }) : body;
      response.writeHead(200, {
        "Content-Type": MIME[extname(target)] ?? "application/octet-stream",
        "Cache-Control": cacheControlFor(pathname),
        "Vary": "Accept-Encoding",
        ...(payload !== body ? { "Content-Encoding": "gzip" } : {}),
      });
      response.end(payload);
    } catch (error) {
      response.writeHead(500).end(error instanceof Error ? error.message : String(error));
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(preferredPort, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Servidor de auditoria sem porta TCP.");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}

/**
 * Diretórios de browser gerenciado, na ordem em que um Chromium instalado na
 * imagem costuma aparecer. `PLAYWRIGHT_BROWSERS_PATH=0` significa "ao lado do
 * pacote" e não é um diretório de busca.
 */
function managedBrowserRoots() {
  const configured = process.env.PLAYWRIGHT_BROWSERS_PATH?.trim();
  const roots = [];
  if (configured && configured !== "0") roots.push(configured);
  roots.push("/opt/pw-browsers", "/ms-playwright");
  return roots.filter((root, index) => root && roots.indexOf(root) === index && existsSync(root));
}

/** Chromium completo antes do headless shell: o shell não serve a todos os gates. */
const MANAGED_BINARIES = [
  ["chromium-", join("chrome-linux", "chrome")],
  ["chromium-", join("chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium")],
  ["chromium_headless_shell-", join("chrome-headless-shell-linux64", "chrome-headless-shell")],
];

const SYSTEM_BINARIES = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

/** Revisão mais alta primeiro: `chromium-1194` vence `chromium-985`. */
function revisionOf(name) {
  const digits = /-(\d+)$/.exec(name);
  return digits ? Number(digits[1]) : 0;
}

/**
 * Melhor binário de browser gerenciado sob `roots`, ou `null`.
 * Exportada para que a regressão possa exercitar a descoberta com uma árvore
 * sintética, sem depender do que a máquina tem instalado.
 */
export function discoverManagedChromium(roots = managedBrowserRoots()) {
  for (const [prefix, relative] of MANAGED_BINARIES) {
    const candidates = [];
    for (const root of roots) {
      if (!existsSync(root)) continue;
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith(prefix)) continue;
        const binary = join(root, entry.name, relative);
        if (existsSync(binary)) candidates.push({ binary, revision: revisionOf(entry.name) });
      }
    }
    candidates.sort((a, b) => b.revision - a.revision);
    if (candidates.length) return candidates[0].binary;
  }
  return null;
}

/**
 * Caminho do Chromium usado por todas as auditorias de navegador, ou `null`
 * quando não existe nenhum.
 *
 * Antes cada gate resolvia isto sozinho e só enxergava duas fontes: a variável
 * `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` e o browser gerenciado exatamente na
 * revisão que o Playwright instalado espera. Imagens que já trazem um Chromium
 * em outra revisão (o caso de runners com download de browser desligado) caíam
 * no caminho "Chromium indisponível" — e gates que ignoram o browser ausente
 * ficavam verdes sem medir nada. Procurar o binário que a imagem realmente tem
 * é o que faz a prova visual existir nesses ambientes.
 *
 * A variável explícita continua tendo precedência absoluta, inclusive quando
 * aponta para um caminho inexistente: o erro do launch é a resposta correta a
 * uma configuração errada, não um fallback silencioso.
 */
export function resolveAuditChromiumPath() {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim();
  if (configured) return configured;

  try {
    const { chromium } = createRequire(import.meta.url)("playwright");
    const managed = chromium.executablePath();
    if (managed && existsSync(managed)) return managed;
  } catch {
    // Playwright ausente ou sem browser registrado: as buscas abaixo decidem.
  }

  const discovered = discoverManagedChromium();
  if (discovered) return discovered;

  for (const variable of ["CHROME_PATH", "LIGHTHOUSE_CHROME_PATH"]) {
    const candidate = process.env[variable]?.trim();
    if (candidate && existsSync(candidate)) return candidate;
  }

  return SYSTEM_BINARIES.find((binary) => existsSync(binary)) ?? null;
}

/**
 * Opções de launch do Chromium das auditorias.
 *
 * O executável vem de `resolveAuditChromiumPath()`. Quando nada é encontrado o
 * launch segue sem `executablePath` para que o Playwright produza a sua própria
 * mensagem de instalação — nenhum gate deve inventar um binário.
 */
export function auditBrowserLaunchOptions(extra = {}) {
  const executablePath = resolveAuditChromiumPath();
  return {
    headless: true,
    ...(executablePath
      ? { executablePath, args: ["--no-sandbox", "--disable-dev-shm-usage"] }
      : {}),
    ...extra,
  };
}

export function isMissingBrowserError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /executable doesn.t exist|browser.*not found|could not find chrome|install.*chrom/i.test(message);
}

export const ACCEPTED_FIRST_VISIT_STORAGE = {
  "neuroped:aviso-educativo-aceito-v1": "browser-audit",
  "neuroped:onboarding-seen": "1",
  "np_tour_intro_v2": "done",
  "np_tour_v2_done": "1",
};

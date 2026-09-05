// @ts-check
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
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

export async function startStaticServer(root, preferredPort = 4173) {
  const rootPrefix = `${resolve(root)}${sep}`;
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://audit.local").pathname);
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

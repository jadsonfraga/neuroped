// @ts-check
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
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

export function ensureClientBuild(repoRoot) {
  const dist = resolve(repoRoot, "dist/public");
  if (!existsSync(resolve(dist, "index.html"))) {
    console.log("[browser-audit] dist/public ausente - executando build:client.");
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";
    execFileSync(npm, ["run", "build:client"], { cwd: repoRoot, stdio: "inherit" });
  }
  return dist;
}

export async function startStaticServer(root, preferredPort = 4173) {
  const rootPrefix = `${resolve(root)}${sep}`;
  const server = createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://audit.local").pathname);
      if (pathname === "/api/health") {
        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        response.end(JSON.stringify({ status: "ok", authentication: { required: false, configured: false } }));
        return;
      }
      if (pathname === "/api/auth/me") {
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
        "Cache-Control": "no-store",
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

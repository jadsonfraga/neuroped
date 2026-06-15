/**
 * Gera functions/api/_buildInfo.ts com dados REAIS de build (versão, data, commit,
 * branch). Roda como prebuild (prebuild / prebuild:client) — inclusive no build do
 * Cloudflare Pages, que clona o repo (git disponível).
 *
 * Tolerante a falhas: se git não estiver disponível, commit/branch viram "unknown"
 * (nunca quebra o build). Substitui o antigo version.ts com data/branch hardcoded
 * e DESATUALIZADOS (que enganavam o /api/version).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "unknown";
  } catch {
    return "unknown";
  }
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

// No Cloudflare Pages, o branch real vem da env CF_PAGES_BRANCH (checkout é detached).
const branch = process.env.CF_PAGES_BRANCH || git("rev-parse --abbrev-ref HEAD");
const commit = (process.env.CF_PAGES_COMMIT_SHA || git("rev-parse --short HEAD")).slice(0, 12);

const info = {
  version: pkg.version,
  buildDate: new Date().toISOString(),
  commit,
  branch,
};

const out = `// GERADO AUTOMATICAMENTE por scripts/gen-build-info.mjs — não editar à mão.
export const BUILD_INFO = ${JSON.stringify(info, null, 2)} as const;
`;

writeFileSync(new URL("../functions/api/_buildInfo.ts", import.meta.url), out);
console.log(`[gen-build-info] ${info.version} · ${info.commit} · ${info.branch} · ${info.buildDate}`);

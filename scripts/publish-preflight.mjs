#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_BUFFER = 16 * 1024 * 1024;

export function usage() {
  return `Uso: node scripts/publish-preflight.mjs --state-seal <dir> [opções]

Opções:
  --base <ref>          Ref base local já atualizada (padrão: origin/main)
  --state-seal <dir>    Diretório produzido por source-state-seal.mjs
  --help                Exibir esta ajuda

O comando falha fechado. Ele não faz fetch, commit, push, merge ou alteração em
arquivos: apenas valida a branch, o snapshot, o delta e as permissões do GitHub.`;
}

export function parseArgs(argv) {
  const options = { base: "origin/main", stateSeal: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      console.log(usage());
      process.exit(0);
    }
    if (!["--base", "--state-seal"].includes(argument)) {
      throw new Error(`opção desconhecida: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} exige um valor`);
    }
    if (argument === "--base") options.base = value;
    if (argument === "--state-seal") options.stateSeal = value;
    index += 1;
  }
  if (!options.stateSeal) throw new Error("--state-seal é obrigatório");
  return options;
}

export function requiredGitHubPermissions(changedFiles) {
  const requirements = new Map([
    ["contents", "write"],
    ["pull_requests", "write"],
  ]);
  if (changedFiles.some((path) => /^\.github\/workflows\//.test(path))) {
    requirements.set("workflows", "write");
  }
  return requirements;
}

export function missingWritePermissions(permissions, requirements) {
  return [...requirements.entries()]
    .filter(([name, required]) => permissions?.[name] !== required)
    .map(([name, required]) => `${name}: ${required}`);
}

export function parseGitHubRemote(remote) {
  const match = remote.trim().match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) throw new Error(`origin não aponta para um repositório GitHub: ${remote}`);
  return { owner: match[1], repo: match[2] };
}

function run(command, args, { cwd = projectRoot, allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`${command} ${args.join(" ")} falhou${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

function git(args, options = {}) {
  return run("git", ["-C", projectRoot, ...args], options).stdout;
}

function gitStatus() {
  return git(["status", "--porcelain=v1"]);
}

function changedFiles(base) {
  return git(["diff", "--name-only", "--diff-filter=ACMRTUXB", "-z", `${base}...HEAD`])
    .split("\0")
    .filter(Boolean);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function loadSeal(stateSealArgument, head, baseSha) {
  const stateSeal = resolve(process.cwd(), stateSealArgument);
  const manifestPath = join(stateSeal, "manifest.json");
  const bundlePath = join(stateSeal, "source-state.bundle");
  if (!existsSync(manifestPath) || !existsSync(bundlePath)) {
    throw new Error("snapshot inválido: manifest.json e source-state.bundle são obrigatórios");
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch {
    throw new Error("snapshot inválido: manifest.json não é JSON válido");
  }
  if (manifest.schemaVersion !== 1) throw new Error("snapshot inválido: schemaVersion desconhecida");
  if (manifest.head !== head) {
    throw new Error(`snapshot não corresponde ao HEAD atual (${manifest.head} != ${head})`);
  }
  if (manifest.baseSha !== baseSha) {
    throw new Error(`snapshot não corresponde à base atual (${manifest.baseSha} != ${baseSha})`);
  }
  if (manifest.worktreeClean !== true || (manifest.untrackedFiles?.length ?? 0) > 0) {
    throw new Error("snapshot foi criado com worktree sujo ou arquivos não rastreados");
  }
  const expected = manifest.artifacts?.["source-state.bundle"]?.sha256;
  if (!expected || sha256(bundlePath) !== expected) {
    throw new Error("hash do source-state.bundle não confere com o manifesto");
  }
  const verification = run("git", ["bundle", "verify", bundlePath], { allowFailure: true });
  if (verification.status !== 0) throw new Error("source-state.bundle não passou na verificação Git");
  return { stateSeal, manifest };
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
}

function readGitHubInstallations() {
  const result = run("gh", ["api", "user/installations", "--paginate", "--slurp"], {
    allowFailure: true,
  });
  if (result.status !== 0) {
    throw new Error("não foi possível consultar as permissões da instalação GitHub nesta sessão");
  }
  let pages;
  try {
    pages = JSON.parse(stripAnsi(result.stdout));
  } catch {
    throw new Error("a resposta de permissões do GitHub não é JSON válido");
  }
  const installations = pages.flatMap((page) => {
    if (Array.isArray(page)) return page;
    return Array.isArray(page?.installations) ? page.installations : [];
  });
  return installations;
}

function getPermissions(owner) {
  const installation = readGitHubInstallations().find(
    (candidate) => candidate.account?.login?.toLowerCase() === owner.toLowerCase(),
  );
  if (!installation) throw new Error(`nenhuma instalação GitHub visível para a conta ${owner}`);
  return installation.permissions || {};
}

export function validateBranchIdentity(branch, head, baseSha) {
  if (!branch || branch === "(detached)") throw new Error("a branch está detached");
  if (branch === "main" || branch === "master") throw new Error("publicação direta em main/master é proibida");
  if (head === baseSha) throw new Error("HEAD não contém commits além da base");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const branch = git(["branch", "--show-current"]).trim() || "(detached)";
  const head = git(["rev-parse", "HEAD"]).trim();
  const baseSha = git(["rev-parse", "--verify", `${options.base}^{commit}`]).trim();
  validateBranchIdentity(branch, head, baseSha);
  if (gitStatus().trim()) throw new Error("worktree sujo; faça o seal depois do último commit");
  if (run("git", ["-C", projectRoot, "merge-base", "--is-ancestor", baseSha, head], {
    allowFailure: true,
  }).status !== 0) {
    throw new Error("a base não é ancestral do HEAD; faça fetch e reconciliação antes da publicação");
  }
  const { owner, repo } = parseGitHubRemote(git(["remote", "get-url", "origin"]));
  const files = changedFiles(options.base);
  const requirements = requiredGitHubPermissions(files);
  const permissions = getPermissions(owner);
  const missing = missingWritePermissions(permissions, requirements);
  if (missing.length > 0) {
    throw new Error(`permissões GitHub insuficientes: ${missing.join(", ")}`);
  }
  const seal = loadSeal(options.stateSeal, head, baseSha);
  const workflowChanged = files.some((path) => /^\.github\/workflows\//.test(path));

  console.log(`PREFLIGHT_REPOSITORY=${owner}/${repo}`);
  console.log(`PREFLIGHT_BRANCH=${branch}`);
  console.log(`PREFLIGHT_HEAD=${head}`);
  console.log(`PREFLIGHT_BASE=${baseSha}`);
  console.log(`PREFLIGHT_CHANGED_FILES=${files.length}`);
  console.log(`PREFLIGHT_WORKFLOWS_CHANGED=${workflowChanged}`);
  console.log(`PREFLIGHT_STATE_SEAL=${seal.stateSeal}`);
  console.log(`PREFLIGHT_PERMISSIONS=${[...requirements.keys()].join(",")}`);
  console.log("PREFLIGHT_RESULT=PASS");
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  try {
    main();
  } catch (error) {
    console.error("PREFLIGHT_RESULT=BLOCKED");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

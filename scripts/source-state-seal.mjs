#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const MAX_BUFFER = 256 * 1024 * 1024;

function usage() {
  console.log(`Uso: node scripts/source-state-seal.mjs [opções]

Opções:
  --base <ref>       Ref base para registrar o delta (padrão: origin/main)
  --output <dir>     Diretório de saída; o padrão fica fora do checkout
  --label <texto>    Rótulo seguro para o snapshot
  --help             Exibir esta ajuda

O comando é somente leitura no checkout. O snapshot é criado fora do repositório
por padrão e deve ser preservado como artefato de recuperação antes do push.`);
}

function parseArgs(argv) {
  const options = { base: "origin/main", output: null, label: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      usage();
      process.exit(0);
    }
    if (!["--base", "--output", "--label"].includes(argument)) {
      throw new Error(`opção desconhecida: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${argument} exige um valor`);
    }
    options[argument.slice(2)] = value;
    index += 1;
  }
  return options;
}

function runGit(args, { allowFailure = false, cwd = projectRoot } = {}) {
  const result = spawnSync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    maxBuffer: MAX_BUFFER,
  });
  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(`git ${args.join(" ")} falhou${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

function gitText(args, options = {}) {
  return runGit(args, options).stdout;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function writeText(path, content) {
  writeFileSync(path, content, "utf8");
}

function safeLabel(value) {
  return String(value || "snapshot")
    .trim()
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "snapshot";
}

function assertInsideProject(path) {
  const projectRelative = relative(projectRoot, path);
  if (projectRelative === "" || projectRelative.startsWith("..") || isAbsolute(projectRelative)) {
    return;
  }
  if (!projectRelative.startsWith(".neuroped-state")) {
    throw new Error(
      "--output dentro do checkout só é permitido em .neuroped-state; prefira o diretório externo padrão",
    );
  }
}

function appendUntrackedPatches(patchPath, untracked) {
  const chunks = [];
  for (const relativePath of untracked) {
    const absolutePath = resolve(projectRoot, relativePath);
    if (!absolutePath.startsWith(`${projectRoot}/`) && absolutePath !== projectRoot) {
      throw new Error(`arquivo não rastreado fora do checkout: ${relativePath}`);
    }
    const info = lstatSync(absolutePath);
    if (!info.isFile() && !info.isSymbolicLink()) {
      continue;
    }
    const result = runGit(
      ["diff", "--no-index", "--binary", "--", "/dev/null", relativePath],
      { allowFailure: true },
    );
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`não foi possível capturar o arquivo não rastreado: ${relativePath}`);
    }
    chunks.push(`# Untracked file: ${relativePath}\n${result.stdout}`);
  }
  if (chunks.length > 0) {
    writeFileSync(patchPath, `\n${chunks.join("\n")}`, { encoding: "utf8", flag: "a" });
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const head = gitText(["rev-parse", "HEAD"]).trim();
  const branch = gitText(["branch", "--show-current"]).trim() || "(detached)";
  const baseSha = gitText(["rev-parse", "--verify", `${options.base}^{commit}`]).trim();
  const timestamp = new Date().toISOString();
  const stamp = timestamp.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const label = safeLabel(options.label || branch);
  const outputDirectory = options.output
    ? resolve(process.cwd(), options.output)
    : resolve(projectRoot, "..", ".neuroped-state", `${basename(projectRoot)}-${stamp}-${head.slice(0, 12)}-${label}`);

  assertInsideProject(outputDirectory);
  if (existsSync(outputDirectory)) {
    throw new Error(`o diretório de snapshot já existe; para não sobrescrever evidência, escolha outro: ${outputDirectory}`);
  }
  mkdirSync(outputDirectory, { recursive: true });

  const status = gitText(["status", "--porcelain=v1", "--branch"]);
  const statusZ = gitText(["status", "--porcelain=v1", "-z"]);
  const refs = gitText(["show-ref"]);
  const reflog = gitText(["reflog", "--all", "--date=iso-strict"]);
  const fsck = runGit(["fsck", "--full", "--no-reflogs", "--unreachable", "--no-progress"], {
    allowFailure: true,
  });
  const trackedDiff = gitText(["diff", "--binary", options.base]);
  const diffStat = gitText(["diff", "--stat", options.base]);
  const untracked = gitText(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);

  const bundlePath = join(outputDirectory, "source-state.bundle");
  const patchPath = join(outputDirectory, "source-state.patch");
  const statusPath = join(outputDirectory, "status.porcelain-z");
  const refsPath = join(outputDirectory, "refs.txt");
  const reflogPath = join(outputDirectory, "reflog.txt");
  const fsckPath = join(outputDirectory, "fsck.txt");
  const diffStatPath = join(outputDirectory, "diff-stat.txt");
  const verifyPath = join(outputDirectory, "bundle-verify.txt");

  runGit(["bundle", "create", bundlePath, "--all"]);
  const bundleVerify = runGit(["bundle", "verify", bundlePath], { allowFailure: true });
  if (bundleVerify.status !== 0) {
    throw new Error(`o bundle criado não passou na verificação: ${(bundleVerify.stderr || bundleVerify.stdout).trim()}`);
  }

  writeText(patchPath, trackedDiff);
  appendUntrackedPatches(patchPath, untracked);
  writeText(statusPath, statusZ);
  writeText(refsPath, refs);
  writeText(reflogPath, reflog);
  writeText(fsckPath, `${fsck.stdout || ""}${fsck.stderr || ""}`);
  writeText(diffStatPath, diffStat);
  writeText(verifyPath, `${bundleVerify.stdout || ""}${bundleVerify.stderr || ""}`);

  const artifactPaths = [
    bundlePath,
    patchPath,
    statusPath,
    refsPath,
    reflogPath,
    fsckPath,
    diffStatPath,
    verifyPath,
  ];
  const manifest = {
    schemaVersion: 1,
    capturedAt: timestamp,
    repositoryRoot: projectRoot,
    remote: gitText(["remote", "get-url", "origin"]).trim(),
    branch,
    head,
    baseRef: options.base,
    baseSha,
    worktreeClean: status.split("\n").slice(1).filter(Boolean).length === 0,
    untrackedFiles: untracked,
    fsckExitCode: fsck.status,
    artifacts: Object.fromEntries(
      artifactPaths.map((path) => [
        relative(outputDirectory, path),
        { bytes: lstatSync(path).size, sha256: sha256(path) },
      ]),
    ),
  };
  writeText(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`STATE_SEAL_DIR=${outputDirectory}`);
  console.log(`STATE_SEAL_HEAD=${head}`);
  console.log(`STATE_SEAL_BASE=${baseSha}`);
  console.log(`STATE_SEAL_BRANCH=${branch}`);
  console.log(`STATE_SEAL_UNTRACKED=${untracked.length}`);
  console.log(`STATE_SEAL_RESULT=PASS`);
}

try {
  main();
} catch (error) {
  console.error(`STATE_SEAL_RESULT=BLOCKED`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

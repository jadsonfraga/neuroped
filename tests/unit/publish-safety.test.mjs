import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  missingWritePermissions,
  parseGitHubRemote,
  requiredGitHubPermissions,
  validateBranchIdentity,
} from "../../scripts/publish-preflight.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const sourceSeal = read("scripts/source-state-seal.mjs");
const publishPreflight = read("scripts/publish-preflight.mjs");
const packageJson = JSON.parse(read("package.json"));
const gitignore = read(".gitignore");

assert.equal(
  packageJson.scripts["source-state:seal"],
  "node scripts/source-state-seal.mjs",
  "o projeto deve expor o comando de captura recuperável",
);
assert.equal(
  packageJson.scripts["publish:preflight"],
  "node scripts/publish-preflight.mjs",
  "o projeto deve expor o preflight de publicação",
);
assert.equal(
  packageJson.scripts["test:publish-safety"],
  "node tests/unit/publish-safety.test.mjs",
  "o contrato deve ser executável por npm",
);
assert.equal(
  packageJson.scripts["preverify:release"],
  "npm run test:publish-safety",
  "o verify:release deve executar o contrato antes dos gates pesados",
);
assert.match(gitignore, /^\.neuroped-state\/$/m);

for (const pattern of [
  /\["bundle", "create", bundlePath, "--all"\]/,
  /\["bundle", "verify", bundlePath\]/,
  /\["reflog", "--all", "--date=iso-strict"\]/,
  /\["fsck", "--full", "--no-reflogs", "--unreachable", "--no-progress"\]/,
  /status\.porcelain-z/,
  /refs\.txt/,
  /manifest\.json/,
  /sha256/,
]) {
  assert.match(sourceSeal, pattern);
}
assert.match(sourceSeal, /O snapshot é criado fora do repositório/);
assert.match(sourceSeal, /worktreeClean/);
assert.match(sourceSeal, /untrackedFiles/);
assert.match(sourceSeal, /STATE_SEAL_RESULT=PASS/);
assert.match(sourceSeal, /STATE_SEAL_RESULT=BLOCKED/);

for (const pattern of [
  /--state-seal/,
  /\["status", "--porcelain=v1"\]/,
  /merge-base/,
  /\["diff", "--name-only"/,
  /run\("gh"/,
  /user\/installations/,
  /workflows/,
  /PREFLIGHT_RESULT=PASS/,
  /PREFLIGHT_RESULT=BLOCKED/,
]) {
  assert.match(publishPreflight, pattern);
}
assert.match(publishPreflight, /publicação direta em main\/master é proibida/);
assert.match(publishPreflight, /worktree sujo/);
assert.match(publishPreflight, /snapshot não corresponde ao HEAD atual/);
assert.match(publishPreflight, /permissões GitHub insuficientes/);

assert.deepEqual(
  [...requiredGitHubPermissions(["client/src/App.tsx"])],
  [
    ["contents", "write"],
    ["pull_requests", "write"],
  ],
);
assert.deepEqual(
  [...requiredGitHubPermissions([".github/workflows/release.yml"])],
  [
    ["contents", "write"],
    ["pull_requests", "write"],
    ["workflows", "write"],
  ],
);
assert.deepEqual(
  missingWritePermissions(
    { contents: "write", pull_requests: "write" },
    requiredGitHubPermissions(["client/src/App.tsx"]),
  ),
  [],
);
assert.deepEqual(
  missingWritePermissions(
    { contents: "write", pull_requests: "write" },
    requiredGitHubPermissions([".github/workflows/release.yml"]),
  ),
  ["workflows: write"],
);
assert.deepEqual(parseGitHubRemote("https://github.com/jadsonfraga/neuroped.git"), {
  owner: "jadsonfraga",
  repo: "neuroped",
});
assert.deepEqual(parseGitHubRemote("git@github.com:jadsonfraga/neuroped.git"), {
  owner: "jadsonfraga",
  repo: "neuroped",
});
assert.doesNotThrow(() => validateBranchIdentity("feat/recoverable-publish", "abc", "def"));
assert.throws(
  () => validateBranchIdentity("main", "abc", "def"),
  /publicação direta/,
);
assert.throws(
  () => validateBranchIdentity("feat/no-delta", "same", "same"),
  /HEAD não contém commits/,
);

console.log("✓ estado-fonte e preflight de publicação possuem contratos verificáveis");

import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { findUnreviewedBuiltSha256Literals } from "../../scripts/guards/public-provenance-digests.mjs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("client/public/authorial-sdg-manifest.json"));
const chunk = "assets/scaleFilter-fixture.js";
let checks = 0;
for (const { sourceSha256: digest } of manifest.instruments) {
  for (const quote of ['"', "'", "`"] ) {
    for (const [path, code, count] of [
      [chunk, `[{sourceSha256:${quote}${digest}${quote}}]`, 0],
      ["authorial-sdg-manifest.json", `{"sourceSha256":${quote}${digest}${quote}}`, 0],
      [chunk, `const PIN=${quote}${digest}${quote};`, 1],
      [chunk, `[{PIN_HASH:${quote}${digest}${quote}}]`, 1],
      [chunk, `verifyPassword(${quote}${digest}${quote});`, 1],
      [chunk, `const sourceSha256=${quote}${digest}${quote};`, 1],
      [chunk, `[{sourceSha256:${quote}${"a".repeat(64)}${quote}}]`, 1],
      [chunk, `[{sourceSha256:${quote}${digest}${quote},secret:${quote}${"a".repeat(64)}${quote}}]`, 1],
      ["assets/PasswordGate-fixture.js", `[{sourceSha256:${quote}${digest}${quote}}]`, 1],
      ["assets/scaleFilter-fixture.js.map", `[{sourceSha256:${quote}${digest}${quote}}]`, 1],
      ["assets/scaleFilter-fixture.html", `[{sourceSha256:${quote}${digest}${quote}}]`, 1],
      ["other.json", `{"sourceSha256":${quote}${digest}${quote}}`, 1],
    ]) {
      assert.equal(findUnreviewedBuiltSha256Literals(path, code).length, count, `${path}: exceção deve ser limitada a propriedade/caminho/digest`);
      checks++;
    }
  }
}

const fixture = mkdtempSync(join(tmpdir(), "sdg-built-guard-"));
const write = (path, content) => {
  const target = join(fixture, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
};
try {
  const script = "scripts/guards/audit-built-pin-verifier.mjs";
  write(script, read(script));
  write("scripts/guards/public-provenance-digests.mjs", read("scripts/guards/public-provenance-digests.mjs"));
  write("dist/public/authorial-sdg-manifest.json", JSON.stringify(manifest));
  const legitimate = `const metadata=${JSON.stringify(manifest.instruments)};`;
  const pbkdf = ["pbkdf2", "100000", "A".repeat(16), "B".repeat(24)].join("$");
  for (const [suffix, expected] of [
    ["", 0],
    [`const pin="${"a".repeat(64)}";`, 1],
    [`const pin=\`${"a".repeat(64)}\`;`, 1],
    [`const pin="${manifest.instruments[0].sourceSha256}";`, 1],
    [`const key="${pbkdf}";`, 1],
    [`const metadata2={sourceSha256:"${"b".repeat(64)}"};`, 1],
  ]) {
    write(`dist/public/${chunk}`, legitimate + suffix);
    const result = spawnSync(process.execPath, [join(fixture, script)], { cwd: fixture, encoding: "utf8", timeout: 10000 });
    assert.equal(result.status, expected, result.stderr || result.stdout);
    checks++;
  }
} finally {
  rmSync(fixture, { recursive: true, force: true });
}
console.log(`[built provenance] ${checks} verificações aprovadas; PIN/SHA desconhecido/PBKDF2 continuam bloqueados no bundle.`);

import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { verifiedVisualDigestSource } from "../../scripts/guards/lib/verified-visual-digests.mjs";

const path = "client/public/recognition-v2/manifest.json";
const pinPattern = /["'][a-f0-9]{64}["']/i;
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "recognition-digests-"));
  const dir = join(root, "client/public/recognition-v2");
  mkdirSync(dir, { recursive: true });
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>\n';
  const hash = createHash("sha256").update(svg).digest("hex");
  writeFileSync(join(dir, "bola.svg"), svg);
  return { root, dir, hash, source: JSON.stringify({ items: [{ id: "bola", sha256: hash }] }) };
}

test("only verified local asset checksum field is exempted", () => {
  const f = fixture();
  try {
    assert.equal(pinPattern.test(f.source), true);
    assert.equal(pinPattern.test(verifiedVisualDigestSource(path, f.source, f.root)), false);
    const outside = JSON.stringify({ items: [{ id: "bola", sha256: f.hash }], embedded: f.hash });
    assert.equal(pinPattern.test(verifiedVisualDigestSource(path, outside, f.root)), true);
    assert.equal(verifiedVisualDigestSource("client/src/auth.ts", f.source, f.root), f.source);
  } finally { rmSync(f.root, { recursive: true }); }
});

test("wrong checksum, absent file, path traversal and duplicate entries fail closed", () => {
  const f = fixture();
  try {
    const wrong = "a".repeat(64);
    for (const items of [
      [{ id: "bola", sha256: wrong }],
      [{ id: "ausente", sha256: f.hash }],
      [{ id: "../bola", sha256: f.hash }],
      [{ id: "bola", sha256: f.hash }, { id: "bola", sha256: f.hash }],
    ]) assert.throws(() => verifiedVisualDigestSource(path, JSON.stringify({ items }), f.root));
    assert.throws(() => verifiedVisualDigestSource(path, "{}", f.root));
    assert.throws(() => verifiedVisualDigestSource(path, "not json", f.root));
    const duplicateField = `{"items":[{"id":"bola","sha256":"${f.hash}","sha256":"${f.hash}"}]}`;
    assert.throws(() => verifiedVisualDigestSource(path, duplicateField, f.root));
    rmSync(join(f.dir, "bola.svg"));
    writeFileSync(join(f.dir, "other.svg"), "<svg/>");
    symlinkSync(join(f.dir, "other.svg"), join(f.dir, "bola.svg"));
    assert.throws(() => verifiedVisualDigestSource(path, f.source, f.root));
  } finally { rmSync(f.root, { recursive: true }); }
});

test("banco kawaii (v3) é verificado só contra a própria pasta; hash do banco sóbrio não serve", () => {
  const root = mkdtempSync(join(tmpdir(), "recognition-digests-v3-"));
  try {
    const sober = join(root, "client/public/recognition-v2");
    const kawaii = join(root, "client/public/recognition-v3");
    mkdirSync(sober, { recursive: true });
    mkdirSync(kawaii, { recursive: true });
    const soberSvg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="9" height="9"/></svg>\n';
    const kawaiiSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="12"/></svg>\n';
    writeFileSync(join(sober, "gato.svg"), soberSvg);
    writeFileSync(join(kawaii, "gato.svg"), kawaiiSvg);
    const kawaiiHash = createHash("sha256").update(kawaiiSvg).digest("hex");
    const soberHash = createHash("sha256").update(soberSvg).digest("hex");
    const v3 = "client/public/recognition-v3/manifest.json";
    const ok = JSON.stringify({ items: [{ id: "gato", sha256: kawaiiHash }] });
    assert.equal(pinPattern.test(verifiedVisualDigestSource(v3, ok, root)), false);
    assert.throws(() => verifiedVisualDigestSource(v3, JSON.stringify({ items: [{ id: "gato", sha256: soberHash }] }), root));
  } finally { rmSync(root, { recursive: true }); }
});

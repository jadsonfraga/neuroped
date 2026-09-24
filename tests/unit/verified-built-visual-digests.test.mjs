import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createBuiltVisualDigestInspector } from "../../scripts/guards/lib/verified-built-visual-digests.mjs";
const pin = /["'`][0-9a-f]{64}["'`]/i;
const manifestPath = "recognition-v2/manifest.json";
const bundlePath = "assets/teste-reconhecimento-visual-synthetic.js";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "built-visual-digest-"));
  for (const folder of ["recognition-v2", "assets", ".vite"]) mkdirSync(join(root, folder));
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>\n';
  const digest = createHash("sha256").update(svg).digest("hex");
  const item = { id: "bola", sourcePath: "EN/ball.svg", sha256: digest, license: "CC-BY-SA-4.0" };
  const json = JSON.stringify({ items: [item] });
  const js = `const bank=[${JSON.stringify(item)}];export{bank};`;
  writeFileSync(join(root, "recognition-v2/bola.svg"), svg);
  writeFileSync(join(root, manifestPath), json);
  writeFileSync(join(root, bundlePath), js);
  writeFileSync(join(root, ".vite/manifest.json"), JSON.stringify({ "src/pages/teste-reconhecimento-visual.tsx": { file: bundlePath, src: "src/pages/teste-reconhecimento-visual.tsx", isDynamicEntry: true } }));
  return { root, svg, digest, item, json, js };
}

test("reproduces false PIN detection and exempts only verified image fields", () => {
  const f = fixture();
  try {
    assert.equal(pin.test(f.json), true, "legacy scanner mistakes a real image checksum for a PIN");
    assert.equal(pin.test(f.js), true);
    const inspect = createBuiltVisualDigestInspector(f.root);
    assert.equal(pin.test(inspect(manifestPath, f.json)), false);
    assert.equal(pin.test(inspect(bundlePath, f.js)), false);
    const minified = `const bank=[{id:"bola",sourcePath:"EN/ball.svg",sha256:"${f.digest}"}];`;
    assert.equal(pin.test(inspect(bundlePath, minified)), false);
    // Real-world regression: this repo's build rewrites plain string literals
    // as no-substitution template literals (backticks) when minifying — a
    // distinct AST node from an ordinary string literal. The inspector must
    // recognize both, or every field lookup below silently fails and every
    // legitimate digest leaks through unredacted.
    const backtickMinified = `const bank=[{id:\`bola\`,sourcePath:\`EN/ball.svg\`,sha256:\`${f.digest}\`}];`;
    assert.equal(pin.test(inspect(bundlePath, backtickMinified)), false, "template-literal-quoted fields must be recognized like ordinary string literals");
    const wrapped = `const bank=JSON.parse(${JSON.stringify(f.json)});`;
    assert.equal(pin.test(inspect(bundlePath, wrapped)), false, "large JSON serialized by Vite remains verifiable");
    const withCredential = JSON.stringify({ items: [f.item], PIN: f.digest });
    assert.equal(pin.test(inspect(bundlePath, `const bank=JSON.parse(${JSON.stringify(withCredential)});`)), true, "escaping cannot hide another field");
    assert.equal(pin.test(inspect(bundlePath, "const bank=JSON.parse(`" + f.json + "`);")), false);
    assert.equal(inspect("assets/auth.js", f.js), f.js, "another module remains fully inspected");
    for (const extra of [`const PIN="${f.digest}";`, `const auth={sha256:"${f.digest}"};`, `const text='sha256:"${f.digest}"';`, `// "${f.digest}"`]) {
      assert.equal(pin.test(inspect(bundlePath, f.js + extra)), true, "same public value in an unverified context must still be flagged");
    }
    assert.equal(pin.test(inspect(manifestPath, JSON.stringify({ items: [f.item], PIN: f.digest }))), true);
    assert.equal(pin.test(inspect(bundlePath, `const bad={id:"other",sourcePath:"EN/ball.svg",sha256:"${f.digest}"};`)), true);
    assert.equal(pin.test(inspect(bundlePath, `const bad={id:"bola",sourcePath:"EN/other.svg",sha256:"${f.digest}"};`)), true);
    assert.equal(pin.test(inspect(bundlePath, `const bad={id:"bola",sourcePath:"EN/ball.svg",sha256:"${"a".repeat(64)}"};`)), true);
    assert.throws(() => inspect(manifestPath, `{"items":[{"id":"bola","sourcePath":"EN/ball.svg","sha256":"${f.digest}","sha256":"${f.digest}"}]}`));
  } finally { rmSync(f.root, { recursive: true }); }
});

test("modified bytes, missing assets, duplicates, traversal and symlinks fail closed", () => {
  for (const mutation of [
    f => writeFileSync(join(f.root, "recognition-v2/bola.svg"), "<svg/>"),
    f => rmSync(join(f.root, "recognition-v2/bola.svg")),
    f => writeFileSync(join(f.root, manifestPath), JSON.stringify({ items: [f.item, f.item] })),
    f => writeFileSync(join(f.root, manifestPath), JSON.stringify({ items: [{ ...f.item, id: "../bola" }] })),
    f => writeFileSync(join(f.root, ".vite/manifest.json"), JSON.stringify({ "src/pages/teste-reconhecimento-visual.tsx": { file: "../outside.js" } })),
    f => writeFileSync(join(f.root, ".vite/manifest.json"), "{}"),
    f => { rmSync(join(f.root, "recognition-v2/bola.svg")); writeFileSync(join(f.root, "other.svg"), f.svg); symlinkSync(join(f.root, "other.svg"), join(f.root, "recognition-v2/bola.svg")); },
  ]) {
    const f = fixture();
    try { mutation(f); assert.throws(() => createBuiltVisualDigestInspector(f.root)); }
    finally { rmSync(f.root, { recursive: true }); }
  }
});

test("builds without this visual inventory retain the original inspection", () => {
  const root = mkdtempSync(join(tmpdir(), "built-without-visual-"));
  try {
    const source = `const PIN="${"b".repeat(64)}";`;
    const inspect = createBuiltVisualDigestInspector(root);
    assert.equal(inspect("assets/auth.js", source), source);
    assert.equal(pin.test(inspect("assets/auth.js", source)), true);
  } finally { rmSync(root, { recursive: true }); }
});

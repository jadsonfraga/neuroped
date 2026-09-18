import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const indexCss = read("client/src/index.css");
const signatureCss = read("client/src/styles/visual-reset.css");
const main = read("client/src/main.tsx");
const workflow = read(".github/workflows/visual-reset.yml");

// Only these semantic palette tokens were superseded in both themes.
// Error colors, typography, shadows and relative-color fallbacks stay in index.css.
const palette = [
  "background", "foreground", "border", "card", "card-foreground", "card-border",
  "sidebar", "sidebar-foreground", "sidebar-border", "sidebar-primary",
  "sidebar-primary-foreground", "sidebar-accent", "sidebar-accent-foreground", "sidebar-ring",
  "popover", "popover-foreground", "popover-border", "primary", "primary-foreground",
  "secondary", "secondary-foreground", "muted", "muted-foreground", "accent",
  "accent-foreground", "input", "ring", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
].map((name) => `--${name}`);
assert.equal(palette.length, 32);

function declarations(root, selector) {
  return root.nodes
    .filter((node) => node.type === "rule" && node.selector === selector)
    .flatMap((rule) => rule.nodes.filter((node) => node.type === "decl"));
}

function validatePalette(baseSource) {
  const base = postcss.parse(baseSource);
  const signature = postcss.parse(signatureCss);
  for (const selector of [":root", ".dark"]) {
    const baseline = declarations(base, selector);
    const canonical = declarations(signature, selector);
    for (const token of palette) {
      assert.equal(canonical.filter((node) => node.prop === token).length, 1,
        `${selector} ${token}: exactly one definition must remain in visual-reset.css`);
      assert.ok(!baseline.some((node) => node.prop === token),
        `${selector} ${token}: index.css must not reintroduce the superseded palette`);
    }
    for (const token of ["--destructive", "--destructive-foreground", "--primary-border", "--shadow"]) {
      assert.ok(baseline.some((node) => node.prop === token),
        `${selector} ${token}: non-superseded semantics and fallbacks must remain`);
    }
  }
  for (const token of ["--font-sans", "--font-serif", "--font-display", "--font-mono", "--radius"]) {
    assert.ok(declarations(base, ":root").some((node) => node.prop === token), `${token} must remain`);
  }
}

function validateTokenImport(source) {
  const root = postcss.parse(source);
  const meaningful = root.nodes.filter((node) => node.type !== "comment");
  const imports = [];
  root.walkAtRules("import", (node) => {
    if (/tokens\.css/.test(node.params)) imports.push(node);
  });
  assert.equal(imports.length, 1, "tokens.css must be imported exactly once");
  assert.equal(meaningful[0], imports[0], "tokens.css must precede Tailwind and all style rules");
}

validatePalette(indexCss);
validateTokenImport(indexCss);
const baseImport = main.indexOf('import "./index.css"');
const signatureImport = main.indexOf('import "./styles/visual-reset.css"');
assert.ok(baseImport >= 0 && signatureImport > baseImport, "keep the established CSS import order");
assert.ok(workflow.includes('"client/src/**/*.css"'), "the visual gate must cover all client CSS");
for (const path of ["tailwind.config.ts", "postcss.config.js", "vite.config.ts", "package.json", "package-lock.json"]) {
  assert.ok(workflow.includes(`- "${path}"`), `${path} changes must trigger the visual gate`);
}
assert.ok(workflow.includes('- "tests/unit/css-token-source-static.test.mjs"'), "guard changes must trigger CI");
assert.ok(workflow.includes("run: node tests/unit/css-token-source-static.test.mjs"), "CI must execute this guard");

// Mutation checks: prove that neither theme can silently regain the old palette,
// and that moving the token import below Tailwind is rejected.
for (const selector of [":root", ".dark"]) {
  assert.throws(() => validatePalette(`${indexCss}\n${selector} { --primary: 243 52% 47%; }`),
    /must not reintroduce/);
}
assert.throws(() => validateTokenImport(`@tailwind base;\n${indexCss}`), /must precede Tailwind/);
console.log("PASS: 32 canonical palette tokens in both themes; valid imports; complete CSS gate coverage; 3 mutations rejected.");

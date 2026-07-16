import assert from "node:assert/strict";
import { normalizeLocalAssetHref, parseInitialJsAssets } from "../../scripts/lib/bundle-audit-utils.mjs";

const parsed = parseInitialJsAssets(`
  <script type="module" src="./assets/index-123.js"></script>
  <link rel="modulepreload" href="./assets/vendor-react-123.js">
  <link href='./assets/feature-123.js?x=1' rel='modulepreload'>
`);

assert.deepEqual(parsed.entryFiles, ["assets/index-123.js"]);
assert.deepEqual(parsed.modulePreloadFiles, ["assets/vendor-react-123.js", "assets/feature-123.js"]);
assert.equal(normalizeLocalAssetHref("https://example.com/external.js"), null);
assert.throws(() => normalizeLocalAssetHref("./assets/../secret.js"), /inseguro/);
assert.throws(() => normalizeLocalAssetHref("./assets/%2e%2e%5csecret.js"), /inseguro/);
console.log("✓ auditor de bundle reconhece entrypoint e preloads com caminhos seguros");

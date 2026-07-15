import assert from "node:assert/strict";

import {
  normalizeLocalAssetHref,
  parseInitialJsAssets,
} from "../../scripts/lib/bundle-audit-utils.mjs";

const parsed = parseInitialJsAssets(`
  <link href='/assets/vendor.js?v=7' crossorigin rel='preload modulepreload'>
  <link rel="modulepreload" href="./assets/vendor.js#duplicado">
  <link rel="modulepreload" href="https://cdn.example.com/external.js">
  <script src='./assets/index.js?build=1' type='module'></script>
`);

assert.deepEqual(parsed.entryFiles, ["assets/index.js"]);
assert.deepEqual(parsed.modulePreloadFiles, ["assets/vendor.js"]);
assert.equal(normalizeLocalAssetHref("/assets/chunk%20name.js"), "assets/chunk name.js");
assert.equal(normalizeLocalAssetHref("data:text/javascript,alert(1)"), null);
assert.throws(() => normalizeLocalAssetHref("../secrets.js"), /inseguro ou inválido/);
assert.throws(() => normalizeLocalAssetHref("assets/%2e%2e/secrets.js"), /inseguro ou inválido/);
assert.throws(() => normalizeLocalAssetHref("assets/%E0%A4%A.js"), /URL de asset inválida/);

console.log("✅ AUDITOR DE BUNDLE OK — parser, deduplicação e caminhos seguros conferidos.");

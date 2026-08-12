import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

const secureStorage = read("client/src/lib/secureStorage.ts");
const persistent = read("client/src/lib/persistentSecureStorage.ts");
const persistentCode = stripComments(persistent);
const caaPage = read("client/src/pages/caa.tsx");

assert.match(secureStorage, /caa:workspace:v3/);
assert.match(secureStorage, /persistentSecureSet/);
assert.match(secureStorage, /persistentSecureGet/);
assert.match(secureStorage, /persistentSecureClearAll/);

assert.match(persistentCode, /indexedDB\.open/);
assert.match(persistentCode, /AES-GCM/);
assert.match(persistentCode, /generateKey\([\s\S]*?false,[\s\S]*?encrypt[\s\S]*?decrypt/);
assert.doesNotMatch(persistentCode, /\blocalStorage\b|\bsessionStorage\b/);
assert.doesNotMatch(persistentCode, /exportKey\s*\(/);

assert.match(caaPage, /const SECURE_CAA_KEY = "caa:workspace:v3"/);
assert.match(caaPage, /secureGet<StoredWorkspace>\(SECURE_CAA_KEY\)/);
assert.match(caaPage, /secureSet\(SECURE_CAA_KEY/);

console.log("[caa-persistence] ✓ CAA usa cofre IndexedDB AES-GCM persistente, sem fallback plaintext.");

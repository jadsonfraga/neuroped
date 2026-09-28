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

// A página pública não deve restaurar workspace do aparelho durante bootstrap,
// sessão LIVE, logout ou acesso remoto sem login. O modo local conserva o cofre.
const caaCode = stripComments(caaPage);
assert.match(caaCode, /if \(accessMode === "checking" \|\| isLoading\)/);
assert.match(caaCode, /persistWorkspace=\{accessMode === "local"\}/);
assert.match(caaCode, /key=\{JSON\.stringify\(\[accessMode, isAuthenticated, user\?\.id \?\? null, activeClinicId\]\)\}/);
assert.match(caaCode, /useState\(!persistWorkspace\)/);
assert.match(caaCode, /persistWorkspace \? "saving" : "session"/);
assert.match(caaCode, /useEffect\(\(\) => \(\) => cancel\(\), \[cancel\]\)/);

const persistenceEffects = [...caaCode.matchAll(
  /useEffect\(\(\) => \{([\s\S]*?)\n  \}, \[[^\]]*\]\);/g,
)].map((match) => match[1]).filter((body) => /secureGet|secureSet|localStorage/.test(body));
assert.equal(persistenceEffects.length, 2, "hidratação e salvamento devem ter fronteiras explícitas");
for (const body of persistenceEffects) {
  assert.match(body, /^\s*if \(!persistWorkspace(?: \|\| !storageReady)?\) return;/,
    "nenhum efeito de persistência pode tocar storage antes de negar o modo remoto");
}
assert.match(caaCode, /\.then\(\(\) => active \? secureSet\(SECURE_CAA_KEY, snapshot\) : false\)/);
assert.match(caaPage, /data-testid="caa-session-only"/);
assert.match(caaPage, /não são salvos automaticamente/);
assert.match(caaPage, /Prancha disponível nesta sessão/);
assert.match(caaPage, /aria-label="Exportar prancha" onClick=\{exportBoard\}/);
assert.match(caaPage, /onChange=\{importBoard\}/);

console.log("[caa-persistence] ✓ cofre local preservado; remoto em memória, sem restauração/gravação automática e com reset de sessão.");

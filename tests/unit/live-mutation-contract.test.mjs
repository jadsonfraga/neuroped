import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("client/src/lib/liveMutation.ts", "utf8");
assert.match(source, /MAX_ATTEMPTS = 3/);
assert.match(source, /Idempotency-Key/);
assert.match(source, /inMemoryQueue/);
assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
assert.match(source, /HTTP_\$\{response\.status\}/);
const auth = fs.readFileSync("client/src/contexts/AuthContext.tsx", "utf8");
assert.match(auth, /clearLiveMutationQueue/);
console.log("live mutation contract: memória apenas, retry limitado, idempotência e logout aprovados");

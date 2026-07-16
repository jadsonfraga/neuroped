import assert from "node:assert/strict";
import { isRecoverableChunkError } from "../../client/src/lib/chunkRecovery";

for (const message of [
  "ChunkLoadError: Loading chunk route-filtro failed",
  "TypeError: Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module: /assets/page.js",
]) {
  assert.equal(isRecoverableChunkError(new Error(message)), true, message);
}

assert.equal(
  isRecoverableChunkError(new Error("Falha de validação do formulário")),
  false,
);
assert.equal(isRecoverableChunkError(null), false);

console.log("✓ recuperação automática reconhece somente falhas de chunks");

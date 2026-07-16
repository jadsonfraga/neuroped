import assert from "node:assert/strict";
import {
  isRecoverableChunkError,
  shouldAutoRecoverChunkError,
} from "../../client/src/lib/chunkRecovery";

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
assert.equal(
  shouldAutoRecoverChunkError(
    new Error("TypeError: Failed to fetch dynamically imported module"),
    false,
  ),
  false,
  "não deve recarregar o app quando a causa é falta de conexão",
);
assert.equal(
  shouldAutoRecoverChunkError(new Error("ChunkLoadError: Loading chunk x failed"), true),
  true,
);

console.log("✓ recuperação automática reconhece somente falhas de chunks");

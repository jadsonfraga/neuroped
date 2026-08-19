import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  attemptChunkRecovery,
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

let reloadCalls = 0;
assert.equal(
  attemptChunkRecovery(
    new Error("TypeError: Failed to fetch dynamically imported module"),
    true,
    () => {
      reloadCalls += 1;
      return true;
    },
  ),
  true,
  "falha de React.lazy deve acionar a recuperação uma vez",
);
assert.equal(reloadCalls, 1);

assert.equal(
  attemptChunkRecovery(
    new Error("Falha de validação do formulário"),
    true,
    () => {
      throw new Error("reload não deveria ser chamado para erro comum");
    },
  ),
  false,
);

assert.equal(
  attemptChunkRecovery(
    new Error("ChunkLoadError: Loading chunk x failed"),
    false,
    () => {
      throw new Error("reload não deveria ser chamado offline");
    },
  ),
  false,
);

const boundarySource = readFileSync(
  new URL("../../client/src/components/AppErrorBoundary.tsx", import.meta.url),
  "utf8",
);
assert.match(
  boundarySource,
  /attemptChunkRecovery\(error,\s*online\)/,
  "AppErrorBoundary deve encaminhar falhas de chunk para a autocura",
);

console.log("✓ recuperação automática reconhece chunks e cobre React.lazy/ErrorBoundary");

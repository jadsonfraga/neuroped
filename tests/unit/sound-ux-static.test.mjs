import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const softSounds = read("client/src/lib/softSounds.ts");
const haptic = read("client/src/lib/haptic.ts");
const feedback = read("client/src/lib/uiFeedback.ts");
const useSound = read("client/src/hooks/useSound.ts");
const preferences = read("client/src/hooks/useUiPreferences.ts");
const layout = read("client/src/components/Layout.tsx");
const panel = read("client/src/components/PreferencesPanel.tsx");
const toast = read("client/src/components/Toast.tsx");
const confirmDialog = read("client/src/components/ConfirmDialog.tsx");

// Som nasce habilitado, preservando "off" explícito; vibração continua opt-in.
assert.match(softSounds, /localStorage\.getItem\(STORAGE_KEY\) !== "off"/);
assert.match(softSounds, /catch \{\s*return true;/);
assert.match(haptic, /localStorage\.getItem\(STORAGE_KEY\) === "on"/);
assert.match(haptic, /catch \{\s*return false;/);

// Rotinas clínicas não devem produzir sons de hover, navegação ou clique genérico.
assert.match(
  softSounds,
  /export function softTap\(\): void \{\s*\/\* intencionalmente silencioso \*\/\s*\}/,
);
assert.match(
  softSounds,
  /export function softHover\(\): void \{\s*\/\* intencionalmente silencioso \*\/\s*\}/,
);
assert.match(
  softSounds,
  /export function softWhoosh\(\): void \{\s*\/\* intencionalmente silencioso \*\/\s*\}/,
);
assert.match(softSounds, /document\.visibilityState === "hidden"/);

// A camada semântica central expõe somente feedbacks relevantes e limita repetição.
assert.match(feedback, /export const uiFeedback/);
assert.match(feedback, /selection\(\): void/);
assert.match(feedback, /success\(\): void/);
assert.match(feedback, /warning\(\): void/);
assert.match(feedback, /error\(\): void/);
assert.match(feedback, /MIN_INTERVAL_MS/);
assert.doesNotMatch(feedback, /hover\(\)/);
assert.doesNotMatch(feedback, /navigation\(\)/);

// Chamadores legados também passam pelo limite, sem depender da nova camada.
assert.match(softSounds, /SELECTION_SOUND_MIN_INTERVAL_MS = 180/);
assert.match(softSounds, /softTick\(\): void \{\s*if \(!canPlay\(\) \|\| !shouldEmitSelectionSound\(\)\) return;/);
assert.match(haptic, /SELECTION_HAPTIC_MIN_INTERVAL_MS = 180/);
assert.match(haptic, /select: \(\) => vibrate\(5, SELECTION_HAPTIC_MIN_INTERVAL_MS\)/);

// Som e háptico permanecem independentes; o hook antigo não usa mais arcade/8-bit.
assert.match(useSound, /haptic\.tap\(\)/);
assert.match(useSound, /uiFeedback\.success\(\)/);
assert.doesNotMatch(useSound, /playCoin|playPowerUp|play1Up/);

// Preferências explícitas e sincronizadas entre superfícies.
assert.match(preferences, /SOUND_PREFERENCE_EVENT/);
assert.match(preferences, /HAPTIC_PREFERENCE_EVENT/);
assert.match(preferences, /prefers-reduced-motion: reduce/);
assert.match(layout, /data-testid="button-sound-toggle"/);
assert.match(layout, /data-testid="button-sound-toggle-mobile"/);
assert.match(panel, /data-testid="range-sound-volume"/);
assert.match(panel, /Ativos por padrão, breves e restritos a confirmações e alertas relevantes/);
assert.match(panel, /Sons da interface vêm habilitados e podem ser desligados/);
assert.match(panel, /Vibração exige ativação explícita/);
assert.match(panel, /Senhas nunca\s+são persistidas pelo\s+NeuroPed/);
assert.match(panel, /reducedMotion/);

// Feedback visual/textual continua primário; erros têm anúncio mais forte.
assert.match(toast, /uiFeedback\.success\(\)/);
assert.match(toast, /role=\{isError \? "alert" : "status"\}/);
assert.match(toast, /aria-live=\{isError \? "assertive" : "polite"\}/);
assert.match(toast, /useReducedMotion/);
assert.match(confirmDialog, /AlertDialogPrimitive\.Description/);
assert.match(confirmDialog, /uiFeedback\.warning\(\)/);

console.log("sound-ux-static: política clínica de feedback protegida");

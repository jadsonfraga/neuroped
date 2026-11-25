import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const softSounds = read("client/src/lib/softSounds.ts");
const preferences = read("client/src/hooks/useUiPreferences.ts");
const layout = read("client/src/components/Layout.tsx");
const panel = read("client/src/components/PreferencesPanel.tsx");

assert.match(softSounds, /SOUND_PREFERENCE_EVENT/);
assert.match(softSounds, /getSoundVolume/);
assert.match(softSounds, /setSoundVolume/);
// Silêncio passivo substitui o antigo contrato de hover limitado a 160 ms.
for (const source of [softSounds, layout, read("client/src/pages/home.tsx"), read("client/src/pages/filtro-engine.tsx")]) {
  assert.doesNotMatch(source, /\bsoftHover\b/, "passar o cursor não pode acionar sons");
}
assert.doesNotMatch(layout, /\bsoftWhoosh\b/, "montar a rota no shell não toca som");
assert.match(softSounds, /localStorage\.getItem\(STORAGE_KEY\) === "on"/);
assert.match(preferences, /updateSoundVolume/);
assert.match(preferences, /window\.addEventListener\(SOUND_PREFERENCE_EVENT/);
assert.match(layout, /data-testid="button-sound-toggle"/);
assert.match(layout, /data-testid="button-sound-toggle-mobile"/);
assert.match(panel, /data-testid="range-sound-volume"/);
assert.match(panel, /Intensidade do som/);
assert.match(panel, /Ouvir amostra/);

console.log("sound-ux-static: ok");

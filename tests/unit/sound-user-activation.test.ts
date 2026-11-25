import assert from "node:assert/strict";

// Ambiente mínimo de navegador: conta quantos AudioContext foram criados.
let created = 0;
let notesStarted = 0;
let storageBlocked = false;
class FakeParam { setValueAtTime() {} linearRampToValueAtTime() {} exponentialRampToValueAtTime() {} }
class FakeNode { connect() { return this; } disconnect() {} addEventListener() {} start() { notesStarted += 1; } stop() {} frequency = new FakeParam(); gain = new FakeParam(); Q = new FakeParam(); type = ""; }
class FakeAudioContext {
  state = "running"; currentTime = 0; destination = {};
  constructor() { created += 1; }
  resume() { return Promise.resolve(); }
  createOscillator() { return new FakeNode(); }
  createGain() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
}
const store = new Map<string, string>();
const activation = { hasBeenActive: false };
Object.assign(globalThis, {
  window: { AudioContext: FakeAudioContext, dispatchEvent() {}, setTimeout },
  localStorage: { getItem: (k: string) => { if (storageBlocked) throw new Error("storage bloqueado"); return store.get(k) ?? null; }, setItem: (k: string, v: string) => store.set(k, v) },
});
Object.defineProperty(globalThis, "navigator", { value: { userActivation: activation }, configurable: true });

const { isSoundEnabled, setSoundEnabled, setSoundVolume, softMuteHint, softWhoosh, softTap, softSuccess, softBell } = await import("../../client/src/lib/softSounds");

// Fresh storage must be silent, including after a user clicks for another reason.
assert.equal(isSoundEnabled(), false, "sem opt-in, a interface deve iniciar em silêncio");
const effects = () => { softWhoosh(); softTap(); softSuccess(); softBell(); softMuteHint(); };
effects();
activation.hasBeenActive = true;
effects();
assert.equal(created, 0, "clicar no app não autoriza reproduzir sons");

store.set("neuroped:sounds", "invalid");
assert.equal(isSoundEnabled(), false, "preferência inválida nunca libera áudio");
storageBlocked = true;
assert.equal(isSoundEnabled(), false, "storage bloqueado não libera áudio");
storageBlocked = false;

// A escolha salva tem precedência, mas não autoriza autoplay.
setSoundEnabled(true);
assert.equal(isSoundEnabled(), true);
activation.hasBeenActive = false;
effects();
assert.equal(created, 0, "sem gesto não pode haver AudioContext");

activation.hasBeenActive = true;
softMuteHint();
softTap();
assert.equal(created, 1, "amostra e toque compartilham um contexto");
assert.equal(notesStarted, 2, "amostra explícita e clique devem soar");

setSoundVolume(0);
effects();
assert.equal(notesStarted, 2, "volume 0 silencia todos os efeitos");
setSoundVolume(0.4);
setSoundEnabled(false);
effects();
assert.equal(notesStarted, 2, "desligar silencia imediatamente as próximas ações");

console.log("✓ sons clínicos: opt-in, gesto, amostra, mute e silêncio ao navegar");

import assert from "node:assert/strict";

// Ambiente mínimo de navegador: conta quantos AudioContext foram criados.
let created = 0;
class FakeParam { setValueAtTime() {} linearRampToValueAtTime() {} exponentialRampToValueAtTime() {} }
class FakeNode { connect() { return this; } start() {} stop() {} frequency = new FakeParam(); gain = new FakeParam(); Q = new FakeParam(); type = ""; }
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
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) },
});
Object.defineProperty(globalThis, "navigator", { value: { userActivation: activation }, configurable: true });

const { softWhoosh, softTap, softSuccess, softBell } = await import("../../client/src/lib/softSounds");

// Montagem por link direto, sem gesto: nenhum contexto de áudio é criado.
softWhoosh(); softTap(); softSuccess(); softBell();
assert.equal(created, 0, "sem gesto do usuário não pode haver AudioContext");

// Depois do primeiro gesto o som volta a funcionar, com um único contexto.
activation.hasBeenActive = true;
softWhoosh(); softTap();
assert.equal(created, 1);

// Navegador sem userActivation: comportamento anterior preservado.
Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
softSuccess();
assert.equal(created, 1, "contexto reaproveitado");

console.log("✓ sons de interface só criam AudioContext depois do primeiro gesto");

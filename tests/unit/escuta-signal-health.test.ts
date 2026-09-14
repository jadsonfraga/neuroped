import assert from 'node:assert/strict';
import { EscutaSignalHealth } from '../../client/src/lib/escutaSignalHealth.ts';
import { EscutaRecorder } from '../../client/src/lib/escutaRecorder.ts';
const voice = Int16Array.from({ length: 16000 }, (_, i) => Math.round(300 * Math.sin(i * 0.1)));
const silence = new Int16Array(16000);
const impulse = silence.slice(); impulse[0] = 32767;
function health(parts: Int16Array[]) { const h = new EscutaSignalHealth(); for (const p of parts) h.add(p); return h; }
assert.equal(health([silence]).usable, false);
assert.equal(health([impulse]).usable, false);
assert.equal(health([voice]).usable, true);
assert.equal(health([voice.subarray(0, 1600)]).usable, false);
const long = health([impulse]); for (let i = 0; i < 3599; i++) long.add(silence);
assert.equal(long.usable, false);
const sparse = health([voice]); for (let i = 0; i < 3599; i++) sparse.add(silence);
assert.equal(sparse.usable, false);
const conversation = new EscutaSignalHealth(); for (let i = 0; i < 3600; i++) conversation.add(i % 5 === 0 ? voice : silence);
assert.equal(conversation.usable, true);
const split = new EscutaSignalHealth(); for (let i = 0; i < voice.length; i += 137) split.add(voice.subarray(i, i + 137));
assert.equal(split.activeSamples, health([voice]).activeSamples);
const recorder = new EscutaRecorder(() => {});
recorder.parts = [voice]; recorder.ensureAudible();
recorder.parts = [impulse, ...Array(3599).fill(silence)]; assert.throws(() => recorder.ensureAudible(), /Sinal insuficiente/);
recorder.parts = [silence]; assert.throws(() => recorder.ensureAudible(), /Sinal insuficiente/);
console.log('PASS signal health: silence, impulse, short signal, 60-minute sparse/full captures, chunk boundaries and replaced PCM');
// Recorder lifecycle with synthetic browser interfaces; hardware behavior is a separate gate.
const saved = new Map<string, PropertyDescriptor | undefined>();
function stub(name: string, value: unknown) { saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name)); Object.defineProperty(globalThis, name, { value, configurable: true, writable: true }); }
let tick: (() => void) | undefined;
let now = 0;
const realNow = Date.now;
const warnings: string[] = [];
let port: { onmessage?: (event: { data: unknown }) => void; postMessage: (message: string) => void };
const track = { readyState: 'live', stop() {}, addEventListener() {} };
const connection = { connect() {}, disconnect() {} };
try {
  Date.now = () => now;
  stub('window', { isSecureContext: true, AudioWorkletNode: true, setInterval(fn: () => void) { tick = fn; return 1; } });
  stub('navigator', { mediaDevices: { async getUserMedia() { return { getAudioTracks: () => [track], getTracks: () => [track] }; } } });
  stub('requestAnimationFrame', () => 1); stub('cancelAnimationFrame', () => {});
  stub('AudioContext', class {
    state = 'running'; destination = {}; audioWorklet = { async addModule() {} };
    createMediaStreamSource() { return connection; }
    createGain() { return { ...connection, gain: { value: 0 } }; }
    createAnalyser() { return { fftSize: 256, getFloatTimeDomainData() {} }; }
    async resume() {} async close() {}
  });
  stub('AudioWorkletNode', class {
    port = port = { postMessage(message: string) { if (message === 'stop') port.onmessage?.({ data: { ended: true } }); } };
    connect() {} disconnect() {}
  });
  const live = new EscutaRecorder((_state, _seconds, _level, warning) => { if (warning) warnings.push(warning); });
  await live.start();
  port!.onmessage?.({ data: { pcm: impulse, peak: 1 } });
  now = 8000; tick!(); assert.equal(warnings.length, 1);
  port!.onmessage?.({ data: { pcm: voice } });
  now = 16000; tick!(); assert.equal(warnings.length, 2, 'past voice must not suppress later silence');
  live.pause(); now = 32000; tick!(); assert.equal(warnings.length, 2);
  live.resume(); tick!(); assert.equal(warnings.length, 2, 'resume begins a fresh silence interval');
  now = 40000; tick!(); assert.equal(warnings.length, 3);
  await live.stop(); assert.equal(live.state, 'stopped');
  live.destroy();
  assert.equal(live.parts.length, 0);
  assert.throws(() => live.ensureAudible(), /Sinal insuficiente/);
  console.log('PASS recurring silence warnings, pause/resume, stop and destroy (synthetic browser interfaces)');
} finally {
  Date.now = realNow;
  for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }
}

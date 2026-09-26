// Garante que os WAVs de controle do gate manual da PR #855 são exatamente os
// gerados pelo script (bytes idênticos), têm cabeçalho válido e, pelos limiares
// técnicos descritos na PR (janelas de 20 ms, piso PCM 16, 25% das amostras),
// não contêm nenhuma janela ativa: ambos devem cair em "sinal insuficiente".
// Não importa a classe da PR (ela não existe fora daquela branch); replica só o
// critério de contagem por janela, sem inventar limiar novo.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { controlWavs, FIXTURE_DIR, FILES, SAMPLE_RATE, SECONDS, PEAK_AT_SECONDS } from "../../scripts/escuta-gate-wav-controle.mjs";

let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`PASS ${name}`); }
const generated = controlWavs();
const fixtures = Object.fromEntries(Object.values(FILES).map(name => [name, new Uint8Array(readFileSync(join(FIXTURE_DIR, name)))]));
const ascii = (bytes, o, n) => String.fromCharCode(...bytes.subarray(o, o + n));
const samples = bytes => new Int16Array(bytes.buffer, bytes.byteOffset + 44, (bytes.length - 44) / 2);
function activeWindows(pcm) {
  const win = Math.round(SAMPLE_RATE * 0.02); let active = 0;
  for (let i = 0; i + win <= pcm.length; i += win) {
    let above = 0, energy = 0;
    for (let j = i; j < i + win; j++) { if (Math.abs(pcm[j]) >= 16) above++; energy += (pcm[j] / 32768) ** 2; }
    if (above >= win * 0.25 && Math.sqrt(energy / win) >= 0.0005) active++;
  }
  return active;
}

check("fixtures são byte a byte iguais à geração determinística", () => {
  for (const [name, bytes] of Object.entries(generated)) {
    assert.equal(fixtures[name].length, bytes.length, name);
    assert.ok(fixtures[name].every((b, i) => b === bytes[i]), `${name} diverge do gerador`);
  }
});
check("cabeçalho WAV PCM 16 bits mono 16 kHz com 30 s", () => {
  for (const bytes of Object.values(fixtures)) {
    const v = new DataView(bytes.buffer, bytes.byteOffset);
    assert.equal(ascii(bytes, 0, 4), "RIFF"); assert.equal(ascii(bytes, 8, 4), "WAVE"); assert.equal(ascii(bytes, 12, 4), "fmt "); assert.equal(ascii(bytes, 36, 4), "data");
    assert.equal(v.getUint16(20, true), 1); assert.equal(v.getUint16(22, true), 1); assert.equal(v.getUint32(24, true), SAMPLE_RATE); assert.equal(v.getUint16(34, true), 16);
    assert.equal(v.getUint32(40, true), SAMPLE_RATE * SECONDS * 2); assert.equal(v.getUint32(4, true), bytes.length - 8);
  }
});
check("silêncio digital: todas as amostras zero", () => {
  const pcm = samples(fixtures[FILES.silence]);
  assert.equal(pcm.length, SAMPLE_RATE * SECONDS); assert.ok(pcm.every(s => s === 0));
});
check("pico isolado: uma única amostra em fundo de escala, aos 15 s", () => {
  const pcm = samples(fixtures[FILES.peak]);
  const nonZero = []; pcm.forEach((s, i) => { if (s !== 0) nonZero.push(i); });
  assert.deepEqual(nonZero, [SAMPLE_RATE * PEAK_AT_SECONDS]); assert.equal(pcm[SAMPLE_RATE * PEAK_AT_SECONDS], 32767);
});
check("pelos limiares da PR #855 nenhum dos dois tem janela ativa (sinal insuficiente)", () => {
  assert.equal(activeWindows(samples(fixtures[FILES.silence])), 0);
  assert.equal(activeWindows(samples(fixtures[FILES.peak])), 0);
});
console.log(`${passed} testes OK`);

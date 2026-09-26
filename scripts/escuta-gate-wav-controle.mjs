// Gera os dois WAVs de controle do gate manual da PR #855 (Escuta Clínica).
// Determinístico: mesma entrada, mesmos bytes. Sem carimbo de tempo.
// Uso: node scripts/escuta-gate-wav-controle.mjs [--check]
//   --check apenas compara os fixtures existentes com a geração e sai 1 se divergirem.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const SAMPLE_RATE = 16000; // igual ao gravador; evita ringing de resampling no pico
export const SECONDS = 30;
export const PEAK_AT_SECONDS = 15;
export const FIXTURE_DIR = join("tests", "fixtures", "escuta");
export const FILES = {
  silence: "controle-silencio-digital-30s.wav",
  peak: "controle-pico-isolado-30s.wav",
};

export function encodeWav(pcm) {
  const bytes = new Uint8Array(44 + pcm.length * 2);
  const v = new DataView(bytes.buffer);
  const ascii = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  ascii(0, "RIFF"); v.setUint32(4, 36 + pcm.length * 2, true); ascii(8, "WAVE");
  ascii(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SAMPLE_RATE, true); v.setUint32(28, SAMPLE_RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  ascii(36, "data"); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, pcm[i], true);
  return bytes;
}

export function silencePcm() { return new Int16Array(SAMPLE_RATE * SECONDS); }
export function peakPcm() { const pcm = silencePcm(); pcm[SAMPLE_RATE * PEAK_AT_SECONDS] = 32767; return pcm; }
export function controlWavs() { return { [FILES.silence]: encodeWav(silencePcm()), [FILES.peak]: encodeWav(peakPcm()) }; }

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop())) {
  const check = process.argv.includes("--check");
  const generated = controlWavs();
  let dirty = false;
  mkdirSync(FIXTURE_DIR, { recursive: true });
  for (const [name, bytes] of Object.entries(generated)) {
    const path = join(FIXTURE_DIR, name);
    if (check) {
      let current = null; try { current = readFileSync(path); } catch { /* ausente */ }
      const same = current && current.length === bytes.length && current.every((b, i) => b === bytes[i]);
      console.log(`${same ? "OK  " : "DIFF"} ${path}`); if (!same) dirty = true;
    } else { writeFileSync(path, bytes); console.log(`WROTE ${path} (${bytes.length} bytes)`); }
  }
  if (dirty) process.exit(1);
}

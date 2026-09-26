/**
 * Trilha chiptune do Super NeuroPad Game — Web Audio puro, estilo videogame
 * dos anos 90 (onda quadrada na melodia, triângulo no baixo, ruído na
 * percussão). Nenhum arquivo de áudio: tudo é sintetizado no dispositivo.
 *
 * Só toca depois de gesto do usuário (o navegador exige), respeita a
 * preferência global de som do NeuroPed e para sozinha ao sair da página.
 */
import { getSoundVolume, isSoundEnabled } from "@/lib/softSounds";

const BPM = 150;
const STEP = 60 / BPM / 4; // semicolcheia
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

// Notas MIDI (0 = pausa). Duas frases de 32 semicolcheias em Dó maior.
const MELODY_A = [72, 0, 76, 0, 79, 0, 76, 0, 72, 0, 76, 0, 79, 81, 79, 0, 77, 0, 74, 0, 77, 0, 74, 0, 72, 0, 74, 0, 76, 0, 0, 0];
const MELODY_B = [79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 81, 0, 83, 0, 84, 0, 83, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 0, 0];
// Baixo em colcheias (uma nota a cada 2 passos).
const BASS_A = [48, 48, 55, 55, 53, 53, 55, 55, 48, 48, 55, 55, 53, 53, 52, 50];
const BASS_B = [55, 55, 52, 52, 53, 53, 57, 57, 55, 55, 52, 52, 53, 53, 55, 55];
const PATTERN_STEPS = 32;

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export interface Chiptune {
  start(): void;
  stop(): void;
  isPlaying(): boolean;
}

export function createChiptune(): Chiptune {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let timer: number | null = null;
  let nextTime = 0;
  let step = 0;
  let playing = false;

  function ensureContext(): boolean {
    if (typeof window === "undefined") return false;
    if (ctx && master) return true;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return false;
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const length = Math.floor(ctx.sampleRate * 0.08);
      noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      return true;
    } catch {
      ctx = null;
      master = null;
      return false;
    }
  }

  function tone(type: OscillatorType, freq: number, at: number, duration: number, volume: number) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(volume, at + 0.01);
    gain.gain.setValueAtTime(volume, at + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  function hat(at: number, volume: number) {
    if (!ctx || !master || !noise) return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noise;
    filter.type = "highpass";
    filter.frequency.value = 6000;
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(at);
    source.stop(at + 0.06);
  }

  function kick(at: number, volume: number) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(45, at + 0.12);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.14);
    osc.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + 0.16);
  }

  function scheduleStep(index: number, at: number) {
    const phrase = Math.floor(index / PATTERN_STEPS) % 2 === 0;
    const local = index % PATTERN_STEPS;
    const melody = (phrase ? MELODY_A : MELODY_B)[local];
    if (melody) tone("square", midiToFreq(melody), at, STEP * 1.6, 0.16);
    if (local % 2 === 0) {
      const bass = (phrase ? BASS_A : BASS_B)[local / 2];
      if (bass) tone("triangle", midiToFreq(bass), at, STEP * 1.8, 0.22);
      hat(at, local % 4 === 2 ? 0.05 : 0.025);
    }
    if (local % 8 === 0) kick(at, 0.5);
  }

  function tick() {
    if (!ctx || !playing) return;
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(step, nextTime);
      nextTime += STEP;
      step = (step + 1) % (PATTERN_STEPS * 2);
    }
  }

  return {
    start() {
      if (playing || !isSoundEnabled() || !ensureContext() || !ctx || !master) return;
      playing = true;
      if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
      step = 0;
      nextTime = ctx.currentTime + 0.05;
      const level = 0.35 * getSoundVolume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.4);
      timer = window.setInterval(tick, LOOKAHEAD_MS);
      tick();
    },
    stop() {
      if (!playing) return;
      playing = false;
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      }
    },
    isPlaying() {
      return playing;
    },
  };
}

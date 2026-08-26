/**
 * Sistema de som de interface do NeuroPed.
 *
 * O som é feedback funcional — não música de fundo. Os eventos são breves,
 * com volume baixo, envelopes suaves e canais equivalentes visuais/hápticos.
 * A preferência fica no dispositivo e nunca interfere no conteúdo clínico.
 */

let _ctx: AudioContext | null = null;
let _lastHoverAt = 0;

const STORAGE_KEY = "neuroped:sounds";
const VOLUME_STORAGE_KEY = "neuroped:sound-volume";
export const SOUND_PREFERENCE_EVENT = "neuroped:sound-preference-changed";
const DEFAULT_VOLUME = 0.58;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    _ctx = new Ctx();
    return _ctx;
  } catch {
    return null;
  }
}

function emitPreferenceChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SOUND_PREFERENCE_EVENT));
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, value));
}

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* storage indisponível (modo privado/cota) — silencioso */
  }
  emitPreferenceChange();
}

export function getSoundVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored === null) return DEFAULT_VOLUME;
    return clampVolume(Number(stored));
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function setSoundVolume(value: number): void {
  const nextValue = clampVolume(value);
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, String(nextValue));
  } catch {
    /* storage indisponível (modo privado/cota) — silencioso */
  }
  emitPreferenceChange();
}

function play(spec: {
  type?: OscillatorType;
  freq: number | [number, number];
  duration: number;
  volume?: number;
  attack?: number;
  release?: number;
  filterFreq?: number;
}) {
  if (!isSoundEnabled() || getSoundVolume() === 0) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Resume context se suspenso (Chrome auto-suspend antes de user gesture).
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.value = spec.filterFreq ?? 8000;
    filter.Q.value = 0.7;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = spec.type ?? "sine";

    const now = ctx.currentTime;
    const attack = spec.attack ?? 0.005;
    const peak = (spec.volume ?? 0.06) * getSoundVolume();

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.setValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

    if (Array.isArray(spec.freq)) {
      osc.frequency.setValueAtTime(spec.freq[0], now);
      osc.frequency.exponentialRampToValueAtTime(
        spec.freq[1],
        now + spec.duration,
      );
    } else {
      osc.frequency.setValueAtTime(spec.freq, now);
    }

    osc.start(now);
    osc.stop(now + spec.duration + 0.05);
  } catch {
    /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */
  }
}

/** Toque suave em botão primário / clique de CTA. */
export function softTap(): void {
  play({
    type: "sine",
    freq: 880,
    duration: 0.08,
    volume: 0.05,
    attack: 0.002,
  });
}

/** Hover/foco discreto, limitado para não criar uma sequência de bipes. */
export function softHover(): void {
  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - _lastHoverAt < 160) return;
  _lastHoverAt = now;
  play({
    type: "sine",
    freq: 1320,
    duration: 0.05,
    volume: 0.025,
    attack: 0.001,
  });
}

/** Confirmação geral para salvar, concluir ou autenticar. */
export function softSuccess(): void {
  if (!isSoundEnabled() || getSoundVolume() === 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, index) => {
    window.setTimeout(() => {
      play({ type: "sine", freq, duration: 0.18, volume: 0.045, attack: 0.01 });
    }, index * 60);
  });
}

/** Erro/alerta: tom médio, curto e filtrado. */
export function softError(): void {
  play({
    type: "triangle",
    freq: [440, 294],
    duration: 0.22,
    volume: 0.06,
    attack: 0.003,
    filterFreq: 4000,
  });
}

/** Notificação sutil para informação contextual. */
export function softBell(): void {
  if (!isSoundEnabled() || getSoundVolume() === 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  play({
    type: "sine",
    freq: 1046.5,
    duration: 0.4,
    volume: 0.045,
    attack: 0.005,
  });
  window.setTimeout(() => {
    play({
      type: "sine",
      freq: 1568,
      duration: 0.3,
      volume: 0.025,
      attack: 0.005,
    });
  }, 30);
}

/** Transição de página curta, usada somente em mudança de rota. */
export function softWhoosh(): void {
  play({
    type: "sine",
    freq: [200, 800],
    duration: 0.14,
    volume: 0.035,
    attack: 0.01,
    filterFreq: 6000,
  });
}

/** Seleção de checkbox/radio e confirmação leve de escolha. */
export function softTick(): void {
  play({
    type: "sine",
    freq: 2200,
    duration: 0.04,
    volume: 0.04,
    attack: 0.001,
  });
}

/** Alias semântico para componentes novos. */
export const softSelect = softTick;

/** Feedback de mute/desmute: toca apenas ao habilitar ou a pedido explícito. */
export function softMuteHint(): void {
  const ctx = getCtx();
  if (!ctx || getSoundVolume() === 0) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const now = ctx.currentTime;
    const peak = 0.05 * getSoundVolume();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.13);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */
  }
}

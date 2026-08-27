/**
 * Sistema de som de interface do NeuroPed.
 *
 * Política clínica:
 * - som funcional habilitado por padrão, com controle explícito para desligar;
 * - áudio nunca é o único canal de feedback;
 * - sem música, autoplay, hover, clique genérico ou transição de rota;
 * - sons ficam reservados a seleção explícita, confirmação, informação e alerta;
 * - preferências persistem apenas neste dispositivo.
 */

let _ctx: AudioContext | null = null;

const STORAGE_KEY = "neuroped:sounds";
const VOLUME_STORAGE_KEY = "neuroped:sound-volume";
export const SOUND_PREFERENCE_EVENT = "neuroped:sound-preference-changed";
const DEFAULT_VOLUME = 0.35;

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
    /* storage indisponível (modo privado/cota) — mantém padrão habilitado */
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
    /* storage indisponível (modo privado/cota) — usa volume padrão */
  }
  emitPreferenceChange();
}

function canPlay(): boolean {
  if (!isSoundEnabled() || getSoundVolume() === 0) return false;
  if (typeof document !== "undefined" && document.visibilityState === "hidden") {
    return false;
  }
  return true;
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
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;

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

/**
 * Compatibilidade com componentes antigos.
 * Cliques rotineiros ficam silenciosos por política de produto.
 */
export function softTap(): void {
  /* intencionalmente silencioso */
}

/**
 * Compatibilidade com componentes antigos.
 * Hover nunca produz áudio no fluxo clínico.
 */
export function softHover(): void {
  /* intencionalmente silencioso */
}

/** Confirmação relevante para salvar, concluir ou autenticar. */
export function softSuccess(): void {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const notes = [523.25, 659.25, 783.99];
  notes.forEach((freq, index) => {
    window.setTimeout(() => {
      play({
        type: "sine",
        freq,
        duration: 0.18,
        volume: 0.045,
        attack: 0.01,
      });
    }, index * 60);
  });
}

/** Erro/alerta relevante: tom curto e filtrado. */
export function softError(): void {
  play({
    type: "triangle",
    freq: [440, 294],
    duration: 0.22,
    volume: 0.055,
    attack: 0.003,
    filterFreq: 4000,
  });
}

/** Informação contextual relevante e não urgente. */
export function softBell(): void {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  play({
    type: "sine",
    freq: 1046.5,
    duration: 0.28,
    volume: 0.035,
    attack: 0.005,
  });
}

/**
 * Compatibilidade com componentes antigos.
 * Mudança de rota permanece silenciosa para preservar concentração.
 */
export function softWhoosh(): void {
  /* intencionalmente silencioso */
}

/** Seleção explícita de checkbox/radio ou escolha equivalente. */
export function softTick(): void {
  play({
    type: "sine",
    freq: 1800,
    duration: 0.035,
    volume: 0.03,
    attack: 0.001,
  });
}

/** Alias semântico para componentes novos. */
export const softSelect = softTick;

/** Feedback emitido quando o usuário habilita som novamente. */
export function softMuteHint(): void {
  if (!canPlay()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    const now = ctx.currentTime;
    const peak = 0.04 * getSoundVolume();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.13);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */
  }
}

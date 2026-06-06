/**
 * Sons UI premium para fluxos profissionais (login, consentimento, navegacao adulta).
 *
 * Filosofia: sons sintetizados via Web Audio com envelopes suaves (attack/release
 * lentos), oitavas medias e altas em tons "warm" (sem dissonancia). Volume baixo
 * (0.04-0.08) para nao incomodar em uso prolongado.
 *
 * Conviventes com sounds.ts (retro 8-bit, usado em testes ludicos infantis).
 *
 * Mute toggle:
 *  - Persistido em localStorage["neuroped:sounds"] = "on" | "off"
 *  - Default: "on" (mas respeita prefers-reduced-motion como hint)
 *  - Hook useSoundEnabled() em React
 */

let _ctx: AudioContext | null = null;

const STORAGE_KEY = "neuroped:sounds";

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

export function isSoundEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "off") return false;
    return true;
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
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
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Resume context se suspenso (Chrome auto-suspend antes de user gesture)
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
    const release = spec.release ?? spec.duration * 0.6;
    const peak = spec.volume ?? 0.06;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.setValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + spec.duration);

    if (Array.isArray(spec.freq)) {
      osc.frequency.setValueAtTime(spec.freq[0], now);
      osc.frequency.exponentialRampToValueAtTime(spec.freq[1], now + spec.duration);
    } else {
      osc.frequency.setValueAtTime(spec.freq, now);
    }

    osc.start(now);
    osc.stop(now + spec.duration + 0.05);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

/** Toque suave em botao primario / clique de CTA. ~80ms warm. */
export function softTap(): void {
  play({ type: "sine", freq: 880, duration: 0.08, volume: 0.05, attack: 0.002, release: 0.07 });
}

/** Hover/foco discreto. Quase imperceptivel mas presente. */
export function softHover(): void {
  play({ type: "sine", freq: 1320, duration: 0.05, volume: 0.025, attack: 0.001, release: 0.045 });
}

/** Sucesso geral (login OK, save). Acorde menor maior asc. */
export function softSuccess(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  // Acorde C-E-G ascendente em sine warm
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    setTimeout(() => {
      play({ type: "sine", freq, duration: 0.18, volume: 0.045, attack: 0.01, release: 0.16 });
    }, i * 60);
  });
}

/** Erro/alerta. Tom medio, decay rapido, com filtro mais fechado. */
export function softError(): void {
  play({
    type: "triangle",
    freq: [440, 294], // A4 -> D4 desc
    duration: 0.22,
    volume: 0.06,
    attack: 0.003,
    release: 0.2,
    filterFreq: 4000,
  });
}

/** Notificacao sutil (toast info). Sino warm. */
export function softBell(): void {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  // Combinacao de fundamental + harmonica
  play({ type: "sine", freq: 1046.5, duration: 0.4, volume: 0.045, attack: 0.005, release: 0.38 });
  setTimeout(() => {
    play({ type: "sine", freq: 1568, duration: 0.3, volume: 0.025, attack: 0.005, release: 0.28 });
  }, 30);
}

/** Transicao de pagina (page enter). Sweep curto warm. */
export function softWhoosh(): void {
  play({
    type: "sine",
    freq: [200, 800],
    duration: 0.14,
    volume: 0.035,
    attack: 0.01,
    release: 0.12,
    filterFreq: 6000,
  });
}

/** Selecao de checkbox / radio. Tic curto. */
export function softTick(): void {
  play({ type: "sine", freq: 2200, duration: 0.04, volume: 0.04, attack: 0.001, release: 0.038 });
}

/** Ao colocar mute, toca um som suave avisando. */
export function softMuteHint(): void {
  // Toca mesmo se mute estiver "off", para confirmacao ao usuario
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
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.13);
    osc.start(now);
    osc.stop(now + 0.18);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

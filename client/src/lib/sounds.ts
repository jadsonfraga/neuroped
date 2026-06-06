// ═══════════════════════════════════════════════════════════
// NeuroPed Sound FX — Retro 8-bit Style (Web Audio API)
// Inspirado em sound design de jogos clássicos dos anos 80
// ═══════════════════════════════════════════════════════════

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

// ── COIN (navegar, selecionar item) ── ding-ding agudo
export function playCoin() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(988, ctx.currentTime);      // B5
    osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.07); // E6
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── POWER-UP (completar escala, resultado positivo) ── escalada ascendente
export function playPowerUp() {
  try {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5→G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      const t = ctx.currentTime + i * 0.06;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.frequency.setValueAtTime(freq, t);
      osc.start(t);
      osc.stop(t + 0.08);
    });
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── 1-UP (envio de email com sucesso) ── melodia alegre
export function play1Up() {
  try {
    const ctx = getCtx();
    const melody = [
      { f: 659, d: 0.08 },  // E5
      { f: 784, d: 0.08 },  // G5
      { f: 1047, d: 0.08 }, // C6
      { f: 784, d: 0.08 },  // G5
      { f: 880, d: 0.08 },  // A5
      { f: 1175, d: 0.15 }, // D6
    ];
    let t = ctx.currentTime;
    melody.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      gain.gain.setValueAtTime(0.07, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
      osc.frequency.setValueAtTime(n.f, t);
      osc.start(t);
      osc.stop(t + n.d + 0.01);
      t += n.d;
    });
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── JUMP (clicar botão, abrir seção) ── sweep ascendente rápido
export function playJump() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── BUMP (erro, senha errada) ── tom grave descendente
export function playBump() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── FIREBALL (gerar PDF) ── whoosh
export function playFireball() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── PIPE (navegação entre páginas) ── tom tubular
export function playPipe() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(330, ctx.currentTime + 0.06);
    osc.frequency.setValueAtTime(220, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

// ── FLAG POLE (login com sucesso) ── fanfarra de vitória
export function playFlagPole() {
  try {
    const ctx = getCtx();
    const fanfare = [
      { f: 392, d: 0.1 },  // G4
      { f: 523, d: 0.1 },  // C5
      { f: 659, d: 0.1 },  // E5
      { f: 784, d: 0.1 },  // G5
      { f: 1047, d: 0.1 }, // C6
      { f: 1319, d: 0.2 }, // E6
    ];
    let t = ctx.currentTime;
    fanfare.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
      osc.frequency.setValueAtTime(n.f, t);
      osc.start(t);
      osc.stop(t + n.d + 0.01);
      t += n.d;
    });
  } catch { /* áudio indisponível (Web Audio bloqueado/sem suporte) — silencioso */ }
}

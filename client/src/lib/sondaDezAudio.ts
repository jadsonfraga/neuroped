/** Som sintetizado no dispositivo: sem rede, voz remota ou permissão de microfone. */
export async function playSondaTone(): Promise<void> {
  if (typeof AudioContext === "undefined")
    throw new Error("Som não disponível neste navegador.");
  const context = new AudioContext();
  try {
    await context.resume();
    if (context.state !== "running")
      throw new Error("Som bloqueado. Confira o navegador e o volume.");
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.linearRampToValueAtTime(0, now + 0.45);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(440, now);
    oscillator.connect(gain);
    gain.connect(context.destination);
    await new Promise<void>((resolve) => {
      oscillator.onended = () => resolve();
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    });
  } finally {
    await context.close();
  }
}

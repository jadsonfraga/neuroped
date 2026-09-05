/* Captura PCM real. Nenhuma gravação inicia sem getUserMedia acionado pelo usuário. */
class EscutaRecorder extends AudioWorkletProcessor {
  constructor() {
    super(); this.paused = false; this.stopped = false; this.phase = 0; this.sum = 0; this.count = 0;
    this.samples = new Int16Array(16000); this.offset = 0; this.total = 0;
    this.port.onmessage = ({ data }) => {
      if (data === "pause") this.paused = true;
      if (data === "resume") this.paused = false;
      if (data === "stop") { this.flush(); this.stopped = true; this.port.postMessage({ ended: true }); }
    };
  }
  flush() {
    if (!this.offset) return;
    const pcm = this.samples.slice(0, this.offset); this.offset = 0;
    this.port.postMessage({ pcm, total: this.total }, [pcm.buffer]);
  }
  process(inputs) {
    if (this.stopped) return false;
    const input = inputs[0]?.[0];
    if (this.paused || !input) return true;
    for (const value of input) {
      this.sum += value; this.count++; this.phase += 16000;
      if (this.phase >= sampleRate) {
        this.phase -= sampleRate;
        const normalized = Math.max(-1, Math.min(1, this.sum / this.count));
        this.samples[this.offset++] = Math.round(normalized * (normalized < 0 ? 32768 : 32767));
        this.sum = 0; this.count = 0; this.total++;
        if (this.offset === this.samples.length) this.flush();
        if (this.total >= 16000 * 3600) { this.flush(); this.stopped = true; this.port.postMessage({ ended: true, limit: true }); return false; }
      }
    }
    return true;
  }
}
registerProcessor("escuta-recorder", EscutaRecorder);

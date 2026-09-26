// Signal presence only: these engineering thresholds do not establish speech intelligibility.
export class EscutaSignalHealth {
  totalSamples = 0;
  activeSamples = 0;
  private count = 0;
  private aboveFloor = 0;
  private energy = 0;
  constructor(private sampleRate = 16000) {}
  add(pcm: Int16Array): void {
    const windowSamples = Math.round(this.sampleRate * 0.02);
    for (const sample of pcm) {
      this.totalSamples++;
      this.count++;
      this.energy += (sample / 32768) ** 2;
      if (Math.abs(sample) >= 16) this.aboveFloor++;
      if (this.count === windowSamples) {
        // A single impulse cannot qualify even when it raises the window RMS.
        if (this.aboveFloor >= windowSamples * 0.25 && Math.sqrt(this.energy / this.count) >= 0.0005) {
          this.activeSamples += this.count;
        }
        this.count = 0; this.aboveFloor = 0; this.energy = 0;
      }
    }
  }
  get usable(): boolean {
    return this.activeSamples >= this.sampleRate * 0.2 && this.activeSamples >= this.totalSamples * 0.01;
  }
}

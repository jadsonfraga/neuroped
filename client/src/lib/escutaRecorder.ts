import { CHUNK_SECONDS, SAMPLE_RATE, MAX_RECORDING_SECONDS, encodeWav } from "@shared/escuta/core";
export type RecordingState = "idle" | "requesting" | "recording" | "paused" | "stopped";
export class EscutaRecorder {
  parts: Int16Array[] = [];
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private generation = 0;
  private raf = 0;
  private finish: (() => void) | null = null;
  state: RecordingState = "idle";
  constructor(private changed: (state: RecordingState, seconds: number, level: number) => void) {}
  private report(level = 0) { this.changed(this.state, this.parts.reduce((n,p)=>n+p.length,0)/SAMPLE_RATE, level); }
  async start() {
    if (["requesting","recording","paused"].includes(this.state)) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.AudioWorkletNode) throw new Error("A gravação exige HTTPS e navegador com AudioWorklet. Use Safari ou Chrome atualizado.");
    const generation = ++this.generation; this.state = "requesting"; this.report();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }, video: false });
      if (generation !== this.generation) { stream.getTracks().forEach(t=>t.stop()); return; }
      this.stream = stream; const context = new AudioContext(); this.context = context;
      await context.audioWorklet.addModule("/audio/escuta-recorder.js");
      if (generation !== this.generation) { stream.getTracks().forEach(t=>t.stop()); await context.close(); return; }
      const source = context.createMediaStreamSource(stream); const node = new AudioWorkletNode(context,"escuta-recorder"); this.node = node;
      const silent = context.createGain(); silent.gain.value = 0; source.connect(node); node.connect(silent); silent.connect(context.destination);
      const analyser = context.createAnalyser(); analyser.fftSize = 256; source.connect(analyser); const values = new Float32Array(analyser.fftSize);
      this.parts = []; this.state = "recording";
      node.port.onmessage = ({ data }) => {
        if (generation !== this.generation) return;
        if (data.pcm instanceof Int16Array) this.parts.push(data.pcm);
        if (data.ended) { this.state = "stopped"; this.release(); this.finish?.(); this.finish = null; }
        this.report();
      };
      const meter = () => { if (generation !== this.generation || !this.context) return; analyser.getFloatTimeDomainData(values); const level = Math.min(1,Math.sqrt(values.reduce((s,v)=>s+v*v,0)/values.length)*5); this.report(this.state === "paused" ? 0 : level); this.raf = requestAnimationFrame(meter); };
      await context.resume(); meter();
    } catch (error) {
      if (generation !== this.generation) return;
      this.release(); this.state = "idle"; this.report();
      if (error instanceof DOMException && error.name === "NotAllowedError") throw new Error("Microfone não autorizado. Libere a permissão do site no navegador.");
      throw error;
    }
  }
  pause() { if (this.state === "recording") { this.node?.port.postMessage("pause"); this.state = "paused"; this.report(); } }
  resume() { if (this.state === "paused") { this.node?.port.postMessage("resume"); this.state = "recording"; this.report(); } }
  async stop(): Promise<void> {
    if (!["recording","paused"].includes(this.state)) return;
    await new Promise<void>((resolve,reject) => {
      const timer = setTimeout(()=>{ this.release(); this.state = "stopped"; this.report(); this.finish = null; reject(new Error("A captura foi interrompida; o último bloco pode estar incompleto. Revise o áudio antes de processar.")); },3000);
      this.finish = ()=>{clearTimeout(timer); resolve();}; this.node?.port.postMessage("stop");
    });
  }
  private release() { cancelAnimationFrame(this.raf); this.stream?.getTracks().forEach(t=>t.stop()); this.stream = null; this.node?.disconnect(); this.node = null; const context = this.context; this.context = null; if (context && context.state !== "closed") void context.close().catch(()=>undefined); }
  destroy() { ++this.generation; this.release(); this.parts = []; this.finish?.(); this.finish = null; this.state = "idle"; }
}
export function* wavChunks(parts: readonly Int16Array[]): Generator<Uint8Array> {
  const total = parts.reduce((n,p)=>n+p.length,0);
  const count = Math.max(1,Math.ceil(total/(SAMPLE_RATE*CHUNK_SECONDS)));
  let pcm = new Int16Array(Math.max(1,Math.ceil(total/count))); let offset = 0;
  for (const part of parts) for (let i = 0; i < part.length;) { const take = Math.min(pcm.length-offset,part.length-i); pcm.set(part.subarray(i,i+take),offset); offset += take; i += take; if (offset === pcm.length) { yield encodeWav(pcm); pcm = new Int16Array(pcm.length); offset = 0; } }
  if (offset) yield encodeWav(pcm.subarray(0,offset));
}
export function base64Audio(bytes: Uint8Array): string { let binary = ""; for (let i=0;i<bytes.length;i+=8192) binary += String.fromCharCode(...bytes.subarray(i,i+8192)); return btoa(binary); }
export async function decodeAudioFile(file: File): Promise<Int16Array[]> {
  if (!file.size || file.size > 25*1024*1024) throw new Error("Envie arquivo de áudio entre 1 byte e 25 MB.");
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await file.arrayBuffer());
    if (audio.duration > MAX_RECORDING_SECONDS) throw new Error("O arquivo excede 60 minutos. Nada foi cortado.");
    const offline = new OfflineAudioContext(1,Math.ceil(audio.duration*SAMPLE_RATE),SAMPLE_RATE); const source = offline.createBufferSource(); source.buffer = audio; source.connect(offline.destination); source.start();
    const mono = (await offline.startRendering()).getChannelData(0); const parts: Int16Array[] = [];
    for(let i=0;i<mono.length;i+=160000) { const slice=mono.subarray(i,i+160000); const pcm=new Int16Array(slice.length); for(let j=0;j<slice.length;j++) {const v=Math.max(-1,Math.min(1,slice[j])); pcm[j]=Math.round(v*(v<0?32768:32767));} parts.push(pcm); }
    return parts;
  } finally { await context.close(); }
}

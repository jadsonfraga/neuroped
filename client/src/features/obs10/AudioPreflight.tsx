import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

/** Optional three-second hardware check with an adult, not a clinical recording. */
export function AudioPreflight({ disabled }: { disabled: boolean }) {
  const [status, setStatus] = useState<"idle" | "permission" | "recording" | "ready">("idle");
  const [url, setUrl] = useState(""); const [error, setError] = useState("");
  const resources = useRef<{ stream?: MediaStream; recorder?: MediaRecorder; timer?: ReturnType<typeof setTimeout>; url?: string }>({});
  const generation = useRef(0); const mounted = useRef(true);
  function release() {
    generation.current += 1;
    const r = resources.current;
    if (r.timer) clearTimeout(r.timer);
    if (r.recorder?.state === "recording") r.recorder.stop();
    r.stream?.getTracks().forEach((t) => t.stop());
    if (r.url) URL.revokeObjectURL(r.url);
    resources.current = {};
  }
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; release(); }; }, []);
  useEffect(() => { if (disabled) { release(); setStatus("idle"); setUrl(""); } }, [disabled]);
  async function testAudio() {
    if (disabled || status === "permission" || status === "recording") return;
    release(); setError(""); setUrl("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setError("Teste não disponível. Confira o áudio no dispositivo institucional antes da coleta."); return; }
    const ticket = ++generation.current; setStatus("permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (ticket !== generation.current || !mounted.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      resources.current.stream = stream;
      const media = new MediaRecorder(stream); resources.current.recorder = media; const chunks: Blob[] = [];
      media.ondataavailable = (ev) => { if (ticket === generation.current && ev.data.size) chunks.push(ev.data); };
      media.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (ticket !== generation.current || !mounted.current) return;
        const blob = new Blob(chunks, { type: media.mimeType });
        if (!blob.size) { setError("Nenhum áudio foi produzido. Não considere o teste aprovado."); setStatus("idle"); return; }
        const next = URL.createObjectURL(blob); resources.current.url = next; setUrl(next); setStatus("ready");
      };
      media.onerror = () => { if (ticket === generation.current && mounted.current) { release(); setStatus("idle"); setError("Falha na gravação do teste. Confira o microfone antes da aplicação."); } };
      media.start(); setStatus("recording");
      resources.current.timer = setTimeout(() => { if (media.state === "recording") media.stop(); }, 3000);
    } catch { if (ticket === generation.current && mounted.current) { release(); setStatus("idle"); setError("Microfone não autorizado ou indisponível. O início da avaliação não foi acionado."); } }
  }
  return <details className="obs10-guide obs13-audio" data-testid="obs13-audio">
    <summary><Mic size={18} />Testar o áudio antes da criança</summary>
    <p>Com a sala preparada e <strong>sem criança nem dados pessoais</strong>, grave três segundos dizendo “teste de áudio”. Depois reproduza e confira se entende a voz. O resultado não é aprovado automaticamente.</p>
    <button type="button" disabled={disabled || status === "permission" || status === "recording"} onClick={() => void testAudio()}>Gravar 3 segundos de teste</button>
    {(status === "permission" || status === "recording") && <p role="status">{status === "permission" ? "Aguardando permissão do microfone…" : "Gravando teste por três segundos…"}<button type="button" onClick={() => { release(); setStatus("idle"); setUrl(""); }}>Cancelar teste de áudio</button></p>}
    {url && <><audio controls src={url} aria-label="Reprodução do teste de áudio" /><p>Ouça antes de iniciar a coleta. Teste local temporário, sem envio nem inclusão no registro da criança.</p><button type="button" onClick={() => { release(); setStatus("idle"); setUrl(""); }}>Descartar teste de áudio</button></>}
    {error && <p role="alert" className="obs10-error">{error}</p>}
  </details>;
}

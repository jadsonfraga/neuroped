import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "preview" | "recording" | "finalizing" | "ready";
const MAX_MEDIA_BYTES = 128 * 1024 * 1024;
const acquisitionError = "Não foi possível acessar câmera e microfone. Verifique as permissões ou use a filmagem em outro dispositivo institucional. Nenhuma sessão foi iniciada.";
/** Local-only media. Every asynchronous callback owns its generation and its tracks. */
export function useLocalRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("");
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const tracks = useRef<MediaStream | null>(null);
  const blobUrl = useRef<string | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const pendingRequest = useRef(false);
  const stopping = useRef(false);
  const phase = useRef<RecorderStatus>("idle");
  const hardStop = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizeGuard = useRef<ReturnType<typeof setTimeout> | null>(null);
  const detachEnded = useRef<() => void>(() => undefined);
  const updateStatus = useCallback((next: RecorderStatus) => {
    phase.current = next;
    if (mounted.current) setStatus(next);
  }, []);
  const releaseTracks = useCallback(() => {
    detachEnded.current();
    detachEnded.current = () => undefined;
    tracks.current?.getTracks().forEach((track) => track.stop());
    tracks.current = null;
    if (mounted.current) setStream(null);
    if (hardStop.current) clearTimeout(hardStop.current);
    hardStop.current = null;
  }, []);
  const stop = useCallback(() => {
    if (stopping.current) return;
    const current = recorder.current;
    if (current && current.state !== "inactive") {
      stopping.current = true;
      updateStatus("finalizing");
      current.stop();
      const ticket = generation.current;
      finalizeGuard.current = setTimeout(() => {
        if (!mounted.current || generation.current !== ticket || phase.current !== "finalizing") return;
        setError("O navegador não finalizou o arquivo. O registro pode ser exportado, mas não presuma que o vídeo foi salvo.");
        updateStatus("idle");
      }, 8000);
    } else if (phase.current !== "ready" && phase.current !== "finalizing") {
      updateStatus("idle");
    }
    releaseTracks();
  }, [releaseTracks, updateStatus]);
  const reset = useCallback(() => {
    generation.current += 1;
    pendingRequest.current = false;
    if (hardStop.current) clearTimeout(hardStop.current);
    if (finalizeGuard.current) clearTimeout(finalizeGuard.current);
    finalizeGuard.current = null;
    const current = recorder.current;
    if (current && current.state !== "inactive") current.stop();
    releaseTracks();
    recorder.current = null;
    stopping.current = false;
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = null;
    updateStatus("idle");
    if (mounted.current) { setUrl(null); setMime(""); setError(""); }
  }, [releaseTracks, updateStatus]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; reset(); };
  }, [reset]);
  useEffect(() => {
    const hiddenPreview = () => {
      if (document.hidden && (phase.current === "preview" || phase.current === "requesting")) {
        reset();
        setError("Câmera cancelada ao sair da aba. Volte à avaliação e inicie novamente quando estiver pronta.");
      }
    };
    document.addEventListener("visibilitychange", hiddenPreview);
    return () => document.removeEventListener("visibilitychange", hiddenPreview);
  }, [reset]);

  const prepare = useCallback(async (): Promise<boolean> => {
    if (document.hidden) {
      setError("Abra a aba da avaliação antes de autorizar a câmera.");
      return false;
    }
    if (phase.current === "preview" && tracks.current?.getTracks().every((track) => track.readyState === "live")) return true;
    if (pendingRequest.current || phase.current === "recording" || phase.current === "finalizing") return false;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Gravação indisponível neste navegador. Use outro dispositivo institucional para filmar e desmarque a câmera integrada.");
      return false;
    }
    reset();
    const ticket = ++generation.current;
    pendingRequest.current = true;
    updateStatus("requesting");
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } });
      if (!mounted.current || generation.current !== ticket) {
        acquired.getTracks().forEach((track) => track.stop());
        return false;
      }
      if (document.hidden) {
        acquired.getTracks().forEach((track) => track.stop());
        reset();
        setError("Câmera cancelada ao sair da aba. Nenhuma coleta foi iniciada.");
        return false;
      }
      if (!acquired.getAudioTracks().length || !acquired.getVideoTracks().length || acquired.getTracks().some((track) => track.readyState !== "live")) {
        acquired.getTracks().forEach((track) => track.stop());
        throw new Error("Missing live audio/video track");
      }
      tracks.current = acquired;
      pendingRequest.current = false;
      setStream(acquired);
      const ended = () => {
        if (!mounted.current || generation.current !== ticket || stopping.current) return;
        setError("A câmera ou o microfone foi desconectado. Coleta interrompida; confira o arquivo parcial e chame a equipe.");
        stop();
      };
      acquired.getTracks().forEach((track) => track.addEventListener("ended", ended));
      detachEnded.current = () => acquired.getTracks().forEach((track) => track.removeEventListener("ended", ended));
      updateStatus("preview");
      return true;
    } catch {
      // A rejected old permission request must never close a newer camera session.
      if (!mounted.current || generation.current !== ticket) return false;
      pendingRequest.current = false;
      releaseTracks();
      updateStatus("idle");
      setError(acquisitionError);
      return false;
    }
  }, [releaseTracks, reset, stop, updateStatus]);

  const start = useCallback(async (): Promise<boolean> => {
    if (phase.current === "recording" || phase.current === "finalizing") return false;
    if (!(await prepare())) return false;
    const acquired = tracks.current;
    const ticket = generation.current;
    if (!acquired || !mounted.current || phase.current !== "preview" || document.hidden) {
      if (acquired && document.hidden) reset();
      return false;
    }
    try {
      const preferred = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const media = new MediaRecorder(acquired, { ...(preferred ? { mimeType: preferred } : {}), videoBitsPerSecond: 1_500_000, audioBitsPerSecond: 64_000 });
      const chunks: Blob[] = [];
      let bytes = 0;
      recorder.current = media;
      stopping.current = false;
      media.ondataavailable = (event: BlobEvent) => {
        if (generation.current !== ticket || !event.data.size) return;
        chunks.push(event.data); bytes += event.data.size;
        if (bytes >= MAX_MEDIA_BYTES && !stopping.current) {
          setError("Limite de memória da gravação atingido. Coleta encerrada; salve e confira o vídeo parcial.");
          stop();
        }
      };
      media.onerror = () => {
        if (!mounted.current || generation.current !== ticket) return;
        setError("A gravação foi interrompida pelo navegador. Não presuma que o vídeo está completo.");
        stop();
      };
      media.onstop = () => {
        if (!mounted.current || generation.current !== ticket) return;
        if (!stopping.current && phase.current === "recording") {
          setError("A gravação terminou antes do comando de encerramento. Coleta interrompida; preserve e confira o vídeo parcial.");
        }
        if (finalizeGuard.current) clearTimeout(finalizeGuard.current);
        finalizeGuard.current = null;
        const type = media.mimeType || chunks[0]?.type || "video/webm";
        const blob = new Blob(chunks, { type });
        chunks.length = 0;
        if (blob.size) {
          const nextUrl = URL.createObjectURL(blob);
          if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
          blobUrl.current = nextUrl;
          setUrl(nextUrl); setMime(type); updateStatus("ready");
        } else {
          setError("Nenhum vídeo utilizável foi gerado. Registre a falha de captação."); updateStatus("idle");
        }
        releaseTracks();
      };
      media.start(1000);
      updateStatus("recording");
      hardStop.current = setTimeout(stop, 600_000);
      return true;
    } catch {
      if (mounted.current && generation.current === ticket) {
        releaseTracks(); updateStatus("idle"); setError(acquisitionError);
      }
      return false;
    }
  }, [prepare, releaseTracks, reset, stop, updateStatus]);

  return { stream, url, mime, status, pending: status === "requesting", error, prepare, start, stop, cancel: reset, reset };
}

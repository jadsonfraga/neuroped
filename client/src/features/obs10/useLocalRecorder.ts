import { useCallback, useEffect, useRef, useState } from "react";

/** No upload, cloud persistence, AI call, analytics payload or storage API. */
export function useLocalRecorder() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const tracks = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blobUrl = useRef<string | null>(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const hardStop = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseTracks = useCallback(() => {
    tracks.current?.getTracks().forEach((track) => track.stop());
    tracks.current = null;
    if (mounted.current) setStream(null);
    if (hardStop.current) clearTimeout(hardStop.current);
    hardStop.current = null;
  }, []);
  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    releaseTracks();
  }, [releaseTracks]);
  const cancel = useCallback(() => {
    generation.current += 1;
    stop();
    if (mounted.current) setPending(false);
  }, [stop]);
  const reset = useCallback(() => {
    cancel();
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = null;
    chunks.current = [];
    recorder.current = null;
    if (mounted.current) { setUrl(null); setMime(""); setError(""); }
  }, [cancel]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; reset(); };
  }, [reset]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Gravação indisponível neste navegador. Use outro dispositivo institucional para filmar e desmarque a câmera integrada.");
      return false;
    }
    if (recorder.current?.state === "recording") return false;
    reset();
    const ticket = ++generation.current;
    setPending(true);
    try {
      const acquired = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (!mounted.current || generation.current !== ticket) {
        acquired.getTracks().forEach((track) => track.stop());
        return false;
      }
      tracks.current = acquired;
      setStream(acquired);
      const preferred = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
        .find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const media = new MediaRecorder(acquired, preferred ? { mimeType: preferred } : undefined);
      recorder.current = media;
      chunks.current = [];
      media.ondataavailable = (event: BlobEvent) => {
        if (event.data.size && generation.current === ticket) chunks.current.push(event.data);
      };
      media.onerror = () => {
        if (mounted.current && generation.current === ticket) setError("A gravação foi interrompida pelo navegador. Chame a aplicadora responsável; não presuma que o vídeo está completo.");
        stop();
      };
      media.onstop = () => {
        if (!mounted.current || generation.current !== ticket) return;
        const type = media.mimeType || chunks.current[0]?.type || "video/webm";
        const blob = new Blob(chunks.current, { type });
        if (blob.size) {
          const nextUrl = URL.createObjectURL(blob);
          if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
          blobUrl.current = nextUrl;
          setUrl(nextUrl);
          setMime(type);
        } else setError("Nenhum vídeo utilizável foi gerado. Registre a falha de captação.");
        chunks.current = [];
        releaseTracks();
      };
      media.start(1000);
      hardStop.current = setTimeout(stop, 600_000);
      setPending(false);
      return true;
    } catch {
      releaseTracks();
      if (mounted.current && generation.current === ticket) {
        setPending(false);
        setError("Não foi possível acessar câmera e microfone. Verifique as permissões ou use a filmagem em outro dispositivo institucional. Nenhuma sessão foi iniciada.");
      }
      return false;
    }
  }, [releaseTracks, reset, stop]);

  return { stream, url, mime, pending, error, start, stop, cancel, reset };
}

import { useEffect, useRef, useState } from "react";
import { videoStamp } from "./session";

type Props = {
  nextClip: () => number;
  value: string;
  onChange: (value: string) => void;
};

export default function VideoReview({ nextClip, value, onChange }: Props) {
  const [clip, setClip] = useState<{ url: string; number: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const player = useRef<HTMLVideoElement>(null);
  const notes = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!clip) return;
    const media = player.current;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0]?.isIntersecting) media?.pause();
    });
    if (media) observer.observe(media);
    const pause = () => { if (document.hidden) media?.pause(); };
    document.addEventListener("visibilitychange", pause);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", pause);
      URL.revokeObjectURL(clip.url);
    };
  }, [clip]);
  return <details className="rounded-lg border p-3" onToggle={e => { if (!e.currentTarget.open) player.current?.pause(); }}>
    <summary className="cursor-pointer py-2 font-semibold">Revisar vídeo local{value.trim() && " · Com anotação"}</summary>
    <p className="my-2 text-sm">Abra um trecho autorizado neste dispositivo. A revisão é manual. A mídia fica disponível enquanto esta etapa estiver aberta.</p>
    <label className="block">Selecionar vídeo<input type="file" accept="video/*" className="my-2 block w-full" onChange={e => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setReady(false);
      setError(false);
      setClip({ url: URL.createObjectURL(file), number: nextClip() });
    }}/></label>
    {clip && <div className="space-y-2">
      <p>Vídeo {clip.number}</p>
      <video key={clip.url} className="max-h-80 w-full rounded-lg bg-black" controls playsInline preload="metadata"
        ref={player} src={clip.url} onLoadedMetadata={() => setReady(true)} onError={() => { setReady(false); setError(true); }}/>
      {error && <p role="status">O dispositivo não conseguiu abrir este vídeo. Escolha outro arquivo.</p>}
      <button type="button" disabled={!ready} className="min-h-12 rounded-lg border px-3 disabled:opacity-50" onClick={() => {
        const media = player.current;
        if (!media) return;
        const stamp = videoStamp(clip.number, media.currentTime);
        if (!stamp) return;
        media.pause();
        onChange((value ? value.trimEnd() + "\n" : "") + stamp + " — ");
        notes.current?.focus();
      }}>Pausar e marcar momento</button>
      <button type="button" className="min-h-12 px-3 underline" onClick={() => setClip(null)}>Fechar vídeo</button>
    </div>}
    <label className="mt-3 block">O que se vê ou ouve no vídeo?
      <textarea ref={notes} className="mt-1 block w-full rounded-lg border bg-background p-3" rows={3} value={value} onChange={e => onChange(e.target.value)}
        placeholder="Descreva o convite, a resposta e os limites do enquadramento ou áudio."/>
    </label>
  </details>;
}

import { useEffect, useRef, useState } from "react";
import { TaskPicture } from "../PracticalVisuals";
import type { TabletTask } from "./protocol";
import type { Point } from "./engine";

export function TabletStimulus({ task, strokes, onInput }: { task: TabletTask; strokes: Point[][]; onInput: (type: "select" | "stroke" | "clear", value?: string | Point[]) => void }) {
  const [active, setActive] = useState<Point[]>([]);
  const stroke = useRef<Point[]>([]);
  const pointer = useRef<number | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const location = (event: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    const norm = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 10000) / 10000;
    return { x: norm((event.clientX - rect.left) / Math.max(1, rect.width)), y: norm((event.clientY - rect.top) / Math.max(1, rect.height)) };
  };
  const end = (pointerId: number) => {
    if (pointer.current !== pointerId) return;
    if (stroke.current.length) onInput("stroke", stroke.current);
    pointer.current = null; stroke.current = []; setActive([]);
  };
  const choose = (id: string) => { onInput("select", id); setSelected((s) => [...s, id]); };
  if (task.kind === "quiet") return <div className="ot-neutral" data-testid="tablet-neutral"><p>Este momento acontece na interação.</p><p>Não é necessário olhar nem tocar na tela.</p></div>;
  if (task.kind === "scene") return <div className="ot-stimulus" data-testid="tablet-scene"><TaskPicture scene={task.scene!} label="Cena para observar" /></div>;
  if (task.kind === "reading") return <p className="ot-reading" data-testid="tablet-reading">{task.text}</p>;
  if (task.kind === "choice") return <div className="ot-choices" role="group" aria-label="Duas opções para escolher">
    <button type="button" aria-label="Escolher círculo" aria-pressed={selected.includes("circle")} onClick={() => choose("circle")}><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="42" /></svg></button>
    <button type="button" aria-label="Escolher quadrado" aria-pressed={selected.includes("square")} onClick={() => choose("square")}><svg viewBox="0 0 120 120" aria-hidden="true"><rect x="20" y="20" width="80" height="80" rx="5" /></svg></button>
  </div>;
  if (task.kind === "count") return <div className="ot-count" role="group" aria-label="Conjunto de círculos">{Array.from({ length: 5 }, (_, i) => <button type="button" key={i} aria-label={`Círculo na posição ${i + 1}`} aria-pressed={selected.includes(String(i))} onClick={() => choose(String(i))}><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" /></svg></button>)}</div>;
  return <div className="ot-drawing" data-testid="tablet-drawing">
    {task.model && <svg className="ot-model" viewBox="0 0 160 120" role="img" aria-label="Modelo de círculo"><circle cx="80" cy="60" r="40" fill="none" stroke="currentColor" strokeWidth="3" /></svg>}
    <svg className="ot-draw-area" viewBox="0 0 800 400" preserveAspectRatio="none" role="img" aria-label="Área para desenhar com o dedo" onPointerDown={(e) => {
      if (pointer.current !== null || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); }
      catch { setMessage("Não foi possível iniciar o traço neste toque. Registre a limitação se persistir."); return; }
      pointer.current = e.pointerId; stroke.current = [location(e)]; setActive(stroke.current);
    }} onPointerMove={(e) => {
      if (pointer.current !== e.pointerId) return;
      const p = location(e);
      stroke.current = [...stroke.current, p];
      if (stroke.current.length >= 128) { onInput("stroke", stroke.current); stroke.current = [p]; }
      setActive(stroke.current);
    }} onPointerUp={(e) => end(e.pointerId)} onLostPointerCapture={(e) => end(e.pointerId)} onPointerCancel={(e) => {
      if (pointer.current !== e.pointerId) return;
      end(e.pointerId); setMessage("O traço foi interrompido pelo dispositivo; a parte já registrada foi preservada.");
    }}>
      {[...strokes, active].filter((points) => points.length > 0).map((points, i) => points.length === 1 ? <circle key={i} cx={points[0].x * 800} cy={points[0].y * 400} r="2" fill="currentColor" /> : <polyline key={i} points={points.map((p) => `${p.x * 800},${p.y * 400}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
    <p>Use o dedo. Não precisa de lápis.</p><p role="status">{message}</p>
  </div>;
}

/** Static training text only; no microphone, personal text or network voice. */
export function HearTabletHelp() {
  const [message, setMessage] = useState("");
  useEffect(() => () => { if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); }, []);
  return <div className="ot-listen"><button type="button" onClick={() => {
    if (typeof speechSynthesis === "undefined") { setMessage("Leitura em voz indisponível. As instruções permanecem na tela."); return; }
    const voice = speechSynthesis.getVoices().find((v) => v.localService && v.lang.startsWith("pt"));
    if (!voice) { setMessage("Não há voz local em português disponível. Nenhum texto foi enviado a um serviço externo."); return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Primeiro prepare o atendimento e confira a câmera. Depois leia uma instrução de cada vez. Mostre a atividade quando indicado. Registre somente o que aconteceu. Você pode encerrar a qualquer momento.");
    utterance.voice = voice; utterance.lang = "pt-BR"; utterance.rate = 0.9;
    utterance.onerror = () => setMessage("O dispositivo não concluiu a leitura. Continue pelas instruções visíveis.");
    speechSynthesis.speak(utterance); setMessage("Lendo a orientação com uma voz local do dispositivo.");
  }}>Ouvir como funciona</button><button type="button" onClick={() => { if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); setMessage("Leitura interrompida."); }}>Parar leitura</button><p role="status">{message}</p></div>;
}

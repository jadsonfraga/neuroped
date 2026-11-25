import { useEffect, useReducer, useRef, useState } from "react";
import { bands, domains } from "@/data/observacaoSocial";
import VideoReview from "./VideoReview";
import { blank, fresh, session } from "./session";

const conditions = ["Interação espontânea", "Interação após apoio", "Resposta não observada nesta oportunidade", "Participante preferiu parar", "Oportunidade insuficiente"];
const input = "mt-1 block min-h-12 w-full rounded-lg border bg-background p-3";
const button = "min-h-12 rounded-lg border bg-background px-4 py-2 font-medium";
const primary = "min-h-12 rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground";
const panel = "space-y-4 rounded-xl border bg-card p-5";
const version = "Observação social presencial · NeuroPed v1.4 · Roteiro autoral sem validação psicométrica";

export default function ObservacaoSocial() {
  const [{ band, scene, stage, records }, dispatch] = useReducer(session, fresh);
  const [choice, setChoice] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const participant = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const clipSequence = useRef(0);
  const previousStage = useRef(stage);
  useEffect(() => {
    if (previousStage.current !== stage) {
      heading.current?.focus();
      previousStage.current = stage;
      setCopyStatus("");
    }
  }, [stage]);
  const selected = band === null ? null : bands[band];
  const activity = selected?.[1][scene];
  const note = records[band + "/" + scene] ?? blank;
  const entries = Object.entries(records);
  const count = entries.length;
  const summary = entries.map(([key, entry]) => {
    const [b, s] = key.split("/").map(Number);
    return [bands[b][0] + " · " + bands[b][1][s][0] + " · " + domains[s][0],
      entry.condition, entry.reaction && "Observação direta: " + entry.reaction,
      entry.video && "Observação em vídeo: " + entry.video,
      entry.context && "Contexto e apoios: " + entry.context,
      entry.interpretation && "Hipótese do profissional: " + entry.interpretation].filter(Boolean).join("\n");
  }).join("\n\n");
  const report = [version, summary, "Interpretar com história do desenvolvimento e funcionamento em outros ambientes. A sessão isolada não estabelece diagnóstico de TEA."].join("\n\n");
  const title = { choose: "Escolher atividade", prepare: "Preparar a interação", record: "Registrar o que aconteceu", review: "Revisar a sessão" }[stage];
  function present() {
    setChoice("");
    document.querySelector<HTMLVideoElement>("#social-record video")?.pause();
    participant.current?.showModal();
  }
  return <article className="mx-auto max-w-3xl space-y-4 pb-8">
    <header>
      <p className="text-sm text-muted-foreground">Observação social presencial · v1.4</p>
      <h1 tabIndex={-1} ref={heading} className="my-2 text-2xl font-bold">{title}</h1>
      {stage !== "choose" && selected && <p>{selected[0]}{stage !== "review" && activity && " · " + activity[0]}</p>}
    </header>
    {stage === "choose" && <section className={panel}>
      <label className="block font-medium">Idade na data da observação<select className={input} disabled={count > 0} value={band ?? ""} onChange={e => dispatch({ type: "age", band: Number(e.target.value) })}>
        <option value="" disabled>Escolha a idade</option>{bands.map(([name], i) => <option key={name} value={i}>{name}</option>)}</select></label>
      {count > 0 && <small>Para iniciar outra sessão, revise e encerre a atual.</small>}
      {selected && <><p>Escolha uma situação para apresentar.</p>
        {selected[1].map(([name], i) => <button key={name} className={button + " block w-full text-left"} onClick={() => dispatch({ type: "open", scene: i })}>
          <strong className="block">{name}</strong><span className="text-sm">{domains[i][0]}{records[band + "/" + i] && " · Com registro"}</span>
        </button>)}</>}
      <p className="text-sm text-muted-foreground">Roteiro autoral sem validação psicométrica. Os registros ficam nesta página até sair ou atualizar.</p>
    </section>}
    {stage === "prepare" && activity && <section className={panel}>
      <h2 className="font-semibold">Como conduzir</h2><p>{activity[3]}</p>
      <h2 className="font-semibold">O que observar</h2><p>{activity[4]}</p>
      <details><summary className="cursor-pointer py-2">Adaptar esta atividade</summary><p>{activity[5]}</p><p>O toque na tela é opcional. Respeite uma pausa ou recusa.</p></details>
      <div className="flex flex-wrap gap-2">
        <button className={primary} onClick={present}>Apresentar no tablet</button>
        <button className={button} onClick={() => dispatch({ type: "stage", stage: "record" })}>Registrar sem usar a tela</button>
      </div>
    </section>}
    {activity && <dialog ref={participant} aria-labelledby="social-invitation" onClose={() => dispatch({ type: "stage", stage: "record" })} className="fixed inset-0 m-auto w-11/12 max-w-2xl rounded-xl bg-background p-6 text-foreground backdrop:bg-slate-900">
      <h2 id="social-invitation" className="mb-6 text-3xl font-bold">{activity[1]}</h2>
      <div className="grid grid-cols-2 gap-3">{activity[2].map(item => {
        const [symbol, ...words] = item.split(" ");
        return <button key={item} aria-pressed={choice === item} className={button + " py-6 text-xl aria-pressed:ring-4 aria-pressed:ring-primary"} onClick={() => setChoice(item)}>
          <span aria-hidden="true" className="block text-5xl">{symbol}</span>{words.join(" ")}</button>;
      })}</div>
      <button className={button + " mt-6"} onClick={() => participant.current?.close()}>Pausar e voltar</button>
    </dialog>}
    {stage === "record" && <section id="social-record" className={panel}>
      <fieldset><legend className="mb-2 font-semibold">Como ocorreu a interação?</legend>
        <div className="grid gap-2 sm:grid-cols-2">{conditions.map(c => <label key={c} className={button + " flex cursor-pointer items-center gap-2"}>
          <input type="radio" name="social-condition" checked={note.condition === c} onChange={() => dispatch({ type: "edit", field: "condition", value: c })}/>{c}</label>)}</div>
        {note.condition && <button className="min-h-12 underline" onClick={() => dispatch({ type: "edit", field: "condition", value: "" })}>Desmarcar opção</button>}
      </fieldset>
      <label className="block">O que você observou presencialmente?<textarea className={input} rows={3} value={note.reaction} onChange={e => dispatch({ type: "edit", field: "reaction", value: e.target.value })}/></label>
      <VideoReview nextClip={() => ++clipSequence.current} value={note.video} onChange={value => dispatch({ type: "edit", field: "video", value })}/>
      <label className="block">Contexto, apoios e limites de interpretação (opcional)<textarea className={input} rows={2} value={note.context} onChange={e => dispatch({ type: "edit", field: "context", value: e.target.value })}/></label>
      <label className="block">Hipótese interpretativa do profissional (opcional)<textarea className={input} rows={2} value={note.interpretation} onChange={e => dispatch({ type: "edit", field: "interpretation", value: e.target.value })}/></label>
      <div className="flex flex-wrap gap-2"><button className={primary} onClick={() => dispatch({ type: "stage", stage: "choose" })}>Voltar às atividades</button>
        <button className={button} onClick={present}>Reapresentar situação</button></div>
    </section>}
    {stage !== "review" && <nav aria-label="Navegação da sessão" className="flex flex-wrap gap-2">
      {stage === "prepare" && <button className={button} onClick={() => dispatch({ type: "stage", stage: "choose" })}>Voltar às atividades</button>}
      {count > 0 && <button className={button} onClick={() => dispatch({ type: "stage", stage: "review" })}>Revisar sessão ({count} de 3 com registro)</button>}
    </nav>}
    {stage === "review" && <section className={panel}>
      <p>Revise a descrição antes de transferi-la para o prontuário. Encerrar apaga os registros desta página.</p>
      <div className="whitespace-pre-wrap break-words rounded-lg border p-4">{report}</div>
      <div className="flex flex-wrap gap-2">
        <button className={primary} onClick={async () => {
          try { await navigator.clipboard.writeText(report); setCopyStatus("Síntese copiada."); }
          catch { setCopyStatus("Selecione o texto da síntese e use a opção Copiar do dispositivo."); }
        }}>Copiar síntese</button>
        <button className={button} onClick={() => dispatch({ type: "stage", stage: "choose" })}>Voltar às atividades</button>
        <button className={button} onClick={() => { if (window.confirm("Encerrar e apagar os registros desta sessão?")) { clipSequence.current = 0; dispatch({ type: "reset" }); } }}>Encerrar e limpar</button>
      </div><p role="status">{copyStatus}</p>
    </section>}
  </article>;
}

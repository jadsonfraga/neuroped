import { useEffect, useReducer, useRef, useState } from "react";
import { ExamSessionTrail } from "@/components/ExamSessionTrail";
import { AssistantAccess, ParticipantPace } from "@/components/AssistantAccess";
import { assistantObservationLines } from "@/lib/assistantObservation";
import { AssistantScope } from "@/components/ClinicalAssistantCards";
import { socialAlternatives } from "@/data/clinicalAssistantGuide";
import { bands, domains } from "@/data/observacaoSocial";
import VideoReview from "./VideoReview";
import { alternativeScene, blank, describeSocialScene, fresh, session } from "./session";

const stopped = "Participante preferiu parar";
const noOpportunity = "Oportunidade insuficiente";
const conditions = ["Interação espontânea", "Interação após apoio", "Resposta não observada nesta oportunidade", stopped, noOpportunity];
const input = "mt-1 block min-h-12 w-full rounded-lg border bg-background p-3";
const button = "min-h-12 rounded-lg border bg-background px-4 py-2 font-medium";
const primary = "min-h-12 rounded-lg bg-primary px-5 py-2 font-semibold text-primary-foreground";
const panel = "space-y-4 rounded-xl border bg-card p-5";
const version = "Observação social presencial · NeuroPed v1.7 · Roteiro autoral sem validação psicométrica";

export default function ObservacaoSocial({ active = true }: { active?: boolean }) {
  const [{ band, scene, stage, records }, dispatch] = useReducer(session, fresh);
  const [presentation, setPresentation] = useState(0);
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
  const alternative = selected && scene === alternativeScene ? socialAlternatives[selected[0]] : undefined;
  const sceneTitle = alternative ? "Brincadeira sem tela" : activity?.[0];
  const existingNote = records[band + "/" + scene];
  const note = existingNote ?? blank;
  const entries = Object.entries(records);
  const count = entries.length;
  const summary = entries.map(([key, entry]) => {
    const [b, s] = key.split("/").map(Number);
    return [describeSocialScene(b, s), entry.condition,
      ...assistantObservationLines({ invitation: entry.invitation, reaction: entry.reaction, support: entry.context }),
      entry.video && "Observação em vídeo: " + entry.video,
      entry.interpretation && "Hipótese do profissional: " + entry.interpretation].filter(Boolean).join("\n");
  }).join("\n\n");
  const report = [version, summary, "Interpretar com história do desenvolvimento e funcionamento em outros ambientes. A sessão isolada não estabelece diagnóstico de TEA."].join("\n\n");
  const title = { choose: "Escolher atividade", prepare: "Preparar a interação", record: "Registrar o que aconteceu", review: "Revisar a sessão" }[stage];
  function recordWithoutPresenting(condition: typeof stopped | typeof noOpportunity) {
    if (existingNote) return;
    dispatch({ type: "edit", field: "condition", value: condition });
    dispatch({ type: "stage", stage: "record" });
  }
  function present() {
    setChoice("");
    document.querySelector<HTMLVideoElement>("#social-record video")?.pause();
    participant.current?.showModal();
  }
  return <article className="mx-auto max-w-3xl space-y-4 pb-8">
    <header>
      <p className="text-sm text-muted-foreground">Observação social presencial · v1.7</p>
      <h1 tabIndex={-1} ref={heading} className="my-2 text-2xl font-bold">{title}</h1>
      {stage !== "choose" && selected && <p>{selected[0]}{stage !== "review" && sceneTitle && " · " + sceneTitle}</p>}
    </header>
    <ExamSessionTrail current={stage} steps={[
      { id: "choose", label: "Escolher" },
      { id: "prepare", label: "Preparar" },
      { id: "record", label: "Registrar" },
      { id: "review", label: "Revisar" },
    ]} />
    {stage === "choose" && <section className={panel}>
      <label className="block font-medium">Idade na data da observação<select className={input} disabled={count > 0} value={band ?? ""} onChange={e => dispatch({ type: "age", band: Number(e.target.value) })}>
        <option value="" disabled>Escolha a idade</option>{bands.map(([name], i) => <option key={name} value={i}>{name}</option>)}</select></label>
      {count > 0 && <small>Para iniciar outra sessão, revise e encerre a atual.</small>}
      {selected && <><AssistantScope /><p>Escolha uma brincadeira. Você pode propor com o tablet, com objetos da sala ou só conversar.</p>
        {selected[1].map(([name], i) => {
          const entry = records[band + "/" + i];
          return <button key={name} className={button + " block w-full text-left"} onClick={() => dispatch({ type: "open", scene: i })}>
            <strong className="block">{name}</strong><span className="text-sm">{domains[i][0]}{entry && " · " + (entry.condition || "Com anotação")}</span>
          </button>;
        })}
        <button type="button" className={button + " block w-full text-left"} onClick={() => dispatch({ type: "open", scene: alternativeScene })}>
          <strong className="block">Brincadeira sem tela</strong>
          <span className="text-sm">{records[band + "/" + alternativeScene] ? "Com registro próprio" : "Uma proposta presencial para esta idade"}</span>
        </button></>}
      <p className="text-sm text-muted-foreground">Roteiro autoral sem validação psicométrica. Os registros ficam nesta página até sair ou atualizar.</p>
    </section>}
    {stage === "prepare" && activity && <section className={panel}>
      <div className="space-y-3">
        <p className="rounded-xl bg-primary/5 p-3"><strong>Diga: </strong>“{activity[1]}”</p>
        <p><strong>Faça assim. </strong>{activity[3]}</p>
        <p><strong>Anote. </strong>{activity[4]}</p>
        <ul aria-label="Prévia dos cartões" className="grid grid-cols-2 gap-2">
          {activity[2].map(item => {
            const [symbol, ...label] = item.split(" ");
            return <li key={item} className="rounded-lg border bg-background p-2 text-center text-sm font-medium">
              <span aria-hidden="true" className="block text-2xl">{symbol}</span>{label.join(" ")}
            </li>;
          })}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={primary} onClick={present}>Apresentar no tablet</button>
        <button className={button} onClick={() => dispatch({ type: "stage", stage: "record" })}>Registrar sem usar a tela</button>
      </div>
      {selected && <details className="rounded-lg border px-3">
        <summary className="cursor-pointer py-2 font-medium">Outra brincadeira sem tela · {selected[0]}</summary>
        <p className="pb-2">{socialAlternatives[selected[0]]}</p>
        <button type="button" className={button + " mb-3"} onClick={() => dispatch({ type: "open", scene: alternativeScene })}>Abrir brincadeira sem tela</button>
      </details>}
      <AssistantAccess key={band + "/" + scene} />
      <details><summary className="cursor-pointer py-2">Adaptar esta atividade</summary><p>{activity[5]}</p><p>Toque, fala, gesto ou comunicação alternativa são opcionais. Não conduza a mão, não peça contato visual e respeite uma pausa ou recusa.</p></details>
      {!existingNote && <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Se não der para iniciar</legend>
        <p className="text-sm text-muted-foreground">Registre o contexto da sessão; isso não indica ausência de uma habilidade.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => recordWithoutPresenting(noOpportunity)}>{noOpportunity}</button>
          <button type="button" className={button} onClick={() => recordWithoutPresenting(stopped)}>{stopped}</button>
        </div>
      </fieldset>}
    </section>}
    {stage === "prepare" && alternative && <section className={panel}>
      <p className="rounded-xl bg-primary/5 p-3"><strong>Proposta sem tela. </strong>{alternative}</p>
      <AssistantAccess key={band + "/alternativa"} />
      <button type="button" className={primary} onClick={() => dispatch({ type: "stage", stage: "record" })}>Registrar esta brincadeira</button>
    </section>}
    {activity && <dialog ref={participant} aria-label={activity[1]} onClose={() => { setPresentation(n => n + 1); dispatch({ type: "stage", stage: "record" }); }} className="fixed inset-0 m-auto max-h-[90dvh] w-11/12 overflow-y-auto max-w-2xl rounded-xl bg-background p-6 text-foreground backdrop:bg-slate-900">
      <ParticipantPace key={presentation} closeLabel="Pausar e voltar" onClose={() => participant.current?.close()}>
      <h2 className="text-3xl font-bold">{activity[1]}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{activity[2].map(item => {
        const [symbol, ...words] = item.split(" ");
        return <button key={item} aria-pressed={choice === item} className={button + " py-6 text-xl aria-pressed:ring-4 aria-pressed:ring-primary"} onClick={() => setChoice(item)}>
          <span aria-hidden="true" className="block text-5xl">{symbol}</span>{words.join(" ")}</button>;
      })}</div>
      </ParticipantPace>
    </dialog>}
    {stage === "record" && <section id="social-record" className={panel}>
      <fieldset><legend className="mb-2 font-semibold">Como ocorreu a interação?</legend>
        <div className="grid gap-2 sm:grid-cols-2">{conditions.map(c => <label key={c} className={button + " flex cursor-pointer items-center gap-2"}>
          <input type="radio" name="social-condition" checked={note.condition === c} onChange={() => dispatch({ type: "edit", field: "condition", value: c })}/>{c}</label>)}</div>
        {note.condition && <button className="min-h-12 underline" onClick={() => dispatch({ type: "edit", field: "condition", value: "" })}>Desmarcar opção</button>}
      </fieldset>
      <label className="block">O que você observou presencialmente?<textarea className={input} rows={3} placeholder="Ex.: apontou para a segunda figura depois que mostrei uma de cada vez." value={note.reaction} onChange={e => dispatch({ type: "edit", field: "reaction", value: e.target.value })}/></label>
      <details className="rounded-lg border px-3">
        <summary className="flex min-h-12 cursor-pointer items-center font-semibold">Acrescentar o que foi oferecido</summary>
        <label className="mb-3 block">O que foi oferecido?<textarea className={input} rows={2} value={note.invitation} onChange={e => dispatch({ type: "edit", field: "invitation", value: e.target.value })}/></label>
      </details>
      {active && <VideoReview nextClip={() => ++clipSequence.current} value={note.video} onChange={value => dispatch({ type: "edit", field: "video", value })}/>}
      <label className="block">Contexto, apoios e limites de interpretação (opcional)<textarea className={input} rows={2} value={note.context} onChange={e => dispatch({ type: "edit", field: "context", value: e.target.value })}/></label>
      <details className="rounded-lg border p-3"><summary className="cursor-pointer font-medium">Somente para revisão do profissional</summary>
      <label className="mt-2 block">Hipótese interpretativa do profissional (opcional)<textarea className={input} rows={2} value={note.interpretation} onChange={e => dispatch({ type: "edit", field: "interpretation", value: e.target.value })}/></label></details>
      <div className="flex flex-wrap gap-2"><button className={primary} onClick={() => dispatch({ type: "stage", stage: "choose" })}>Voltar às atividades</button>
        {activity && <button className={button} onClick={present}>Reapresentar situação</button>}</div>
    </section>}
    {stage !== "review" && <nav aria-label="Navegação da sessão" className="flex flex-wrap gap-2">
      {stage === "prepare" && <button className={button} onClick={() => dispatch({ type: "stage", stage: "choose" })}>Voltar às atividades</button>}
      {count > 0 && <button className={button} onClick={() => dispatch({ type: "stage", stage: "review" })}>Revisar sessão ({count} de {records[band + "/" + alternativeScene] ? 4 : 3} com registro)</button>}
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

import { useLayoutEffect, useRef, useState } from "react";
import { OUTCOMES, PHASES, type AgeBand, type Outcome } from "./protocol";
import { MATERIALS, PRACTICAL_TASKS, taskOmission, type MaterialId, type PracticalTask } from "./practical";
import { TaskPicture } from "./PracticalVisuals";
import { TaskResources } from "./FrameResources";
import { framePlan } from "./framePlan";
import { GUIDED_STYLE } from "./guidedStyle";
import type { Observation } from "./session";

const LABELS: Record<Outcome, string> = { E: "Na proposta inicial", V: "Após repetição", M: "Após gesto/modelo", A: "Com apoio habitual", ND: "Não demonstrado", R: "Recusou", NA: "Não aplicado" };
export interface GuidedTaskCardProps {
  band: AgeBand;
  phase: number;
  months: number;
  proneAllowed: boolean;
  kit: Partial<Record<MaterialId, "ready" | "missing">>;
  observations: Observation[];
  running: boolean;
  finished: boolean;
  onRecord: (task: PracticalTask, outcome: Outcome, reason: string) => void;
  onNextPhase: () => void;
}
/** Same clinical tasks, one self-contained frame. No clock, media, record or persistence authority is added. */
export function GuidedTaskCard(props: GuidedTaskCardProps) {
  return <GuidedBlock key={`${props.band.id}:${props.phase}`} {...props} />;
}
function GuidedBlock({ band, phase, months, proneAllowed, kit, observations, running, finished, onRecord, onNextPhase }: GuidedTaskCardProps) {
  const tasks = PRACTICAL_TASKS[band.id].filter((task) => task.phase === phase);
  const [index, setIndex] = useState(0);
  const [largeText, setLargeText] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusRequested = useRef(false);
  useLayoutEffect(() => {
    if (!focusRequested.current) return;
    focusRequested.current = false;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [index]);
  const item = tasks[index];
  const missing = item.materials.filter((id) => kit[id] === "missing").map((id) => MATERIALS[id].label);
  const omission = taskOmission(item, months, proneAllowed) ?? (missing.length ? `Material ausente, sem substituto seguro: ${missing.join(", ")}. Omitir esta tarefa.` : null);
  const current = observations.find((record) => record.id === `guided-${item.id}`);
  const plan = framePlan(item, band.id);
  const active = running || finished;
  const absolutePosition = PRACTICAL_TASKS[band.id].findIndex((task) => task.id === item.id) + 1;
  function move(next: number) {
    const target = Math.max(0, Math.min(tasks.length - 1, next));
    if (target === index) {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start", behavior: "auto" });
      return;
    }
    focusRequested.current = true;
    setIndex(target);
  }
  return <div className={`obs10-practical-task obs10-guided-task${largeText ? " is-large" : ""}`} data-testid="obs10-practical-task" data-guided-task-id={item.id}>
    <style>{GUIDED_STYLE}</style>
    <div className="obs10-task-position"><strong>Tarefa {index + 1} de {tasks.length}</strong><span>Até {item.seconds}s nesta tarefa · sem obrigação de preencher</span></div>
    <div className="obs10-frame-tools"><p>Bloco {phase + 1} de 6 · {band.label} · cartão {absolutePosition} de {PRACTICAL_TASKS[band.id].length}</p><button type="button" aria-pressed={largeText} onClick={() => setLargeText((value) => !value)}>Letras maiores</button></div>
    <h3 ref={heading} tabIndex={-1}>{item.title}</h3>
    <p className="obs10-frame-audience">{plan.adultOnly}</p>
    <TaskPicture scene={item.scene} label={`Guia visual: ${item.title}`} />
    {finished && <p className="obs10-caution"><strong>A criança já terminou.</strong> Revise apenas o que aconteceu. Não faça novas tentativas.</p>}
    <TaskResources task={item} bandId={band.id} kit={kit} />
    {omission ? <div className="obs10-caution" role="note"><strong>Não aplicar esta tarefa.</strong><p>{omission}</p><button type="button" className="obs10-primary" disabled={!active} onClick={() => onRecord(item, "NA", omission)}>Registrar omissão</button></div> : <>
      <section className="obs10-frame-section" aria-label="Comando e execução">
        <div className="obs10-frame-section-title"><span aria-hidden="true">2</span>Diga ou faça exatamente isto</div>
        <div className="obs10-say obs10-frame-command"><span>DIGA / FAÇA</span><p>{item.say}</p></div>
        <ol className="obs10-microsteps">{item.steps.map((instruction, n) => <li key={`${item.id}-${n}`}><span aria-hidden="true">{n + 1}.</span><p>{instruction}</p></li>)}</ol>
        <p><strong>Não treine até acertar.</strong> Quando a tarefa pedir comando, aguarde cerca de 5 segundos; repita uma vez. Demonstre somente quando permitido no cartão.</p>
        {item.walking && <p className="obs10-caution">Marcha instável, dor, recusa ou falta de proteção/espaço seguro: não execute; registre a omissão. Preserve os apoios habituais.</p>}
        {item.model && <p className="obs10-model-note"><strong>Modelo previsto:</strong> demonstrar faz parte da proposta desta tarefa. Cópia após modelo não é produção espontânea; registre ajuda extra separadamente.</p>}
      </section>
      <section className="obs10-frame-section" aria-label="O que observar">
        <div className="obs10-frame-section-title"><span aria-hidden="true">3</span>Observe sem corrigir</div>
        <div className="obs10-record-tip"><p>{item.record}</p></div>
      </section>
      <section className="obs10-frame-section" aria-label="Como registrar a resposta">
        <div className="obs10-frame-section-title"><span aria-hidden="true">4</span>Toque no que aconteceu</div>
        <p>Escolha uma opção. Ela não dá nota nem escreve a descrição por você.</p>
        <div className="obs10-quick-responses" role="group" aria-label="Registro rápido desta tarefa">{OUTCOMES.map((option) => <button type="button" key={option.id} aria-pressed={current?.outcome === option.id} disabled={!active} onClick={() => onRecord(item, option.id, "")}>{LABELS[option.id]}</button>)}</div>
        <details><summary>Não sei qual resposta escolher</summary><dl>{OUTCOMES.map((option) => <div key={option.id}><dt><strong>{LABELS[option.id]}</strong></dt><dd>{option.description}</dd></div>)}</dl><p>Exemplo: afastou a folha e disse “não quero” é recusa, não prova de que não sabe desenhar. Quando não foi possível avaliar, descreva a limitação.</p></details>
      </section>
    </>}
    <p className="obs10-muted">{finished ? "Registro posterior: só anote o que já ocorreu; não aplique novas tarefas." : "Durante a coleta, marque a categoria. Complete a descrição literal depois, sem inventar detalhes."} Categoria marcada não cria achado clínico automaticamente.</p>
    {current && <p className="obs10-response-saved" role="status">✓ {current.outcome ? LABELS[current.outcome] : "Registro aberto"} · salvo apenas nesta tela.{!current.response && " Falta detalhar o fato observado após a coleta."}</p>}
    {!current && <p>Sem marcação nesta tarefa. Você pode seguir; o sistema não vai presumir realização nem habilidade ausente.</p>}
    <div className="obs10-frame-navigation"><button type="button" disabled={index === 0} onClick={() => move(index - 1)}>Tarefa anterior</button>{index + 1 < tasks.length ? <button type="button" className="obs10-primary" onClick={() => move(index + 1)}>Próxima tarefa</button> : <button type="button" className="obs10-primary" disabled={phase === PHASES.length - 1} onClick={onNextPhase}>Próximo bloco</button>}</div>
    {index + 1 === tasks.length && phase === PHASES.length - 1 && <p className="obs10-caution">Último cartão desta ficha. Use “Encerrar antes” no alto da tela para terminar; não repita tarefas para completar dez minutos.</p>}
    <details><summary>Ver todas as tarefas deste bloco</summary><p>Atalho opcional. Para seguir em ordem, use o botão “Próxima tarefa”.</p><div className="obs10-task-links">{tasks.map((task, n) => <button type="button" key={task.id} aria-pressed={index === n} onClick={() => move(n)}>{n + 1}. {task.title}</button>)}</div></details>
  </div>;
}

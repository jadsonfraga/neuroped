import type { TabletRecord, WizardPhase } from "./engine";
import type { TabletPlan } from "./protocol";

type StationVisualState = "done" | "current" | "next" | "idle" | "partial" | "unobserved";

const WORLDS: ReadonlyArray<{ phase: WizardPhase | "collect"; title: string; subtitle: string }> = [
  { phase: "setup", title: "Base", subtitle: "Preparar" },
  { phase: "camera", title: "Radar", subtitle: "Câmera" },
  { phase: "rehearsal", title: "Tutorial", subtitle: "Ensaiar" },
  { phase: "ready", title: "Checkpoint", subtitle: "Prontidão" },
  { phase: "collect", title: "Estações", subtitle: "Aplicar" },
  { phase: "review", title: "Revisão", subtitle: "Conferir" },
  { phase: "delivery", title: "Saída", subtitle: "Guardar" },
];

function worldIndex(phase: WizardPhase): number {
  if (["cue", "child", "response"].includes(phase)) return 4;
  const index = WORLDS.findIndex((world) => world.phase === phase);
  return Math.max(0, index);
}

function taskState(index: number, cursor: number, phase: WizardPhase, record: TabletRecord | null): { state: StationVisualState; status: string } {
  const observation = record?.observations[index];
  if (phase === "review" || phase === "delivery") {
    if (!observation) return { state: "unobserved", status: "não observada" };
    if (observation.outcome === "NA") return { state: "done", status: "não aplicada · motivo registrado" };
    if (observation.outcome === null) return { state: "partial", status: "registro parcial" };
    return { state: "done", status: "registrada" };
  }
  if (index < cursor) return { state: "done", status: "registrada" };
  if (index === cursor && ["cue", "child", "response"].includes(phase)) return { state: "current", status: phase === "response" ? "checkpoint de registro" : "estação atual" };
  if (index === cursor + 1 && ["cue", "child", "response"].includes(phase)) return { state: "next", status: "próxima estação" };
  return { state: "idle", status: "a seguir" };
}

export function StationJourney({ phase, cursor, plan, record }: {
  phase: WizardPhase;
  cursor: number;
  plan: TabletPlan | null;
  record: TabletRecord | null;
}) {
  if (phase === "child") return null;
  const activeWorld = worldIndex(phase);
  const showTasks = Boolean(plan) && ["ready", "cue", "response", "review", "delivery"].includes(phase);
  return <aside className="ot-stations" data-testid="obs10-station-journey" aria-label="Mapa de estações do OBS-10">
    <div className="ot-stations-head">
      <div><span className="ot-stations-kicker">MAPA DA JORNADA</span><strong>{WORLDS[activeWorld].title}</strong></div>
      <p>Progresso de navegação, não desempenho. Não há pontos, ranking, prêmio, acerto ou erro.</p>
    </div>
    <ol className="ot-world-track">
      {WORLDS.map((world, index) => {
        const state: StationVisualState = index < activeWorld ? "done" : index === activeWorld ? "current" : index === activeWorld + 1 ? "next" : "idle";
        return <li key={world.title} data-station-state={state} aria-current={state === "current" ? "step" : undefined}>
          <span className="ot-world-node" aria-hidden="true">{index + 1}</span>
          <span><strong>{world.title}</strong><small>{world.subtitle}</small></span>
        </li>;
      })}
    </ol>
    {showTasks && plan && <div className="ot-mission-map" data-testid="obs10-mission-map">
      <div className="ot-mission-map-title"><strong>Rota de estações desta ficha</strong><span>{plan.tasks.length} estações · ordem fixa</span></div>
      <ol>
        {plan.tasks.map((task, index) => {
          const status = taskState(index, cursor, phase, record);
          return <li key={task.id} data-task-station={task.id} data-station-state={status.state} aria-current={status.state === "current" ? "step" : undefined}>
            <span className="ot-mission-node" aria-hidden="true">{index + 1}</span>
            <span className="ot-mission-copy"><strong>{task.title}</strong><small>{status.status}</small></span>
          </li>;
        })}
      </ol>
    </div>}
  </aside>;
}

export function MissionBanner({ phase, cursor, plan }: { phase: WizardPhase; cursor: number; plan: TabletPlan | null }) {
  if (!plan || !["cue", "response"].includes(phase)) return null;
  const current = plan.tasks[cursor];
  if (!current) return null;
  const next = plan.tasks[cursor + 1];
  return <div className="ot-checkpoint" data-testid="obs10-station-checkpoint">
    <div className="ot-checkpoint-number"><span>ESTAÇÃO</span><strong>{cursor + 1}</strong><small>de {plan.tasks.length}</small></div>
    <div className="ot-checkpoint-copy">
      <span>{phase === "response" ? "CHECKPOINT DE REGISTRO" : "MISSÃO ATUAL"}</span>
      <strong>{current.title}</strong>
      <p>{next ? <>Depois do registro: <b>{next.title}</b>.</> : <>Última estação. Depois do registro, a coleta segue para revisão.</>}</p>
    </div>
  </div>;
}

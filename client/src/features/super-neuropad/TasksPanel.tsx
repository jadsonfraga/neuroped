/**
 * Tarefas complementares cronometradas (opcionais) do Super NeuroPad Game — interface.
 * Toda a lógica de contagem e relatório fica em `tasks.ts` (testada sem DOM). Aqui só há apresentação e temporização.
 * Nada é persistido nem enviado por rede; o resultado volta para a página, que o inclui no relatório/PDF/prontuário.
 */
import { useEffect, useRef, useState } from "react";
import {
  CORSI_BLOCKS, CORSI_FLASH_MS, CORSI_GAP_MS, CORSI_LAYOUT, TASK_CONSTRUCTS, TASK_LABELS, classifyCorsi, corsiSequence, goNoGoConfig, goNoGoIntervals,
  goNoGoSequence, nextCorsiStep, summarizeCorsi, taskReportLines, tasksAvailable, type CorsiResult, type CorsiTrial, type GoNoGoKind, type GoNoGoResult,
  type GoNoGoTrial, type TaskId, type TaskRecord, TASKS_VERSION,
} from "./tasks";

function Btn({ tone = "sun", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "sun" | "sky" | "slate" | "paper" }) {
  return <button type="button" className={`snp-btn snp-btn--${tone} inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm`} {...rest}>{children}</button>;
}

const INSTRUCTIONS: Record<TaskId, (years: number) => string[]> = {
  corsi: (years) => years <= 7
    ? ["Vou acender umas casinhas, uma de cada vez.", "Olhe bem e, quando eu avisar, toque nas casinhas na mesma ordem em que acenderam.", "Primeiro vamos treinar."]
    : ["Alguns blocos vão acender, um de cada vez.", "Quando terminar, toque nos blocos na mesma ordem em que acenderam.", "Primeiro uma tentativa de treino; depois as tentativas valem."],
  gonogo: (years) => years <= 7
    ? ["Quando aparecer a ESTRELA ⭐, toque bem rápido!", "Quando aparecer a BOLA VERMELHA 🔴, não toque, fique paradinho.", "Primeiro vamos treinar."]
    : ["Toque o mais rápido que puder quando aparecer a ESTRELA ⭐.", "Quando aparecer a BOLA VERMELHA 🔴, não toque.", "Há um treino antes; depois as tentativas valem, sem aviso de acerto ou erro."],
};

// ─────────────────────────────── span espacial ───────────────────────────────
function CorsiTask({ seed, onFinish, onCancel }: { seed: number; onFinish: (result: CorsiResult) => void; onCancel: () => void }) {
  const [stage, setStage] = useState<"ready" | "show" | "input" | "wait">("ready");
  const [lit, setLit] = useState<number | null>(null);
  const [response, setResponse] = useState<number[]>([]);
  const [message, setMessage] = useState("Toque em Começar o treino quando a criança estiver pronta.");
  const trials = useRef<CorsiTrial[]>([]);
  const practice = useRef(true);
  const practiceTries = useRef(0);
  const current = useRef<{ length: number; attempt: number; sequence: number[] }>({ length: 2, attempt: 0, sequence: corsiSequence(2, seed + 99, 0) });
  const inputStart = useRef(0);
  const timers = useRef<number[]>([]);

  const clear = () => { timers.current.forEach((timer) => window.clearTimeout(timer)); timers.current = []; };
  useEffect(() => clear, []);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) { clear(); onCancel(); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });

  function later(fn: () => void, delay: number) { timers.current.push(window.setTimeout(fn, delay)); }

  function show() {
    setStage("show");
    setResponse([]);
    setMessage(practice.current ? "Treino: olhe com atenção." : "Olhe com atenção.");
    const { sequence } = current.current;
    sequence.forEach((block, index) => {
      later(() => setLit(block), 600 + index * (CORSI_FLASH_MS + CORSI_GAP_MS));
      later(() => setLit(null), 600 + index * (CORSI_FLASH_MS + CORSI_GAP_MS) + CORSI_FLASH_MS);
    });
    later(() => { setStage("input"); setMessage("Sua vez: toque na mesma ordem."); inputStart.current = performance.now(); }, 600 + sequence.length * (CORSI_FLASH_MS + CORSI_GAP_MS));
  }

  function finish(stop: CorsiResult["stop"]) {
    clear();
    onFinish(summarizeCorsi(trials.current, !practice.current, stop));
  }

  function advance(done: number[]) {
    const seconds = Math.round(((performance.now() - inputStart.current) / 1000) * 10) / 10;
    const { sequence, length } = current.current;
    const error = classifyCorsi(sequence, done);
    if (practice.current) {
      practiceTries.current += 1;
      if (error !== "nenhum" && practiceTries.current < 3) {
        setStage("wait"); setMessage("Vamos olhar de novo.");
        later(show, 1400);
        return;
      }
      practice.current = false;
      current.current = { length: 2, attempt: 0, sequence: corsiSequence(2, seed, 0) };
      setStage("wait"); setMessage("Agora vale! Vamos começar.");
      later(show, 1600);
      return;
    }
    trials.current.push({ length, sequence, response: done, correct: error === "nenhum", error, seconds });
    const step = nextCorsiStep(trials.current);
    if ("stop" in step) { finish(step.stop); return; }
    current.current = { length: step.length, attempt: step.attempt, sequence: corsiSequence(step.length, seed, step.attempt) };
    setStage("wait"); setMessage("Muito bem. Olhe de novo.");
    later(show, 1400);
  }

  function tap(block: number) {
    if (stage !== "input") return;
    const next = [...response, block];
    setResponse(next);
    if (next.length >= current.current.length) { setStage("wait"); advance(next); }
  }

  const done = trials.current.length;
  return (
    <div className="space-y-4" data-testid="snp-task-corsi">
      <p className="text-center text-lg font-black" role="status" aria-live="polite">{message}</p>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-xl rounded-2xl border-[4px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)]" role="group" aria-label="Blocos">
        {CORSI_LAYOUT.slice(0, CORSI_BLOCKS).map((position, block) => (
          <button
            key={block}
            type="button"
            disabled={stage !== "input"}
            onClick={() => tap(block)}
            aria-label={`Bloco ${block + 1}${response.includes(block) ? " (tocado)" : ""}`}
            data-block={block}
            className={`absolute h-[18%] w-[16%] min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] transition-colors ${lit === block ? "bg-[var(--snp-sun)] ring-4 ring-amber-300" : "bg-sky-500"}`}
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {stage === "ready" && <Btn onClick={show}>Começar o treino</Btn>}
        <Btn tone="slate" onClick={() => finish("aplicadora")} disabled={practice.current}>Encerrar tarefa ({done} tentativas)</Btn>
        <Btn tone="paper" onClick={() => { clear(); onCancel(); }}>Cancelar sem registrar</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────── go/no-go ───────────────────────────────
function GoNoGoTask({ years, seed, onFinish, onCancel }: { years: number; seed: number; onFinish: (result: GoNoGoResult) => void; onCancel: () => void }) {
  const config = goNoGoConfig(years);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState<"practice" | "real">("practice");
  const [stimulus, setStimulus] = useState<GoNoGoKind | null>(null);
  const [counter, setCounter] = useState(0);
  const [feedback, setFeedback] = useState("");
  const trials = useRef<GoNoGoTrial[]>([]);
  const windowState = useRef<{ onset: number; kind: GoNoGoKind; tapped: boolean; rt: number | null; extra: number; isi: number } | null>(null);
  const timers = useRef<number[]>([]);
  const phaseRef = useRef<"practice" | "real">("practice");
  const practiceKinds = useRef<GoNoGoKind[]>(["go", "nogo", "go", "go"]);
  const mainKinds = useRef<GoNoGoKind[]>(goNoGoSequence(config, seed));
  const mainIsi = useRef<number[]>(goNoGoIntervals(config, seed));
  const aborted = useRef(false);

  const clear = () => { timers.current.forEach((timer) => window.clearTimeout(timer)); timers.current = []; };
  useEffect(() => () => { aborted.current = true; clear(); }, []);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden && started) { aborted.current = true; clear(); onCancel(); } };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });

  function later(fn: () => void, delay: number) { timers.current.push(window.setTimeout(fn, delay)); }

  function closeWindow() {
    const state = windowState.current;
    if (!state) return;
    if (phaseRef.current === "real") trials.current.push({ kind: state.kind, rtMs: state.rt === null ? null : Math.round(state.rt), extraTaps: state.extra, isiMs: state.isi });
    else if (state.kind === "go") setFeedback(state.rt !== null ? "Isso!" : "Era a estrela: toque rápido!");
    else setFeedback(state.rt === null ? "Muito bem, ficou paradinho!" : "Essa a gente não toca.");
    windowState.current = null;
  }

  function run(index: number) {
    if (aborted.current) return;
    const real = phaseRef.current === "real";
    const kinds = real ? mainKinds.current : practiceKinds.current;
    if (index >= kinds.length) {
      closeWindow();
      if (!real) {
        phaseRef.current = "real"; setPhase("real"); setFeedback("Agora vale! Sem aviso de acerto ou erro.");
        later(() => run(0), 2200);
        return;
      }
      onFinish({ task: "gonogo", version: TASKS_VERSION, practiceDone: true, config, trials: trials.current, stop: "completa" });
      return;
    }
    closeWindow();
    const isi = real ? mainIsi.current[index] : 1400;
    setCounter(index + 1);
    setStimulus(kinds[index]);
    // O instante de início é lido depois da pintura (duas rodadas de quadro) para aproximar o que a criança vê.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      windowState.current = { onset: performance.now(), kind: kinds[index], tapped: false, rt: null, extra: 0, isi };
    }));
    later(() => setStimulus(null), config.stimulusMs);
    later(() => run(index + 1), config.stimulusMs + isi);
  }

  function begin() {
    setStarted(true);
    setFeedback("Treino: vamos lá!");
    later(() => run(0), 1200);
  }

  function onTap(event: React.PointerEvent) {
    const state = windowState.current;
    if (!state) return;
    if (!state.tapped) { state.tapped = true; state.rt = event.timeStamp - state.onset; if (phaseRef.current === "practice") closeWindowFeedbackNow(); }
    else state.extra += 1;
  }
  function closeWindowFeedbackNow() {
    const state = windowState.current;
    if (!state) return;
    setFeedback(state.kind === "go" ? "Isso!" : "Essa a gente não toca.");
  }

  function stopEarly() {
    aborted.current = true;
    clear();
    // A tentativa em andamento é descartada (não conta como omissão).
    windowState.current = null;
    onFinish({ task: "gonogo", version: TASKS_VERSION, practiceDone: phaseRef.current === "real", config, trials: trials.current, stop: "aplicadora" });
  }

  return (
    <div className="space-y-4" data-testid="snp-task-gonogo">
      <p className="text-center text-lg font-black" role="status" aria-live="polite">
        {!started ? "Toque em Começar o treino quando a criança estiver pronta." : `${phase === "practice" ? "Treino" : "Valendo"} · ${counter}/${phase === "practice" ? practiceKinds.current.length : config.trials}`}
      </p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Área de toque"
        onPointerDown={onTap}
        className="mx-auto flex h-64 w-full max-w-xl select-none items-center justify-center rounded-2xl border-[4px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] text-8xl"
        style={{ touchAction: "manipulation" }}
        data-testid="snp-gonogo-area"
      >
        {stimulus === "go" ? <span aria-label="Estrela: toque" data-stimulus="go">⭐</span> : stimulus === "nogo" ? <span aria-label="Bola vermelha: não toque" data-stimulus="nogo">🔴</span> : <span className="text-2xl opacity-40" aria-hidden="true">·</span>}
      </div>
      <p className="min-h-6 text-center text-sm font-bold" aria-live="polite">{phase === "practice" ? feedback : feedback.startsWith("Agora") ? feedback : ""}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {!started && <Btn onClick={begin}>Começar o treino</Btn>}
        {started && phase === "real" && <Btn tone="slate" onClick={stopEarly}>Encerrar tarefa ({trials.current.length} tentativas)</Btn>}
        <Btn tone="paper" onClick={() => { aborted.current = true; clear(); onCancel(); }}>Cancelar sem registrar</Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────── painel ───────────────────────────────
export function TasksPanel({ ageYears, tasks, onChange }: { ageYears: number; tasks: TaskRecord[]; onChange: (tasks: TaskRecord[]) => void }) {
  const [running, setRunning] = useState<TaskId | null>(null);
  const [intro, setIntro] = useState<TaskId | null>(null);
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  if (!tasksAvailable(ageYears)) {
    return (
      <div className="snp-panel snp-panel--soft p-4 text-[var(--snp-ink-fixed)]" data-testid="snp-tasks-unavailable">
        <div className="snp-pixel text-[11px]">Tarefas complementares cronometradas</div>
        <p className="mt-1 text-xs font-semibold opacity-80">Não oferecidas aos 2 e 3 anos: tarefa cronometrada em tela não é adequada a essa faixa. Use a bateria dedicada e o relato do cuidador.</p>
      </div>
    );
  }
  const record = (result: TaskRecord) => { onChange([...tasks.filter((task) => task.task !== result.task), result]); setRunning(null); setIntro(null); };
  const lines = taskReportLines(tasks);
  return (
    <div className="snp-panel snp-panel--soft space-y-3 p-4 text-[var(--snp-ink-fixed)]" data-testid="snp-tasks">
      <div className="snp-pixel text-[11px]">Tarefas complementares cronometradas · opcional</div>
      <p className="text-xs font-semibold opacity-80">
        Duas tarefas curtas no tablet (cerca de 2 a 4 minutos cada), fora da contagem principal e da classificação por mundo. Resultado descritivo, sem norma nem ponto de corte; o tempo inclui a latência do toque do aparelho. Fazem parte do relatório, do PDF e do prontuário.
      </p>
      {running === null && intro === null && (
        <div className="flex flex-wrap gap-2">
          {(["corsi", "gonogo"] as TaskId[]).map((id) => (
            <Btn key={id} tone={tasks.some((task) => task.task === id) ? "paper" : "sky"} onClick={() => { if (tasks.some((task) => task.task === id) && !window.confirm("Refazer substitui o registro anterior desta tarefa. Continuar?")) return; setIntro(id); }} data-testid={`snp-task-start-${id}`}>
              {tasks.some((task) => task.task === id) ? "Refazer" : "Aplicar"}: {TASK_LABELS[id]}
            </Btn>
          ))}
        </div>
      )}
      {intro && running === null && (
        <div className="space-y-2" data-testid="snp-task-intro">
          <div className="font-black">{TASK_LABELS[intro]} · {TASK_CONSTRUCTS[intro]}</div>
          <p className="text-xs font-bold">Aplicadora, diga à criança:</p>
          <ul className="list-disc pl-5 text-sm font-bold">{INSTRUCTIONS[intro](ageYears).map((line) => <li key={line}>{line}</li>)}</ul>
          <div className="flex gap-2"><Btn onClick={() => setRunning(intro)} data-testid="snp-task-go">Abrir a tarefa</Btn><Btn tone="paper" onClick={() => setIntro(null)}>Voltar</Btn></div>
        </div>
      )}
      {running === "corsi" && <CorsiTask seed={seed} onFinish={record} onCancel={() => { setRunning(null); setIntro(null); }} />}
      {running === "gonogo" && <GoNoGoTask years={ageYears} seed={seed} onFinish={record} onCancel={() => { setRunning(null); setIntro(null); }} />}
      {lines.length > 0 && (
        <ul className="space-y-1 rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-xs" data-testid="snp-task-results">
          {lines.map((line) => <li key={line} className={line.startsWith("  ") ? "pl-4" : "font-semibold"}>{line.trim()}</li>)}
        </ul>
      )}
    </div>
  );
}

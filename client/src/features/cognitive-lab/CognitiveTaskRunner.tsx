/**
 * CognitiveTaskRunner — runtime único das tarefas do Cognitive Lab.
 *
 * Fases: intro → tutorial (demonstração animada) → treino (com feedback) →
 * aplicação em blocos (sem feedback) → resultados descritivos.
 *
 * Cronometria: performance.now() no onset do estímulo e no evento de resposta
 * (teclado ou toque). Antecipações (<150ms) são marcadas e excluídas das
 * médias. Critérios automáticos de validade rodam ao final.
 *
 * Nota de implementação: o fluxo entre ensaios roda em timers; todo estado
 * consumido por eles vive em REFS (records, onset, answered, fase corrente),
 * evitando closures obsoletas sem cadeias de useCallback interdependentes.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ANTICIPATION_MS, computeStats, evaluateValidity, mulberry32 } from "./stats";
import { saveSession } from "./storage";
import { ResultsPanel } from "./ResultsPanel";
import type { CognitiveSession, CognitiveTaskConfig, TrialRecord, TrialSpec } from "./types";

type Phase = "intro" | "tutorial" | "practice" | "interblock" | "test" | "results";
type TrialState = "fixation" | "stimulus" | "blank" | "feedback";

function beep(freq: number, durationMs = 120) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    window.setTimeout(() => { osc.stop(); void ctx.close(); }, durationMs);
  } catch {
    /* áudio indisponível — segue silencioso */
  }
}

export function CognitiveTaskRunner({ task }: { task: CognitiveTaskConfig }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [kidMode, setKidMode] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [trialIdx, setTrialIdx] = useState(0);
  const [block, setBlock] = useState(0);
  const [trialState, setTrialState] = useState<TrialState>("fixation");
  const [lastFeedback, setLastFeedback] = useState<"acerto" | "erro" | null>(null);
  const [session, setSession] = useState<CognitiveSession | null>(null);
  const [doneCount, setDoneCount] = useState(0);

  // Estado mutável consumido pelos timers (sem closures obsoletas).
  const ref = useRef({
    seed: Math.floor(Math.random() * 2 ** 31),
    practice: [] as TrialSpec[],
    test: [] as TrialSpec[][],
    records: [] as TrialRecord[],
    onset: 0,
    answered: false,
    timers: [] as number[],
    startedAtIso: "",
    phase: "intro" as "practice" | "test" | "intro",
    block: 0,
    trialIdx: 0,
    practiceRetries: 0,
    soundOn: false,
  });
  ref.current.soundOn = soundOn;

  useEffect(() => {
    const r = ref.current;
    return () => { for (const t of r.timers) window.clearTimeout(t); };
  }, []);

  function clearTimers() {
    for (const t of ref.current.timers) window.clearTimeout(t);
    ref.current.timers = [];
  }
  function after(delayMs: number, fn: () => void) {
    ref.current.timers.push(window.setTimeout(fn, delayMs));
  }
  function trialsOf(p: "practice" | "test", b: number): TrialSpec[] {
    return p === "practice" ? ref.current.practice : ref.current.test[b] ?? [];
  }

  function buildSequences() {
    const rng = mulberry32(ref.current.seed);
    ref.current.practice = task.makeTrials(task.practiceTrials, rng);
    ref.current.test = Array.from({ length: task.blocks }, () => task.makeTrials(task.trialsPerBlock, rng));
  }

  function finishSession() {
    clearTimers();
    const stats = computeStats(ref.current.records);
    const validity = evaluateValidity(ref.current.records, task.validity);
    const s: CognitiveSession = {
      id: `${task.id}-${Date.now().toString(36)}`,
      taskId: task.id,
      taskName: task.name,
      startedAtIso: ref.current.startedAtIso,
      seed: ref.current.seed,
      kidMode,
      trials: ref.current.records,
      stats,
      validity,
    };
    saveSession(s);
    setSession(s);
    setPhase("results");
  }

  function runTrial(p: "practice" | "test", b: number, idx: number) {
    clearTimers();
    const r = ref.current;
    r.phase = p; r.block = b; r.trialIdx = idx; r.answered = false;
    setLastFeedback(null);
    setTrialState("fixation");
    after(task.fixationMs, () => {
      setTrialState("stimulus");
      r.onset = performance.now();
      if (task.stimulusMs > 0) after(task.stimulusMs, () => setTrialState("blank"));
      after(task.deadlineMs, () => {
        if (r.answered) return;
        r.answered = true;
        settleTrial(null, null);
      });
    });
  }

  function settleTrial(responded: string | null, rtMs: number | null) {
    const r = ref.current;
    if (r.phase !== "practice" && r.phase !== "test") return;
    const p = r.phase;
    const spec = trialsOf(p, r.block)[r.trialIdx];
    if (!spec) return;
    const anticipated = rtMs !== null && rtMs < ANTICIPATION_MS;
    const correct = anticipated
      ? false
      : spec.correctResponse === null
        ? responded === null
        : responded === spec.correctResponse;
    r.records.push({
      index: r.records.length,
      block: r.block,
      phase: p,
      tags: spec.tags,
      expected: spec.correctResponse,
      responded,
      rtMs,
      correct,
      anticipated,
      onsetMs: r.onset,
    });
    if (p === "test") setDoneCount(r.records.filter((x) => x.phase === "test").length);
    if (p === "practice") {
      setLastFeedback(correct ? "acerto" : "erro");
      if (r.soundOn) beep(correct ? 880 : 220);
      setTrialState("feedback");
      after(700, advance);
      return;
    }
    advance();
  }

  function advance() {
    const r = ref.current;
    if (r.phase !== "practice" && r.phase !== "test") return;
    const list = trialsOf(r.phase, r.block);
    const next = r.trialIdx + 1;
    if (next < list.length) {
      setTrialIdx(next);
      runTrial(r.phase, r.block, next);
      return;
    }
    if (r.phase === "practice") {
      const practice = r.records.filter((x) => x.phase === "practice").slice(-task.practiceTrials);
      const acc = practice.filter((x) => x.correct).length / Math.max(1, practice.length);
      if (acc < task.validity.minPracticeAccuracy && r.practiceRetries < 1) {
        // Treino insuficiente: repete tutorial + treino UMA vez (critério automático).
        r.practiceRetries += 1;
        r.practice = task.makeTrials(task.practiceTrials, mulberry32(r.seed + 101));
        r.phase = "intro";
        setTutorialStep(0);
        setPhase("tutorial");
        return;
      }
      r.phase = "intro";
      setBlock(0);
      setPhase("interblock");
      return;
    }
    if (r.block + 1 < task.blocks) {
      r.phase = "intro";
      setBlock(r.block + 1);
      setPhase("interblock");
      return;
    }
    finishSession();
  }

  function respond(responseId: string) {
    const r = ref.current;
    if (r.phase !== "practice" && r.phase !== "test") return;
    if (r.answered) return;
    const rt = performance.now() - r.onset;
    r.answered = true;
    settleTrial(responseId, Math.round(rt));
  }

  // Teclado físico (D/K, setas, espaço — conforme a tarefa).
  const respondRef = useRef(respond);
  respondRef.current = respond;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const match = task.responses.find((x) => x.key.toLowerCase() === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        respondRef.current(match.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [task.responses]);

  function startPractice() {
    const r = ref.current;
    if (!r.startedAtIso) r.startedAtIso = new Date().toISOString();
    if (r.practice.length === 0) buildSequences();
    setPhase("practice");
    setTrialIdx(0);
    runTrial("practice", 0, 0);
  }
  function startBlock() {
    setPhase("test");
    setTrialIdx(0);
    runTrial("test", block, 0);
  }
  function restart() {
    clearTimers();
    ref.current = {
      ...ref.current,
      seed: Math.floor(Math.random() * 2 ** 31),
      practice: [], test: [], records: [],
      onset: 0, answered: false, startedAtIso: "",
      phase: "intro", block: 0, trialIdx: 0, practiceRetries: 0,
    };
    setSession(null);
    setTutorialStep(0);
    setBlock(0);
    setTrialIdx(0);
    setDoneCount(0);
    setPhase("intro");
  }

  const total = task.blocks * task.trialsPerBlock;
  const progressPct = phase === "results" ? 100 : Math.round((doneCount / total) * 100);

  const stimSize = kidMode ? "text-7xl sm:text-8xl" : "text-6xl";
  const tut = task.tutorial[tutorialStep];
  const current = phase === "practice" || phase === "test" ? trialsOf(phase, block)[trialIdx] : undefined;
  const posClass =
    current?.stimulus.position === "left"
      ? "justify-start pl-6"
      : current?.stimulus.position === "right"
        ? "justify-end pr-6"
        : "justify-center";

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/cognitive-lab" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Cognitive Lab
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundOn((v) => !v)}
            aria-label={soundOn ? "Desativar sons" : "Ativar sons"}
            className="text-muted-foreground hover:text-foreground"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-1.5">
            <Switch id="kid-mode" checked={kidMode} onCheckedChange={setKidMode} aria-label="Modo infantil" />
            <Label htmlFor="kid-mode" className="text-xs font-semibold">Modo infantil</Label>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">{task.emoji}</span> {task.name}
            <span className="ml-auto text-xs font-semibold text-muted-foreground">{task.domain}</span>
          </CardTitle>
          {(phase === "test" || phase === "interblock") && (
            <div className="pt-1">
              <Progress value={progressPct} aria-label="Progresso da aplicação" />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Bloco {Math.min(block + 1, task.blocks)} de {task.blocks} · {doneCount}/{total} ensaios
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">{task.instructions}</p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                Tarefa cognitiva cronometrada com relatório <strong>descritivo</strong> — não é teste
                normatizado e não estabelece diagnóstico. {task.ageLabel} · {task.durationLabel}. Os
                dados ficam apenas neste dispositivo.
              </div>
              <Button onClick={() => setPhase("tutorial")} className="w-full gap-2" size="lg">
                <Play className="h-4 w-4" /> Ver como funciona
              </Button>
            </div>
          )}

          {phase === "tutorial" && tut && (
            <div className="space-y-4 text-center">
              <p className="text-sm font-semibold">{tut.text}</p>
              {tut.stimulus && (
                <div className={`flex min-h-32 items-center ${tut.stimulus.position === "left" ? "justify-start pl-6" : tut.stimulus.position === "right" ? "justify-end pr-6" : "justify-center"}`}>
                  <span className={`${stimSize} font-black ${tut.stimulus.colorClass ?? ""} float-gentle`} role="img" aria-label={tut.stimulus.ariaLabel ?? tut.stimulus.display}>
                    {tut.stimulus.display}
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tut.demoResponse === null
                  ? "Neste caso, a resposta certa é NÃO apertar nada."
                  : tut.demoResponse
                    ? `Resposta certa: ${task.responses.find((x) => x.id === tut.demoResponse)?.label ?? ""}`
                    : ""}
              </p>
              <div className="flex gap-2">
                {tutorialStep > 0 && (
                  <Button variant="outline" onClick={() => setTutorialStep((v) => v - 1)} className="flex-1">Voltar</Button>
                )}
                {tutorialStep < task.tutorial.length - 1 ? (
                  <Button onClick={() => setTutorialStep((v) => v + 1)} className="flex-1">Próximo</Button>
                ) : (
                  <Button onClick={startPractice} className="flex-1">
                    {ref.current.practiceRetries > 0 ? "Treinar de novo" : "Começar o treino"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {(phase === "practice" || phase === "test") && (
            <div className="space-y-4">
              {phase === "practice" && (
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Treino {trialIdx + 1}/{ref.current.practice.length} · com dicas
                </p>
              )}
              <div className={`flex min-h-44 items-center rounded-2xl border border-border bg-muted/30 ${posClass}`} aria-live="off">
                {trialState === "fixation" && <span className="w-full text-center text-4xl text-muted-foreground" aria-hidden="true">+</span>}
                {trialState === "stimulus" && current && (
                  <span className={`${stimSize} font-black ${current.stimulus.colorClass ?? ""}`} role="img" aria-label={current.stimulus.ariaLabel ?? current.stimulus.display}>
                    {current.stimulus.display}
                  </span>
                )}
                {trialState === "feedback" && (
                  <span className={`w-full text-center text-3xl font-black ${lastFeedback === "acerto" ? "text-emerald-500" : "text-red-500"} ${kidMode ? "celebrate" : ""}`}>
                    {lastFeedback === "acerto" ? "🎉 Acertou!" : "Ops! Tente na próxima."}
                  </span>
                )}
              </div>
              <div className={`grid gap-2 ${task.responses.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                {task.responses.map((r) => (
                  <Button
                    key={r.id}
                    size="lg"
                    variant="secondary"
                    className={`${kidMode ? "min-h-16 text-lg" : "min-h-12"} font-black`}
                    onPointerDown={() => respond(r.id)}
                  >
                    {r.emoji && <span aria-hidden="true" className="mr-1">{r.emoji}</span>} {r.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {phase === "interblock" && (
            <div className="space-y-4 text-center">
              <p className="text-4xl" aria-hidden="true">{block === 0 ? "💪" : "🌟"}</p>
              <p className="text-sm font-semibold">
                {block === 0
                  ? "Treino concluído! Agora vale de verdade — sem dicas."
                  : `Bloco ${block} concluído! Respire fundo e continue quando estiver pronto.`}
              </p>
              <Button onClick={startBlock} size="lg" className="w-full gap-2">
                <Play className="h-4 w-4" /> {block === 0 ? "Começar a aplicação" : `Iniciar bloco ${block + 1}`}
              </Button>
            </div>
          )}

          {phase === "results" && session && (
            <div className="space-y-4">
              <ResultsPanel session={session} />
              <Button variant="outline" onClick={restart} className="w-full gap-2">
                <RotateCcw className="h-4 w-4" /> Aplicar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

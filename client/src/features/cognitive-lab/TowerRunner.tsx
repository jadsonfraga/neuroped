/**
 * TowerRunner — runner próprio da Torre NeuroPed (planejamento, estilo Torre
 * de Londres): 3 pinos e 3 discos; o participante copia o MODELO movendo um
 * disco por vez, tentando usar o menor número de movimentos.
 *
 * Métricas descritivas: latência de planejamento (onset → 1º movimento),
 * excesso de movimentos sobre o mínimo (verificado por BFS) e resoluções
 * ótimas. Não é teste normatizado.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats } from "./stats";
import { saveSession } from "./storage";
import { ResultsPanel } from "./ResultsPanel";
import type { CognitiveSession, TrialRecord } from "./types";

/** Estado da torre: 3 pinos, cada um com os discos da BASE para o TOPO. */
export type TowerState = [number[], number[], number[]];

/** Movimento legal: só o disco do topo se move e nunca pousa sobre um menor. */
export function isLegalMove(state: TowerState, from: number, to: number): boolean {
  if (from === to || from < 0 || to < 0 || from > 2 || to > 2) return false;
  const src = state[from];
  if (src.length === 0) return false;
  const disc = src[src.length - 1];
  const dst = state[to];
  return dst.length === 0 || dst[dst.length - 1] > disc;
}

/** Aplica um movimento SEM mutar o estado original (retorna cópia nova). */
export function applyMove(state: TowerState, from: number, to: number): TowerState {
  const next = state.map((peg) => [...peg]) as TowerState;
  const disc = next[from].pop() as number;
  next[to].push(disc);
  return next;
}

const stateKey = (s: TowerState) => s.map((peg) => peg.join(",")).join("|");

/**
 * Mínimo de movimentos entre dois estados por BFS. O espaço é minúsculo
 * (27 posições válidas com 3 discos), então a busca é instantânea.
 * Retorna -1 se o objetivo for inalcançável (não ocorre com estados válidos).
 */
export function solveMinMoves(start: TowerState, goal: TowerState): number {
  const goalKey = stateKey(goal);
  let frontier: TowerState[] = [start];
  const seen = new Set<string>([stateKey(start)]);
  let depth = 0;
  while (frontier.length > 0) {
    if (frontier.some((s) => stateKey(s) === goalKey)) return depth;
    const next: TowerState[] = [];
    for (const s of frontier) {
      for (let from = 0; from < 3; from++) {
        for (let to = 0; to < 3; to++) {
          if (!isLegalMove(s, from, to)) continue;
          const n = applyMove(s, from, to);
          const k = stateKey(n);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(n);
          }
        }
      }
    }
    frontier = next;
    depth++;
  }
  return -1;
}

/**
 * 5 problemas em dificuldade crescente. Mínimos VERIFICADOS por solveMinMoves
 * (BFS): 2, 3, 4, 5 e 6 movimentos, respectivamente.
 */
export const TOWER_PROBLEMS: Array<{ start: TowerState; goal: TowerState }> = [
  // mínimo = 2
  { start: [[3, 2, 1], [], []], goal: [[3], [2], [1]] },
  // mínimo = 3
  { start: [[3, 2, 1], [], []], goal: [[3], [2, 1], []] },
  // mínimo = 4
  { start: [[2, 1], [3], []], goal: [[], [], [3, 2, 1]] },
  // mínimo = 5
  { start: [[3], [2], [1]], goal: [[], [], [3, 2, 1]] },
  // mínimo = 6
  { start: [[3, 2], [1], []], goal: [[1], [], [3, 2]] },
];

const MINIMUMS = TOWER_PROBLEMS.map((p) => solveMinMoves(p.start, p.goal));

const TASK_ID = "torre-np";
const TASK_NAME = "Torre NeuroPed";
const TASK_EMOJI = "🗼";
const TASK_DOMAIN = "Planejamento e resolução de problemas";

/** Cores e larguras por tamanho de disco (1 = pequeno … 3 = grande). */
const DISC_CLASS: Record<number, string> = {
  1: "bg-red-400 w-[38%]",
  2: "bg-amber-400 w-[62%]",
  3: "bg-sky-400 w-[86%]",
};
const DISC_NAME: Record<number, string> = { 1: "pequeno", 2: "médio", 3: "grande" };

const cloneState = (s: TowerState) => s.map((peg) => [...peg]) as TowerState;

function describePeg(peg: number[]): string {
  if (peg.length === 0) return "vazio";
  return peg.map((d) => `disco ${DISC_NAME[d]}`).join(", ") + " (da base ao topo)";
}

type Phase = "intro" | "playing" | "feedback" | "results";

export function TowerRunner() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [problemIdx, setProblemIdx] = useState(0);
  const [board, setBoard] = useState<TowerState>(() => cloneState(TOWER_PROBLEMS[0].start));
  const [picked, setPicked] = useState<number | null>(null);
  const [errorPeg, setErrorPeg] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [solvedNow, setSolvedNow] = useState(false);
  const [session, setSession] = useState<CognitiveSession | null>(null);

  const ref = useRef({
    records: [] as TrialRecord[],
    startedAtIso: "",
    /** onset do problema atual (performance.now, ms). */
    onsetMs: 0,
    /** timestamp do PRIMEIRO movimento do problema (latência de planejamento). */
    firstMoveMs: null as number | null,
    solving: false,
    totalMoves: 0,
    totalMin: 0,
    solved: 0,
    optimal: 0,
    latencies: [] as number[],
    timers: [] as number[],
  });

  useEffect(() => {
    const r = ref.current;
    return () => {
      for (const t of r.timers) window.clearTimeout(t);
    };
  }, []);
  function after(ms: number, fn: () => void) {
    ref.current.timers.push(window.setTimeout(fn, ms));
  }

  function beginProblem(idx: number) {
    const r = ref.current;
    r.onsetMs = performance.now();
    r.firstMoveMs = null;
    r.solving = false;
    setProblemIdx(idx);
    setBoard(cloneState(TOWER_PROBLEMS[idx].start));
    setPicked(null);
    setErrorPeg(null);
    setMoves(0);
    setSolvedNow(false);
    setPhase("playing");
  }

  function start() {
    ref.current.startedAtIso = new Date().toISOString();
    beginProblem(0);
  }

  function flashError(peg: number) {
    setErrorPeg(peg);
    after(450, () => setErrorPeg(null));
  }

  function advance(nextIdx: number) {
    if (nextIdx < TOWER_PROBLEMS.length) beginProblem(nextIdx);
    else finish();
  }

  function handleSolved(finalMoves: number) {
    const r = ref.current;
    // Duplo toque no pino do movimento final disparava handleSolved 2× —
    // registro duplicado e advance pulando um problema. Trava por problema.
    if (r.solving) return;
    r.solving = true;
    const min = MINIMUMS[problemIdx];
    const latency =
      r.firstMoveMs !== null ? Math.round(r.firstMoveMs - r.onsetMs) : 0;
    r.records.push({
      index: r.records.length,
      block: problemIdx,
      phase: "test",
      tags: [`problema-${problemIdx + 1}`, finalMoves === min ? "otimo" : "subotimo"],
      expected: "resolver",
      responded: "resolver",
      rtMs: latency,
      correct: finalMoves <= min + 1,
      anticipated: false,
      onsetMs: r.onsetMs,
    });
    r.totalMoves += finalMoves;
    r.totalMin += min;
    r.solved += 1;
    if (finalMoves === min) r.optimal += 1;
    r.latencies.push(latency);
    setSolvedNow(true);
    setPhase("feedback");
    after(1100, () => advance(problemIdx + 1));
  }

  function handlePegTap(peg: number) {
    const r = ref.current;
    if (phase !== "playing" || r.solving) return;
    if (picked === null) {
      if (board[peg].length === 0) {
        flashError(peg);
        return;
      }
      setPicked(peg);
      return;
    }
    if (picked === peg) {
      setPicked(null);
      return;
    }
    if (!isLegalMove(board, picked, peg)) {
      flashError(peg);
      return; // mantém o disco pego
    }
    if (r.firstMoveMs === null) r.firstMoveMs = performance.now();
    const next = applyMove(board, picked, peg);
    const nextMoves = moves + 1;
    setBoard(next);
    setMoves(nextMoves);
    setPicked(null);
    if (stateKey(next) === stateKey(TOWER_PROBLEMS[problemIdx].goal)) {
      handleSolved(nextMoves);
    }
  }

  /** Recomeça o problema atual (conta como erro de execução). */
  function resetProblem() {
    const r = ref.current;
    r.records.push({
      index: r.records.length,
      block: problemIdx,
      phase: "test",
      tags: [`problema-${problemIdx + 1}`, "reset"],
      expected: "resolver",
      responded: "reset",
      rtMs: null,
      correct: false,
      anticipated: false,
      onsetMs: r.onsetMs,
    });
    setBoard(cloneState(TOWER_PROBLEMS[problemIdx].start));
    setPicked(null);
    setErrorPeg(null);
    setMoves(0);
  }

  /** Pula o problema após estourar o limite de segurança (omissão). */
  function skipProblem() {
    const r = ref.current;
    r.records.push({
      index: r.records.length,
      block: problemIdx,
      phase: "test",
      tags: [`problema-${problemIdx + 1}`, "pulado"],
      expected: "resolver",
      responded: null,
      rtMs: null,
      correct: false,
      anticipated: false,
      onsetMs: r.onsetMs,
    });
    advance(problemIdx + 1);
  }

  function finish() {
    const r = ref.current;
    const stats = computeStats(r.records);
    const meanLatency = r.latencies.length
      ? Math.round(r.latencies.reduce((a, b) => a + b, 0) / r.latencies.length)
      : null;
    const s: CognitiveSession = {
      id: `${TASK_ID}-${Date.now().toString(36)}`,
      taskId: TASK_ID,
      taskName: TASK_NAME,
      startedAtIso: r.startedAtIso,
      seed: 0,
      kidMode: true,
      trials: r.records,
      stats,
      validity: {
        valid: r.solved >= 3,
        issues:
          r.solved >= 3
            ? []
            : [
                `Apenas ${r.solved} de ${TOWER_PROBLEMS.length} problemas resolvidos — engajamento insuficiente ou tarefa acima do nível; repetir em outro momento.`,
              ],
      },
      customSummary: [
        {
          label: "Movimentos totais",
          value: `${r.totalMoves} vs mínimo ${r.totalMin}`,
          hint: "somando os problemas resolvidos",
        },
        {
          label: "Excesso de movimentos",
          value: String(r.totalMoves - r.totalMin),
          hint: "0 = planejamento perfeito",
        },
        {
          label: "Latência média de planejamento",
          value: meanLatency !== null ? `${meanLatency} ms` : "—",
          hint: "tempo até o 1º movimento",
        },
        {
          label: "Resolvidos no mínimo",
          value: `${r.optimal}/${TOWER_PROBLEMS.length}`,
        },
      ],
    };
    saveSession(s);
    setSession(s);
    setPhase("results");
  }

  function restart() {
    const r = ref.current;
    for (const t of r.timers) window.clearTimeout(t);
    ref.current = {
      records: [],
      startedAtIso: "",
      onsetMs: 0,
      firstMoveMs: null,
      solving: false,
      totalMoves: 0,
      totalMin: 0,
      solved: 0,
      optimal: 0,
      latencies: [],
      timers: [],
    };
    setSession(null);
    setProblemIdx(0);
    setBoard(cloneState(TOWER_PROBLEMS[0].start));
    setPicked(null);
    setErrorPeg(null);
    setMoves(0);
    setSolvedNow(false);
    setPhase("intro");
  }

  const min = MINIMUMS[problemIdx];
  const overLimit = phase === "playing" && moves > min + 8;
  const goal = TOWER_PROBLEMS[problemIdx].goal;

  function renderPeg(pegState: number[], peg: number, interactive: boolean, mini: boolean) {
    const isPicked = interactive && picked === peg;
    const isError = interactive && errorPeg === peg;
    const heightClass = mini ? "h-16" : "h-36 sm:h-40";
    const discHeight = mini ? "h-3" : "h-6 sm:h-7";
    const label = interactive
      ? `Pino ${peg + 1}: ${describePeg(pegState)}${isPicked ? " — disco do topo pego, toque outro pino para soltar" : ""}`
      : `Modelo, pino ${peg + 1}: ${describePeg(pegState)}`;
    const content = (
      <>
        {/* haste */}
        <span
          aria-hidden="true"
          className={`absolute bottom-1 left-1/2 w-1 -translate-x-1/2 rounded-t bg-muted-foreground/40 ${mini ? "h-14" : "h-32 sm:h-36"}`}
        />
        {/* base */}
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-1.5 w-[92%] -translate-x-1/2 rounded bg-muted-foreground/40"
        />
        <span className="absolute inset-x-0 bottom-1.5 flex flex-col-reverse items-center gap-0.5">
          {pegState.map((disc, i) => {
            const isTop = i === pegState.length - 1;
            return (
              <span
                key={`${disc}`}
                aria-hidden="true"
                className={`${discHeight} ${DISC_CLASS[disc]} rounded-full border border-border shadow-sm transition-transform ${
                  isPicked && isTop ? "-translate-y-2 ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                }`}
              />
            );
          })}
        </span>
      </>
    );
    if (!interactive) {
      return (
        <div key={peg} role="img" aria-label={label} className={`relative flex-1 ${heightClass}`}>
          {content}
        </div>
      );
    }
    return (
      <button
        key={peg}
        type="button"
        aria-label={label}
        aria-pressed={isPicked}
        onPointerDown={() => handlePegTap(peg)}
        className={`relative flex-1 rounded-xl border-2 transition ${heightClass} ${
          isError
            ? "translate-x-0.5 border-red-500 ring-2 ring-red-500"
            : isPicked
              ? "border-primary bg-primary/10"
              : "border-transparent hover:border-border"
        }`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Link
        href="/cognitive-lab"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Cognitive Lab
      </Link>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">{TASK_EMOJI}</span> {TASK_NAME}
            <span className="ml-auto text-xs font-semibold text-muted-foreground">{TASK_DOMAIN}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                Copie o MODELO movendo um disco por vez: toque um pino para pegar o disco do topo e
                toque outro pino para soltar. O disco grande não pode ficar em cima do pequeno.
                Antes de mexer, PENSE no caminho — tente usar o MENOR número de movimentos!
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                Tarefa de planejamento estilo Torre de Londres: 5 problemas em dificuldade crescente
                (mínimos de 2 a 6 movimentos). Relatório descritivo — não é teste normatizado. Os
                dados ficam neste dispositivo.
              </div>
              <Button size="lg" className="w-full gap-2" onClick={start}>
                <Play className="h-4 w-4" /> Começar
              </Button>
            </div>
          )}

          {(phase === "playing" || phase === "feedback") && (
            <div className="space-y-4">
              <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Problema {problemIdx + 1}/{TOWER_PROBLEMS.length} · movimentos: {moves} · mínimo: {min}
              </p>

              <div className="rounded-2xl border border-border bg-muted/30 p-3">
                <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Modelo (deixe igual)
                </p>
                <div className="mx-auto flex max-w-xs items-end gap-2">
                  {goal.map((peg, i) => renderPeg(peg, i, false, true))}
                </div>
              </div>

              <div className="relative rounded-2xl border border-border bg-muted/30 p-3">
                <div className="mx-auto flex max-w-md items-end gap-2">
                  {board.map((peg, i) => renderPeg(peg, i, true, false))}
                </div>
                {phase === "feedback" && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
                    <span className="celebrate text-3xl font-black text-emerald-500">
                      {solvedNow ? "🎉 Resolvido!" : ""}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-center text-xs text-muted-foreground" aria-live="polite">
                {picked !== null
                  ? `Disco do topo do pino ${picked + 1} pego — toque outro pino para soltar.`
                  : "Toque um pino para pegar o disco do topo."}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={phase !== "playing" || moves === 0}
                  onClick={resetProblem}
                >
                  <RotateCcw className="h-4 w-4" /> Recomeçar problema
                </Button>
                {overLimit && (
                  <Button variant="secondary" className="flex-1 gap-2" onClick={skipProblem}>
                    <SkipForward className="h-4 w-4" /> Pular problema
                  </Button>
                )}
              </div>
              {overLimit && (
                <p className="text-center text-xs text-muted-foreground">
                  Muitos movimentos neste problema — tudo bem pular e seguir para o próximo.
                </p>
              )}
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

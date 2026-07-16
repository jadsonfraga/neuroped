/**
 * VisualSearchRunner — runner próprio da tarefa de BUSCA VISUAL:
 * encontrar a borboleta (🦋) entre abelhas (🐝) em 16 telas — 8 com 12 itens
 * e 8 com 24 itens, em ordem embaralhada por seed. A diferença de tempo entre
 * os dois tamanhos estima o custo por item (inclinação de busca).
 *
 * Relatório DESCRITIVO (tempos, erros) — não é teste normatizado.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats, mean, mulberry32, shuffleWith } from "./stats";
import { ResultsPanel } from "./ResultsPanel";
import type { CognitiveSession, TrialRecord } from "./types";

const TARGET = "🦋";
const DISTRACTOR = "🐝";
const TOTAL_SCREENS = 16;
const FIXATION_MS = 500;
const DEADLINE_MS = 8000;
const MIN_HITS = 10;

type SetSize = 12 | 24;

/**
 * Gera uma grade de busca com EXATAMENTE UM alvo (🦋) e (setSize − 1)
 * distratores (🐝), posição do alvo aleatória via rng (determinística por seed).
 */
export function makeSearchGrid(
  setSize: SetSize,
  rng: () => number
): { cells: string[]; targetIndex: number } {
  const cells = shuffleWith(
    [TARGET, ...Array.from({ length: setSize - 1 }, () => DISTRACTOR)],
    rng
  );
  return { cells, targetIndex: cells.indexOf(TARGET) };
}

type Phase = "intro" | "fixation" | "grid" | "results";

interface Screen {
  setSize: SetSize;
  cells: string[];
  targetIndex: number;
}

const sizeTag = (setSize: SetSize) => (setSize === 12 ? "12-itens" : "24-itens");

export function VisualSearchRunner() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [screenIdx, setScreenIdx] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [hitIdx, setHitIdx] = useState<number | null>(null);
  const [session, setSession] = useState<CognitiveSession | null>(null);

  const ref = useRef({
    seed: Math.floor(Math.random() * 2 ** 31),
    screens: [] as Screen[],
    records: [] as TrialRecord[],
    onset: 0,
    solved: false,
    deadline: null as number | null,
    startedAtIso: "",
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

  function start() {
    const r = ref.current;
    r.startedAtIso = new Date().toISOString();
    const rng = mulberry32(r.seed);
    const sizes = shuffleWith<SetSize>(
      [12, 12, 12, 12, 12, 12, 12, 12, 24, 24, 24, 24, 24, 24, 24, 24],
      rng
    );
    r.screens = sizes.map((setSize) => ({ setSize, ...makeSearchGrid(setSize, rng) }));
    r.records = [];
    beginScreen(0);
  }

  function beginScreen(i: number) {
    const r = ref.current;
    r.solved = false;
    setScreenIdx(i);
    setFlashIdx(null);
    setHitIdx(null);
    setPhase("fixation");
    after(FIXATION_MS, () => {
      r.onset = performance.now();
      setPhase("grid");
      r.deadline = window.setTimeout(() => {
        r.solved = true;
        const tag = sizeTag(r.screens[i].setSize);
        r.records.push({
          index: r.records.length,
          block: 0,
          phase: "test",
          tags: [tag, "omissao"],
          expected: "alvo",
          responded: null,
          rtMs: null,
          correct: false,
          anticipated: false,
          onsetMs: r.onset,
        });
        advance(i);
      }, DEADLINE_MS);
      r.timers.push(r.deadline);
    });
  }

  function advance(fromIdx: number) {
    if (fromIdx + 1 < TOTAL_SCREENS) beginScreen(fromIdx + 1);
    else finish();
  }

  function tapCell(cellIdx: number) {
    const r = ref.current;
    if (phase !== "grid" || r.solved) return;
    const screen = r.screens[screenIdx];
    const tag = sizeTag(screen.setSize);
    if (cellIdx === screen.targetIndex) {
      r.solved = true;
      if (r.deadline !== null) window.clearTimeout(r.deadline);
      r.records.push({
        index: r.records.length,
        block: 0,
        phase: "test",
        tags: [tag],
        expected: "alvo",
        responded: "alvo",
        rtMs: Math.round(performance.now() - r.onset),
        correct: true,
        anticipated: false,
        onsetMs: r.onset,
      });
      setHitIdx(cellIdx);
      after(250, () => advance(screenIdx));
      return;
    }
    r.records.push({
      index: r.records.length,
      block: 0,
      phase: "test",
      tags: [tag, "erro"],
      expected: "alvo",
      responded: "erro",
      rtMs: null,
      correct: false,
      anticipated: false,
      onsetMs: r.onset,
    });
    setFlashIdx(cellIdx);
    after(300, () => setFlashIdx((f) => (f === cellIdx ? null : f)));
  }

  function finish() {
    const r = ref.current;
    const stats = computeStats(r.records);
    const hits = r.records.filter((t) => t.correct).length;
    const errors = r.records.filter((t) => t.responded === "erro").length;
    const rtOf = (tag: string) =>
      mean(
        r.records
          .filter((t) => t.correct && t.rtMs !== null && t.tags.includes(tag))
          .map((t) => t.rtMs as number)
      );
    const rt12 = rtOf("12-itens");
    const rt24 = rtOf("24-itens");
    const costPerItem = rt12 !== null && rt24 !== null ? ((rt24 - rt12) / 12).toFixed(1) : null;
    const s: CognitiveSession = {
      id: `busca-visual-${crypto.randomUUID()}`,
      taskId: "busca-visual",
      taskName: "Busca Visual",
      startedAtIso: r.startedAtIso,
      seed: r.seed,
      kidMode: true,
      trials: r.records,
      stats,
      validity: {
        valid: hits >= MIN_HITS,
        issues:
          hits >= MIN_HITS
            ? []
            : [
                `Apenas ${hits} de ${TOTAL_SCREENS} alvos encontrados (mínimo ${MIN_HITS}) — engajamento insuficiente para interpretar os tempos de busca.`,
              ],
      },
      customSummary: [
        {
          label: "TR médio 12 itens",
          value: rt12 !== null ? `${Math.round(rt12)} ms` : "—",
        },
        {
          label: "TR médio 24 itens",
          value: rt24 !== null ? `${Math.round(rt24)} ms` : "—",
        },
        {
          label: "Custo por item",
          value: costPerItem !== null ? `${costPerItem} ms` : "—",
          hint: "inclinação de busca",
        },
        { label: "Erros totais", value: String(errors) },
      ],
    };
    setSession(s);
    setPhase("results");
  }

  function restart() {
    const r = ref.current;
    for (const t of r.timers) window.clearTimeout(t);
    ref.current = {
      ...r,
      timers: [],
      screens: [],
      records: [],
      onset: 0,
      solved: false,
      deadline: null,
      seed: Math.floor(Math.random() * 2 ** 31),
      startedAtIso: "",
    };
    setSession(null);
    setFlashIdx(null);
    setHitIdx(null);
    setScreenIdx(0);
    setPhase("intro");
  }

  const screen = ref.current.screens[screenIdx];

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
            <span aria-hidden="true">🔎</span> Busca Visual
            <span className="ml-auto text-xs font-semibold text-muted-foreground">
              Atenção seletiva (busca visual)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                Uma borboleta <span aria-hidden="true">🦋</span> está escondida no meio das abelhas{" "}
                <span aria-hidden="true">🐝</span>. Encontre a borboleta e toque nela o mais rápido
                que conseguir. São {TOTAL_SCREENS} telas — algumas com poucas abelhas, outras com
                muitas.
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                Metade das telas tem 12 itens e metade tem 24; a diferença de tempo entre elas
                estima o custo por item (inclinação de busca). Relatório descritivo — não é teste
                normatizado. Os dados ficam neste dispositivo.
              </div>
              <Button size="lg" className="w-full gap-2" onClick={start}>
                <Play className="h-4 w-4" /> Começar
              </Button>
            </div>
          )}

          {(phase === "fixation" || phase === "grid") && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  tela {screenIdx + 1}/{TOTAL_SCREENS}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((screenIdx + 1) / TOTAL_SCREENS) * 100}%` }}
                  />
                </div>
              </div>

              {phase === "fixation" && (
                <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border bg-muted/30">
                  <span className="text-6xl font-black text-muted-foreground" aria-hidden="true">
                    +
                  </span>
                </div>
              )}

              {phase === "grid" && screen && (
                <div
                  className={`mx-auto grid w-full max-w-md gap-2 ${
                    screen.setSize === 12 ? "grid-cols-4" : "grid-cols-6"
                  }`}
                >
                  {screen.cells.map((cell, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={cell === TARGET ? "borboleta" : "abelha"}
                      onPointerDown={() => tapCell(i)}
                      className={`flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition sm:text-3xl ${
                        hitIdx === i
                          ? "border-emerald-500 bg-emerald-500/20"
                          : flashIdx === i
                            ? "border-red-500 bg-red-500/20"
                            : "border-border bg-card hover:bg-muted/60"
                      }`}
                    >
                      <span aria-hidden="true">{cell}</span>
                    </button>
                  ))}
                </div>
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

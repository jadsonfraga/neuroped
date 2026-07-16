/**
 * SpanTaskRunner — runner próprio das tarefas de SPAN:
 *  - Span de Dígitos (ordem direta e depois inversa), entrada por teclado numérico;
 *  - Corsi Block (span espacial, ordem direta), tabuleiro de 9 blocos.
 *
 * Apresentação item a item, reprodução cronometrada, regra adaptativa
 * (spanLogic.ts) e resultado descritivo no padrão do Cognitive Lab.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Delete, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats, mulberry32 } from "./stats";
import { ResultsPanel } from "./ResultsPanel";
import {
  CORSI_POSITIONS,
  initialSpanState,
  isReproductionCorrect,
  makeCorsiSequence,
  makeDigitSequence,
  nextSpanState,
} from "./spanLogic";
import type { CognitiveSession, TrialRecord } from "./types";

type Variant = "digit" | "corsi";
type Phase = "intro" | "showing" | "entering" | "feedback" | "results";
type Direction = "forward" | "backward";

const META: Record<Variant, { id: string; name: string; emoji: string; domain: string; instructions: string; note: string }> = {
  digit: {
    id: "digit-span",
    name: "Span de Dígitos",
    emoji: "🔢",
    domain: "Memória de curto prazo e de trabalho (verbal)",
    instructions:
      "Números aparecem um de cada vez. Guarde a sequência e digite na MESMA ORDEM. Depois vem a parte difícil: digitar DE TRÁS PRA FRENTE.",
    note: "Ordem direta (alça fonológica) e inversa (executivo central). Span = maior sequência reproduzida.",
  },
  corsi: {
    id: "corsi-block",
    name: "Corsi Block",
    emoji: "🟪",
    domain: "Memória de curto prazo visuoespacial",
    instructions:
      "Os quadradinhos vão acender um por um. Guarde a ordem e toque neles na MESMA ORDEM.",
    note: "Tabuleiro fixo de 9 blocos (posições clássicas). Span espacial = maior sequência tocada corretamente.",
  },
};

export function SpanTaskRunner({ variant }: { variant: Variant }) {
  const meta = META[variant];
  const [phase, setPhase] = useState<Phase>("intro");
  const [direction, setDirection] = useState<Direction>("forward");
  const [showIdx, setShowIdx] = useState(-1);
  const [entered, setEntered] = useState<number[]>([]);
  const [feedbackOk, setFeedbackOk] = useState(false);
  const [session, setSession] = useState<CognitiveSession | null>(null);
  const [, force] = useState(0);

  const ref = useRef({
    seed: Math.floor(Math.random() * 2 ** 31),
    rng: null as null | (() => number),
    state: initialSpanState(),
    spans: { forward: 0, backward: 0 },
    sequence: [] as number[],
    records: [] as TrialRecord[],
    reproStart: 0,
    submitting: false,
    startedAtIso: "",
    timers: [] as number[],
  });

  useEffect(() => {
    const r = ref.current;
    return () => { for (const t of r.timers) window.clearTimeout(t); };
  }, []);
  function after(ms: number, fn: () => void) {
    ref.current.timers.push(window.setTimeout(fn, ms));
  }

  function startRun(dir: Direction) {
    const r = ref.current;
    if (!r.startedAtIso) r.startedAtIso = new Date().toISOString();
    if (!r.rng) r.rng = mulberry32(r.seed);
    r.state = initialSpanState();
    setDirection(dir);
    presentSequence();
  }

  function presentSequence() {
    const r = ref.current;
    r.sequence = variant === "digit"
      ? makeDigitSequence(r.state.length, r.rng as () => number)
      : makeCorsiSequence(r.state.length, r.rng as () => number);
    setEntered([]);
    setPhase("showing");
    setShowIdx(-1);
    const onMs = variant === "digit" ? 900 : 700;
    const offMs = 300;
    r.sequence.forEach((_, i) => {
      after(400 + i * (onMs + offMs), () => setShowIdx(i));
      after(400 + i * (onMs + offMs) + onMs, () => setShowIdx(-1));
    });
    after(400 + r.sequence.length * (onMs + offMs) + 150, () => {
      r.reproStart = performance.now();
      r.submitting = false;
      setPhase("entering");
    });
  }

  function submit(finalEntered: number[]) {
    const r = ref.current;
    // Duplo toque no último bloco/OK disparava submit 2× (registro duplicado
    // e a regra adaptativa pulando um estado). Trava até a próxima sequência.
    if (r.submitting) return;
    r.submitting = true;
    const rt = Math.round(performance.now() - r.reproStart);
    const correct = isReproductionCorrect(r.sequence, finalEntered, direction === "backward");
    r.records.push({
      index: r.records.length,
      block: direction === "forward" ? 0 : 1,
      phase: "test",
      tags: [direction === "forward" ? "direta" : "inversa", `len-${r.state.length}`],
      expected: "sequencia",
      responded: correct ? "sequencia" : "erro",
      rtMs: rt,
      correct,
      anticipated: false,
      onsetMs: r.reproStart,
    });
    const next = nextSpanState(r.state, correct);
    r.spans[direction] = Math.max(r.spans[direction], next.bestSpan);
    r.state = next;
    setFeedbackOk(correct);
    setPhase("feedback");
    after(900, () => {
      if (!next.done) {
        presentSequence();
        return;
      }
      if (variant === "digit" && direction === "forward") {
        r.state = initialSpanState();
        setDirection("backward");
        setPhase("intro");
        force((x) => x + 1);
        return;
      }
      finish();
    });
  }

  function finish() {
    const r = ref.current;
    const stats = computeStats(r.records);
    const correctSeqs = r.records.filter((t) => t.correct).length;
    const customSummary = variant === "digit"
      ? [
          { label: "Span direto", value: String(r.spans.forward), hint: "maior sequência na ordem" },
          { label: "Span inverso", value: String(r.spans.backward), hint: "de trás pra frente" },
          { label: "Sequências corretas", value: String(correctSeqs) },
        ]
      : [
          { label: "Span de Corsi", value: String(r.spans.forward), hint: "maior sequência espacial" },
          { label: "Sequências corretas", value: String(correctSeqs) },
        ];
    const s: CognitiveSession = {
      id: `${meta.id}-${crypto.randomUUID()}`,
      taskId: meta.id,
      taskName: meta.name,
      startedAtIso: r.startedAtIso,
      seed: r.seed,
      kidMode: true,
      trials: r.records,
      stats,
      validity: {
        valid: r.records.length >= 2,
        issues: r.records.length >= 2 ? [] : ["Aplicação interrompida antes de duas sequências — repetir."],
      },
      customSummary,
    };
    setSession(s);
    setPhase("results");
  }

  function restart() {
    const r = ref.current;
    for (const t of r.timers) window.clearTimeout(t);
    ref.current = { ...r, timers: [], records: [], spans: { forward: 0, backward: 0 }, state: initialSpanState(), rng: null, seed: Math.floor(Math.random() * 2 ** 31), startedAtIso: "" };
    setSession(null);
    setDirection("forward");
    setPhase("intro");
  }

  const r = ref.current;
  const digitPad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4">
      <Link href="/cognitive-lab" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Cognitive Lab
      </Link>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span aria-hidden="true">{meta.emoji}</span> {meta.name}
            <span className="ml-auto text-xs font-semibold text-muted-foreground">{meta.domain}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                {variant === "digit" && direction === "backward"
                  ? "Agora a ordem INVERSA: os números aparecem e você digita DE TRÁS PRA FRENTE. Ex.: viu 3–7, digita 7–3."
                  : meta.instructions}
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                {meta.note} Relatório descritivo — não é teste normatizado. Os dados ficam neste dispositivo.
              </div>
              <Button size="lg" className="w-full gap-2" onClick={() => startRun(direction)}>
                <Play className="h-4 w-4" /> {variant === "digit" && direction === "backward" ? "Começar ordem inversa" : "Começar"}
              </Button>
            </div>
          )}

          {(phase === "showing" || phase === "entering" || phase === "feedback") && (
            <div className="space-y-4">
              <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {variant === "digit" ? (direction === "forward" ? "Ordem direta" : "Ordem inversa") : "Span espacial"} · {r.state.length} itens · tentativa {r.state.attempt}
              </p>

              {variant === "digit" ? (
                <div className="flex min-h-36 items-center justify-center rounded-2xl border border-border bg-muted/30">
                  {phase === "showing" ? (
                    <span className="text-8xl font-black tabular-nums" aria-live="polite">
                      {showIdx >= 0 ? r.sequence[showIdx] : ""}
                    </span>
                  ) : phase === "feedback" ? (
                    <span className={`text-3xl font-black ${feedbackOk ? "text-emerald-500" : "text-red-500"} celebrate`}>
                      {feedbackOk ? "🎉 Certo!" : "Quase!"}
                    </span>
                  ) : (
                    <span className="text-4xl font-black tabular-nums tracking-widest" aria-label={`digitado: ${entered.join(" ")}`}>
                      {entered.length ? entered.join(" ") : direction === "backward" ? "…de trás pra frente" : "…digite a sequência"}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl border border-border bg-muted/30">
                  {CORSI_POSITIONS.map((p, i) => {
                    const lit = phase === "showing" && showIdx >= 0 && r.sequence[showIdx] === i;
                    const tappedOrder = entered.indexOf(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={`bloco ${i + 1}`}
                        disabled={phase !== "entering"}
                        onPointerDown={() => {
                          if (phase !== "entering" || ref.current.submitting) return;
                          const next = [...entered, i];
                          setEntered(next);
                          if (next.length === r.sequence.length) submit(next);
                        }}
                        className={`absolute h-[16%] w-[16%] rounded-lg border-2 transition ${
                          lit
                            ? "border-primary bg-primary shadow-lg"
                            : tappedOrder >= 0
                              ? "border-primary/60 bg-primary/30"
                              : "border-border bg-card"
                        }`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      >
                        {tappedOrder >= 0 && <span className="text-[10px] font-black text-primary-foreground">{tappedOrder + 1}</span>}
                      </button>
                    );
                  })}
                  {phase === "feedback" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
                      <span className={`text-3xl font-black ${feedbackOk ? "text-emerald-500" : "text-red-500"} celebrate`}>
                        {feedbackOk ? "🎉 Certo!" : "Quase!"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {variant === "digit" && phase === "entering" && (
                <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
                  {digitPad.map((d) => (
                    <Button
                      key={d}
                      variant="secondary"
                      className={`min-h-12 text-xl font-black ${d === 0 ? "col-start-2" : ""}`}
                      onPointerDown={() => setEntered((e) => (e.length < r.sequence.length ? [...e, d] : e))}
                    >
                      {d}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    aria-label="Apagar último número"
                    className="col-start-1 row-start-4 min-h-12"
                    onPointerDown={() => setEntered((e) => e.slice(0, -1))}
                  >
                    <Delete className="h-4 w-4" />
                  </Button>
                  <Button
                    className="col-start-3 row-start-4 min-h-12 font-black"
                    disabled={entered.length !== r.sequence.length}
                    onPointerDown={() => submit(entered)}
                  >
                    OK
                  </Button>
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

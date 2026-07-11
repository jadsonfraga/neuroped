/**
 * TrailMakingRunner — runner próprio do "Trilhas (A e B)" (Trail Making digital):
 *  - Parte A: conectar números 1→15 em ordem crescente (velocidade de busca visual);
 *  - Parte B: alternar número→letra (1→A→2→B→…→8) — flexibilidade cognitiva.
 *
 * Cronômetro por parte, contagem de erros e razão B/A no relatório descritivo,
 * no padrão do Cognitive Lab (ver SpanTaskRunner).
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeStats, mulberry32, shuffleWith } from "./stats";
import { saveSession } from "./storage";
import { ResultsPanel } from "./ResultsPanel";
import type { CognitiveSession, TrialRecord } from "./types";

type Part = "A" | "B";
type Phase = "intro" | "running" | "interlude" | "results";

const TASK_ID = "trail-making";
const TASK_NAME = "Trilhas (A e B)";
const TASK_EMOJI = "🔗";
const TARGET_COUNT = 15;

/** Sequência de alvos: parte A = 1..15; parte B = alternância número/letra (1,A,2,B,…,8). */
export function makeTrailSequence(part: Part): string[] {
  if (part === "A") {
    return Array.from({ length: TARGET_COUNT }, (_, i) => String(i + 1));
  }
  const letters = "ABCDEFG";
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(String(i + 1));
    if (i < letters.length) out.push(letters[i]);
  }
  return out;
}

/**
 * Layout dos alvos em % (x∈[4,88], y∈[4,86]) sem sobreposição: distância
 * euclidiana mínima de 16 entre posições. Amostragem por rejeição com limite
 * de tentativas e fallback determinístico (grade embaralhada com jitter) —
 * nunca entra em loop infinito.
 */
export function makeTrailLayout(count: number, rng: () => number): Array<{ x: number; y: number }> {
  const MIN_DIST = 16;
  const points: Array<{ x: number; y: number }> = [];
  const maxAttempts = count * 60;
  let attempts = 0;
  while (points.length < count && attempts < maxAttempts) {
    attempts++;
    const x = 4 + rng() * 84;
    const y = 4 + rng() * 82;
    if (points.every((p) => Math.hypot(p.x - x, p.y - y) >= MIN_DIST)) {
      points.push({ x, y });
    }
  }
  if (points.length === count) return points;

  // Fallback determinístico: células de grade embaralhadas + jitter pequeno
  // (espaçamento da grade ≥ 20 ⇒ com jitter ±2 a distância mínima segue ≥ 16).
  const side = Math.max(4, Math.ceil(Math.sqrt(count)));
  const cells: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < side; row++) {
    for (let col = 0; col < side; col++) {
      cells.push({
        x: 4 + ((col + 0.5) * 84) / side,
        y: 4 + ((row + 0.5) * 82) / side,
      });
    }
  }
  return shuffleWith(cells, rng)
    .slice(0, count)
    .map((c) => ({ x: c.x + (rng() - 0.5) * 4, y: c.y + (rng() - 0.5) * 4 }));
}

export function TrailMakingRunner() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [part, setPart] = useState<Part>("A");
  const [progress, setProgress] = useState(0);
  const [flashIdx, setFlashIdx] = useState(-1);
  const [session, setSession] = useState<CognitiveSession | null>(null);

  const ref = useRef({
    seed: Math.floor(Math.random() * 2 ** 31),
    rng: null as null | (() => number),
    sequence: [] as string[],
    layout: [] as Array<{ x: number; y: number }>,
    records: [] as TrialRecord[],
    errors: { A: 0, B: 0 },
    timesMs: { A: 0, B: 0 },
    partStart: 0,
    lastHit: 0,
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

  function startPart(p: Part) {
    const r = ref.current;
    if (!r.startedAtIso) r.startedAtIso = new Date().toISOString();
    if (!r.rng) r.rng = mulberry32(r.seed);
    r.sequence = makeTrailSequence(p);
    r.layout = makeTrailLayout(r.sequence.length, r.rng);
    r.partStart = performance.now();
    r.lastHit = r.partStart;
    setPart(p);
    setProgress(0);
    setFlashIdx(-1);
    setPhase("running");
  }

  function tapTarget(i: number) {
    const r = ref.current;
    if (phase !== "running" || i < progress) return;
    const now = performance.now();
    const tag = part === "A" ? "parte-a" : "parte-b";
    const block = part === "A" ? 0 : 1;
    if (i === progress) {
      r.records.push({
        index: r.records.length,
        block,
        phase: "test",
        tags: [tag],
        expected: "alvo",
        responded: "alvo",
        rtMs: Math.round(now - r.lastHit),
        correct: true,
        anticipated: false,
        onsetMs: r.lastHit,
      });
      r.lastHit = now;
      const next = progress + 1;
      setProgress(next);
      if (next === r.sequence.length) {
        r.timesMs[part] = now - r.partStart;
        if (part === "A") {
          setPhase("interlude");
        } else {
          finish();
        }
      }
      return;
    }
    r.errors[part] += 1;
    r.records.push({
      index: r.records.length,
      block,
      phase: "test",
      tags: [tag, "erro"],
      expected: "alvo",
      responded: "erro",
      rtMs: null,
      correct: false,
      anticipated: false,
      onsetMs: r.lastHit,
    });
    setFlashIdx(i);
    after(300, () => setFlashIdx(-1));
  }

  function finish() {
    const r = ref.current;
    const stats = computeStats(r.records);
    const secA = r.timesMs.A / 1000;
    const secB = r.timesMs.B / 1000;
    const customSummary = [
      { label: "Tempo A", value: `${secA.toFixed(1)} s`, hint: "busca visual e velocidade" },
      { label: "Erros A", value: String(r.errors.A) },
      { label: "Tempo B", value: `${secB.toFixed(1)} s`, hint: "alternância número/letra" },
      { label: "Erros B", value: String(r.errors.B) },
      {
        label: "Razão B/A",
        value: secA > 0 ? (secB / secA).toFixed(2) : "—",
        hint: "alternância ÷ velocidade",
      },
    ];
    const s: CognitiveSession = {
      id: `${TASK_ID}-${Date.now().toString(36)}`,
      taskId: TASK_ID,
      taskName: TASK_NAME,
      startedAtIso: r.startedAtIso,
      seed: r.seed,
      kidMode: true,
      trials: r.records,
      stats,
      validity: { valid: true, issues: [] },
      customSummary,
    };
    saveSession(s);
    setSession(s);
    setPhase("results");
  }

  function restart() {
    const r = ref.current;
    for (const t of r.timers) window.clearTimeout(t);
    ref.current = {
      ...r,
      timers: [],
      records: [],
      errors: { A: 0, B: 0 },
      timesMs: { A: 0, B: 0 },
      sequence: [],
      layout: [],
      rng: null,
      seed: Math.floor(Math.random() * 2 ** 31),
      startedAtIso: "",
    };
    setSession(null);
    setPart("A");
    setProgress(0);
    setFlashIdx(-1);
    setPhase("intro");
  }

  const r = ref.current;

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
            <span className="ml-auto text-xs font-semibold text-muted-foreground">
              Busca visual e flexibilidade cognitiva
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phase === "intro" && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed">
                É uma caça ao tesouro de bolinhas! Na <strong>parte A</strong>, toque nos números em
                ordem: 1, 2, 3… até o 15, o mais rápido que conseguir. Depois, na{" "}
                <strong>parte B</strong>, o desafio aumenta: alterne número e letra — 1, A, 2, B, 3,
                C… Procure bem, as bolinhas ficam espalhadas!
              </p>
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                Cronometramos cada parte e contamos os erros; a razão B/A descreve o custo da
                alternância. Relatório descritivo — não é teste normatizado. Os dados ficam neste
                dispositivo.
              </div>
              <Button size="lg" className="w-full gap-2" onClick={() => startPart("A")}>
                <Play className="h-4 w-4" /> Começar parte A
              </Button>
            </div>
          )}

          {phase === "interlude" && (
            <div className="space-y-4">
              <p className="text-center text-3xl" aria-hidden="true">
                🎉
              </p>
              <p className="text-sm leading-relaxed">
                Parte A concluída! Agora a <strong>parte B</strong>: alterne número e letra, sempre
                em ordem — <strong>1 → A → 2 → B → 3 → C…</strong> até o 8. Respire fundo e vá o
                mais rápido que conseguir.
              </p>
              <Button size="lg" className="w-full gap-2" onClick={() => startPart("B")}>
                <Play className="h-4 w-4" /> Começar parte B
              </Button>
            </div>
          )}

          {phase === "running" && (
            <div className="space-y-4">
              <p className="text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Parte {part} · {progress} de {r.sequence.length} · erros: {r.errors[part]}
              </p>
              <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl border border-border bg-muted/30">
                {r.layout.map((p, i) => {
                  const done = i < progress;
                  const flashing = flashIdx === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`alvo ${r.sequence[i]}`}
                      onPointerDown={() => tapTarget(i)}
                      className={`absolute flex h-[12%] w-[12%] items-center justify-center rounded-full border-2 text-sm font-black transition ${
                        done
                          ? "border-primary/60 bg-primary/30 text-muted-foreground"
                          : "border-border bg-card"
                      } ${flashing ? "ring-2 ring-red-500" : ""}`}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    >
                      {r.sequence[i]}
                      {done && (
                        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1 text-[9px] font-black text-primary-foreground">
                          {i + 1}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {part === "A"
                  ? "Toque nos números em ordem crescente."
                  : "Alterne número e letra: 1 → A → 2 → B…"}
              </p>
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

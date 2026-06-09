import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Hash,
  Brain,
  Search,
  SunMoon,
  Music,
  RotateCcw,
  ClipboardCheck,
  Baby,
  ShieldAlert,
} from "lucide-react";
import { directDomains } from "@/data/directTasks";

/**
 * Testes Diretos com a Criança — recuperados do app legado (pré-React) e
 * reescritos em React com tokens de tema, acessibilidade e referência etária.
 *
 * 5 mini-testes observacionais (NÃO normatização psicométrica), rodando só no
 * dispositivo, sem dado pessoal. Cada teste gera uma linha de resultado para o
 * laudo/pré-consulta. Idade do paciente ajusta a referência clínica.
 */

interface TestResult {
  id: string;
  label: string;
  line: string;
}

// ───────────────────────── helpers ─────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randDigits(n: number): number[] {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10));
}

const ANIMALS = ["🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐯", "🐸", "🐵", "🦁", "🐮", "🐷", "🐔", "🐧", "🦆", "🦉", "🐢", "🦋", "🐝", "🐞"];

// ═══════════════════════ TESTE 1: Span de Dígitos ═══════════════════════
function DigitSpan({ age, onComplete }: { age: number | null; onComplete: (r: TestResult) => void }) {
  const [mode, setMode] = useState<"forward" | "backward">("forward");
  const [len, setLen] = useState(3);
  const [phase, setPhase] = useState<"idle" | "showing" | "input" | "done">("idle");
  const [seq, setSeq] = useState<number[]>([]);
  const [shownIdx, setShownIdx] = useState(-1);
  const [entry, setEntry] = useState<number[]>([]);
  const [maxF, setMaxF] = useState(0);
  const [maxB, setMaxB] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function startTrial() {
    const s = randDigits(len);
    setSeq(s); setEntry([]); setShownIdx(0); setPhase("showing");
  }

  useEffect(() => {
    if (phase !== "showing") return;
    if (shownIdx >= seq.length) { setPhase("input"); setShownIdx(-1); return; }
    timer.current = setTimeout(() => setShownIdx((i) => i + 1), 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [phase, shownIdx, seq.length]);

  function press(d: number) {
    if (phase !== "input") return;
    const next = [...entry, d];
    setEntry(next);
    if (next.length === seq.length) check(next);
  }

  function check(input: number[]) {
    const expected = mode === "forward" ? seq : [...seq].reverse();
    const ok = input.every((v, i) => v === expected[i]);
    if (ok) {
      if (mode === "forward") setMaxF(len); else setMaxB(len);
      setLen((l) => l + 1);
      setPhase("idle");
    } else {
      if (mode === "forward") {
        setMode("backward"); setLen(3); setPhase("idle");
      } else {
        setPhase("done");
        onComplete({
          id: "digit-span",
          label: "Span de Dígitos",
          line: `Span direto ${mode === "forward" ? len : maxF} · inverso ${mode === "backward" ? Math.max(maxB, 0) : maxB} dígitos`,
        });
      }
    }
  }

  function reset() {
    setMode("forward"); setLen(3); setPhase("idle"); setSeq([]); setEntry([]); setMaxF(0); setMaxB(0);
  }

  const expForward = age ? age + 2 : null;
  const expBackward = age ? Math.max(age - 1, 0) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={mode === "forward" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>➡️ Direta</Badge>
        <Badge className={mode === "backward" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>⬅️ Inversa</Badge>
        <Badge variant="outline">Tamanho: {len}</Badge>
      </div>

      {phase === "idle" && (
        <Button onClick={startTrial} className="w-full" size="lg">
          {mode === "forward" ? "Mostrar sequência (repetir na ordem)" : "Mostrar sequência (repetir de trás pra frente)"}
        </Button>
      )}

      {phase === "showing" && (
        <div className="flex min-h-[96px] items-center justify-center rounded-2xl border border-border bg-muted/40" aria-live="polite">
          <span className="text-6xl font-black tabular-nums text-foreground">{seq[shownIdx] ?? ""}</span>
        </div>
      )}

      {phase === "input" && (
        <div className="space-y-3">
          <div className="flex min-h-[48px] flex-wrap items-center justify-center gap-1 rounded-2xl border border-border bg-background p-2 text-2xl font-black tabular-nums">
            {entry.length ? entry.join(" ") : <span className="text-sm font-normal text-muted-foreground">Toque os números na ordem {mode === "backward" ? "inversa" : "vista"}</span>}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
              <Button key={d} variant="outline" className="h-12 text-lg font-bold" onClick={() => press(d)} aria-label={`dígito ${d}`}>{d}</Button>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-2 p-5 text-center">
            <div className="text-4xl">🏆</div>
            <p className="text-sm font-bold text-foreground">Span direto: {maxF} · inverso: {maxB} dígitos</p>
            {age && <p className="text-xs text-muted-foreground">Referência p/ {age} anos: direto ≈ {expForward}, inverso ≈ {expBackward}. Apoio observacional, não ponto de corte.</p>}
            <Button variant="outline" size="sm" onClick={reset} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Refazer</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════ TESTE 2: Memória de Figuras ═══════════════════════
function PictureMemory({ onComplete }: { onComplete: (r: TestResult) => void }) {
  const TOTAL = 3;
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"idle" | "show" | "pick" | "done">("idle");
  const [target, setTarget] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function start() {
    const n = 2 + round; // 3,4,5
    const t = shuffle(ANIMALS).slice(0, n);
    const distract = shuffle(ANIMALS.filter((a) => !t.includes(a))).slice(0, n + 2);
    setTarget(t); setOptions(shuffle([...t, ...distract])); setPicked([]); setPhase("show");
    timer.current = setTimeout(() => setPhase("pick"), 1200 + n * 600);
  }

  function toggle(a: string) {
    if (phase !== "pick") return;
    setPicked((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  }

  function confirm() {
    const right = picked.filter((p) => target.includes(p)).length;
    const wrong = picked.filter((p) => !target.includes(p)).length;
    const pts = Math.max(right - wrong, 0);
    const newScore = score + pts;
    setScore(newScore);
    if (round >= TOTAL) {
      setPhase("done");
      onComplete({ id: "picture-memory", label: "Memória de Figuras", line: `Memória visual: ${newScore} / ${[3, 4, 5].reduce((a, b) => a + b, 0)} figuras corretas em ${TOTAL} rodadas` });
    } else {
      setRound((r) => r + 1); setPhase("idle");
    }
  }

  return (
    <div className="space-y-4">
      <Badge variant="outline">Rodada {Math.min(round, TOTAL)} / {TOTAL} · Acumulado {score}</Badge>
      {phase === "idle" && <Button onClick={start} className="w-full" size="lg">Mostrar figuras para memorizar</Button>}
      {phase === "show" && (
        <div className="flex min-h-[110px] flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 p-4" aria-live="polite">
          {target.map((a, i) => <span key={i} className="text-5xl">{a}</span>)}
        </div>
      )}
      {phase === "pick" && (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-foreground">Toque nas figuras que você viu</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {options.map((a, i) => (
              <button key={i} type="button" onClick={() => toggle(a)} className={`flex h-14 items-center justify-center rounded-xl border text-3xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${picked.includes(a) ? "border-primary bg-primary/15" : "border-border bg-background hover:bg-muted"}`}>{a}</button>
            ))}
          </div>
          <Button onClick={confirm} className="w-full">Confirmar escolha</Button>
        </div>
      )}
      {phase === "done" && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-1 p-5 text-center">
          <div className="text-4xl">🧠</div>
          <p className="text-sm font-bold text-foreground">{score} / 12 figuras corretas</p>
          <p className="text-xs text-muted-foreground">Apoio à memória visual de curto prazo.</p>
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════ TESTE 3: Atenção Visual ═══════════════════════
function VisualAttention({ onComplete }: { onComplete: (r: TestResult) => void }) {
  const TOTAL = 4;
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [grid, setGrid] = useState<string[]>([]);
  const [target, setTarget] = useState("");
  const [times, setTimes] = useState<number[]>([]);
  const startAt = useRef(0);

  function start() {
    const t = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const distract = ANIMALS.filter((a) => a !== t);
    const cells = shuffle([t, ...shuffle(distract).slice(0, 23)]);
    setTarget(t); setGrid(cells); setPhase("play"); startAt.current = performance.now();
  }

  function hit(a: string) {
    if (phase !== "play" || a !== target) return;
    const dt = (performance.now() - startAt.current) / 1000;
    const nt = [...times, dt];
    setTimes(nt);
    if (round >= TOTAL) {
      const mean = nt.reduce((x, y) => x + y, 0) / nt.length;
      setPhase("done");
      onComplete({ id: "visual-attention", label: "Atenção Visual", line: `Busca seletiva: tempo médio ${mean.toFixed(1)}s em ${TOTAL} rodadas` });
    } else { setRound((r) => r + 1); setPhase("idle"); }
  }

  const mean = times.length ? times.reduce((x, y) => x + y, 0) / times.length : 0;

  return (
    <div className="space-y-4">
      <Badge variant="outline">Rodada {Math.min(round, TOTAL)} / {TOTAL}</Badge>
      {phase === "idle" && (
        <div className="space-y-2 text-center">
          {round > 1 && <p className="text-xs text-muted-foreground">Última: {times[times.length - 1]?.toFixed(1)}s</p>}
          <Button onClick={start} className="w-full" size="lg">Começar — ache o alvo o mais rápido possível</Button>
        </div>
      )}
      {phase === "play" && (
        <div className="space-y-3">
          <p className="text-center text-sm font-semibold text-foreground">Ache e toque: <span className="text-2xl align-middle">{target}</span></p>
          <div className="grid grid-cols-6 gap-1.5">
            {grid.map((a, i) => (
              <button key={i} type="button" onClick={() => hit(a)} className="flex h-11 items-center justify-center rounded-lg border border-border bg-background text-2xl transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="célula">{a}</button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-1 p-5 text-center">
          <div className="text-4xl">🔍</div>
          <p className="text-sm font-bold text-foreground">Tempo médio: {mean.toFixed(1)}s</p>
          <p className="text-xs text-muted-foreground">Tempos &lt;3s sugerem boa atenção visual seletiva para idade escolar.</p>
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════ TESTE 4: Inibição (Dia/Noite) ═══════════════════════
function DayNight({ onComplete }: { onComplete: (r: TestResult) => void }) {
  const TOTAL = 10;
  const [trial, setTrial] = useState(0);
  const [cue, setCue] = useState<"sun" | "moon">("sun");
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");

  function start() {
    setCue(Math.random() < 0.5 ? "sun" : "moon"); setPhase("play");
  }

  function answer(say: "dia" | "noite") {
    if (phase !== "play") return;
    const correct = cue === "sun" ? "noite" : "dia"; // dizer o OPOSTO
    const nRight = right + (say === correct ? 1 : 0);
    const nWrong = wrong + (say === correct ? 0 : 1);
    const completed = trial + 1;
    setRight(nRight); setWrong(nWrong); setTrial(completed);
    if (completed >= TOTAL) {
      setPhase("done");
      onComplete({ id: "day-night", label: "Inibição (Dia/Noite)", line: `Controle inibitório: ${nRight}/${TOTAL} corretos, ${nWrong} erros automáticos` });
    } else {
      setCue(Math.random() < 0.5 ? "sun" : "moon"); // próxima tentativa imediata
    }
  }

  return (
    <div className="space-y-4">
      <Badge variant="outline">Tentativa {Math.min(trial + (phase === "play" ? 1 : 0), TOTAL)} / {TOTAL}</Badge>
      <p className="text-center text-xs text-muted-foreground">Regra: ao ver o <strong>sol</strong>, diga <strong>“noite”</strong>; ao ver a <strong>lua</strong>, diga <strong>“dia”</strong>.</p>
      {phase === "idle" && trial === 0 && <Button onClick={start} className="w-full" size="lg">Começar</Button>}
      {phase === "play" && (
        <div className="space-y-3">
          <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-border bg-muted/40" aria-live="polite">
            <span className="text-7xl">{cue === "sun" ? "☀️" : "🌙"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-14 text-lg font-bold" onClick={() => answer("dia")}>“Dia”</Button>
            <Button variant="outline" className="h-14 text-lg font-bold" onClick={() => answer("noite")}>“Noite”</Button>
          </div>
        </div>
      )}
      {phase === "done" && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-1 p-5 text-center">
          <div className="text-4xl">🌗</div>
          <p className="text-sm font-bold text-foreground">{right}/{TOTAL} corretos · {wrong} erros</p>
          <p className="text-xs text-muted-foreground">Erros frequentes ao “responder o automático” sugerem dificuldade de controle inibitório (função executiva).</p>
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════ TESTE 5: Consciência Fonológica ═══════════════════════
interface PhonQ { prompt: string; options: string[]; answer: string; kind: string; }
const PHON_BANK: PhonQ[] = [
  { prompt: "Qual palavra começa com o mesmo som de 🐱 GATO?", options: ["GAVETA", "PATO", "BOLA"], answer: "GAVETA", kind: "som inicial" },
  { prompt: "Qual palavra rima com PÃO?", options: ["MÃO", "CASA", "PEIXE"], answer: "MÃO", kind: "rima" },
  { prompt: "Qual começa com o mesmo som de SAPO?", options: ["SINO", "FACA", "RATO"], answer: "SINO", kind: "som inicial" },
  { prompt: "Qual rima com BOLA?", options: ["SACOLA", "MESA", "CARRO"], answer: "SACOLA", kind: "rima" },
  { prompt: "Qual começa com o mesmo som de FACA?", options: ["FOGO", "VACA", "LATA"], answer: "FOGO", kind: "som inicial" },
];

function Phonological({ onComplete }: { onComplete: (r: TestResult) => void }) {
  const questions = useMemo(() => shuffle(PHON_BANK), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"play" | "done">("play");

  function pick(opt: string) {
    if (phase !== "play") return;
    const ok = opt === questions[i].answer;
    const ns = score + (ok ? 1 : 0);
    if (i + 1 >= questions.length) {
      setScore(ns); setPhase("done");
      onComplete({ id: "phonological", label: "Consciência Fonológica", line: `Consciência fonológica: ${ns}/${questions.length} (${Math.round((ns / questions.length) * 100)}%)` });
    } else { setScore(ns); setI((x) => x + 1); }
  }

  const q = questions[i];
  return (
    <div className="space-y-4">
      <Badge variant="outline">Questão {Math.min(i + 1, questions.length)} / {questions.length} · {q?.kind}</Badge>
      {phase === "play" && q && (
        <div className="space-y-3">
          <p className="text-center text-base font-semibold text-foreground">{q.prompt}</p>
          <div className="grid gap-2">
            {q.options.map((o) => (
              <Button key={o} variant="outline" className="h-12 text-base font-bold" onClick={() => pick(o)}>{o}</Button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && (
        <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-1 p-5 text-center">
          <div className="text-4xl">🎵</div>
          <p className="text-sm font-bold text-foreground">{score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)</p>
          <p className="text-xs text-muted-foreground">Apoio à alfabetização: &lt; 3/5 sugere reforço em consciência fonológica antes da escrita formal.</p>
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════ Sondagens guiadas por domínio ═══════════════════════
function SondagensGuiadas() {
  const [domId, setDomId] = useState(directDomains[0]?.id ?? "");
  const dom = directDomains.find((d) => d.id === domId) ?? directDomains[0];
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">Roteiros de observação direta da criança, por domínio. A secretária/clínico aplica a tarefa e registra o que observou. Apoio à triagem — não é teste normatizado.</p>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Domínio da sondagem">
        {directDomains.map((d) => (
          <button key={d.id} type="button" role="tab" aria-selected={d.id === domId} onClick={() => setDomId(d.id)} className={`flex min-h-[40px] items-center gap-1 rounded-2xl border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${d.id === domId ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:border-primary/40"}`}>
            <span aria-hidden="true">{d.emoji}</span> {d.label}
          </button>
        ))}
      </div>
      {dom && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-black text-foreground">{dom.emoji} {dom.domain}</h3>
            <span className="text-[11px] text-muted-foreground">{Math.round(dom.age[0] / 12)}–{Math.round(dom.age[1] / 12)} anos</span>
          </div>
          {dom.tasks.map((t, i) => (
            <Card key={i} className={t.risk ? "border-amber-300 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20" : "border-border/70"}>
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl" aria-hidden="true">{t.emoji}</span>
                  <h4 className="text-sm font-bold text-foreground">{t.titulo}</h4>
                  {t.faixa && <Badge variant="outline" className="ml-auto text-[10px]">{Math.round(t.faixa[0] / 12)}–{Math.round(t.faixa[1] / 12)}a</Badge>}
                </div>
                <p className="text-xs leading-relaxed text-foreground"><strong>Faça:</strong> {t.instrucao}</p>
                <p className="text-xs leading-relaxed text-muted-foreground"><strong>Observe:</strong> {t.observar}</p>
                {t.risk && (
                  <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-amber-100/60 p-2 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>Tarefa sensível: conduzir com acolhimento. Se houver risco, acionar protocolo — <strong>CVV 188</strong> · <strong>SAMU 192</strong>.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════ Página ═══════════════════════
const TESTS = [
  { id: "digit-span", label: "Span de Dígitos", icon: Hash, hint: "Memória operacional" },
  { id: "picture-memory", label: "Memória de Figuras", icon: Brain, hint: "Memória visual" },
  { id: "visual-attention", label: "Atenção Visual", icon: Search, hint: "Busca seletiva" },
  { id: "day-night", label: "Inibição (Dia/Noite)", icon: SunMoon, hint: "Controle inibitório" },
  { id: "phonological", label: "Consciência Fonológica", icon: Music, hint: "Pré-alfabetização" },
] as const;

export default function TestesDiretosPage() {
  const [mode, setMode] = useState<"interativos" | "sondagens">("interativos");
  const [active, setActive] = useState<string>("digit-span");
  const [ageStr, setAgeStr] = useState("");
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const age = ageStr.trim() ? Math.max(0, Math.min(18, Number(ageStr) || 0)) : null;

  const addResult = (r: TestResult) => setResults((prev) => ({ ...prev, [r.id]: r }));

  const summaryText = useMemo(() => {
    const lines = TESTS.map((t) => results[t.id]?.line).filter(Boolean);
    return lines.length ? `Testes diretos com a criança — sessão:\n• ${lines.join("\n• ")}` : "";
  }, [results]);

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Baby className="h-5 w-5
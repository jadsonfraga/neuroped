import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AcademicoInterativoPage from "@/pages/academico-interativo";
import AtencaoConcentracaoPage from "@/pages/atencao-concentracao";
import AvaliacaoCognitivaInfantilPage from "@/pages/avaliacao-cognitiva-infantil";
import ConhecimentoVisualPage from "@/pages/conhecimento-visual";
import ConhecimentosGeraisPage from "@/pages/conhecimentos-gerais";
import EscritaDesenhoPage from "@/pages/escrita-desenho";
import FuncoesExecutivasPage from "@/pages/funcoes-executivas";
import LinguagemFonologiaPage from "@/pages/linguagem-fonologia";
import MemoriaTestePage from "@/pages/memoria-teste";
import MotricidadeTestePage from "@/pages/motricidade-teste";
import ProcessamentoVisuoauditivoPage from "@/pages/processamento-visuoauditivo";
import Tde2Page from "@/pages/tde2";
import TestesAcademicosPage from "@/pages/testes-academicos";
import TestesReconhecimentoPage from "@/pages/testes-reconhecimento";
import {
  ArrowRight,
  Hash,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Search,
  SunMoon,
  Music,
  RotateCcw,
  ClipboardCheck,
  Baby,
} from "lucide-react";

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
          line: `Span direto ${maxF} · inverso ${Math.max(maxB, 0)} dígitos`,
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

// ═══════════════════════ Página ═══════════════════════
const TESTS = [
  { id: "digit-span", label: "Span de Dígitos", icon: Hash, hint: "Memória operacional" },
  { id: "picture-memory", label: "Memória de Figuras", icon: Brain, hint: "Memória visual" },
  { id: "visual-attention", label: "Atenção Visual", icon: Search, hint: "Busca seletiva" },
  { id: "day-night", label: "Inibição (Dia/Noite)", icon: SunMoon, hint: "Controle inibitório" },
  { id: "phonological", label: "Consciência Fonológica", icon: Music, hint: "Pré-alfabetização" },
] as const;

const AGE_BANDS = [
  { id: "2-3", label: "2-3 anos", min: 2, max: 3, months: "24-47 meses" },
  { id: "4-5", label: "4-5 anos", min: 4, max: 5, months: "48-71 meses" },
  { id: "6-8", label: "6-8 anos", min: 6, max: 8, months: "72-107 meses" },
  { id: "9-12", label: "9-12 anos", min: 9, max: 12, months: "108-155 meses" },
  { id: "13-17", label: "13-17 anos", min: 13, max: 17, months: "156-215 meses" },
] as const;

const UNIFIED_DIRECT_TESTS = [
  { id: "avaliacao-cognitiva-infantil", label: "Avaliacao cognitiva infantil", route: "/avaliacao-cognitiva-infantil", ageMin: 2, ageMax: 19, tempo: "15-30 min", area: "Cognicao", note: "Bateria cognitiva por faixa etaria, de 2 a 19 anos." },
  { id: "testes-reconhecimento", label: "Reconhecimento visual", route: "/testes-reconhecimento", ageMin: 3, ageMax: 12, tempo: "5-10 min", area: "Visual", note: "Formas, cores, figura-fundo e discriminacao visual." },
  { id: "linguagem-fonologia", label: "Linguagem e fonologia", route: "/linguagem-fonologia", ageMin: 3, ageMax: 12, tempo: "10-15 min", area: "Linguagem", note: "Vocabulario, compreensao, expressao e consciencia fonologica." },
  { id: "motricidade-teste", label: "Motricidade", route: "/motricidade-teste", ageMin: 4, ageMax: 12, tempo: "10-15 min", area: "Motor", note: "Coordenacao grossa, fina, equilibrio e destreza." },
  { id: "escrita-desenho", label: "Escrita e desenho", route: "/escrita-desenho", ageMin: 4, ageMax: 12, tempo: "10-15 min", area: "Grafomotor", note: "Tracado, copia de formas, organizacao espacial e escrita inicial." },
  { id: "conhecimento-visual", label: "Conhecimento visual", route: "/conhecimento-visual", ageMin: 3, ageMax: 10, tempo: "10 min", area: "Cognitivo visual", note: "Simetria, padroes, sequencias e percepcao visual." },
  { id: "conhecimentos-gerais", label: "Conhecimentos gerais", route: "/conhecimentos-gerais", ageMin: 5, ageMax: 12, tempo: "10-15 min", area: "Cognicao", note: "Conhecimento factual, raciocinio logico e repertorio cultural." },
  { id: "atencao-concentracao", label: "Atencao e concentracao", route: "/atencao-concentracao", ageMin: 6, ageMax: 14, tempo: "10 min", area: "Atencao", note: "Atencao sustentada, seletiva e dividida." },
  { id: "funcoes-executivas", label: "Funcoes executivas", route: "/funcoes-executivas", ageMin: 6, ageMax: 14, tempo: "10-15 min", area: "Executivo", note: "Planejamento, inibicao, flexibilidade e memoria de trabalho." },
  { id: "memoria-teste", label: "Memoria", route: "/memoria-teste", ageMin: 5, ageMax: 14, tempo: "10-15 min", area: "Memoria", note: "Curto prazo, memoria operacional, aprendizagem e evocacao." },
  { id: "processamento-visuoauditivo", label: "Processamento visual-auditivo", route: "/processamento-visuoauditivo", ageMin: 5, ageMax: 12, tempo: "10 min", area: "Integracao", note: "Processamento auditivo, visual e integracao multissensorial." },
  { id: "academico-interativo", label: "Academico interativo", route: "/academico-interativo", ageMin: 6, ageMax: 14, tempo: "10-15 min", area: "Aprendizagem", note: "Calculo, problemas, sequencias logicas e habilidades escolares." },
  { id: "testes-academicos", label: "Leitura, escrita e aritmetica", route: "/testes-academicos", ageMin: 6, ageMax: 14, tempo: "15-25 min", area: "Escolar", note: "Sondagem escolar direta para leitura, escrita e matematica." },
  { id: "tde2", label: "TDE-2 adaptado", route: "/tde2", ageMin: 6, ageMax: 17, tempo: "15-25 min", area: "Escolar", note: "Triagem adaptada de desempenho escolar por idade." },
] as const;

type UnifiedDirectTestId = (typeof UNIFIED_DIRECT_TESTS)[number]["id"];

const UNIFIED_TEST_COMPONENTS: Record<UnifiedDirectTestId, ComponentType> = {
  "avaliacao-cognitiva-infantil": AvaliacaoCognitivaInfantilPage,
  "testes-reconhecimento": TestesReconhecimentoPage,
  "linguagem-fonologia": LinguagemFonologiaPage,
  "motricidade-teste": MotricidadeTestePage,
  "escrita-desenho": EscritaDesenhoPage,
  "conhecimento-visual": ConhecimentoVisualPage,
  "conhecimentos-gerais": ConhecimentosGeraisPage,
  "atencao-concentracao": AtencaoConcentracaoPage,
  "funcoes-executivas": FuncoesExecutivasPage,
  "memoria-teste": MemoriaTestePage,
  "processamento-visuoauditivo": ProcessamentoVisuoauditivoPage,
  "academico-interativo": AcademicoInterativoPage,
  "testes-academicos": TestesAcademicosPage,
  tde2: Tde2Page,
};

function getInitialUnifiedTest(): UnifiedDirectTestId | null {
  if (typeof window === "undefined") return null;
  const query = window.location.hash.split("?")[1] ?? "";
  const teste = new URLSearchParams(query).get("teste");
  return UNIFIED_DIRECT_TESTS.some((item) => item.id === teste) ? (teste as UnifiedDirectTestId) : null;
}

function getAgeBand(age: number | null) {
  if (age == null) return AGE_BANDS[2];
  return AGE_BANDS.find((band) => age >= band.min && age <= band.max) ?? AGE_BANDS[AGE_BANDS.length - 1];
}

export default function TestesDiretosPage() {
  const [active, setActive] = useState<string>("digit-span");
  const [selectedUnifiedTest, setSelectedUnifiedTest] = useState<UnifiedDirectTestId | null>(getInitialUnifiedTest);
  const [ageStr, setAgeStr] = useState(() => {
    if (typeof window === "undefined") return "";
    const query = window.location.hash.split("?")[1] ?? "";
    const idade = new URLSearchParams(query).get("idade") ?? "";
    return idade.replace(/[^0-9]/g, "").slice(0, 2);
  });
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const age = ageStr.trim() ? Math.max(0, Math.min(18, Number(ageStr) || 0)) : null;
  const selectedAgeBand = getAgeBand(age);
  const unifiedBattery = UNIFIED_DIRECT_TESTS.filter(
    (test) => test.ageMin <= selectedAgeBand.max && test.ageMax >= selectedAgeBand.min,
  );
  const selectedUnifiedMeta = UNIFIED_DIRECT_TESTS.find((test) => test.id === selectedUnifiedTest) ?? null;
  const SelectedUnifiedComponent = selectedUnifiedTest ? UNIFIED_TEST_COMPONENTS[selectedUnifiedTest] : null;

  const addResult = (r: TestResult) => setResults((prev) => ({ ...prev, [r.id]: r }));

  const summaryText = useMemo(() => {
    const lines = TESTS.map((t) => results[t.id]?.line).filter(Boolean);
    return lines.length ? `Testes diretos com a criança — sessão:\n• ${lines.join("\n• ")}` : "";
  }, [results]);

  return (
    <div className="space-y-5 pb-8">
      <header className="rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-md"><Baby className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <Badge className="mb-2 rounded-full bg-primary/10 text-primary hover:bg-primary/10">testes diretos com a criança · pré-consulta</Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Testes Diretos</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Mini-testes observacionais aplicados na criança (memória, atenção, inibição, fonologia). Apoio à triagem — não substitui avaliação formal. Rodam só no dispositivo.</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <label htmlFor="idade-crianca" className="text-xs font-semibold text-muted-foreground">Idade (anos):</label>
          <Input id="idade-crianca" inputMode="numeric" value={ageStr} onChange={(e) => setAgeStr(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))} placeholder="ex.: 6" className="h-9 w-20" />
          <span className="text-xs text-muted-foreground">ajusta a referência clínica</span>
        </div>
      </header>

      <section className="space-y-3" aria-labelledby="bateria-unica-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="bateria-unica-title" className="text-lg font-black text-foreground">Bateria unica por faixa etaria</h2>
            <p className="text-sm text-muted-foreground">Todos os testes diretos ficam reunidos aqui. Escolha a idade para ver o bloco mais adequado.</p>
          </div>
          <Badge variant="outline" className="gap-1 rounded-full px-3 py-1">
            <Calendar className="h-3.5 w-3.5" />
            {selectedAgeBand.label} · {selectedAgeBand.months}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Faixa etaria">
          {AGE_BANDS.map((band) => {
            const isActive = selectedAgeBand.id === band.id;
            return (
              <button
                key={band.id}
                type="button"
                onClick={() => setAgeStr(String(band.min))}
                aria-pressed={isActive}
                className={`min-h-[56px] rounded-2xl border px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}
              >
                <span className="block text-sm font-black text-foreground">{band.label}</span>
                <span className="block text-[11px] text-muted-foreground">{band.months}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {unifiedBattery.map((test) => (
            <Card key={test.id} className="border-border/70 bg-card">
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{test.area}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {test.tempo}
                    </Badge>
                    <Badge variant="outline">{test.ageMin}-{test.ageMax} anos</Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-foreground">{test.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{test.note}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedUnifiedTest === test.id ? "default" : "outline"}
                  className="shrink-0"
                  onClick={() => setSelectedUnifiedTest(test.id)}
                  aria-label={`Abrir ${test.label} nesta bateria`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {SelectedUnifiedComponent && selectedUnifiedMeta && (
          <section className="space-y-3 rounded-2xl border border-border bg-background p-3 sm:p-4" aria-labelledby="teste-direto-ativo-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <Badge className="mb-1 bg-primary/10 text-primary hover:bg-primary/10">aplicando agora</Badge>
                <h3 id="teste-direto-ativo-title" className="text-base font-black text-foreground">{selectedUnifiedMeta.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href={selectedUnifiedMeta.route}>Rota antiga</Link>
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedUnifiedTest(null)}>
                  Fechar
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/40 p-2 sm:p-3">
              <SelectedUnifiedComponent />
            </div>
          </section>
        )}

        <Card className="border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use a bateria acima como porta unica dos testes diretos. Os mini-testes rapidos abaixo continuam na mesma tela para triagem breve durante a consulta.
            </p>
          </CardContent>
        </Card>
      </section>

      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label="Selecionar teste">
        {TESTS.map((t) => {
          const Icon = t.icon; const isActive = active === t.id; const done = Boolean(results[t.id]);
          return (
            <button key={t.id} type="button" onClick={() => setActive(t.id)} aria-pressed={isActive} className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}>
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[11px] font-bold leading-tight text-foreground">{t.label}</span>
              {done && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ feito</span>}
            </button>
          );
        })}
      </nav>

      <Card>
        <CardContent className="p-5">
          {active === "digit-span" && <DigitSpan age={age} onComplete={addResult} />}
          {active === "picture-memory" && <PictureMemory onComplete={addResult} />}
          {active === "visual-attention" && <VisualAttention onComplete={addResult} />}
          {active === "day-night" && <DayNight onComplete={addResult} />}
          {active === "phonological" && <Phonological onComplete={addResult} />}
        </CardContent>
      </Card>

      {summaryText && (
        <Card className="border-border/70 bg-muted/30">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" /><h2 className="text-sm font-black text-foreground">Resumo da sessão (para o laudo)</h2></div>
            <pre className="whitespace-pre-wrap rounded-xl bg-background p-3 text-xs leading-relaxed text-foreground">{summaryText}</pre>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => { void navigator.clipboard?.writeText(summaryText); }}>Copiar resumo</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

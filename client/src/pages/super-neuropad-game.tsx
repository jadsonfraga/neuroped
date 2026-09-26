import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Gamepad2,
  Music,
  Music2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { celebrate } from "@/lib/confetti";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { issuerCredentials, useIssuer } from "@/lib/issuer";
import { softTap } from "@/lib/softSounds";
import { playCoin, playFlagPole, playPowerUp } from "@/lib/sounds";
import { downloadTextDocument, safeTextFilename } from "@/lib/shareText";
import { createChiptune, type Chiptune } from "@/features/super-neuropad/music";
import { buildGameDocSpec, issuerLines } from "@/features/super-neuropad/pdf";
import {
  CHARACTERS,
  ITEMS_PER_PHASE,
  KIND_LABELS,
  LEVEL_LABELS,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  PHASE_ORDER,
  PHASES,
  STATUS_LABELS,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_SOURCES,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
  bandForYears,
  buildGameReport,
  formatDuration,
  itemsFor,
  phaseById,
  recordJudged,
  recordTouch,
  shuffle,
  summarize,
  type AnswerRecord,
  type AnswerStatus,
  type Character,
  type GameSession,
  type Item,
  type Level,
  type Option,
  type PhaseId,
  type ShapeId,
  type TouchItem,
} from "@/features/super-neuropad/model";

const XP_PER_ITEM = 10;
const CHEERS = ["Registrado! +10 XP", "Anotado, próxima!", "Boa, vamos em frente!", "Mais um passo na aventura!"] as const;
const YEARS = Array.from({ length: MAX_AGE_YEARS - MIN_AGE_YEARS + 1 }, (_, index) => MIN_AGE_YEARS + index);

type Screen = "setup" | "intro" | "play" | "phase-done" | "results";

const PHASE_SURFACE: Record<PhaseId, string> = {
  olhos: "from-emerald-300/50 via-lime-100/70 to-background dark:from-emerald-900/50 dark:via-emerald-950/30",
  palavras: "from-sky-300/50 via-cyan-100/70 to-background dark:from-sky-900/50 dark:via-sky-950/30",
  numeros: "from-violet-300/50 via-fuchsia-100/70 to-background dark:from-violet-900/50 dark:via-violet-950/30",
  memoria: "from-amber-300/50 via-orange-100/70 to-background dark:from-amber-900/50 dark:via-amber-950/30",
  corpo: "from-rose-300/50 via-pink-100/70 to-background dark:from-rose-900/50 dark:via-rose-950/30",
};

const OPTION_TINTS = [
  "bg-rose-50 hover:bg-rose-100 border-rose-300 dark:bg-rose-950/30 dark:border-rose-900",
  "bg-sky-50 hover:bg-sky-100 border-sky-300 dark:bg-sky-950/30 dark:border-sky-900",
  "bg-amber-50 hover:bg-amber-100 border-amber-300 dark:bg-amber-950/30 dark:border-amber-900",
  "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-900",
];

const LEVEL_TONE: Record<Level, string> = {
  esperado: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100",
  observar: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100",
  alerta: "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100",
};

const STATUS_TONE: Record<AnswerStatus, string> = {
  acerto: "bg-emerald-600 text-white",
  erro: "bg-rose-600 text-white",
  sem_resposta: "bg-slate-500 text-white",
};

function ShapeArt({ shape }: { shape: ShapeId }) {
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40 text-foreground sm:h-52 sm:w-52" role="img" aria-label={`Figura para copiar: ${shape}`}>
      {shape === "circulo" && <circle cx="60" cy="60" r="44" {...common} />}
      {shape === "cruz" && (<><line x1="60" y1="14" x2="60" y2="106" {...common} /><line x1="14" y1="60" x2="106" y2="60" {...common} /></>)}
      {shape === "quadrado" && <rect x="18" y="18" width="84" height="84" {...common} />}
      {shape === "triangulo" && <polygon points="60,14 108,104 12,104" {...common} />}
      {shape === "losango" && <polygon points="60,10 110,60 60,110 10,60" {...common} />}
      {shape === "pentagono" && <polygon points="60,10 109,46 90,106 30,106 11,46" {...common} />}
    </svg>
  );
}

function StimulusView({ item }: { item: Item }) {
  if (item.kind === "fazer" && item.shape) return <ShapeArt shape={item.shape} />;
  const text = item.kind === "toque" ? null : item.stimulus;
  if (!text) return null;
  const long = text.length > 12;
  return (
    <div className={`max-w-full break-words text-center font-black leading-tight ${long ? "text-2xl sm:text-4xl" : "text-6xl sm:text-8xl"}`} aria-label={`Estímulo: ${text}`}>
      {text}
    </div>
  );
}

function CharacterCard({ character, selected, onPick }: { character: Character; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => { softTap(); onPick(); }}
      className={`flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 text-center transition motion-safe:hover:-translate-y-0.5 ${selected ? "border-primary bg-primary/10 ring-4 ring-primary/20" : "border-border bg-background hover:bg-muted/40"}`}
    >
      <span className="text-4xl" aria-hidden="true">{character.emoji}</span>
      <span className="text-sm font-black">{character.name} {character.role}</span>
      <span className="text-[11px] text-muted-foreground">{character.power}</span>
    </button>
  );
}

function PhaseTrail({ current, done, character }: { current: number; done: boolean[]; character: Character }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Trilha das fases: ${done.filter(Boolean).length} de ${PHASES.length} concluídas`}>
      {PHASES.map((phase, index) => {
        const isDone = done[index];
        const isNow = index === current;
        return (
          <li key={phase.id} className="flex items-center gap-1.5">
            <span
              title={`Fase ${phase.order} · ${phase.name}`}
              className={`flex items-center justify-center rounded-full font-black transition ${isNow ? "h-10 w-10 bg-primary text-xl ring-4 ring-primary/25 motion-safe:animate-pulse" : isDone ? "h-8 w-8 bg-amber-300 text-sm text-amber-950" : "h-8 w-8 bg-muted text-xs text-muted-foreground"}`}
            >
              <span aria-hidden="true">{isNow ? character.emoji : isDone ? "★" : phase.order}</span>
              <span className="sr-only">Fase {phase.order}, {phase.name}: {isDone ? "concluída" : isNow ? "atual" : "a caminho"}</span>
            </span>
            {index < PHASES.length - 1 && <span aria-hidden="true" className={`h-1 w-3 rounded-full sm:w-5 ${isDone ? "bg-amber-300" : "bg-border"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Hud({ character, xp, level, phaseIndex, done, musicOn, onToggleMusic, onRestart }: {
  character: Character; xp: number; level: number; phaseIndex: number; done: boolean[]; musicOn: boolean; onToggleMusic: () => void; onRestart: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/90 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-2xl" aria-hidden="true">{character.emoji}</span>
        <div>
          <div className="text-sm font-black">{character.name} {character.role}</div>
          <div className="text-[11px] text-muted-foreground">Nível {level} · <span aria-live="polite">{xp} XP</span></div>
        </div>
      </div>
      <PhaseTrail current={phaseIndex} done={done} character={character} />
      <div className="flex items-center gap-1.5">
        <Button type="button" size="sm" variant={musicOn ? "default" : "outline"} className="rounded-xl" aria-pressed={musicOn} onClick={onToggleMusic}>
          {musicOn ? <Music2 className="mr-1.5 h-4 w-4" /> : <Music className="mr-1.5 h-4 w-4" />}
          Música
        </Button>
        <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={onRestart}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Reiniciar
        </Button>
      </div>
    </div>
  );
}

function TouchStage({ item, seed, onAnswer }: { item: TouchItem; seed: number; onAnswer: (chosen: Option | null) => void }) {
  const [revealed, setRevealed] = useState(!item.preview);
  const options = useMemo(() => shuffle(item.options, seed), [item, seed]);
  if (!revealed && item.preview) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <p className="text-center text-lg font-bold text-muted-foreground">Olhe bem para as figuras…</p>
        <div className="text-7xl sm:text-8xl" aria-label={`Figuras mostradas: ${item.preview}`}>{item.preview}</div>
        <Button type="button" size="lg" className="rounded-2xl" onClick={() => { softTap(); setRevealed(true); }}>
          <Check className="mr-2 h-5 w-5" /> Já olhou · esconder
        </Button>
        <p className="text-xs text-muted-foreground">Aplicadora: deixe cerca de 5 segundos e toque em esconder.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.prompt}</p>
      <div className={`grid gap-3 ${options.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`} role="group" aria-label="Opções">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            onClick={() => onAnswer(option)}
            className={`flex min-h-32 items-center justify-center rounded-3xl border-2 p-3 text-center font-black shadow-sm transition motion-safe:active:scale-95 ${OPTION_TINTS[index % OPTION_TINTS.length]} ${item.big ? (option.size === "lg" ? "text-8xl" : option.size === "sm" ? "text-4xl" : "text-6xl") : "text-xl sm:text-2xl"}`}
            aria-label={option.label}
          >
            <span aria-hidden="true">{option.art}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function JudgeStage({ item, onJudge }: { item: Exclude<Item, TouchItem>; onJudge: (status: AnswerStatus) => void }) {
  return (
    <div className="space-y-5">
      <div className="flex min-h-40 items-center justify-center rounded-3xl border border-border/60 bg-background/70 p-6">
        <StimulusView item={item} />
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="text-[11px] font-black uppercase tracking-wide text-primary">Aplicadora · {KIND_LABELS[item.kind]}</div>
        <p className="mt-1 text-base font-bold leading-snug">{item.prompt}</p>
        <p className="mt-2 text-sm"><span className="font-black">Conta como acerto:</span> {item.expected}</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Button type="button" size="lg" className="min-h-14 rounded-2xl bg-emerald-600 text-base hover:bg-emerald-700" onClick={() => onJudge("acerto")}>
            <Check className="mr-2 h-5 w-5" /> Acertou
          </Button>
          <Button type="button" size="lg" className="min-h-14 rounded-2xl bg-rose-600 text-base hover:bg-rose-700" onClick={() => onJudge("erro")}>
            <X className="mr-2 h-5 w-5" /> Errou
          </Button>
          <Button type="button" size="lg" variant="outline" className="min-h-14 rounded-2xl text-base" onClick={() => onJudge("sem_resposta")}>
            Não respondeu
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SuperNeuroPadGamePage() {
  const { toast } = useToast();
  const { issuer } = useIssuer();
  const [screen, setScreen] = useState<Screen>("setup");
  const [ageYears, setAgeYears] = useState<number | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [kitChecked, setKitChecked] = useState<Record<string, boolean>>({});
  const [musicOn, setMusicOn] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [cheer, setCheer] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const startedAt = useRef<string>("");
  const finishedAt = useRef<string | null>(null);
  const itemStart = useRef<number>(0);
  const cheerTimer = useRef<number | null>(null);
  const music = useRef<Chiptune | null>(null);

  const band = ageYears === null ? undefined : bandForYears(ageYears);
  const phaseId = PHASE_ORDER[phaseIndex];
  const phase = phaseById(phaseId);
  const items = band ? itemsFor(band.id, phaseId) : [];
  const item = items[itemIndex];
  const xp = answers.length * XP_PER_ITEM;
  const done = PHASE_ORDER.map((id) => band ? answers.filter((answer) => answer.phaseId === id).length >= itemsFor(band.id, id).length : false);
  const dirty = answers.length > 0 && screen !== "results";

  const session: GameSession | null = ageYears !== null && band && character ? {
    version: SUPER_NEUROPAD_VERSION,
    ageYears,
    bandId: band.id,
    characterId: character.id,
    startedAt: startedAt.current,
    finishedAt: finishedAt.current,
    answers,
  } : null;

  const getMusic = useCallback(() => {
    if (!music.current) music.current = createChiptune();
    return music.current;
  }, []);

  useEffect(() => () => { music.current?.stop(); if (cheerTimer.current) window.clearTimeout(cheerTimer.current); }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (screen === "play") itemStart.current = performance.now();
  }, [screen, phaseIndex, itemIndex]);

  const toggleMusic = useCallback(() => {
    softTap();
    const next = !musicOn;
    setMusicOn(next);
    if (next) getMusic().start(); else music.current?.stop();
  }, [getMusic, musicOn]);

  function startGame() {
    if (!band || !character || ageYears === null) return;
    softTap();
    startedAt.current = new Date().toISOString();
    finishedAt.current = null;
    setAnswers([]);
    setPhaseIndex(0);
    setItemIndex(0);
    setScreen("intro");
    if (musicOn) getMusic().start();
  }

  function restart() {
    if (answers.length > 0 && screen !== "results" && !window.confirm("Reiniciar apaga o registro desta partida. Deseja reiniciar?")) return;
    softTap();
    music.current?.stop();
    setAnswers([]);
    setPhaseIndex(0);
    setItemIndex(0);
    setKitChecked({});
    finishedAt.current = null;
    setScreen("setup");
  }

  function pushAnswer(record: AnswerRecord) {
    playCoin();
    const next = [...answers, record];
    setAnswers(next);
    setCheer(CHEERS[next.length % CHEERS.length]);
    if (cheerTimer.current) window.clearTimeout(cheerTimer.current);
    cheerTimer.current = window.setTimeout(() => setCheer(null), 900);
    if (itemIndex + 1 < items.length) {
      setItemIndex(itemIndex + 1);
      return;
    }
    if (phaseIndex + 1 < PHASE_ORDER.length) {
      playPowerUp();
      setScreen("phase-done");
      return;
    }
    finishedAt.current = new Date().toISOString();
    playFlagPole();
    celebrate();
    music.current?.stop();
    setScreen("results");
  }

  function elapsedSeconds(): number {
    return (performance.now() - itemStart.current) / 1000;
  }

  function nextPhase() {
    softTap();
    setPhaseIndex(phaseIndex + 1);
    setItemIndex(0);
    setScreen("intro");
  }

  async function exportPdf() {
    if (!session) return;
    setExporting(true);
    try {
      const { buildDocumentPdf } = await import("@/lib/documentPdf");
      const bytes = await buildDocumentPdf(buildGameDocSpec(session, issuerLines(issuer, issuerCredentials(issuer)), formatClinicalDateTime(new Date(session.finishedAt ?? session.startedAt))));
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeTextFilename(`super-neuropad-game-${session.bandId}-${session.startedAt.slice(0, 10)}`)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast({ title: "PDF detalhado gerado", description: "Contém todas as perguntas, respostas esperadas, respostas registradas e tempos." });
    } catch (error) {
      toast({ title: "Falha ao gerar PDF", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function copyReport() {
    if (!session) return;
    const text = buildGameReport(session);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Registro copiado", description: "Texto completo do resultado na área de transferência." });
    } catch {
      downloadTextDocument(text, `${safeTextFilename(`super-neuropad-game-${session.bandId}`)}.txt`);
      toast({ title: "Registro baixado em TXT", description: "A área de transferência não estava disponível." });
    }
  }

  const summary = session ? summarize(session) : null;

  return (
    <div className="space-y-5 pb-8" data-testid="super-neuropad-game" data-screen={screen}>
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-fuchsia-500/[0.10] via-card/70 to-cyan-500/[0.10] p-5 shadow-sm backdrop-blur sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-fuchsia-400/25 to-cyan-400/10 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 to-cyan-600 text-white shadow-lg shadow-fuchsia-600/25 ring-1 ring-white/20">
            <Gamepad2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950 dark:text-fuchsia-300">pré-consulta · secretária · {MIN_AGE_YEARS}–{MAX_AGE_YEARS} anos</Badge>
              <Badge variant="outline">v{SUPER_NEUROPAD_VERSION}</Badge>
              <Badge variant="outline">5 fases · {ITEMS_PER_PHASE} desafios por fase</Badge>
              <Badge variant="outline">sem câmera</Badge>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{SUPER_NEUROPAD_TITLE}</h1>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Uma aventura em cinco fases que reúne Sonda 10, OBS-10, Reconhecimento Visual e Testes Cognitivos por Faixa Etária. Cada desafio tem certo e errado; a criança só vê XP e conquistas. Ao final, o resultado objetivo sai em PDF detalhado. Triagem autoral de déficits grosseiros — a leitura é do médico.
            </p>
          </div>
        </div>
      </header>

      {screen === "setup" && (
        <section className="space-y-5">
          <div className="rounded-3xl border border-border/60 bg-card p-5">
            <h2 className="text-lg font-black">1 · Idade da criança (anos)</h2>
            <p className="text-xs text-muted-foreground">Somente anos completos. A faixa define os desafios.</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="Idade em anos">
              {YEARS.map((year) => (
                <button key={year} type="button" aria-pressed={ageYears === year} onClick={() => { softTap(); setAgeYears(year); setKitChecked({}); }}
                  className={`min-h-12 rounded-xl border-2 text-lg font-black transition ${ageYears === year ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted/40"}`}>
                  {year}
                </button>
              ))}
            </div>
            {band && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xl" aria-hidden="true">{band.icon}</span>
                <span className="font-black">Faixa {band.label}</span>
                <span className="text-muted-foreground">· {PHASES.length * ITEMS_PER_PHASE} desafios · cerca de 10 minutos</span>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-5">
            <h2 className="text-lg font-black">2 · Escolha o personagem</h2>
            <p className="text-xs text-muted-foreground">Deixe a criança escolher. Nenhum personagem muda os desafios.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label="Personagens">
              {CHARACTERS.map((entry) => <CharacterCard key={entry.id} character={entry} selected={character?.id === entry.id} onPick={() => setCharacter(entry)} />)}
            </div>
          </div>

          {band && (
            <div className="rounded-3xl border border-border/60 bg-card p-5">
              <h2 className="text-lg font-black">3 · Kit da fase do corpo</h2>
              <p className="text-xs text-muted-foreground">Separe antes de começar. Checklist só em memória.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {band.kit.map((entry) => {
                  const checked = Boolean(kitChecked[entry]);
                  return (
                    <button key={entry} type="button" aria-pressed={checked} onClick={() => { softTap(); setKitChecked((current) => ({ ...current, [entry]: !checked })); }}
                      className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${checked ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100" : "border-border bg-background hover:bg-muted/50"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${checked ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>{checked ? <Check className="h-4 w-4" /> : "○"}</span>
                      {entry}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-primary/20 bg-primary/5 p-5">
            <Button type="button" size="lg" className="rounded-2xl text-base" disabled={!band || !character} onClick={startGame}>
              <Sparkles className="mr-2 h-5 w-5" /> Começar a aventura
            </Button>
            <Button type="button" size="lg" variant={musicOn ? "default" : "outline"} className="rounded-2xl" aria-pressed={musicOn} onClick={() => { softTap(); setMusicOn((current) => !current); }}>
              {musicOn ? <Music2 className="mr-2 h-5 w-5" /> : <Music className="mr-2 h-5 w-5" />} Música {musicOn ? "ligada" : "desligada"}
            </Button>
            <p className="text-xs text-muted-foreground">{!band ? "Escolha a idade." : !character ? "Escolha o personagem." : "Tudo pronto. Vire o tablet para a criança ao começar."}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4 text-primary" /> Regras de ouro da aplicadora</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                <li>Leia cada comando uma vez; pode repetir uma única vez. Não dê pistas nem treine até acertar.</li>
                <li>Itens de fala e de ação: marque acerto só quando o critério da tela for cumprido inteiro.</li>
                <li>Criança cansada ou recusando: marque “Não respondeu” e siga. Nunca force.</li>
                <li>Nada é salvo no navegador. Gere o PDF ao final antes de sair da página.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-xs leading-relaxed">
              <div className="font-black">Proveniência</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">
                {SUPER_NEUROPAD_SOURCES.map((source) => <li key={source}>{source}</li>)}
              </ul>
              <p className="mt-2 text-muted-foreground">{SUPER_NEUROPAD_NATURE}</p>
            </div>
          </div>
        </section>
      )}

      {screen !== "setup" && character && (
        <Hud character={character} xp={xp} level={phaseIndex + 1} phaseIndex={phaseIndex} done={done} musicOn={musicOn} onToggleMusic={toggleMusic} onRestart={restart} />
      )}

      {screen === "intro" && character && (
        <section className={`rounded-3xl border border-border/60 bg-gradient-to-br p-6 text-center ${PHASE_SURFACE[phaseId]}`}>
          <div className="text-7xl" aria-hidden="true">{phase.emoji}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-widest text-muted-foreground">Fase {phase.order} de {PHASES.length}</div>
          <h2 className="text-3xl font-black">{phase.name}</h2>
          <p className="mt-1 text-base text-muted-foreground">{phase.tagline}</p>
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-primary/20 bg-background/80 p-4 text-left text-sm">
            <div className="text-[11px] font-black uppercase tracking-wide text-primary">Aplicadora · {phase.domain}</div>
            <p className="mt-1 leading-relaxed">{phase.operator}</p>
          </div>
          <Button type="button" size="lg" className="mt-5 rounded-2xl text-base" onClick={() => { softTap(); setScreen("play"); }}>
            {character.emoji} Entrar na fase
          </Button>
        </section>
      )}

      {screen === "play" && item && (
        <section className={`relative rounded-3xl border border-border/60 bg-gradient-to-br p-4 sm:p-6 ${PHASE_SURFACE[phaseId]}`}>
          <div className="mb-4 flex items-center justify-between text-xs font-black uppercase tracking-wide text-muted-foreground">
            <span>{phase.emoji} {phase.name}</span>
            <span aria-live="polite">Desafio {itemIndex + 1} de {items.length}</span>
          </div>
          {item.kind === "toque" ? (
            <div className="space-y-4">
              <TouchStage key={item.id} item={item} seed={seed + itemIndex * 17 + phaseIndex * 101} onAnswer={(chosen) => pushAnswer(recordTouch(item, phaseId, chosen, elapsedSeconds()))} />
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" className="rounded-xl text-muted-foreground" onClick={() => pushAnswer(recordTouch(item, phaseId, null, elapsedSeconds()))}>
                  Aplicadora: não respondeu · pular
                </Button>
              </div>
            </div>
          ) : (
            <JudgeStage key={item.id} item={item} onJudge={(status) => pushAnswer(recordJudged(item, phaseId, status, elapsedSeconds()))} />
          )}
          {cheer && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center" aria-live="polite">
              <span className="rounded-full bg-amber-300 px-4 py-1.5 text-sm font-black text-amber-950 shadow-lg motion-safe:animate-bounce">⭐ {cheer}</span>
            </div>
          )}
        </section>
      )}

      {screen === "phase-done" && character && (
        <section className={`rounded-3xl border border-border/60 bg-gradient-to-br p-6 text-center ${PHASE_SURFACE[phaseId]}`}>
          <div className="text-7xl motion-safe:animate-bounce" aria-hidden="true">🏅</div>
          <h2 className="mt-2 text-3xl font-black">Conquista: {phase.badge}!</h2>
          <p className="mt-1 text-base text-muted-foreground">{character.emoji} {character.name} {character.role} subiu para o nível {phaseIndex + 2}.</p>
          <Button type="button" size="lg" className="mt-5 rounded-2xl text-base" onClick={nextPhase}>
            Próxima fase: {phaseById(PHASE_ORDER[phaseIndex + 1]).emoji} {phaseById(PHASE_ORDER[phaseIndex + 1]).name}
          </Button>
        </section>
      )}

      {screen === "results" && summary && session && (
        <section className="space-y-4">
          <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-amber-200/60 via-background to-background p-6 text-center dark:from-amber-900/30">
            <div className="text-6xl" aria-hidden="true">🏆</div>
            <h2 className="mt-2 text-3xl font-black">Aventura concluída!</h2>
            <p className="text-base text-muted-foreground">{summary.character.emoji} {summary.character.name} {summary.character.role} · {xp} XP · 5 conquistas</p>
            <p className="mt-3 text-xs font-bold text-muted-foreground">Aplicadora: vire a tela para você. O que vem abaixo é o registro objetivo.</p>
          </div>

          <div className={`rounded-3xl border-2 p-5 ${LEVEL_TONE[summary.level]}`}>
            <div className="text-[11px] font-black uppercase tracking-wide">Resultado objetivo · {summary.band.label}</div>
            <div className="mt-1 text-3xl font-black">{summary.hits} de {summary.total} acertos</div>
            <div className="text-base font-bold">{LEVEL_LABELS[summary.level]}</div>
            <div className="mt-1 text-xs opacity-80">Tempo somado nas tarefas: {formatDuration(summary.durationSeconds)} · contagem autoral, não normativa; leitura é do médico.</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.phases.map((entry) => (
              <div key={entry.phase.id} className={`rounded-2xl border p-4 ${LEVEL_TONE[entry.level]}`}>
                <div className="text-2xl" aria-hidden="true">{entry.phase.emoji}</div>
                <div className="text-sm font-black">{entry.phase.name}</div>
                <div className="text-[11px] opacity-80">{entry.phase.domain}</div>
                <div className="mt-2 text-2xl font-black">{entry.hits}/{entry.total}</div>
                <div className="text-xs font-bold">{LEVEL_LABELS[entry.level]}</div>
                <div className="mt-1 text-[11px] opacity-80">{entry.errors} erros · {entry.noResponse} sem resposta</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="lg" className="rounded-2xl" disabled={exporting} onClick={() => { softTap(); void exportPdf(); }}>
              <Download className="mr-2 h-5 w-5" /> {exporting ? "Gerando PDF…" : "Baixar PDF detalhado"}
            </Button>
            <Button type="button" size="lg" variant="outline" className="rounded-2xl" onClick={() => { softTap(); void copyReport(); }}>
              <Copy className="mr-2 h-5 w-5" /> Copiar registro
            </Button>
            <Button type="button" size="lg" variant="ghost" className="rounded-2xl" onClick={restart}>
              <RotateCcw className="mr-2 h-5 w-5" /> Nova partida
            </Button>
          </div>

          <div className="space-y-3">
            {summary.phases.map((entry) => (
              <details key={entry.phase.id} className="rounded-2xl border border-border/60 bg-card p-4" open>
                <summary className="cursor-pointer text-sm font-black">{entry.phase.emoji} Fase {entry.phase.order} · {entry.phase.name} · {entry.hits}/{entry.total}</summary>
                <ol className="mt-3 space-y-2">
                  {entry.answers.map((answer, index) => (
                    <li key={answer.itemId} className="rounded-xl border border-border/60 bg-background p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-bold">{index + 1}. {answer.prompt}</div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{KIND_LABELS[answer.kind]} · {answer.seconds} s</div>
                      <div className="mt-1 text-xs"><span className="font-black">Esperado:</span> {answer.expected} · <span className="font-black">Registrado:</span> {answer.given}</div>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Faixas operacionais autorais: por fase, 3–4 acertos = esperado, 2 = observar, 0–1 = alerta; no total, 16+ = esperado, 12–15 = observar, 11 ou menos = alerta. {SUPER_NEUROPAD_NATURE}
          </p>
        </section>
      )}
    </div>
  );
}

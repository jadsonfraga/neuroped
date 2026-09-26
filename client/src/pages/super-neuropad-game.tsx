import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ClipboardList, Copy, Download, Eye, Flag, Music, Music2, Pause, Play, Repeat, RotateCcw, ShieldCheck, Smartphone, Sparkles, Undo2, Volume2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { celebrate } from "@/lib/confetti";
import { formatClinicalDateTime } from "@/lib/clinicalDate";
import { issuerCredentials, useIssuer } from "@/lib/issuer";
import { softTap } from "@/lib/softSounds";
import { play1Up, playCoin, playFlagPole, playJump, playPowerUp } from "@/lib/sounds";
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
  RESPONSE_PATTERN_LABELS,
  STATUS_LABELS,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_SOURCES,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
  bandForYears,
  buildGameBrief,
  buildGameReport,
  formatDuration,
  interpret,
  itemsFor,
  phaseById,
  recordJudged,
  recordTouch,
  shuffle,
  summarize,
  undoLastAnswer,
  type AnswerRecord,
  type AnswerStatus,
  type Character,
  type GameSession,
  type Item,
  type Level,
  type Option,
  type PhaseId,
  type PhaseSummary,
  type ShapeId,
  type TouchItem,
} from "@/features/super-neuropad/model";
import "@/styles/super-neuropad-arcade.css";

const XP_PER_ITEM = 10;
const TOTAL_ITEMS = PHASES.length * ITEMS_PER_PHASE;
const CHEERS = ["+10 XP!", "Anotado, próxima!", "Boa, vamos em frente!", "Mais um passo!", "Moeda coletada!"] as const;
const PREVIEW_SECONDS = 5;
/** Falas do herói: só ânimo, nunca certo/errado. */
const HERO_LINES: Record<string, { intro: string; done: string }> = {
  raposa: { intro: "Olhos abertos, vamos farejar!", done: "Rápida como o vento!" },
  dragao: { intro: "Fogo nas palavras, vamos!", done: "Rugido de vitória!" },
  unicornio: { intro: "Cavalgar até o topo!", done: "Brilho de conquista!" },
  robo: { intro: "Sistemas prontos. Iniciar!", done: "Missão registrada!" },
  fada: { intro: "Asas abertas, lá vamos nós!", done: "Voo perfeito!" },
  panda: { intro: "Com calma a gente chega.", done: "Mais um passo tranquilo!" },
};
const YEARS = Array.from({ length: MAX_AGE_YEARS - MIN_AGE_YEARS + 1 }, (_, index) => MIN_AGE_YEARS + index);

type Screen = "setup" | "intro" | "play" | "phase-done" | "results";

const PHASE_TONE: Record<PhaseId, string> = {
  olhos: "snp-panel--grass",
  palavras: "snp-panel--sky",
  numeros: "snp-panel--lilac",
  memoria: "snp-panel--sun",
  corpo: "snp-panel--berry",
};

const OPTION_TINTS = ["bg-[var(--snp-berry-tint)]", "bg-[var(--snp-sky-tint)]", "bg-[var(--snp-sun-tint)]", "bg-[var(--snp-grass-tint)]"];

const LEVEL_PANEL: Record<Level, string> = { esperado: "snp-panel--grass", observar: "snp-panel--sun", alerta: "snp-panel--berry" };
const LEVEL_ICON: Record<Level, string> = { esperado: "🟢", observar: "🟡", alerta: "🔴" };
const LEVEL_SHORT: Record<Level, string> = { esperado: "Esperado", observar: "Observar", alerta: "Alerta" };

const STATUS_TONE: Record<AnswerStatus, string> = {
  acerto: "bg-emerald-600 text-white",
  erro: "bg-rose-600 text-white",
  sem_resposta: "bg-slate-600 text-white",
};

type Tone = "sun" | "sky" | "grass" | "berry" | "lilac" | "paper" | "slate";

function ArcadeButton({ tone = "sun", className = "", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return (
    <button type="button" className={`snp-btn snp-btn--${tone} inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm ${className}`} {...rest}>
      {children}
    </button>
  );
}

function ShapeArt({ shape }: { shape: ShapeId }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 120 120" className="h-40 w-40 sm:h-52 sm:w-52" role="img" aria-label={`Figura para copiar: ${shape}`}>
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

function XpBar({ answered }: { answered: number }) {
  return (
    <div className="snp-xp w-full" role="progressbar" aria-label="Barra de XP" aria-valuemin={0} aria-valuemax={TOTAL_ITEMS} aria-valuenow={answered}>
      {Array.from({ length: TOTAL_ITEMS }, (_, index) => <i key={index} className={index < answered ? "on" : ""} />)}
    </div>
  );
}

function PhaseMeter({ phase }: { phase: PhaseSummary }) {
  const cells: string[] = phase.answers.map((answer) => (answer.status === "acerto" ? "hit" : answer.status === "erro" ? "err" : "none"));
  while (cells.length < phase.total) cells.push("");
  return (
    <div className="snp-meter" role="img" aria-label={`${phase.phase.name}: ${phase.hits} acertos, ${phase.errors} erros, ${phase.noResponse} sem resposta em ${phase.total}`}>
      {cells.map((cell, index) => <i key={index} className={cell} />)}
    </div>
  );
}

function CharacterCard({ character, selected, onPick }: { character: Character; selected: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => { softTap(); onPick(); }}
      className={`snp-option flex min-h-32 flex-col items-center justify-center gap-1 p-3 text-center ${selected ? "bg-[var(--snp-sun-tint)] ring-4 ring-[var(--snp-sky)]" : "bg-[var(--snp-paper-fixed)] hover:bg-[var(--snp-paper-2-fixed)]"}`}
    >
      <span className={`snp-sprite text-5xl ${selected ? "snp-bounce" : ""}`} aria-hidden="true">{character.emoji}</span>
      <span className="snp-pixel text-xs">{character.name} {character.role}</span>
      <span className="text-[11px] font-bold opacity-80">{character.power}</span>
      {selected && <span className="snp-chip mt-1 bg-[var(--snp-ink-fixed)] text-[var(--snp-sun)]">1P</span>}
    </button>
  );
}

function PhaseTrail({ current, done, character }: { current: number; done: boolean[]; character: Character }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Trilha dos mundos: ${done.filter(Boolean).length} de ${PHASES.length} concluídos`}>
      {PHASES.map((phase, index) => {
        const isDone = done[index];
        const isNow = index === current;
        return (
          <li key={phase.id} className="flex items-center gap-1.5">
            <span
              title={`Mundo ${phase.order} · ${phase.name}`}
              className={`flex items-center justify-center rounded-full border-[3px] border-[var(--snp-ink-fixed)] font-black transition ${isNow ? "snp-bounce h-11 w-11 bg-[var(--snp-sun)] text-2xl" : isDone ? "h-8 w-8 bg-[var(--snp-grass)] text-sm" : "h-8 w-8 bg-[var(--snp-slate-fixed)] text-xs"}`}
            >
              <span aria-hidden="true" className="text-[var(--snp-ink-fixed)]">{isNow ? character.emoji : isDone ? "★" : phase.order}</span>
              <span className="sr-only">Mundo {phase.order}, {phase.name}: {isDone ? "concluído" : isNow ? "atual" : "a caminho"}</span>
            </span>
            {index < PHASES.length - 1 && <span aria-hidden="true" className={`h-1.5 w-3 rounded-full sm:w-5 ${isDone ? "bg-[var(--snp-grass)]" : "bg-[var(--snp-ink-30)]"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

function Hud({ character, answered, phaseIndex, done, musicOn, paused, canUndo, canFinish, onToggleMusic, onUndo, onPause, onFinish, onRestart }: {
  character: Character; answered: number; phaseIndex: number; done: boolean[]; musicOn: boolean; paused: boolean; canUndo: boolean; canFinish: boolean;
  onToggleMusic: () => void; onUndo: () => void; onPause: () => void; onFinish: () => void; onRestart: () => void;
}) {
  return (
    <div className="snp-panel space-y-2 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="snp-sprite flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun-tint)] text-3xl" aria-hidden="true">{character.emoji}</span>
          <div>
            <div className="snp-pixel text-xs">{character.name} {character.role}</div>
            <div className="text-[11px] font-bold opacity-80">Mundo {phaseIndex + 1} · <span aria-live="polite">{answered * XP_PER_ITEM} XP</span> · 🪙 {answered}</div>
          </div>
        </div>
        <PhaseTrail current={phaseIndex} done={done} character={character} />
        <div className="flex flex-wrap items-center gap-1.5">
          <ArcadeButton tone={musicOn ? "sky" : "paper"} className="px-3 py-1.5 text-xs" aria-pressed={musicOn} onClick={onToggleMusic} aria-label={musicOn ? "Música ligada" : "Música desligada"}>
            {musicOn ? <Music2 className="h-4 w-4" /> : <Music className="h-4 w-4" />} Música
          </ArcadeButton>
          <ArcadeButton tone="paper" className="px-3 py-1.5 text-xs" onClick={onPause} aria-pressed={paused}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {paused ? "Continuar" : "Pausa"}
          </ArcadeButton>
          <ArcadeButton tone="slate" className="px-3 py-1.5 text-xs" onClick={onUndo} disabled={!canUndo} title="Volta um desafio e apaga o último registro">
            <Undo2 className="h-4 w-4" /> Desfazer último
          </ArcadeButton>
          {canFinish && (
            <ArcadeButton tone="slate" className="px-3 py-1.5 text-xs" onClick={onFinish} title="Encerra agora e mostra o resultado parcial">
              <Flag className="h-4 w-4" /> Encerrar
            </ArcadeButton>
          )}
          <ArcadeButton tone="paper" className="px-3 py-1.5 text-xs" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </ArcadeButton>
        </div>
      </div>
      <XpBar answered={answered} />
      <BadgeShelf done={done} />
    </div>
  );
}

function RepeatToggle({ repeated, onToggle }: { repeated: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={repeated}
      onClick={() => { softTap(); onToggle(); }}
      className={`snp-chip ${repeated ? "bg-[var(--snp-sun)]" : ""}`}
      title="Marque se precisou repetir o comando (permitido uma vez). Fica no registro."
    >
      <Repeat className="h-3.5 w-3.5" /> {repeated ? "Comando repetido 1x" : "Repeti o comando"}
    </button>
  );
}

function TurnCue({ who }: { who: "crianca" | "aplicadora" }) {
  const child = who === "crianca";
  return (
    <span className={`snp-chip ${child ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-sun-tint)]"}`}>
      <Smartphone className="h-3.5 w-3.5" /> {child ? "Tela para a criança" : "Tela para você"}
    </span>
  );
}

function SpeechBubble({ character, text }: { character: Character; text: string }) {
  return (
    <div className="mx-auto flex max-w-md items-end justify-center gap-2">
      <span className="snp-sprite snp-bounce text-5xl" aria-hidden="true">{character.emoji}</span>
      <p className="relative rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] px-4 py-2 text-sm font-black text-[var(--snp-ink-fixed)] shadow-[3px_3px_0_var(--snp-ink-fixed)]">
        <span className="sr-only">{character.name} diz: </span>{text}
        <span aria-hidden="true" className="absolute -left-2 bottom-3 h-4 w-4 rotate-45 border-b-[3px] border-l-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)]" />
      </p>
    </div>
  );
}

function BadgeShelf({ done }: { done: boolean[] }) {
  const earned = PHASES.filter((_, index) => done[index]);
  if (earned.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Conquistas: ${earned.length} de ${PHASES.length}`}>
      {earned.map((phase) => <li key={phase.id} className="snp-chip bg-[var(--snp-sun-tint)]" title={phase.badge}>🏅 {phase.badge}</li>)}
    </ul>
  );
}

function SetupSteps({ hasAge, hasHero, kitDone, kitTotal }: { hasAge: boolean; hasHero: boolean; kitDone: number; kitTotal: number }) {
  const steps = [
    { label: "Idade", ok: hasAge },
    { label: "Herói", ok: hasHero },
    { label: kitTotal > 0 ? `Inventário ${kitDone}/${kitTotal}` : "Inventário", ok: kitTotal > 0 && kitDone === kitTotal, optional: true },
  ];
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Passos da preparação">
      {steps.map((step, index) => (
        <li key={step.label} className={`snp-chip ${step.ok ? "bg-[var(--snp-grass-tint)]" : step.optional ? "opacity-70" : "bg-[var(--snp-sun-tint)]"}`}>
          {step.ok ? <Check className="h-3.5 w-3.5" /> : <span aria-hidden="true">{index + 1}</span>} {step.label}{step.optional && !step.ok ? " (opcional)" : ""}
          <span className="sr-only">{step.ok ? ", concluído" : step.optional ? ", opcional" : ", pendente"}</span>
        </li>
      ))}
    </ol>
  );
}

function TouchStage({ item, seed, paused, onAnswer }: { item: TouchItem; seed: number; paused: boolean; onAnswer: (chosen: Option | null) => void }) {
  const [revealed, setRevealed] = useState(!item.preview);
  const [left, setLeft] = useState(PREVIEW_SECONDS);
  const options = useMemo(() => shuffle(item.options, seed), [item, seed]);
  useEffect(() => {
    if (paused || revealed || !item.preview) return;
    // Exposição padronizada: esconde sozinho ao fim da contagem; a aplicadora pode esconder antes.
    const timer = window.setInterval(() => setLeft((current) => current - 1), 1000);
    return () => window.clearInterval(timer);
  }, [paused, revealed, item.preview]);
  useEffect(() => { if (left <= 0) setRevealed(true); }, [left]);
  if (!revealed && item.preview) {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <p className="snp-pixel text-center text-sm opacity-80">Olhe bem para as figuras…</p>
        <div className="snp-float text-7xl sm:text-8xl" aria-label={`Figuras mostradas: ${item.preview}`}>{item.preview}</div>
        <div className="snp-pixel flex h-14 w-14 items-center justify-center rounded-full border-[4px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun)] text-2xl text-[var(--snp-ink-fixed)]" role="timer" aria-label={`Esconde em ${left} segundos`}>{left}</div>
        <ArcadeButton tone="sky" className="px-6 py-3 text-base" onClick={() => { softTap(); setRevealed(true); }}>
          <Check className="h-5 w-5" /> Já olhou · esconder
        </ArcadeButton>
        <p className="text-xs font-bold opacity-70">Aplicadora: as figuras somem sozinhas em {PREVIEW_SECONDS} segundos; pode esconder antes.</p>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="snp-chip"><Volume2 className="h-3.5 w-3.5" /> Leia em voz alta</span>
        <TurnCue who="crianca" />
      </div>
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.prompt}</p>
      <div className={`grid gap-4 ${options.length <= 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`} role="group" aria-label="Opções">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            onClick={() => onAnswer(option)}
            className={`snp-option flex min-h-32 items-center justify-center p-3 text-center font-black ${OPTION_TINTS[index % OPTION_TINTS.length]} ${item.big ? (option.size === "lg" ? "text-8xl" : option.size === "sm" ? "text-4xl" : "text-6xl") : "text-xl sm:text-2xl"}`}
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
      <div className="snp-panel flex min-h-40 items-center justify-center p-6">
        <StimulusView item={item} />
      </div>
      <div className="snp-panel snp-panel--soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="snp-pixel text-[11px] opacity-80">Aplicadora · {KIND_LABELS[item.kind]}</div>
          <TurnCue who="aplicadora" />
        </div>
        <p className="mt-1 text-lg font-black leading-snug">{item.prompt}</p>
        <p className="mt-2 text-sm"><span className="font-black">Conta como acerto:</span> {item.expected}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ArcadeButton tone="grass" className="min-h-14 text-base" onClick={() => onJudge("acerto")}>
            <Check className="h-5 w-5" /> Acertou
          </ArcadeButton>
          <ArcadeButton tone="berry" className="min-h-14 text-base" onClick={() => onJudge("erro")}>
            <X className="h-5 w-5" /> Errou
          </ArcadeButton>
          <ArcadeButton tone="slate" className="min-h-14 text-base" onClick={() => onJudge("sem_resposta")}>
            Não respondeu
          </ArcadeButton>
        </div>
      </div>
    </div>
  );
}

function Clouds() {
  return (
    <>
      <span aria-hidden="true" className="snp-cloud left-[8%] top-4 h-6 w-20" />
      <span aria-hidden="true" className="snp-cloud left-[46%] top-10 h-5 w-14" />
      <span aria-hidden="true" className="snp-cloud right-[10%] top-5 h-7 w-24" />
    </>
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
  const [paused, setPaused] = useState(false);
  const [repeated, setRepeated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const startedAt = useRef<string>("");
  const finishedAt = useRef<string | null>(null);
  const itemStart = useRef<number>(0);
  const activeItemMs = useRef(0);
  const cheerTimer = useRef<number | null>(null);
  const music = useRef<Chiptune | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pauseCount = useRef(0);
  const undoCount = useRef(0);

  const band = ageYears === null ? undefined : bandForYears(ageYears);
  const phaseId = PHASE_ORDER[phaseIndex];
  const phase = phaseById(phaseId);
  const items = band ? itemsFor(band.id, phaseId) : [];
  const item = items[itemIndex];
  const done = PHASE_ORDER.map((id) => band ? answers.filter((answer) => answer.phaseId === id).length >= itemsFor(band.id, id).length : false);
  const dirty = answers.length > 0;
  const ready = Boolean(band && character);

  const session: GameSession | null = ageYears !== null && band && character ? {
    version: SUPER_NEUROPAD_VERSION,
    ageYears,
    bandId: band.id,
    characterId: character.id,
    startedAt: startedAt.current,
    finishedAt: finishedAt.current,
    answers,
    pauseCount: pauseCount.current,
    undoCount: undoCount.current,
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
    if (screen === "play") { itemStart.current = performance.now(); activeItemMs.current = 0; }
    setRepeated(false);
    // Cada tela nova começa no topo: o desafio precisa aparecer inteiro no tablet sem rolar.
    if (screen !== "setup") rootRef.current?.scrollIntoView({ block: "start" });
  }, [screen, phaseIndex, itemIndex]);

  const toggleMusic = useCallback(() => {
    softTap();
    const next = !musicOn;
    setMusicOn(next);
    if (next) getMusic().start(); else music.current?.stop();
  }, [getMusic, musicOn]);

  function startGame() {
    if (!ready) return;
    softTap();
    startedAt.current = new Date().toISOString();
    finishedAt.current = null;
    setAnswers([]);
    setPhaseIndex(0);
    setItemIndex(0);
    setPaused(false);
    pauseCount.current = 0;
    undoCount.current = 0;
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
    setPaused(false);
    finishedAt.current = null;
    setScreen("setup");
  }

  function showCheer(text: string) {
    setCheer(text);
    if (cheerTimer.current) window.clearTimeout(cheerTimer.current);
    cheerTimer.current = window.setTimeout(() => setCheer(null), 900);
  }

  function finishGame() {
    finishedAt.current = new Date().toISOString();
    playFlagPole();
    celebrate();
    music.current?.stop();
    setPaused(false);
    setScreen("results");
  }

  function pushAnswer(record: AnswerRecord) {
    if (paused) return;
    playCoin();
    const next = [...answers, record];
    setAnswers(next);
    showCheer(CHEERS[next.length % CHEERS.length]);
    if (itemIndex + 1 < items.length) {
      setItemIndex(itemIndex + 1);
      return;
    }
    if (phaseIndex + 1 < PHASE_ORDER.length) {
      playPowerUp();
      setScreen("phase-done");
      return;
    }
    finishGame();
  }

  function undo() {
    const previous = undoLastAnswer(answers);
    if (!previous) return;
    softTap();
    undoCount.current += 1;
    setAnswers(previous.answers);
    setPhaseIndex(PHASE_ORDER.indexOf(previous.phaseId));
    setItemIndex(previous.itemIndex);
    setPaused(false);
    setScreen("play");
    showCheer("Desfeito. Refaça o desafio.");
  }

  function togglePause() {
    softTap();
    if (paused) itemStart.current = performance.now();
    else {
      activeItemMs.current += performance.now() - itemStart.current;
      pauseCount.current += 1;
    }
    setPaused(!paused);
  }

  function finishEarly() {
    if (!window.confirm(`Encerrar agora? ${answers.length} de ${TOTAL_ITEMS} desafios registrados. O resultado sai como partida incompleta.`)) return;
    finishGame();
  }

  function elapsedSeconds(): number {
    return (activeItemMs.current + performance.now() - itemStart.current) / 1000;
  }

  function nextPhase() {
    playJump();
    setPhaseIndex(phaseIndex + 1);
    setItemIndex(0);
    setScreen("intro");
  }

  function enterPhase() {
    play1Up();
    setScreen("play");
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
      toast({ title: "PDF detalhado gerado", description: "Resultado objetivo, leitura para a consulta e cada item com resposta esperada, registrada e tempo." });
    } catch (error) {
      toast({ title: "Falha ao gerar PDF", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function copyText(text: string, filename: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title, description: "Texto na área de transferência." });
    } catch {
      downloadTextDocument(text, `${safeTextFilename(filename)}.txt`);
      toast({ title: "Baixado em TXT", description: "A área de transferência não estava disponível." });
    }
  }

  const summary = session ? summarize(session) : null;
  const reading = session && screen === "results" ? interpret(session) : null;
  // Fora da preparação o cabeçalho encolhe: o desafio precisa caber na tela virada para a criança.
  const compact = screen !== "setup";

  return (
    <div ref={rootRef} className="snp scroll-mt-4 space-y-5 pb-8" data-testid="super-neuropad-game" data-screen={screen}>
      <header className={`snp-panel snp-scanlines snp-sky-bg relative overflow-hidden ${compact ? "px-4 py-3" : "p-5 sm:p-6"}`}>
        {!compact && <Clouds />}
        <div className="relative flex items-center gap-3">
          <div className={`snp-sprite flex shrink-0 items-center justify-center rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun)] ${compact ? "h-10 w-10 text-xl" : "h-14 w-14 text-3xl"}`} aria-hidden="true">🎮</div>
          <div className="min-w-0 flex-1 text-[var(--snp-stage-text)]">
            {!compact && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="snp-chip">pré-consulta · secretária · {MIN_AGE_YEARS}–{MAX_AGE_YEARS} anos</span>
                <span className="snp-chip">v{SUPER_NEUROPAD_VERSION}</span>
                <span className="snp-chip">5 mundos · {ITEMS_PER_PHASE} desafios cada</span>
                <span className="snp-chip">sem câmera</span>
              </div>
            )}
            <h1 className={`snp-pixel snp-title text-[var(--snp-paper-fixed)] ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{SUPER_NEUROPAD_TITLE}</h1>
            {!compact && (
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed">
                Cinco mundos que reúnem Sonda 10, OBS-10, Reconhecimento Visual e Testes Cognitivos por Faixa Etária. Cada desafio tem certo e errado; a criança só vê XP, moedas e conquistas. Ao final, resultado objetivo, leitura para a consulta e PDF detalhado. Triagem autoral de déficits grosseiros; a conclusão é do médico.
              </p>
            )}
          </div>
        </div>
      </header>

      {screen === "setup" && (
        <section className="space-y-5">
          <div className="snp-panel snp-panel--soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <SetupSteps hasAge={Boolean(band)} hasHero={Boolean(character)} kitDone={band ? band.kit.filter((entry) => kitChecked[entry]).length : 0} kitTotal={band?.kit.length ?? 0} />
            <span className="text-xs font-bold opacity-70">Três toques e começa: idade, herói e, se der, o inventário.</span>
          </div>
          <div className="snp-panel p-5">
            <h2 className="snp-pixel text-base">1 · Idade da criança (anos)</h2>
            <p className="text-xs font-bold opacity-70">Somente anos completos. A faixa define os desafios.</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8" role="group" aria-label="Idade em anos">
              {YEARS.map((year) => (
                <button key={year} type="button" aria-pressed={ageYears === year} onClick={() => { softTap(); setAgeYears(year); setKitChecked({}); }}
                  className={`snp-option min-h-12 text-lg font-black ${ageYears === year ? "bg-[var(--snp-sun)]" : "bg-[var(--snp-paper-fixed)] hover:bg-[var(--snp-paper-2-fixed)]"}`}>
                  {year}
                </button>
              ))}
            </div>
            {band && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xl" aria-hidden="true">{band.icon}</span>
                <span className="snp-pixel text-xs">Faixa {band.label}</span>
                <span className="font-bold opacity-70">· {TOTAL_ITEMS} desafios · cerca de 10 minutos</span>
              </div>
            )}
          </div>

          <div className="snp-panel p-5">
            <h2 className="snp-pixel text-base">2 · Escolha o herói</h2>
            <p className="text-xs font-bold opacity-70">Deixe a criança escolher. Nenhum herói muda os desafios.</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label="Personagens">
              {CHARACTERS.map((entry) => <CharacterCard key={entry.id} character={entry} selected={character?.id === entry.id} onPick={() => setCharacter(entry)} />)}
            </div>
          </div>

          {band && (
            <div className="snp-panel p-5">
              <h2 className="snp-pixel text-base">3 · Inventário da Torre do Corpo</h2>
              <p className="text-xs font-bold opacity-70">Separe antes de começar. Checklist só em memória.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {band.kit.map((entry) => {
                  const checked = Boolean(kitChecked[entry]);
                  return (
                    <button key={entry} type="button" aria-pressed={checked} onClick={() => { softTap(); setKitChecked((current) => ({ ...current, [entry]: !checked })); }}
                      className={`snp-option flex min-h-11 items-center gap-3 px-3 py-2 text-left text-sm font-bold ${checked ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-paper-fixed)] hover:bg-[var(--snp-paper-2-fixed)]"}`}>
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--snp-ink-fixed)] ${checked ? "bg-[var(--snp-grass-deep)] text-white" : "bg-white"}`}>{checked ? <Check className="h-4 w-4" /> : ""}</span>
                      {entry}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={`snp-panel ${ready ? "snp-panel--sun" : "snp-panel--soft"} flex flex-wrap items-center gap-3 p-5`}>
            <ArcadeButton tone={ready ? "grass" : "slate"} className="px-6 py-3 text-base" disabled={!ready} onClick={startGame}>
              <Sparkles className="h-5 w-5" /> Começar a aventura
            </ArcadeButton>
            <ArcadeButton tone={musicOn ? "sky" : "paper"} aria-pressed={musicOn} onClick={() => { softTap(); setMusicOn((current) => !current); }}>
              {musicOn ? <Music2 className="h-5 w-5" /> : <Music className="h-5 w-5" />} Música {musicOn ? "ligada" : "desligada"}
            </ArcadeButton>
            <p className={`snp-pixel text-xs ${ready ? "snp-blink" : "opacity-70"}`}>{!band ? "Escolha a idade." : !character ? "Escolha o herói." : "▶ Press start · vire o tablet para a criança"}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="snp-panel snp-panel--soft p-4 text-xs leading-relaxed">
              <div className="snp-pixel flex items-center gap-2 text-[11px]"><ShieldCheck className="h-4 w-4" /> Regras de ouro da aplicadora</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 font-semibold opacity-90">
                <li>Leia cada comando uma vez; pode repetir uma única vez e marque “Repeti o comando”.</li>
                <li>Itens de fala e de ação: marque acerto só quando o critério da tela for cumprido inteiro.</li>
                <li>Criança cansada ou recusando: marque “Não respondeu” e siga. Nunca force. Use “Pausa” para lanche ou banheiro.</li>
                <li>Tocou errado? “Desfazer último” volta um desafio. Precisa parar? “Encerrar” gera o resultado parcial.</li>
                <li>Nada é salvo no navegador. Gere o PDF ao final antes de sair da página.</li>
              </ul>
            </div>
            <div className="snp-panel snp-panel--soft p-4 text-xs leading-relaxed">
              <div className="snp-pixel text-[11px]">Proveniência</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 font-semibold opacity-90">
                {SUPER_NEUROPAD_SOURCES.map((source) => <li key={source}>{source}</li>)}
              </ul>
              <p className="mt-2 font-semibold opacity-80">{SUPER_NEUROPAD_NATURE}</p>
            </div>
          </div>
        </section>
      )}

      {screen !== "setup" && screen !== "results" && character && (
        <Hud
          character={character}
          answered={answers.length}
          phaseIndex={phaseIndex}
          done={done}
          musicOn={musicOn}
          paused={paused}
          canUndo={answers.length > 0 && screen !== "intro"}
          canFinish={answers.length > 0}
          onToggleMusic={toggleMusic}
          onUndo={undo}
          onPause={togglePause}
          onFinish={finishEarly}
          onRestart={restart}
        />
      )}

      {screen === "intro" && character && (
        <section className={`snp-panel snp-scanlines ${PHASE_TONE[phaseId]} p-6 text-center`}>
          <div className="snp-float text-7xl" aria-hidden="true">{phase.emoji}</div>
          <div className="snp-pixel mt-2 text-xs opacity-80">Fase {phase.order} de {PHASES.length}</div>
          <h2 className="snp-pixel text-2xl sm:text-3xl">{phase.name}</h2>
          <p className="mt-1 text-base font-bold opacity-90">{phase.tagline}</p>
          <div className="mt-4"><SpeechBubble character={character} text={HERO_LINES[character.id]?.intro ?? "Vamos lá!"} /></div>
          <div className="snp-panel mx-auto mt-5 max-w-2xl p-4 text-left text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="snp-pixel text-[11px] opacity-80">Aplicadora · {phase.domain}</div>
              <TurnCue who="aplicadora" />
            </div>
            <p className="mt-1 font-semibold leading-relaxed">{phase.operator}</p>
            <p className="mt-2 text-xs font-bold opacity-70"><Eye className="mr-1 inline h-3.5 w-3.5" /> Leia, depois toque em entrar e vire o tablet para a criança.</p>
          </div>
          <ArcadeButton tone="sun" className="mt-5 px-6 py-3 text-base" onClick={enterPhase}>
            <span aria-hidden="true">{character.emoji}</span> Entrar na fase
          </ArcadeButton>
        </section>
      )}

      {screen === "play" && item && (
        <section className={`snp-panel ${PHASE_TONE[phaseId]} relative p-4 sm:p-6`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="snp-pixel">{phase.emoji} {phase.name}</span>
            <span className="snp-hearts" aria-hidden="true">{items.map((_, index) => <span key={index}>{index < itemIndex ? "💛" : index === itemIndex ? "❤️" : "🤍"}</span>)}</span>
            <span className="snp-pixel" aria-live="polite">Desafio {itemIndex + 1} de {items.length}</span>
          </div>
          {paused && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="snp-pixel snp-blink text-4xl">Pausa</div>
              <p className="max-w-md text-sm font-bold opacity-80">O tempo do desafio parou. Lanche, banheiro ou respiro. Toque em continuar quando a criança estiver pronta.</p>
              <ArcadeButton tone="grass" className="px-6 py-3 text-base" onClick={togglePause}><Play className="h-5 w-5" /> Continuar</ArcadeButton>
            </div>
          )}
            <div hidden={paused} className="rounded-2xl bg-[var(--snp-stage)] p-3 text-[var(--snp-stage-text)] sm:p-4">
              {item.kind === "toque" ? (
                <div className="space-y-4">
                  <TouchStage key={item.id} item={item} paused={paused} seed={seed + itemIndex * 17 + phaseIndex * 101} onAnswer={(chosen) => pushAnswer(recordTouch(item, phaseId, chosen, elapsedSeconds(), repeated))} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repeated} onToggle={() => setRepeated((current) => !current)} />
                    <button type="button" className="snp-chip opacity-80 hover:opacity-100" onClick={() => pushAnswer(recordTouch(item, phaseId, null, elapsedSeconds(), repeated))}>
                      Aplicadora: não respondeu · pular
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <JudgeStage key={item.id} item={item} onJudge={(status) => pushAnswer(recordJudged(item, phaseId, status, elapsedSeconds(), repeated))} />
                  <RepeatToggle repeated={repeated} onToggle={() => setRepeated((current) => !current)} />
                </div>
              )}
            </div>
          {cheer && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center" aria-live="polite">
              <span className="snp-pop snp-pixel rounded-full border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun)] px-4 py-1.5 text-xs text-[var(--snp-ink-fixed)] shadow-[3px_3px_0_var(--snp-ink-fixed)]">⭐ {cheer}</span>
            </div>
          )}
        </section>
      )}

      {screen === "phase-done" && character && (
        <section className={`snp-panel snp-scanlines ${PHASE_TONE[phaseId]} p-6 text-center`}>
          <div className="snp-bounce text-7xl" aria-hidden="true">🏅</div>
          <div className="snp-pixel mt-2 text-xs opacity-80">Mundo {phase.order} completo</div>
          <h2 className="snp-pixel text-2xl sm:text-3xl">Conquista: {phase.badge}!</h2>
          <p className="mt-1 text-base font-bold opacity-90">{character.name} {character.role} subiu para o nível {phaseIndex + 2}.</p>
          <div className="mt-4"><SpeechBubble character={character} text={HERO_LINES[character.id]?.done ?? "Conquista no bolso!"} /></div>
          <ArcadeButton tone="sun" className="mt-5 px-6 py-3 text-base" onClick={nextPhase}>
            Próxima fase: {phaseById(PHASE_ORDER[phaseIndex + 1]).emoji} {phaseById(PHASE_ORDER[phaseIndex + 1]).name}
          </ArcadeButton>
        </section>
      )}

      {screen === "results" && summary && session && (
        <section className="space-y-4">
          <div className="snp-panel snp-scanlines snp-panel--sun p-6 text-center">
            <div className="snp-bounce text-6xl" aria-hidden="true">{summary.complete ? "🏆" : "🚩"}</div>
            <h2 className="snp-pixel mt-2 text-2xl sm:text-3xl">{summary.complete ? "Aventura concluída!" : "Aventura encerrada antes do fim"}</h2>
            <p className="text-base font-bold">{summary.character.emoji} {summary.character.name} {summary.character.role} · {answers.length * XP_PER_ITEM} XP · {done.filter(Boolean).length} conquistas</p>
            <div className="mt-3 flex justify-center"><BadgeShelf done={done} /></div>
            <p className="mt-3 text-xs font-black opacity-80">Aplicadora: vire a tela para você. O que vem abaixo é o registro objetivo.</p>
          </div>

          {summary.level === null ? (
            <div className="snp-panel p-5" data-testid="super-neuropad-incomplete">
              <p className="font-black">Partida incompleta: {session.answers.length} de {summary.total} itens registrados.</p>
              <p>Sem classificação ou interpretação. As respostas registradas continuam disponíveis para copiar ou baixar.</p>
            </div>
          ) : (<div className={`snp-panel ${LEVEL_PANEL[summary.level]} p-5`}>
            <div className="snp-pixel text-[11px] opacity-80">Resultado objetivo · {summary.band.label} · {summary.complete ? "partida completa" : `partida incompleta (${session.answers.length} de ${summary.total} itens)`}</div>
            <div className="mt-1 text-3xl font-black">{LEVEL_ICON[summary.level]} {summary.hits} de {summary.total} acertos</div>
            <div className="text-base font-black">{LEVEL_LABELS[summary.level]}</div>
            <div className="mt-1 text-xs font-semibold opacity-80">Tempo somado nas tarefas: {formatDuration(summary.durationSeconds)} · contagem autoral, não normativa; leitura é do médico.</div>
          </div>)}

          {reading && (<div className="snp-panel p-5" data-testid="super-neuropad-reading">
            <div className="snp-pixel flex items-center gap-2 text-xs"><ClipboardList className="h-4 w-4" /> Leitura para a consulta</div>
            <p className="mt-1 text-xs font-semibold opacity-70">Descritiva e autoral. Comparações internas à partida; nenhuma norma, percentil, idade equivalente ou diagnóstico.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Prioridade</div>
                <div className="mt-1 text-sm font-black">{reading.priorities.length === 0 ? "Nenhuma fase fora do esperado" : reading.priorities.map((entry) => `${entry.phase.emoji} ${entry.phase.name} ${entry.hits}/${entry.total}`).join(" · ")}</div>
              </div>
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Padrão de resposta</div>
                <div className="mt-1 text-sm font-black">{RESPONSE_PATTERN_LABELS[reading.pattern]}</div>
                <div className="text-[11px] font-semibold opacity-70">{reading.errors} erros · {reading.noResponse} sem resposta</div>
              </div>
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Toque × aplicadora</div>
                <div className="mt-1 text-sm font-black">Toque {reading.touch.hits}/{reading.touch.total} · Fala e ação {reading.judged.hits}/{reading.judged.total}</div>
                <div className="text-[11px] font-semibold opacity-70">{reading.repeated} comando(s) repetido(s)</div>
              </div>
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Ritmo</div>
                <div className="mt-1 text-sm font-black">Mediana {reading.medianSeconds} s por item</div>
                <div className="text-[11px] font-semibold opacity-70">{reading.slow.length} item(ns) bem acima do próprio ritmo</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Sinais de confiabilidade do registro">
              <span className={`snp-chip ${reading.fastMisses.length >= 2 ? "bg-[var(--snp-sun-tint)]" : ""}`}>⚡ {reading.fastMisses.length} toque(s) errado(s) em menos de 1 s</span>
              <span className={`snp-chip ${reading.halves.drop ? "bg-[var(--snp-sun-tint)]" : ""}`}>🔋 {reading.halves.drop ? "queda na segunda metade" : "sem queda no fim"}</span>
              <span className={`snp-chip ${reading.pace.slowdown ? "bg-[var(--snp-sun-tint)]" : ""}`}>⏱ {reading.pace.slowdown ? "ritmo desacelerou" : "ritmo estável"}</span>
              <span className="snp-chip">⏸ {session.pauseCount ?? 0} pausa(s) · ↩ {session.undoCount ?? 0} desfeito(s)</span>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-semibold leading-relaxed">
              {reading.notes.filter((note) => !note.startsWith("Roteiro para") && !note.startsWith("Aprofundar")).map((note) => <li key={note}>{note}</li>)}
            </ul>
            {reading.plan.length > 0 && (
              <div className="mt-4 snp-panel snp-panel--soft p-4" data-testid="super-neuropad-plan">
                <div className="snp-pixel text-[11px]">Roteiro sugerido para a consulta</div>
                <ol className="mt-2 space-y-2 text-sm font-semibold leading-relaxed">
                  {reading.plan.map((entry) => (
                    <li key={entry.phase.id} className="flex gap-2">
                      <span aria-hidden="true">{entry.phase.emoji}</span>
                      <span><span className="font-black">{entry.phase.name}:</span> {entry.text}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black">Aprofundar agora:</span>
                  {reading.routes.map((route) => (
                    <a key={route.href} href={`#${route.href}`} target="_blank" rel="noopener noreferrer" className="snp-chip bg-[var(--snp-sky-tint)] hover:bg-[var(--snp-sky)]">
                      {route.label} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>)}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {summary.phases.map((entry) => (
              <div key={entry.phase.id} className={`snp-panel ${entry.level !== null ? LEVEL_PANEL[entry.level] : "snp-panel--soft"} p-4`}>
                <div className="text-2xl" aria-hidden="true">{entry.phase.emoji}</div>
                <div className="snp-pixel text-[11px]">{entry.phase.name}</div>
                <div className="text-[11px] font-semibold opacity-80">{entry.phase.domain}</div>
                <div className="mt-2 text-2xl font-black">{entry.level !== null ? `${entry.hits}/${entry.total}` : `${entry.answers.length} registros`}</div>
                <div className="mt-1"><PhaseMeter phase={entry} /></div>
                <div className="mt-1 text-xs font-black">{entry.level !== null ? `${LEVEL_ICON[entry.level]} ${LEVEL_SHORT[entry.level]}` : entry.applied ? "Registro parcial" : "Não aplicada"}</div>
                <div className="mt-1 text-[11px] font-semibold opacity-80">{entry.applied ? `${entry.errors} erros · ${entry.noResponse} sem resposta · ${formatDuration(entry.seconds)}` : "nenhum item registrado"}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <ArcadeButton tone="grass" className="px-5 py-3 text-base" disabled={exporting} onClick={() => { softTap(); void exportPdf(); }}>
              <Download className="h-5 w-5" /> {exporting ? "Gerando PDF…" : "Baixar PDF detalhado"}
            </ArcadeButton>
            <ArcadeButton tone="sky" onClick={() => { softTap(); void copyText(buildGameBrief(session), `super-neuropad-resumo-${session.bandId}`, "Resumo copiado"); }}>
              <ClipboardList className="h-5 w-5" /> Copiar resumo para o prontuário
            </ArcadeButton>
            <ArcadeButton tone="paper" onClick={() => { softTap(); void copyText(buildGameReport(session), `super-neuropad-game-${session.bandId}`, "Registro completo copiado"); }}>
              <Copy className="h-5 w-5" /> Copiar registro completo
            </ArcadeButton>
            <ArcadeButton tone="slate" onClick={restart}>
              <RotateCcw className="h-5 w-5" /> Nova partida
            </ArcadeButton>
          </div>

          {reading && reading.missed.length > 0 && (
            <div className="snp-panel p-5">
              <div className="snp-pixel text-xs">Itens para checar na consulta · {reading.missed.length}</div>
              <ul className="mt-3 space-y-2">
                {reading.missed.map((answer) => (
                  <li key={answer.itemId} className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-sm text-[var(--snp-ink-fixed)]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-bold">{phaseById(answer.phaseId).emoji} {answer.prompt}</div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                    </div>
                    <div className="mt-1 text-xs"><span className="font-black">Esperado:</span> {answer.expected} · <span className="font-black">Registrado:</span> {answer.given} · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {summary.phases.map((entry) => (
              <details key={entry.phase.id} className="snp-panel p-4" open={entry.level !== "esperado" || !entry.applied}>
                <summary className="snp-pixel cursor-pointer text-xs">{entry.phase.emoji} Fase {entry.phase.order} · {entry.phase.name} · {entry.level !== null ? `${entry.hits}/${entry.total}` : `${entry.answers.length} itens registrados`}</summary>
                <ol className="mt-3 space-y-2">
                  {entry.answers.map((answer, index) => (
                    <li key={answer.itemId} className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-paper-fixed)] p-3 text-sm text-[var(--snp-ink-fixed)]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-bold">{index + 1}. {answer.prompt}</div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                      </div>
                      <div className="mt-1 text-xs opacity-80">{KIND_LABELS[answer.kind]} · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""}</div>
                      <div className="mt-1 text-xs"><span className="font-black">Esperado:</span> {answer.expected} · <span className="font-black">Registrado:</span> {answer.given}</div>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>

          {summary.complete && (<p className="text-xs font-semibold leading-relaxed opacity-80">
            Faixas operacionais autorais: por fase, 3–4 acertos = esperado, 2 = observar, 0–1 = alerta; no total, 16+ = esperado, 12–15 = observar, 11 ou menos = alerta. Item lento = 2 vezes a mediana da própria partida (mínimo 12 s). {SUPER_NEUROPAD_NATURE}
          </p>)}
        </section>
      )}
    </div>
  );
}

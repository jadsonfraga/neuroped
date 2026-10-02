import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Ban, Check, ClipboardList, Copy, Delete, Download, Eraser, Eye, Flag, Hand, Music, Music2, Pause, Play, Repeat, RotateCcw, ShieldCheck, SkipForward, Smartphone, Sparkles, Undo2, Volume2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSondaExitGuard } from "@/hooks/useSondaExitGuard";
import { acceptManualTap } from "@/components/jogo-facil/easyReport";
import { celebrate } from "@/lib/confetti";
import { formatClinicalDateTime, localIsoDate } from "@/lib/clinicalDate";
import { issuerCredentials, useIssuer } from "@/lib/issuer";
import { softTap } from "@/lib/softSounds";
import { play1Up, playCoin, playFlagPole, playJump, playPowerUp } from "@/lib/sounds";
import { downloadTextDocument, safeTextFilename } from "@/lib/shareText";
import { createChiptune, type Chiptune } from "@/features/super-neuropad/music";
import { buildGameDocSpec, issuerLines } from "@/features/super-neuropad/pdf";
import {
  buildFamilyDocSpec,
  buildFamilySummary,
  isValidFamilyEmail,
  type FamilyContact,
} from "@/features/super-neuropad/familyDelivery";
import { formatPhoneNumber, isValidPhone } from "@/lib/phoneBr";
import { openEmailDraft, shareWhatsAppDocument } from "@/lib/shareText";
import { Stimulus as VrStimulus } from "@/features/visual-recognition/Stimulus";
import {
  CHARACTERS,
  GESTURE_SHORTCUT,
  KIND_LABELS,
  LEVEL_LABELS,
  MAX_AGE_YEARS,
  MIN_AGE_YEARS,
  OBSERVATION_CHIPS,
  OBSERVATIONS_MAX,
  ORIGIN_LABELS,
  PHASE_ORDER,
  PHASES,
  RESPONSE_PATTERN_LABELS,
  SKIP_REASONS,
  STATUS_LABELS,
  ANSWER_TONE,
  SUPER_NEUROPAD_NATURE,
  SUPER_NEUROPAD_SOURCES,
  SUPER_NEUROPAD_TITLE,
  SUPER_NEUROPAD_VERSION,
  UNDER_TWO_MESSAGE,
  YEARS,
  ageGate,
  bandItemCount,
  bandForYears,
  buildGameBrief,
  buildGameReport,
  buildPatientRecordItems,
  cutText,
  estimateBandSeconds,
  formatDuration,
  interpret,
  itemsFor,
  judgeShortcut,
  phaseById,
  phaseStatusText,
  recordBuild,
  recordJudged,
  recordTouch,
  sessionWallSeconds,
  shuffle,
  summarize,
  undoLastAnswer,
  type AnswerRecord,
  type AnswerStatus,
  type BuildItem,
  type Character,
  type GameSession,
  type JudgedItem,
  type Level,
  type Option,
  type PhaseId,
  type PhaseSummary,
  type ShapeId,
  type SkippedPhase,
  type TouchItem,
} from "@/features/super-neuropad/model";
import "@/styles/super-neuropad-arcade.css";

// "Salvar em paciente" é o mesmo fluxo das demais escalas; carrega só na tela de resultado.
const LazySaveToPatient = lazy(() =>
  import("@/components/SaveToPatient").then(({ SaveToPatient: Component }) => ({ default: Component })),
);

const XP_PER_ITEM = 10;
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

type Screen = "setup" | "intro" | "play" | "phase-done" | "results";

const PHASE_TONE: Record<PhaseId, string> = {
  vila: "snp-panel--sky",
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
  recusa: "bg-amber-800 text-white",
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

function VrFigure({ id, size = "md" }: { id: string; size?: "md" | "lg" }) {
  // Figura do banco do Reconhecimento Visual, desenhada pelo componente de lá; `child` evita que o texto alternativo entregue a resposta.
  return <span className={`snp-vr block ${size === "lg" ? "h-40 w-40 sm:h-52 sm:w-52" : "h-24 w-24 sm:h-32 sm:w-32"}`}><VrStimulus id={id} child /></span>;
}

function StimulusView({ item }: { item: JudgedItem }) {
  if (item.kind === "fazer" && item.shape) return <ShapeArt shape={item.shape} />;
  if (item.kind === "fala" && item.stimulusVr) return <VrFigure id={item.stimulusVr} size="lg" />;
  const text = item.stimulus;
  if (!text) return null;
  const long = text.length > 12;
  return (
    <div className={`max-w-full break-words text-center font-black leading-tight ${long ? "text-2xl sm:text-4xl" : "text-6xl sm:text-8xl"}`} aria-label={`Estímulo: ${text}`}>
      {text}
    </div>
  );
}

function XpBar({ answered, total }: { answered: number; total: number }) {
  return (
    <div className="snp-xp w-full" role="progressbar" aria-label="Barra de XP" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
      {Array.from({ length: total }, (_, index) => <i key={index} className={index < answered ? "on" : ""} />)}
    </div>
  );
}

function PhaseMeter({ phase }: { phase: PhaseSummary }) {
  const cells: string[] = phase.answers.map((answer) => (answer.status === "acerto" ? "hit" : answer.status === "erro" ? "err" : "none"));
  while (cells.length < phase.total) cells.push("");
  return (
    <div className="snp-meter" role="img" aria-label={`${phase.phase.name}: ${phase.hits} acertos, ${phase.errors} erros, ${phase.noResponse} sem resposta, ${phase.refused} recusa(s) em ${phase.total}`}>
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

function Hud({ character, answered, total, phaseIndex, done, musicOn, paused, canPause, canUndo, canFinish, onToggleMusic, onUndo, onPause, onFinish, onRestart }: {
  character: Character; answered: number; total: number; phaseIndex: number; done: boolean[]; musicOn: boolean; paused: boolean; canPause: boolean; canUndo: boolean; canFinish: boolean;
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
          <ArcadeButton tone="paper" className="px-3 py-1.5 text-xs" onClick={onPause} aria-pressed={paused} disabled={!canPause} aria-keyshortcuts="P" title="Pausa o desafio e o cronômetro (tecla P)">
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
          <ArcadeButton tone="paper" className="px-3 py-1.5 text-xs" onClick={onRestart} title="Recomeça do mundo 1 com a mesma idade e o mesmo herói">
            <RotateCcw className="h-4 w-4" /> Reiniciar
          </ArcadeButton>
        </div>
      </div>
      <XpBar answered={answered} total={total} />
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
    { label: kitTotal > 0 ? `Ambiente ${kitDone}/${kitTotal}` : "Ambiente", ok: kitTotal > 0 && kitDone === kitTotal, optional: true },
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

function TouchStage({ item, seed, paused, onAnswer }: { item: TouchItem; seed: number; paused: boolean; onAnswer: (chosen: Option | null, event: React.MouseEvent) => void }) {
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
      {item.context && <p className="snp-panel snp-panel--soft mx-auto max-w-2xl p-3 text-center text-sm font-bold text-[var(--snp-ink-fixed)]">Aplicadora, leia antes: “{item.context}”</p>}
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.context ? item.prompt.replace(`Leia: “${item.context}” Depois: `, "") : item.prompt}</p>
      {item.stimulusVr && <div className="flex justify-center" aria-label="Modelo"><span className="rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-white p-2"><VrFigure id={item.stimulusVr} /></span></div>}
      {item.stimulus && <p className={`mx-auto max-w-3xl whitespace-pre-line break-words text-center font-black leading-snug ${item.stimulus.length > 40 ? "text-lg sm:text-xl" : "text-4xl sm:text-5xl"}`} aria-label={`Estímulo: ${item.stimulus}`}>{item.stimulus}</p>}
      <div className={`grid gap-4 ${options.length <= 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`} role="group" aria-label="Opções">
        {options.map((option, index) => (
          <button
            key={`${option.label}-${index}`}
            type="button"
            onClick={(event) => onAnswer(option, event)}
            className={`snp-option flex min-h-32 items-center justify-center p-3 text-center font-black ${option.vr ? "bg-white" : OPTION_TINTS[index % OPTION_TINTS.length]} ${item.big ? (option.size === "lg" ? "text-8xl" : option.size === "sm" ? "text-4xl" : "text-6xl") : "text-xl sm:text-2xl"}`}
            aria-label={option.vr ? `Opção ${index + 1}` : option.label}
          >
            {option.vr ? <VrFigure id={option.vr} /> : <span aria-hidden="true">{option.art}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Folha de desenho com o dedo: só na tela, nada é guardado nem exportado. */
function DrawPad() {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width, y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height };
  };
  const down = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawing.current = true;
    const { x, y } = point(event);
    context.lineWidth = 10; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = getComputedStyle(event.currentTarget).color; // cor do token (--snp-ink-fixed) via CSS
    context.beginPath(); context.moveTo(x, y); context.lineTo(x + 0.1, y + 0.1); context.stroke();
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = point(event);
    context.lineTo(x, y); context.stroke();
  };
  const up = () => { drawing.current = false; };
  const clear = () => { const element = canvas.current; element?.getContext("2d")?.clearRect(0, 0, element.width, element.height); };
  return (
    <div className="w-full space-y-2" data-testid="snp-drawpad">
      <canvas
        ref={canvas} width={720} height={420} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}
        className="snp-drawpad block h-56 w-full touch-none rounded-2xl border-[3px] border-dashed border-[var(--snp-ink-fixed)] bg-white sm:h-72"
        aria-label="Área para desenhar ou escrever com o dedo. Nada é guardado."
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold opacity-70">Desenhe com o dedo. Nada é salvo: a aplicadora confere na hora.</span>
        <button type="button" className="snp-chip" onClick={() => { softTap(); clear(); }}><Eraser className="h-3.5 w-3.5" /> Limpar</button>
      </div>
    </div>
  );
}

function MissBar({ onMiss }: { onMiss: (status: "sem_resposta" | "recusa", event: React.MouseEvent) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="snp-chip opacity-80 hover:opacity-100" onClick={(event) => onMiss("sem_resposta", event)}>
        Aplicadora: não respondeu · pular
      </button>
      <button type="button" className="snp-chip opacity-80 hover:opacity-100" onClick={(event) => onMiss("recusa", event)}>
        <Ban className="h-3.5 w-3.5" /> Recusou · pular
      </button>
    </div>
  );
}

function JudgeStage({ item, onJudge }: { item: JudgedItem; onJudge: (status: AnswerStatus, event: React.MouseEvent, gesture?: boolean) => void }) {
  const drawn = item.kind === "fazer" && item.draw;
  return (
    <div className="space-y-5">
      {(drawn || item.stimulus || (item.kind === "fazer" && item.shape) || (item.kind === "fala" && item.stimulusVr)) && (
        <div className={`snp-panel flex min-h-40 items-center justify-center gap-4 p-6 ${drawn ? "flex-col sm:flex-row" : ""}`}>
          <StimulusView item={item} />
          {drawn && <DrawPad />}
        </div>
      )}
      <div className="snp-panel snp-panel--soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="snp-pixel text-[11px] opacity-80">Aplicadora · {KIND_LABELS[item.kind]} · {ORIGIN_LABELS[item.origin]}</div>
          <TurnCue who="aplicadora" />
        </div>
        <p className="mt-1 text-lg font-black leading-snug">{item.prompt}</p>
        <p className="mt-2 text-sm"><span className="font-black">Conta como acerto:</span> {item.expected}</p>
        {item.gesture && <p className="mt-1 text-sm"><span className="font-black">Alternativa aceita:</span> {item.gesture}</p>}
        <div className={`mt-4 grid gap-3 ${item.gesture ? "sm:grid-cols-5" : "sm:grid-cols-4"}`}>
          <ArcadeButton tone="grass" className="min-h-14 text-base" aria-keyshortcuts="1" onClick={(event) => onJudge("acerto", event)}>
            <Check className="h-5 w-5" /> Acertou
          </ArcadeButton>
          {item.gesture && (
            <ArcadeButton tone="grass" className="min-h-14 text-base" aria-keyshortcuts={GESTURE_SHORTCUT} onClick={(event) => onJudge("acerto", event, true)}>
              <Hand className="h-5 w-5" /> Acertou por gesto
            </ArcadeButton>
          )}
          <ArcadeButton tone="berry" className="min-h-14 text-base" aria-keyshortcuts="2" onClick={(event) => onJudge("erro", event)}>
            <X className="h-5 w-5" /> Errou
          </ArcadeButton>
          <ArcadeButton tone="slate" className="min-h-14 text-base" aria-keyshortcuts="3" onClick={(event) => onJudge("sem_resposta", event)}>
            Não respondeu
          </ArcadeButton>
          <ArcadeButton tone="paper" className="min-h-14 text-base" aria-keyshortcuts="4" onClick={(event) => onJudge("recusa", event)}>
            <Ban className="h-5 w-5" /> Recusou
          </ArcadeButton>
        </div>
        <p className="mt-2 hidden text-[11px] font-bold opacity-70 sm:block">Teclado: 1 Acertou{item.gesture ? ` · ${GESTURE_SHORTCUT} Acertou por gesto` : ""} · 2 Errou · 3 Não respondeu · 4 Recusou · P Pausa</p>
      </div>
    </div>
  );
}

/** Montar a palavra tocando nas letras na ordem (banco cognitivo). A tela confere sozinha. */
function BuildStage({ item, seed, onDone }: { item: BuildItem; seed: number; onDone: (placed: string[], event: React.MouseEvent) => void }) {
  const tiles = useMemo(() => shuffle(item.tiles.map((letter, index) => ({ letter, index })), seed), [item, seed]);
  const [used, setUsed] = useState<number[]>([]);
  const [showWord, setShowWord] = useState(false);
  const placed = used.map((index) => item.tiles[index]);
  return (
    <div className="space-y-5" data-testid="snp-build">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="snp-chip"><Volume2 className="h-3.5 w-3.5" /> {item.show ? "Mostre a palavra" : "Dite a palavra"}</span>
        <TurnCue who="crianca" />
      </div>
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.prompt}</p>
      {item.show ? (
        <p className="text-center text-5xl font-black tracking-widest" aria-label={`Modelo: ${item.word}`}>{item.word}</p>
      ) : (
        <div className="flex justify-center">
          <button type="button" className="snp-chip" aria-pressed={showWord} onClick={() => { softTap(); setShowWord((current) => !current); }}>
            <Eye className="h-3.5 w-3.5" /> {showWord ? `Ditar: ${item.word}` : "Aplicadora: ver a palavra para ditar"}
          </button>
        </div>
      )}
      <div className="flex min-h-20 flex-wrap items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-[var(--snp-ink-fixed)] bg-white p-3 text-[var(--snp-ink-fixed)]" aria-live="polite" aria-label="Palavra montada">
        {placed.length === 0 ? <span className="text-sm font-bold opacity-60">Toque nas letras abaixo</span> : placed.map((letter, index) => <span key={index} className="snp-pixel text-3xl">{letter}</span>)}
      </div>
      <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Letras">
        {tiles.map((tile) => {
          const taken = used.includes(tile.index);
          return (
            <button key={tile.index} type="button" disabled={taken} onClick={() => { softTap(); setUsed((current) => [...current, tile.index]); }}
              className={`snp-option flex h-16 w-16 items-center justify-center text-3xl font-black sm:h-20 sm:w-20 ${taken ? "opacity-30" : "bg-[var(--snp-sky-tint)]"}`}>
              {tile.letter}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <ArcadeButton tone="paper" disabled={used.length === 0} onClick={() => { softTap(); setUsed((current) => current.slice(0, -1)); }}>
          <Delete className="h-5 w-5" /> Apagar letra
        </ArcadeButton>
        <ArcadeButton tone="grass" disabled={used.length === 0} onClick={(event) => onDone(placed, event)}>
          <Check className="h-5 w-5" /> Pronto
        </ArcadeButton>
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
  /** Pausa disparada porque a aba/tela saiu de foco (bloqueio do tablet, troca de app). */
  const [autoPaused, setAutoPaused] = useState(false);
  const [repeated, setRepeated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  /** Resultado já copiado, baixado ou salvo: "Nova partida" só pede confirmação antes disso. */
  const [resultKept, setResultKept] = useState(false);
  /** Aplicadora tocou em "Menos de 2 anos": o jogo não é aplicado (bloqueio com orientação). */
  const [underTwo, setUnderTwo] = useState(false);
  const [skipped, setSkipped] = useState<SkippedPhase[]>([]);
  const [skipOpen, setSkipOpen] = useState(false);
  const [observations, setObservations] = useState("");
  /** Encaminhamento automático à família: e-mail/WhatsApp cadastrados na 1ª página do teste.
   *  Fica somente em memória da aba (nenhum dado sai sem o gesto de envio do cliente). */
  const [familyContact, setFamilyContact] = useState<FamilyContact | null>(null);
  const [familyDeliveryStatus, setFamilyDeliveryStatus] = useState<"" | "ready" | "done">("");
  const startedAt = useRef<string>("");
  const finishedAt = useRef<string | null>(null);
  const itemStart = useRef<number>(0);
  const activeItemMs = useRef(0);
  const cheerTimer = useRef<number | null>(null);
  const music = useRef<Chiptune | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pauseCount = useRef(0);
  const undoCount = useRef(0);
  const pausedMs = useRef(0);
  const pausedAt = useRef<number | null>(null);
  /** Carimbo do último registro aceito: trava toque duplo (mesma guarda do motor compartilhado EasyGame). */
  const lastAnswerAt = useRef(Number.NEGATIVE_INFINITY);

  const band = ageYears === null ? undefined : bandForYears(ageYears);
  const phaseId = PHASE_ORDER[phaseIndex];
  const phase = phaseById(phaseId);
  const items = band ? itemsFor(band.id, phaseId) : [];
  const item = items[itemIndex];
  const done = PHASE_ORDER.map((id) => band ? answers.filter((answer) => answer.phaseId === id).length >= itemsFor(band.id, id).length : false);
  const totalItems = band ? bandItemCount(band.id) : 0;
  const estimate = band ? estimateBandSeconds(band.min) : null;
  const dirty = answers.length > 0;
  useSondaExitGuard(dirty, "Sair apaga os registros desta partida. Copie ou baixe o resultado antes de sair. Deseja sair mesmo assim?");
  const ready = Boolean(band && character);
  // O encaminhamento só arma com cadastro válido; contato vazio nunca dispara no encerramento.
  useEffect(() => {
    if (!familyContact) { setFamilyDeliveryStatus(""); return; }
    const valid = (familyContact.email && isValidFamilyEmail(familyContact.email)) || (familyContact.phone && isValidPhone(familyContact.phone));
    setFamilyDeliveryStatus(valid ? "ready" : "");
  }, [familyContact]);

  const session: GameSession | null = ageYears !== null && band && character ? {
    version: SUPER_NEUROPAD_VERSION,
    ageYears,
    bandId: band.id,
    characterId: character.id,
    startedAt: startedAt.current,
    finishedAt: finishedAt.current,
    answers,
    pauseCount: pauseCount.current,
    pausedSeconds: Math.round(pausedMs.current / 1000),
    undoCount: undoCount.current,
    skipped,
    observations,
  } : null;

  const getMusic = useCallback(() => {
    if (!music.current) music.current = createChiptune();
    return music.current;
  }, []);

  useEffect(() => () => { music.current?.stop(); if (cheerTimer.current) window.clearTimeout(cheerTimer.current); }, []);

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

  // Tela bloqueada ou troca de aplicativo no meio do desafio: pausa sozinho para
  // o tempo do item não inflar (o relatório soma só os intervalos ativos).
  useEffect(() => {
    if (screen !== "play" || paused) return;
    const onVisibility = () => { if (document.hidden) pauseNow(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  });

  // Atalhos da aplicadora: 1/2/3 nos itens julgados (fala e ação) e P para pausa.
  // Itens de toque seguem exclusivos da criança na tela.
  useEffect(() => {
    if (screen !== "play") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      if (event.key === "p" || event.key === "P") { event.preventDefault(); togglePause(); return; }
      if (paused || !item || (item.kind !== "fala" && item.kind !== "fazer")) return;
      if (event.key === GESTURE_SHORTCUT && item.gesture) {
        event.preventDefault();
        submitAnswer(recordJudged(item, phaseId, "acerto", elapsedSeconds(), repeated, "gesto"), event);
        return;
      }
      const status = judgeShortcut(event.key);
      if (!status) return;
      event.preventDefault();
      submitAnswer(recordJudged(item, phaseId, status, elapsedSeconds(), repeated), event);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function startGame() {
    if (!ready) return;
    softTap();
    startedAt.current = new Date().toISOString();
    finishedAt.current = null;
    // Ordem das opções nova a cada partida: recomeçar não repete as posições já vistas.
    setSeed(Math.floor(Math.random() * 1_000_000));
    setResultKept(false);
    setAnswers([]);
    setPhaseIndex(0);
    setItemIndex(0);
    setPaused(false);
    setAutoPaused(false);
    pauseCount.current = 0;
    undoCount.current = 0;
    pausedMs.current = 0;
    pausedAt.current = null;
    setSkipped([]);
    setSkipOpen(false);
    setObservations("");
    lastAnswerAt.current = Number.NEGATIVE_INFINITY;
    setScreen("intro");
    if (musicOn) getMusic().start();
  }

  /** Nova partida para OUTRA criança: limpa idade e herói para a faixa nunca ficar herdada da criança anterior. */
  function restart() {
    if (answers.length > 0 && screen !== "results" && !window.confirm("Reiniciar apaga o registro desta partida. Deseja reiniciar?")) return;
    if (screen === "results" && !resultKept && !window.confirm("O resultado ainda não foi copiado, baixado nem salvo em paciente. Começar uma nova partida apaga este resultado. Continuar?")) return;
    softTap();
    music.current?.stop();
    setAnswers([]);
    setPhaseIndex(0);
    setItemIndex(0);
    setAgeYears(null);
    setCharacter(null);
    setResultKept(false);
    setKitChecked({});
    setUnderTwo(false);
    setSkipped([]);
    setSkipOpen(false);
    setObservations("");
    setPaused(false);
    setFamilyDeliveryStatus("");
    setFamilyContact(null);
    finishedAt.current = null;
    lastAnswerAt.current = Number.NEGATIVE_INFINITY;
    setScreen("setup");
  }

  /** Recomeço rápido com a mesma criança (idade, herói e inventário mantidos): volta direto ao mundo 1. */
  function replaySameChild() {
    if (answers.length > 0 && !window.confirm("Recomeçar do mundo 1 apaga o registro desta partida. Deseja recomeçar?")) return;
    music.current?.stop();
    startGame();
  }

  function showCheer(text: string) {
    setCheer(text);
    if (cheerTimer.current) window.clearTimeout(cheerTimer.current);
    cheerTimer.current = window.setTimeout(() => setCheer(null), 900);
  }

  function finishGame() {
    if (pausedAt.current !== null) { pausedMs.current += performance.now() - pausedAt.current; pausedAt.current = null; }
    finishedAt.current = new Date().toISOString();
    playFlagPole();
    celebrate();
    music.current?.stop();
    setPaused(false);
    setScreen("results");
    if (familyContact && familyDeliveryStatus === "ready") void deliverToFamily(familyContact);
  }

  /** Encaminhamento automático ao encerrar: PDF familiar baixa, WhatsApp abre com o resumo e o e-mail abre em rascunho.
   *  Nada é transmitido a servidor: o envio final é confirmado pela aplicadora no próprio cliente. */
  async function deliverToFamily(contact: FamilyContact) {
    if (!session) return;
    const appliedAt = formatClinicalDateTime(new Date(session.finishedAt ?? session.startedAt));
    const baseName = `super-neuropad-familia-${session.bandId}-${localIsoDate(new Date(session.startedAt))}`;
    const summaryText = buildFamilySummary(session, contact);
    try {
      const { buildDocumentPdf } = await import("@/lib/documentPdf");
      const bytes = await buildDocumentPdf(buildFamilyDocSpec(session, issuerLines(issuer, issuerCredentials(issuer)), appliedAt));
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeTextFilename(baseName)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResultKept(true);
    } catch {
      toast({ title: "PDF para a família", description: "Não foi possível gerar o PDF agora; use \u201cBaixar PDF detalhado\u201d.", variant: "destructive" });
    }
    try {
      const channels: string[] = [];
      if (contact.phone && isValidPhone(contact.phone)) {
        const outcome = await shareWhatsAppDocument({ title: `${SUPER_NEUROPAD_TITLE} — resumo para a família`, text: summaryText, phone: formatPhoneNumber(contact.phone), filename: baseName });
        if (outcome === "cancelled") {
          setFamilyDeliveryStatus("done");
          return;
        }
        if (outcome !== "failed") channels.push("WhatsApp aberto com o resumo");
      }
      if (contact.email && isValidFamilyEmail(contact.email)) {
        // Duas navegações na mesma tacada se anulam (wa.me/mailto disputam a
        // aba); a pausa deixa o cliente abrir antes do próximo redirecionamento.
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        await openEmailDraft({
          to: contact.email,
          subject: `${SUPER_NEUROPAD_TITLE} — resumo da aventura (${summary?.band.label ?? ""})`,
          body: `${summaryText}\n\nO PDF com o relatório completo foi baixado neste dispositivo: anexe-o antes de enviar.`,
          filename: baseName,
        });
        channels.push("e-mail aberto em rascunho para anexar o PDF");
      }
      if (channels.length === 0) {
        setFamilyDeliveryStatus("");
        toast({ title: "Encaminhamento à família", description: "Não foi possível abrir o WhatsApp agora; copie o resumo nesta tela e envie manualmente.", variant: "destructive" });
        return;
      }
      setFamilyDeliveryStatus("done");
      toast({ title: "Encaminhamento à família preparado", description: channels.join(" · ") + ". O PDF foi baixado neste dispositivo." });
    } catch {
      toast({ title: "Encaminhamento à família", description: "Cliente de e-mail/WhatsApp indisponível; copie o resumo nesta tela.", variant: "destructive" });
    }
  }

  /** Toque duplo é comum em tablet (~100–250 ms): sem esta guarda, um segundo toque no mesmo botão, antes do próximo desafio montar, registra o item corrente duas vezes e pula o seguinte sem resposta. */
  function submitAnswer(record: AnswerRecord, event: { timeStamp: number }) {
    if (!acceptManualTap(lastAnswerAt.current, event.timeStamp)) return;
    lastAnswerAt.current = event.timeStamp;
    pushAnswer(record);
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
    if (paused && musicOn) getMusic().start();
    if (pausedAt.current !== null) { pausedMs.current += performance.now() - pausedAt.current; pausedAt.current = null; }
    setAnswers(previous.answers);
    setPhaseIndex(PHASE_ORDER.indexOf(previous.phaseId));
    setItemIndex(previous.itemIndex);
    setPaused(false);
    setScreen("play");
    showCheer("Desfeito. Refaça o desafio.");
  }

  function pauseNow(auto: boolean) {
    if (paused) return;
    activeItemMs.current += performance.now() - itemStart.current;
    pauseCount.current += 1;
    pausedAt.current = performance.now();
    // Pausa é lanche, banheiro ou conversa: a trilha para junto com o cronômetro.
    music.current?.stop();
    setAutoPaused(auto);
    setPaused(true);
  }

  function togglePause() {
    softTap();
    if (!paused) { pauseNow(false); return; }
    itemStart.current = performance.now();
    if (pausedAt.current !== null) { pausedMs.current += performance.now() - pausedAt.current; pausedAt.current = null; }
    if (musicOn) getMusic().start();
    setAutoPaused(false);
    setPaused(false);
  }

  function finishEarly() {
    if (!window.confirm(`Encerrar agora? ${answers.length} de ${totalItems} desafios registrados. O resultado sai como partida incompleta.`)) return;
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
    setSkipOpen(false);
    // Entrar num mundo que tinha sido pulado (depois de desfazer) anula o "não aplicado".
    setSkipped((current) => current.filter((entry) => entry.phaseId !== phaseId));
    setScreen("play");
  }

  /** Pula o mundo inteiro com motivo: aparece como "não aplicado — motivo"; a partida fica incompleta (sem classificação). */
  function skipPhase(reason: string) {
    softTap();
    setSkipOpen(false);
    setSkipped((current) => [...current.filter((entry) => entry.phaseId !== phaseId), { phaseId, reason }]);
    if (phaseIndex + 1 < PHASE_ORDER.length) {
      setPhaseIndex(phaseIndex + 1);
      setItemIndex(0);
      setScreen("intro");
      return;
    }
    finishGame();
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
      anchor.download = `${safeTextFilename(`super-neuropad-game-${session.bandId}-${localIsoDate(new Date(session.startedAt))}`)}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setResultKept(true);
      toast({ title: "PDF detalhado gerado", description: summarize(session).complete
        ? "Resultado objetivo, leitura para a consulta e cada item com resposta esperada, registrada e tempo."
        : "Observações registradas e situação da partida incompleta, sem classificação ou interpretação." });
    } catch (error) {
      toast({ title: "Falha ao gerar PDF", description: error instanceof Error ? error.message : "Tente novamente.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }

  async function copyText(text: string, filename: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      setResultKept(true);
      toast({ title, description: "Texto na área de transferência." });
    } catch {
      downloadTextDocument(text, `${safeTextFilename(filename)}.txt`);
      setResultKept(true);
      toast({ title: "Baixado em TXT", description: "A área de transferência não estava disponível." });
    }
  }

  const summary = session ? summarize(session) : null;
  const wallSeconds = session ? sessionWallSeconds(session) : null;
  const patientRecord = session && screen === "results" ? buildPatientRecordItems(session) : [];
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
                <span className="snp-chip">pré-consulta · aplicadora com a criança · {MIN_AGE_YEARS}–{MAX_AGE_YEARS} anos</span>
                <span className="snp-chip">v{SUPER_NEUROPAD_VERSION}</span>
                <span className="snp-chip">{PHASES.length} mundos · 4–5 desafios cada</span>
                <span className="snp-chip">até 20 min</span>
                <span className="snp-chip">sem câmera · sem material externo</span>
              </div>
            )}
            <h1 className={`snp-pixel snp-title text-[var(--snp-paper-fixed)] ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{SUPER_NEUROPAD_TITLE}</h1>
            {!compact && (
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed">
                Avaliação única de pré-consulta: seis mundos que integram Sonda 10, Observa 10 (OBS-10), Reconhecimento Visual e Avaliação Cognitiva Infantil, com desafios calibrados para cada ano de idade. Cada desafio tem certo e errado; a criança só vê XP, moedas e conquistas. Ao final, resultado por domínio, leitura para a consulta e PDF detalhado. Triagem autoral de déficits grosseiros; a conclusão é do médico.
              </p>
            )}
          </div>
        </div>
      </header>

      {screen === "setup" && (
        <section className="space-y-5">
          <div className="snp-panel snp-panel--soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <SetupSteps hasAge={Boolean(band)} hasHero={Boolean(character)} kitDone={band ? band.ambient.filter((entry) => kitChecked[entry]).length : 0} kitTotal={band?.ambient.length ?? 0} />
            <span className="text-xs font-bold opacity-70">Três toques e começa: idade, herói e, se der, a conferência da sala.</span>
          </div>
          <div className="snp-panel p-5">
            <h2 className="snp-pixel text-base">1 · Idade da criança (anos)</h2>
            <p className="text-xs font-bold opacity-70">Somente anos completos. Cada ano tem os seus desafios.</p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-9" role="group" aria-label="Idade em anos">
              <button type="button" aria-pressed={underTwo} onClick={() => { softTap(); setUnderTwo(true); setAgeYears(null); setKitChecked({}); }}
                className={`snp-option min-h-12 px-1 text-xs font-black leading-tight ${underTwo ? "bg-[var(--snp-berry-tint)]" : "bg-[var(--snp-paper-fixed)] hover:bg-[var(--snp-paper-2-fixed)]"}`}>
                Menos de 2 anos
              </button>
              {YEARS.map((year) => (
                <button key={year} type="button" aria-pressed={ageYears === year} onClick={() => { softTap(); setUnderTwo(false); setAgeYears(year); setKitChecked({}); }}
                  className={`snp-option min-h-12 text-lg font-black ${ageYears === year ? "bg-[var(--snp-sun)]" : "bg-[var(--snp-paper-fixed)] hover:bg-[var(--snp-paper-2-fixed)]"}`}>
                  {year}
                </button>
              ))}
            </div>
            {underTwo && (() => {
              const gate = ageGate(1);
              return (
                <div className="snp-panel snp-panel--berry mt-3 p-4" role="alert" data-testid="super-neuropad-under-two">
                  <p className="font-black">Jogo não aplicado para menores de 2 anos.</p>
                  <p className="mt-1 text-sm font-semibold">{UNDER_TWO_MESSAGE}</p>
                  {!gate.ok && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {gate.routes.map((route) => <a key={route.href} href={`#${route.href}`} className="snp-chip bg-[var(--snp-sky-tint)]">{route.label} <ArrowRight className="h-3.5 w-3.5" /></a>)}
                    </div>
                  )}
                </div>
              );
            })()}
            {band && estimate && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" data-testid="super-neuropad-estimate">
                <span className="text-xl" aria-hidden="true">{band.icon}</span>
                <span className="snp-pixel text-xs">{band.label}</span>
                <span className="font-bold opacity-70">· {totalItems} desafios em {PHASES.length} mundos · cerca de {Math.ceil(estimate.minutes)} minutos (máximo 20)</span>
                {band.min <= 3 && <span className="snp-chip bg-[var(--snp-sun-tint)]">2–3 anos: menos desafios, respostas por gesto aceitas, pausa rápida à vontade</span>}
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
              <h2 className="snp-pixel text-base">3 · Ambiente da sala (opcional)</h2>
              <p className="text-xs font-bold opacity-70">Não precisa de material: desenho e escrita são com o dedo na tela. Confira só o espaço. Checklist só em memória.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {band.ambient.map((entry) => {
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

          <div className="snp-panel p-5" data-testid="super-neuropad-family-delivery">
            <h2 className="snp-pixel text-base">4 · Enviar o resultado para a família (opcional)</h2>
            <p className="text-xs font-bold opacity-70">Cadastre e-mail e/ou WhatsApp: ao encerrar, o app gera o PDF em linguagem simples e prepara o envio automático. Os dados ficam só nesta tela e nada é enviado a servidor.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black">E-mail da família</span>
                <input
                  type="email"
                  inputMode="email"
                  className="snp-option mt-1 w-full bg-[var(--snp-paper-fixed)] px-3 py-2 text-sm font-semibold"
                  placeholder="familia@exemplo.com"
                  value={familyContact?.email ?? ""}
                  onChange={(event) => {
                    const email = event.target.value.trim();
                    const phone = familyContact?.phone ?? "";
                    setFamilyContact(email || phone ? { email, phone } : null);
                    setFamilyDeliveryStatus("");
                  }}
                />
                {familyContact?.email && !isValidFamilyEmail(familyContact.email) && (
                  <span className="text-xs font-black text-[var(--snp-berry-tint)]">Confira o e-mail digitado.</span>
                )}
              </label>
              <label className="block">
                <span className="text-xs font-black">WhatsApp da família</span>
                <input
                  type="tel"
                  inputMode="tel"
                  className="snp-option mt-1 w-full bg-[var(--snp-paper-fixed)] px-3 py-2 text-sm font-semibold"
                  placeholder="(DD) 9xxxx-xxxx"
                  value={familyContact?.phone ?? ""}
                  onChange={(event) => {
                    const phone = event.target.value.trim();
                    const email = familyContact?.email ?? "";
                    setFamilyContact(email || phone ? { email, phone } : null);
                    setFamilyDeliveryStatus("");
                  }}
                />
                {familyContact?.phone && !isValidPhone(familyContact.phone) && (
                  <span className="text-xs font-black text-[var(--snp-berry-tint)]">Confira o telefone com DDD.</span>
                )}
              </label>
            </div>
            <p className="mt-2 text-[11px] font-semibold opacity-70" role="status">
              {familyContact && (isValidFamilyEmail(familyContact.email) || isValidPhone(familyContact.phone))
                ? familyDeliveryStatus === "done"
                  ? "Encaminhamento da partida anterior concluído."
                  : "Ativo: ao encerrar a partida, o resumo e o PDF serão preparados automaticamente."
                : "Sem cadastro: o resultado continua disponível para baixar, copiar e salvar no prontuário."}
            </p>
          </div>

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
                <li>Criança calada: “Não respondeu”. Criança que diz não ou empurra: “Recusou”. Os dois ficam separados de “Errou”. Nunca force.</li>
                <li>Use “Pausa” para lanche, água ou banheiro; o tempo do desafio para junto. Se um mundo inteiro não der, use “Pular este mundo” e informe o motivo.</li>
                <li>2 e 3 anos: quando o item mostrar “Alternativa aceita”, apontar ou fazer o gesto vale como acerto (“Acertou por gesto”).</li>
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
          total={totalItems}
          phaseIndex={phaseIndex}
          done={done}
          musicOn={musicOn}
          paused={paused}
          canPause={screen === "play"}
          canUndo={answers.length > 0 && screen !== "intro"}
          canFinish={answers.length > 0}
          onToggleMusic={toggleMusic}
          onUndo={undo}
          onPause={togglePause}
          onFinish={finishEarly}
          onRestart={replaySameChild}
        />
      )}

      {screen === "intro" && character && (
        <section className={`snp-panel snp-scanlines ${PHASE_TONE[phaseId]} p-6 text-center`}>
          <div className="snp-float text-7xl" aria-hidden="true">{phase.emoji}</div>
          <div className="snp-pixel mt-2 text-xs opacity-80">Mundo {phase.order} de {PHASES.length}</div>
          <h2 className="snp-pixel text-2xl sm:text-3xl">{phase.name}</h2>
          <p className="mt-1 text-base font-bold opacity-90">{phase.tagline}</p>
          <div className="mt-4"><SpeechBubble character={character} text={HERO_LINES[character.id]?.intro ?? "Vamos lá!"} /></div>
          <div className="snp-panel mx-auto mt-5 max-w-2xl p-4 text-left text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="snp-pixel text-[11px] opacity-80">Aplicadora · {phase.domain}</div>
              <TurnCue who="aplicadora" />
            </div>
            <p className="mt-1 font-semibold leading-relaxed">{phase.operator}</p>
            <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
              <span className="opacity-70">Traz elementos de:</span>
              {[...new Set(items.map((entry) => entry.origin))].map((origin) => <span key={origin} className="snp-chip">{ORIGIN_LABELS[origin]}</span>)}
              <span className="opacity-70">· {items.length} desafios</span>
            </p>
            <p className="mt-2 text-xs font-bold opacity-70"><Eye className="mr-1 inline h-3.5 w-3.5" /> Leia, depois toque em entrar e vire o tablet para a criança.</p>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <ArcadeButton tone="sun" className="px-6 py-3 text-base" onClick={enterPhase}>
              <span aria-hidden="true">{character.emoji}</span> Entrar na fase
            </ArcadeButton>
            <ArcadeButton tone="paper" aria-expanded={skipOpen} onClick={() => { softTap(); setSkipOpen((current) => !current); }}>
              <SkipForward className="h-4 w-4" /> Pular este mundo
            </ArcadeButton>
          </div>
          {skipOpen && (
            <div className="snp-panel mx-auto mt-4 max-w-2xl p-4 text-left text-sm" data-testid="super-neuropad-skip">
              <p className="font-black">Por que este mundo não será aplicado?</p>
              <p className="text-xs font-semibold opacity-80">Fica no resultado como “não aplicado — motivo”. A partida passa a ser incompleta: sem classificação geral.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SKIP_REASONS.map((reason) => <button key={reason} type="button" className="snp-chip bg-[var(--snp-paper-fixed)]" onClick={() => skipPhase(reason)}>{reason}</button>)}
              </div>
            </div>
          )}
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
              {autoPaused && <p className="snp-chip bg-[var(--snp-sun-tint)]" role="status">Pausado sozinho: a tela saiu de foco.</p>}
              <p className="max-w-md text-sm font-bold opacity-80">Pausa rápida: o tempo do desafio parou. Lanche, água, banheiro ou respiro. Toque em continuar quando a criança estiver pronta.</p>
              <ArcadeButton tone="grass" className="px-6 py-3 text-base" onClick={togglePause}><Play className="h-5 w-5" /> Continuar</ArcadeButton>
            </div>
          )}
            <div hidden={paused} className="rounded-2xl bg-[var(--snp-stage)] p-3 text-[var(--snp-stage-text)] sm:p-4">
              {item.kind === "toque" ? (
                <div className="space-y-4">
                  <TouchStage key={item.id} item={item} paused={paused} seed={seed + itemIndex * 17 + phaseIndex * 101} onAnswer={(chosen, event) => submitAnswer(recordTouch(item, phaseId, chosen, elapsedSeconds(), repeated), event)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repeated} onToggle={() => setRepeated((current) => !current)} />
                    <MissBar onMiss={(status, event) => submitAnswer(recordTouch(item, phaseId, null, elapsedSeconds(), repeated, status === "recusa"), event)} />
                  </div>
                </div>
              ) : item.kind === "montar" ? (
                <div className="space-y-4">
                  <BuildStage key={item.id} item={item} seed={seed + itemIndex * 17 + phaseIndex * 101} onDone={(placed, event) => submitAnswer(recordBuild(item, phaseId, placed, elapsedSeconds(), repeated), event)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repeated} onToggle={() => setRepeated((current) => !current)} />
                    <MissBar onMiss={(status, event) => submitAnswer(recordBuild(item, phaseId, null, elapsedSeconds(), repeated, status === "recusa"), event)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <JudgeStage key={item.id} item={item} onJudge={(status, event, gesture) => submitAnswer(recordJudged(item, phaseId, status, elapsedSeconds(), repeated, gesture ? "gesto" : undefined), event)} />
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
            Próximo mundo: {phaseById(PHASE_ORDER[phaseIndex + 1]).emoji} {phaseById(PHASE_ORDER[phaseIndex + 1]).name}
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
            <p className="mt-1 text-xs font-bold opacity-80" data-testid="super-neuropad-when">
              {formatClinicalDateTime(new Date(session.finishedAt ?? session.startedAt))} · {summary.band.label} (faixa anual)
              {wallSeconds !== null ? ` · sessão de ${formatDuration(wallSeconds)}` : ""} · tarefas {formatDuration(summary.durationSeconds)} · {session.pauseCount ?? 0} pausa(s)
              {(session.pausedSeconds ?? 0) > 0 ? ` (${formatDuration(session.pausedSeconds ?? 0)} em pausa)` : ""}
            </p>
          </div>

          {summary.level === null ? (
            <div className="snp-panel p-5" data-testid="super-neuropad-incomplete">
              <p className="font-black">Partida incompleta: {session.answers.length} de {summary.total} itens registrados.</p>
              <p>Sem classificação ou interpretação (regra da partida incompleta). Cada mundo mostra o que foi registrado ou “não aplicado — motivo”; as respostas continuam disponíveis para copiar, baixar ou salvar.</p>
            </div>
          ) : (<div className={`snp-panel ${LEVEL_PANEL[summary.level]} p-5`}>
            <div className="snp-pixel text-[11px] opacity-80">Resultado objetivo · {summary.band.label} · {summary.complete ? "partida completa" : `partida incompleta (${session.answers.length} de ${summary.total} itens)`}</div>
            <div className="mt-1 text-3xl font-black">{LEVEL_ICON[summary.level]} {summary.hits} de {summary.total} acertos</div>
            <div className="text-xs font-bold opacity-80">Esperado para {summary.band.label}: {summary.expectedMin} ou mais (referência autoral do jogo)</div>
            <div className="text-base font-black">{LEVEL_LABELS[summary.level]}</div>
            <div className="mt-1 text-xs font-semibold opacity-80">Tempo somado nas tarefas: {formatDuration(summary.durationSeconds)} · contagem autoral, não normativa; leitura é do médico.</div>
          </div>)}

          {reading && (<div className="snp-panel p-5" data-testid="super-neuropad-reading">
            <div className="snp-pixel flex items-center gap-2 text-xs"><ClipboardList className="h-4 w-4" /> Leitura para a consulta</div>
            <p className="mt-1 text-xs font-semibold opacity-70">Descritiva e autoral. Comparações internas à partida; nenhuma norma, percentil, idade equivalente ou diagnóstico.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Prioridade</div>
                <div className="mt-1 text-sm font-black">{reading.priorities.length === 0 ? "Nenhum mundo fora do esperado" : reading.priorities.map((entry) => `${entry.phase.emoji} ${entry.phase.name} ${entry.hits}/${entry.total}`).join(" · ")}</div>
              </div>
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Padrão de resposta</div>
                <div className="mt-1 text-sm font-black">{RESPONSE_PATTERN_LABELS[reading.pattern]}</div>
                <div className="text-[11px] font-semibold opacity-70">{reading.errors} erros · {reading.noResponse - reading.refused} sem resposta · {reading.refused} recusa(s)</div>
              </div>
              <div className="snp-panel snp-panel--soft p-3">
                <div className="snp-pixel text-[10px] opacity-70">Toque × aplicadora</div>
                <div className="mt-1 text-sm font-black">Toque {reading.touch.hits}/{reading.touch.total} · Fala e ação {reading.judged.hits}/{reading.judged.total}</div>
                <div className="text-[11px] font-semibold opacity-70">{reading.repeated} comando(s) repetido(s) · {reading.gestures} por gesto</div>
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

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="super-neuropad-domains">
            {summary.phases.map((entry) => (
              <div key={entry.phase.id} className={`snp-panel ${entry.level !== null ? LEVEL_PANEL[entry.level] : "snp-panel--soft"} p-4`}>
                <div className="text-2xl" aria-hidden="true">{entry.phase.emoji}</div>
                <div className="snp-pixel text-[11px]">{entry.phase.name}</div>
                <div className="text-[11px] font-semibold opacity-80">{entry.phase.domain}</div>
                <div className="mt-2 text-2xl font-black">{entry.level !== null ? `${entry.hits}/${entry.total}` : entry.applied ? `${entry.answers.length} registros` : "—"}</div>
                <div className="text-[11px] font-bold opacity-80">Esperado para a idade: {entry.expectedMin} ou mais de {entry.total}</div>
                <div className="mt-1"><PhaseMeter phase={entry} /></div>
                <div className="mt-1 text-xs font-black">{entry.level !== null ? `${LEVEL_ICON[entry.level]} ${LEVEL_SHORT[entry.level]}` : entry.skipReason ? `Não aplicado — ${entry.skipReason}` : entry.applied ? "Registro parcial" : "Não aplicado"}</div>
                <div className="mt-1 text-[11px] font-semibold opacity-80">{entry.applied ? `${entry.errors} erros · ${entry.noResponse} sem resposta · ${entry.refused} recusa(s) · ${formatDuration(entry.seconds)}` : "nenhum item registrado"}</div>
              </div>
            ))}
          </div>

          <div className="snp-panel snp-panel--soft p-4 text-[var(--snp-ink-fixed)]" data-testid="super-neuropad-origins">
            <div className="snp-pixel text-[11px]">O que foi testado por instrumento de origem</div>
            <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              {summary.origins.map((origin) => (
                <li key={origin.origin} className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-paper-fixed)] p-3">
                  <div className="font-black">{origin.label}</div>
                  <div className="text-xs font-semibold opacity-80">{origin.planned} desafio(s) em {origin.phases.map((id) => phaseById(id).name).join(", ")} · registrados {origin.applied} · acertos {origin.hits}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="snp-panel p-4" data-testid="super-neuropad-observations">
            <label htmlFor="snp-observations" className="snp-pixel text-[11px]">Observações da aplicadora (vão para o PDF, o registro e o prontuário)</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OBSERVATION_CHIPS.map((chip) => (
                <button key={chip} type="button" className="snp-chip" onClick={() => { softTap(); setObservations((current) => (current.includes(chip) ? current : [current.trim(), chip].filter(Boolean).join(". ")).slice(0, OBSERVATIONS_MAX)); }}>+ {chip}</button>
              ))}
            </div>
            <textarea
              id="snp-observations" value={observations} maxLength={OBSERVATIONS_MAX} rows={3}
              onChange={(event) => setObservations(event.target.value.slice(0, OBSERVATIONS_MAX))}
              className="mt-2 w-full rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-white p-3 text-sm text-[var(--snp-ink-fixed)]"
              placeholder="Comportamento, colaboração, intercorrências. Fica só nesta tela até você baixar, copiar ou salvar."
            />
            <div className="text-right text-[11px] font-bold opacity-60">{observations.length}/{OBSERVATIONS_MAX}</div>
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
            <ArcadeButton tone="slate" onClick={restart} title="Limpa idade e herói para a próxima criança">
              <RotateCcw className="h-5 w-5" /> Nova partida
            </ArcadeButton>
          </div>
          <p className="text-xs font-bold opacity-70" role="status">
            {resultKept ? "Resultado guardado (copiado, baixado ou salvo)." : "Nada é guardado sozinho: copie, baixe o PDF ou salve em paciente antes de sair ou começar outra partida."}
          </p>

          <div className="snp-panel snp-panel--soft p-4 text-[var(--snp-ink-fixed)]" data-testid="super-neuropad-save">
            <div className="snp-pixel text-[11px]">Salvar no prontuário do paciente</div>
            <p className="mt-1 text-xs font-semibold opacity-80">Envia o resumo e cada item registrado ao paciente escolhido, pelo mesmo fluxo das demais escalas. Só acontece ao tocar em salvar.</p>
            <div className="mt-3">
              <Suspense fallback={<p className="text-xs font-bold opacity-70">Carregando pacientes…</p>}>
                <LazySaveToPatient
                  scaleName={SUPER_NEUROPAD_TITLE}
                  instrumentVersion={`super-neuropad-${SUPER_NEUROPAD_VERSION}`}
                  patientAge={`${session.ageYears} anos`}
                  applicationDate={session.finishedAt ?? session.startedAt}
                  responses={patientRecord}
                  onSaved={() => setResultKept(true)}
                />
              </Suspense>
            </div>
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
                    <div className="mt-1 text-xs"><span className="font-black">Esperado:</span> {answer.expected} · <span className="font-black">Registrado:</span> <span className={`snp-answer snp-answer--${ANSWER_TONE[answer.status]}`} data-answer-tone={ANSWER_TONE[answer.status]}>{answer.given}</span> · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""} · {ORIGIN_LABELS[answer.origin]}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {summary.phases.map((entry) => (
              <details key={entry.phase.id} className="snp-panel p-4" open={entry.level !== "esperado" || !entry.applied}>
                <summary className="snp-pixel cursor-pointer text-xs">{entry.phase.emoji} Mundo {entry.phase.order} · {entry.phase.name} · {phaseStatusText(entry, summary.complete)}</summary>
                <ol className="mt-3 space-y-2">
                  {entry.answers.map((answer, index) => (
                    <li key={answer.itemId} className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-paper-fixed)] p-3 text-sm text-[var(--snp-ink-fixed)]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-bold">{index + 1}. {answer.prompt}</div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                      </div>
                      <div className="mt-1 text-xs opacity-80">{ORIGIN_LABELS[answer.origin]} · {KIND_LABELS[answer.kind]} · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""}{answer.via === "gesto" ? " · por gesto/apontar" : ""}</div>
                      <div className="mt-1 text-xs"><span className="font-black">Esperado:</span> {answer.expected} · <span className="font-black">Registrado:</span> <span className={`snp-answer snp-answer--${ANSWER_TONE[answer.status]}`} data-answer-tone={ANSWER_TONE[answer.status]}>{answer.given}</span></div>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>

          {summary.complete && (<p className="text-xs font-semibold leading-relaxed opacity-80">
            Faixas operacionais autorais: por mundo ({summary.phases[0].total} desafios), {cutText(summary.phases[0].total)}; no total ({summary.total}), {cutText(summary.total, "total")}. Recusa e não resposta contam como não acertadas e ficam registradas à parte. Item lento = 2 vezes a mediana da própria partida (mínimo 12 s). {SUPER_NEUROPAD_NATURE}
          </p>)}
        </section>
      )}
    </div>
  );
}

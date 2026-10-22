import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, ClipboardList, Copy, Download, Eye, Flag, Music, Music2, Pause, Play, RotateCcw, ShieldCheck, SkipForward, Sparkles, Undo2 } from "lucide-react";
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
import { ClinicalCircuit, type ProgressoCircuito } from "@/features/super-neuropad/ClinicalCircuit.tsx";
import { VisualSearchBonusPanel } from "@/features/super-neuropad/VisualSearchBonusPanel";
import { resumoDaBateria } from "@/features/super-neuropad/sufficiencia";
import { DESAFIOS_DISPONIVEIS_POR_IDADE, pendentesDeCopia, registrarOpcional, textoOpcionais, type RegistrosOpcionais } from "@/features/super-neuropad/extensao";
import { buildGameDocSpec, issuerLines } from "@/features/super-neuropad/pdf";
import { DESCRIPTIVE_NOTICE } from "@/lib/descriptiveNotice";
import { buildFamilyDocSpec, buildFamilySummary, snapshotCompletedFamilySession, isValidFamilyEmail, type FamilyContact } from "@/features/super-neuropad/familyDelivery";
import { formatPhoneNumber, isValidPhone } from "@/lib/phoneBr";
import { openEmailDraft, shareWhatsAppDocument } from "@/lib/shareText";
import { CHARACTERS, GESTURE_SHORTCUT, KIND_LABELS, MAX_AGE_YEARS, MIN_AGE_YEARS, OBSERVATION_CHIPS, OBSERVATIONS_MAX, ORIGIN_LABELS, PHASE_ORDER, PHASES, SKIP_REASONS, STATUS_LABELS, ANSWER_TONE, SUPER_NEUROPAD_NATURE, SUPER_NEUROPAD_SOURCES, SUPER_NEUROPAD_TITLE, SUPER_NEUROPAD_VERSION, UNDER_TWO_MESSAGE, YEARS, ageGate, bandItemCount, bandForYears, buildGameBrief, buildGameReport, buildPatientRecordItems, provenanceText, timeMarginSeconds, sessionStats, statsLines, estimateBandSeconds, formatDuration, itemsFor, judgeShortcut, phaseById, sessionLimitSeconds, phaseStatusText, recordBuild, recordJudged, recordTouch, sessionWallSeconds, optionOrder, touchOrdinal, summarize, undoLastAnswer, type AnswerRecord, type AnswerStatus, type Character, type GameSession, type PhaseId, type PhaseSummary, type SkippedPhase } from "@/features/super-neuropad/model";
import { ArcadeButton, RepeatToggle, TurnCue, TouchStage, MissBar, JudgeStage, BuildStage } from "@/features/super-neuropad/estimulos";
import { OpcionaisPanel } from "@/features/super-neuropad/OpcionaisPanel";
import "@/styles/super-neuropad-arcade.css";

// "Salvar em paciente" é o mesmo fluxo das demais escalas; carrega só na tela de resultado.
const LazySaveToPatient = lazy(() =>
  import("@/components/SaveToPatient").then(({ SaveToPatient: Component }) => ({ default: Component })),
);

const XP_PER_ITEM = 10;
const CHEERS = ["+10 XP!", "Anotado, próxima!", "Boa, vamos em frente!", "Mais um passo!", "Moeda coletada!"] as const;
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


const STATUS_TONE: Record<AnswerStatus, string> = {
  acerto: "bg-emerald-600 text-white",
  erro: "bg-rose-600 text-white",
  sem_resposta: "bg-slate-600 text-white",
  recusa: "bg-amber-800 text-white",
};

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

function PhaseTrail({ current, done, character, years }: { current: number; done: boolean[]; character: Character; years?: number }) {
  const phases = PHASE_ORDER.map((id) => phaseById(id, years));
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label={`Trilha dos mundos: ${done.filter(Boolean).length} de ${PHASES.length} concluídos`}>
      {phases.map((phase, index) => {
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

function Hud({ years, character, answered, total, phaseIndex, done, musicOn, paused, canPause, canUndo, canFinish, onToggleMusic, onUndo, onPause, onFinish, onRestart }: {
  years?: number; character: Character; answered: number; total: number; phaseIndex: number; done: boolean[]; musicOn: boolean; paused: boolean; canPause: boolean; canUndo: boolean; canFinish: boolean;
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
        <PhaseTrail current={phaseIndex} done={done} character={character} years={years} />
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
      <BadgeShelf done={done} years={years} />
    </div>
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

function BadgeShelf({ done, years }: { done: boolean[]; years?: number }) {
  const earned = PHASE_ORDER.map((id) => phaseById(id, years)).filter((_, index) => done[index]);
  if (earned.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`Conquistas: ${earned.length} de ${PHASES.length}`}>
      {earned.map((phase) => <li key={phase.id} className="snp-chip bg-[var(--snp-sun-tint)]" title={phase.badge}>🏅 {phase.badge}</li>)}
    </ul>
  );
}

/** Aviso do circuito clínico obrigatório, repetido nas telas do fluxo. Leva ao circuito; não trava nada. */
function CircuitoObrigatorioAviso({ circuito }: { circuito: ProgressoCircuito | null }) {
  if (!circuito) return null;
  return (
    <button type="button" data-testid="super-neuropad-circuit-required"
      onClick={() => document.getElementById("snp-clinical-circuit")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className={`snp-chip inline-flex min-h-11 items-center gap-2 ${circuito.completo ? "bg-[var(--snp-grass-tint)]" : "bg-[var(--snp-sun-tint)]"}`}>
      🩺 Circuito clínico obrigatório: {circuito.concluidas}/{circuito.total} missões concluídas · {circuito.completo ? "completo" : "incompleto"} — abrir
    </button>
  );
}

function SetupSteps({ hasAge, hasHero, kitDone, kitTotal, circuito }: { hasAge: boolean; hasHero: boolean; kitDone: number; kitTotal: number; circuito: ProgressoCircuito | null }) {
  const steps = [
    { label: "Idade", ok: hasAge },
    { label: "Herói", ok: hasHero },
    { label: circuito ? `Circuito clínico ${circuito.concluidas}/${circuito.total}` : "Circuito clínico", ok: Boolean(circuito?.completo) },
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
  const [circuito, setCircuito] = useState<ProgressoCircuito | null>(null);
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
  /** Desafios opcionais por idade: trocar a idade não apaga os registros; "Nova partida" pergunta antes. */
  const [opcionais, setOpcionais] = useState<Record<number, RegistrosOpcionais>>({});
  /** Retrato de cada cópia confirmada: resposta dada durante a cópia continua pendente. */
  const [opcionaisCopiados, setOpcionaisCopiados] = useState<Record<number, RegistrosOpcionais>>({});
  const opcionaisPendentes = Object.entries(opcionais).reduce((sum, [years, registros]) => sum + pendentesDeCopia(registros, opcionaisCopiados[Number(years)] ?? {}), 0);
  // A partida só existe em memória (privacidade): avisa antes de recarregar/fechar com partida em andamento
  // ou com resultado ainda não copiado, baixado ou salvo.
  const leaveGuard = screen === "intro" || screen === "play" || screen === "phase-done" || (screen === "results" && !resultKept) || opcionaisPendentes > 0;
  useEffect(() => {
    if (!leaveGuard) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [leaveGuard]);
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
  const phase = phaseById(phaseId, ageYears ?? undefined);
  const items = band ? itemsFor(band.id, phaseId) : [];
  const item = items[itemIndex];
  const touchOrder = useMemo(
    () => (band && item && item.kind === "toque" ? optionOrder(item, seed + itemIndex * 17 + phaseIndex * 101, touchOrdinal(band.id, phaseId, item.id)) : []),
    [band, item, seed, itemIndex, phaseIndex, phaseId],
  );
  const done = PHASE_ORDER.map((id) => band ? answers.filter((answer) => answer.phaseId === id).length >= itemsFor(band.id, id).length : false);
  const totalItems = band ? bandItemCount(band.id) : 0;
  const estimate = band ? estimateBandSeconds(band.min) : null;
  const dirty = answers.length > 0 || opcionaisPendentes > 0;
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

  // Durante a partida a barra inferior do app e o botão de ajuda cobriam "Acertou/Errou" no celular.
  // O CSS (flow-os.css) esconde os dois enquanto esta classe estiver no <body>; fora da partida voltam.
  useEffect(() => {
    document.body.classList.toggle("np-task-running", screen === "play");
    return () => document.body.classList.remove("np-task-running");
  }, [screen]);

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
    // Repetir com a mesma criança deve rearmar o envio; "done" vale só para a partida anterior.
    const contactValid = Boolean(familyContact && (isValidFamilyEmail(familyContact.email) || isValidPhone(familyContact.phone)));
    setFamilyDeliveryStatus(contactValid ? "ready" : "");
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
    if (opcionaisPendentes > 0 && !window.confirm(`${opcionaisPendentes} desafio(s) opcional(is) registrado(s) ainda não foram copiados. A nova partida apaga esses registros. Continuar?`)) return;
    softTap();
    music.current?.stop();
    setOpcionais({});
    setOpcionaisCopiados({});
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

  function finishGame(finalAnswers: AnswerRecord[] = answers, finalSkipped: GameSession["skipped"] = skipped) {
    if (pausedAt.current !== null) { pausedMs.current += performance.now() - pausedAt.current; pausedAt.current = null; }
    const closedAt = new Date().toISOString();
    finishedAt.current = closedAt;
    // A última resposta e o último mundo pulado ainda não chegaram ao render do React.
    const deliverySnapshot = session ? snapshotCompletedFamilySession(
      { ...session, pausedSeconds: Math.round(pausedMs.current / 1000) }, closedAt, finalAnswers, finalSkipped,
    ) : null;
    playFlagPole();
    celebrate();
    music.current?.stop();
    setPaused(false);
    setScreen("results");
    if (familyContact && familyDeliveryStatus === "ready" && deliverySnapshot) void deliverToFamily(familyContact, deliverySnapshot);
  }

  /** Encaminhamento automático ao encerrar: PDF familiar baixa, WhatsApp abre com o resumo e o e-mail abre em rascunho.
   *  Nada é transmitido a servidor: o envio final é confirmado pela aplicadora no próprio cliente. */
  async function deliverToFamily(contact: FamilyContact, deliveredSession: GameSession) {
    const appliedAt = formatClinicalDateTime(new Date(deliveredSession.finishedAt ?? deliveredSession.startedAt));
    const baseName = `super-neuropad-familia-${deliveredSession.bandId}-${localIsoDate(new Date(deliveredSession.startedAt))}`;
    const summaryText = buildFamilySummary(deliveredSession, contact);
    try {
      const { buildDocumentPdf } = await import("@/lib/documentPdf");
      const bytes = await buildDocumentPdf(buildFamilyDocSpec(deliveredSession, issuerLines(issuer, issuerCredentials(issuer)), appliedAt));
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
          subject: `${SUPER_NEUROPAD_TITLE} — resumo da aventura (${summarize(deliveredSession).band.label})`,
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
    finishGame(next);
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
    const nextSkipped = [...skipped.filter((entry) => entry.phaseId !== phaseId), { phaseId, reason }];
    setSkipped(nextSkipped);
    if (phaseIndex + 1 < PHASE_ORDER.length) {
      setPhaseIndex(phaseIndex + 1);
      setItemIndex(0);
      setScreen("intro");
      return;
    }
    finishGame(answers, nextSkipped);
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
        ? "Contagem bruta e cada item com critério de acerto, resposta registrada e tempo."
        : "Registro da partida incompleta: o que foi respondido e o que ficou sem registro." });
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

  function registrarOpcionalDaIdade(years: number, record: AnswerRecord) {
    setOpcionais((current) => ({ ...current, [years]: registrarOpcional(current[years] ?? {}, record) }));
  }

  /** Copia o retrato do momento do toque; só esse retrato passa a contar como copiado. */
  async function copiarOpcionais(years: number) {
    const retrato = opcionais[years] ?? {};
    const texto = textoOpcionais(years, retrato, formatClinicalDateTime(new Date()));
    const filename = `super-neuropad-opcionais-${years}-${localIsoDate(new Date())}`;
    try {
      await navigator.clipboard.writeText(texto);
      toast({ title: "Registro dos opcionais copiado", description: "Texto na área de transferência." });
    } catch {
      downloadTextDocument(texto, `${safeTextFilename(filename)}.txt`);
      toast({ title: "Opcionais baixados em TXT", description: "A área de transferência não estava disponível." });
    }
    setOpcionaisCopiados((current) => ({ ...current, [years]: retrato }));
  }

  const summary = session ? summarize(session) : null;
  const resumoBateria = summary ? resumoDaBateria(summary) : null;
  const wallSeconds = session ? sessionWallSeconds(session) : null;
  const patientRecord = session && screen === "results" ? buildPatientRecordItems(session) : [];
  const missedAnswers = session && screen === "results" ? session.answers.filter((answer) => answer.status !== "acerto") : [];
  const stats = session && screen === "results" ? sessionStats(session) : null;
  // Fora da preparação o cabeçalho encolhe: o desafio precisa caber na tela virada para a criança.
  const compact = screen !== "setup";

  return (
    <div ref={rootRef} className="snp scroll-mt-20 space-y-5 pb-8 lg:scroll-mt-4" data-testid="super-neuropad-game" data-screen={screen} data-age-style={ageYears !== null && ageYears >= 13 ? "adolescente" : "infantil"} data-age-theme={ageYears === null ? "neutro" : ageYears <= 3 ? "primeiros-passos" : ageYears <= 7 ? "exploracao" : ageYears <= 12 ? "estrategia" : "autonomia"}>
      <header className={`snp-panel snp-scanlines snp-sky-bg relative overflow-hidden ${compact ? "px-4 py-3" : "p-5 sm:p-6"}`}>
        {!compact && <Clouds />}
        <div className="relative flex items-center gap-3">
          <div className={`snp-sprite flex shrink-0 items-center justify-center rounded-2xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-sun)] ${compact ? "h-10 w-10 text-xl" : "h-14 w-14 text-3xl"}`} aria-hidden="true">🎮</div>
          <div className="min-w-0 flex-1 text-[var(--snp-stage-text)]">
            {!compact && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="snp-chip">pré-consulta · aplicadora com a criança · {MIN_AGE_YEARS}–{MAX_AGE_YEARS} anos</span>
                <span className="snp-chip">v{SUPER_NEUROPAD_VERSION}</span>
                <span className="snp-chip">{PHASES.length} mundos · 3–6 desafios cada</span>
                <span className="snp-chip">{DESAFIOS_DISPONIVEIS_POR_IDADE} disponíveis por idade com os opcionais</span>
                <span className="snp-chip">até 20 min (12 min aos 2 anos, 15 min aos 3)</span>
                <span className="snp-chip">sem câmera · sem material externo</span>
              </div>
            )}
            <h1 className={`snp-pixel snp-title text-[var(--snp-paper-fixed)] ${compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>{SUPER_NEUROPAD_TITLE}</h1>
            {!compact && (
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed">
                Avaliação única de pré-consulta: seis mundos que integram Sonda 10, Observa 10 (OBS-10), Reconhecimento Visual e Avaliação Cognitiva Infantil, com desafios para cada ano de idade. Cada desafio tem certo e errado; a criança só vê XP, moedas e conquistas. Ao final, contagem bruta por mundo, respostas item a item e PDF detalhado. Registro descritivo; sem classificação. Interpretação a cargo do profissional.
              </p>
            )}
          </div>
        </div>
      </header>

      {screen === "setup" && (
        <section className="space-y-5">
          <div className="snp-panel snp-panel--soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <SetupSteps hasAge={Boolean(band)} hasHero={Boolean(character)} kitDone={band ? band.ambient.filter((entry) => kitChecked[entry]).length : 0} kitTotal={band?.ambient.length ?? 0} circuito={circuito} />
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
                <span className="font-bold opacity-70">· {totalItems} desafios em {PHASES.length} mundos · cerca de {Math.ceil(estimate.minutes)} minutos (máximo {Math.round(sessionLimitSeconds(band.min) / 60)})</span>
                {band.min <= 3 && <span className="snp-chip bg-[var(--snp-sun-tint)]">Bateria dedicada de 2–3 anos: um domínio por mundo, itens de relato do cuidador, respostas por gesto aceitas, pausa rápida à vontade</span>}
              </div>
            )}
            {band && estimate && (
              <div className="mt-2 space-y-1 text-xs font-semibold opacity-80" data-testid="super-neuropad-provenance">
                <p>{provenanceText(band.min)}</p>
                <p data-testid="super-neuropad-time-margin">Limite da sessão: {Math.round(sessionLimitSeconds(band.min) / 60)} min; tempo estimado: {formatDuration(estimate.totalSeconds)} (diferença {timeMarginSeconds(band.min)} s).</p>
              </div>
            )}
          </div>

          {band && <CircuitoObrigatorioAviso circuito={circuito} />}

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

          {band && (
            <OpcionaisPanel key={band.min} years={band.min} registros={opcionais[band.min] ?? {}} copiados={opcionaisCopiados[band.min] ?? {}} seed={seed}
              onRegistrar={(record) => registrarOpcionalDaIdade(band.min, record)} onCopiar={() => void copiarOpcionais(band.min)} />
          )}

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
          years={ageYears ?? undefined}
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
                  <TouchStage key={item.id} item={item} paused={paused} order={touchOrder} onAnswer={(chosen, event) => submitAnswer(recordTouch(item, phaseId, chosen, elapsedSeconds(), repeated, false, touchOrder), event)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <RepeatToggle repeated={repeated} onToggle={() => setRepeated((current) => !current)} />
                    <MissBar onMiss={(status, event) => submitAnswer(recordTouch(item, phaseId, null, elapsedSeconds(), repeated, status === "recusa", touchOrder), event)} />
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
          <p className="mt-1 text-base font-bold opacity-90">{character.name} {character.role} chegou ao mundo {phaseIndex + 2}.</p>
          <div className="mt-4"><SpeechBubble character={character} text={HERO_LINES[character.id]?.done ?? "Conquista no bolso!"} /></div>
          <div className="mt-4 flex justify-center"><CircuitoObrigatorioAviso circuito={circuito} /></div>
          <ArcadeButton tone="sun" className="mt-5 px-6 py-3 text-base" onClick={nextPhase}>
            Próximo mundo: {phaseById(PHASE_ORDER[phaseIndex + 1], ageYears ?? undefined).emoji} {phaseById(PHASE_ORDER[phaseIndex + 1], ageYears ?? undefined).name}
          </ArcadeButton>
        </section>
      )}

      {screen === "results" && summary && session && (
        <section className="space-y-4">
          <div className="snp-panel snp-scanlines snp-panel--sun p-6 text-center">
            <div className="snp-bounce text-6xl" aria-hidden="true">{summary.complete ? "🏆" : "🚩"}</div>
            <h2 className="snp-pixel mt-2 text-2xl sm:text-3xl">{summary.complete ? "Aventura concluída!" : "Aventura encerrada antes do fim"}</h2>
            <p className="text-base font-bold">{summary.character.emoji} {summary.character.name} {summary.character.role} · {answers.length * XP_PER_ITEM} XP · {done.filter(Boolean).length} conquistas</p>
            <div className="mt-3 flex justify-center"><BadgeShelf done={done} years={summary.band.min} /></div>
            <p className="mt-3 text-xs font-black opacity-80">Aplicadora: vire a tela para você. O que vem abaixo é o registro objetivo.</p>
            <p className="mt-1 text-xs font-bold opacity-80" data-testid="super-neuropad-when">
              {formatClinicalDateTime(new Date(session.finishedAt ?? session.startedAt))} · {summary.band.label} (faixa anual)
              {wallSeconds !== null ? ` · sessão de ${formatDuration(wallSeconds)}` : ""} · tarefas {formatDuration(summary.durationSeconds)} · {session.pauseCount ?? 0} pausa(s)
              {(session.pausedSeconds ?? 0) > 0 ? ` (${formatDuration(session.pausedSeconds ?? 0)} em pausa)` : ""}
            </p>
          </div>

          <div className="flex justify-center"><CircuitoObrigatorioAviso circuito={circuito} /></div>

          <div className="snp-panel snp-panel--soft p-5" data-testid="super-neuropad-incomplete">
            <div className="snp-pixel text-[11px] opacity-80">Registro de respostas · {summary.band.label} · {summary.complete ? "partida completa" : `partida incompleta (${session.answers.length} de ${summary.total} itens)`}</div>
            <div className="mt-1 text-3xl font-black">{summary.hits} de {summary.total} acertos</div>
            <div className="mt-1 text-xs font-semibold opacity-80">Tempo somado nas tarefas: {formatDuration(summary.durationSeconds)} · {DESCRIPTIVE_NOTICE}</div>
          </div>

          {stats && (<div className="snp-panel p-5" data-testid="super-neuropad-reading">
            <div className="snp-pixel flex items-center gap-2 text-xs"><ClipboardList className="h-4 w-4" /> Aspectos da aplicação e da resposta</div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm font-semibold leading-relaxed">
              {statsLines(session).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>)}

          {summary.domains.length > 0 && (
            <div className="snp-panel snp-panel--soft p-4" data-testid="super-neuropad-toddler-domains">
              <div className="snp-pixel text-xs">Contagem por domínio (bateria 2–3 anos)</div>
              <ul className="mt-1 space-y-1 text-sm font-semibold">{summary.domains.map((entry) => <li key={entry.domain}>{entry.label}: {entry.hits}/{entry.total} cumpre{entry.caregiverItems ? ` · ${entry.caregiverItems} por relato do cuidador` : ""}</li>)}</ul>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="super-neuropad-domains">
            {summary.phases.map((entry) => (
              <div key={entry.phase.id} className="snp-panel snp-panel--soft p-4">
                <div className="text-2xl" aria-hidden="true">{entry.phase.emoji}</div>
                <div className="snp-pixel text-[11px]">{entry.phase.name}</div>
                <div className="text-[11px] font-semibold opacity-80">{entry.phase.domain}</div>
                <div className="mt-2 text-2xl font-black">{entry.applied ? `${entry.hits}/${entry.total}` : "—"}</div>
                <div className="mt-1"><PhaseMeter phase={entry} /></div>
                <div className="mt-1 text-xs font-black">{entry.skipReason ? `Não aplicado — ${entry.skipReason}` : entry.applied ? "Registrado" : "Não aplicado"}</div>
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
                  <div className="text-xs font-semibold opacity-80">{origin.planned} desafio(s) em {origin.phases.map((id) => phaseById(id, summary.band.min).name).join(", ")} · registrados {origin.applied} · acertos {origin.hits}</div>
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

          <OpcionaisPanel key={session.ageYears} years={session.ageYears} registros={opcionais[session.ageYears] ?? {}} copiados={opcionaisCopiados[session.ageYears] ?? {}} seed={seed}
            onRegistrar={(record) => registrarOpcionalDaIdade(session.ageYears, record)} onCopiar={() => void copiarOpcionais(session.ageYears)} />

          {missedAnswers.length > 0 && (
            <div className="snp-panel p-5">
              <div className="snp-pixel text-xs">Itens registrados como não acertados · {missedAnswers.length}</div>
              <ul className="mt-3 space-y-2">
                {missedAnswers.map((answer) => (
                  <li key={answer.itemId} className="rounded-xl border-[3px] border-[var(--snp-ink-fixed)] bg-[var(--snp-paper-fixed)] p-3 text-sm text-[var(--snp-ink-fixed)]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-bold">{phaseById(answer.phaseId, summary.band.min).emoji} {answer.prompt}</div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                    </div>
                    <div className="mt-1 text-xs"><span className="font-black">Critério de acerto:</span> {answer.expected} · <span className="font-black">Registrado:</span> <span className={`snp-answer snp-answer--${ANSWER_TONE[answer.status]}`} data-answer-tone={ANSWER_TONE[answer.status]}>{answer.given}</span> · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""} · {ORIGIN_LABELS[answer.origin]}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {summary.phases.map((entry) => (
              <details key={entry.phase.id} className="snp-panel p-4" open={entry.hits < entry.total || !entry.applied}>
                <summary className="snp-pixel cursor-pointer text-xs">{entry.phase.emoji} Mundo {entry.phase.order} · {entry.phase.name} · {phaseStatusText(entry, summary.complete)}</summary>
                <ol className="mt-3 space-y-2">
                  {entry.answers.map((answer, index) => (
                    <li key={answer.itemId} className="rounded-xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-paper-fixed)] p-3 text-sm text-[var(--snp-ink-fixed)]">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-bold">{index + 1}. {answer.prompt}</div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black ${STATUS_TONE[answer.status]}`}>{STATUS_LABELS[answer.status]}</span>
                      </div>
                      <div className="mt-1 text-xs opacity-80">{ORIGIN_LABELS[answer.origin]} · {KIND_LABELS[answer.kind]} · {answer.seconds} s{answer.repeated ? " · comando repetido 1x" : ""}{answer.via === "gesto" ? " · por gesto/apontar" : ""}</div>
                      <div className="mt-1 text-xs"><span className="font-black">Critério de acerto:</span> {answer.expected} · <span className="font-black">Registrado:</span> <span className={`snp-answer snp-answer--${ANSWER_TONE[answer.status]}`} data-answer-tone={ANSWER_TONE[answer.status]}>{answer.given}</span></div>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </div>

          <p className="text-xs font-semibold leading-relaxed opacity-80">
            {provenanceText(summary.band.min)} Recusa e não resposta contam como não acertadas e ficam registradas à parte. {SUPER_NEUROPAD_NATURE}
          </p>
        </section>
      )}
      {/* Circuito clínico obrigatório: fica montado e em memória durante o jogo e aparece na preparação,
          entre os mundos e nos resultados. A troca de idade ou paciente descarta os registros via key. */}
      {ageYears !== null && (
        <VisualSearchBonusPanel key={ageYears} years={ageYears}
          visible={screen === "setup" || screen === "phase-done" || screen === "results"} />
      )}
      <ClinicalCircuit key={ageYears ?? "sem-idade"} years={ageYears} visible={screen === "setup" || screen === "phase-done" || screen === "results"} bateria={resumoBateria} onProgresso={setCircuito} />
    </div>
  );
}

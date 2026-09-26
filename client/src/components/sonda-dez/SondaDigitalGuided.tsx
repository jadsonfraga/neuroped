import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Eye,
  GraduationCap,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DEFAULT_HERO,
  HeroGrid,
  MissionTrail,
  StarCounter,
  type Hero,
} from "@/components/aventura";
import {
  DIGITAL_VERSION,
  DIGITAL_NATURE,
  DIGITAL_LIMIT,
  PREPARATION,
  CONFOUNDERS,
  TRAINING_CASES,
  NOVICE_STEPS,
  digitalBandForMonths,
  physicalFieldReason,
  type ActivitySpec,
  type DigitalMission,
  digitalAgeContext,
} from "@/data/sondaDezDigital";
import { SONDA_DEZ_RESPONSE_LADDER } from "@/data/sondaDezCanonical";
import {
  buildDigitalReport,
  buildDigitalHandoff,
  INTERACTION_LABELS,
  withRunHistory,
  emptyRecord,
  fieldGuidance,
  markMissionUnavailable,
  recordProblems,
  sequenceMetrics,
  recordedGridMetrics,
  derivedCounts,
  synchronizeCounts,
  observedResponses,
  responseOptions,
  recordObservedResponse,
  type DigitalRecord,
  type StepRun,
} from "@/lib/sondaDezSession";
import { playSondaTone } from "@/lib/sondaDezAudio";
import SondaDigitalActivity from "./SondaDigitalActivity";
import { useSondaExitGuard } from "@/hooks/useSondaExitGuard";
import EasyGame, { type EasyStep } from "@/components/jogo-facil/EasyGame";
import { buildObjectiveSteps, objectiveNature } from "@/components/jogo-facil/ObjectiveStep";
import { OBJECTIVE_MAX_YEARS, OBJECTIVE_MIN_YEARS, objectiveBandForYears } from "@/components/jogo-facil/objectiveBank";

type Phase = "prepare" | "learn" | "run" | "report";
type Track = "easy" | "guided" | "direct";
export const DIRECT_TRACK_NOTE =
  "Modo direto: guia de primeira aplicação, conferência de preparo e ensaio dispensados pela aplicadora experiente";
const TRACKS: { id: Track; label: string; hint: string }[] = [
  {
    id: "easy",
    label: "🎮 Modo Fácil · joguinho",
    hint: "Tudo na tela, de 1 a 19 anos: a criança toca, o jogo registra e Próximo libera o item seguinte. Certo/errado no fim.",
  },
  {
    id: "guided",
    label: "Guia de primeira aplicação",
    hint: "Preparar, ensaiar, aplicar e revisar, do acolhimento à entrega.",
  },
  {
    id: "direct",
    label: "Direto ao teste",
    hint: "Aplicadora experiente: informe a idade e inicie a aplicação.",
  },
];
const FLAGS = [
  "Perda de habilidade referida pela família",
  "Evento paroxístico observado",
  "Assimetria ou marcha incomum observada",
  "Auto/heteroagressão observada",
  "Sofrimento ou recusa persistente",
];
const PRACTICES: { title: string; spec: ActivitySpec }[] = [
  {
    title: "1. Treinar seleção e relação",
    spec: { kind: "objects", items: ["sol", "lua", "caixa"] },
  },
  {
    title: "2. Treinar apresentação e resposta",
    spec: {
      kind: "sequence",
      items: ["sol", "lua", "sol", "lua"],
      target: "sol",
      intervalMs: 2500,
    },
  },
  {
    title: "3. Treinar marcação e desmarcação",
    spec: {
      kind: "grid",
      items: ["⊙", "○", "□", "⊙"],
      target: "⊙",
      durationSeconds: 5,
    },
  },
];
function initialRecord(mission: DigitalMission): DigitalRecord {
  const record = emptyRecord();
  for (const field of mission.fields) {
    const reason = physicalFieldReason(mission.id, field.id);
    if (reason) {
      record.values[field.id] = "NA";
      record.reasons[field.id] = reason;
    }
  }
  return record;
}
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export default function SondaDigitalGuided({
  onLegacy,
}: {
  onLegacy: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("prepare");
  const [track, setTrack] = useState<Track>("guided");
  const direct = track === "direct";
  const easy = track === "easy";
  const [easyProgress, setEasyProgress] = useState(0);
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("0");
  const [code, setCode] = useState("");
  const [operator, setOperator] = useState("");
  const [school, setSchool] = useState("");
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [confounders, setConfounders] = useState<string[]>([]);
  const [flags, setFlags] = useState<string[]>([]);
  const [sound, setSound] = useState<"unchecked" | "heard" | "visual">(
    "unchecked",
  );
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [message, setMessage] = useState("");
  const [quiz, setQuiz] = useState<Record<number, string>>({});
  const [practiced, setPracticed] = useState<Record<number, boolean>>({});
  const [missionIndex, setMissionIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [read, setRead] = useState(false);
  const [records, setRecords] = useState<Record<string, DigitalRecord>>({});
  const [active, setActive] = useState<{
    spec: ActivitySpec;
    practiceIndex?: number;
    stepIndex?: number;
    initialPlan?: string[];
  } | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [skipReason, setSkipReason] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [startedAt, setStartedAt] = useState("");
  const [familiarizations, setFamiliarizations] = useState<string[]>([]);
  // Camada de aventura: herói e celebração entre missões. Não é dado clínico,
  // não entra no registro e não persiste. Estrelas = missões fechadas
  // (participação), nunca código de resposta.
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  const [cheer, setCheer] = useState<{ mission: number } | null>(null);
  const ageValid =
    /^\d+$/.test(years) && /^\d+$/.test(months) && Number(months) <= 11;
  const ageMonths = ageValid ? Number(years) * 12 + Number(months) : NaN;
  const band = useMemo(() => digitalBandForMonths(ageMonths), [ageMonths]);
  const mission = band?.missions[missionIndex];
  const current = mission
    ? (records[mission.id] ?? initialRecord(mission))
    : emptyRecord();
  const currentStep = mission?.steps[stepIndex];
  const stepResponses = currentStep ? observedResponses(currentStep.activity, current.runs[stepIndex]) : {};
  const trained =
    TRAINING_CASES.every((q, i) => quiz[i] === q.answer) &&
    PRACTICES.every((_, i) => practiced[i]);
  const ready = direct
    ? Boolean(band)
    : Boolean(band) &&
      PREPARATION.every((_, i) => checks[i]) &&
      sound !== "unchecked";
  const problems = mission ? recordProblems(mission, current) : [];
  const counts = mission ? derivedCounts(mission, current) : {};
  const missionDone =
    band?.missions.map((m) => recordProblems(m, records[m.id]).length === 0) ?? [];
  const completedCount = missionDone.filter(Boolean).length;
  const dirty = phase === "run" || phase === "report" || Object.keys(records).length > 0 || Boolean(code || operator || school) || easyProgress > 0;
  // Um Voltar do navegador que pouse em /login enquanto a sessão continua válida
  // não é a sessão forçando a saída: aquela página devolve o profissional
  // autenticado sozinha, e sem o prompt aqui o registro em curso se perde.
  useSondaExitGuard(dirty);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [phase]);
  useEffect(() => {
    if (phase !== "run" || paused) return;
    let previous = performance.now();
    let remainder = 0;
    const interval = setInterval(() => {
      const now = performance.now();
      remainder += now - previous;
      previous = now;
      const whole = Math.floor(remainder / 1000);
      if (whole) {
        setElapsed((s) => s + whole);
        remainder -= whole * 1000;
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase, paused]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden && phase === "run") {
        setPaused(true);
        setMessage(
          "Aplicação pausada porque a tela ficou oculta. Revise a oportunidade antes de continuar.",
        );
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [phase]);
  function updateRecord(change: (record: DigitalRecord) => DigitalRecord) {
    if (!mission) return;
    setRecords((old) => ({
      ...old,
      [mission.id]: synchronizeCounts(mission, change(old[mission.id] ?? initialRecord(mission))),
    }));
    setCopied(false);
  }
  function saveRun(run: StepRun) {
    const step = active?.stepIndex;
    if (active?.practiceIndex !== undefined) {
      const i = active.practiceIndex;
      if (phase === "run") {
        setFamiliarizations((old) => [
          ...old,
          `${mission?.title}: ${PRACTICES[i].title}; ${run.status === "complete" ? "concluída" : "interrompida"}`,
        ]);
        setMessage(
          "Familiarização encerrada; os toques do ensaio não entram nas respostas. Registre dificuldade ou mediação nas notas e use Retomar quando houver condição.",
        );
        setActive(null);
        return;
      }
      const demonstrated =
        i === 0
          ? run.events.some((e) => e.type === "relação")
          : i === 1
            ? run.events.some((e) => e.type === "toque")
            : run.events.some(
                (e) =>
                  e.type === "marcação" && e.value.includes('"selected":false'),
              );
      if (run.status === "complete" && demonstrated) {
        setPracticed((old) => ({ ...old, [i]: true }));
        setMessage(
          "Controle praticado. Os eventos do ensaio foram descartados.",
        );
      } else
        setMessage(
          "Repita o ensaio: mova uma figura para outra; na sequência use o botão de resposta; na grade marque e desmarque uma figura.",
        );
      setActive(null);
      return;
    }
    if (step !== undefined)
      updateRecord((r) => ({
        ...r,
        reviewed: false,
        runs: { ...r.runs, [step]: withRunHistory(r.runs[step], run) },
      }));
    if (run.status === "interrupted") {
      setPaused(true);
      setMessage(run.reason ?? "Estímulo interrompido.");
    }
    setActive(null);
  }
  function showStep() {
    if (!currentStep || paused) return;
    if (current.runs[stepIndex]?.status === "complete" &&
        !window.confirm("Esta etapa já foi apresentada. Repetir pode mudar a resposta por familiaridade; a tentativa anterior será preservada. Deseja reapresentar?")) return;
    let initialPlan: string[] | undefined;
    if (currentStep.activity.kind === "plan" && stepIndex > 0) {
      const event = current.runs[stepIndex - 1]?.events.findLast(
        (e) => e.type === "plano-final",
      );
      if (event) {
        try {
          const value: unknown = JSON.parse(event.value);
          if (Array.isArray(value) && value.every((v) => typeof v === "string"))
            initialPlan = value;
        } catch {
          setMessage("Plano anterior indisponível; registre a condição.");
        }
      }
    }
    setActive({ spec: currentStep.activity, stepIndex, initialPlan });
  }
  function nextStep() {
    if (!mission) return;
    setStepIndex((i) => Math.min(i + 1, mission.steps.length - 1));
    setRead(false);
    setSkipReason("");
    setCheer(null);
  }
  function goMission(i: number) {
    setMissionIndex(i);
    setStepIndex(0);
    setRead(false);
    setSkipReason("");
    setMessage("");
    setCopied(false);
    setCheer(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const reportContext = {
    code, operator, ageMonths, school,
    confounders: confounders
      .concat(sound === "visual" ? ["Aplicação sem som eletrônico"] : [])
      .concat(direct ? [DIRECT_TRACK_NOTE] : []),
    flags, elapsedSeconds: elapsed, familiarizations, startedAt,
  };
  const handoff = phase === "report" && band ? buildDigitalHandoff(band, records, reportContext) : "";
  const report =
    phase === "report" && band
      ? buildDigitalReport(band, records, reportContext)
      : "";
  async function copy(text = report) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text === report);
      setMessage(text === report ? "Registro copiado." : "Resumo factual copiado.");
    } catch {
      setCopied(false);
      setMessage(
        "Não foi possível copiar. Selecione o texto abaixo ou use Baixar registro.",
      );
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([report], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `sonda-dez-digital-${DIGITAL_VERSION}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function newSession(reuseTraining = false) {
    const keepTraining = reuseTraining && trained && Boolean(operator.trim());
    setRecords({});
    setPhase("prepare");
    setCode("");
    if (!keepTraining) setOperator("");
    setSchool("");
    setYears("");
    setMonths("0");
    setConfounders([]);
    setFlags([]);
    setChecks({});
    setSound("unchecked");
    setSoundPlayed(false);
    if (!keepTraining) { setQuiz({}); setPracticed({}); }
    setMissionIndex(0);
    setStepIndex(0);
    setElapsed(0);
    setRead(false);
    setPaused(false);
    setSkipReason("");
    setCopied(false);
    setMessage(keepTraining ? "Nova criança: dados clínicos anteriores apagados. Ensaio mantido apenas para esta aplicadora nesta aba; confirme novamente idade, ambiente e som. Trocar o código da aplicadora exige novo ensaio." : "");
    setConfirmNew(false);
    setFamiliarizations([]);
    setStartedAt("");
    setCheer(null);
  }
  const panel = "rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7";
  const trackTabs = (
    <div
      role="tablist"
      aria-label="Modo de aplicação"
      data-testid="sonda-track-tabs"
      className="mt-6 grid gap-2 sm:grid-cols-3"
    >
      {TRACKS.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={track === item.id}
          disabled={phase !== "prepare" || easyProgress > 0}
          data-testid={item.id === "easy" ? "sonda-easy-tab" : undefined}
          onClick={() => {
            setTrack(item.id);
            setMessage(
              item.id === "direct"
                ? "Modo direto: sem guia, checklist ou ensaio. Informe a idade e inicie. O registro declara que o preparo guiado foi dispensado."
                : item.id === "easy"
                  ? "Modo Fácil: informe a idade em anos, leia o enunciado e deixe a criança tocar na tela. O aplicativo registra certo ou errado; toque em Próximo para liberar cada novo item e veja o resultado no fim."
                  : "",
            );
          }}
          className={`rounded-xl border px-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60 ${track === item.id ? "border-primary bg-primary text-primary-foreground" : item.id === "easy" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" : "bg-background/80"}`}
        >
          <span className="block text-sm font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs opacity-90">{item.hint}</span>
        </button>
      ))}
    </div>
  );
  if (easy) {
    // Modo Fácil objetivo: dez itens do banco graduado (1 a 19 anos), todos na
    // tela. A criança toca, o aplicativo julga certo/errado e o jogo avança.
    // Nada da trilha clínica guiada entra aqui; nada pede objeto fora do app.
    const easyYears = /^\d+$/.test(years) ? Number(years) : NaN;
    const easyBand = objectiveBandForYears(easyYears);
    const easySteps: EasyStep[] = easyBand ? buildObjectiveSteps("sonda", easyYears, "sonda-easy") : [];
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 pb-16" data-testid="sonda-digital">
        <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-cyan-50 p-6 dark:to-cyan-950/20 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Sonda 10</Badge>
            <Badge variant="outline">Modo Fácil · joguinho</Badge>
            <Badge variant="outline">v{DIGITAL_VERSION}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Leia, a criança toca; Próximo libera o item seguinte.
          </h1>
          {trackTabs}
        </header>
        {message && (
          <p role="status" className="rounded-xl border bg-muted p-4 text-sm">
            {message}
          </p>
        )}
        {easyProgress === 0 && (
          <section className={panel} data-testid="sonda-easy-start">
            <h2 className="text-xl font-bold">Idade da criança</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-semibold">
                Idade em anos
                <Input type="number" min={OBJECTIVE_MIN_YEARS} max={OBJECTIVE_MAX_YEARS} value={years} onChange={(e) => setYears(e.target.value)} placeholder="Ex.: 4" />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Meses adicionais
                <Input type="number" min="0" max="11" value={months} onChange={(e) => setMonths(e.target.value)} />
              </label>
            </div>
            <p className="mt-3 text-sm" role="status">
              {easyBand ? `Faixa ${easyBand.label} · ${easySteps.length} itens na tela` : `Informe a idade em anos completos, de ${OBJECTIVE_MIN_YEARS} a ${OBJECTIVE_MAX_YEARS}.`}
            </p>
          </section>
        )}
        {easyBand && (
          <EasyGame
            key={`${easyBand.id}-${easySteps.length}`}
            testid="sonda-easy"
            title="Sonda 10"
            ageLabel={`${easyYears} anos · faixa ${easyBand.label}`}
            nature={objectiveNature("sonda")}
            footer={DIGITAL_LIMIT}
            steps={easySteps}
            objective
            onProgress={setEasyProgress}
          />
        )}
        <footer className="rounded-2xl border p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0" />{DIGITAL_NATURE}</p>
        </footer>
      </div>
    );
  }
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-5 pb-16"
      data-testid="sonda-digital"
    >
      <header className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-cyan-50 p-6 dark:to-cyan-950/20 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Sonda Dez</Badge>
          <Badge variant="outline">Aplicação digital guiada</Badge>
          <Badge variant="outline">v{DIGITAL_VERSION}</Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Tudo pronto para observar, passo a passo.
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          Prepare o ambiente, ensaie os controles e siga uma etapa por vez.
          Objetos, cenas, cartões e som estão no aplicativo. A interação com a
          criança continua sendo conduzida por você.
        </p>
        {trackTabs}
        <nav
          aria-label="Etapas da Sonda"
          className={`mt-4 grid grid-cols-2 gap-2 ${direct ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}
        >
          {(direct
            ? ([
                ["prepare", "Idade"],
                ["run", "Aplicar"],
                ["report", "Revisar"],
              ] as [Phase, string][])
            : ([
                ["prepare", "Preparar"],
                ["learn", "Ensaiar"],
                ["run", "Aplicar"],
                ["report", "Revisar"],
              ] as [Phase, string][])
          ).map(([p, label], i) => (
            <div
              key={p}
              aria-current={phase === p ? "step" : undefined}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${phase === p ? "border-primary bg-primary text-primary-foreground" : "bg-background/80"}`}
            >
              {i + 1}. {label}
            </div>
          ))}
        </nav>
      </header>
      {message && (
        <p role="status" className="rounded-xl border bg-muted p-4 text-sm">
          {message}
        </p>
      )}
      {!direct && (phase === "prepare" || phase === "learn" || phase === "run") && (
        <details
          className={panel}
          open={phase === "prepare" ? true : undefined}
        >
          <summary className="cursor-pointer text-lg font-bold">
            Guia da primeira aplicação — do acolhimento à entrega
          </summary>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            {NOVICE_STEPS.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
          <p className="mt-4 rounded-xl bg-muted p-3 text-sm">
            Este registro não é salvo automaticamente. Mantenha esta tela aberta
            durante a aplicação; antes de navegar para outra parte do
            aplicativo, revise e baixe o registro.
          </p>
        </details>
      )}
      {phase === "prepare" && (
        <div className={`grid gap-5 ${direct ? "" : "lg:grid-cols-[1.1fr_1fr]"}`}>
          <section className={panel} data-testid={direct ? "sonda-direct-start" : undefined}>
            <h2 className="text-xl font-bold">
              {direct ? "1. Idade e início" : "1. Preparar a aplicação"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {direct
                ? "Idade cronológica escolhe a trilha. Sem checklist nem ensaio: a aplicadora experiente responde pelo preparo do ambiente, da tela e do som."
                : "Idade cronológica escolhe a trilha. O roteiro é observacional e sua referência de aplicação é de 10 minutos; preparação e treino vêm antes."}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm font-semibold">
                Idade em anos
                <Input
                  type="number"
                  min="0"
                  max="17"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  placeholder="Informe a idade"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                Meses adicionais
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                />
              </label>
            </div>
            {band ? (
              <p className="mt-4 rounded-xl bg-primary/10 p-4 font-semibold">
                Trilha {band.label} · {band.missions.length} missões
              </p>
            ) : (
              <p className="mt-3 text-sm">
                Informe uma idade de 12 meses a 17 anos e 11 meses. Não reduzir
                a idade para mudar a trilha.
              </p>
            )}
            <div className="mt-5 space-y-4">
              {digitalAgeContext(ageMonths) && (
                <p className="rounded-xl border p-3 text-sm" role="note">
                  {digitalAgeContext(ageMonths)}
                </p>
              )}
              <label className="block text-sm font-semibold">
                Código anônimo da sessão (opcional)
                <Input
                  value={code}
                  maxLength={24}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex.: CASO-07"
                />
              </label>
              <label className="block text-sm font-semibold">
                Código da aplicadora (opcional)
                <Input
                  value={operator}
                  maxLength={24}
                  onChange={(e) => { setOperator(e.target.value); setQuiz({}); setPracticed({}); }}
                />
              </label>
              <label className="block text-sm font-semibold">
                Escolaridade (opcional)
                <Input
                  value={school}
                  maxLength={80}
                  onChange={(e) => setSchool(e.target.value)}
                />
              </label>
            </div>
            <fieldset className="mt-5">
              <legend className="font-semibold">
                O que pode interferir hoje?
              </legend>
              <div className="mt-3 space-y-2">
                {CONFOUNDERS.map((item) => (
                  <label
                    key={item}
                    className="flex min-h-10 items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={confounders.includes(item)}
                      onChange={() =>
                        setConfounders((old) =>
                          old.includes(item)
                            ? old.filter((x) => x !== item)
                            : [...old, item],
                        )
                      }
                    />
                    {item}
                  </label>
                ))}
              </div>
            </fieldset>
            {direct && (
              <>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    variant={sound !== "visual" ? "default" : "outline"}
                    aria-pressed={sound !== "visual"}
                    onClick={() => setSound("heard")}
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Com som eletrônico
                  </Button>
                  <Button
                    variant={sound === "visual" ? "default" : "outline"}
                    aria-pressed={sound === "visual"}
                    onClick={() => setSound("visual")}
                  >
                    Sem som eletrônico
                  </Button>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {DIGITAL_LIMIT}
                </p>
                <Button
                  className="mt-5 w-full"
                  disabled={!ready}
                  onClick={() => {
                    setPhase("run");
                    setStartedAt(new Date().toISOString());
                    setPaused(false);
                    setMessage(
                      "Modo direto iniciado. Agora começam os registros da aplicação.",
                    );
                  }}
                >
                  Iniciar aplicação
                  <Play className="ml-2 h-4 w-4" />
                </Button>
                {!ready && (
                  <p className="mt-3 text-sm" role="status">
                    Para iniciar: informe uma idade válida.
                  </p>
                )}
                <Button variant="ghost" className="mt-2 w-full" onClick={() => { if (!dirty || window.confirm("Mudar para o presencial apaga esta preparação. Deseja continuar?")) onLegacy(); }}>
                  Consultar o roteiro presencial original
                </Button>
              </>
            )}
          </section>
          {!direct && <section className={panel}>
            <h2 className="text-xl font-bold">Conferir antes de começar</h2>
            <div className="mt-4 space-y-3">
              {PREPARATION.map((text, i) => (
                <label
                  key={text}
                  className="flex items-start gap-3 rounded-xl border p-3 text-sm leading-relaxed"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={!!checks[i]}
                    onChange={() =>
                      setChecks((old) => ({ ...old, [i]: !old[i] }))
                    }
                  />
                  {text}
                </label>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-muted p-4">
              <h3 className="font-semibold">Conferência do som</h3>
              <p className="mt-2 text-sm">
                Reduza o volume antes do teste. É um toque suave, sem fala
                gravada. Não mede audição.
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setSoundPlayed(false);
                  void playSondaTone()
                    .then(() => {
                      setSoundPlayed(true);
                      setMessage(
                        "O som foi acionado. Confirme se foi ouvido em volume confortável.",
                      );
                    })
                    .catch(() => {
                      setMessage(
                        "Som indisponível neste navegador. Você pode continuar com estímulos visuais e sua voz.",
                      );
                    });
                }}
              >
                <Volume2 className="mr-2 h-4 w-4" />
                Testar som
              </Button>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={sound === "heard" ? "default" : "outline"}
                  disabled={!soundPlayed}
                  onClick={() => setSound("heard")}
                >
                  Ouvi e está confortável
                </Button>
                <Button
                  variant={sound === "visual" ? "default" : "outline"}
                  onClick={() => setSound("visual")}
                >
                  Usar sem som eletrônico
                </Button>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {DIGITAL_LIMIT}
            </p>
            {!ready && (
              <p className="mt-4 text-sm" role="status">
                Para liberar o ensaio:{" "}
                {!band ? "informe uma idade válida; " : ""}
                {PREPARATION.some((_, i) => !checks[i])
                  ? "confirme os itens acima; "
                  : ""}
                {sound === "unchecked"
                  ? "confirme o som ou escolha usar sem som eletrônico."
                  : ""}
              </p>
            )}
            <Button
              className="mt-5 w-full"
              disabled={!ready}
              onClick={() => setPhase("learn")}
            >
              Ir para o ensaio
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => { if (!dirty || window.confirm("Mudar para o presencial apaga esta preparação. Deseja continuar?")) onLegacy(); }}>
              Consultar o roteiro presencial original
            </Button>
          </section>}
        </div>
      )}
      {phase === "learn" && !direct && (
        <>
          <section className={panel}>
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">2. Seu primeiro ensaio</h2>
            </div>
            <p className="mt-3 leading-relaxed">
              Treine antes de chamar a criança. Estes exemplos são fictícios,
              não entram no registro. Nos controles, um toque seleciona o objeto
              e outro escolhe o destino. Nas tarefas da criança, ofereça somente
              as instruções da etapa.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {PRACTICES.map((p, i) => (
                <Button
                  key={p.title}
                  variant="outline"
                  className="h-auto min-h-16 whitespace-normal py-4"
                  onClick={() => setActive({ spec: p.spec, practiceIndex: i })}
                >
                  {practiced[i] && <Check className="mr-2 h-4 w-4" />}
                  {p.title}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No ensaio de sequência, responda ao sol; no de grade, toque e
              desmarque uma figura. Para a criança, use figuras neutras para
              ensinar o controle, sem treinar a resposta das missões.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {SONDA_DEZ_RESPONSE_LADDER.map((item) => (
                <div key={item.code} className="rounded-xl bg-muted p-3">
                  <strong>
                    {item.code} · {item.label}
                  </strong>
                  <p className="mt-2 text-sm">{item.meaning}</p>
                </div>
              ))}
            </div>
          </section>
          <section className={panel}>
            <h2 className="text-xl font-bold">Como você registraria?</h2>
            <div className="mt-4 space-y-5">
              {TRAINING_CASES.map((q, i) => (
                <fieldset key={q.question} className="rounded-xl border p-4">
                  <legend className="px-1 font-semibold">
                    {i + 1}. {q.question}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {["E", "I", "P", "0", "NA"].map((code) => (
                      <Button
                        key={code}
                        variant={quiz[i] === code ? "default" : "outline"}
                        aria-pressed={quiz[i] === code}
                        onClick={() =>
                          setQuiz((old) => ({ ...old, [i]: code }))
                        }
                      >
                        {code}
                      </Button>
                    ))}
                  </div>
                  {quiz[i] && (
                    <p className="mt-3 text-sm" role="status">
                      {quiz[i] === q.answer ? "Correto. " : "Revise: "}
                      {q.why}
                    </p>
                  )}
                </fieldset>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
              <strong>Se houver dificuldade:</strong> confira a instrução e o
              conforto. Pista e repetição precisam ser registradas. Se a criança
              não compreender a regra ou não tolerar, interrompa, use NA e
              explique. Não force resposta nem contato visual.
            </div>
            <div className="mt-5 flex flex-wrap justify-between gap-3">
              <Button variant="outline" onClick={() => setPhase("prepare")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Preparação
              </Button>
              <Button
                disabled={!trained}
                onClick={() => {
                  setPhase("run");
                  setStartedAt(new Date().toISOString());
                  setPaused(false);
                  setMessage(
                    "Ensaio concluído. Agora começam os registros da aplicação.",
                  );
                }}
              >
                Iniciar aplicação
                <Play className="ml-2 h-4 w-4" />
              </Button>
            </div>
            {!trained && (
              <p className="mt-3 text-sm" role="status">
                Para iniciar: conclua os três ensaios com os controles
                solicitados e revise os cinco exemplos até aparecer “Correto”.
              </p>
            )}
          </section>
        </>
      )}
      {phase === "run" && band && mission && currentStep && (
        <>
          <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/95 p-4 shadow-sm lg:top-2">
            <div>
              <p className="font-bold">
                Missão {missionIndex + 1}/{band.missions.length} ·{" "}
                {mission.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Etapa {stepIndex + 1}/{mission.steps.length} · tempo ativo{" "}
                {clock(elapsed)}
                {elapsed > 600 ? " · tempo ampliado" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPaused((p) => !p);
                  setMessage(
                    paused
                      ? "Aplicação retomada."
                      : "Aplicação pausada. O cronômetro está parado.",
                  );
                }}
              >
                {paused ? (
                  <Play className="mr-2 h-4 w-4" />
                ) : (
                  <Pause className="mr-2 h-4 w-4" />
                )}
                {paused ? "Retomar" : "Pausar"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPaused(true);
                  setPhase("report");
                }}
              >
                Revisar / encerrar
              </Button>
            </div>
          </div>
          {paused && (
            <p className="rounded-xl bg-amber-50 p-4 text-amber-950">
              Aplicação pausada. Retome apenas quando houver conforto e condição
              para prosseguir.
            </p>
          )}
          <section
            className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-background to-cyan-50/60 p-4 dark:border-amber-900 dark:from-amber-950/20 dark:to-cyan-950/10"
            aria-labelledby="sonda-aventura-title"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl" aria-hidden="true">
                {hero.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="sonda-aventura-title" className="text-sm font-black">
                  Aventura de {hero.name} · trilha {band.label}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Cada missão fechada vira uma estrela na trilha. Estrela é
                  participação, não desempenho: a criança nunca vê certo ou
                  errado, e nada daqui entra no registro.
                </p>
              </div>
              <StarCounter stars={completedCount} label="estrelas da trilha" />
            </div>
            <div className="mt-3">
              <MissionTrail
                hero={hero}
                current={missionIndex}
                done={missionDone}
                labels={band.missions.map((m) => m.title)}
              />
            </div>
            {cheer && (
              <div
                role="status"
                className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 dark:border-amber-700 dark:bg-amber-950/30"
              >
                <span className="text-2xl" aria-hidden="true">
                  ⭐
                </span>
                <span className="font-bold">
                  Missão {cheer.mission} concluída! {hero.emoji} {hero.name}{" "}
                  segue para a missão {missionIndex + 1}.
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setCheer(null)}
                >
                  Seguir na trilha
                </Button>
              </div>
            )}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-semibold">
                Trocar herói
              </summary>
              <div className="mt-3">
                <HeroGrid compact current={hero} onPick={setHero} />
              </div>
            </details>
          </section>
          <details className={panel}>
            <summary className="cursor-pointer font-bold">
              Familiarizar com os controles
            </summary>
            <p className="mt-3 text-sm leading-relaxed">
              Use antes de uma tarefa se a criança ainda não conhece o controle.
              Demonstre um toque e permita que experimente com estas figuras.
              Não ensine respostas das missões. O tempo da aplicação fica
              pausado. Se não compreender ou não tolerar, use NA e explique.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {PRACTICES.map((p, i) => (
                <Button
                  key={p.title}
                  variant="outline"
                  className="h-auto whitespace-normal py-3"
                  onClick={() => {
                    setPaused(true);
                    setActive({ spec: p.spec, practiceIndex: i });
                  }}
                >
                  {p.title}
                </Button>
              ))}
            </div>
          </details>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
            <section className={panel}>
              <p className="text-sm font-semibold text-primary">
                ORIENTAR → APRESENTAR → REGISTRAR
              </p>
              <h2 className="mt-2 text-2xl font-bold">{currentStep.title}</h2>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <h3 className="text-sm font-semibold">
                    {currentStep.silent
                      ? "1. Orientação para você — não ler em voz alta"
                      : "1. Diga exatamente"}
                  </h3>
                  <p className="mt-2 text-xl leading-relaxed">
                    {currentStep.silent
                      ? currentStep.say
                      : `“${currentStep.say}”`}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">2. Faça nesta ordem</h3>
                  <p className="mt-2 leading-relaxed">{currentStep.do}</p>
                </div>
                <div>
                  <h3 className="font-semibold">3. Observe</h3>
                  <p className="mt-2 leading-relaxed">{currentStep.observe}</p>
                </div>
                {currentStep.activity.responseRule && (
                  <div className="rounded-xl border p-3 text-sm">
                    <h3 className="font-semibold">
                      Referência da regra — somente para a aplicadora
                    </h3>
                    <table className="mt-2 w-full text-left">
                      <thead>
                        <tr>
                          <th className="p-2">Estímulo</th>
                          <th className="p-2">Resposta pedida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(currentStep.activity.responseRule).map(
                          ([item, answer]) => (
                            <tr key={item}>
                              <td className="p-2">{item}</td>
                              <td className="p-2">{answer}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                    <p className="mt-2">
                      Confira a resposta observada com esta regra. Não anuncie
                      acerto ou erro. Nos cartões verbais, registre o que ouviu
                      nos botões da tela da aplicadora; se perder uma resposta,
                      não adivinhe.
                    </p>
                    {currentStep.activity.prompt !== "operator-only" && (
                      <p className="mt-2">
                        Com teclado, registre durante cada cartão: 1 = uma palma;
                        2 = esperou sem bater palma; 3 = outra resposta; 4 = não observado.
                        Apenas a aplicadora usa essas teclas; não há pista visual de acerto na tela da criança.
                        Sem teclado, use anotação contemporânea por cartão e transcreva ao voltar;
                        não tente reconstruir a série de memória.
                      </p>
                    )}
                  </div>
                )}
                {currentStep.waitSeconds && (
                  <div className="rounded-xl bg-muted p-3 text-sm">
                    Aguarde {currentStep.waitSeconds} segundos na exploração,
                    sem dirigir. O contador da tela da criança acompanha o
                    tempo; interrompa antes se houver incômodo.
                  </div>
                )}
                <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={read}
                    onChange={(e) => setRead(e.target.checked)}
                  />
                  Li a instrução e sei o que observar nesta etapa.
                </label>
                <Button
                  className="w-full"
                  disabled={
                    !read ||
                    paused ||
                    current.runs[stepIndex]?.status === "complete" ||
                    current.runs[stepIndex]?.status === "skipped"
                  }
                  onClick={showStep}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {currentStep.activity.prompt === "operator-only"
                    ? "Abrir cartões da aplicadora"
                    : "Abrir estímulo desta etapa"}
                </Button>
                {current.runs[stepIndex] && (
                  <p className="rounded-xl bg-muted p-3 text-sm">
                    {current.runs[stepIndex].status === "complete"
                      ? "Apresentação concluída. Registre abaixo o que observou."
                      : current.runs[stepIndex].status === "skipped"
                        ? "Etapa não avaliável: " +
                          current.runs[stepIndex].reason
                        : "Apresentação interrompida. Registre o motivo de não avaliar antes de seguir."}
                  </p>
                )}
                {current.runs[stepIndex]?.status === "skipped" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateRecord((r) => ({
                        ...r,
                        reviewed: false,
                        runs: {
                          ...r.runs,
                          [stepIndex]: withRunHistory(r.runs[stepIndex], {
                            status: "interrupted",
                            events: [],
                            elapsedMs: 0,
                            reason:
                              "Etapa reaberta pela aplicadora; confira condições antes de reapresentar.",
                          }),
                        },
                      }));
                      setRead(false);
                      setPaused(true);
                      setMessage(
                        "Etapa reaberta. O motivo anterior foi preservado. Confira as condições, retome e leia a instrução; depois revise os campos que ficaram NA.",
                      );
                    }}
                  >
                    Reabrir etapa não avaliável
                  </Button>
                )}
                {currentStep.activity.target &&
                  currentStep.activity.kind === "sequence" &&
                  current.runs[stepIndex]?.status === "complete" &&
                  (() => {
                    const m = sequenceMetrics(
                      currentStep.activity.items ?? [],
                      currentStep.activity.target!,
                      current.runs[stepIndex].events,
                    );
                    return (
                      <p className="rounded-xl bg-cyan-50 p-4 text-sm text-cyan-950">
                        Toques registrados: {m.hits} em alvos; {m.omissions}{" "}
                        alvos sem toque; {m.commissions} em outros estímulos.{" "}
                        {m.presented} estímulos apresentados. Confira condições
                        e ajudas antes de preencher os campos; toques não medem
                        atenção por si sós.
                      </p>
                    );
                  })()}
                {currentStep.activity.kind === "grid" &&
                  current.runs[stepIndex]?.status === "complete" &&
                  (() => {
                    const metrics = recordedGridMetrics(
                      currentStep.activity.items ?? [],
                      currentStep.activity.target ?? "",
                      current.runs[stepIndex],
                    );
                    return metrics ? (
                      <div className="rounded-xl bg-cyan-50 p-4 text-sm text-cyan-950">
                        <strong>Conferência da grade</strong>
                        <p className="mt-2">
                          Alvos marcados: {metrics.hits}. Omissões:{" "}
                          {metrics.omissions}. Distratores marcados:{" "}
                          {metrics.commissions}.
                        </p>
                        <p className="mt-2">
                          São as seleções finais. Confira quem operou e as
                          ajudas antes de preencher os campos; não atribua à
                          criança um toque feito por outra pessoa.
                        </p>
                      </div>
                    ) : null;
                  })()}
                {!!current.runs[stepIndex]?.previousRuns?.length && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                    Etapa reapresentada. Registre a ajuda e considere a
                    familiaridade com os estímulos. As tentativas anteriores
                    acompanham a exportação.
                  </p>
                )}
                {currentStep.activity.responseRule && current.runs[stepIndex]?.status === "complete" && (
                  <fieldset className="rounded-xl border p-4">
                    <legend className="px-1 font-semibold">Respostas por cartão — conferência da aplicadora</legend>
                    <p className="mb-3 text-sm">
                      Registre somente o que observou. Nenhuma opção começa selecionada.
                      “Esperar” significa que observou a criança sem bater palma; não significa falta de registro.
                      Se perdeu uma resposta, escolha “Não observado” e use NA nos totais desta etapa com motivo.
                      Contagens são calculadas dessas respostas, sem detectar voz ou movimento.
                    </p>
                    <div className="space-y-3">
                      {currentStep.activity.items?.map((item, i) => (
                        <label key={i} className="block text-sm">
                          Resposta ao cartão {i + 1}: {item}
                          <select
                            aria-label={`Resposta ao cartão ${i + 1}: ${item}`}
                            className="mt-1 block min-h-11 w-full rounded-lg border bg-background p-2"
                            value={stepResponses[i] ?? ""}
                            onChange={(e) => updateRecord((r) => ({
                              ...r,
                              reviewed: false,
                              runs: { ...r.runs, [stepIndex]: recordObservedResponse(currentStep.activity, r.runs[stepIndex], i, e.target.value) },
                            }))}
                          >
                            <option value="" disabled>Selecione o que foi observado</option>
                            {responseOptions(currentStep.activity).map((answer) => <option key={answer} value={answer}>{answer}</option>)}
                          </select>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                {current.runs[stepIndex]?.events.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold">
                      Ver eventos desta etapa
                    </summary>
                    <ol className="mt-2 max-h-52 overflow-auto rounded-xl bg-muted p-3">
                      {current.runs[stepIndex].events.map((e, i) => (
                        <li key={i}>
                          {Math.round(e.elapsedMs / 1000)}s · {e.type}:{" "}
                          {e.value}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
                <label className="block text-sm font-semibold">
                  Se não pôde apresentar, descreva o motivo
                  <Input
                    value={skipReason}
                    onChange={(e) => setSkipReason(e.target.value)}
                    maxLength={500}
                    placeholder="Ex.: recusou a tela; interrompida por choro"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={!skipReason.trim()}
                    onClick={() =>
                      updateRecord((r) => ({
                        ...r,
                        reviewed: false,
                        runs: {
                          ...r.runs,
                          [stepIndex]: withRunHistory(r.runs[stepIndex], {
                            status: "skipped", events: r.runs[stepIndex]?.events ?? [], elapsedMs: r.runs[stepIndex]?.elapsedMs ?? 0, reason: skipReason.trim(),
                          }),
                        },
                      }))
                    }
                  >
                    Não avaliar esta etapa
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!skipReason.trim()}
                    onClick={() =>
                      updateRecord((r) =>
                        markMissionUnavailable(mission, r, skipReason),
                      )
                    }
                  >
                    Toda a missão: NA
                  </Button>
                </div>
                <div className="flex justify-between gap-3">
                  <Button
                    variant="ghost"
                    disabled={stepIndex === 0}
                    onClick={() => {
                      setStepIndex((i) => i - 1);
                      setRead(false);
                      setSkipReason("");
                    }}
                  >
                    Etapa anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={
                      stepIndex === mission.steps.length - 1 ||
                      !["complete", "skipped"].includes(
                        current.runs[stepIndex]?.status,
                      )
                    }
                    onClick={nextStep}
                  >
                    Próxima etapa
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
            <section className={panel}>
              <h2 className="text-xl font-bold">
                4. Registrar o que aconteceu
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Preencha ao longo da missão. Nada começa preenchido como acerto
                ou zero. Campos presenciais não observáveis pela tela já vêm
                identificados como NA.
              </p>
              <fieldset className="mt-5 rounded-xl border p-4">
                <legend className="px-1 font-semibold">Quem operou a tela nesta missão?</legend>
                <p className="mb-3 text-sm text-muted-foreground">Identifique quem tocou nos controles. Isso não substitui descrever a resposta da criança. Na operação compartilhada, discrimine nas notas.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(INTERACTION_LABELS).map(([value, label]) => (
                    <label key={value} className="flex min-h-12 items-center gap-3 rounded-xl border p-3 text-sm">
                      <input type="radio" name={`interaction-${mission.id}`} checked={current.interaction === value}
                        onChange={() => updateRecord((r) => ({ ...r, interaction: value as DigitalRecord["interaction"], reviewed: false }))} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-5 space-y-5">
                {mission.fields.map((field) => {
                  const physical = physicalFieldReason(mission.id, field.id);
                  const value = current.values[field.id] ?? "";
                  return (
                    <fieldset key={field.id} className="rounded-xl border p-4">
                      <legend className="px-1 font-semibold">
                        {field.label}
                      </legend>
                      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                        {physical ?? fieldGuidance(field)}
                      </p>
                      {counts[field.id] && (
                        <p className="mb-3 text-sm">
                          Derivado de {counts[field.id].source} na etapa {counts[field.id].step + 1}.
                          {counts[field.id].value === undefined ? " Evidência ainda incompleta; não preencha zero. Complete o registro ou use NA com motivo." : " Não editável manualmente. Para corrigir, revise as respostas por cartão; se não avaliável, use NA e explique."}
                        </p>
                      )}
                      {field.kind === "count" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-sm">
                            Quantidade de {field.label}
                            <Input
                              type="number"
                              min="0"
                              max={field.max}
                              step="1"
                              disabled={!!physical || value === "NA" || !!counts[field.id]}
                              value={value === "NA" ? "" : value}
                              onChange={(e) =>
                                updateRecord((r) => ({
                                  ...r,
                                  reviewed: false,
                                  values: {
                                    ...r.values,
                                    [field.id]: e.target.value,
                                  },
                                }))
                              }
                            />
                          </label>
                          <Button
                            variant={value === "NA" ? "default" : "outline"}
                            disabled={!!physical}
                            onClick={() =>
                              updateRecord((r) => ({
                                ...r,
                                reviewed: false,
                                values: {
                                  ...r.values,
                                  [field.id]: value === "NA" ? "" : "NA",
                                },
                              }))
                            }
                          >
                            Não avaliável
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {[...new Set([...(field.options ?? []), "NA"])].map(
                            (option) => (
                              <Button
                                key={option}
                                variant={
                                  value === option ? "default" : "outline"
                                }
                                aria-pressed={value === option}
                                disabled={!!physical}
                                onClick={() =>
                                  updateRecord((r) => ({
                                    ...r,
                                    reviewed: false,
                                    values: { ...r.values, [field.id]: option },
                                  }))
                                }
                              >
                                {option}
                              </Button>
                            ),
                          )}
                        </div>
                      )}
                      {value === "NA" && (
                        <label className="mt-3 block text-sm font-semibold">
                          Motivo de NA — {field.label}
                          <Input
                            value={current.reasons[field.id] ?? ""}
                            disabled={!!physical}
                            maxLength={500}
                            onChange={(e) =>
                              updateRecord((r) => ({
                                ...r,
                                reviewed: false,
                                reasons: {
                                  ...r.reasons,
                                  [field.id]: e.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                      )}
                    </fieldset>
                  );
                })}
              </div>
              <label className="mt-5 block font-semibold">
                Observação direta, fala e ajudas oferecidas
                <textarea
                  aria-label="Observação direta, fala e ajudas oferecidas"
                  className="mt-2 min-h-32 w-full rounded-xl border bg-background p-3 text-sm font-normal"
                  value={current.notes}
                  maxLength={4000}
                  onChange={(e) =>
                    updateRecord((r) => ({
                      ...r,
                      reviewed: false,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Ex.: após repetir a ordem, tocou no carro. Disse: “abre pra mim”. Se o responsável informou algo, atribua o relato."
                />
              </label>
              <details className="mt-4 rounded-xl bg-muted p-4">
                <summary className="cursor-pointer font-semibold">
                  Como ler esta missão
                </summary>
                <div className="mt-3 space-y-2 text-sm leading-relaxed">
                  {mission.reading.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                  <p>{mission.digitalLimit}</p>
                  <p>
                    Conte o que ocorreu e em quais condições; encaminhe dúvidas
                    ao médico. Não classifique normalidade, gravidade ou
                    diagnóstico.
                  </p>
                </div>
              </details>
              <label className="mt-5 flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={current.reviewed}
                  onChange={(e) =>
                    updateRecord((r) => ({ ...r, reviewed: e.target.checked }))
                  }
                />
                Conferi as oportunidades, ajudas, registros e motivos de NA
                desta missão.
              </label>
              {problems.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer">
                    {problems.length} pendência(s) para concluir a missão
                  </summary>
                  <ul className="mt-2 list-disc pl-5">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </details>
              )}
              <Button
                className="mt-5 w-full"
                disabled={problems.length > 0}
                onClick={() => {
                  if (missionIndex < band.missions.length - 1) {
                    goMission(missionIndex + 1);
                    // Celebração neutra: a missão foi fechada, qualquer que
                    // tenha sido o código registrado.
                    setCheer({ mission: missionIndex + 1 });
                  } else {
                    setPaused(true);
                    setPhase("report");
                  }
                }}
              >
                {missionIndex < band.missions.length - 1
                  ? "Concluir missão e continuar"
                  : "Concluir e revisar registro"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </section>
          </div>
          <section className={panel}>
            <h2 className="font-bold">Alertas para informar ao médico</h2>
            <p className="mt-2 text-sm">
              Se a criança estiver em sofrimento ou houver evento agudo, pare a
              atividade e chame o profissional responsável.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              {FLAGS.map((flag) => (
                <label key={flag} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={flags.includes(flag)}
                    onChange={() => {
                      setFlags((old) =>
                        old.includes(flag)
                          ? old.filter((x) => x !== flag)
                          : [...old, flag],
                      );
                      setPaused(true);
                    }}
                  />
                  {flag}
                </label>
              ))}
            </div>
          </section>
        </>
      )}
      {phase === "report" && band && (
        <>
          <section
            className={`${panel} text-center motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95`}
            aria-labelledby="sonda-final-title"
          >
            <div className="text-5xl" aria-hidden="true">
              {completedCount === band.missions.length ? "🏆" : hero.emoji}
            </div>
            <h2 id="sonda-final-title" className="mt-2 text-xl font-black">
              {completedCount === band.missions.length
                ? `Trilha ${band.label} completa!`
                : "Aventura em andamento"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedCount === band.missions.length
                ? `${hero.emoji} ${hero.name} fechou as ${band.missions.length} missões. Medalha: Explorador da trilha ${band.label}.`
                : `${hero.emoji} ${hero.name} fechou ${completedCount} de ${band.missions.length} missões. Dá para voltar e concluir as que faltam.`}
            </p>
            <div className="mt-3 flex justify-center">
              <MissionTrail
                hero={hero}
                current={completedCount === band.missions.length ? -1 : missionIndex}
                done={missionDone}
                labels={band.missions.map((m) => m.title)}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Estrelas e medalha registram participação e conclusão. Não entram
              no registro clínico e não são escore.
            </p>
          </section>
          <section className={panel}>
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">
                Revisar e entregar ao médico
              </h2>
            </div>
            <p className="mt-3">
              {completedCount}/{band.missions.length} missões com registro
              revisado.{" "}
              {completedCount < band.missions.length
                ? "O registro está parcial; a exportação identifica lacunas e não gera síntese interpretativa."
                : "Leia os achados por domínio e considere as condições de aplicação."}
            </p>
            {flags.length > 0 && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-950"
              >
                Informe ao médico: {flags.join("; ")}.
              </p>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {band.missions.map((m, i) => (
                <Button
                  key={m.id}
                  variant="outline"
                  className="h-auto justify-start whitespace-normal py-4 text-left"
                  onClick={() => {
                    goMission(i);
                    setPhase("run");
                    setPaused(true);
                  }}
                >
                  {recordProblems(m, records[m.id]).length === 0 ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {i + 1}. {m.title}
                </Button>
              ))}
            </div>
            <div className="mt-5 rounded-xl bg-primary/10 p-4 text-sm leading-relaxed">
              <strong>Leitura operacional:</strong> a secretária descreve
              resposta, ajuda e interferentes. O médico integra desenvolvimento,
              história e outras avaliações. Quantidades são contagens brutas;
              não há total, percentil, ponto de corte, diagnóstico ou conclusão
              de normalidade.
            </div>
            <p className="mt-4 text-sm">
              Para a família: “Registramos como participou destas atividades e
              quanta ajuda precisou. O médico vai reunir estas observações com a
              história e as outras avaliações.”
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => void copy()}>
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copiado" : "Copiar registro"}
              </Button>
              <Button variant="outline" onClick={download}>
                <Download className="mr-2 h-4 w-4" />
                Baixar registro
              </Button>
              <Button variant="outline" onClick={() => setConfirmNew(true)}>
                Nova aplicação
              </Button>
            </div>
            {confirmNew && (
              <div className="mt-4 rounded-xl border p-4">
                <p>
                  A nova aplicação apaga os dados desta tela. Copie ou baixe o
                  registro antes de continuar.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmNew(false)}
                  >
                    Manter esta aplicação
                  </Button>
                  <Button onClick={() => newSession()}>Apagar e começar outra</Button>
                  {trained && operator.trim() && <Button variant="outline" onClick={() => newSession(true)}>Nova criança, mesma aplicadora</Button>}
                </div>
              </div>
            )}
          </section>
          <section className={panel}>
            <h2 className="text-xl font-bold">Resumo factual para a consulta</h2>
            <p className="mt-2 text-sm text-muted-foreground">Fatos registrados, ajudas, limites e pendências. A lista detalhada de eventos permanece no registro completo abaixo.</p>
            <Button className="my-4" variant="outline" onClick={() => void copy(handoff)}>Copiar resumo para o médico</Button>
            <textarea aria-label="Resumo factual para o médico" readOnly value={handoff}
              className="min-h-80 w-full rounded-xl border bg-background p-4 text-sm leading-relaxed" />
          </section>
          <section className={panel}>
            <h2 className="mb-3 font-bold">
              Registro completo para conferência
            </h2>
            <textarea
              aria-label="Registro completo"
              readOnly
              value={report}
              className="min-h-96 w-full rounded-xl border bg-background p-4 font-mono text-sm leading-relaxed"
            />
          </section>
        </>
      )}
      <footer className="rounded-2xl border p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="flex gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {DIGITAL_NATURE}
        </p>
        <p className="mt-2">
          Dados ficam apenas nesta sessão da tela. Copie ou baixe antes de sair.
          Sem gravação de áudio/vídeo. Som e vetores são gerados no dispositivo,
          sem serviços externos para os estímulos.
        </p>
      </footer>
      {active && (
        <SondaDigitalActivity
          spec={active.spec}
          initialPlan={active.initialPlan}
          practice={active.practiceIndex !== undefined}
          soundEnabled={direct ? sound !== "visual" : sound === "heard"}
          waitSeconds={
            active.practiceIndex === undefined
              ? currentStep?.waitSeconds
              : undefined
          }
          onComplete={saveRun}
        />
      )}
    </div>
  );
}

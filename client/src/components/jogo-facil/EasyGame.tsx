/**
 * Jogo Fácil — motor compartilhado do "Modo Fácil" das aplicações diretas
 * (Sonda Dez, OBS-10, Reconhecimento Visual). Suporta dois contratos:
 * observacional (o adulto marca Acertou/Não acertou/Pular) e objetivo
 * (o toque da criança decide certo/errado, seguido de transição neutra).
 *
 * Verdade clínica: o resultado é sempre descritivo, sem escore, percentil,
 * ponto de corte ou diagnóstico. Herói e estrelas representam participação,
 * nunca desempenho.
 *
 * Só animação CSS (motion-safe:animate-in): sem setTimeout/requestAnimationFrame,
 * para conviver com o relógio falso dos e2e da Sonda.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronRight, Copy, Download, Play, RotateCcw, SkipForward, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_HERO, HeroGrid, NEUTRAL_CHEERS, StarCounter, type Hero } from "@/components/aventura";
import { EASY_OUTCOME_LABEL, OBJECTIVE_OUTCOME_LABEL, buildEasyReport, easyCounts, type EasyOutcome, type EasyRecord } from "./easyReport";
export { EASY_OUTCOME_LABEL, OBJECTIVE_OUTCOME_LABEL, buildEasyReport, easyCounts, type EasyOutcome, type EasyRecord } from "./easyReport";

export interface EasyStep {
  id: string;
  /** Missão / bloco a que o passo pertence. */
  group: string;
  title: string;
  /** O que o adulto fala ou faz, em letras grandes. */
  say: string;
  /** Dica curta do que observar. */
  hint?: string;
  /** Ilustração para o adulto (não é a tela da criança). */
  visual?: ReactNode;
  /** Tela para a criança; o motor abre ao tocar no botão e fecha em onDone. */
  child?: (ctx: { onDone: (auto?: EasyOutcome, detail?: { chosen: string; correct: string }) => void }) => ReactNode;
  childLabel?: string;
}
export interface EasyGameProps {
  title: string;
  ageLabel: string;
  nature: string;
  steps: EasyStep[];
  testid?: string;
  onProgress?: (done: number) => void;
  onRestart?: () => void;
  /** Texto extra anexado ao resultado (ex.: limites do instrumento). */
  footer?: string;
  /**
   * Modo objetivo: a tela da criança abre sozinha em cada item, o toque decide
   * certo/errado e o adulto só pode pular. Um "Próximo" entre itens evita que o
   * segundo toque de um toque duplo responda o item seguinte.
   */
  objective?: boolean;
}

function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function EasyGame({ title, ageLabel, nature, steps, testid = "jogo-facil", onProgress, onRestart, footer, objective = false }: EasyGameProps) {
  const [index, setIndex] = useState(0);
  const [records, setRecords] = useState<EasyRecord[]>([]);
  const [childOpen, setChildOpen] = useState(objective);
  const [awaitNext, setAwaitNext] = useState(false);
  const transitionLock = useRef(false);
  const [shown, setShown] = useState(false);
  const label = objective ? OBJECTIVE_OUTCOME_LABEL : EASY_OUTCOME_LABEL;
  // Camada de aventura: herói e frase neutra. Não é dado clínico.
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  const [message, setMessage] = useState("");
  const step = steps[index];
  const finished = index >= steps.length;
  const stars = records.filter((r) => r.outcome !== "pulou").length;

  function record(outcome: EasyOutcome, auto = false, detail?: { chosen: string; correct: string }) {
    if (!step || transitionLock.current) return;
    transitionLock.current = true;
    const next = [...records, { id: step.id, group: step.group, title: step.title, outcome, auto, ...(detail ?? {}) }];
    setRecords(next);
    // No modo objetivo, todo desfecho passa por uma tela neutra de transição.
    // Isso evita click-through, dupla marcação e exposição antecipada do item seguinte.
    setAwaitNext(objective);
    setChildOpen(false);
    setShown(false);
    setIndex(index + 1);
    setMessage(outcome === "pulou" ? "Item sem resposta registrado." : NEUTRAL_CHEERS[next.length % NEUTRAL_CHEERS.length]);
    onProgress?.(next.length);
  }

  useEffect(() => {
    // Fluxos não objetivos avançam direto; o lock só precisa sobreviver ao mesmo
    // evento/tap. No objetivo, ele permanece até o botão Próximo liberar o item.
    if (!objective) transitionLock.current = false;
  }, [index, objective]);
  function undo() {
    if (!records.length || (childOpen && !objective)) return;
    const next = records.slice(0, -1);
    transitionLock.current = false;
    setRecords(next);
    setIndex(next.length);
    setAwaitNext(false);
    setChildOpen(objective);
    setShown(false);
    setMessage("Voltamos um passo. Marque de novo.");
    onProgress?.(next.length);
  }
  function restart() {
    transitionLock.current = false;
    setRecords([]);
    setIndex(0);
    setAwaitNext(false);
    setChildOpen(objective);
    setShown(false);
    setMessage("");
    onProgress?.(0);
    onRestart?.();
  }
  const report = finished
    ? buildEasyReport({ title, ageLabel, nature, records, totalSteps: steps.length, footer, objective })
    : "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(report);
      setMessage("Resultado copiado.");
    } catch {
      setMessage("Não foi possível copiar. Use Baixar resultado.");
    }
  }

  if (steps.length === 0) {
    return (
      <div data-testid={testid} className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum passo disponível para esta idade.
      </div>
    );
  }

  const big = "flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-3xl border-4 text-2xl font-black shadow-md transition motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring";
  const counts = easyCounts(records);
  const objectiveIntermission = objective && awaitNext;
  const currentPosition = finished
    ? steps.length
    : objectiveIntermission
      ? records.length
      : Math.min(index + 1, steps.length);

  return (
    <div data-testid={testid} className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card/80 px-3 py-2 shadow-sm">
        <span className="text-3xl" aria-hidden="true">{hero.emoji}</span>
        <span className="text-sm font-bold">{hero.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <StarCounter stars={stars} label={objective ? "respostas" : "passos concluídos"} />
          <span className="rounded-xl bg-muted px-3 py-1 text-sm font-bold tabular-nums" data-testid={`${testid}-progress`}>
            {currentPosition} / {steps.length}
          </span>
        </div>
      </div>
      <progress className="h-3 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" max={steps.length} value={records.length} aria-label="Progresso do jogo" />
      {message && (
        <p role="status" className="rounded-xl bg-amber-100/70 px-4 py-2 text-center text-base font-bold text-amber-900 motion-safe:animate-in motion-safe:fade-in dark:bg-amber-950/40 dark:text-amber-100">
          {message}
        </p>
      )}

      {!finished && step && (
        <section
          key={step.id}
          data-testid={`${testid}-step`}
          className="rounded-3xl border bg-card p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 sm:p-7"
          aria-labelledby={`${testid}-step-title`}
        >
          {objectiveIntermission ? (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Transição segura</p>
              <h2 id={`${testid}-step-title`} className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Resposta registrada</h2>
              <p className="mt-4 rounded-2xl bg-muted p-4 text-center text-base font-semibold leading-relaxed text-muted-foreground">
                O próximo item ainda está oculto. Toque em Próximo quando a criança estiver pronta.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{step.group}</p>
              <h2 id={`${testid}-step-title`} className={objective && childOpen ? "sr-only" : "mt-1 text-2xl font-black tracking-tight sm:text-3xl"}>{step.title}</h2>
              {!(objective && childOpen) && (
                <p className="mt-4 rounded-2xl bg-primary/10 p-4 text-xl font-semibold leading-relaxed sm:text-2xl">
                  <span className="mr-2" aria-hidden="true">🗣️</span>
                  {step.say}
                </p>
              )}
              {step.hint && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.hint}</p>}
              {step.visual && <div className="mt-4">{step.visual}</div>}
            </>
          )}

          {awaitNext && (
            <Button
              size="lg"
              data-testid={`${testid}-next`}
              className="mt-5 min-h-24 w-full rounded-3xl text-2xl font-black"
              onClick={() => {
                transitionLock.current = false;
                setAwaitNext(false);
                setChildOpen(objective);
              }}
            >
              Próximo
              <ChevronRight className="ml-2 h-8 w-8" />
            </Button>
          )}
          {step.child && !childOpen && !objective && (
            <Button
              size="lg"
              data-testid={`${testid}-show`}
              className="mt-5 min-h-20 w-full rounded-3xl text-xl font-black"
              onClick={() => setChildOpen(true)}
            >
              <Play className="mr-2 h-6 w-6" />
              {shown ? "Mostrar de novo" : (step.childLabel ?? "Mostrar para a criança")}
            </Button>
          )}
          {step.child && childOpen && (
            <div data-testid={`${testid}-child`}>
              {step.child({
                onDone: (auto, detail) => {
                  setChildOpen(false);
                  setShown(true);
                  if (auto) record(auto, true, detail);
                },
              })}
            </div>
          )}

          {!childOpen && !objective && (
            <>
              <p className="mt-6 text-center text-sm font-semibold text-muted-foreground">
                {step.child && !shown ? "Depois de mostrar, marque o que viu:" : "Marque o que viu:"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <button type="button" data-testid={`${testid}-acertou`} onClick={() => record("acertou")} className={`${big} border-emerald-400 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100`}>
                  <Check className="h-8 w-8" aria-hidden="true" />
                  Acertou
                </button>
                <button type="button" data-testid={`${testid}-nao`} onClick={() => record("nao")} className={`${big} border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-100`}>
                  <X className="h-8 w-8" aria-hidden="true" />
                  Não acertou
                </button>
                <button type="button" data-testid={`${testid}-pular`} onClick={() => record("pulou")} className={`${big} border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-100`}>
                  <SkipForward className="h-8 w-8" aria-hidden="true" />
                  Pular
                </button>
              </div>
            </>
          )}
          {objective && !awaitNext && (
            <button type="button" data-testid={`${testid}-pular`} onClick={() => record("pulou")} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-slate-50 text-base font-bold text-slate-700 hover:bg-slate-100 dark:bg-slate-900/60 dark:text-slate-100">
              <SkipForward className="h-5 w-5" aria-hidden="true" />
              Pular · a criança não respondeu
            </button>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" disabled={!records.length || (childOpen && !objective)} onClick={undo}>
              <Undo2 className="mr-1 h-4 w-4" /> Voltar um passo
            </Button>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">Trocar herói</summary>
              <div className="mt-2"><HeroGrid compact current={hero} onPick={setHero} /></div>
            </details>
          </div>
        </section>
      )}

      {finished && (
        <section data-testid={`${testid}-results`} className="rounded-3xl border bg-card p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 sm:p-7" aria-labelledby={`${testid}-results-title`}>
          <div className="text-center">
            <div className="text-6xl" aria-hidden="true">🏆</div>
            <h2 id={`${testid}-results-title`} className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Jogo concluído!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {objective
                ? `${hero.emoji} ${hero.name}: ${stars} respostas registradas em ${steps.length} itens; ${counts.pulou} sem resposta. Não é nota.`
                : `${hero.emoji} ${hero.name} completou ${stars} de ${steps.length} passos. Estrelas são participação, não nota.`}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3" role="list" aria-label="Resumo do jogo">
            <div role="listitem" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center dark:bg-emerald-950/40"><div className="text-3xl font-black tabular-nums" data-testid={`${testid}-count-acertou`}>{counts.acertou}</div><div className="text-sm font-semibold">{label.acertou}</div></div>
            <div role="listitem" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-center dark:bg-rose-950/40"><div className="text-3xl font-black tabular-nums" data-testid={`${testid}-count-nao`}>{counts.nao}</div><div className="text-sm font-semibold">{label.nao}</div></div>
            <div role="listitem" className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-center dark:bg-slate-900/60"><div className="text-3xl font-black tabular-nums" data-testid={`${testid}-count-pulou`}>{counts.pulou}</div><div className="text-sm font-semibold">{label.pulou}</div></div>
          </div>
          <p className="mt-4 rounded-xl bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
            {objective
              ? "Certo e errado são o toque da criança comparado à resposta única de cada item. Não é escore, percentil, ponto de corte nem diagnóstico. Quem lê e conclui é o médico."
              : "Resultado descritivo do que o adulto marcou em cada passo. Não é escore, percentil, ponto de corte nem diagnóstico. Quem lê e conclui é o médico."}
          </p>
          <ol className="mt-4 space-y-1 text-sm">
            {records.map((r, i) => (
              <li key={`${r.id}-${i}`} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <span className="w-6 text-right tabular-nums text-muted-foreground">{i + 1}.</span>
                <span className="min-w-0 flex-1">
                  <span className="text-muted-foreground">{r.group} · </span>{r.title}
                  {r.chosen !== undefined && <span className="ml-2 text-xs text-muted-foreground">tocou {r.chosen}{r.outcome === "nao" && r.correct !== undefined ? ` · certo: ${r.correct}` : ""}</span>}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.outcome === "acertou" ? "bg-emerald-100 text-emerald-900" : r.outcome === "nao" ? "bg-rose-100 text-rose-900" : "bg-slate-200 text-slate-800"}`}>{label[r.outcome]}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="lg" className="rounded-2xl font-black" onClick={() => void copy()}><Copy className="mr-2 h-4 w-4" /> Copiar resultado</Button>
            <Button size="lg" variant="outline" className="rounded-2xl" onClick={() => download(report, `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-modo-facil.txt`)}><Download className="mr-2 h-4 w-4" /> Baixar resultado</Button>
            <Button size="lg" variant="outline" className="rounded-2xl" onClick={restart}><RotateCcw className="mr-2 h-4 w-4" /> Jogar de novo</Button>
          </div>
          <textarea aria-label="Resultado do jogo" readOnly value={report} className="mt-4 min-h-64 w-full rounded-xl border bg-background p-3 font-mono text-xs leading-relaxed" />
        </section>
      )}
      {!finished && (
        <p className="text-center text-xs text-muted-foreground">
          {objective ? "Sequência fixa: tocou, passou." : "Sequência fixa: marcou, passou."} <ChevronRight className="inline h-3 w-3" aria-hidden="true" /> Nada é salvo automaticamente: copie ou baixe o resultado no fim.
        </p>
      )}
    </div>
  );
}

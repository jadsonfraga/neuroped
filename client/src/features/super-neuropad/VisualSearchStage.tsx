import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Option, TouchItem } from "./items";
import { buildVisualSearchBoard, visualSearchProfile, type ExplorerVariant } from "./visualSearch";

/** Ilustração vetorial autoral: nenhuma imagem do jogo comercial é utilizada. */
function SearchExplorer({ variant, similar }: { variant: ExplorerVariant; similar: boolean }) {
  const hat = similar ? "var(--snp-sky)" : variant === 0 ? "var(--snp-sun)" : ["var(--snp-sky)", "var(--snp-grass)", "var(--snp-lilac)"][variant - 1];
  return (
    <svg viewBox="0 0 64 72" className="h-full w-full" aria-hidden="true" focusable="false">
      <rect x="17" y="43" width="30" height="26" rx="9" fill="var(--snp-sky)" stroke="var(--snp-ink-fixed)" strokeWidth="2" />
      <circle cx="32" cy="34" r="18" fill="var(--snp-paper-fixed)" stroke="var(--snp-ink-fixed)" strokeWidth="2.5" />
      <path d="M14 27V18Q14 10 23 10H41Q50 10 50 18V27Z" fill={hat} stroke="var(--snp-ink-fixed)" strokeWidth="2" />
      <path d="M9 26Q32 32 55 26" fill="none" stroke="var(--snp-ink-fixed)" strokeWidth="3" strokeLinecap="round" />
      {variant === 0 ? (
        <path d="M32 12L34.1 16.6L39 17.1L35.4 20.5L36.3 25.4L32 23L27.7 25.4L28.6 20.5L25 17.1L29.9 16.6Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.7" />
      ) : variant === 1 ? <circle cx="32" cy="19" r="5" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />
        : variant === 2 ? <path d="M32 13L38 19L32 25L26 19Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />
        : <path d="M26 15H38V23H26Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />}
      <circle cx="26" cy="36" r="2" fill="var(--snp-ink-fixed)" />
      <circle cx="38" cy="36" r="2" fill="var(--snp-ink-fixed)" />
      <path d="M28 43Q32 47 36 43" fill="none" stroke="var(--snp-berry)" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 54H42" stroke="var(--snp-paper-fixed)" strokeWidth="2" />
    </svg>
  );
}

/** Cronômetro mede apenas tempo ativo e finaliza a tentativa sem resposta ao esgotar. */
export function VisualSearchStage({ item, years, seed, paused, onAnswer }: {
  item: TouchItem;
  years: number;
  seed: number;
  paused: boolean;
  onAnswer: (chosen: Option | null, event: { timeStamp: number }, seconds: number) => void;
}) {
  const profile = useMemo(() => visualSearchProfile(years), [years]);
  const board = useMemo(() => buildVisualSearchBoard(profile, seed), [profile, seed]);
  const [left, setLeft] = useState(profile.seconds);
  const activeMs = useRef(0);
  const answered = useRef(false);
  const startedSegment = useRef<number | null>(null);

  // Cada ciclo recomeça em performance.now(), preservando os milissegundos
  // acumulados antes da pausa; o relógio não depende do throttling de setInterval.
  useEffect(() => {
    if (paused || answered.current) return;
    const start = performance.now();
    startedSegment.current = start;
    const timer = window.setInterval(() => {
      const active = activeMs.current + performance.now() - start;
      const remaining = Math.max(0, Math.ceil((profile.seconds * 1000 - active) / 1000));
      setLeft(remaining);
      if (active >= profile.seconds * 1000 && !answered.current) {
        answered.current = true;
        onAnswer(null, { timeStamp: performance.now() }, Math.min(profile.seconds, active / 1000));
      }
    }, 100);
    return () => {
      activeMs.current += performance.now() - start;
      startedSegment.current = null;
      window.clearInterval(timer);
    };
  }, [paused, profile.seconds, onAnswer]);

  function choose(variant: ExplorerVariant, event: MouseEvent<HTMLButtonElement>) {
    if (paused || answered.current) return;
    answered.current = true;
    const now = performance.now();
    const seconds = (activeMs.current + (startedSegment.current === null ? 0 : now - startedSegment.current)) / 1000;
    onAnswer(item.options[variant === 0 ? 0 : 1], event, seconds);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-3" data-testid="visual-search-stage" data-age={years}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="snp-chip">Missão bônus · busca visual</span>
        <span className="snp-chip">{profile.cells} personagens</span>
        <span className="snp-chip" role="timer" aria-label={"Tempo restante: " + left + " segundos"}>
          Tempo: <strong className={left <= 10 ? "text-red-700" : ""}>{left}s</strong>
        </span>
      </div>
      <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-3 text-slate-900">
        <div className="h-16 w-16 shrink-0" aria-hidden="true"><SearchExplorer variant={0} similar={profile.similar} /></div>
        <div>
          <p className="text-lg font-black">Onde está o explorador com estrela no boné?</p>
          <p className="text-xs">Encontre um só. Toque nele antes de acabar o tempo.</p>
        </div>
      </div>
      <div className="grid gap-1.5 rounded-xl border-2 border-slate-500 bg-slate-100 p-2"
        role="group" aria-label="Cenário de busca visual"
        style={{ gridTemplateColumns: "repeat(" + profile.columns + ", minmax(0, 1fr))" }}>
        {board.map((variant, index) => (
          <button key={index} type="button"
            className="flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white p-1 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-600 disabled:opacity-70"
            style={{ minHeight: years <= 3 ? 80 : years <= 7 ? 65 : 50 }}
            disabled={paused || answered.current}
            aria-label={"Personagem " + (index + 1) + (variant === 0 ? ": estrela no boné" : ": sem estrela")}
            onClick={(event) => choose(variant, event)}>
            <span className="block h-full w-full max-w-[64px]"><SearchExplorer variant={variant} similar={profile.similar} /></span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs opacity-80">
        Limite de tempo lúdico, sem normas por idade. A pausa congela a contagem. Um toque encerra a tentativa.
      </p>
    </div>
  );
}

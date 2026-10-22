import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Option, TouchItem } from "./items";
import { buildVisualSearchBoard, visualSearchProfile, type ExplorerVariant } from "./visualSearch";

/** Ilustração vetorial autoral; os distratores diferem por cor e/ou forma. */
function SearchExplorer({ variant, tier }: { variant: ExplorerVariant; tier: number }) {
  // 2-3 anos: contraste; 4-9 anos: gradualmente misturamos cores;
  // 10-17 anos: todos os bonés têm a mesma cor, exigindo análise do símbolo.
  const otherHats = ["var(--snp-sky)", "var(--snp-grass)", "var(--snp-lilac)"];
  const hat = tier >= 3
    ? "var(--snp-sky)"
    : tier === 2
      ? (variant === 0 || variant === 2 ? "var(--snp-sky)" : otherHats[(variant - 1) % 3])
      : tier === 1
        ? (variant === 0 || variant === 1 ? "var(--snp-sun)" : otherHats[(variant - 1) % 3])
        : variant === 0 ? "var(--snp-sun)" : otherHats[(variant - 1) % 3];
  const star = "M32 12L34.1 16.6L39 17.1L35.4 20.5L36.3 25.4L32 23L27.7 25.4L28.6 20.5L25 17.1L29.9 16.6Z";
  const symbol = variant === 0
    ? <path d={star} fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.7" />
    : variant === 1
      ? <circle cx="32" cy="19" r="5" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />
      : variant === 2
        ? <path d="M32 13L38 19L32 25L26 19Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />
        : variant === 3
          ? <path d="M26 15H38V23H26Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.9" />
          : variant === 4
            ? <path d="M32 11L35 16L40 19L35 22L32 27L29 22L24 19L29 16Z" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.7" />
            : variant === 5
              ? <path d={star} fill="none" stroke="var(--snp-sun)" strokeWidth="2.5" />
              : <path d={star} transform="translate(9 0)" fill="var(--snp-sun)" stroke="var(--snp-ink-fixed)" strokeWidth="0.7" />;
  return (
    <svg viewBox="0 0 64 72" className="h-full w-full" aria-hidden="true" focusable="false">
      <rect x="17" y="43" width="30" height="26" rx="9" fill="var(--snp-sky)" stroke="var(--snp-ink-fixed)" strokeWidth="2" />
      <circle cx="32" cy="34" r="18" fill="var(--snp-paper-fixed)" stroke="var(--snp-ink-fixed)" strokeWidth="2.5" />
      <path d="M14 27V18Q14 10 23 10H41Q50 10 50 18V27Z" fill={hat} stroke="var(--snp-ink-fixed)" strokeWidth="2" />
      <path d="M9 26Q32 32 55 26" fill="none" stroke="var(--snp-ink-fixed)" strokeWidth="3" strokeLinecap="round" />
      {symbol}
      <circle cx="26" cy="36" r="2" fill="var(--snp-ink-fixed)" />
      <circle cx="38" cy="36" r="2" fill="var(--snp-ink-fixed)" />
      <path d="M28 43Q32 47 36 43" fill="none" stroke="var(--snp-berry)" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 54H42" stroke="var(--snp-paper-fixed)" strokeWidth="2" />
    </svg>
  );
}

const SEARCH_LABELS: Readonly<Record<ExplorerVariant, string>> = {
  0: "estrela preenchida no centro do boné",
  1: "círculo no boné",
  2: "losango no boné",
  3: "quadrado no boné",
  4: "estrela de quatro pontas no boné",
  5: "estrela vazada no boné",
  6: "estrela preenchida fora do centro do boné",
};

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
  const layout = profile.columns <= 2 ? "grid-cols-2"
    : profile.columns === 3 ? "grid-cols-3"
      : profile.columns === 4 ? "grid-cols-3 sm:grid-cols-4"
        : profile.columns === 5 ? "grid-cols-4 sm:grid-cols-5"
          : "grid-cols-5 sm:grid-cols-6";
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
        <div className="h-16 w-16 shrink-0" aria-hidden="true"><SearchExplorer variant={0} tier={profile.tier} /></div>
        <div>
          <p className="text-lg font-black">{profile.tier <= 1 ? "Toque no explorador igual ao modelo!" : "Ache a estrela cheia no CENTRO do boné."}</p>
          <p className="text-xs">Encontre um só. Toque nele antes de acabar o tempo.</p>
        </div>
      </div>
      <div className={"grid gap-1.5 rounded-xl border-2 border-slate-500 bg-slate-100 p-2 " + layout}
        role="group" aria-label="Cenário de busca visual">
        {board.map((variant, index) => (
          <button key={index} type="button"
            className="flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white p-1 transition-colors hover:bg-sky-100 focus-visible:outline focus-visible:outline-4 focus-visible:outline-sky-600 disabled:opacity-70"
            style={{ minHeight: profile.minTileHeight }}
            disabled={paused || answered.current}
            aria-label={"Personagem " + (index + 1) + ": " + SEARCH_LABELS[variant]}
            onClick={(event) => choose(variant, event)}>
            <span className="block h-full w-full max-w-[72px]"><SearchExplorer variant={variant} tier={profile.tier} /></span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs opacity-80">
        Tempo de jogo ajustado à densidade e à semelhança das figuras, não é corte clínico. A pausa congela a contagem; um toque encerra a tentativa.
      </p>
    </div>
  );
}

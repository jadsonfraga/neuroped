import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Option, TouchItem } from "./items";
import { buildVisualSearchBoard, visualSearchChoice, visualSearchProfile, type ExplorerVariant } from "./visualSearch";

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
  const remainingPercent = Math.max(0, Math.min(100, (left / profile.seconds) * 100));
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
    const selectedIndex = visualSearchChoice(variant, seconds, profile.seconds);
    onAnswer(selectedIndex === null ? null : item.options[selectedIndex], event,
      Math.min(seconds, profile.seconds));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4" data-testid="visual-search-stage" data-age={years}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="snp-chip">Missão bônus · busca visual</span>
        <span className="snp-chip">{profile.cells} personagens</span>
        <span className="snp-chip bg-[var(--snp-paper-fixed)]" role="timer" aria-live="off"
          aria-label={"Tempo restante: " + left + " segundos"}>
          <span aria-hidden="true">⏱</span> Tempo: <strong className={left <= 10 ? "text-red-700" : ""}>{left}s</strong>
        </span>
      </div>
      <div className="overflow-hidden rounded-full bg-[var(--snp-paper-fixed)]"
        aria-hidden="true" data-testid="visual-search-time-bar">
        <div className="h-2.5 rounded-full bg-[var(--snp-grass)] motion-safe:transition-[width] motion-safe:duration-300"
          style={{ width: remainingPercent + "%" }} />
      </div>
      <div className="flex items-center gap-3 rounded-2xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-sun-tint)] p-3 sm:gap-5 sm:p-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--snp-ink-fixed)] bg-white p-1 shadow-sm sm:h-28 sm:w-28" aria-hidden="true">
          <SearchExplorer variant={0} tier={profile.tier} />
        </div>
        <div className="space-y-1 text-[var(--snp-ink-fixed)]">
          <span className="text-xs font-bold uppercase tracking-wide">Encontre este explorador</span>
          <p className="text-base font-black leading-snug sm:text-xl">{profile.tier <= 1 ? "Procure um igual ao modelo!" : "Estrela cheia e centralizada no boné."}</p>
          <p className="text-xs font-semibold sm:text-sm">Aponte ou toque uma vez. Você pode pausar a busca.</p>
        </div>
      </div>
      <div className={"grid gap-2 rounded-2xl border-2 border-[var(--snp-ink-40)] bg-[var(--snp-sky-tint)] p-2 sm:gap-2.5 sm:p-3 " + layout}
        role="group" aria-label={"Cenário de busca visual com " + profile.cells + " personagens"}>
        {board.map((variant, index) => (
          <button key={index} type="button"
            className="flex min-h-[48px] touch-manipulation items-center justify-center rounded-xl border-2 border-[var(--snp-ink-40)] bg-white p-1 shadow-sm transition-colors hover:border-[var(--snp-ink-fixed)] hover:bg-[var(--snp-sun-tint)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-1 focus-visible:outline-[var(--snp-ink-fixed)] disabled:opacity-70"
            style={{ minHeight: profile.minTileHeight }}
            disabled={paused || answered.current}
            aria-label={"Personagem " + (index + 1) + ": " + SEARCH_LABELS[variant]}
            onClick={(event) => choose(variant, event)}>
            <span className="block aspect-[8/9] w-full max-w-[72px]" aria-hidden="true"><SearchExplorer variant={variant} tier={profile.tier} /></span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs opacity-80">
        Um toque encerra a tentativa. A pausa interrompe o relógio. Tempo lúdico, sem valor de corte clínico.
      </p>
    </div>
  );
}

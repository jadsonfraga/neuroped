/**
 * Aventura — primitivos de gamificação compartilhados entre os Testes
 * Cognitivos por Faixa Etária e a Sonda Dez.
 *
 * Filosofia (vale para qualquer superfície que use estes componentes):
 *   • estrelas medem PARTICIPAÇÃO (itens respondidos, missões concluídas),
 *     medalhas medem CONCLUSÃO; nunca acerto, código de resposta ou escore;
 *   • a criança não vê certo/errado; o feedback é sempre neutro;
 *   • o registro clínico e o relatório não recebem nada daqui.
 *
 * Só animação CSS (tailwindcss-animate + motion-safe): os e2e da Sonda
 * instalam relógio falso no navegador, o que congela requestAnimationFrame e
 * qualquer animação dirigida por JavaScript.
 */
import { softTap } from "@/lib/softSounds";

export const HEROES = [
  { id: "raposa", emoji: "🦊", name: "Raposa" },
  { id: "panda", emoji: "🐼", name: "Panda" },
  { id: "unicornio", emoji: "🦄", name: "Unicórnio" },
  { id: "dragao", emoji: "🐉", name: "Dragão" },
  { id: "foguete", emoji: "🚀", name: "Foguete" },
  { id: "golfinho", emoji: "🐬", name: "Golfinho" },
] as const;
export type Hero = (typeof HEROES)[number];
export const DEFAULT_HERO: Hero = HEROES[0];

/** Frases neutras: giram por posição, nunca pela resposta dada. */
export const NEUTRAL_CHEERS = [
  "Registrado!",
  "Anotado, vamos em frente!",
  "Boa, próxima fase!",
  "Mais uma estrela!",
] as const;

export function HeroGrid({
  current,
  onPick,
  compact = false,
}: {
  current: Hero | null;
  onPick: (hero: Hero) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`grid gap-2 ${compact ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3 gap-3 sm:grid-cols-6"}`}
      role="group"
      aria-label="Escolha do herói"
    >
      {HEROES.map((hero, index) => {
        const selected = current?.id === hero.id;
        return (
          <button
            key={hero.id}
            type="button"
            onClick={() => {
              softTap();
              onPick(hero);
            }}
            aria-pressed={selected}
            style={{ animationDelay: `${index * 40}ms` }}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:hover:scale-105 motion-safe:active:scale-95 ${compact ? "min-h-[72px] p-2" : "min-h-[104px] p-3"} ${selected ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/50"}`}
          >
            <span className={compact ? "text-3xl" : "text-4xl"} aria-hidden="true">
              {hero.emoji}
            </span>
            <span className="text-xs font-bold">{hero.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Trilha de missões: nós concluídos viram estrela, o nó atual carrega o herói,
 * os próximos mostram o número. "Concluído" é participação (a missão foi
 * fechada), não desempenho.
 */
export function MissionTrail({
  hero,
  current,
  done,
  labels,
}: {
  hero: Hero;
  current: number;
  done: boolean[];
  labels: string[];
}) {
  const total = labels.length;
  return (
    <ol
      className="flex flex-wrap items-center gap-1.5"
      aria-label={`Trilha da aventura: ${done.filter(Boolean).length} de ${total} missões concluídas`}
    >
      {labels.map((label, i) => {
        const isDone = done[i];
        const isNow = i === current;
        const state = isNow ? "now" : isDone ? "done" : "next";
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              title={`${i + 1}. ${label}${isDone ? " · concluída" : isNow ? " · atual" : ""}`}
              className={`flex items-center justify-center rounded-full font-black transition ${
                state === "now"
                  ? "h-9 w-9 bg-primary text-xl ring-4 ring-primary/25 motion-safe:animate-pulse"
                  : state === "done"
                    ? "h-8 w-8 bg-amber-300 text-sm text-amber-950"
                    : "h-8 w-8 bg-muted text-xs text-muted-foreground"
              }`}
            >
              <span aria-hidden="true">
                {state === "now" ? hero.emoji : state === "done" ? "★" : i + 1}
              </span>
              <span className="sr-only">
                {i + 1}. {label}: {isDone ? "concluída" : isNow ? "atual" : "a caminho"}
              </span>
            </span>
            {i < total - 1 && (
              <span
                aria-hidden="true"
                className={`h-1 w-3 rounded-full sm:w-5 ${isDone ? "bg-amber-300" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function StarCounter({ stars, label = "estrelas" }: { stars: number; label?: string }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-xl bg-amber-100/70 px-3 py-1 dark:bg-amber-950/40"
      aria-live="polite"
      aria-label={`${stars} ${label}`}
    >
      <span className="text-xl" aria-hidden="true">
        ⭐
      </span>
      <span
        key={stars}
        className="text-base font-black tabular-nums text-amber-900 motion-safe:animate-in motion-safe:zoom-in-75 dark:text-amber-100"
      >
        {stars}
      </span>
    </div>
  );
}

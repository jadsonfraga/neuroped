/**
 * Telas dos itens dos Testes Cognitivos por Faixa Etária. Uma por tipo de item:
 *   • TapBody: estímulo + alternativas; a criança toca e a tela confere;
 *   • BuildBody: peças de letras; a criança monta a palavra e a tela confere
 *     quando a última peça entra;
 *   • SayBody: só o estímulo, grande; a criança fala e o adulto compara com a
 *     resposta esperada (que fica fora desta tela).
 *
 * Nada aqui mostra certo/errado à criança. Só animação CSS (motion-safe), sem
 * timers: o motor do Modo Fácil convive com o relógio falso dos e2e.
 */
import { useMemo, useState } from "react";
import { Delete } from "lucide-react";
import type { EasyAnswerDetail } from "@/components/jogo-facil/easyReport";
import { softTap } from "@/lib/softSounds";
import { buildMatches, type BuildItem, type CognitiveItem, type SayItem, type TapItem } from "./bank";

const OPTION_TINTS = [
  "bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900 dark:hover:bg-rose-950/50",
  "bg-sky-50 hover:bg-sky-100 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900 dark:hover:bg-sky-950/50",
  "bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:hover:bg-amber-950/50",
  "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900 dark:hover:bg-emerald-950/50",
];

function shuffled<T>(values: readonly T[]): T[] {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Estímulo grande: figura, letra, número ou palavra; texto corrido quando é uma frase/passagem. */
export function StimulusView({ value, testid }: { value: string; testid?: string }) {
  const passage = value.length > 14 && /\s/.test(value) && !/__/.test(value);
  return (
    <div
      data-testid={testid}
      className={`rounded-3xl border-2 border-primary/30 bg-background px-4 py-5 text-center shadow-sm ${passage ? "text-left text-xl font-semibold leading-relaxed sm:text-2xl" : "whitespace-pre-line text-5xl font-black leading-tight tracking-wide sm:text-7xl"}`}
      aria-label="Estímulo"
    >
      {value}
    </div>
  );
}

export function TapBody({
  item,
  selected,
  disabled = false,
  onPick,
}: {
  item: TapItem;
  selected?: string | null;
  disabled?: boolean;
  onPick: (option: string) => void;
}) {
  // Ordem sorteada por item, estável enquanto o item está na tela: a resposta
  // certa não fica sempre na mesma posição.
  const options = useMemo(() => shuffled(item.options), [item.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const registered = selected !== undefined && selected !== null;
  return (
    <div className="space-y-4">
      {item.stimulus && <StimulusView value={item.stimulus} />}
      <div className={`grid gap-3 ${item.big ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`} role="group" aria-label="Alternativas">
        {options.map((option, index) => {
          const chosen = registered && option === selected;
          const dimmed = registered && !chosen;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled || registered}
              aria-pressed={chosen}
              onClick={() => {
                softTap();
                onPick(option);
              }}
              className={`relative rounded-3xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring disabled:cursor-default motion-safe:active:scale-95 ${OPTION_TINTS[index % OPTION_TINTS.length]} ${chosen ? "border-primary ring-4 ring-primary/20" : ""} ${dimmed ? "opacity-40" : ""} ${item.big ? "flex min-h-[96px] items-center justify-center break-words text-4xl font-black sm:min-h-[120px] sm:text-6xl" : "min-h-[64px] text-base font-semibold sm:text-lg"}`}
            >
              <span>{option}</span>
              {chosen && (
                <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BuildBody({ item, onDone, testid = "cognitive-build" }: { item: BuildItem; onDone: (placed: string[]) => void; testid?: string }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const full = placed.length >= item.target.length;
  const letters = placed.map((index) => item.tiles[index]);
  function put(index: number) {
    if (full || placed.includes(index)) return;
    softTap();
    const next = [...placed, index];
    setPlaced(next);
    if (next.length === item.target.length) onDone(next.map((i) => item.tiles[i]));
  }
  function erase() {
    if (!placed.length || full) return;
    softTap();
    setPlaced(placed.slice(0, -1));
  }
  return (
    <div className="space-y-4" data-testid={testid}>
      {item.show && item.stimulus && <StimulusView value={item.stimulus} />}
      <div className="flex flex-wrap justify-center gap-2" aria-label="Palavra montada" data-testid={`${testid}-slots`}>
        {item.target.map((_, index) => (
          <span key={index} className={`flex h-16 w-14 items-center justify-center rounded-2xl border-2 text-3xl font-black sm:h-20 sm:w-16 sm:text-4xl ${letters[index] ? "border-primary bg-primary/10" : "border-dashed border-muted-foreground/40 bg-background"}`}>
            {letters[index] ?? ""}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label="Letras disponíveis">
        {item.tiles.map((letter, index) => {
          const used = placed.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={used || full}
              aria-label={`Letra ${letter}`}
              onClick={() => put(index)}
              className={`min-h-16 rounded-2xl border-2 text-3xl font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring motion-safe:active:scale-95 sm:min-h-20 sm:text-4xl ${used ? "border-muted bg-muted text-muted-foreground/40" : `${OPTION_TINTS[index % OPTION_TINTS.length]}`}`}
            >
              {letter}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={erase} disabled={!placed.length || full} className="mx-auto flex min-h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-bold disabled:opacity-40">
        <Delete className="h-4 w-4" aria-hidden="true" /> Apagar última letra
      </button>
    </div>
  );
}

export function SayBody({ item }: { item: SayItem }) {
  return <StimulusView value={item.stimulus} testid="cognitive-say-stimulus" />;
}

/** Como o registro descreve a resposta esperada de cada tipo de item. */
export function expectedText(item: CognitiveItem): string {
  if (item.kind === "tap") return item.answer;
  if (item.kind === "say") return item.expected;
  return item.target.join("");
}

/** Dica curta para o adulto, por tipo de item. */
export function adultHint(item: CognitiveItem): string {
  if (item.kind === "tap") return `Mostre e deixe a criança tocar; a tela confere sozinha. Se ela apontar ou falar a resposta em vez de tocar, marque você. Esperado: ${item.answer}`;
  if (item.kind === "say") return `Esperado: ${item.expected}`;
  return item.show
    ? `A palavra fica visível; a criança toca nas letras na ordem e a tela confere sozinha. Esperado: ${item.target.join("")}`
    : `Fale a palavra; a criança toca nas letras na ordem e a tela confere sozinha. Esperado: ${item.target.join("")}`;
}

/**
 * Tela da criança para o Modo Fácil: corpo do item + botão de voltar. Toque em
 * alternativa ou última letra encerra sozinho com o desfecho; no item de fala,
 * só o adulto encerra e marca.
 */
export function ChildScreen({ item, onDone, testid = "cognitive-child" }: { item: CognitiveItem; onDone: (auto?: "acertou" | "nao", detail?: EasyAnswerDetail) => void; testid?: string }) {
  return (
    <div data-testid={testid} className="rounded-3xl border-4 border-primary/40 bg-gradient-to-b from-primary/5 to-background p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button type="button" onClick={() => onDone()} className="min-h-11 rounded-xl border px-3 text-sm font-semibold">
          ← Voltar ao aplicador
        </button>
        <span className="text-xs font-semibold text-muted-foreground">Tela da criança</span>
      </div>
      {item.kind === "tap" && <TapBody item={item} onPick={(option) => onDone(option === item.answer ? "acertou" : "nao", { chosen: option, correct: item.answer })} />}
      {item.kind === "build" && <BuildBody item={item} onDone={(placed) => onDone(buildMatches(item, placed) ? "acertou" : "nao", { chosen: placed.join(""), correct: item.target.join("") })} />}
      {item.kind === "say" && <SayBody item={item} />}
    </div>
  );
}

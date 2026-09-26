/**
 * Tela de escolha do Modo Fácil objetivo: enunciado em letras grandes e de duas
 * a quatro opções tocáveis. O toque decide certo/errado e devolve ao motor;
 * a criança não vê certo nem errado. Só CSS: nenhum timer.
 */
import { useRef, type ReactNode } from "react";
import type { EasyStep } from "./EasyGame";
import { OBJECTIVE_DOMAIN_LABEL, OBJECTIVE_TOOL_TITLE, objectiveItems, type ObjectiveItem, type ObjectiveTool } from "./objectiveBank";

const TILE = [
  "border-sky-300 bg-sky-50 text-sky-950 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-50",
  "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-50",
  "border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-50",
  "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950 hover:bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-50",
];

export function ObjectiveChoice({ item, testid, onAnswer }: { item: ObjectiveItem; testid: string; onAnswer: (chosen: string) => void }) {
  // Um toque por item: o segundo toque (comum em criança) não chega ao motor.
  const answered = useRef(false);
  const big = item.options.every((option) => [...option].length <= 6);
  const cols = item.options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div data-testid={`${testid}-choice`} className="rounded-3xl border-4 border-primary/30 bg-background p-4 sm:p-6">
      <p className="text-center text-2xl font-black leading-snug sm:text-3xl">{item.say}</p>
      <div className={`mt-5 grid grid-cols-1 gap-4 ${cols}`} role="group" aria-label="Opções">
        {item.options.map((option, index) => (
          <button
            key={option}
            type="button"
            data-testid={`${testid}-option`}
            aria-label={`Opção: ${option}`}
            onClick={() => {
              if (answered.current) return;
              answered.current = true;
              onAnswer(option);
            }}
            // Estilo inline: as folhas de estilo próprias das páginas (ex.: .obs10 button)
            // redefinem fonte, altura e borda de todo botão; a tela da criança precisa
            // ficar grande em qualquer página.
            style={{ minHeight: "8rem", padding: "1.5rem 1rem", fontSize: big ? "4rem" : "1.35rem", lineHeight: 1.15, borderWidth: 4 }}
            className={`flex items-center justify-center rounded-3xl border-4 font-black shadow-md transition motion-safe:active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring ${TILE[index % TILE.length]}`}
          >
            <span className="whitespace-pre-line text-center leading-tight">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function buildObjectiveSteps(tool: ObjectiveTool, years: number, testid: string): EasyStep[] {
  return objectiveItems(tool, years).map((item, index) => ({
    id: `${tool}-${years}-${index}`,
    group: OBJECTIVE_DOMAIN_LABEL[item.domain],
    title: item.say,
    say: item.say,
    hint: years <= 5 ? "Leia em voz alta e deixe a criança tocar na tela." : "A criança lê e toca. Leia junto se ela pedir.",
    child: ({ onDone }): ReactNode => (
      <ObjectiveChoice
        item={item}
        testid={testid}
        onAnswer={(chosen) => onDone(chosen === item.answer ? "acertou" : "nao", { chosen, correct: item.answer })}
      />
    ),
  }));
}

export function objectiveNature(tool: ObjectiveTool): string {
  return `${OBJECTIVE_TOOL_TITLE[tool]} · Modo Fácil objetivo: itens de figuras, letras, leitura, escrita e números graduados por idade, todos na tela; a resposta é o toque da criança, julgado pelo aplicativo. Registro descritivo de certo/errado por item, sem escore, percentil, ponto de corte ou equivalência a instrumento licenciado. Quem lê e conclui é o médico.`;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { appMetrics } from "@/data/appMetrics";
import { softTap } from "@/lib/softSounds";

/**
 * Tour guiado — ensina o FLUXO DE TRABALHO, não o inventário.
 *
 * A versão anterior abria anunciando quantas escalas, itens filtráveis e
 * medicações existem. Amplitude é prova de maturidade, não instrução de uso:
 * quem abre o app pela primeira vez precisa saber como conduzir um atendimento
 * do início ao fim. Os números continuam presentes, mas como fecho — não como
 * mensagem principal.
 */

const DONE_KEY = "np_tour_v2_done";

interface TourStep {
  emoji: string;
  title: string;
  body: string;
  target?: string;
}

const STEPS: TourStep[] = [
  {
    emoji: "🩺",
    title: "1. Comece pelo paciente",
    body: "A home abre no cockpit clínico: quem está em atendimento, o contexto dessa pessoa e o próximo passo. Escolha ou troque o paciente aqui e todas as telas seguintes já abrem nesse contexto.",
    target: '[data-testid="clinical-cockpit"]',
  },
  {
    emoji: "🎯",
    title: "2. Escolha a tarefa",
    body: "Com o paciente em foco, prontuário, laudo e receita abrem já vinculados a ele. Nada de refazer o caminho lista → ficha → ferramenta a cada troca de tarefa.",
    target: '[data-testid="cockpit-actions"]',
  },
  {
    emoji: "🔎",
    title: "3. Encontre o instrumento certo",
    body: "Não sabe qual escala aplicar? O Filtro Clínico parte da queixa, da idade e do contexto e devolve as opções ordenadas por adequação — sem inventar pontuação clínica.",
    target: '[data-testid="nav-Filtro Clínico Inteligente"]',
  },
  {
    emoji: "📝",
    title: "4. Aplique e interprete",
    body: "Cada instrumento indica itens obrigatórios, marca pendências e mostra o registro completo de perguntas e respostas. A leitura clínica é sua; o app organiza a evidência.",
  },
  {
    emoji: "📄",
    title: "5. Produza o documento",
    body: "Do resultado ao laudo estruturado ou à receita C1 sem redigitar identificação: o paciente em foco preenche o cabeçalho e o documento sai pronto para revisão e assinatura.",
  },
  {
    emoji: "📈",
    title: "6. Continue o acompanhamento",
    body: "A ficha do paciente guarda avaliações anteriores, linha clínica e documentos emitidos — é de onde parte o próximo retorno.",
  },
  {
    emoji: "🧭",
    title: "Ajuda sempre à mão",
    body: `Este botão reúne tour, ajuda contextual, preferências e acessibilidade em um só lugar. Por baixo do fluxo há ${appMetrics.scaleCount} escalas, ${appMetrics.filterableInstrumentCount} itens filtráveis e ${appMetrics.medicationCount} medicações — amplitude que você usa sob demanda, não decora.`,
    target: '[data-testid="button-floating-help"]',
  },
];

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function visibleRect(selector?: string): Rect | null {
  if (!selector || typeof document === "undefined") return null;
  try {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    if (r.bottom < 0 || r.top > window.innerHeight) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      return el.getBoundingClientRect();
    }
    return r;
  } catch {
    return null;
  }
}

export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const recompute = useCallback((stepIdx: number) => {
    setRect(visibleRect(STEPS[stepIdx]?.target));
  }, []);

  useEffect(() => {
    if (!open) return;
    recompute(idx);
    const focusFrame = window.requestAnimationFrame(() => cardRef.current?.focus());

    function onResize() {
      recompute(idx);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;

      const focusable = [...cardRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === cardRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]);

  const start = useCallback(() => {
    softTap();
    previousFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setIdx(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    const openTour = () => start();
    window.addEventListener("neuroped:open-tour", openTour);
    return () => window.removeEventListener("neuroped:open-tour", openTour);
  }, [start]);

  function finish() {
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch { /* storage indisponivel — silencioso */ }
    const returnTarget = previousFocusRef.current
      ?? document.querySelector<HTMLElement>('[data-testid="button-floating-help"]');
    window.requestAnimationFrame(() => returnTarget?.focus());
  }

  function next() {
    if (idx >= STEPS.length - 1) finish();
    else {
      softTap();
      setIdx((i) => i + 1);
    }
  }

  function prev() {
    if (idx > 0) {
      softTap();
      setIdx((i) => i - 1);
    }
  }

  const step = STEPS[idx];

  const cardStyle: React.CSSProperties = rect
    ? {
        left: Math.min(Math.max(14, rect.left), Math.max(14, window.innerWidth - 358)),
        top:
          rect.top + rect.height + 240 > window.innerHeight
            ? Math.max(14, rect.top - 232)
            : rect.top + rect.height + 12,
      }
    : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[99998]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-step-title"
          aria-describedby="tour-step-body"
          aria-label="Tour guiado"
        >
          <div
            className="absolute inset-0 bg-[rgba(8,8,20,0.55)] backdrop-blur-[2px]"
            onClick={finish}
            aria-hidden="true"
          />

          {rect && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute rounded-2xl transition-all duration-300"
              style={{
                left: rect.left - 6,
                top: rect.top - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                boxShadow:
                  "0 0 0 9999px rgba(8,8,20,0.62), 0 0 0 3px hsl(243 85% 66%), 0 0 32px 4px hsl(243 85% 66% / 0.6)",
              }}
            />
          )}

          <div
            ref={cardRef}
            tabIndex={-1}
            className="absolute z-[100000] w-[min(344px,calc(100vw-36px))] rounded-2xl border border-indigo-400/40 bg-gradient-to-b from-[#15152a] to-[#101022] p-5 pr-12 text-indigo-50 shadow-2xl outline-none transition-[left,top] duration-300"
            style={cardStyle}
          >
            <button
              type="button"
              onClick={finish}
              aria-label="Fechar o tour"
              className="absolute right-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-indigo-100 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {step.emoji && <div className="mb-2 text-3xl leading-none">{step.emoji}</div>}
            <h3 id="tour-step-title" className="mb-1.5 text-lg font-bold tracking-tight text-white">
              {step.title}
            </h3>
            <p id="tour-step-body" className="mb-4 text-sm leading-relaxed text-indigo-100/80">
              {step.body}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, d) => (
                  <span
                    key={d}
                    className={`h-1.5 w-1.5 rounded-full transition-all ${
                      d === idx ? "bg-indigo-400 shadow-[0_0_8px] shadow-indigo-400" : "bg-indigo-400/30"
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    className="flex min-h-11 items-center gap-1 rounded-xl bg-white/10 px-3 text-xs font-bold text-indigo-50 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Anterior
                  </button>
                )}
                <button
                  type="button"
                  onClick={finish}
                  className="min-h-11 rounded-xl px-3 text-xs font-bold text-indigo-200/80 transition-colors hover:bg-white/10 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  Pular
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex min-h-11 items-center gap-1 rounded-xl bg-gradient-to-b from-indigo-500 to-violet-600 px-3 text-xs font-bold text-white shadow-[0_8px_28px_rgba(99,102,241,0.45),0_2px_8px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                >
                  {idx === STEPS.length - 1 ? "Concluir" : "Próximo"}
                  {idx < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

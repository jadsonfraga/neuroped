import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { appMetrics } from "@/data/appMetrics";
import { softTap } from "@/lib/softSounds";

/**
 * Tour guiado de boas-vindas.
 *
 * Versao atualizada para explicar: filtro ampliado, numeros reais, aba dos pais,
 * politica de acesso e separacao entre conteudo familiar nao sensivel e dados
 * clinicos individualizados.
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
    emoji: "",
    title: "Bem-vindo ao NeuroPed",
    body: `O app agora mostra numeros derivados do catalogo real: ${appMetrics.scaleCount} escalas, ${appMetrics.filterableInstrumentCount} itens filtraveis e ${appMetrics.medicationCount} medicacoes cadastradas.`,
  },
  {
    emoji: "🔎",
    title: "Filtro Clínico Inteligente",
    body: "Digite uma queixa ou selecione idade. Toda busca devolve Ouro, Prata, Bronze, Teste Direto e Questionário Escolar — sem inventar pontuação clínica.",
    target: '[data-testid="nav-Filtro Clínico Inteligente"]',
  },
  {
    emoji: "📚",
    title: "Escalas, questionários e inventários",
    body: "O filtro inclui escalas do catálogo, instrumentos suplementares aplicáveis, inventários escolares, autoavaliações e 100 escalas mundiais sem custo quando disponíveis.",
    target: '[data-testid="nav-100 escalas mundiais"]',
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Aba dos pais / psicoeducação",
    body: "Informações não sensíveis ficam concentradas no Portal dos pais: orientações gerais, rotina, escola, novidades, CAA e política de acesso.",
    target: '[data-testid="nav-Portal dos pais"]',
  },
  {
    emoji: "🧭",
    title: "Orientação parental",
    body: "A orientação parental traz conteúdo educativo por tema, com linguagem familiar e sem expor prontuário, dados médicos individualizados ou documentos restritos.",
    target: '[data-testid="nav-Orientação parental"]',
  },
  {
    emoji: "📰",
    title: "Novidades para famílias",
    body: "Artigos e explicações gerais podem ser consultados pela família sem acessar áreas clínicas sensíveis.",
    target: '[data-testid="nav-Novidades para famílias"]',
  },
  {
    emoji: "🔐",
    title: "Política de acesso",
    body: "Documentos, prescrições, prontuário e dados de paciente só aparecem quando liberados pelo profissional ou protegidos por fluxo clínico. O app não deve misturar isso com psicoeducação aberta.",
    target: '[data-testid="nav-Política de acesso"]',
  },
  {
    emoji: "🏫",
    title: "Questionário escolar",
    body: "A área escolar permanece filtrável e também aparece para a família como ponte com professores, sem substituir avaliação médica.",
    target: '[data-testid="nav-Questionário escolar"]',
  },
  {
    emoji: "✨",
    title: "Tudo pronto",
    body: "Toque no botão '?' sempre que quiser rever o guia. O tour cobre filtro, números reais e todos os pontos principais disponíveis para pais.",
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
            className="np-tour-backdrop absolute inset-0 backdrop-blur-[3px]"
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
                  boxShadow: "var(--np-tour-spotlight-shadow)",
              }}
            />
          )}

          <div
            ref={cardRef}
            tabIndex={-1}
            className="np-tour-card absolute z-[100000] w-[min(344px,calc(100vw-36px))] rounded-2xl border p-5 pr-12 outline-none transition-[left,top] duration-300"
            style={cardStyle}
          >
            <button
              type="button"
              onClick={finish}
              aria-label="Fechar o tour"
              className="np-tour-close absolute right-1.5 top-1.5 grid h-11 w-11 place-items-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            {step.emoji && <div className="mb-2 text-3xl leading-none">{step.emoji}</div>}
            <h3 id="tour-step-title" className="mb-1.5 text-lg font-bold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p id="tour-step-body" className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1.5" aria-hidden="true">
                {STEPS.map((_, d) => (
                  <span
                    key={d}
                    className={`np-tour-progress h-1.5 w-1.5 rounded-full transition-all ${d === idx ? "np-tour-progress-active" : ""}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    className="np-tour-secondary flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" /> Anterior
                  </button>
                )}
                <button
                  type="button"
                  onClick={finish}
                  className="np-tour-secondary min-h-11 rounded-xl px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Pular
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="np-tour-primary flex min-h-11 items-center gap-1 rounded-xl px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

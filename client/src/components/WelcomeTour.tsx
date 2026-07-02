import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
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
const INTRO_KEY = "np_tour_intro_v2";

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
  const [introHighlight, setIntroHighlight] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(INTRO_KEY) !== "1") {
        setIntroHighlight(true);
        localStorage.setItem(INTRO_KEY, "1");
        const t = setTimeout(() => setIntroHighlight(false), 6000);
        return () => clearTimeout(t);
      }
    } catch { /* storage indisponivel — silencioso */ }
  }, []);

  const recompute = useCallback((stepIdx: number) => {
    setRect(visibleRect(STEPS[stepIdx]?.target));
  }, []);

  useEffect(() => {
    if (!open) return;
    recompute(idx);
    cardRef.current?.focus();
    function onResize() {
      recompute(idx);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx]);

  function start() {
    softTap();
    setIntroHighlight(false);
    setIdx(0);
    setOpen(true);
  }

  function finish() {
    setOpen(false);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch { /* storage indisponivel — silencioso */ }
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
          rect.top + rect.height + 220 > window.innerHeight
            ? Math.max(14, rect.top - 212)
            : rect.top + rect.height + 12,
      }
    : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };

  return (
    <>
      <button
        onClick={start}
        aria-label="Rever o tour guiado do app"
        title="Rever tour"
        className={[
          "fixed right-5 bottom-6 z-[99990] flex items-center justify-center gap-2 rounded-full",
          "bg-gradient-to-b from-indigo-500 to-violet-600 text-white shadow-[0_8px_28px_rgba(99,102,241,0.45),0_2px_8px_rgba(0,0,0,0.25)]",
          "transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300",
          introHighlight ? "h-12 px-5 text-sm font-bold animate-pulse" : "h-11 w-11",
        ].join(" ")}
        data-testid="button-tour"
      >
        {introHighlight ? (
          <>
            <HelpCircle className="w-5 h-5" aria-hidden="true" /> Tour do app
          </>
        ) : (
          <HelpCircle className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[99998]" role="dialog" aria-modal="true" aria-label="Tour guiado">
          <div className="absolute inset-0 bg-[rgba(8,8,20,0.55)] backdrop-blur-[2px]" onClick={finish} />

          {rect && (
            <div
              aria-hidden="true"
              className="absolute rounded-2xl pointer-events-none transition-all duration-300"
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
            className="absolute z-[100000] w-[min(344px,calc(100vw-36px))] rounded-2xl border border-indigo-400/40 bg-gradient-to-b from-[#15152a] to-[#101022] p-5 text-indigo-50 shadow-2xl outline-none transition-[left,top] duration-300"
            style={cardStyle}
          >
            <button
              onClick={finish}
              aria-label="Fechar o tour"
              className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-white/10 text-indigo-100 hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>

            {step.emoji && <div className="text-3xl leading-none mb-2">{step.emoji}</div>}
            <h3 className="text-lg font-bold text-white tracking-tight mb-1.5">{step.title}</h3>
            <p className="text-sm leading-relaxed text-indigo-100/80 mb-4">{step.body}</p>

            <div className="flex items-center justify-between gap-2">
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
              <div className="flex items-center gap-1.5">
                {idx > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-50 hover:bg-white/20"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                  </button>
                )}
                <button
                  onClick={finish}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-200/70 hover:text-indigo-100"
                >
                  Pular
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-[0_8px_28px_rgba(99,102,241,0.45),0_2px_8px_rgba(0,0,0,0.25)]"
                >
                  {idx === STEPS.length - 1 ? "Concluir" : "Próximo"}
                  {idx < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

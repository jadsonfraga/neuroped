import { useCallback, useEffect, useRef, useState } from "react";
import { HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { softTap } from "@/lib/softSounds";

/**
 * Tour guiado de boas-vindas — porta de `tour.js` (app legado) para React.
 *
 * Não abre sozinho: um botão "?" flutuante (canto inferior direito) abre o
 * tour a qualquer momento. Na 1ª visita o botão aparece com destaque maior por
 * alguns segundos. O Onboarding (modal de 1º acesso) é separado deste tour.
 *
 * Cada passo pode apontar para um elemento da UI (via seletor); se o alvo não
 * estiver visível (ex.: sidebar recolhida no mobile), o cartão é centralizado
 * sem spotlight. Acessível: ESC fecha, foco inicial no cartão, aria-labels.
 */

const DONE_KEY = "np_tour_v1_done";
const INTRO_KEY = "np_tour_intro_v1";

interface TourStep {
  emoji: string;
  title: string;
  body: string;
  /** Seletor CSS do alvo do spotlight (opcional). */
  target?: string;
}

const STEPS: TourStep[] = [
  {
    emoji: "👋",
    title: "Bem-vindo ao NeuroPed",
    body: "Em um minutinho mostro o essencial da plataforma de neuropediatria do Dr. Jadson Fraga. Vamos juntos?",
  },
  {
    emoji: "🔎",
    title: "Filtro Inteligente",
    body: "Descreva uma queixa — autismo, sono, TDAH — e o app sugere as escalas e ferramentas certas por faixa etária.",
    target: '[data-testid="nav-Filtro Inteligente"]',
  },
  {
    emoji: "📊",
    title: "Banco de escalas",
    body: "Centenas de instrumentos validados, organizados por domínio. O PANT reúne uma grande coletânea pronta para uso.",
    target: '[data-testid="nav-PANT (100 Escalas)"]',
  },
  {
    emoji: "🧒",
    title: "Testes com a criança",
    body: "Testes diretos e lúdicos — reconhecimento, leitura/escrita, autoavaliação — com mascotes e feedback por idade.",
    target: '[data-testid="nav-Cores/Letras/Animais/Corpo"]',
  },
  {
    emoji: "💬",
    title: "CAA · Vou Falar",
    body: "Comunicação alternativa com voz em português, cartões grandes por categoria e montagem de frases.",
    target: '[data-testid="nav-CAA · Vou Falar"]',
  },
  {
    emoji: "👨‍👩‍👧",
    title: "Portal da Família",
    body: "Conteúdo educativo: novidades, orientações e política de acesso para as famílias acompanharem o cuidado.",
    target: '[data-testid="nav-Portal da Família"]',
  },
  {
    emoji: "🔒",
    title: "Seus dados, no seu dispositivo",
    body: "Os registros das ferramentas ficam no navegador. Exporte (CSV/relatório) para levar à consulta quando quiser.",
  },
  {
    emoji: "✨",
    title: "Tudo pronto!",
    body: "Toque no botão “?” no canto da tela sempre que quiser rever este guia. Bom trabalho!",
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

  // 1ª visita: destaca o botão "?" por alguns segundos (não abre o tour sozinho).
  useEffect(() => {
    try {
      if (localStorage.getItem(INTRO_KEY) !== "1") {
        setIntroHighlight(true);
        localStorage.setItem(INTRO_KEY, "1");
        const t = setTimeout(() => setIntroHighlight(false), 6000);
        return () => clearTimeout(t);
      }
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
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
    } catch { /* storage indisponível (modo privado/cota) — silencioso */ }
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

  // Posição do cartão: abaixo do alvo, ou centralizado se não houver alvo.
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
      {/* Botão flutuante "?" */}
      <button
        onClick={start}
        aria-label="Rever o tour guiado do app"
        title="Rever tour"
        className={[
          "fixed right-4 bottom-20 z-[99990] flex items-center justify-center gap-2 rounded-full",
          "bg-gradient-to-b from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/40",
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
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[rgba(8,8,20,0.55)] backdrop-blur-[2px]" onClick={finish} />

          {/* Spotlight (buraco) sobre o alvo */}
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

          {/* Cartão */}
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

            <div className="text-3xl leading-none mb-2">{step.emoji}</div>
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
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-b from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/40"
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

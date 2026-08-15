import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Vibrate, X } from "lucide-react";
import { useUiPreferences } from "@/hooks/useUiPreferences";
import { softTap } from "@/lib/softSounds";
import { fadeIn, scaleIn, easing } from "@/lib/motion";

const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences";

/**
 * Preferências de UI abertas sob demanda pela ajuda global.
 *
 * Não mantém FAB próprio: em celular e tablet um segundo botão fixo competia
 * com o dock e fragmentava a hierarquia. A ajuda é o único ponto persistente.
 */
export function PreferencesPanel() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { soundOn, hapticOn, toggleSound, toggleHaptic } = useUiPreferences();

  useEffect(() => {
    const openPreferences = () => setOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-end sm:justify-start sm:p-6 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preferences-title"
          data-testid="preferences-dialog"
        >
          <motion.button
            type="button"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/30 backdrop-blur-sm"
            aria-label="Fechar preferências"
          />

          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-card-border p-4">
              <div>
                <h3 id="preferences-title" className="text-sm font-semibold">Preferências</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Som e resposta tátil do aplicativo</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  setOpen(false);
                  softTap();
                }}
                className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Fechar preferências"
                data-testid="button-close-preferences"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-2">
              <PrefRow
                icon={soundOn ? Volume2 : VolumeX}
                label="Sons da interface"
                description="Toques sutis ao clicar e navegar"
                on={soundOn}
                onToggle={toggleSound}
              />
              <PrefRow
                icon={Vibrate}
                label="Vibração tátil"
                description="Feedback no celular, quando disponível"
                on={hapticOn}
                onToggle={toggleHaptic}
              />
            </div>

            <div className="border-t border-card-border p-3">
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Configurações salvas neste dispositivo. Você pode alterá-las a qualquer momento pela ajuda.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PrefRow({
  icon: Icon,
  label,
  description,
  on,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onToggle();
        softTap();
      }}
      className="flex min-h-14 w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-pressed={on}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: on ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
          color: on ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{
          background: on ? "hsl(var(--primary))" : "hsl(var(--muted))",
        }}
        aria-hidden="true"
      >
        <motion.div
          animate={{ x: on ? 16 : 2 }}
          transition={{ duration: 0.2, ease: easing.smooth }}
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  );
}

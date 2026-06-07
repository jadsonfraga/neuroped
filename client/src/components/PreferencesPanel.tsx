import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Volume2, VolumeX, Vibrate, Settings, X } from "lucide-react";
import { useUiPreferences } from "@/hooks/useUiPreferences";
import { softTap } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { fadeIn, scaleIn, easing, duration } from "@/lib/motion";

/**
 * Painel flutuante de preferencias UI/UX (som, vibracao).
 * Discreto, fixed bottom-right, abre com FAB de engrenagem.
 */
export function PreferencesPanel() {
  const [open, setOpen] = useState(false);
  const { soundOn, hapticOn, toggleSound, toggleHaptic } = useUiPreferences();

  return (
    <>
      {/* FAB */}
      <motion.button
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1.2, duration: duration.normal, ease: easing.spring }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setOpen((s) => !s);
          softTap();
          haptic.tap();
        }}
        className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full shadow-lg flex items-center justify-center print:hidden"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
        aria-label="Preferencias de UI"
      >
        <Settings className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-16 left-4 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <div className="p-4 border-b border-card-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Preferências</h3>
                <button
                  onClick={() => {
                    setOpen(false);
                    softTap();
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 -mr-1"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
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
                  description="Ligada por padrão; respeita sua escolha neste dispositivo"
                  on={hapticOn}
                  onToggle={toggleHaptic}
                />
              </div>

              <div className="p-3 border-t border-card-border">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  A vibração tátil fica ligada por padrão e pode ser desligada manualmente neste dispositivo.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
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
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: on ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
          color: on ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div
        className="shrink-0 w-9 h-5 rounded-full relative transition-colors"
        style={{
          background: on ? "hsl(var(--primary))" : "hsl(var(--muted))",
        }}
      >
        <motion.div
          animate={{ x: on ? 16 : 2 }}
          transition={{ duration: 0.2, ease: easing.smooth }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  );
}

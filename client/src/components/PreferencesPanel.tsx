import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Volume2, VolumeX, Vibrate } from "lucide-react";
import { useUiPreferences } from "@/hooks/useUiPreferences";
import { softTap } from "@/lib/softSounds";
import { easing } from "@/lib/motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const OPEN_PREFERENCES_EVENT = "neuroped:open-preferences";

/**
 * Preferências de UI abertas sob demanda pelo centro único de ajuda.
 * Sem FAB persistente: a superfície não compete com navegação, formulários ou
 * o dock compacto. O Dialog fornece foco confinado, Escape e retorno de foco.
 */
export function PreferencesPanel() {
  const [open, setOpen] = useState(false);
  const { soundOn, hapticOn, toggleSound, toggleHaptic } = useUiPreferences();

  useEffect(() => {
    const openPreferences = () => setOpen(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, openPreferences);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-sm overflow-hidden rounded-2xl p-0"
        data-testid="preferences-panel"
      >
        <DialogHeader className="border-b border-card-border px-4 py-4 pr-12 text-left">
          <DialogTitle>Preferências</DialogTitle>
          <DialogDescription>
            Ajuste sons discretos e resposta tátil neste dispositivo.
          </DialogDescription>
        </DialogHeader>

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
            Configurações salvas neste dispositivo. Você pode alterá-las a qualquer momento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
      aria-pressed={on}
      onClick={() => {
        softTap();
        onToggle();
      }}
      className="flex min-h-14 w-full items-start gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

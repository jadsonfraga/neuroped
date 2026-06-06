import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { softTap, softError } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { fadeIn, scaleIn, easing, duration } from "@/lib/motion";

/**
 * Modal de confirmação premium. Substituto elegante do confirm() nativo.
 *
 * Uso:
 *   const [confirming, setConfirming] = useState(false);
 *   <ConfirmDialog
 *     open={confirming}
 *     onClose={() => setConfirming(false)}
 *     onConfirm={async () => { await deleteIt(); setConfirming(false); }}
 *     title="Apagar paciente?"
 *     description="Esta ação não pode ser desfeita."
 *     confirmLabel="Apagar"
 *     variant="destructive"
 *   />
 */

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: duration.normal, ease: easing.spring }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-desc"
              className="pointer-events-auto w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--card-border))",
              }}
            >
              {variant === "destructive" && (
                <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 to-red-600" />
              )}
              {variant === "default" && (
                <div className="h-1.5 w-full bg-gradient-to-r from-primary to-chart-2" />
              )}

              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                      variant === "destructive"
                        ? "bg-rose-500/10"
                        : "bg-primary/10"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        variant === "destructive" ? "text-rose-500" : "text-primary"
                      }`}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      id="confirm-title"
                      className="text-lg font-semibold leading-tight"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {title}
                    </h2>
                    {description && (
                      <p
                        id="confirm-desc"
                        className="text-sm text-muted-foreground mt-2 leading-relaxed"
                      >
                        {description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Fechar"
                    className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-7 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      softTap();
                      haptic.tap();
                      onClose();
                    }}
                    disabled={loading}
                  >
                    {cancelLabel}
                  </Button>
                  <Button
                    onClick={async () => {
                      if (variant === "destructive") {
                        softError();
                        haptic.warning();
                      } else {
                        softTap();
                        haptic.tap();
                      }
                      await onConfirm();
                    }}
                    disabled={loading}
                    className={
                      variant === "destructive"
                        ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:opacity-90"
                        : ""
                    }
                  >
                    {loading ? "Aguarde…" : confirmLabel}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

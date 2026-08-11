import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { softSuccess, softError, softBell } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";

/**
 * Sistema de toast premium com som + haptic.
 *
 * Uso:
 *   const { toast } = useToast();
 *   toast.success("Salvo com sucesso");
 *   toast.error("Falha ao salvar");
 *   toast.info("Sincronização em andamento");
 */

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastApi {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, description?: string) => {
      const id = nextId++;
      const t: Toast = { id, variant, message, description, duration: 3600 };
      setToasts((prev) => [...prev, t]);

      // Som + haptic apropriado
      if (variant === "success") {
        softSuccess();
        haptic.success();
      } else if (variant === "error") {
        softError();
        haptic.error();
      } else {
        softBell();
        haptic.notify();
      }
    },
    []
  );

  const api = useMemo(
    (): ToastApi => ({
      success: (m, d) => push("success", m, d),
      error: (m, d) => push("error", m, d),
      info: (m, d) => push("info", m, d),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, toast.duration ?? 3600);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  const config = {
    success: {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    error: {
      icon: AlertCircle,
      iconColor: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
    info: {
      icon: Info,
      iconColor: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/30",
    },
  }[toast.variant];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ duration: duration.normal, ease: easing.smooth }}
      role="status"
      aria-live="polite"
      className="pointer-events-auto"
    >
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${config.bg} ${config.border}`}
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.85))`,
        }}
      >
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} strokeWidth={1.75} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{toast.message}</p>
          {toast.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-md hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback seguro sem provider — apenas console
    return {
      success: () => {},
      error: (m) => console.warn("[toast.error]", m),
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

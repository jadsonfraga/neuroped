import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { uiFeedback } from "@/lib/uiFeedback";
import { easing, duration } from "@/lib/motion";

/**
 * Sistema de toast premium com feedback multimodal.
 *
 * O texto/estado visual é sempre o canal primário. Som e vibração, quando
 * habilitados explicitamente, apenas complementam o significado do toast.
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

      if (variant === "success") {
        uiFeedback.success();
      } else if (variant === "error") {
        uiFeedback.error();
      } else {
        uiFeedback.info();
      }
    },
    [],
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
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2 pointer-events-none">
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
  const onDismissRef = useRef(onDismiss);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const t = setTimeout(() => onDismissRef.current(), toast.duration ?? 3600);
    return () => clearTimeout(t);
  }, [toast.duration]);

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
  const isError = toast.variant === "error";

  return (
    <motion.div
      initial={
        reducedMotion ? false : { opacity: 0, x: 24, scale: 0.96 }
      }
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={
        reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, scale: 0.96 }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: duration.normal, ease: easing.smooth }
      }
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className="pointer-events-auto"
    >
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md ${config.bg} ${config.border}`}
        style={{
          background: `linear-gradient(135deg, hsl(var(--card) / 0.92), hsl(var(--card) / 0.85))`,
        }}
      >
        <Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconColor}`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-foreground">
            {toast.message}
          </p>
          {toast.description && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </motion.div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Falhar silenciosamente sem provider evita que mensagens potencialmente
    // sensíveis acabem no console do navegador.
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}

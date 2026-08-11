import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ====================================================
// LOADING STATES
// ====================================================

export function PageLoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function InlineLoadingState({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function TableLoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label="Carregando dados">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl border bg-muted/45" />
      ))}
    </div>
  );
}

// ====================================================
// EMPTY STATES
// ====================================================

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
      <SearchX className="mb-3 h-7 w-7 text-muted-foreground" aria-hidden="true" />
      <div className="max-w-sm space-y-1.5">
        <p className="font-semibold">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button className="mt-4" variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

// ====================================================
// ERROR STATES
// ====================================================

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Não foi possível carregar os dados.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center">
      <AlertCircle className="mb-3 h-7 w-7 text-destructive" aria-hidden="true" />
      <div className="max-w-sm space-y-1.5">
        <p className="font-semibold">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function InlineErrorState({ message = "Não foi possível concluir.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3" role="alert">
      <div className="space-y-1.5 max-w-sm">
        <p className="font-semibold">Algo deu errado</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

// ====================================================
// SUCCESS TOAST (inline, auto-dismiss)
// ====================================================

interface SuccessToastProps {
  message: string;
  durationMs?: number;
  onDismiss?: () => void;
}

export function SuccessToast({ message, durationMs = 3000, onDismiss }: SuccessToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 fade-in"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
      {message}
    </div>
  );
}

// ====================================================
// SAVING INDICATOR
// ====================================================

interface SavingIndicatorProps {
  saving: boolean;
  label?: string;
}

export function SavingIndicator({ saving, label = "Salvando…" }: SavingIndicatorProps) {
  if (!saving) return null;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

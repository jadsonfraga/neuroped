/**
 * VisualStates.tsx
 * Componentes padronizados de estado visual para o NeuroPed.
 *
 * Estados disponíveis:
 *  <LoadingState />      — skeleton loader ou spinner discreto
 *  <EmptyState />        — mensagem útil + ação sugerida
 *  <ErrorState />        — mensagem clara + retry
 *  <SuccessToast />      — banner discreto (auto-dismiss 3s)
 *  <SavingIndicator />   — "Salvando..." em botão
 *  <OfflineBanner />     — aviso de modo offline (navigator.onLine)
 *
 * USO:
 *   import { LoadingState, EmptyState, ErrorState } from "@/components/ui/VisualStates";
 */

import { useEffect, useState, type ReactNode } from "react";
import { WifiOff, AlertCircle, CheckCircle2, RefreshCw, Loader2, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

// ====================================================
// LOADING STATE
// ====================================================

interface LoadingStateProps {
  /** Número de linhas de skeleton a exibir */
  rows?: number;
  /** Usar spinner compacto em vez de skeleton */
  compact?: boolean;
  /** Mensagem acessível para leitores de tela */
  label?: string;
}

export function LoadingState({ rows = 3, compact = false, label = "Carregando..." }: LoadingStateProps) {
  if (compact) {
    return (
      <div
        className="flex items-center justify-center py-10"
        role="status"
        aria-label={label}
        aria-live="polite"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      className="space-y-3 p-4"
      role="status"
      aria-label={label}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className="h-4 bg-muted rounded animate-pulse"
            style={{ width: `${75 + (i % 3) * 8}%` }}
            aria-hidden="true"
          />
          {i === 0 && (
            <div className="h-3 bg-muted rounded animate-pulse w-1/2" aria-hidden="true" />
          )}
        </div>
      ))}
    </div>
  );
}

/** Skeleton específico para cards de paciente */
export function PatientCardSkeleton() {
  return (
    <div
      className="border border-border rounded-xl p-4 space-y-3 animate-pulse"
      role="status"
      aria-label="Carregando dados do paciente"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted" aria-hidden="true" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-muted rounded w-2/3" aria-hidden="true" />
          <div className="h-3 bg-muted rounded w-1/3" aria-hidden="true" />
        </div>
      </div>
      <div className="h-3 bg-muted rounded" aria-hidden="true" />
      <div className="h-3 bg-muted rounded w-4/5" aria-hidden="true" />
      <span className="sr-only">Carregando dados do paciente</span>
    </div>
  );
}

// ====================================================
// EMPTY STATE
// ====================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div
        className="w-14 h-14 rounded-full bg-muted flex items-center justify-center"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="w-7 h-7 text-muted-foreground" />}
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ====================================================
// ERROR STATE
// ====================================================

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  message = "Não foi possível carregar os dados.",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div
        className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive"
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs underline hover:no-underline"
            aria-label="Tentar novamente"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center" aria-hidden="true">
        <AlertCircle className="w-7 h-7 text-destructive" />
      </div>
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
// SAVING INDICATOR (botão desabilitado durante save)
// ====================================================

interface SavingIndicatorProps {
  saving: boolean;
  label?: string;
  savingLabel?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
}

export function SavingButton({
  saving,
  label = "Salvar",
  savingLabel = "Salvando...",
  onClick,
  disabled = false,
  className = "",
  variant = "default",
}: SavingIndicatorProps) {
  return (
    <Button
      onClick={onClick}
      disabled={saving || disabled}
      aria-busy={saving}
      aria-label={saving ? savingLabel : label}
      variant={variant}
      className={`gap-2 ${className}`}
    >
      {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {saving ? savingLabel : label}
    </Button>
  );
}

// ====================================================
// OFFLINE BANNER
// ====================================================

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    function onOnline() { setOffline(false); }
    function onOffline() { setOffline(true); }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-medium"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>Modo offline — algumas funcionalidades podem estar indisponíveis</span>
    </div>
  );
}

// ====================================================
// PAGE WRAPPER com estados unificados
// ====================================================

interface PageStateWrapperProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  onRetry?: () => void;
  loadingRows?: number;
  children: ReactNode;
}

/**
 * Wrapper conveniente que gerencia os três estados mais comuns
 * (loading, error, empty) antes de renderizar o conteúdo.
 */
export function PageStateWrapper({
  loading,
  error,
  empty,
  emptyTitle = "Nenhum item encontrado",
  emptyDescription,
  emptyAction,
  onRetry,
  loadingRows,
  children,
}: PageStateWrapperProps) {
  if (loading) return <LoadingState rows={loadingRows} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }
  return <>{children}</>;
}

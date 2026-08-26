import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uiFeedback } from "@/lib/uiFeedback";

/**
 * Modal de confirmação premium. Substituto elegante do confirm() nativo.
 *
 * O diálogo mantém título, descrição e estado visual como canais primários.
 * Feedback sensorial é complementar e reservado a ações relevantes.
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
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onClose();
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(event) => {
            if (loading) event.preventDefault();
          }}
          className="fixed left-1/2 top-1/2 z-[100] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border border-card-border bg-card shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
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
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  variant === "destructive" ? "bg-rose-500/10" : "bg-primary/10"
                }`}
                aria-hidden="true"
              >
                <AlertTriangle
                  className={`h-6 w-6 ${
                    variant === "destructive" ? "text-rose-500" : "text-primary"
                  }`}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogPrimitive.Title
                  className="text-lg font-semibold leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {title}
                </AlertDialogPrimitive.Title>
                <AlertDialogPrimitive.Description
                  className={
                    description
                      ? "mt-2 text-sm leading-relaxed text-muted-foreground"
                      : "sr-only"
                  }
                >
                  {description ?? "Confirme se deseja continuar com esta ação."}
                </AlertDialogPrimitive.Description>
              </div>
              <AlertDialogPrimitive.Cancel asChild>
                <button
                  type="button"
                  disabled={loading}
                  aria-label="Fechar"
                  className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </AlertDialogPrimitive.Cancel>
            </div>

            <div className="mt-7 flex items-center justify-end gap-2">
              <AlertDialogPrimitive.Cancel asChild>
                <Button type="button" variant="ghost" disabled={loading}>
                  {cancelLabel}
                </Button>
              </AlertDialogPrimitive.Cancel>
              <AlertDialogPrimitive.Action asChild>
                <Button
                  type="button"
                  disabled={loading}
                  className={
                    variant === "destructive"
                      ? "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:opacity-90"
                      : ""
                  }
                  onClick={async (event) => {
                    // A mutation controla `open`; impedir o auto-close nativo
                    // mantém foco/inert até sucesso ou cancelamento explícito.
                    event.preventDefault();
                    if (variant === "destructive") uiFeedback.warning();
                    await onConfirm();
                  }}
                >
                  {loading ? "Aguarde…" : confirmLabel}
                </Button>
              </AlertDialogPrimitive.Action>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

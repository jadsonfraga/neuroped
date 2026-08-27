import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  route: string;
}

interface State {
  hasError: boolean;
  incidentId: string;
}

function createIncidentId(): string {
  try {
    return crypto.randomUUID().split("-")[0].toUpperCase();
  } catch {
    return Date.now().toString(36).toUpperCase();
  }
}

function isChunkLikeError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "";
  return /(?:ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module)/i.test(message);
}

/**
 * Isola uma falha de rota lazy do shell clínico. O boundary é remontado por
 * rota no AppRouter; assim, navegar para uma seção diferente continua sendo
 * possível mesmo quando uma aba antiga perdeu um único chunk.
 */
export class RouteRecoveryBoundary extends Component<Props, State> {
  state: State = { hasError: false, incidentId: "" };

  static getDerivedStateFromError(): State {
    return { hasError: true, incidentId: createIncidentId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Não serializa erro, props ou payloads clínicos. O código e a rota são
    // suficientes para correlação operacional sem PHI.
    console.error("[RouteRecoveryBoundary] falha de rota", {
      code: isChunkLikeError(error) ? "ROUTE_CHUNK_LOAD" : "ROUTE_RENDER",
      route: this.props.route,
      incidentId: this.state.incidentId,
      componentStack: info.componentStack?.split("\n").slice(0, 6).join("\n"),
    });
  }

  private retry = () => {
    window.location.reload();
  };

  private updateCache = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("neuroped-"))
            .map((key) => caches.delete(key)),
        );
      }
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.update()));
      }
    } finally {
      window.location.reload();
    }
  };

  private goHome = () => {
    window.location.hash = "#/";
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section
        className="np-route-recovery relative isolate mx-auto flex min-h-[55vh] w-full max-w-3xl items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-card/95 p-6 shadow-xl sm:p-10"
        role="alert"
        aria-live="assertive"
      >
        <div className="np-route-recovery-art" aria-hidden="true" />
        <div className="relative z-10 max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-foreground">Esta seção não carregou</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Nenhum dado clínico foi perdido. Tente carregar a seção novamente
            ou volte ao início enquanto atualizamos apenas os recursos desta rota.
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Código técnico: <span className="font-mono text-foreground">{this.state.incidentId}</span>
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <Button onClick={this.retry} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </Button>
            <Button variant="outline" onClick={this.updateCache} className="gap-2">
              <Trash2 className="h-4 w-4" /> Atualizar recursos
            </Button>
            <Button variant="ghost" onClick={this.goHome} className="gap-2">
              <Home className="h-4 w-4" /> Ir ao início
            </Button>
          </div>
        </div>
      </section>
    );
  }
}

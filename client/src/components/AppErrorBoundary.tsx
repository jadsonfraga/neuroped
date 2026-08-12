import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
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

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, incidentId: "" };

  static getDerivedStateFromError(): State {
    return { hasError: true, incidentId: createIncidentId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Não persiste mensagem, props, estado nem dados clínicos. O identificador e
    // os nomes de componentes bastam para correlacionar um relato técnico.
    console.error("[AppErrorBoundary] falha de renderização", {
      incidentId: this.state.incidentId,
      errorType: error.name || "Error",
      componentStack: info.componentStack?.split("\n").slice(0, 8).join("\n"),
    });
  }

  private reload = () => window.location.reload();

  private clearAppCacheAndReload = async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((key) => key.startsWith("neuroped-")).map((key) => caches.delete(key)),
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

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-5">
        <section className="w-full max-w-lg rounded-3xl border border-destructive/20 bg-card p-6 text-center shadow-xl" role="alert">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-foreground">O NeuroPed encontrou uma falha</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seus registros locais não foram apagados. Recarregue o aplicativo; se a falha persistir, atualize somente o cache do app.
          </p>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Identificador técnico: <span className="font-mono text-foreground">{this.state.incidentId}</span>
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button onClick={this.reload} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Recarregar
            </Button>
            <Button variant="outline" onClick={this.clearAppCacheAndReload} className="gap-2">
              <Trash2 className="h-4 w-4" /> Atualizar cache
            </Button>
          </div>
        </section>
      </main>
    );
  }
}

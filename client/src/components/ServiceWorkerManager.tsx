import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const VERSION_KEY = "neuroped:sw-version";

interface UpdateInfo {
  version: string;
}

export function ServiceWorkerManager() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let idleId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const rememberVersion = (version: string) => {
      let previous: string | null = null;
      try {
        previous = localStorage.getItem(VERSION_KEY);
        localStorage.setItem(VERSION_KEY, version);
      } catch {
        // Sem persistência, a atualização ainda pode ser aplicada normalmente.
      }
      if (previous && previous !== version) setUpdate({ version });
    };

    const handleMessage = (event: MessageEvent) => {
      const version = typeof event.data?.version === "string" ? event.data.version : "";
      if (!version) return;
      if (event.data?.type === "SW_UPDATED" || event.data?.type === "SW_VERSION") {
        rememberVersion(version);
      }
    };

    const askCurrentVersion = () => {
      navigator.serviceWorker.controller?.postMessage({ type: "GET_VERSION" });
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    navigator.serviceWorker.addEventListener("controllerchange", askCurrentVersion);

    const register = () => {
      if (cancelled) return;
      navigator.serviceWorker
        .register("./sw.js")
        .then(async (registration) => {
          askCurrentVersion();
          await registration.update().catch(() => undefined);
        })
        .catch(() => undefined);
    };

    const scheduleRegistration = () => {
      // O precache offline inclui os atalhos clínicos e compete com os chunks da
      // tela ativa. Damos prioridade absoluta à primeira interação; depois do
      // intervalo, o navegador escolhe uma janela ociosa para instalar o PWA.
      fallbackTimer = globalThis.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          idleId = window.requestIdleCallback(register, { timeout: 8_000 });
        } else {
          register();
        }
      }, 10_000);
    };

    if (document.readyState === "complete") scheduleRegistration();
    else window.addEventListener("load", scheduleRegistration, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleRegistration);
      if (idleId !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (fallbackTimer !== undefined) globalThis.clearTimeout(fallbackTimer);
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      navigator.serviceWorker.removeEventListener("controllerchange", askCurrentVersion);
    };
  }, []);

  if (!update) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[260] mx-auto flex max-w-xl items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 p-3 shadow-2xl backdrop-blur" role="status" aria-live="polite">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <RefreshCw className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Nova versão disponível</p>
        <p className="text-xs text-muted-foreground">Atualize para usar as correções mais recentes.</p>
      </div>
      <Button size="sm" onClick={() => window.location.reload()} className="shrink-0">Atualizar</Button>
      <Button variant="ghost" size="icon" onClick={() => setUpdate(null)} aria-label="Fechar aviso de atualização" className="h-8 w-8 shrink-0">
        <X className="h-4 w-4" />
      </Button>
    </aside>
  );
}

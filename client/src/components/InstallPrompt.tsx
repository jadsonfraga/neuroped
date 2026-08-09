import { useState, useEffect } from "react";
import { Download, X, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
      setShowBanner(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    setDismissed(true);
    setShowBanner(false);
  }

  if (installed || dismissed || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border border-primary/20 rounded-2xl shadow-2xl p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Instalar NeuroPed</h2>
              <p className="text-xs text-muted-foreground">Use como app no seu computador</p>
            </div>
          </div>
          <button onClick={handleDismiss} aria-label="Dispensar convite de instalação" className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Monitor className="w-3.5 h-3.5" />
          <span>Shell e atalhos principais offline · Janela própria · Atalho na área de trabalho</span>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleInstall} size="sm" className="flex-1 gap-2 h-9">
            <Download className="w-4 h-4" />
            Instalar Agora
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="sm" className="h-9">
            Depois
          </Button>
        </div>
      </div>
    </div>
  );
}

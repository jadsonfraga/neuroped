import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Globe2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { integratedExperiences } from "@/data/integrations";

type FrameStatus = "loading" | "ready" | "timeout" | "error";

export default function ManusIntegracoesPage() {
  const [activeId, setActiveId] = useState(integratedExperiences[0].id);
  const [frameKey, setFrameKey] = useState(0);
  const [frameStatus, setFrameStatus] = useState<FrameStatus>("loading");
  const activeSite = useMemo(
    () =>
      integratedExperiences.find((site) => site.id === activeId) ??
      integratedExperiences[0],
    [activeId],
  );

  useEffect(() => {
    setFrameStatus("loading");
    const timeout = window.setTimeout(() => setFrameStatus("timeout"), 10_000);
    return () => window.clearTimeout(timeout);
  }, [activeSite.id, frameKey]);

  const openActiveSite = () => {
    window.open(activeSite.href, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            Integrações incorporadas
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Experiências dentro do NeuroPed
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Acesse experiências locais em abas isoladas, sem misturar sessões,
            dados clínicos ou armazenamento do aplicativo. O prontuário e a
            agenda continuam sob o controle do NeuroPed.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 self-start lg:self-auto"
          onClick={openActiveSite}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Abrir em nova guia
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 py-4 text-sm text-muted-foreground sm:flex-row sm:items-start">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p>
            <strong className="text-foreground">Isolamento seguro:</strong> cada
            experiência roda em uma rota local ou em um microsite versionado no
            deploy do NeuroPed. O app não recebe senhas de terceiros, não copia
            dados externos e não grava informações de integrações no SQLite
            clínico.
          </p>
        </CardContent>
      </Card>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2"
        role="tablist"
        aria-label="Experiências integradas"
      >
        {integratedExperiences.map((site) => {
          const active = site.id === activeId;
          return (
            <button
              key={site.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`integrated-panel-${site.id}`}
              onClick={() => {
                setActiveId(site.id);
                setFrameKey((key) => key + 1);
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {site.shortLabel}
            </button>
          );
        })}
      </div>

      <Card
        id={`integrated-panel-${activeSite.id}`}
        role="tabpanel"
        aria-label={activeSite.label}
        className="overflow-hidden"
      >
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">Integrado</Badge>
                <span className="text-xs text-muted-foreground">
                  {activeSite.href}
                </span>
              </div>
              <CardTitle>{activeSite.label}</CardTitle>
              <CardDescription className="mt-1">
                {activeSite.description}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2 self-start"
              onClick={() => {
                setFrameStatus("loading");
                setFrameKey((key) => key + 1);
              }}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              Recarregar
            </Button>
          </div>
          <p className="pt-2 text-xs leading-5 text-muted-foreground">
            {activeSite.note}
          </p>
        </CardHeader>
        <CardContent className="relative p-0">
          {(frameStatus === "loading" ||
            frameStatus === "timeout" ||
            frameStatus === "error") && (
            <div
              className="absolute inset-x-0 top-0 z-10 flex min-h-32 items-center justify-center border-b bg-background/95 p-6 text-center backdrop-blur-sm"
              role="status"
            >
              <div className="max-w-xl space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  {frameStatus === "loading"
                    ? "Carregando experiência integrada…"
                    : "Esta experiência não pode ser exibida dentro do NeuroPed."}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  {frameStatus === "loading"
                    ? "Se o conteúdo não aparecer em alguns segundos, abra a experiência em uma nova guia."
                    : "O destino pode exigir uma janela própria ou estar temporariamente indisponível. Seus dados clínicos continuam isolados."}
                </p>
                {frameStatus !== "loading" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={openActiveSite}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Abrir em nova guia
                  </Button>
                )}
              </div>
            </div>
          )}
          <iframe
            key={`${activeSite.id}-${frameKey}`}
            title={activeSite.label}
            src={activeSite.href}
            className="h-[min(76vh,850px)] min-h-[560px] w-full border-0 bg-background"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen; autoplay"
            onLoad={() => setFrameStatus("ready")}
            onError={() => setFrameStatus("error")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

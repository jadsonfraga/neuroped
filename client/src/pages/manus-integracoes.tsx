import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
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

const surfaceLabels = {
  "internal-route": "Rota interna",
  "local-microsite": "Microsite local",
} as const;

const persistenceLabels = {
  "versioned-code": "Código versionado",
  "versioned-static-assets": "Assets versionados",
} as const;

export default function ManusIntegracoesPage() {
  const [activeId, setActiveId] = useState(integratedExperiences[0].id);
  const [frameKey, setFrameKey] = useState(0);
  const [frameStatus, setFrameStatus] = useState<FrameStatus>("loading");
  const [copied, setCopied] = useState(false);
  const activeSite = useMemo(
    () =>
      integratedExperiences.find((site) => site.id === activeId) ??
      integratedExperiences[0],
    [activeId],
  );
  const internalRouteCount = integratedExperiences.filter(
    (site) => site.surface === "internal-route",
  ).length;
  const micrositeCount = integratedExperiences.filter(
    (site) => site.surface === "local-microsite",
  ).length;

  useEffect(() => {
    setFrameStatus("loading");
    setCopied(false);
    const timeout = window.setTimeout(() => setFrameStatus("timeout"), 10_000);
    return () => window.clearTimeout(timeout);
  }, [activeSite.id, frameKey]);

  const openActiveSite = () => {
    window.open(activeSite.href, "_blank", "noopener,noreferrer");
  };

  const copyLocalPath = async () => {
    try {
      await navigator.clipboard.writeText(
        new URL(activeSite.href, window.location.origin).toString(),
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
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
            Um único lugar para abrir experiências locais sem misturar sessões,
            dados clínicos ou armazenamento do aplicativo. Cada destino tem
            proprietário, superfície e estratégia de persistência declarados.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start lg:self-auto">
          <Button
            variant="outline"
            className="gap-2"
            onClick={copyLocalPath}
            aria-label="Copiar caminho local da experiência ativa"
          >
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "Caminho copiado" : "Copiar caminho"}
          </Button>
          <Button variant="outline" className="gap-2" onClick={openActiveSite}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Abrir em nova guia
          </Button>
        </div>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Resumo de persistência"
      >
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Incorporadas
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {integratedExperiences.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            experiências no manifesto único
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Rotas internas
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {internalRouteCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            mantidas no código do NeuroPed
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Microsites locais
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {micrositeCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            assets persistentes no deploy
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
            Dependência Manus
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
            0
          </p>
          <p className="mt-1 text-xs text-emerald-800/70 dark:text-emerald-200/70">
            no runtime das experiências locais
          </p>
        </div>
      </section>

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
              data-testid={`integrated-tab-${site.id}`}
              onClick={() => {
                setActiveId(site.id);
                setFrameKey((key) => key + 1);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {site.shortLabel}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {site.surface === "local-microsite" ? "local" : "rota"}
              </span>
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
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">Incorporado</Badge>
                <Badge variant="secondary">
                  {surfaceLabels[activeSite.surface]}
                </Badge>
                <Badge variant="secondary">
                  {persistenceLabels[activeSite.persistence]}
                </Badge>
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
              aria-live="polite"
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

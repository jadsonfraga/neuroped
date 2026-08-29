import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  ExternalLink,
  Gamepad2,
  Globe2,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ManusSite = {
  id: "secretaria" | "missao" | "institucional";
  label: string;
  shortLabel: string;
  url: string;
  /** Rota interna do NeuroPed (navegação direta) ou site externo (iframe). */
  kind: "interna" | "externa";
  description: string;
  note: string;
  highlights: string[];
};

// As duas primeiras experiências foram INCORPORADAS ao NeuroPed: são rotas
// internas do próprio app. Abri-las em iframe carregaria o aplicativo inteiro
// dentro dele mesmo (bundle duplicado, dois roteadores, foco/rolagem presos),
// então navegamos direto. O iframe fica reservado ao site externo.
const manusUrls = {
  secretaria: "/#/marcacao",
  missao: "/#/missao-saude",
  institucional: import.meta.env.VITE_MANUS_INSTITUCIONAL_URL || "https://drjadsonmd-iqeiteek.manus.space",
};

const sites: ManusSite[] = [
  {
    id: "secretaria",
    label: "Secretaria IA",
    shortLabel: "Secretaria",
    url: manusUrls.secretaria,
    kind: "interna",
    description: "Encaminhamento administrativo e acesso à agenda pública integrada ao NeuroPed.",
    note: "A Secretaria IA foi incorporada ao NeuroPed como página interna. Ela não coleta informações clínicas nesta etapa.",
    highlights: [
      "Lista os profissionais com agenda pública aberta",
      "Leva à consulta de horários e à reserva com dados mínimos",
      "Sem diagnóstico, sintomas ou texto livre",
    ],
  },
  {
    id: "missao",
    label: "Missão Saúde",
    shortLabel: "Jogo",
    url: manusUrls.missao,
    kind: "interna",
    description: "Circuito educativo infantil com três estações sobre cuidados de saúde.",
    note: "A Missão Saúde foi incorporada ao NeuroPed como página interna. O progresso existe somente na sessão e não altera pacientes, agenda ou prontuários.",
    highlights: [
      "Três estações: movimento, comunicação e rotina",
      "Sem coleta de dados, avaliação ou pontuação clínica",
      "Tela final encaminha para a Secretaria IA e a agenda",
    ],
  },
  {
    id: "institucional",
    label: "Página institucional",
    shortLabel: "Institucional",
    url: manusUrls.institucional,
    kind: "externa",
    description: "Página pública institucional do Dr. Jadson Fraga, hospedada na plataforma Manus.",
    note: "Se o conteúdo não carregar dentro da aba, use a abertura externa; o site usa renderização dinâmica e pode bloquear incorporação.",
    highlights: [],
  },
];

function openInternal(url: string) {
  // "/#/rota" → troca somente o hash, sem recarregar o app.
  const hashIndex = url.indexOf("#");
  window.location.hash = hashIndex === -1 ? url : url.slice(hashIndex);
}

export default function ManusIntegracoesPage() {
  const [activeId, setActiveId] = useState<ManusSite["id"]>("secretaria");
  const [frameKey, setFrameKey] = useState(0);
  const [frameStatus, setFrameStatus] = useState<"loading" | "ready" | "timeout" | "error">("loading");
  const activeSite = useMemo(() => sites.find((site) => site.id === activeId) ?? sites[0], [activeId]);
  const isExternal = activeSite.kind === "externa";

  useEffect(() => {
    if (activeSite.kind !== "externa") return;
    setFrameStatus("loading");
    const timeout = window.setTimeout(() => {
      setFrameStatus((status) => (status === "loading" ? "timeout" : status));
    }, 10_000);
    return () => window.clearTimeout(timeout);
  }, [activeSite.id, activeSite.kind, frameKey]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Globe2 className="h-4 w-4" />Integrações conectadas</div>
          <h1 className="text-3xl font-semibold tracking-tight">Sites do Manus no NeuroPed</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">A Secretaria IA e a Missão Saúde foram incorporadas como páginas do próprio NeuroPed; a página institucional continua no domínio Manus. O prontuário e a agenda seguem sob o controle do NeuroPed.</p>
        </div>
        <Button variant="outline" className="gap-2 self-start lg:self-auto" onClick={() => window.open(activeSite.url, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" />Abrir em nova guia</Button>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 py-4 text-sm text-muted-foreground sm:flex-row sm:items-start">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p><strong className="text-foreground">Isolamento seguro:</strong> a página institucional é carregada no domínio original, isolada por iframe. As experiências incorporadas não coletam dados clínicos e não gravam informações externas no SQLite clínico.</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2" role="tablist" aria-label="Sites Manus">
        {sites.map((site) => {
          const active = site.id === activeId;
          return <button key={site.id} type="button" role="tab" aria-selected={active} aria-controls={`manus-panel-${site.id}`} onClick={() => { setActiveId(site.id); setFrameKey((key) => key + 1); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{site.shortLabel}</button>;
        })}
      </div>

      <Card id={`manus-panel-${activeSite.id}`} role="tabpanel" aria-label={activeSite.label} className="overflow-hidden">
        <CardHeader className={isExternal ? "border-b bg-muted/20" : "bg-muted/20"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2"><Badge variant="outline">{isExternal ? "Manus" : "Incorporado ao NeuroPed"}</Badge><span className="text-xs text-muted-foreground">{activeSite.url}</span></div>
              <CardTitle>{activeSite.label}</CardTitle>
              <CardDescription className="mt-1">{activeSite.description}</CardDescription>
            </div>
            {isExternal && (
              <Button size="sm" variant="ghost" className="gap-2 self-start" onClick={() => { setFrameStatus("loading"); setFrameKey((key) => key + 1); }}><RefreshCcw className="h-4 w-4" />Recarregar</Button>
            )}
          </div>
          <p className="pt-2 text-xs leading-5 text-muted-foreground">{activeSite.note}</p>
        </CardHeader>

        {isExternal ? (
          <CardContent className="relative p-0">
            {(frameStatus === "loading" || frameStatus === "timeout" || frameStatus === "error") && (
              <div className="absolute inset-x-0 top-0 z-10 flex min-h-32 items-center justify-center border-b bg-background/95 p-6 text-center backdrop-blur-sm" role="status">
                <div className="max-w-xl space-y-3">
                  <p className="text-sm font-semibold text-foreground">{frameStatus === "loading" ? "Carregando site Manus…" : "Este site não pode ser exibido dentro do NeuroPed."}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{frameStatus === "loading" ? "Se o conteúdo não aparecer em alguns segundos, abra o site em uma nova guia." : "O domínio pode bloquear incorporação por política de segurança, estar temporariamente fora do ar ou exigir login próprio. Seus dados clínicos continuam isolados."}</p>
                  {frameStatus !== "loading" && <Button size="sm" variant="outline" className="gap-2" onClick={() => window.open(activeSite.url, "_blank", "noopener,noreferrer")}><ExternalLink className="h-3.5 w-3.5" />Abrir em nova guia</Button>}
                </div>
              </div>
            )}
            <iframe key={`${activeSite.id}-${frameKey}`} title={activeSite.label} src={activeSite.url} className="h-[min(76vh,850px)] min-h-[560px] w-full border-0 bg-background" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" onLoad={() => setFrameStatus("ready")} onError={() => setFrameStatus("error")} />
          </CardContent>
        ) : (
          <CardContent className="space-y-5 p-6">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {activeSite.highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-sm leading-5 text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button className="gap-2" onClick={() => openInternal(activeSite.url)}>
                {activeSite.id === "missao" ? <Gamepad2 className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                Abrir {activeSite.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.open(activeSite.url, "_blank", "noopener,noreferrer")}>
                <ExternalLink className="h-4 w-4" />Abrir em nova guia
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">Por ser uma página do próprio NeuroPed, ela abre em navegação direta — sem duplicar o aplicativo dentro de um iframe. Use “Abrir em nova guia” para manter esta tela aberta.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

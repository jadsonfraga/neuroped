import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SafeAssetImage, visualAssetRegistry } from "@/components/BrandAssets";
import {
  ShieldCheck,
  Lock,
  Server,
  Smartphone,
  KeyRound,
  Database,
  Eye,
  GitBranch,
  Image,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * Qualidade NeuroPed — princípios de qualidade e segurança.
 *
 * Esta página também funciona como painel vivo de auditoria visual: todos os
 * assets oficiais do repositório são renderizados aqui para provar uso real no app
 * e expor falhas de carregamento sem bloquear a navegação.
 */

const PRINCIPIOS = [
  { icon: Lock, titulo: "Dados sensíveis protegidos", texto: "Prontuário, documentos e dados identificáveis nunca são expostos em páginas públicas. Áreas clínicas exigem autenticação profissional ou PIN master local." },
  { icon: Database, titulo: "Armazenamento local por padrão", texto: "Diários, CAA e registros ficam apenas no dispositivo (localStorage). Nada é enviado a servidores sem ação explícita do profissional." },
  { icon: KeyRound, titulo: "Acesso por papel", texto: "Rotas sensíveis (farmacologia, pacientes, prontuário, planos) são protegidas por guarda de rota." },
  { icon: Smartphone, titulo: "PWA e responsividade", texto: "Funciona offline para conteúdos locais, instala como app e adapta-se a celular, tablet e desktop, com áreas de toque ampliadas." },
  { icon: Eye, titulo: "Acessibilidade", texto: "Compromisso WCAG 2.2 AA: contraste, foco visível, navegação por teclado e semântica HTML5. Ver a Declaração de Acessibilidade." },
  { icon: Server, titulo: "Transparência clínica", texto: "Instrumentos de terceiros remetem à fonte oficial e não reproduzem itens protegidos. Triagens autorais são identificadas como não normatizadas." },
  { icon: GitBranch, titulo: "Evolução versionada", texto: "Cada release significativa passa por revisão de qualidade e acessibilidade antes de ir ao ar." },
];

export default function QualidadePage() {
  const [assetStatus, setAssetStatus] = useState<Record<string, boolean>>({});
  const loadedCount = useMemo(
    () => visualAssetRegistry.filter((asset) => assetStatus[asset.id] === true).length,
    [assetStatus],
  );
  const failedCount = useMemo(
    () => visualAssetRegistry.filter((asset) => assetStatus[asset.id] === false).length,
    [assetStatus],
  );

  function setLoaded(id: string, ok: boolean) {
    setAssetStatus((current) => ({ ...current, [id]: ok }));
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <Badge variant="secondary">Painel de princípios</Badge>
        </div>
        <h1 className="text-2xl font-black">Qualidade NeuroPed</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Compromissos de qualidade, segurança, privacidade e integridade visual que orientam o desenvolvimento do app.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PRINCIPIOS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.titulo}>
              <CardContent className="p-4">
                <h2 className="text-sm font-bold flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  {p.titulo}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.texto}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Image className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-foreground">Auditoria visual dos assets</h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Todos os assets oficiais do repositório são renderizados abaixo. Se algum arquivo quebrar, o card mostra falha imediatamente.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {loadedCount}/{visualAssetRegistry.length} abertos
            </Badge>
            <Badge variant={failedCount > 0 ? "destructive" : "outline"} className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {failedCount} falhas
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visualAssetRegistry.map((asset) => {
            const ok = assetStatus[asset.id];
            return (
              <Card key={asset.id} className="overflow-hidden border-border/70 bg-card/90">
                <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/40 p-3">
                  <SafeAssetImage
                    src={asset.src}
                    alt={asset.name}
                    className="h-full w-full rounded-2xl object-contain"
                    fallbackClassName="h-full"
                    onLoadStateChange={(loaded) => setLoaded(asset.id, loaded)}
                  />
                  <Badge
                    variant={ok === false ? "destructive" : ok === true ? "secondary" : "outline"}
                    className="absolute right-3 top-3"
                  >
                    {ok === false ? "falha" : ok === true ? "ok" : "carregando"}
                  </Badge>
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-foreground">{asset.name}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{asset.group}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">{asset.status}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground break-all">{asset.path}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{asset.usage}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] text-muted-foreground border-t border-border pt-3 text-center">
        Dr. Jadson Fraga Araújo Júnior · Neuropediatria · CRM-PE 25227 · RQE 17756
      </p>
    </div>
  );
}

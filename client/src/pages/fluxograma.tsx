import { Link } from "wouter";
import { Target, ArrowRight, ShieldAlert, Footprints, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { allScales } from "@/data/scaleFilter";
import { getImplementationStatus } from "@/data/advancedFilterLogic";
import {
  fluxoBands, fluxoMasterRule, fluxoSafetyNode, fluxoMotorNode,
  type FluxoPick, type FluxoNode,
} from "@/data/fluxograma";

// Rota preenchível de uma referência do fluxograma — só cria link quando a
// escala existe no app E é preenchível (mesma regra do filtro: só abre o que
// dá para usar de verdade). Caso contrário, vira chip de referência sem link.
function pickRoute(pick: FluxoPick): string | null {
  if (!pick.id) return null;
  const scale = allScales.find((s) => s.id === pick.id);
  if (!scale) return null;
  if (getImplementationStatus(scale) !== "complete") return null;
  return scale.appRoute ?? `/generic-scale/${scale.id}`;
}

function PickChip({ pick, variant }: { pick: FluxoPick; variant: "ouro" | "prata" }) {
  const route = pickRoute(pick);
  const base =
    variant === "ouro"
      ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-900 dark:border-amber-800/60 dark:from-amber-950/40 dark:to-yellow-950/20 dark:text-amber-100"
      : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200";
  const inner = (
    <div className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 transition ${base} ${route ? "cursor-pointer hover:shadow-sm hover:brightness-[1.02]" : "opacity-90"}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden="true" className="text-[10px]">{variant === "ouro" ? "🥇" : "🥈"}</span>
          <span className="truncate text-xs font-bold">{pick.label}</span>
        </div>
        {pick.sub && <p className="text-[10px] font-medium leading-tight opacity-80">{pick.sub}</p>}
      </div>
      {route ? <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" /> : <span className="shrink-0 rounded-full border border-current/30 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide opacity-70">ref</span>}
    </div>
  );
  return route ? <Link href={route} className="block">{inner}</Link> : inner;
}

function NodeBanner({ node }: { node: FluxoNode }) {
  const tone =
    node.tone === "safety"
      ? "border-red-300 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-800/50 dark:from-red-950/30 dark:to-rose-950/20"
      : "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800/50 dark:from-blue-950/30 dark:to-indigo-950/20";
  const Icon = node.tone === "safety" ? ShieldAlert : Footprints;
  const iconTone = node.tone === "safety" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400";
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${tone}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-foreground">{node.title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{node.intro}</p>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
            {node.picks.map((p) => <PickChip key={p.label} pick={p} variant="ouro" />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FluxogramaPage() {
  return (
    <div className="page-enter pb-8 space-y-5">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-b from-primary/[0.06] via-card/40 to-card/20 p-5 sm:p-7 shadow-sm backdrop-blur">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-primary/15 to-chart-2/10 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15 shadow-sm">
            <Target className="h-6 w-6" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] sm:text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Decisão por perfil</p>
            <h1 className="mt-0.5 text-xl sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] text-foreground">🧠 Fluxograma Clínico Inteligente</h1>
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-muted-foreground">Cruzamento idade × queixa × respondente × finalidade. Cada célula traz a escala de 1ª linha (Ouro); toque para abrir a que for preenchível.</p>
          </div>
        </div>
      </header>

      {/* Regra-mestre */}
      <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-4 sm:p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Regra-mestre</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">{fluxoMasterRule}</p>
      </section>

      {/* Nós transversais */}
      <NodeBanner node={fluxoSafetyNode} />
      <NodeBanner node={fluxoMotorNode} />

      {/* Matriz por faixa etária */}
      <div className="grid gap-4 md:grid-cols-2">
        {fluxoBands.map((band) => (
          <Card key={band.id} className="border-border/70 bg-card/80">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-2.5">
                <span className="text-2xl leading-none" aria-hidden="true">{band.emoji}</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{band.stage}</p>
                  <h2 className="text-base font-black text-foreground">{band.ageLabel}</h2>
                </div>
              </div>
              <div className="space-y-3">
                {band.cells.map((cell) => (
                  <div key={cell.queixa} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span aria-hidden="true">{cell.emoji}</span>
                      <span className="text-xs font-bold text-foreground">{cell.queixa}</span>
                    </div>
                    <PickChip pick={cell.ouro} variant="ouro" />
                    {cell.prata?.map((p) => <PickChip key={p.label + (p.sub ?? "")} pick={p} variant="prata" />)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200/70 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardContent className="p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-100">
          <strong>Leitura prudente:</strong> o fluxograma organiza e prioriza instrumentos por perfil — é apoio à decisão, não substitui o julgamento clínico. Chips marcados <strong>ref</strong> indicam escala de referência ainda não preenchível no app; os demais abrem a aplicação. O nó de segurança tem precedência sobre qualquer queixa.
        </CardContent>
      </Card>
    </div>
  );
}

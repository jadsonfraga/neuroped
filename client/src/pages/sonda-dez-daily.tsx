import { useState } from "react";
import {
  BrainCircuit,
  Check,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
  TimerReset,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  SONDA_DEZ_BANDS,
  SONDA_DEZ_GOLDEN_RULES,
  SONDA_DEZ_RESPONSE_LADDER,
  SONDA_DEZ_SAFETY_CONTRACT,
  SONDA_DEZ_VERSION,
} from "@/data/sondaDezCanonical";
import SondaDezDailyCorePage from "@/components/sonda-dez/SondaDezDailyCore";

const PREFLIGHT = [
  "ambiente com baixa distração",
  "materiais físicos ao alcance da aplicadora",
  "tablet/celular carregado e com brilho adequado",
  "espaço livre para interação, manipulação e marcha quando a trilha pedir",
] as const;

/**
 * Camada operacional consolidada da Sonda Dez.
 *
 * O núcleo clínico e o banco visual publicados são preservados integralmente
 * em SondaDezDailyCore.tsx. O guia adicional vive em overlay: assim não altera
 * a posição vertical do núcleo e preserva os scroll targets usados nas missões.
 * O atalho fica abaixo da Tela da criança (z-100), preservando o estímulo puro.
 */
export default function SondaDezDailyPage() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [preflight, setPreflight] = useState<Record<string, boolean>>({});
  const ready = PREFLIGHT.every((item) => preflight[item]);

  return (
    <>
      <SondaDezDailyCorePage />

      <Button
        type="button"
        className="fixed bottom-5 right-5 z-[90] rounded-2xl shadow-xl"
        onClick={() => setGuideOpen(true)}
      >
        <Sparkles className="mr-2 h-4 w-4" /> Guia Sonda 10
      </Button>

      {guideOpen && (
        <div className="fixed inset-0 z-[130] overflow-y-auto bg-background/95 p-3 backdrop-blur sm:p-6">
          <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[30px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-background to-cyan-50/70 shadow-2xl dark:to-cyan-950/10">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Sonda 10 · consolidada</Badge>
                    <Badge variant="outline">v{SONDA_DEZ_VERSION}</Badge>
                    <Badge variant="outline">{SONDA_DEZ_SAFETY_CONTRACT.durationMinutes} minutos</Badge>
                    <Badge variant="outline">6 trilhas etárias</Badge>
                  </div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Operação especializada, sem mudar o contrato clínico</h1>
                  <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
                    Preparação segura, especialização por idade e grau de mediação em uma camada única. O núcleo observacional, os tempos, o banco visual e as travas clínicas permanecem preservados.
                  </p>
                </div>
                <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setGuideOpen(false)}>
                  <X className="mr-2 h-4 w-4" /> Fechar guia
                </Button>
              </div>

              <div className="mt-5 space-y-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="rounded-[24px] border-primary/15">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-primary" /><h2 className="font-black">Pré-voo de 20 segundos</h2></div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Checklist operacional em memória. Não contém dado clínico e zera ao recarregar a página.</p>
                      <div className="mt-4 space-y-2">
                        {PREFLIGHT.map((item) => {
                          const checked = Boolean(preflight[item]);
                          return (
                            <button
                              key={item}
                              type="button"
                              aria-pressed={checked}
                              onClick={() => setPreflight((current) => ({ ...current, [item]: !checked }))}
                              className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${checked ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100" : "border-border bg-background hover:bg-muted/50"}`}
                            >
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${checked ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                                {checked ? <Check className="h-4 w-4" /> : "○"}
                              </span>
                              {item}
                            </button>
                          );
                        })}
                      </div>
                      <div className={`mt-3 rounded-xl p-3 text-xs font-bold ${ready ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100" : "bg-amber-50 text-amber-900 dark:bg-amber-950/20 dark:text-amber-100"}`}>
                        {ready ? "✓ Ambiente operacional pronto." : "Conclua o pré-voo antes de iniciar a aplicação."}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-cyan-200/80 dark:border-cyan-900">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2"><Gauge className="h-5 w-5 text-cyan-700 dark:text-cyan-300" /><h2 className="font-black">De quanta ajuda precisou?</h2></div>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Leitura semântica dos códigos preservados no núcleo. Não cria escore novo.</p>
                      <div className="mt-4 space-y-2">
                        {SONDA_DEZ_RESPONSE_LADDER.map((item) => (
                          <div key={item.code} className="rounded-xl border border-border/70 bg-background p-3">
                            <div className="flex items-center gap-2"><span className="text-lg" aria-hidden="true">{item.icon}</span><Badge variant="outline" className="min-w-10 justify-center">{item.code}</Badge><span className="text-sm font-black">{item.label}</span></div>
                            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{item.operatorQuestion}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[24px] border-amber-200/80 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/10">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-700 dark:text-amber-300" /><h2 className="font-black">3 regras de ouro</h2></div>
                      <div className="mt-4 space-y-3">
                        {SONDA_DEZ_GOLDEN_RULES.map((rule, index) => (
                          <div key={rule} className="flex gap-3 rounded-xl bg-background/90 p-3 text-xs leading-relaxed">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-black text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">{index + 1}</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
                        <strong className="text-foreground">Contrato clínico:</strong> sem diagnóstico automático, percentil, ponto de corte ou escore normativo; integração final obrigatoriamente médica.
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-[24px] border border-border/70 bg-background/80 p-4 sm:p-5">
                  <div className="flex items-center gap-2"><Layers3 className="h-5 w-5 text-primary" /><h2 className="font-black">Especialização automática por idade</h2></div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {SONDA_DEZ_BANDS.map((band) => (
                      <div key={band.id} className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                        <div className="flex items-center gap-2"><span className="text-xl" aria-hidden="true">{band.icon}</span><span className="text-sm font-black">{band.label}</span></div>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{band.specialization}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs leading-relaxed text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-100">
                  <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0" />
                  <p><strong>Refinamento sem regressão:</strong> esta camada não substitui a fonte clínica nem inventa a reconstrução didática de 53 blocos. Ela consolida o que está publicado hoje e prepara um ponto único para futuras expansões auditadas.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

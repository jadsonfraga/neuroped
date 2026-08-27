import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Info,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClinicalAssistant } from "@/features/clinical-assistant";
import { BatteryVisualization } from "@/features/battery-visualization";
import type { AssistantSuggestion } from "@/features/clinical-assistant";
import { easing, duration } from "@/lib/motion";
import { haptic } from "@/lib/haptic";
import { softHover, softSuccess, softTap } from "@/lib/softSounds";

export default function AssistenteClinicoPage() {
  const [suggestion, setSuggestion] = useState<AssistantSuggestion | null>(
    null,
  );
  const [selectedScales, setSelectedScales] = useState<string[]>([]);

  const handleSuggestionSelected = (nextSuggestion: AssistantSuggestion) => {
    setSuggestion(nextSuggestion);
    setSelectedScales(
      nextSuggestion.battery.phases.flatMap((phase) =>
        phase.scales.map((scale) => scale.id),
      ),
    );
    softSuccess();
    haptic.success();
  };

  const toggleScale = (scaleId: string) => {
    setSelectedScales((current) =>
      current.includes(scaleId)
        ? current.filter((id) => id !== scaleId)
        : [...current, scaleId],
    );
    softTap();
    haptic.select();
  };

  return (
    <div className="page-enter proportion-safe-page space-y-7 pb-12">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(135deg,hsl(var(--card)/0.96),hsl(var(--secondary)/0.42))] p-6 shadow-[0_30px_90px_-52px_hsl(var(--foreground)/0.46)] dark:border-white/10 sm:p-9"
      >
        <div
          className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Recurso avançado
          </div>
          <div>
            <h1
              className="text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Assistente clínico inteligente
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Transforme idade, queixa, respondentes e tempo disponível em uma
              bateria organizada, com fases, duração, alertas e justificativa
              clínica.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <ClipboardCheck
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
              Sugestão orientada por contexto
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5">
              <CheckCircle2
                className="h-3.5 w-3.5 text-teal-600"
                aria-hidden="true"
              />
              Visualização por fases
            </span>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-start">
        <section aria-labelledby="assistente-entrada" className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Passo 1
            </p>
            <h2
              id="assistente-entrada"
              className="mt-1 text-lg font-semibold tracking-tight text-foreground"
            >
              Defina o contexto da avaliação
            </h2>
          </div>
          <ClinicalAssistant onSuggestionSelected={handleSuggestionSelected} />
        </section>

        <section aria-labelledby="assistente-saida" className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Passo 2
            </p>
            <h2
              id="assistente-saida"
              className="mt-1 text-lg font-semibold tracking-tight text-foreground"
            >
              Revise a bateria sugerida
            </h2>
          </div>
          {suggestion ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.fast, ease: easing.smooth }}
            >
              <BatteryVisualization
                battery={suggestion.battery}
                selectedScales={selectedScales}
                onScaleToggle={toggleScale}
              />
            </motion.div>
          ) : (
            <Card className="border-dashed border-primary/20 bg-card/70 shadow-sm">
              <CardContent className="flex min-h-[20rem] flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  A bateria aparecerá aqui
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Preencha os parâmetros ao lado e gere uma sugestão. Você
                  poderá revisar ou retirar escalas antes de seguir.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <Card className="border-primary/15 bg-primary/[0.045]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-semibold text-foreground">
                Apoio, não substituição.
              </strong>{" "}
              O assistente organiza possibilidades com base nos parâmetros
              informados; a decisão final depende de julgamento clínico,
              anamnese, exame e contexto da criança.
            </p>
          </div>
          <Link
            href="/filtro"
            onMouseEnter={() => softHover()}
            onClick={() => {
              softTap();
              haptic.tap();
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-card/80 px-4 py-2.5 text-xs font-semibold text-primary transition-colors hover:border-primary/40 hover:bg-card"
          >
            Abrir filtro completo{" "}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

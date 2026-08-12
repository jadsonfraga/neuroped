import {
  ArrowRight,
  Award,
  CheckCircle2,
  HelpCircle,
  Medal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  QueixaAgeRecommendations,
  RecommendationOPB,
} from "@/data/filterRecommendationsOPB";

interface OPBRecommendationCardsProps {
  recommendations: QueixaAgeRecommendations;
  onSelectScale?: (scaleId: string) => void;
}

type Seal = RecommendationOPB["seal"];

interface SealVisual {
  order: number;
  label: string;
  guidance: string;
  Icon: LucideIcon;
  border: string;
  wash: string;
  icon: string;
  badge: string;
}

const sealConfig: Record<Seal, SealVisual> = {
  ouro: {
    order: 1,
    label: "OURO · primeira escolha",
    guidance: "Comece por esta escala.",
    Icon: Award,
    border: "border-amber-500/35",
    wash: "from-amber-500/[0.11] via-card to-card",
    icon: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    badge: "border-amber-500/30 bg-amber-500/12 text-amber-900 dark:text-amber-100",
  },
  prata: {
    order: 2,
    label: "PRATA · complemento",
    guidance: "Use para acrescentar outra perspectiva.",
    Icon: Medal,
    border: "border-slate-400/40",
    wash: "from-slate-400/[0.10] via-card to-card",
    icon: "bg-slate-500/12 text-slate-700 dark:text-slate-200",
    badge: "border-slate-400/35 bg-slate-500/10 text-slate-800 dark:text-slate-100",
  },
  bronze: {
    order: 3,
    label: "BRONZE · uso dirigido",
    guidance: "Reserve para dúvida residual ou objetivo específico.",
    Icon: Star,
    border: "border-orange-500/30",
    wash: "from-orange-500/[0.09] via-card to-card",
    icon: "bg-orange-500/12 text-orange-800 dark:text-orange-200",
    badge: "border-orange-500/30 bg-orange-500/10 text-orange-900 dark:text-orange-100",
  },
};

export function OPBRecommendationCards({
  recommendations,
  onSelectScale,
}: OPBRecommendationCardsProps) {
  const renderCard = (seal: Seal) => {
    const recommendation = recommendations[seal];
    const visual = sealConfig[seal];
    const titleId = `opb-${seal}-${recommendation.scaleId}`;

    return (
      <article key={seal} data-tier={seal} className="h-full">
        <Card
          className={`relative flex h-full flex-col overflow-hidden rounded-3xl border ${visual.border} bg-gradient-to-br ${visual.wash} shadow-sm`}
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
          />
          <CardHeader className="space-y-3 p-5 pb-3">
            <div className="flex items-start justify-between gap-3">
              <span
                aria-hidden="true"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${visual.icon}`}
              >
                <visual.Icon className="h-5 w-5" />
              </span>
              <Badge
                variant="outline"
                className={`max-w-[70%] whitespace-normal text-right text-[10px] font-semibold uppercase tracking-[0.08em] ${visual.badge}`}
              >
                {visual.label}
              </Badge>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Escolha {visual.order} · {recommendation.time}
              </p>
              <CardTitle
                id={titleId}
                className="mt-1 text-lg leading-tight text-foreground"
              >
                {recommendation.scaleName}
              </CardTitle>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                {visual.guidance}
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-5 pt-2">
            <section aria-label="Pergunta clínica principal">
              <div className="mb-1.5 flex items-center gap-1.5 text-primary">
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                  Pergunta principal
                </h4>
              </div>
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                {recommendation.mainQuestion}
              </p>
            </section>

            <section
              aria-label="O que será observado"
              className="rounded-2xl border border-border/60 bg-background/65 p-3"
            >
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                O que será observado
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-foreground/85">
                {recommendation.parentExample}
              </p>
            </section>

            <section aria-label="Justificativa clínica" className="flex-1">
              <div className="mb-1.5 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em]">
                  Por que ajuda neste perfil
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {recommendation.whyUseful}
              </p>
            </section>

            {onSelectScale && (
              <Button
                type="button"
                onClick={() => onSelectScale(recommendation.scaleId)}
                variant={seal === "ouro" ? "default" : "outline"}
                className="mt-auto w-full justify-between gap-3"
                aria-label={`Usar ${recommendation.scaleName}, recomendação ${seal}`}
                data-testid={`opb-use-${seal}`}
              >
                Usar esta escala
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </CardContent>
        </Card>
      </article>
    );
  };

  return (
    <section
      className="space-y-5"
      aria-labelledby="opb-recommendations-title"
      data-testid="opb-recommendation-podium"
    >
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-chart-2/[0.05] p-4">
        <p
          id="opb-recommendations-title"
          className="text-sm font-semibold text-foreground"
        >
          Pódio clínico para {recommendations.ageRange}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          A ordem expressa prioridade, não obrigação de aplicar três instrumentos.
          Comece pela escolha Ouro e acrescente outra escala apenas quando houver
          pergunta clínica complementar.
        </p>
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {renderCard("ouro")}
        {renderCard("prata")}
        {renderCard("bronze")}
      </div>

      <aside className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
        <p className="text-xs font-bold text-foreground">Uso racional do pódio</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Ouro responde à questão central. Prata amplia domínio ou respondente.
          Bronze é reservado para dúvida residual ou finalidade específica. Evite
          sobrecarregar criança, família e escola com aplicações redundantes.
        </p>
      </aside>
    </section>
  );
}

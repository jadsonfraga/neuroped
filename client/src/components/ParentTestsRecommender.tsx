import {
  Activity,
  BarChart3,
  Baby,
  BookOpen,
  BrainCog,
  Clock,
  HeartPulse,
  ListChecks,
  Moon,
  Puzzle,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FilterRecommendationLinkCard,
  type FilterRecommendationTone,
} from "@/components/FilterRecommendationLinkCard";
import {
  getParentAssessmentPath,
  requiresReferenceOnlyRoute,
  testesPaisRecommendations,
  type ParentTestRecommendation,
} from "@/data/testesPaisRecommendations";
import {
  formatRecommendationAgeRange,
  getRecommendationAgeFitLabel,
  rankRecommendationsForAgeBand,
  type RecommendationAgeMatch,
} from "@/data/recommendationAgeFit";
import {
  scaleLicenseLabel,
  scaleRespondentsLabel,
} from "@/lib/scalePresentation";

const iconMap: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Baby,
  BookOpen,
  Puzzle,
  HeartPulse,
  ShieldAlert,
  Moon,
  ListChecks,
  BrainCog,
  Users,
};

const sealMeta: Record<
  ParentTestRecommendation["seal"],
  {
    heading: string;
    eyebrow: string;
    badge: string;
    tone: FilterRecommendationTone;
    order: number;
  }
> = {
  ouro: {
    heading: "Questionários prioritários",
    eyebrow: "perspectiva dos cuidadores · começar aqui",
    badge: "Prioritário",
    tone: "primary",
    order: 0,
  },
  prata: {
    heading: "Complementos de contexto",
    eyebrow: "perspectiva complementar",
    badge: "Complementar",
    tone: "secondary",
    order: 1,
  },
  bronze: {
    heading: "Uso dirigido ou licenciado",
    eyebrow: "seleção especializada",
    badge: "Dirigido",
    tone: "optional",
    order: 2,
  },
};

interface Props {
  selectedQueixas: string[];
  selectedAge: string | null;
  faixasEtarias: Array<{ id: string; label: string; min: number; max: number }>;
}

export function ParentTestsRecommender({
  selectedQueixas,
  selectedAge,
  faixasEtarias,
}: Props) {
  if (!selectedQueixas.length || !selectedAge) return null;

  const ageRange = faixasEtarias.find((age) => age.id === selectedAge);
  if (!ageRange) return null;

  const recommendations = rankRecommendationsForAgeBand(
    testesPaisRecommendations,
    selectedQueixas,
    { min: ageRange.min, max: ageRange.max },
    (recommendation) => sealMeta[recommendation.seal].order,
  );
  if (!recommendations.length) return null;

  const assessmentPath =
    selectedQueixas.length === 1
      ? getParentAssessmentPath(selectedQueixas[0])
      : null;
  const grouped = (["ouro", "prata", "bronze"] as const)
    .map((seal) => ({
      seal,
      items: recommendations.filter(
        (match) => match.recommendation.seal === seal,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section
      className="space-y-5 rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/[0.04] via-card/60 to-primary/[0.03] p-4 shadow-sm sm:p-5"
      data-testid="parent-tests-recommendations"
      aria-labelledby="parent-tests-title"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
          <Users className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
            perspectiva dos cuidadores
          </p>
          <h2 id="parent-tests-title" className="mt-1 text-lg font-black text-foreground">
            Questionários coerentes com idade e informante
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Somente instrumentos cujo catálogo canônico inclui pais ou cuidadores.
            Nome, rota, tempo e faixa etária vêm da mesma fonte usada pelo filtro.
          </p>
        </div>
      </div>

      {assessmentPath && (
        <Card className="overflow-hidden rounded-2xl border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-card to-card shadow-sm">
          <CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">
                {assessmentPath.label}
              </CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {assessmentPath.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
              <Badge variant="outline" className="w-fit gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {assessmentPath.duration}
              </Badge>
              <Badge variant="secondary" className="w-fit">
                Faixa analisada: {ageRange.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {grouped.map(({ seal, items }) => {
        const meta = sealMeta[seal];
        const headingId = `parent-tests-${seal}`;
        return (
          <section key={seal} aria-labelledby={headingId} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  seal === "ouro"
                    ? "bg-emerald-500"
                    : seal === "prata"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                }`}
              />
              <h3
                id={headingId}
                className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
              >
                {meta.heading}
              </h3>
            </div>
            <div role="list" className="grid gap-3 xl:grid-cols-2">
              {items.map((match) => (
                <div role="listitem" key={match.recommendation.id}>
                  <TestCard
                    match={match}
                    tone={meta.tone}
                    eyebrow={meta.eyebrow}
                    sealLabel={meta.badge}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}

interface TestCardProps {
  match: RecommendationAgeMatch<ParentTestRecommendation>;
  tone: FilterRecommendationTone;
  eyebrow: string;
  sealLabel: string;
}

function TestCard({ match, tone, eyebrow, sealLabel }: TestCardProps) {
  const recommendation = match.recommendation;
  const Icon = iconMap[recommendation.icon] ?? Activity;
  const ageFitLabel = getRecommendationAgeFitLabel(match.ageFit);
  const referenceOnly = requiresReferenceOnlyRoute(
    recommendation.canonicalScale,
  );

  return (
    <FilterRecommendationLinkCard
      href={recommendation.route}
      title={recommendation.name}
      description={recommendation.razao}
      eyebrow={eyebrow}
      icon={<Icon className="h-5 w-5" />}
      tone={tone}
      badges={[
        { label: sealLabel },
        { label: recommendation.tempo, variant: "outline" },
        {
          label: formatRecommendationAgeRange(
            recommendation.ageMin,
            recommendation.ageMax,
          ),
          variant: "outline",
        },
        {
          label: ageFitLabel,
          variant: match.ageFit === "full" ? "secondary" : "outline",
        },
        {
          label: scaleLicenseLabel(
            recommendation.canonicalScale.licencaUso,
          ),
          variant: "outline",
        },
        ...(referenceOnly
          ? [
              {
                label: "Somente ficha · licença protegida",
                variant: "outline" as const,
              },
            ]
          : []),
      ]}
      footer={`${referenceOnly ? "Ficha de referência · " : ""}Respondente: ${scaleRespondentsLabel(
        recommendation.canonicalScale.respondente,
      )} · Complementa ${recommendation.complementa}`}
      ariaLabel={`${referenceOnly ? "Abrir ficha de referência de" : "Abrir"} ${recommendation.name}, ${eyebrow}. ${ageFitLabel}`}
      testId={`parent-test-${recommendation.id}`}
    />
  );
}

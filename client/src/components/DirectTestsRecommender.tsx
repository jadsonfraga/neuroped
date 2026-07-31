import {
  Brain,
  Eye,
  MessageCircle,
  Calculator,
  Move,
  PenTool,
  Lightbulb,
  CheckCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FilterRecommendationLinkCard,
  type FilterRecommendationTone,
} from "@/components/FilterRecommendationLinkCard";
import {
  testesDiretosRecommendations,
  getClinicPath,
  type DirectTestRecommendation,
} from "@/data/testesDiretosRecommendations";
import {
  formatRecommendationAgeRange,
  getRecommendationAgeFitLabel,
  rankRecommendationsForAgeBand,
  type RecommendationAgeMatch,
} from "@/data/recommendationAgeFit";

const iconMap: Record<string, LucideIcon> = {
  Eye,
  Brain,
  MessageCircle,
  Calculator,
  Move,
  PenTool,
  Lightbulb,
};

const priorityMeta: Record<
  DirectTestRecommendation["prioridade"],
  { heading: string; eyebrow: string; tone: FilterRecommendationTone; order: number }
> = {
  primaria: {
    heading: "Testes recomendados primeiro",
    eyebrow: "recomendação primária",
    tone: "primary",
    order: 0,
  },
  secundaria: {
    heading: "Testes complementares",
    eyebrow: "recomendação complementar",
    tone: "secondary",
    order: 1,
  },
  complementar: {
    heading: "Opções adicionais",
    eyebrow: "opção adicional",
    tone: "optional",
    order: 2,
  },
};

interface Props {
  selectedQueixas: string[];
  selectedAge: string | null;
  faixasEtarias: Array<{ id: string; label: string; min: number; max: number }>;
}

export function DirectTestsRecommender({
  selectedQueixas,
  selectedAge,
  faixasEtarias,
}: Props) {
  if (!selectedQueixas.length || !selectedAge) return null;

  const ageRange = faixasEtarias.find((age) => age.id === selectedAge);
  if (!ageRange) return null;

  const recommendations = rankRecommendationsForAgeBand(
    testesDiretosRecommendations,
    selectedQueixas,
    { min: ageRange.min, max: ageRange.max },
    (recommendation) => priorityMeta[recommendation.prioridade].order,
  );
  if (!recommendations.length) return null;

  const clinicalPath =
    selectedQueixas.length === 1 ? getClinicPath(selectedQueixas[0]) : null;
  const grouped = (["primaria", "secundaria", "complementar"] as const)
    .map((priority) => ({
      priority,
      items: recommendations.filter(
        (match) => match.recommendation.prioridade === priority,
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5" data-testid="direct-tests-recommendations">
      {clinicalPath && (
        <Card className="overflow-hidden rounded-2xl border-blue-500/25 bg-gradient-to-br from-blue-500/[0.08] via-card to-card shadow-sm">
          <CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/12 text-blue-700 dark:text-blue-300">
                  <CheckCircle className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span>{clinicalPath.label}</span>
              </CardTitle>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {clinicalPath.description}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
              <Badge variant="outline" className="w-fit gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {clinicalPath.duration}
              </Badge>
              <Badge variant="secondary" className="w-fit">
                Faixa analisada: {ageRange.label}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {grouped.map(({ priority, items }) => {
        const meta = priorityMeta[priority];
        const headingId = `direct-tests-${priority}`;
        return (
          <section key={priority} aria-labelledby={headingId} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-full ${
                  priority === "primaria"
                    ? "bg-emerald-500"
                    : priority === "secundaria"
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
                  <TestCard match={match} tone={meta.tone} eyebrow={meta.eyebrow} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

interface TestCardProps {
  match: RecommendationAgeMatch<DirectTestRecommendation>;
  tone: FilterRecommendationTone;
  eyebrow: string;
}

function TestCard({ match, tone, eyebrow }: TestCardProps) {
  const test = match.recommendation;
  const Icon = iconMap[test.icon] ?? Eye;
  const ageFitLabel = getRecommendationAgeFitLabel(match.ageFit);

  return (
    <FilterRecommendationLinkCard
      href={test.route}
      title={test.name}
      description={test.razao}
      eyebrow={eyebrow}
      icon={<Icon className="h-5 w-5" />}
      tone={tone}
      badges={[
        { label: test.tempo },
        {
          label: formatRecommendationAgeRange(test.ageMin, test.ageMax),
          variant: "outline",
        },
        {
          label: ageFitLabel,
          variant: match.ageFit === "full" ? "secondary" : "outline",
        },
      ]}
      ariaLabel={`Abrir ${test.name}, ${eyebrow}. ${ageFitLabel}`}
      testId={`direct-test-${test.id}`}
    />
  );
}

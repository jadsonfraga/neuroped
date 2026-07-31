import {
  Activity,
  BarChart3,
  Baby,
  BookOpen,
  Accessibility,
  Puzzle,
  HeartPulse,
  ShieldAlert,
  Moon,
  ListChecks,
  BrainCog,
  Users,
  Award,
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
  testesPaisRecommendations,
  getParentAssessmentPath,
  type ParentTestRecommendation,
} from "@/data/testesPaisRecommendations";
import {
  formatRecommendationAgeRange,
  getRecommendationAgeFitLabel,
  rankRecommendationsForAgeBand,
  type RecommendationAgeMatch,
} from "@/data/recommendationAgeFit";

const iconMap: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Baby,
  BookOpen,
  Accessibility,
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
    heading: "Escalas essenciais",
    eyebrow: "selo ouro · começar aqui",
    badge: "Ouro",
    tone: "primary",
    order: 0,
  },
  prata: {
    heading: "Escalas complementares",
    eyebrow: "selo prata · complementar",
    badge: "Prata",
    tone: "secondary",
    order: 1,
  },
  bronze: {
    heading: "Escalas especializadas",
    eyebrow: "selo bronze · uso dirigido",
    badge: "Bronze",
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
    <div className="space-y-5" data-testid="parent-tests-recommendations">
      {assessmentPath && (
        <Card className="overflow-hidden rounded-2xl border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-card to-card shadow-sm">
          <CardHeader className="gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                  <Award className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span>{assessmentPath.label}</span>
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
    </div>
  );
}

interface TestCardProps {
  match: RecommendationAgeMatch<ParentTestRecommendation>;
  tone: FilterRecommendationTone;
  eyebrow: string;
  sealLabel: string;
}

function TestCard({ match, tone, eyebrow, sealLabel }: TestCardProps) {
  const test = match.recommendation;
  const Icon = iconMap[test.icon] ?? Activity;
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
        { label: sealLabel },
        { label: test.tempo, variant: "outline" },
        {
          label: formatRecommendationAgeRange(test.ageMin, test.ageMax),
          variant: "outline",
        },
        {
          label: ageFitLabel,
          variant: match.ageFit === "full" ? "secondary" : "outline",
        },
        { label: `Complementa: ${test.complementa}`, variant: "outline" },
      ]}
      ariaLabel={`Abrir ${test.name}, ${eyebrow}. ${ageFitLabel}`}
      testId={`parent-test-${test.id}`}
    />
  );
}

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
  recommendDirectTests,
  getClinicPath,
  type DirectTestRecommendation,
} from "@/data/testesDiretosRecommendations";

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
  { heading: string; eyebrow: string; tone: FilterRecommendationTone }
> = {
  primaria: {
    heading: "Testes recomendados primeiro",
    eyebrow: "recomendação primária",
    tone: "primary",
  },
  secundaria: {
    heading: "Testes complementares",
    eyebrow: "recomendação complementar",
    tone: "secondary",
  },
  complementar: {
    heading: "Opções adicionais",
    eyebrow: "opção adicional",
    tone: "optional",
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

  const ageMonths = Math.round((ageRange.min + ageRange.max) / 2);
  const recommendations = recommendDirectTests(selectedQueixas, ageMonths);
  if (!recommendations.length) return null;

  const clinicalPath =
    selectedQueixas.length === 1 ? getClinicPath(selectedQueixas[0]) : null;
  const grouped = (["primaria", "secundaria", "complementar"] as const)
    .map((priority) => ({
      priority,
      items: recommendations.filter((item) => item.prioridade === priority),
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
            <Badge variant="outline" className="w-fit shrink-0 gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {clinicalPath.duration}
            </Badge>
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
              {items.map((test) => (
                <div role="listitem" key={test.id}>
                  <TestCard test={test} tone={meta.tone} eyebrow={meta.eyebrow} />
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
  test: DirectTestRecommendation;
  tone: FilterRecommendationTone;
  eyebrow: string;
}

function TestCard({ test, tone, eyebrow }: TestCardProps) {
  const Icon = iconMap[test.icon] ?? Eye;

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
        { label: "Teste direto", variant: "outline" },
      ]}
      ariaLabel={`Abrir ${test.name}, ${eyebrow}`}
      testId={`direct-test-${test.id}`}
    />
  );
}

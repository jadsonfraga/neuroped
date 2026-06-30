import { Link } from "wouter";
import {
  Brain,
  Eye,
  MessageCircle,
  Calculator,
  Move,
  PenTool,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  recommendDirectTests,
  getClinicPath,
  type DirectTestRecommendation,
} from "@/data/testesDiretosRecommendations";

const iconMap: Record<string, React.ReactNode> = {
  Eye: <Eye className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  MessageCircle: <MessageCircle className="h-5 w-5" />,
  Calculator: <Calculator className="h-5 w-5" />,
  Move: <Move className="h-5 w-5" />,
  PenTool: <PenTool className="h-5 w-5" />,
  Lightbulb: <Lightbulb className="h-5 w-5" />,
};

interface Props {
  selectedQueixas: string[];
  selectedAge: string | null;
  faixasEtarias: Array<{ id: string; label: string; min: number; max: number }>;
}

export function DirectTestsRecommender({ selectedQueixas, selectedAge, faixasEtarias }: Props) {
  if (!selectedQueixas.length || !selectedAge) return null;

  // Converter faixa etária para meses (usar ponto médio)
  const ageRange = faixasEtarias.find((a) => a.id === selectedAge);
  if (!ageRange) return null;
  const ageMonths = Math.round((ageRange.min + ageRange.max) / 2);

  // Obter recomendações
  const recommendations = recommendDirectTests(selectedQueixas, ageMonths);
  if (!recommendations.length) return null;

  // Separar por prioridade
  const primaryTests = recommendations.filter((t) => t.prioridade === "primaria");
  const secondaryTests = recommendations.filter((t) => t.prioridade === "secundaria");
  const complementarTests = recommendations.filter((t) => t.prioridade === "complementar");

  // Obter caminho clínico se apenas uma queixa foi selecionada
  const clinicalPath = selectedQueixas.length === 1 ? getClinicPath(selectedQueixas[0]) : null;

  return (
    <div className="space-y-4">
      {/* Caminho Clínico */}
      {clinicalPath && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  {clinicalPath.label}
                </CardTitle>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {clinicalPath.description}
                </p>
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                <Clock className="mr-1 h-4 w-4" />
                {clinicalPath.duration}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Testes Primários */}
      {primaryTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-green-600"></div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Testes Recomendados (Primária)
            </h3>
          </div>
          <div className="grid gap-3">
            {primaryTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Testes Secundários */}
      {secondaryTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-amber-600"></div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Testes Complementares (Secundária)
            </h3>
          </div>
          <div className="grid gap-3">
            {secondaryTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Testes Complementares */}
      {complementarTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Testes Complementares (Opcional)
            </h3>
          </div>
          <div className="grid gap-3">
            {complementarTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TestCardProps {
  test: DirectTestRecommendation;
}

function TestCard({ test }: TestCardProps) {
  const midpointAgeYears = Math.max(0, Math.round(((test.ageMin + test.ageMax) / 2) / 12));
  const unifiedRoute = `/testes-diretos?idade=${midpointAgeYears}&teste=${test.id}`;

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "primaria":
        return "border-l-green-500 bg-green-50 dark:bg-green-950/20";
      case "secundaria":
        return "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20";
      default:
        return "border-l-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  return (
    <Link href={unifiedRoute}>
      <a className="block">
        <Card className={`border-l-4 transition-all hover:shadow-md ${getPriorityColor(test.prioridade)}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 text-gray-600 dark:text-gray-400">
                  {iconMap[test.icon] || <Eye className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {test.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {test.razao}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {test.tempo}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 shrink-0"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </a>
    </Link>
  );
}

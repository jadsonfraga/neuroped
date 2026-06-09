import { Link } from "wouter";
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
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  recommendParentTests,
  getParentAssessmentPath,
  type ParentTestRecommendation,
} from "@/data/testesPaisRecommendations";

const iconMap: Record<string, React.ReactNode> = {
  Activity: <Activity className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Baby: <Baby className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Accessibility: <Accessibility className="h-5 w-5" />,
  Puzzle: <Puzzle className="h-5 w-5" />,
  HeartPulse: <HeartPulse className="h-5 w-5" />,
  ShieldAlert: <ShieldAlert className="h-5 w-5" />,
  Moon: <Moon className="h-5 w-5" />,
  ListChecks: <ListChecks className="h-5 w-5" />,
  BrainCog: <BrainCog className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
};

interface Props {
  selectedQueixas: string[];
  selectedAge: string | null;
  faixasEtarias: Array<{ id: string; label: string; min: number; max: number }>;
}

export function ParentTestsRecommender({ selectedQueixas, selectedAge, faixasEtarias }: Props) {
  if (!selectedQueixas.length || !selectedAge) return null;

  // Converter faixa etária para meses (usar ponto médio)
  const ageRange = faixasEtarias.find((a) => a.id === selectedAge);
  if (!ageRange) return null;
  const ageMonths = Math.round((ageRange.min + ageRange.max) / 2);

  // Obter recomendações
  const recommendations = recommendParentTests(selectedQueixas, ageMonths);
  if (!recommendations.length) return null;

  // Separar por seal
  const ouroTests = recommendations.filter((t) => t.seal === "ouro");
  const prataTests = recommendations.filter((t) => t.seal === "prata");
  const bronzeTests = recommendations.filter((t) => t.seal === "bronze");

  // Obter caminho curatorial se apenas uma queixa foi selecionada
  const assessmentPath = selectedQueixas.length === 1 ? getParentAssessmentPath(selectedQueixas[0]) : null;

  return (
    <div className="space-y-4">
      {/* Caminho Curatorial */}
      {assessmentPath && (
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-amber-600" />
                  {assessmentPath.label}
                </CardTitle>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {assessmentPath.description}
                </p>
              </div>
              <Badge variant="outline" className="whitespace-nowrap">
                {assessmentPath.duration}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Testes OURO */}
      {ouroTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Testes Essenciais (Ouro) 🏆
            </h3>
          </div>
          <div className="grid gap-3">
            {ouroTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Testes PRATA */}
      {prataTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Testes Complementares (Prata) 🥈
            </h3>
          </div>
          <div className="grid gap-3">
            {prataTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Testes BRONZE */}
      {bronzeTests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange-600"></div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Testes Especializados (Bronze) 🥉
            </h3>
          </div>
          <div className="grid gap-3">
            {bronzeTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TestCardProps {
  test: ParentTestRecommendation;
}

function TestCard({ test }: TestCardProps) {
  const getSealColor = (seal: string) => {
    switch (seal) {
      case "ouro":
        return "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20";
      case "prata":
        return "border-l-gray-400 bg-gray-50 dark:bg-gray-900/20";
      case "bronze":
        return "border-l-orange-600 bg-orange-50 dark:bg-orange-950/20";
      default:
        return "border-l-gray-400 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getSealBadge = (seal: string) => {
    switch (seal) {
      case "ouro":
        return "🏆 Essencial";
      case "prata":
        return "🥈 Complementar";
      case "bronze":
        return "🥉 Especializado";
      default:
        return seal;
    }
  };

  return (
    <Link href={test.route}>
      <a className="block">
        <Card className={`border-l-4 transition-all hover:shadow-md ${getSealColor(test.seal)}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1 text-gray-600 dark:text-gray-400">
                  {iconMap[test.icon] || <Activity className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {test.name}
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    {test.razao}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {getSealBadge(test.seal)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {test.tempo}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Complementa: {test.complementa}
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

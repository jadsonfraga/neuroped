import { AlertTriangle, Info, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BatteryFatigueAnalysis, FatigueAlternative } from "./types";

interface FatigueIntelligenceProps {
  analysis: BatteryFatigueAnalysis;
  alternatives: FatigueAlternative[];
  onAlternativeSelected?: (alternative: FatigueAlternative) => void;
}

const fatigueGuidelines = {
  infant: { max: 20, breaks: "Contínuo (até 20m)", signs: ["Choro", "Desconforto"] },
  toddler: {
    max: 30,
    breaks: "Intervalo 10m se >30m",
    signs: ["Agitação", "Perda de atenção", "Irritabilidade"],
  },
  preschool: {
    max: 40,
    breaks: "Intervalo 10m se >40m",
    signs: ["Distração", "Balanço corporal", "Falta de resposta"],
  },
  school: {
    max: 60,
    breaks: "Intervalo 15m se >60m",
    signs: ["Borbulhas", "Falta de concentração", "Erros crescentes"],
  },
  adolescent: {
    max: 90,
    breaks: "Intervalo 15m se >90m",
    signs: ["Desatenção", "Respostas apressadas", "Sinais de tédio"],
  },
};

export function FatigueIntelligence({
  analysis,
  alternatives,
  onAlternativeSelected,
}: FatigueIntelligenceProps) {
  const guidelines = fatigueGuidelines[analysis.childDevelopmentalLevel];

  const getColorByLoad = (load: string) => {
    switch (load) {
      case "light":
        return "bg-green-50 border-green-300";
      case "moderate":
        return "bg-yellow-50 border-yellow-300";
      case "heavy":
        return "bg-orange-50 border-orange-300";
      case "excessive":
        return "bg-red-50 border-red-300";
      default:
        return "bg-gray-50 border-gray-300";
    }
  };

  const getLoadLabel = (load: string) => {
    const labels: Record<string, string> = {
      light: "Leve",
      moderate: "Moderada",
      heavy: "Pesada",
      excessive: "Excessiva",
    };
    return labels[load] || load;
  };

  return (
    <div className="space-y-4">
      {/* Main Analysis */}
      <Card className={`border-l-4 ${getColorByLoad(analysis.estimatedCognitiveLoad)}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <CardTitle>Inteligência de Fadiga Clínica</CardTitle>
            </div>
            <Badge
              className={`${
                analysis.estimatedCognitiveLoad === "excessive"
                  ? "bg-red-600"
                  : analysis.estimatedCognitiveLoad === "heavy"
                    ? "bg-orange-600"
                    : analysis.estimatedCognitiveLoad === "moderate"
                      ? "bg-yellow-600"
                      : "bg-green-600"
              } text-white`}
            >
              {getLoadLabel(analysis.estimatedCognitiveLoad)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Duration vs Recommendation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-900">Duração da Bateria</p>
              <p className="text-sm font-bold text-gray-700">
                {analysis.totalDuration}m / {guidelines.max}m
              </p>
            </div>
            <Progress
              value={(analysis.totalDuration / guidelines.max) * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-600 mt-2">
              Máximo recomendado para {analysis.childDevelopmentalLevel}: {guidelines.max} minutos
            </p>
          </div>

          {/* Fatigue Risk */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-gray-900">Risco de Fadiga</p>
              <p className="text-sm font-bold">{analysis.fatigueRisk}%</p>
            </div>
            <Progress
              value={analysis.fatigueRisk}
              className="h-3"
            />
            {analysis.fatigueRisk > 70 && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-900">
                ⚠️ Alto risco de fadiga. Considere reduzir bateria ou adicionar intervalo.
              </div>
            )}
          </div>

          {/* Fatigue Signs */}
          {guidelines && (
            <div className="p-3 bg-white rounded border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-2">Sinais de Fadiga a Observar</p>
              <ul className="text-xs text-gray-700 space-y-1 ml-4 list-disc">
                {guidelines.signs.map((sign, idx) => (
                  <li key={idx}>{sign}</li>
                ))}
              </ul>
              <p className="text-xs text-gray-600 mt-2">Intervalo: {guidelines.breaks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alternatives if Battery is Too Long */}
      {analysis.isTooLong && alternatives.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Alternativas Mais Curtas
            </CardTitle>
            <p className="text-xs text-orange-700 mt-2">
              Sugestões para reduzir fadiga mantendo cobertura clínica
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {alternatives.map((alt, idx) => (
                <div
                  key={alt.id}
                  className="p-3 bg-white rounded border border-orange-200 hover:border-orange-400 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Opção {idx + 1}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Remover: <strong>{alt.removedScaleName}</strong>
                      </p>
                      <p className="text-xs text-gray-700 mt-1 italic">"{alt.reasoning}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                    <div>
                      <span className="font-semibold">Duração:</span> {alt.totalDuration}m ({alt.totalDuration - analysis.totalDuration} m menos)
                    </div>
                    <div>
                      <span className="font-semibold">Redução fadiga:</span> {alt.fatigueReduction}%
                    </div>
                    <Badge
                      className={`${
                        alt.clinicalImpact === "minimal"
                          ? "bg-green-100 text-green-900"
                          : alt.clinicalImpact === "low"
                            ? "bg-yellow-100 text-yellow-900"
                            : "bg-orange-100 text-orange-900"
                      }`}
                    >
                      Impacto: {alt.clinicalImpact}
                    </Badge>
                  </div>

                  <Button
                    onClick={() => onAlternativeSelected?.(alt)}
                    className="w-full text-sm"
                    variant="outline"
                  >
                    Usar Esta Opção
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="pt-4 flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold mb-1">💡 Sobre Fadiga Clínica</p>
            <p>
              Crianças com fadiga aumentam erros, reduzem atenção e qualidade de resposta.
              Este módulo detecta risco e sugere baterias otimizadas que mantêm a qualidade
              diagnóstica com menos carga cognitiva.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

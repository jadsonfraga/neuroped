import { TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AssessmentHistory, TrendAnalysis, RetestRecommendation } from "./types";

interface HistoryComparisonProps {
  histories: AssessmentHistory[];
  onRetestSelected?: (scaleId: string) => void;
}

function calculateTrendAnalysis(
  histories: AssessmentHistory[]
): TrendAnalysis[] {
  const byScale = new Map<string, AssessmentHistory[]>();

  histories.forEach((h) => {
    if (!byScale.has(h.scaleId)) {
      byScale.set(h.scaleId, []);
    }
    byScale.get(h.scaleId)!.push(h);
  });

  return Array.from(byScale.entries()).map(([scaleId, items]) => {
    const sorted = items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const firstScore = sorted[0].score;
    const lastScore = sorted[sorted.length - 1].score;
    const avgScore = Math.round(sorted.reduce((sum, h) => sum + h.score, 0) / sorted.length);
    const stdDev = Math.sqrt(
      sorted.reduce((sum, h) => sum + Math.pow(h.score - avgScore, 2), 0) / sorted.length
    );

    const trend =
      lastScore > firstScore + stdDev * 0.5
        ? "improving"
        : lastScore < firstScore - stdDev * 0.5
          ? "declining"
          : "stable";

    const lastDate = new Date(sorted[sorted.length - 1].timestamp);
    const daysSinceLast = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    const optimalRetestDays =
      trend === "improving" ? 90 : trend === "declining" ? 30 : 180;

    return {
      scaleId,
      scaleName: sorted[0].scaleName,
      totalAssessments: sorted.length,
      firstScore,
      lastScore,
      firstDate: sorted[0].timestamp,
      lastDate,
      trend,
      percentageChange: ((lastScore - firstScore) / firstScore) * 100,
      averageScore: avgScore,
      standardDeviation: Math.round(stdDev * 10) / 10,
      daysSinceLastAssessment: daysSinceLast,
      recommendedRetestTiming: {
        earlyOK: daysSinceLast > optimalRetestDays * 0.5,
        optimalDaysFromNow: Math.max(0, optimalRetestDays - daysSinceLast),
        reasoning: `Trend é ${trend}; intervalo ótimo ~${optimalRetestDays} dias`,
      },
    };
  });
}

function getRetestRecommendations(trends: TrendAnalysis[]): RetestRecommendation[] {
  return trends.map((t) => {
    const optimalInterval =
      t.trend === "improving" ? 90 : t.trend === "declining" ? 30 : 180;

    let recommendation: RetestRecommendation["recommendation"];
    let priority: RetestRecommendation["priority"];

    if (t.daysSinceLastAssessment >= optimalInterval) {
      recommendation = "retest_now";
      priority = t.trend === "declining" ? "high" : "medium";
    } else if (t.daysSinceLastAssessment >= optimalInterval * 0.7) {
      recommendation = "retest_soon";
      priority = "medium";
    } else {
      recommendation = "wait";
      priority = "low";
    }

    const estimatedNextDate = new Date(
      t.lastDate.getTime() + optimalInterval * 24 * 60 * 60 * 1000
    );

    return {
      scaleId: t.scaleId,
      scaleName: t.scaleName,
      lastAssessmentDate: t.lastDate,
      daysSinceLast: t.daysSinceLastAssessment,
      recommendation,
      reasoning: t.recommendedRetestTiming?.reasoning || "",
      estimatedNextDate,
      priority,
    };
  });
}

export function HistoryComparison({ histories, onRetestSelected }: HistoryComparisonProps) {
  if (!histories || histories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Comparação Histórica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum histórico de avaliação disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trends = calculateTrendAnalysis(histories);
  const recommendations = getRetestRecommendations(trends);

  const metrics = {
    totalScales: trends.length,
    improving: trends.filter((t) => t.trend === "improving").length,
    stable: trends.filter((t) => t.trend === "stable").length,
    declining: trends.filter((t) => t.trend === "declining").length,
  };

  const needsRetestNow = recommendations.filter((r) => r.recommendation === "retest_now").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <CardTitle>Comparação Histórica</CardTitle>
            </div>
            {needsRetestNow > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {needsRetestNow} escala(s) para reavaliação
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Total de Escalas</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{metrics.totalScales}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Melhorando</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{metrics.improving}</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Estáveis</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{metrics.stable}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Piorando</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{metrics.declining}</p>
          </CardContent>
        </Card>
      </div>

      {/* Retest Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔄 Recomendações de Reavaliação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recommendations
              .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
              })
              .map((rec) => (
                <div
                  key={rec.scaleId}
                  className={`p-3 rounded-lg border-l-4 ${
                    rec.recommendation === "retest_now"
                      ? "border-l-red-500 bg-red-50"
                      : rec.recommendation === "retest_soon"
                        ? "border-l-yellow-500 bg-yellow-50"
                        : "border-l-green-500 bg-green-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{rec.scaleName}</p>
                      <p className="text-xs text-gray-600 mt-1">{rec.reasoning}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Última: {rec.lastAssessmentDate.toLocaleDateString("pt-BR")} (
                        {rec.daysSinceLast}d atrás) | Próxima: {rec.estimatedNextDate.toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="text-right ml-2 flex-shrink-0">
                      <Badge
                        className={`${
                          rec.recommendation === "retest_now"
                            ? "bg-red-600 text-white"
                            : rec.recommendation === "retest_soon"
                              ? "bg-yellow-600 text-white"
                              : "bg-green-600 text-white"
                        }`}
                      >
                        {rec.recommendation === "retest_now"
                          ? "Reavalie Agora"
                          : rec.recommendation === "retest_soon"
                            ? "Em Breve"
                            : "Aguarde"}
                      </Badge>

                      {rec.recommendation === "retest_now" && (
                        <button
                          onClick={() => onRetestSelected?.(rec.scaleId)}
                          className="mt-2 px-2 py-1 text-xs bg-white text-red-600 border border-red-600 rounded hover:bg-red-50 transition"
                        >
                          Aplicar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📊 Detalhes de Tendência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trends.map((trend) => (
              <div
                key={trend.scaleId}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-900">{trend.scaleName}</p>
                  <div className="flex items-center gap-2">
                    {trend.trend === "improving" && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                    {trend.trend === "declining" && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    {trend.trend === "stable" && (
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    )}
                    <Badge
                      className={`${
                        trend.percentageChange > 0
                          ? "bg-green-100 text-green-900"
                          : trend.percentageChange < 0
                            ? "bg-red-100 text-red-900"
                            : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {trend.percentageChange > 0 ? "+" : ""}
                      {trend.percentageChange.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <p className="text-gray-600">Primeira</p>
                    <p className="font-bold text-gray-900">{trend.firstScore}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Última</p>
                    <p className="font-bold text-gray-900">{trend.lastScore}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Média</p>
                    <p className="font-bold text-gray-900">{trend.averageScore}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Aplicações</p>
                    <p className="font-bold text-gray-900">{trend.totalAssessments}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

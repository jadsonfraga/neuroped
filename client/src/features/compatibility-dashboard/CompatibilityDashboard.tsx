import { BarChart3, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScaleEntry } from "@/data/scaleFilter";

interface CompatibilityDashboardProps {
  scales: ScaleEntry[];
}

export function CompatibilityDashboard({ scales }: CompatibilityDashboardProps) {
  // Calculate redundancy matrix
  const redundancyMap = new Map<string, Set<string>>();

  scales.forEach((scale) => {
    const key = scale.id;
    if (!redundancyMap.has(key)) redundancyMap.set(key, new Set());

    scales.forEach((other) => {
      if (scale.id === other.id) return;

      // Check overlap in queixas, respondentes, age range
      const queixasOverlap = scale.queixas.some((q) => other.queixas.includes(q));
      const respondentOverlap = scale.respondente.some((r) => other.respondente.includes(r));
      const ageOverlap = !(scale.ageMax < other.ageMin || scale.ageMin > other.ageMax);

      if (queixasOverlap && respondentOverlap && ageOverlap) {
        redundancyMap.get(key)?.add(other.id);
      }
    });
  });

  // Find problematic redundancies
  const highRedundancy = Array.from(redundancyMap.entries())
    .map(([scaleId, redundantWith]) => ({
      scaleId,
      scaleName: scales.find((s) => s.id === scaleId)?.name || "Unknown",
      redundancyCount: redundantWith.size,
      redundantScales: Array.from(redundantWith)
        .map((id) => scales.find((s) => s.id === id)?.name || "Unknown")
        .slice(0, 3),
    }))
    .filter((item) => item.redundancyCount > 2)
    .sort((a, b) => b.redundancyCount - a.redundancyCount);

  // Complementary scales (good combinations)
  const complementary: Array<{
    scales: string[];
    reason: string;
    complementarity: number;
  }> = [];

  for (let i = 0; i < Math.min(scales.length, 20); i++) {
    for (let j = i + 1; j < Math.min(scales.length, 20); j++) {
      const s1 = scales[i];
      const s2 = scales[j];

      const uniqueQueixas = new Set([...s1.queixas, ...s2.queixas]);
      const uniqueRespondents = new Set([...s1.respondente, ...s2.respondente]);

      const complementarity = (uniqueQueixas.size + uniqueRespondents.size) / 4;

      if (complementarity > 2) {
        complementary.push({
          scales: [s1.name, s2.name],
          reason:
            uniqueQueixas.size > s1.queixas.length
              ? "Abrange mais domínios clínicos"
              : "Múltiplas fontes de informação",
          complementarity: Math.round(complementarity * 100) / 100,
        });
      }
    }
  }

  const topComplementary = complementary
    .sort((a, b) => b.complementarity - a.complementarity)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <CardTitle>Dashboard de Compatibilidade</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Análise de redundância entre escalas e recomendações de complementariedade
          </p>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="bg-blue-50 border-blue-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Total de Escalas</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{scales.length}</p>
          </CardContent>
        </Card>

        <Card className={`${highRedundancy.length > 0 ? "bg-orange-50 border-orange-300" : "bg-green-50 border-green-300"}`}>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">
              Escalas com Alta Redundância
            </p>
            <p className={`text-2xl font-bold mt-1 ${highRedundancy.length > 0 ? "text-orange-700" : "text-green-700"}`}>
              {highRedundancy.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-300">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">Pares Complementares</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{topComplementary.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* High Redundancy */}
      {highRedundancy.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Escalas com Alta Redundância
            </CardTitle>
            <p className="text-xs text-orange-700 mt-2">
              Considere usar apenas uma deste grupo para evitar repetição desnecessária
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {highRedundancy.slice(0, 5).map((item) => (
                <div key={item.scaleId} className="p-3 bg-white rounded border border-orange-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{item.scaleName}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Redundante com {item.redundancyCount} outras escalas:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.redundantScales.map((name) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complementary Scales */}
      {topComplementary.length > 0 && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Pares Recomendados
            </CardTitle>
            <p className="text-xs text-green-700 mt-2">
              Combinações que se complementam bem clinicamente
            </p>
          </CardHeader>

          <CardContent>
            <div className="space-y-2">
              {topComplementary.map((pair, idx) => (
                <div key={idx} className="p-3 bg-white rounded border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">
                        {pair.scales[0]} + {pair.scales[1]}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{pair.reason}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-900">
                      {pair.complementarity.toFixed(1)}/5
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

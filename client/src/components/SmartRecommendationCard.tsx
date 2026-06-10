import { Brain, Clock, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicalPattern, getBatteryForPattern } from "@/data/smartRecommendations";
import { allScales } from "@/data/scaleFilter";

interface SmartRecommendationCardProps {
  pattern: ClinicalPattern;
  onSelectScale: (scaleId: string) => void;
}

export function SmartRecommendationCard({ pattern, onSelectScale }: SmartRecommendationCardProps) {
  const battery = getBatteryForPattern(pattern);
  const primaryScale = allScales.find(s => s.id === battery.primary);

  return (
    <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-600 mb-6">
      <CardHeader className="bg-blue-900/40 border-b border-blue-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-blue-300" />
              Recomendação Inteligente
            </CardTitle>
            <p className="text-sm text-blue-200">{pattern.reason}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-300">{pattern.successRate}%</span>
            </div>
            <p className="text-xs text-blue-300">taxa sucesso</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Tempo estimado */}
        <div className="flex items-center gap-3 p-3 bg-blue-800/20 rounded border border-blue-700/50">
          <Clock className="w-4 h-4 text-blue-300" />
          <div>
            <p className="text-xs text-blue-400 uppercase">Tempo Estimado</p>
            <p className="text-sm font-semibold text-white">{pattern.estimatedTime}</p>
          </div>
        </div>

        {/* Bateria Recomendada */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Bateria Recomendada
          </h4>

          <div className="space-y-2">
            {/* Primary */}
            <Button
              onClick={() => onSelectScale(battery.primary)}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-left justify-start h-auto py-2 px-3"
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="font-bold">🥇 {primaryScale?.name || battery.primary}</span>
                <span className="text-xs opacity-90">Escala primária (padrão-ouro)</span>
              </div>
            </Button>

            {/* Secondary */}
            {battery.secondary.length > 0 && (
              <div>
                <p className="text-xs text-blue-300 mb-1.5">Escalas complementares:</p>
                <div className="grid grid-cols-2 gap-2">
                  {battery.secondary.map((scaleId) => {
                    const scale = allScales.find(s => s.id === scaleId);
                    return (
                      <Button
                        key={scaleId}
                        onClick={() => onSelectScale(scaleId)}
                        variant="outline"
                        className="bg-blue-800/20 border-blue-600 hover:bg-blue-700/40 text-white text-xs h-auto py-1.5"
                      >
                        🥈 {scale?.name || scaleId}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Supporting */}
            {battery.supporting.length > 0 && (
              <div>
                <p className="text-xs text-blue-300 mb-1.5">Escalas de apoio:</p>
                <div className="grid grid-cols-2 gap-2">
                  {battery.supporting.map((scaleId) => {
                    const scale = allScales.find(s => s.id === scaleId);
                    return (
                      <Button
                        key={scaleId}
                        onClick={() => onSelectScale(scaleId)}
                        variant="ghost"
                        className="bg-blue-900/20 hover:bg-blue-800/40 text-blue-200 text-xs h-auto py-1"
                      >
                        🥉 {scale?.name || scaleId}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-blue-300 pt-2 border-t border-blue-700/30">
          💡 Sistema recomenda essa bateria com base nos sintomas selecionados
        </p>
      </CardContent>
    </Card>
  );
}

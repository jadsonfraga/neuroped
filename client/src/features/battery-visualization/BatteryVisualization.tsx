import { Clock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SuggestedBattery } from "../clinical-assistant/types";

interface BatteryVisualizationProps {
  battery: SuggestedBattery;
  selectedScales?: string[];
  onScaleToggle?: (scaleId: string) => void;
}

export function BatteryVisualization({
  battery,
  selectedScales = [],
  onScaleToggle,
}: BatteryVisualizationProps) {
  const phaseColors = {
    screening: "bg-green-50 border-green-300",
    diagnostic: "bg-blue-50 border-blue-300",
    optional: "bg-gray-50 border-gray-300",
  };

  const phaseEmojis = {
    screening: "🎯",
    diagnostic: "🔍",
    optional: "✨",
  };

  // Calculate timeline percentages
  const totalDuration = battery.totalDuration;
  let currentTime = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Visualização de Bateria
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Tempo Total:</span>
            <Badge variant="outline">{battery.totalDuration} minutos</Badge>
          </div>
          <div className="text-gray-500">
            Estimado: {battery.estimatedTimeRange.min}–{battery.estimatedTimeRange.max} min
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Main Timeline Bar */}
        <div className="flex h-12 rounded-lg overflow-hidden border-2 border-gray-300 bg-white shadow-sm">
          {battery.phases.map((phase) => {
            const percentage = (phase.duration / totalDuration) * 100;
            const phaseStart = currentTime;
            currentTime += phase.duration;

            const bgColors = {
              screening: "bg-gradient-to-r from-green-400 to-emerald-400",
              diagnostic: "bg-gradient-to-r from-blue-400 to-cyan-400",
              optional: "bg-gradient-to-r from-amber-300 to-orange-300",
            };

            return (
              <div
                key={phase.id}
                className={`relative ${bgColors[phase.id]} flex items-center justify-center transition-all hover:opacity-80`}
                style={{ width: `${percentage}%` }}
                title={`${phase.label}: ${phase.duration} min`}
              >
                {percentage > 15 && (
                  <span className="text-white font-bold text-xs">
                    {phaseEmojis[phase.id]} {phase.duration}m
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Time Markers */}
        <div className="flex text-xs text-gray-500 mt-1 px-1">
          <span>0m</span>
          <span className="flex-1 text-center">{Math.floor(totalDuration / 2)}m</span>
          <span className="text-right">{totalDuration}m</span>
        </div>
      </div>

      {/* Detailed Phases */}
      <div className="grid gap-4">
        {battery.phases.map((phase, idx) => (
          <Card key={phase.id} className={`border-2 ${phaseColors[phase.id]}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white border-2 border-gray-300 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {phaseEmojis[phase.id]} {phase.label}
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1">
                      {phase.id === "screening"
                        ? "Rastreio inicial e identificação rápida"
                        : phase.id === "diagnostic"
                          ? "Confirmação diagnóstica e detalhamento"
                          : "Avaliações complementares e aprofundamento"}
                    </p>
                  </div>
                </div>
                <Badge className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {phase.duration}min
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Scales in Phase */}
              <div className="space-y-2">
                {phase.scales.map((scale, scaleIdx) => {
                  const isSelected = selectedScales.includes(scale.id);
                  return (
                    <div
                      key={scale.id}
                      onClick={() => onScaleToggle?.(scale.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-blue-400 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 flex-shrink-0">
                        {scaleIdx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{scale.name}</p>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{scale.reasoning}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {scale.respondent}
                          </Badge>
                          <Badge
                            variant={scale.priority === "essential" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {scale.priority === "essential" ? "Essencial" : "Complementar"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {scale.duration}m
                          </Badge>
                        </div>
                      </div>

                      {phase.id === "optional" && (
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Phase Summary */}
              <div className="pt-2 border-t border-gray-300">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">{phase.scales.length} escala(s)</span>
                  {" • "}
                  <span className="font-semibold">{phase.duration} minutos</span>
                  {" • "}
                  <span>
                    Respondente{phase.scales.length > 1 ? "s" : ""}: {Array.from(new Set(phase.scales.map((s) => s.respondent))).join(", ")}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Clinical Notes */}
      <Card className="bg-blue-50 border-blue-300">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-700 font-medium">💡 Notas Clínicas</p>
          <p className="text-xs text-gray-600 mt-2">{battery.clinicalNotes}</p>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">ESCALAS ESSENCIAIS</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {battery.phases.reduce((sum, p) => sum + p.scales.filter((s) => s.priority === "essential").length, 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">TEMPO TOTAL</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{battery.totalDuration}m</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-600 font-semibold">TOTAL ESCALAS</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {battery.phases.reduce((sum, p) => sum + p.scales.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

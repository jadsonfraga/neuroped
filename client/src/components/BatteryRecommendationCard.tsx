import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, AlertCircle, CheckCircle, Package, Download } from "lucide-react";
import {
  BatteryRecommendation,
  getBatteryForPattern,
  estimateBatteryCost
} from "@/data/batteryRecommendations";
import { ValidationAlert, getAlertColor, getAlertIcon } from "@/data/crossValidations";

interface BatteryRecommendationCardProps {
  pattern: string;
  detectedScales?: string[];
  validationAlerts?: ValidationAlert[];
  onSelectBattery?: (battery: BatteryRecommendation) => void;
}

export function BatteryRecommendationCard({
  pattern,
  detectedScales = [],
  validationAlerts = [],
  onSelectBattery
}: BatteryRecommendationCardProps) {
  const battery = getBatteryForPattern(pattern);
  const [expanded, setExpanded] = useState(false);

  if (!battery) return null;

  const hasErrors = validationAlerts.some(a => a.severity === "error");
  const hasWarnings = validationAlerts.some(a => a.severity === "warning");

  return (
    <>
      {/* Alertas de Validação Cruzada */}
      {validationAlerts.length > 0 && (
        <div className="space-y-2 mb-4">
          {validationAlerts.map((alert) => (
            <Card key={alert.id} className={`border-2 ${getAlertColor(alert.severity)}`}>
              <CardContent className="pt-4 p-4">
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">{getAlertIcon(alert.severity)}</div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{alert.title}</h4>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <p className="text-sm font-semibold">💡 {alert.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recomendação de Bateria */}
      <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-primary" />
                <Badge className="bg-primary/20 text-primary">Bateria Recomendada</Badge>
              </div>
              <CardTitle className="text-xl">{battery.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{battery.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
              battery.estimatedCost === "baixo" ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" :
              battery.estimatedCost === "médio" ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200" :
              "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
            }`}>
              {estimateBatteryCost(battery.estimatedCost)}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metadados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span><strong>Tempo:</strong> {battery.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span><strong>Escalas:</strong> {battery.scales.length}</span>
            </div>
          </div>

          {/* Razão Clínica */}
          <div className="bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Por quê essa bateria?</strong><br/>
              {battery.rationale}
            </p>
          </div>

          {/* Escalas da Bateria */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              Escalas Incluídas
            </h4>
            <div className="space-y-2">
              {battery.scales.map((scale, idx) => (
                <div key={scale.scaleId} className="flex items-start gap-3 p-2 rounded-lg bg-background border border-border/50">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{scale.scaleName}</div>
                    <div className="text-muted-foreground text-xs">{scale.purpose}</div>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{scale.role}</Badge>
                      <Badge variant="outline" className="text-[10px]">{scale.estimatedTime}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos Passos */}
          <div>
            <h4 className="font-semibold mb-2">📋 Próximos Passos</h4>
            <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
              {battery.nextSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Avisos Clínicos */}
          {battery.warnings && battery.warnings.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Avisos Clínicos Importantes
              </h4>
              <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-200">
                {battery.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                setExpanded(!expanded);
                onSelectBattery?.(battery);
              }}
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              Usar Esta Bateria
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3"
              title="Gerar relatório PDF com bateria recomendada"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

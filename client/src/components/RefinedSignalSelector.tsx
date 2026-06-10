import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Award,
  Medal,
  Star,
  Clock,
  CheckCircle2,
  Lightbulb,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSignalsForQueixaAndAge,
  type SymptomCluster,
  type Signal,
} from "@/data/signalsAndSymptoms";
import {
  getRecommendationsForSignalCluster,
  type RefinedRecommendation,
} from "@/data/refinedRecommendations";

interface RefinedSignalSelectorProps {
  queixaId: string;
  queixaLabel: string;
  ageMonths: number;
  selectedSignalIds: string[];
  onSignalToggle: (signalId: string) => void;
  onRecommendationSelect?: (rec: RefinedRecommendation) => void;
}

export function RefinedSignalSelector({
  queixaId,
  queixaLabel,
  ageMonths,
  selectedSignalIds,
  onSignalToggle,
  onRecommendationSelect,
}: RefinedSignalSelectorProps) {
  const clusters = getSignalsForQueixaAndAge(queixaId, ageMonths);
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(
    clusters.length > 0 ? clusters[0].id : null
  );
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);
  const [showRecommendation, setShowRecommendation] = useState<string | null>(null);

  if (clusters.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Sem sinais específicos nesta idade
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {queixaLabel} é melhor avaliado em outra faixa etária. Considere reavaliação aos {ageMonths < 72 ? "6 anos" : "12 anos"}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Selecione os sinais presentes para refinar diagnóstico e testes
        </p>
      </div>

      {clusters.map((cluster) => (
        <Card key={cluster.id} className="border-border">
          <div
            className="cursor-pointer flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            onClick={() =>
              setExpandedClusterId(
                expandedClusterId === cluster.id ? null : cluster.id
              )
            }
          >
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                expandedClusterId === cluster.id ? "" : "-rotate-90"
              }`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                {cluster.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {cluster.signals.length} sinais · {cluster.signals.filter(s => selectedSignalIds.includes(s.id)).length} selecionado{cluster.signals.filter(s => selectedSignalIds.includes(s.id)).length !== 1 ? "s" : ""}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round((cluster.signals.filter(s => selectedSignalIds.includes(s.id)).length / cluster.signals.length) * 100)}%
            </Badge>
          </div>

          {expandedClusterId === cluster.id && (
            <CardContent className="pt-0 pb-4 space-y-3">
              {cluster.signals.map((signal) => (
                <div key={signal.id} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id={signal.id}
                      checked={selectedSignalIds.includes(signal.id)}
                      onChange={() => onSignalToggle(signal.id)}
                      className="mt-1 rounded border-border"
                    />
                    <label
                      htmlFor={signal.id}
                      className="flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        onSignalToggle(signal.id);
                      }}
                    >
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {signal.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {signal.description}
                      </p>
                      {signal.severity && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-1"
                        >
                          {signal.severity === "leve"
                            ? "🟢 Leve"
                            : signal.severity === "moderado"
                              ? "🟡 Moderado"
                              : "🔴 Grave"}
                        </Badge>
                      )}
                    </label>
                    <button
                      onClick={() =>
                        setExpandedSignalId(
                          expandedSignalId === signal.id ? null : signal.id
                        )
                      }
                      className="mt-1 p-1 rounded hover:bg-muted transition-colors"
                      title="Detalhes"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {expandedSignalId === signal.id && (
                    <div className="ml-6 mt-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground">
                        <strong>O que observar:</strong> {signal.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Impacto:</strong> Este sinal com frequência indica{" "}
                        {signal.severity === "grave"
                          ? "necessidade de intervenção urgente"
                          : signal.severity === "moderado"
                            ? "necessidade de avaliação profissional"
                            : "variação normal, mas monitorar"}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {selectedSignalIds.filter(id =>
                cluster.signals.some(s => s.id === id)
              ).length > 0 && (
                <RecommendationPanel
                  clusterId={cluster.id}
                  queixaId={queixaId}
                  ageMonths={ageMonths}
                  onSelect={onRecommendationSelect}
                  isExpanded={showRecommendation === cluster.id}
                  onToggleExpand={() =>
                    setShowRecommendation(
                      showRecommendation === cluster.id ? null : cluster.id
                    )
                  }
                />
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

interface RecommendationPanelProps {
  clusterId: string;
  queixaId: string;
  ageMonths: number;
  onSelect?: (rec: RefinedRecommendation) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function RecommendationPanel({
  clusterId,
  queixaId,
  ageMonths,
  onSelect,
  isExpanded,
  onToggleExpand,
}: RecommendationPanelProps) {
  const rec = getRecommendationsForSignalCluster(clusterId, ageMonths);

  if (!rec) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 dark:border-teal-800/40 dark:bg-teal-950/20 overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 p-3 hover:bg-teal-100 dark:hover:bg-teal-950/40 transition-colors text-left"
      >
        <Target className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-teal-700 dark:text-teal-300">
            Recomendações Clínicas Personalizadas
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 transition-transform ${
            isExpanded ? "" : "-rotate-90"
          }`}
        />
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t border-teal-200 dark:border-teal-800/40">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-100">
              Contexto Clínico
            </p>
            <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
              {rec.clinicalContext}
            </p>
          </div>

          <div className="grid gap-3">
            {/* OURO */}
            <RecommendationCard
              seal="Ouro"
              icon={<Award className="h-4 w-4" />}
              gradient="from-amber-100 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40"
              borderColor="border-amber-200 dark:border-amber-800/50"
              rec={rec.ouro}
              onSelect={() => onSelect?.(rec)}
            />

            {/* PRATA */}
            <RecommendationCard
              seal="Prata"
              icon={<Medal className="h-4 w-4" />}
              gradient="from-slate-100 to-slate-50 dark:from-slate-950/40 dark:to-slate-900/40"
              borderColor="border-slate-200 dark:border-slate-800/50"
              rec={rec.prata}
              onSelect={() => onSelect?.(rec)}
            />

            {/* BRONZE */}
            <RecommendationCard
              seal="Bronze"
              icon={<Star className="h-4 w-4" />}
              gradient="from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40"
              borderColor="border-orange-200 dark:border-orange-800/50"
              rec={rec.bronze}
              onSelect={() => onSelect?.(rec)}
            />

            {/* TESTE DIRETO */}
            {rec.directTest && (
              <div className={`p-3 rounded-lg border ${rec.directTest ? "border-blue-200 dark:border-blue-800/50" : "border-border"} bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20`}>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                      {rec.directTest.testName}
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                      {rec.directTest.instructions}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-700 dark:text-blue-300">
                        {rec.directTest.time}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      <strong>Observar:</strong> {rec.directTest.what}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-teal-200 dark:border-teal-800/40">
            <p className="text-xs font-semibold text-teal-900 dark:text-teal-100 mb-1">
              Próximos Passos
            </p>
            <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
              {rec.nextSteps}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface RecommendationCardProps {
  seal: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  rec: any;
  onSelect: () => void;
}

function RecommendationCard({
  seal,
  icon,
  gradient,
  borderColor,
  rec,
  onSelect,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`p-3 rounded-lg border ${borderColor} bg-gradient-to-r ${gradient}`}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-foreground">{seal}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {rec.scaleName}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {rec.fullName}
              </p>
            </div>
            <div className="text-right whitespace-nowrap">
              <Badge variant="outline" className="text-[10px]">
                {rec.tempo}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[10px] mt-1 block"
              >
                {rec.respondente}
              </Badge>
            </div>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2 border-t border-border/40 pt-2">
              <div>
                <p className="text-[10px] font-semibold text-foreground">
                  Pergunta Clínica
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {rec.mainQuestion}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-foreground">
                  Exemplo para Pais
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                  "{rec.parentExample}"
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-foreground">
                  Por que Usar?
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {rec.whyUseful}
                </p>
              </div>
              {rec.cutoff && (
                <div>
                  <p className="text-[10px] font-semibold text-foreground">
                    Ponto de Corte
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {rec.cutoff}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-0.5 p-1 rounded hover:bg-white/50 transition-colors shrink-0"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${expanded ? "" : "-rotate-90"}`}
          />
        </button>
      </div>

      <Button
        size="sm"
        className="w-full mt-2 h-7 text-xs"
        onClick={onSelect}
        variant={rec.appRoute ? "default" : "outline"}
      >
        <Lightbulb className="h-3 w-3 mr-1" />
        {rec.appRoute ? "Abrir Escala" : "Usar esta Recomendação"}
      </Button>
    </div>
  );
}

import { useState, useMemo } from "react";
import {
  pantScales, pantDomains, pantLevelLabels, pantLevelColors,
  classifyPantDomain, type PantScale
} from "@/data/pantScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Info, MessageCircle,
  Languages, Lightbulb, Hand, Heart
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SaveToPatient } from "@/components/SaveToPatient";

const domainIcons: Record<number, React.ElementType> = {
  1: MessageCircle,
  2: Languages,
  3: Lightbulb,
  4: Hand,
  5: Heart,
};

const domainGradients: Record<number, string> = {
  1: "from-pink-500 to-rose-500",
  2: "from-violet-500 to-purple-500",
  3: "from-amber-500 to-yellow-500",
  4: "from-teal-500 to-cyan-500",
  5: "from-rose-500 to-red-500",
};

const domainAccentBg: Record<number, string> = {
  1: "bg-pink-50 dark:bg-pink-950/20",
  2: "bg-violet-50 dark:bg-violet-950/20",
  3: "bg-amber-50 dark:bg-amber-950/20",
  4: "bg-teal-50 dark:bg-teal-950/20",
  5: "bg-rose-50 dark:bg-rose-950/20",
};

const domainAccentBorder: Record<number, string> = {
  1: "border-pink-200 dark:border-pink-800/40",
  2: "border-violet-200 dark:border-violet-800/40",
  3: "border-amber-200 dark:border-amber-800/40",
  4: "border-teal-200 dark:border-teal-800/40",
  5: "border-rose-200 dark:border-rose-800/40",
};

const domainTextColor: Record<number, string> = {
  1: "text-pink-600 dark:text-pink-400",
  2: "text-violet-600 dark:text-violet-400",
  3: "text-amber-600 dark:text-amber-400",
  4: "text-teal-600 dark:text-teal-400",
  5: "text-rose-600 dark:text-rose-400",
};

export default function PantPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(1);
  const [showAnchor, setShowAnchor] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const total = pantScales.length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  const scalesByDomain = useMemo(() => {
    const grouped: Record<number, PantScale[]> = {};
    for (const s of pantScales) {
      if (!grouped[s.domain]) grouped[s.domain] = [];
      grouped[s.domain].push(s);
    }
    return grouped;
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function handleSubmit() {
    const totalScore = Object.values(answers).reduce((s, v) => s + v, 0);
    const avg = (totalScore / total).toFixed(2);
    saveMutation.mutate({
      scaleName: "PANT - 100 Escalas Passivas",
      answers,
      totalScore,
      classification: `Média geral: ${avg}`,
      patientAge: "variável",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
    setExpandedDomain(1);
  }

  function domainProgress(domainId: number) {
    const domainScales = scalesByDomain[domainId] || [];
    const domainAnswered = domainScales.filter((s) => answers[s.number] !== undefined).length;
    return { answered: domainAnswered, total: domainScales.length };
  }

  if (showResult) {
    const domainResults = pantDomains.map((d) => {
      const dScales = scalesByDomain[d.id] || [];
      const scores = dScales.map((s) => answers[s.number] ?? 0);
      return { ...d, result: classifyPantDomain(scores, dScales.length) };
    });

    const allScores = pantScales.map((s) => answers[s.number] ?? 0);
    const globalResult = classifyPantDomain(allScores, total);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — PANT</h1>
            <p className="text-xs text-muted-foreground">100 Escalas Passivas de Neurodesenvolvimento</p>
          </div>
        </div>

        {/* Global result */}
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{globalResult.average.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Média Geral (0-4)</p>
              <Badge className={`text-sm px-4 py-1.5 ${
                globalResult.average >= 3.5
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : globalResult.average >= 2.5
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  : globalResult.average >= 1.5
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : globalResult.average >= 0.5
                  ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {globalResult.classification}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {globalResult.average >= 2.5 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {globalResult.description}
                </p>
              </div>
            </div>

            {/* Domain breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Macrodomínios</h3>
              {domainResults.map((d) => {
                const Icon = domainIcons[d.id];
                return (
                  <div key={d.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${domainTextColor[d.id]}`} />
                        <p className={`text-sm font-medium ${domainTextColor[d.id]}`}>{d.short}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{d.result.average.toFixed(2)}</span>
                        <Badge variant="outline" className={`text-xs ${d.result.color}`}>
                          {d.result.classification}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          d.result.average >= 3.5 ? "bg-emerald-500" :
                          d.result.average >= 2.5 ? "bg-blue-500" :
                          d.result.average >= 1.5 ? "bg-amber-500" :
                          d.result.average >= 0.5 ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${(d.result.average / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rating reference */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-foreground/80 space-y-1">
                  <p><strong>Régua de Regulação (0-4):</strong></p>
                  <p>0 = Ausente / 1 = Muito frágil / 2 = Inconsistente</p>
                  <p>3 = Funcional parcial / 4 = Espontâneo e generalizado</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <SaveToPatient
          scaleName="PANT"
          totalScore={Object.values(answers).reduce((s, v) => s + v, 0)}
          classification={globalResult.classification}
          answers={answers}
          domainScores={Object.fromEntries(domainResults.map(d => [d.short, d.result.average]))}
        />
        <Button onClick={handleReset} variant="outline" className="w-full gap-2" data-testid="button-reset">
          <RotateCcw className="w-4 h-4" />
          Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">PANT — 100 Escalas Passivas</h1>
          <p className="text-xs text-muted-foreground">Avaliação Funcional do Neurodesenvolvimento</p>
        </div>
      </div>

      {/* Global Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-xs text-foreground/80 leading-relaxed">
          <strong>Instruções:</strong> Para cada escala passiva, atribua o nível observado de 0 a 4 conforme a régua de regulação. Use o <strong>exemplo do dia a dia</strong> em cada item para responder com mais segurança, avaliando espontaneidade, frequência, generalização e impacto funcional no cotidiano.
        </p>
      </div>

      {/* Régua reference (sticky) */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        {pantLevelLabels.map((label, i) => (
          <span key={i} className={`px-2 py-1 rounded-md ${pantLevelColors[i]}`}>
            {i}: {label}
          </span>
        ))}
      </div>

      {/* Domains as accordion */}
      {pantDomains.map((domain) => {
        const isExpanded = expandedDomain === domain.id;
        const dp = domainProgress(domain.id);
        const Icon = domainIcons[domain.id];
        const domainScales = scalesByDomain[domain.id] || [];

        return (
          <div key={domain.id} className="space-y-3">
            {/* Domain header */}
            <button
              onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl ${domainAccentBg[domain.id]} border ${domainAccentBorder[domain.id]} transition-colors hover:opacity-90`}
              data-testid={`button-domain-${domain.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${domainGradients[domain.id]} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <h2 className={`text-sm font-semibold ${domainTextColor[domain.id]}`}>
                    Macrodomínio {domain.id}: {domain.short}
                  </h2>
                  <p className="text-xs text-muted-foreground">{domain.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs font-mono">
                  {dp.answered}/{dp.total}
                </Badge>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </button>

            {/* Scales within domain */}
            {isExpanded && (
              <div className="space-y-2 ml-1">
                {domainScales.map((scale) => {
                  const currentAnswer = answers[scale.number];
                  const isAnswered = currentAnswer !== undefined;

                  return (
                    <Card
                      key={scale.number}
                      data-testid={`card-scale-${scale.number}`}
                      className={`border-card-border transition-all ${isAnswered ? "bg-card" : "bg-card/60"}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono flex-shrink-0 mt-0.5 min-w-[36px] justify-center ${
                              isAnswered ? domainTextColor[domain.id] : ""
                            }`}
                          >
                            {String(scale.number).padStart(2, "0")}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-foreground font-medium leading-relaxed">
                              {scale.name}
                            </p>
                            {/* Exemplo concreto para pai/mãe responder com mais assertividade */}
                            {scale.parentExample && (
                              <div className={`mt-1.5 flex items-start gap-1.5 rounded-lg ${domainAccentBg[domain.id]} border ${domainAccentBorder[domain.id]} px-2.5 py-1.5`}>
                                <Lightbulb className={`w-3 h-3 mt-0.5 flex-shrink-0 ${domainTextColor[domain.id]}`} />
                                <p className="text-xs text-foreground/75 leading-relaxed">
                                  {scale.parentExample}
                                </p>
                              </div>
                            )}
                            {/* Show anchor on tap */}
                            {showAnchor === `${scale.number}-${currentAnswer}` && currentAnswer !== undefined && scale.levels[currentAnswer] && (
                              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic">
                                {scale.levels[currentAnswer].anchor.substring(0, 200)}
                                {scale.levels[currentAnswer].anchor.length > 200 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 0-4 rating buttons */}
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4].map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                setAnswers({ ...answers, [scale.number]: level });
                                setShowAnchor(`${scale.number}-${level}`);
                              }}
                              className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-medium transition-all border ${
                                currentAnswer === level
                                  ? pantLevelColors[level] + " border-current ring-1 ring-current/30"
                                  : "bg-card text-muted-foreground border-border hover:bg-muted"
                              }`}
                              data-testid={`button-rate-${scale.number}-${level}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>

                        {/* Selected level label */}
                        {isAnswered && (
                          <p className="text-xs text-muted-foreground">
                            Nível {currentAnswer}: <span className="font-medium">{pantLevelLabels[currentAnswer]}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {allAnswered ? "Ver Resultado" : `Responda todas as ${total} escalas (${answered}/${total})`}
      </Button>
    </div>
  );
}

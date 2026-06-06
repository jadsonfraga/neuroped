import { useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  vinelandDomains, vinelandScoreLabels, classifyVineland
} from "@/data/newScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, RotateCcw, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function VinelandPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<number, boolean>>({ 0: true });

  // Count total items
  const totalItems = vinelandDomains.reduce(
    (sum, d) => sum + d.subdomains.reduce((s, sd) => s + sd.items.length, 0), 0
  );
  const answered = Object.keys(answers).length;
  const progress = (answered / totalItems) * 100;
  const allAnswered = answered === totalItems;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateDomainScores() {
    const domainScores: Record<string, { score: number; maxScore: number }> = {};

    vinelandDomains.forEach((domain) => {
      let score = 0;
      let maxScore = 0;
      domain.subdomains.forEach((sub) => {
        sub.items.forEach((item, itemIdx) => {
          const key = `${domain.name}-${sub.name}-${itemIdx}`;
          maxScore += 3;
          score += answers[key] ?? 0;
        });
      });
      domainScores[domain.name] = { score, maxScore };
    });

    return domainScores;
  }

  function handleSubmit() {
    const domainScores = calculateDomainScores();
    const result = classifyVineland(domainScores);
    const totalScore = Object.values(domainScores).reduce((s, d) => s + d.score, 0);
    saveMutation.mutate({
      scaleName: "Vineland-3 (Triagem)",
      answers,
      totalScore,
      classification: result.overallClassification,
      patientAge: "0-18 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
    setExpandedDomains({ 0: true });
  }

  function toggleDomain(idx: number) {
    setExpandedDomains((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  if (showResult) {
    const domainScores = calculateDomainScores();
    const result = classifyVineland(domainScores);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — Vineland-3</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <Badge className={`text-sm px-4 py-1.5 ${
                result.overallClassification.includes("Adequado") && !result.overallClassification.includes("Baixo")
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : result.overallClassification.includes("Moderadamente")
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : result.overallClassification.includes("Significativamente")
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
              }`}>
                {result.overallClassification}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.overallClassification.includes("Adequado") && !result.overallClassification.includes("Baixo") ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            {/* Domain breakdown with visual bars */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Domínios</h3>
              {result.domainResults.map((d) => {
                const domainInfo = vinelandDomains.find((vd) => vd.name === d.name);
                return (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${domainInfo?.color ?? ""}`}>{d.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{d.percentage}%</span>
                        <Badge variant="outline" className={`text-xs ${d.color}`}>
                          {d.classification}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          d.percentage >= 75 ? "bg-emerald-500" :
                          d.percentage >= 50 ? "bg-amber-500" :
                          d.percentage >= 25 ? "bg-orange-500" : "bg-red-500"
                        }`}
                        style={{ width: `${d.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-cyan-800 dark:text-cyan-300 space-y-1">
                  <p><strong>Interpretação Vineland-3 (Triagem):</strong></p>
                  <p>≥ 75%: Adequado / 50-74%: Moderadamente baixo</p>
                  <p>25-49%: Baixo / &lt; 25%: Significativamente baixo</p>
                  <p>Esta é uma versão simplificada para triagem educacional</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="Vineland-3"
          scaleFullName="Vineland Adaptive Behavior Scales — Third Edition"
          totalScore={totalScore}
          classification={result.classification}
          description={result.description}
          domainResults={Object.entries(domainScores).map(([name, d]) => ({ domain: name, score: d.score, classification: d.score >= d.maxScore * 0.7 ? "Adequado" : d.score >= d.maxScore * 0.4 ? "Moderadamente Baixo" : "Baixo" }))}
          items={vinelandDomains.flatMap(d => d.subdomains.flatMap(sub => sub.items.map((item, i) => ({ question: `[${d.name}/${sub.name}] ${item}`, answer: vinelandScoreLabels[answers[`${d.name}-${sub.name}-${i}`] ?? 0], value: answers[`${d.name}-${sub.name}-${i}`] ?? 0 }))))}
          patientAge="0-90 anos"
        />
        <SaveToPatient
          scaleName="Vineland-3 (Triagem)"
          totalScore={Object.values(domainScores).reduce((s, d) => s + d.score, 0)}
          classification={result.overallClassification}
          answers={answers}
          domainScores={Object.fromEntries(result.domainResults.map((d) => [d.name, domainScores[d.name]?.score ?? 0]))}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center shadow-sm">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Vineland-3</h1>
          <p className="text-xs text-muted-foreground">Comportamento Adaptativo — Triagem Educacional</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {totalItems} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/40 p-4">
        <p className="text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada habilidade, indique a frequência com que a criança a realiza habitualmente. Avalie os 4 domínios: Comunicação, Vida Diária, Socialização e Motricidade.
        </p>
      </div>

      {/* Domains as collapsible sections */}
      {vinelandDomains.map((domain, domIdx) => {
        const isExpanded = expandedDomains[domIdx] ?? false;
        const domainAnswered = domain.subdomains.reduce((sum, sub) =>
          sum + sub.items.filter((_, iIdx) => answers[`${domain.name}-${sub.name}-${iIdx}`] !== undefined).length, 0
        );
        const domainTotal = domain.subdomains.reduce((sum, sub) => sum + sub.items.length, 0);

        return (
          <div key={domain.name} className="space-y-3">
            {/* Domain header - clickable */}
            <button
              onClick={() => toggleDomain(domIdx)}
              className={`w-full flex items-center justify-between p-3 rounded-xl ${domain.bg} transition-colors hover:opacity-90`}
              data-testid={`button-domain-${domIdx}`}
            >
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-semibold ${domain.color}`}>{domain.name}</h2>
                <Badge variant="outline" className="text-xs">
                  {domainAnswered}/{domainTotal}
                </Badge>
              </div>
              {isExpanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </button>

            {isExpanded && domain.subdomains.map((sub) => (
              <div key={sub.name} className="space-y-2 ml-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2 pt-2">
                  {sub.name}
                </p>
                {sub.items.map((item, itemIdx) => {
                  const answerKey = `${domain.name}-${sub.name}-${itemIdx}`;
                  return (
                    <Card key={answerKey} data-testid={`card-item-${answerKey}`} className="border-card-border">
                      <CardContent className="p-4 space-y-3">
                        <p className="text-sm text-foreground leading-relaxed">{item}</p>
                        <RadioGroup
                          value={answers[answerKey]?.toString()}
                          onValueChange={(val) => setAnswers({ ...answers, [answerKey]: parseInt(val) })}
                          className="flex flex-wrap gap-1.5"
                        >
                          {vinelandScoreLabels.map((label, j) => (
                            <div key={j} className="flex items-center">
                              <RadioGroupItem value={j.toString()} id={`v-${answerKey}-${j}`} className="sr-only" />
                              <Label
                                htmlFor={`v-${answerKey}-${j}`}
                                className={`text-xs px-2.5 py-1.5 rounded-full border cursor-pointer transition-colors ${
                                  answers[answerKey] === j
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-foreground border-border hover:bg-muted"
                                }`}
                              >
                                {label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
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
        {allAnswered ? "Ver Resultado" : `Responda todas as ${totalItems} perguntas`}
      </Button>
      <ScaleReference scaleId="vineland" />
    </div>
  );
}

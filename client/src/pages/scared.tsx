import { useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  scaredQuestions, scaredLabels, scaredSubscales, classifyScared
} from "@/data/newScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShieldAlert, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function ScaredPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const total = scaredQuestions.length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateScores() {
    let totalScore = 0;
    const subscaleScores: Record<string, number> = {};

    for (const [key, sub] of Object.entries(scaredSubscales)) {
      subscaleScores[key] = sub.items.reduce((sum, idx) => {
        const val = answers[idx] ?? 0;
        return sum + val;
      }, 0);
    }

    for (let i = 0; i < total; i++) {
      totalScore += answers[i] ?? 0;
    }

    return { totalScore, subscaleScores };
  }

  function handleSubmit() {
    const { totalScore, subscaleScores } = calculateScores();
    const result = classifyScared(totalScore, subscaleScores);
    saveMutation.mutate({
      scaleName: "SCARED",
      answers,
      totalScore,
      classification: result.classification,
      patientAge: "8-18 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
    const { totalScore, subscaleScores } = calculateScores();
    const result = classifyScared(totalScore, subscaleScores);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — SCARED</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{totalScore}</div>
              <p className="text-xs text-muted-foreground">Total (0-82)</p>
              <Badge className={`text-sm px-4 py-1.5 ${
                totalScore < 25
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : totalScore < 30
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {result.classification}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {totalScore < 25 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            {/* Subscale breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Subescalas</h3>
              {result.subscaleResults.map((sub) => (
                <div key={sub.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${sub.color}`}>{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Pontuação: {sub.score} (corte: {sub.cutoff})
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${sub.positive ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {sub.positive ? "Positivo" : "Negativo"}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-indigo-800 dark:text-indigo-300 space-y-1">
                  <p><strong>Pontos de corte do SCARED:</strong></p>
                  <p>Total &lt; 25: sem indicativo / 25-29: possível / ≥ 30: provável transtorno de ansiedade</p>
                  <p>Subescalas acima do ponto de corte indicam tipo específico de ansiedade</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="SCARED"
          scaleFullName="Screen for Child Anxiety Related Disorders"
          totalScore={totalScore}
          maxScore={82}
          classification={result.classification}
          description={result.description}
          domainResults={Object.entries(subscaleScores).map(([name, score]) => ({ domain: name, score, classification: score >= (name === "Pânico" ? 7 : name === "Ansiedade Generalizada" ? 9 : name === "Ansiedade Separação" ? 5 : name === "Fobia Social" ? 8 : 3) ? "Elevado" : "Normal" }))}
          items={scaredQuestions.map((q, i) => ({ question: q, answer: scaredLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="8-18 anos"
        />
        <SaveToPatient
          scaleName="SCARED"
          totalScore={totalScore}
          classification={result.classification}
          answers={answers}
          domainScores={Object.fromEntries(Object.entries(scaredSubscales).map(([k, sub]) => [sub.name, subscaleScores[k]]))}
        />
        <Button onClick={handleReset} variant="outline" className="w-full gap-2" data-testid="button-reset">
          <RotateCcw className="w-4 h-4" />
          Nova Avaliação
        </Button>
      </div>
    );
  }

  // Group questions by subscale for better organization
  const subscaleEntries = Object.entries(scaredSubscales);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">SCARED</h1>
          <p className="text-xs text-muted-foreground">Triagem de Transtornos de Ansiedade — 8 a 18 anos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-4">
        <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada afirmação, indique o quanto ela se aplica à criança/adolescente nos últimos 3 meses. Todas as 41 questões são apresentadas em sequência.
        </p>
      </div>

      {/* All questions sequentially */}
      <div className="space-y-3">
        {scaredQuestions.map((q, i) => (
          <Card key={i} data-testid={`card-question-${i}`} className="border-card-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{q}</p>
              </div>
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
                className="flex flex-wrap gap-2"
              >
                {scaredLabels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem value={j.toString()} id={`scared-q${i}-o${j}`} className="sr-only" />
                    <Label
                      htmlFor={`scared-q${i}-o${j}`}
                      className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        answers[i] === j
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
        ))}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {allAnswered ? "Ver Resultado" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="scared" />
    </div>
  );
}

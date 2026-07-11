import { useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  connersQuestions, connersLabels, connersSubscales, classifyConners
} from "@/data/newScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClipboardList, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function ConnersPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const total = connersQuestions.length;
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

    for (const [key, sub] of Object.entries(connersSubscales)) {
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
    const result = classifyConners(totalScore, subscaleScores);
    saveMutation.mutate({
      scaleName: "Conners Abreviada",
      answers,
      totalScore,
      classification: result.classification,
      patientAge: "6-18 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
    const { totalScore, subscaleScores } = calculateScores();
    const result = classifyConners(totalScore, subscaleScores);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-sm">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — Conners Abreviada</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Perguntas e respostas</h2>
            <div className="space-y-3">
              {connersQuestions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-relaxed">{q}</p>
                    <p className="text-sm font-medium text-primary">
                      → {answers[i] !== undefined ? connersLabels[answers[i]] : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        <ClinicalReport
          scaleName="Conners Abreviada"
          scaleFullName="Conners Rating Scales — Abbreviated"
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description={result.description}
          items={connersQuestions.map((q, i) => ({ question: q, answer: answers[i] !== undefined ? connersLabels[answers[i]] : "—", value: answers[i] ?? 0 }))}
          patientAge="6-18 anos"
        />
        <SaveToPatient
          scaleName="Conners Abreviada"
          totalScore={totalScore}
          classification={result.classification}
          answers={answers}
          domainScores={Object.fromEntries(Object.entries(connersSubscales).map(([k, sub]) => [sub.name, subscaleScores[k]]))}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-sm">
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Conners Abreviada</h1>
          <p className="text-xs text-muted-foreground">Escala Abreviada para Pais — 6 a 18 anos</p>
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
      <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-4">
        <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada comportamento, indique a frequência com que a criança/adolescente o apresenta. Considere o último mês.
        </p>
      </div>

      {/* Questions by subscale */}
      {Object.entries(connersSubscales).map(([key, sub]) => (
        <div key={key} className="space-y-3">
          <div className="flex items-center gap-2 py-2">
            <div className={`w-3 h-3 rounded-full ${
              key === "conduct" ? "bg-red-500" :
              key === "learning" ? "bg-orange-500" :
              key === "psychosomatic" ? "bg-blue-500" :
              key === "impulsivity" ? "bg-purple-500" :
              key === "anxiety" ? "bg-teal-500" : "bg-pink-500"
            }`} />
            <h2 className={`text-sm font-semibold ${sub.color}`}>{sub.name}</h2>
          </div>

          {sub.items.map((qIdx) => (
            <Card key={qIdx} data-testid={`card-question-${qIdx}`} className="border-card-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{qIdx + 1}</Badge>
                  <p className="text-sm text-foreground leading-relaxed">{connersQuestions[qIdx]}</p>
                </div>
                <RadioGroup
                  value={answers[qIdx]?.toString()}
                  onValueChange={(val) => setAnswers({ ...answers, [qIdx]: parseInt(val) })}
                  className="flex flex-wrap gap-2"
                >
                  {connersLabels.map((label, j) => (
                    <div key={j} className="flex items-center">
                      <RadioGroupItem value={j.toString()} id={`conners-q${qIdx}-o${j}`} className="sr-only" />
                      <Label
                        htmlFor={`conners-q${qIdx}-o${j}`}
                        className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                          answers[qIdx] === j
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
      ))}

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
      <ScaleReference scaleId="conners" />
    </div>
  );
}

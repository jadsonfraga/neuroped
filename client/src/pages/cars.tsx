import { useState } from "react";
import { carsCategories, classifyCars } from "@/data/scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function CarsPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const total = carsCategories.length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateScore(): number {
    return Object.values(answers).reduce((sum, val) => sum + (val + 1), 0);
  }

  function handleSubmit() {
    const score = calculateScore();
    const result = classifyCars(score);
    saveMutation.mutate({
      scaleName: "CARS",
      answers,
      totalScore: score,
      classification: result.classification,
      patientAge: "≥ 2 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
    const score = calculateScore();
    const result = classifyCars(score);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — CARS</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{score}</div>
              <p className="text-xs text-muted-foreground">de 60 pontos</p>
              <Badge className={`text-sm px-4 py-1.5 ${
                score < 30 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                score <= 36 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {result.classification}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                {score < 30 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-violet-800 dark:text-violet-300 space-y-1">
                  <p><strong>Pontos de corte (CARS):</strong></p>
                  <p>15-29: Sem autismo</p>
                  <p>30-36: Autismo leve a moderado</p>
                  <p>37-60: Autismo moderado a grave</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="CARS"
          scaleFullName="Childhood Autism Rating Scale"
          totalScore={score}
          maxScore={60}
          classification={result.classification}
          description={result.description}
          items={carsCategories.map((cat, i) => ({ question: cat.name, answer: String((answers[i] ?? 0) + 1), value: (answers[i] ?? 0) + 1 }))}
          patientAge="≥ 2 anos"
        />
        <SaveToPatient
          scaleName="CARS"
          totalScore={score}
          classification={result.classification}
          answers={answers}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CARS</h1>
          <p className="text-xs text-muted-foreground">Childhood Autism Rating Scale — a partir de 2 anos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} categorias</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada categoria, selecione a opção que melhor descreve o comportamento da criança. Cada item pontua de 1 (normal) a 4 (gravemente anormal).
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {carsCategories.map((cat, i) => (
          <Card key={i} data-testid={`card-category-${i}`} className="border-card-border">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">{i + 1}</Badge>
                <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
              </div>
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
              >
                {cat.options.map((opt, j) => (
                  <div key={j} className="flex items-start space-x-3 py-1.5">
                    <RadioGroupItem value={j.toString()} id={`q${i}-o${j}`} className="mt-0.5" />
                    <Label htmlFor={`q${i}-o${j}`} className="text-sm text-foreground leading-relaxed cursor-pointer font-normal">
                      <span className="font-medium text-muted-foreground mr-1">({j + 1})</span>
                      {opt}
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
        {allAnswered ? "Ver Resultado" : `Avalie todas as ${total} categorias`}
      </Button>
      <ScaleReference scaleId="cars" />
    </div>
  );
}

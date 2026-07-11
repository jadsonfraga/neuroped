import { useRef, useState } from "react";
import { carsCategories, classifyCars } from "@/data/scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function CarsPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = carsCategories.length;
  const answered = carsCategories.reduce((count, _, i) => count + (answers[i] !== undefined ? 1 : 0), 0);
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = carsCategories.findIndex((_, i) => answers[i] === undefined);
  const missingCount = Math.max(total - answered, 0);

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
    setSubmitAttempted(true);
    if (!allAnswered) {
      if (firstMissingIndex >= 0) {
        itemRefs.current[firstMissingIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => itemRefs.current[firstMissingIndex]?.focus({ preventScroll: true }), 250);
      }
      return;
    }
    const score = calculateScore();
    const result = classifyCars(score);
    saveMutation.mutate({
      scaleName: "CARS-2",
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
    setSubmitAttempted(false);
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
            <h1 className="text-lg font-bold">Resultado — CARS-2</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Perguntas e respostas</h2>
            <div className="space-y-3">
              {carsCategories.map((cat, i) => (
                <div key={i} className="flex items-start gap-2 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-relaxed">{cat.name}</p>
                    <p className="text-sm font-medium text-primary">
                      → {answers[i] !== undefined ? cat.options[answers[i]] : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>


        <ClinicalReport
          scaleName="CARS-2"
          scaleFullName="Childhood Autism Rating Scale, Second Edition"
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description={result.description}
          items={carsCategories.map((cat, i) => ({ question: cat.name, answer: answers[i] !== undefined ? cat.options[answers[i]] : "—", value: (answers[i] ?? 0) + 1 }))}
          patientAge="≥ 2 anos"
        />
        <SaveToPatient
          scaleName="CARS-2"
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
          <h1 className="text-lg font-bold">CARS-2</h1>
          <p className="text-xs text-muted-foreground">Childhood Autism Rating Scale, Second Edition — a partir de 2 anos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} categorias</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={`Progresso da escala: ${answered} de ${total} categorias avaliadas`}
        />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 p-4">
        <p className="text-xs text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada categoria, selecione a opção que melhor descreve o comportamento da criança. Cada item pontua de 1 (normal) a 4 (gravemente anormal).
          <span className="mt-2 block">Nota técnica: este módulo usa a nomenclatura CARS-2 de forma consistente no app e mantém os pontos de corte clínicos apresentados abaixo.</span>
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {carsCategories.map((cat, i) => {
          const pending = submitAttempted && answers[i] === undefined;
          return (
          <Card
            key={i}
            ref={(node) => { itemRefs.current[i] = node; }}
            tabIndex={-1}
            aria-invalid={pending}
            data-testid={`card-category-${i}`}
            className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">{i + 1}</Badge>
                <h3 className="text-sm font-semibold text-foreground">{cat.name}</h3>
              </div>
              {pending && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">
                  Resposta obrigatória para concluir a escala.
                </p>
              )}
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
              >
                {cat.options.map((opt, j) => (
                  <div key={j} className="flex items-start space-x-3 py-1.5">
                    <RadioGroupItem value={j.toString()} id={`q${i}-o${j}`} className="peer mt-0.5" />
                    <Label
                      htmlFor={`q${i}-o${j}`}
                      aria-pressed={answers[i] === j}
                      className="text-sm text-foreground leading-relaxed cursor-pointer font-normal peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background"
                    >
                      <span className="font-medium text-muted-foreground mr-1">({j + 1})</span>
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} categoria{missingCount !== 1 ? "s" : ""}. A primeira categoria pendente foi destacada.
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        aria-disabled={!allAnswered}
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

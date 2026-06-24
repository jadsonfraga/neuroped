import { useRef, useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import {
  sdqQuestions, sdqLabels, sdqSubscales,
  scoreSdqItem, classifySdq
} from "@/data/newScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { BarChart3, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function SdqPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = sdqQuestions.length;
  const answered = sdqQuestions.reduce((count, _, i) => count + (answers[i] !== undefined ? 1 : 0), 0);
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = sdqQuestions.findIndex((_, i) => answers[i] === undefined);
  const missingCount = Math.max(total - answered, 0);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateScores() {
    const scores: Record<string, number> = {};
    for (const [key, sub] of Object.entries(sdqSubscales)) {
      scores[key] = sub.items.reduce((sum, idx) => {
        if (answers[idx] === undefined) return sum;
        return sum + scoreSdqItem(idx, answers[idx]);
      }, 0);
    }
    return scores;
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
    const scores = calculateScores();
    const result = classifySdq(scores);
    saveMutation.mutate({
      scaleName: "SDQ",
      answers,
      totalScore: result.total,
      classification: result.classification,
      patientAge: "4-17 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
    setSubmitAttempted(false);
  }

  if (showResult) {
    const scores = calculateScores();
    const result = classifySdq(scores);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — SDQ</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{result.total}</div>
              <p className="text-xs text-muted-foreground">Total de Dificuldades (0-40)</p>
              <Badge className={`text-sm px-4 py-1.5 ${
                result.classification === "Normal"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : result.classification === "Limítrofe"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {result.classification}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.classification === "Normal" ? (
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
              {Object.entries(sdqSubscales).map(([key, sub]) => {
                const subScore = scores[key];
                const subClass = result.subscaleClassifications[key];
                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${sub.color}`}>{sub.name}</p>
                      <p className="text-xs text-muted-foreground">Pontuação: {subScore}/10</p>
                    </div>
                    <Badge variant="outline" className={`text-xs ${subClass.color}`}>
                      {subClass.classification}
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-800 dark:text-green-300 space-y-1">
                  <p><strong>Pontos de corte do SDQ:</strong></p>
                  <p>Normal: 0-13 / Limítrofe: 14-16 / Anormal: 17-40</p>
                  <p>Pró-social: maior = melhor; demais: menor = melhor</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="SDQ"
          scaleFullName="Strengths and Difficulties Questionnaire"
          totalScore={result.total}
          maxScore={40}
          classification={result.classification}
          description={result.description}
          domainResults={Object.entries(sdqSubscales).map(([key, sub]) => ({ domain: sub.name, score: scores[key] ?? 0, classification: result.subscaleClassifications[key]?.classification ?? "—" }))}
          items={sdqQuestions.map((q, i) => ({ question: q, answer: sdqLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="4-17 anos"
        />
        <SaveToPatient
          scaleName="SDQ"
          totalScore={result.total}
          classification={result.classification}
          answers={answers}
          domainScores={Object.fromEntries(Object.entries(sdqSubscales).map(([k, sub]) => [sub.name, scores[k]]))}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">SDQ</h1>
          <p className="text-xs text-muted-foreground">Questionário de Capacidades e Dificuldades — 4 a 17 anos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={`Progresso da escala: ${answered} de ${total} perguntas respondidas`}
        />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 p-4">
        <p className="text-xs text-green-800 dark:text-green-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada afirmação, indique o quanto ela se aplica ao comportamento da criança/adolescente nos últimos 6 meses. Os itens aparecem em ordem sequencial; as subescalas são calculadas apenas no resultado.
        </p>
      </div>

      {/* Questions in original sequential order */}
      <div className="space-y-3">
        {sdqQuestions.map((question, qIdx) => {
          const pending = submitAttempted && answers[qIdx] === undefined;
          return (
            <Card
              key={qIdx}
              ref={(node) => { itemRefs.current[qIdx] = node; }}
              tabIndex={-1}
              aria-invalid={pending}
              data-testid={`card-question-${qIdx}`}
              className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{qIdx + 1}</Badge>
                  <p className="text-sm text-foreground leading-relaxed">{question}</p>
                </div>
                {pending && (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">
                    Resposta obrigatória para concluir a escala.
                  </p>
                )}
                <RadioGroup
                  value={answers[qIdx]?.toString()}
                  onValueChange={(val) => setAnswers({ ...answers, [qIdx]: parseInt(val) })}
                  className="flex flex-wrap gap-2"
                >
                  {sdqLabels.map((label, j) => (
                    <div key={j} className="flex items-center">
                      <RadioGroupItem value={j.toString()} id={`sdq-q${qIdx}-o${j}`} className="peer sr-only" />
                      <Label
                        htmlFor={`sdq-q${qIdx}-o${j}`}
                        aria-pressed={answers[qIdx] === j}
                        className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${
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
          );
        })}
      </div>

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. A primeira pergunta pendente foi destacada.
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
        {allAnswered ? "Ver Resultado" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="sdq" />
    </div>
  );
}

import { useRef, useState } from "react";
import { mchatQuestions, mchatReversedItems, classifyMchat } from "@/data/scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Baby, RotateCcw, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function MchatPage() {
  const [answers, setAnswers] = useState<Record<number, boolean | null>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = mchatQuestions.length;
  const answered = mchatQuestions.reduce(
    (count, _, i) => count + (answers[i] === true || answers[i] === false ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = mchatQuestions.findIndex((_, i) => answers[i] !== true && answers[i] !== false);
  const missingCount = Math.max(total - answered, 0);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateScore(): number {
    let score = 0;
    mchatQuestions.forEach((_, i) => {
      const answer = answers[i];
      if (answer === null || answer === undefined) return;
      // Itens invertidos: "sim" = risco
      if (mchatReversedItems.includes(i)) {
        if (answer === true) score++;
      } else {
        // Itens normais: "não" = risco
        if (answer === false) score++;
      }
    });
    return score;
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
    const result = classifyMchat(score);
    saveMutation.mutate({
      scaleName: "M-CHAT-R/F",
      answers,
      totalScore: score,
      classification: result.risk,
      patientAge: "16-30 meses",
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
    const result = classifyMchat(score);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — M-CHAT-R/F</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{score}</div>
              <p className="text-xs text-muted-foreground">de 20 pontos</p>
              <Badge className={`text-sm px-4 py-1.5 ${
                score <= 2 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                score <= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              }`}>
                {result.risk}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                {score <= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p><strong>Pontos de corte:</strong></p>
                  <p>0-2: Baixo risco — acompanhamento de rotina</p>
                  <p>3-7: Risco moderado — aplicar Follow-up</p>
                  <p>8-20: Alto risco — encaminhamento imediato</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="M-CHAT-R/F"
          scaleFullName="Modified Checklist for Autism in Toddlers, Revised with Follow-Up"
          totalScore={score}
          maxScore={20}
          classification={result.risk}
          description={result.description}
          items={mchatQuestions.map((q, i) => ({ question: q, answer: answers[i] === true ? "Sim" : answers[i] === false ? "Não" : "—", value: answers[i] ? 1 : 0 }))}
          patientAge="16-30 meses"
        />
        <SaveToPatient
          scaleName="M-CHAT-R/F"
          totalScore={score}
          classification={result.risk}
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
          <Baby className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">M-CHAT-R/F</h1>
          <p className="text-xs text-muted-foreground">Checklist Modificado para Autismo — 16 a 30 meses</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground" aria-live="polite">
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
      <div className="rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 p-4">
        <p className="text-xs text-pink-800 dark:text-pink-300 leading-relaxed">
          <strong>Instruções:</strong> Responda sim ou não para cada pergunta sobre o comportamento da criança. Considere o comportamento habitual. Se viu o comportamento poucas vezes, responda “Não”.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {mchatQuestions.map((q, i) => {
          const pending = submitAttempted && answers[i] !== true && answers[i] !== false;
          return (
            <Card
              key={i}
              ref={(node) => { itemRefs.current[i] = node; }}
              tabIndex={-1}
              aria-invalid={pending}
              data-testid={`card-question-${i}`}
              className={`border-card-border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                pending
                  ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20"
                  : answers[i] !== undefined && answers[i] !== null
                    ? "bg-card"
                    : "bg-card/60"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs font-mono">
                    {i + 1}
                  </Badge>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">{q}</p>
                    {pending && (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">
                        Resposta obrigatória para concluir a escala.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={answers[i] === true ? "default" : "outline"}
                        aria-pressed={answers[i] === true}
                        onClick={() => setAnswers({ ...answers, [i]: true })}
                        className="min-w-[64px]"
                        data-testid={`button-yes-${i}`}
                      >
                        Sim
                      </Button>
                      <Button
                        size="sm"
                        variant={answers[i] === false ? "default" : "outline"}
                        aria-pressed={answers[i] === false}
                        onClick={() => setAnswers({ ...answers, [i]: false })}
                        className="min-w-[64px]"
                        data-testid={`button-no-${i}`}
                      >
                        Não
                      </Button>
                    </div>
                  </div>
                </div>
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
      <ScaleReference scaleId="mchat" />
    </div>
  );
}

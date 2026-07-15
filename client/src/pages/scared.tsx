import { useRef, useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { scaredQuestions, scaredLabels } from "@/data/newScales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function ScaredPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = scaredQuestions.length;
  const answered = scaredQuestions.reduce(
    (count, _, i) => count + (answers[i] !== undefined ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = scaredQuestions.findIndex(
    (_, i) => answers[i] === undefined,
  );
  const missingCount = Math.max(total - answered, 0);

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      if (firstMissingIndex >= 0) {
        itemRefs.current[firstMissingIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        window.setTimeout(
          () =>
            itemRefs.current[firstMissingIndex]?.focus({ preventScroll: true }),
          250,
        );
      }
      return;
    }
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
    setSubmitAttempted(false);
  }

  if (showResult) {
    const reportItems = scaredQuestions.map((question, index) => ({
      question,
      answer:
        answers[index] !== undefined
          ? scaredLabels[answers[index]]
          : "Não respondida",
    }));

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
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {scaredQuestions.map((q, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 pb-3 border-b border-border/50 last:border-0 last:pb-0"
                >
                  <Badge
                    variant="outline"
                    className="text-xs font-mono flex-shrink-0 mt-0.5"
                  >
                    {i + 1}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-relaxed">
                      {q}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      →{" "}
                      {answers[i] !== undefined
                        ? scaredLabels[answers[i]]
                        : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="SCARED"
          scaleFullName="Screen for Child Anxiety Related Disorders"
          items={reportItems}
          patientAge="8-18 anos"
        />
        <SaveToPatient
          scaleName="SCARED"
          responses={reportItems}
          patientAge="8-18 anos"
        />
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">SCARED</h1>
          <p className="text-xs text-muted-foreground">
            Triagem de Transtornos de Ansiedade — 8 a 18 anos
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} respondidas
          </span>
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
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 p-4">
        <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada afirmação, indique o quanto ela
          se aplica à criança/adolescente nos últimos 3 meses. Todas as 41
          questões são apresentadas em sequência.
        </p>
      </div>

      {/* All questions sequentially */}
      <div className="space-y-3">
        {scaredQuestions.map((q, i) => {
          const pending = submitAttempted && answers[i] === undefined;
          return (
            <Card
              key={i}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              tabIndex={-1}
              aria-invalid={pending}
              data-testid={`card-question-${i}`}
              className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono flex-shrink-0 mt-0.5"
                  >
                    {i + 1}
                  </Badge>
                  <p className="text-sm text-foreground leading-relaxed">{q}</p>
                </div>
                {pending && (
                  <p
                    className="text-xs font-medium text-amber-700 dark:text-amber-300"
                    role="alert"
                  >
                    Resposta obrigatória para concluir a escala.
                  </p>
                )}
                <RadioGroup
                  value={answers[i]?.toString()}
                  onValueChange={(val) =>
                    setAnswers({ ...answers, [i]: parseInt(val) })
                  }
                  className="flex flex-wrap gap-2"
                >
                  {scaredLabels.map((label, j) => (
                    <div key={j} className="flex items-center">
                      <RadioGroupItem
                        value={j.toString()}
                        id={`scared-q${i}-o${j}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`scared-q${i}-o${j}`}
                        aria-pressed={answers[i] === j}
                        className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${
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
          );
        })}
      </div>

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. A
          primeira pergunta pendente foi destacada.
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
      <ScaleReference scaleId="scared" />
    </div>
  );
}

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Info, ShieldAlert } from "lucide-react";
import {
  cssrsQuestions,
  getVisibleCssrsQuestionIds,
  pruneCssrsAnswers,
} from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function CssrsPage() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const visibleIds = useMemo(
    () => getVisibleCssrsQuestionIds(answers),
    [answers],
  );
  const visibleQuestions = useMemo(
    () => cssrsQuestions.filter((q) => visibleIds.includes(q.id)),
    [visibleIds],
  );
  const total = visibleQuestions.length;
  const answered = visibleIds.filter((id) => answers[id] !== undefined).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const allAnswered = total > 0 && answered === total;
  const firstMissingId = visibleIds.find((id) => answers[id] === undefined);
  const missingCount = Math.max(total - answered, 0);

  function answerQuestion(id: number, value: boolean) {
    setAnswers((current) => pruneCssrsAnswers({ ...current, [id]: value }));
  }

  function focusFirstMissing() {
    if (!firstMissingId) return;
    itemRefs.current[firstMissingId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(
      () => itemRefs.current[firstMissingId]?.focus({ preventScroll: true }),
      250,
    );
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      focusFirstMissing();
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
    const resultVisibleIds = getVisibleCssrsQuestionIds(answers);
    const resultQuestions = cssrsQuestions.filter((q) =>
      resultVisibleIds.includes(q.id),
    );
    const reportItems = resultQuestions.map((question) => ({
      question: question.text,
      answer:
        answers[question.id] === undefined
          ? "Não respondida"
          : answers[question.id]
            ? "Sim"
            : "Não",
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — C-SSRS</h1>
            <p className="text-xs text-muted-foreground">
              Escala Columbia de Gravidade de Ideação Suicida
            </p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-2">
              {resultQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-lg bg-muted/30 p-3 space-y-1"
                >
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono flex-shrink-0 mt-0.5"
                    >
                      {q.id}
                    </Badge>
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        {q.level}
                      </p>
                      <p className="text-sm text-foreground leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-primary pl-8">
                    →{" "}
                    {answers[q.id] !== undefined
                      ? answers[q.id]
                        ? "Sim"
                        : "Não"
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-800 dark:text-red-300 space-y-1">
              <p>
                <strong>Importante:</strong> A C-SSRS é uma triagem. Qualquer
                resposta positiva (especialmente questões 3-6) requer avaliação
                profissional imediata.
              </p>
              <p>
                Se houver risco iminente, encaminhar para emergência
                psiquiátrica (SAMU 192 / CVV 188).
              </p>
            </div>
          </div>
        </div>

        <ClinicalReport
          scaleName="C-SSRS"
          scaleFullName="Columbia Suicide Severity Rating Scale"
          items={reportItems}
          patientAge="≥ 6 anos"
        />
        <SaveToPatient
          scaleName="C-SSRS"
          responses={reportItems}
          patientAge="≥ 6 anos"
        />
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">C-SSRS</h1>
          <p className="text-xs text-muted-foreground">
            Escala Columbia de Gravidade de Ideação Suicida
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
        <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
          <strong>Instruções:</strong> Aplique em sequência clínica. Perguntas
          sobre ideação ativa, método, intenção e plano só aparecem quando a
          resposta anterior indica necessidade.
        </p>
      </div>

      <div className="space-y-2">
        <div
          className="flex justify-between text-xs text-muted-foreground"
          aria-live="polite"
        >
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

      {visibleQuestions.map((q) => {
        const pending = submitAttempted && answers[q.id] === undefined;
        return (
          <Card
            key={q.id}
            ref={(node) => {
              itemRefs.current[q.id] = node;
            }}
            tabIndex={-1}
            aria-invalid={pending}
            className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-mono flex-shrink-0 mt-0.5"
                >
                  {q.id}
                </Badge>
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    {q.level}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {q.text}
                  </p>
                </div>
              </div>
              {pending && (
                <p
                  className="text-xs font-medium text-amber-700 dark:text-amber-300"
                  role="alert"
                >
                  Resposta obrigatória para concluir esta etapa.
                </p>
              )}
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={val.toString()}
                    type="button"
                    aria-pressed={answers[q.id] === val}
                    onClick={() => answerQuestion(q.id, val)}
                    className={`min-h-[40px] text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                      answers[q.id] === val
                        ? val
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-emerald-500 text-white border-emerald-500"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {val ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. A
          primeira pergunta pendente foi destacada.
        </div>
      )}

      <Button
        onClick={handleSubmit}
        aria-disabled={!allAnswered}
        className="w-full"
        size="lg"
      >
        {allAnswered
          ? "Ver Resultado"
          : `Responder pendências (${answered}/${total})`}
      </Button>
      <ScaleReference scaleId="cssrs" />
    </div>
  );
}

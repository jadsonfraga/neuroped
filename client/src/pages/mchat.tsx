import { lazy, Suspense, useRef, useState } from "react";
import { mchatQuestions } from "@/data/mchat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Baby, RotateCcw } from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";
import {
  ScaleDraftLoading,
  ScaleDraftRestoredNotice,
} from "@/components/ScaleDraftLoading";
import { useSecureTypedScaleDraft } from "@/hooks/useSecureScaleDraft";

const LazyClinicalReport = lazy(() =>
  import("@/components/ClinicalReport").then(({ ClinicalReport: Component }) => ({ default: Component })),
);
const LazySaveToPatient = lazy(() =>
  import("@/components/SaveToPatient").then(({ SaveToPatient: Component }) => ({ default: Component })),
);
import {
  hasRecordEntries,
  indexedKeys,
  sanitizeBooleanRecord,
} from "@/lib/scaleDraftCore";

const MCHAT_DRAFT_KEYS = indexedKeys(mchatQuestions.length);

export default function MchatPage() {
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const {
    value: answers,
    setValue: setAnswers,
    ready: draftReady,
    restored: draftRestored,
    clearDraft,
  } = useSecureTypedScaleDraft<Record<number, boolean>>({
    draftId: "dedicated:mchat-r-f",
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => sanitizeBooleanRecord(value, MCHAT_DRAFT_KEYS),
    hasContent: hasRecordEntries,
  });

  const total = mchatQuestions.length;
  const answered = mchatQuestions.reduce(
    (count, _, i) =>
      count + (answers[i] === true || answers[i] === false ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = mchatQuestions.findIndex(
    (_, i) => answers[i] !== true && answers[i] !== false,
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
    void clearDraft();
    setShowResult(false);
    setSubmitAttempted(false);
  }

  if (!draftReady) return <ScaleDraftLoading />;

  if (showResult) {
    const reportItems = mchatQuestions.map((question, index) => ({
      question,
      answer:
        answers[index] === true
          ? "Sim"
          : answers[index] === false
            ? "Não"
            : "Não respondida",
    }));
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Respostas registradas — M-CHAT-R/F</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {mchatQuestions.map((q, i) => (
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
                      {answers[i] === true
                        ? "Sim"
                        : answers[i] === false
                          ? "Não"
                          : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Suspense
          fallback={<div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground" role="status">Carregando relatório seguro…</div>}
        >
          <LazyClinicalReport
            scaleName="M-CHAT-R/F"
            scaleFullName="Modified Checklist for Autism in Toddlers, Revised with Follow-Up"
            items={reportItems}
            patientAge="16-30 meses"
          />
          <LazySaveToPatient
            scaleName="M-CHAT-R/F"
            responses={reportItems}
            patientAge="16-30 meses"
          />
        </Suspense>
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
      <ScaleDraftRestoredNotice visible={draftRestored} onClear={handleReset} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-sm">
          <Baby className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">M-CHAT-R/F</h1>
          <p className="text-xs text-muted-foreground">
            Checklist Modificado para Autismo — 16 a 30 meses
          </p>
        </div>
      </div>

      {/* Progress */}
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

      {/* Instruction */}
      <div className="rounded-xl bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800/40 p-4">
        <p className="text-xs text-pink-800 dark:text-pink-300 leading-relaxed">
          <strong>Instruções:</strong> Responda sim ou não para cada pergunta
          sobre o comportamento da criança. Considere o comportamento habitual.
          Se viu o comportamento poucas vezes, responda “Não”.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {mchatQuestions.map((q, i) => {
          const pending =
            submitAttempted && answers[i] !== true && answers[i] !== false;
          return (
            <Card
              key={i}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
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
                  <Badge
                    variant="outline"
                    className="mt-0.5 flex-shrink-0 text-xs font-mono"
                  >
                    {i + 1}
                  </Badge>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      {q}
                    </p>
                    {pending && (
                      <p
                        className="text-xs font-medium text-amber-700 dark:text-amber-300"
                        role="alert"
                      >
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
        {allAnswered ? "Ver respostas" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="mchat" />
    </div>
  );
}

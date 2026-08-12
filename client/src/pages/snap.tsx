import { useRef, useState } from "react";
import { snapQuestions, snapLabels } from "@/data/scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Activity, RotateCcw, Eye, Zap } from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";
import {
  ScaleDraftLoading,
  ScaleDraftRestoredNotice,
} from "@/components/ScaleDraftLoading";
import { useSecureTypedScaleDraft } from "@/hooks/useSecureScaleDraft";
import {
  hasRecordEntries,
  indexedAllowedValues,
  sanitizeNumberRecord,
} from "@/lib/scaleDraftCore";

const SNAP_DRAFT_VALUES = indexedAllowedValues(
  snapQuestions.length,
  snapLabels.length,
);

export default function SnapPage() {
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const {
    value: answers,
    setValue: setAnswers,
    ready: draftReady,
    restored: draftRestored,
    clearDraft,
  } = useSecureTypedScaleDraft<Record<number, number>>({
    draftId: "dedicated:snap-iv",
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => sanitizeNumberRecord(value, SNAP_DRAFT_VALUES),
    hasContent: hasRecordEntries,
  });

  const total = snapQuestions.length;
  const answered = snapQuestions.reduce(
    (count, _, i) => count + (answers[i] !== undefined ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = snapQuestions.findIndex(
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
    void clearDraft();
    setShowResult(false);
    setSubmitAttempted(false);
  }

  if (!draftReady) return <ScaleDraftLoading />;

  if (showResult) {
    const reportItems = snapQuestions.map((question, index) => ({
      question,
      answer:
        answers[index] !== undefined
          ? snapLabels[answers[index]]
          : "Não respondida",
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Respostas registradas — SNAP-IV</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {snapQuestions.map((q, i) => (
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
                    <p className="text-[15px] font-medium text-foreground leading-relaxed sm:text-base">
                      {q}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      →{" "}
                      {answers[i] !== undefined ? snapLabels[answers[i]] : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="SNAP-IV"
          scaleFullName="Swanson, Nolan and Pelham Questionnaire"
          items={reportItems}
          patientAge="6-18 anos"
        />
        <SaveToPatient
          scaleName="SNAP-IV"
          responses={reportItems}
          patientAge="6-18 anos"
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
      <ScaleDraftRestoredNotice visible={draftRestored} onClear={handleReset} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">SNAP-IV</h1>
          <p className="text-xs text-muted-foreground">
            Escala de TDAH — 6 a 18 anos
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
      <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-4">
        <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, selecione a opção que
          melhor descreve o comportamento da criança/adolescente nos últimos 6
          meses, segundo relato de pais ou professores.
        </p>
      </div>

      {/* Section: Desatenção */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 py-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            Desatenção (itens 1-9)
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {snapQuestions.slice(0, 9).map((q, i) => {
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
                  <p className="text-[15px] font-medium text-foreground leading-relaxed sm:text-base">{q}</p>
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
                  className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                >
                  {snapLabels.map((label, j) => (
                    <div key={j} className="flex items-stretch">
                      <RadioGroupItem
                        value={j.toString()}
                        id={`q${i}-o${j}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`q${i}-o${j}`}
                        className={`inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-center text-[13px] leading-snug transition-all duration-200 active:scale-[0.98] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background sm:w-auto sm:rounded-full sm:text-sm ${
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

      {/* Section: Hiperatividade/Impulsividade */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 py-2">
          <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            Hiperatividade/Impulsividade (itens 10-18)
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {snapQuestions.slice(9).map((q, idx) => {
          const i = idx + 9;
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
                  <p className="text-[15px] font-medium text-foreground leading-relaxed sm:text-base">{q}</p>
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
                  className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
                >
                  {snapLabels.map((label, j) => (
                    <div key={j} className="flex items-stretch">
                      <RadioGroupItem
                        value={j.toString()}
                        id={`q${i}-o${j}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`q${i}-o${j}`}
                        className={`inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-center text-[13px] leading-snug transition-all duration-200 active:scale-[0.98] peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background sm:w-auto sm:rounded-full sm:text-sm ${
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
        {allAnswered ? "Ver respostas" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="snap" />
    </div>
  );
}

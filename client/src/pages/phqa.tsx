import { useRef, useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Info, HeartPulse } from "lucide-react";
import {
  buildPhqaReportItems,
  hasPositivePhqaSelfHarm,
  phqaQuestions,
  phqaLabels,
  requiresPhqaSafetyConfirmation,
  updatePhqaSafetyConfirmation,
} from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
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

const PHQA_DRAFT_VALUES = indexedAllowedValues(
  phqaQuestions.length,
  phqaLabels.length,
);

export default function PhqaPage() {
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [safetyProtocolConfirmed, setSafetyProtocolConfirmed] = useState(false);
  const [safetyConfirmationAttempted, setSafetyConfirmationAttempted] =
    useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const safetyAlertRef = useRef<HTMLDivElement | null>(null);
  const {
    value: answers,
    setValue: setAnswers,
    ready: draftReady,
    restored: draftRestored,
    clearDraft,
  } = useSecureTypedScaleDraft<Record<number, number>>({
    draftId: "dedicated:phq-a",
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => sanitizeNumberRecord(value, PHQA_DRAFT_VALUES),
    hasContent: hasRecordEntries,
  });

  const total = phqaQuestions.length;
  const answered = phqaQuestions.reduce(
    (count, _, i) => count + (answers[i] !== undefined ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = phqaQuestions.findIndex(
    (_, i) => answers[i] === undefined,
  );
  const missingCount = Math.max(total - answered, 0);
  const selfHarmAlert = hasPositivePhqaSelfHarm(answers);
  const safetyConfirmationRequired = requiresPhqaSafetyConfirmation(
    answers,
    safetyProtocolConfirmed,
  );

  function focusSafetyAlert() {
    safetyAlertRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(
      () => safetyAlertRef.current?.focus({ preventScroll: true }),
      250,
    );
  }

  function answerQuestion(index: number, nextValue: number) {
    setSafetyProtocolConfirmed((currentConfirmed) =>
      updatePhqaSafetyConfirmation(
        currentConfirmed,
        index,
        answers[index],
        nextValue,
      ),
    );
    if (index === 8 && answers[index] !== nextValue) {
      setSafetyConfirmationAttempted(false);
    }
    setAnswers({ ...answers, [index]: nextValue });
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    if (safetyConfirmationRequired) {
      setSafetyConfirmationAttempted(true);
      focusSafetyAlert();
      return;
    }
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
    setSafetyConfirmationAttempted(false);
    setShowResult(true);
  }

  function handleReset() {
    void clearDraft();
    setShowResult(false);
    setSubmitAttempted(false);
    setSafetyProtocolConfirmed(false);
    setSafetyConfirmationAttempted(false);
  }

  if (!draftReady) return <ScaleDraftLoading />;

  if (showResult) {
    const reportItems = buildPhqaReportItems(answers, safetyProtocolConfirmed);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-sm">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Respostas registradas — PHQ-A</h1>
            <p className="text-xs text-muted-foreground">
              Patient Health Questionnaire — Adolescentes
            </p>
          </div>
        </div>
        {selfHarmAlert && (
          <div
            className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-800 dark:bg-red-950/35 dark:text-red-100"
            role="alert"
            data-testid="phqa-self-harm-result-alert"
          >
            <p className="text-sm font-black">
              Item 9 positivo — protocolo de segurança iniciado
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              A confirmação de segurança foi registrada antes da conclusão. As
              respostas abaixo permanecem sem cálculo ou interpretação de
              escore. Mantenha avaliação direta e encaminhamento conforme o
              risco identificado.
            </p>
          </div>
        )}
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {phqaQuestions.map((q, i) => (
                <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1">
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono flex-shrink-0 mt-0.5"
                    >
                      {i + 1}
                    </Badge>
                    <p className="text-sm text-foreground leading-relaxed">
                      {q}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary pl-8">
                    → {answers[i] !== undefined ? phqaLabels[answers[i]] : "—"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-800/40 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-fuchsia-800 dark:text-fuchsia-300 leading-relaxed">
              Em caso de risco de autoagressão ou ideação suicida, procure
              atendimento imediato (SAMU 192 / CVV 188).
            </p>
          </div>
        </div>

        <ClinicalReport
          scaleName="PHQ-A"
          scaleFullName="Patient Health Questionnaire for Adolescents"
          items={reportItems}
          patientAge="11-17 anos"
        />
        <SaveToPatient
          scaleName="PHQ-A"
          responses={reportItems}
          patientAge="11-17 anos"
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
      <ScaleDraftRestoredNotice visible={draftRestored} onClear={handleReset} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-sm">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">PHQ-A</h1>
          <p className="text-xs text-muted-foreground">
            Questionário de Saúde do Paciente — Adolescentes (11-17 anos)
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total}
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
      <div className="rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-800/40 p-4">
        <p className="text-xs text-fuchsia-800 dark:text-fuchsia-300 leading-relaxed">
          <strong>Instruções:</strong> Nas últimas 2 semanas, com que frequência
          você foi incomodado(a) por cada um dos problemas a seguir?
        </p>
      </div>
      {phqaQuestions.map((q, i) => {
        const pending = submitAttempted && answers[i] === undefined;
        return (
          <Card
            key={i}
            ref={(node) => {
              itemRefs.current[i] = node;
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
                onValueChange={(val) => answerQuestion(i, parseInt(val))}
                className="flex flex-wrap gap-2"
              >
                {phqaLabels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem
                      value={j.toString()}
                      id={`phqa-q${i}-o${j}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`phqa-q${i}-o${j}`}
                      className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${answers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {selfHarmAlert && i === 8 && (
                <div
                  ref={safetyAlertRef}
                  tabIndex={-1}
                  className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-800 dark:bg-red-950/35 dark:text-red-100"
                  role="alert"
                  aria-live="assertive"
                  data-testid="phqa-self-harm-alert"
                >
                  <p className="text-sm font-black">
                    Resposta de segurança identificada no item 9
                  </p>
                  <p className="mt-1 text-xs leading-relaxed">
                    Interrompa a interpretação do escore e faça avaliação direta
                    de ideação, plano, meios e risco imediato. Se houver perigo
                    imediato, não deixe a pessoa sozinha: acione o SAMU 192 ou
                    procure um serviço de emergência.
                  </p>
                  <a
                    href="#/cssrs"
                    className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    Abrir avaliação C-SSRS
                  </a>
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-300/80 bg-white/70 p-3 dark:border-red-700 dark:bg-red-950/50">
                    <Checkbox
                      id="phqa-safety-protocol-confirmed"
                      checked={safetyProtocolConfirmed}
                      onCheckedChange={(checked) => {
                        setSafetyProtocolConfirmed(checked === true);
                        if (checked === true) {
                          setSafetyConfirmationAttempted(false);
                        }
                      }}
                      aria-describedby="phqa-safety-confirmation-help"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="phqa-safety-protocol-confirmed"
                        className="cursor-pointer text-xs font-bold leading-relaxed"
                      >
                        Confirmo que iniciei o protocolo de segurança.
                      </Label>
                      <p
                        id="phqa-safety-confirmation-help"
                        className="text-[11px] leading-relaxed"
                      >
                        Inclui avaliação direta de ideação, plano, meios e risco
                        imediato, com acionamento de suporte ou emergência
                        conforme necessário.
                      </p>
                    </div>
                  </div>
                  {safetyConfirmationAttempted && (
                    <p className="mt-2 text-xs font-black">
                      Confirme o início do protocolo antes de ver o resultado.
                    </p>
                  )}
                </div>
              )}
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
        aria-disabled={!allAnswered || safetyConfirmationRequired}
        className="w-full"
        size="lg"
      >
        {safetyConfirmationRequired
          ? "Confirmar protocolo de segurança"
          : allAnswered
            ? "Ver respostas"
            : `Responder pendências (${answered}/${total})`}
      </Button>
      <ScaleReference scaleId="phqa" />
    </div>
  );
}

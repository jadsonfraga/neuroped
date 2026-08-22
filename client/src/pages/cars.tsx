import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { carsCategories } from "@/data/cars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, RotateCcw } from "lucide-react";
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
import { hasRecordEntries, sanitizeNumberRecord } from "@/lib/scaleDraftCore";

const CARS_INITIAL_VISIBLE_ITEMS = 5;
const CARS_VISIBLE_BATCH_SIZE = 5;

const CARS_DRAFT_VALUES = Object.fromEntries(
  carsCategories.map((category, index) => [
    String(index),
    new Set(category.options.map((_, option) => option)),
  ]),
);

export default function CarsPage() {
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
    // Mantido para preservar rascunhos já salvos na versão anterior.
    draftId: "dedicated:cars-2",
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => sanitizeNumberRecord(value, CARS_DRAFT_VALUES),
    hasContent: hasRecordEntries,
  });

  const total = carsCategories.length;
  const [visibleItemCount, setVisibleItemCount] = useState(() =>
    Math.min(total, CARS_INITIAL_VISIBLE_ITEMS),
  );
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);
  const hasMoreCategories = visibleItemCount < total;
  const revealMoreCategories = () => {
    setVisibleItemCount((current) => Math.min(current + CARS_VISIBLE_BATCH_SIZE, total));
  };
  const answered = carsCategories.reduce(
    (count, _, i) => count + (answers[i] !== undefined ? 1 : 0),
    0,
  );
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = carsCategories.findIndex(
    (_, i) => answers[i] === undefined,
  );
  const missingCount = Math.max(total - answered, 0);

  useEffect(() => {
    if (pendingFocusIndex === null) return;
    const frame = window.requestAnimationFrame(() => {
      itemRefs.current[pendingFocusIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => itemRefs.current[pendingFocusIndex]?.focus({ preventScroll: true }), 250);
      setPendingFocusIndex(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pendingFocusIndex, visibleItemCount]);

  function focusCategory(index: number) {
    if (index >= visibleItemCount) {
      setVisibleItemCount(Math.min(index + 1, total));
      setPendingFocusIndex(index);
      return;
    }
    itemRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => itemRefs.current[index]?.focus({ preventScroll: true }), 250);
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      if (firstMissingIndex >= 0) focusCategory(firstMissingIndex);
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
    const reportItems = carsCategories.map((category, index) => ({
      question: category.name,
      answer:
        answers[index] !== undefined
          ? category.options[answers[index]]
          : "Não respondida",
    }));
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">
              Respostas registradas — CARS (15 domínios)
            </h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {carsCategories.map((cat, i) => (
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
                      {cat.name}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      →{" "}
                      {answers[i] !== undefined ? cat.options[answers[i]] : "—"}
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
            scaleName="CARS — registro clínico"
            scaleFullName="Registro descritivo dos 15 domínios da Childhood Autism Rating Scale"
            items={reportItems}
            patientAge="≥ 2 anos"
          />
          <LazySaveToPatient
            scaleName="CARS — registro clínico"
            responses={reportItems}
            patientAge="≥ 2 anos"
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-sm">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CARS — registro clínico</h1>
          <p className="text-xs text-muted-foreground">
            Registro descritivo de 15 domínios — não equivale à aplicação oficial CARS-2
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} categorias
          </span>
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
          <strong>Instruções:</strong> Registro clínico interno. Para cada
          categoria, selecione a opção que melhor descreve o comportamento da
          criança entre as quatro opções apresentadas.
          <span className="mt-2 block">
            O registro final apresenta cada categoria e a descrição selecionada
            por extenso, sem soma, ponto de corte, classificação ou
            interpretação. A CARS2-ST, CARS2-HF e CARS2-QPC oficiais estão
            catalogadas separadamente e exigem material licenciado.
          </span>
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {carsCategories.slice(0, visibleItemCount).map((cat, i) => {
          const pending = submitAttempted && answers[i] === undefined;
          return (
            <Card
              key={i}
              ref={(node) => {
                itemRefs.current[i] = node;
              }}
              tabIndex={-1}
              aria-invalid={pending}
              data-testid={`card-category-${i}`}
              className={`np-scale-item border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {i + 1}
                  </Badge>
                  <h2 className="text-sm font-semibold text-foreground">
                    {cat.name}
                  </h2>
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
                >
                  {cat.options.map((opt, j) => (
                    <div key={j} className="flex items-start space-x-3 py-1.5">
                      <RadioGroupItem
                        value={j.toString()}
                        id={`q${i}-o${j}`}
                        className="peer mt-0.5"
                      />
                      <Label
                        htmlFor={`q${i}-o${j}`}
                        className="text-sm text-foreground leading-relaxed cursor-pointer font-normal peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background"
                      >
                        <span className="font-medium text-muted-foreground mr-1">
                          ({j + 1})
                        </span>
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

      {hasMoreCategories && (
        <div className="rounded-xl border border-border/70 bg-muted/25 p-4 text-center" role="status" aria-live="polite">
          <p className="mb-3 text-xs text-muted-foreground">
            Mostrando {visibleItemCount} de {total} categorias. As próximas aparecem sem alterar o que já foi respondido.
          </p>
          <Button type="button" variant="outline" onClick={revealMoreCategories}>
            Carregar próximas categorias
          </Button>
        </div>
      )}

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} categoria{missingCount !== 1 ? "s" : ""}. A
          primeira categoria pendente foi destacada.
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
        {allAnswered ? "Ver respostas" : `Avalie todas as ${total} categorias`}
      </Button>
      <ScaleReference scaleId="cars" />
    </div>
  );
}

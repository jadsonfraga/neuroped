import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  RotateCcw,
  Save,
} from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHero } from "@/components/PageHero";
import { ClinicalReport } from "@/components/ClinicalReport";
import { SaveToPatient } from "@/components/SaveToPatient";
import { softTick, softSuccess } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { celebrate } from "@/lib/confetti";
import { easing, duration, staggerContainer, staggerItem } from "@/lib/motion";
import { type InteractiveScaleDef } from "@/data/interactiveScales";
import { formatScaleResponseAnswer } from "@/lib/scaleResponseReport";
import { useSecureScaleDraft } from "@/hooks/useSecureScaleDraft";

/**
 * Runner canônico para escalas definidas em interactiveScales.ts.
 *
 * Contratos: aplicação completa, rascunho protegido, navegação para a primeira
 * pendência, registro por extenso e nenhuma interpretação automática inventada.
 */
export function InteractiveScaleRunner({ def }: { def: InteractiveScaleDef }) {
  const [, navigate] = useLocation();
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const validDraftOptions = useMemo(
    () =>
      Object.fromEntries(
        def.items.map((item, index) => [String(index), item.options.length]),
      ),
    [def.items],
  );
  const {
    answers,
    setAnswers,
    ready: draftReady,
    restored: draftRestored,
    status: draftStatus,
    clearDraft,
    clearPersistedDraft,
  } = useSecureScaleDraft({
    draftId: `interactive:${def.id}`,
    validOptions: validDraftOptions,
  });

  useEffect(() => {
    if (showResult) void clearPersistedDraft();
  }, [showResult, clearPersistedDraft]);

  const total = def.items.length;
  const answered = def.items.reduce(
    (count, _, index) => count + (answers[index] != null ? 1 : 0),
    0,
  );
  const progress = total ? (answered / total) * 100 : 0;
  const allAnswered = total > 0 && answered === total;
  const firstMissingIndex = def.items.findIndex(
    (_, index) => answers[index] == null,
  );
  const missingCount = Math.max(total - answered, 0);

  const progressHint = useMemo(() => {
    if (answered === 0) return "Toque numa opção para começar";
    if (allAnswered) return "Tudo respondido — revise o registro completo";
    if (progress >= 66) return "Última etapa: confira as perguntas restantes";
    if (progress >= 33) return "O rascunho é protegido enquanto você avança";
    return "Responda no seu ritmo; você pode retomar nesta aba";
  }, [answered, allAnswered, progress]);

  function focusItem(index: number) {
    if (index < 0) return;
    itemRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    window.setTimeout(
      () => itemRefs.current[index]?.focus({ preventScroll: true }),
      250,
    );
  }

  function pick(itemIndex: number, optionIndex: number) {
    softTick();
    haptic.select();
    setAnswers((previous) => ({ ...previous, [itemIndex]: optionIndex }));
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      focusItem(firstMissingIndex);
      return;
    }
    softSuccess();
    haptic.success();
    celebrate();
    setShowResult(true);
  }

  function handleReset() {
    setShowResult(false);
    setSubmitAttempted(false);
    void clearDraft();
  }

  if (!draftReady) {
    return (
      <Card className="overflow-hidden rounded-3xl border-card-border" role="status" aria-live="polite">
        <div className="h-1 bg-gradient-to-r from-primary via-chart-2 to-chart-3" />
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
          <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
          Preparando rascunho protegido…
        </CardContent>
      </Card>
    );
  }

  if (showResult) {
    const reportItems = def.items.map((item, index) => ({
      question: item.text,
      answer:
        answers[index] != null
          ? formatScaleResponseAnswer(item.options[answers[index]].label)
          : "Não respondida",
    }));

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="space-y-5"
      >
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2 text-muted-foreground"
          onClick={() => navigate("/filtro")}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao Filtro
        </Button>

        <PageHero
          icon={ClipboardCheck}
          eyebrow="escala concluída · registro integral"
          title={`Respostas — ${def.name}`}
          subtitle="Perguntas e respostas por extenso; a interpretação clínica permanece com o profissional."
          gradient="from-emerald-600 via-teal-600 to-cyan-700"
        >
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{answered}/{total} respondidas</Badge>
            <Badge variant="outline">{def.respondent}</Badge>
            <Badge variant="outline">{def.ageLabel}</Badge>
          </div>
        </PageHero>

        <Card className="overflow-hidden rounded-3xl border-card-border bg-card/90 shadow-sm">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-foreground">
                Perguntas e respostas
              </h2>
              <Badge variant="secondary">Registro completo</Badge>
            </div>
            <ol className="grid gap-3 lg:grid-cols-2">
              {def.items.map((item, index) => {
                const answeredItem = answers[index] != null;
                const response = answeredItem
                  ? formatScaleResponseAnswer(
                      item.options[answers[index]].label,
                    )
                  : "Não respondida";
                return (
                  <li
                    key={`${def.id}-${index}`}
                    className="rounded-2xl border border-card-border bg-background/70 p-4 shadow-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.emoji && (
                            <span className="mr-1.5 opacity-70" aria-hidden="true">
                              {item.emoji}
                            </span>
                          )}
                          {item.text}
                        </p>
                        {item.example && (
                          <p className="mt-2 rounded-xl border-l-2 border-primary/25 bg-muted/30 py-1.5 pl-3 pr-2 text-xs italic leading-relaxed text-muted-foreground">
                            {item.example}
                          </p>
                        )}
                        <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                          {response}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName={def.name}
          scaleFullName={def.fullName}
          items={reportItems}
          patientAge={def.ageLabel}
        />

        <SaveToPatient
          scaleName={def.name}
          responses={reportItems}
          patientAge={def.ageLabel}
        />

        <Button
          onClick={handleReset}
          variant="outline"
          className="h-11 w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Nova avaliação
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 px-2 text-muted-foreground"
        onClick={() => navigate("/filtro")}
        aria-label="Voltar ao filtro"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar ao Filtro
      </Button>

      <PageHero
        icon={ClipboardCheck}
        eyebrow="aplicação interativa · rascunho protegido"
        title={def.name}
        subtitle={def.fullName}
        gradient="from-primary via-violet-600 to-chart-2"
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{def.respondent}</Badge>
          <Badge variant="outline">{def.ageLabel}</Badge>
          <Badge variant="outline">{total} itens</Badge>
        </div>
      </PageHero>

      {def.validationNote && (
        <div
          className="rounded-2xl border border-amber-300/60 bg-amber-50/80 p-4 text-xs leading-relaxed text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-100"
          role="note"
        >
          <strong>Nota de validação:</strong> {def.validationNote}
        </div>
      )}

      {draftRestored && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
            Respostas anteriores foram restauradas nesta aba. Em um novo
            paciente, apague o rascunho antes de continuar.
          </p>
          <button
            type="button"
            data-testid="button-clear-draft"
            onClick={handleReset}
            className="min-h-10 shrink-0 rounded-xl border border-amber-400/70 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            Começar do zero
          </button>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-1 space-y-2 rounded-2xl border border-border/70 bg-background/95 p-3.5 shadow-md backdrop-blur">
        <div className="flex items-center justify-between text-xs" aria-live="polite">
          <span className="font-semibold text-foreground">
            {answered} de {total} respondidas
          </span>
          <span className="tabular-nums font-bold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress
          value={progress}
          className="h-2.5"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={`Progresso: ${answered} de ${total}`}
        />
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <p className="font-medium text-muted-foreground">{progressHint}</p>
          {answered > 0 && (
            <span
              className={`flex shrink-0 items-center gap-1 ${
                draftStatus === "error"
                  ? "text-red-700 dark:text-red-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}
              role="status"
              aria-live="polite"
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              {draftStatus === "saving"
                ? "Criptografando…"
                : draftStatus === "error"
                  ? "Falha ao salvar"
                  : "Rascunho protegido"}
            </span>
          )}
        </div>
        {answered > 0 && !allAnswered && (
          <button
            type="button"
            onClick={() => focusItem(firstMissingIndex)}
            data-testid="button-next-missing"
            className="flex min-h-9 w-full items-center justify-center gap-1 rounded-xl border border-amber-400/60 bg-amber-50/70 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-amber-950/20 dark:text-amber-200 dark:hover:bg-amber-900/30 sm:ml-auto sm:w-auto"
          >
            Ir para a próxima pendente
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-chart-2/[0.04] p-4">
        <p className="text-xs leading-relaxed text-foreground">
          <strong>Instruções:</strong> {def.instructions}
        </p>
      </div>

      {submitAttempted && missingCount > 0 && (
        <div
          className="flex items-start gap-2 rounded-2xl border border-amber-400/70 bg-amber-50 p-4 text-sm font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/25 dark:text-amber-100"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Faltam {missingCount} {missingCount === 1 ? "resposta" : "respostas"}.
          A primeira pendência foi destacada.
        </div>
      )}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {def.items.map((item, index) => {
          const isAnswered = answers[index] != null;
          const pending = submitAttempted && !isAnswered;
          return (
            <motion.div key={`${def.id}-${index}`} variants={staggerItem}>
              <Card
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                tabIndex={-1}
                aria-invalid={pending}
                data-testid={`card-question-${index}`}
                className={`group rounded-2xl border-card-border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  pending
                    ? "border-amber-400 bg-amber-50/70 shadow-md dark:bg-amber-950/20"
                    : isAnswered
                      ? "bg-card ring-1 ring-emerald-400/40 shadow-sm"
                      : "bg-card/70 hover:bg-card hover:shadow-md"
                }`}
              >
                <CardContent className="space-y-3 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isAnswered
                          ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm"
                          : pending
                            ? "bg-amber-500 text-white"
                            : "bg-gradient-to-br from-primary/15 to-chart-2/10 text-primary ring-1 ring-primary/15"
                      }`}
                    >
                      {isAnswered ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <p className="text-sm font-medium leading-relaxed text-foreground">
                        {item.emoji && (
                          <span className="mr-1.5 opacity-70" aria-hidden="true">
                            {item.emoji}
                          </span>
                        )}
                        {item.text}
                      </p>
                      {item.example && (
                        <p className="rounded-xl border-l-2 border-primary/25 bg-muted/25 py-1.5 pl-3 pr-2 text-xs italic leading-relaxed text-muted-foreground">
                          {item.example}
                        </p>
                      )}
                    </div>
                  </div>
                  <RadioGroup
                    value={
                      answers[index] != null
                        ? String(answers[index])
                        : undefined
                    }
                    onValueChange={(value) => pick(index, Number(value))}
                    aria-label={item.text}
                    className="grid grid-cols-1 gap-2 sm:pl-11"
                  >
                    {item.options.map((option, optionIndex) => {
                      const selected = answers[index] === optionIndex;
                      const optionId = `scale-${def.id}-${index}-${optionIndex}`;
                      return (
                        <div
                          key={`${option.label}-${optionIndex}`}
                          data-testid={`item-${index}-opt-${optionIndex}`}
                          className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-ring ${
                            selected
                              ? "border-transparent bg-gradient-to-r from-primary to-chart-2 font-semibold text-white shadow-sm"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"
                          }`}
                        >
                          <RadioGroupItem
                            id={optionId}
                            value={String(optionIndex)}
                            className={
                              selected
                                ? "shrink-0 border-white/90 text-white data-[state=checked]:border-white data-[state=checked]:text-white"
                                : "shrink-0"
                            }
                          />
                          <Label
                            htmlFor={optionId}
                            className={`flex min-h-8 min-w-0 flex-1 cursor-pointer items-center leading-relaxed ${
                              selected ? "text-white" : "text-foreground"
                            }`}
                          >
                            {option.label}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Button
        onClick={handleSubmit}
        size="lg"
        className="h-12 w-full gap-2 bg-gradient-to-r from-primary to-chart-2 font-semibold text-white shadow-md transition hover:shadow-lg"
        data-testid="button-submit"
      >
        {allAnswered ? (
          <>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Ver respostas registradas
          </>
        ) : (
          `Revisar pendências (${answered}/${total})`
        )}
      </Button>
    </div>
  );
}
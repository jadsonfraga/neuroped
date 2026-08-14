import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  CheckCircle2,
  Check,
  RotateCcw,
  ArrowLeft,
  Save,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
 * InteractiveScaleRunner — renderiza QUALQUER escala definida em
 * interactiveScales.ts como uma aplicação completa: itens e registro integral
 * das respostas em PDF. Uma só implementação para todas —
 * com um acabamento visual caprichado (progresso animado, opções táteis,
 * resultado comemorativo) para tornar a aplicação agradável de responder.
 */
export function InteractiveScaleRunner({ def }: { def: InteractiveScaleDef }) {
  const [, navigate] = useLocation();
  const [showResult, setShowResult] = useState(false);
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

  // Ao concluir, apaga o rascunho armazenado (mantém o resultado em tela) —
  // impede vazar respostas entre pacientes ao reabrir a mesma escala.
  useEffect(() => {
    if (showResult) void clearPersistedDraft();
  }, [showResult, clearPersistedDraft]);

  const total = def.items.length;
  const answered = Object.keys(answers).length;
  const progress = total ? (answered / total) * 100 : 0;
  const allAnswered = total > 0 && answered === total;
  // Microcopy que acompanha o progresso — deixa a aplicação mais acolhedora.
  const progressHint = useMemo(() => {
    if (answered === 0) return "Toque numa opção para começar";
    if (allAnswered)
      return "Tudo respondido — veja as respostas registradas ✨";
    if (progress >= 66) return "Quase lá! 💪";
    if (progress >= 33) return "Indo muito bem…";
    return "Continue no seu ritmo";
  }, [answered, allAnswered, progress]);

  function pick(itemIndex: number, optionIndex: number) {
    softTick();
    haptic.select();
    setAnswers((prev) => ({ ...prev, [itemIndex]: optionIndex }));
  }

  function handleSubmit() {
    softSuccess();
    haptic.success();
    celebrate();
    setShowResult(true);
  }

  function handleReset() {
    setShowResult(false);
    void clearDraft();
  }

  if (!draftReady) {
    return (
      <Card className="border-card-border" role="status" aria-live="polite">
        <CardContent className="p-6 text-sm text-muted-foreground">
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
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md">
            <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1
              className="text-lg leading-tight text-foreground"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Respostas — {def.name}
            </h1>
            <p className="text-xs italic text-muted-foreground">
              Perguntas e respostas registradas — análise clínica pelo
              profissional
            </p>
          </div>
        </div>

        {/* RESULTADO = perguntas e respostas por extenso. Sem escore, corte ou
            classificação (pedido do autor, 2026). */}
        <Card className="border-card-border">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h3
                className="text-lg text-foreground"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Perguntas e respostas
              </h3>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {answered}/{total}
              </span>
            </div>
            <ol className="space-y-2">
              {def.items.map((item, i) => {
                const answeredItem = answers[i] != null;
                const resp = answeredItem
                  ? formatScaleResponseAnswer(item.options[answers[i]].label)
                  : "Não respondida";
                return (
                  <li
                    key={i}
                    className="rounded-xl border border-card-border bg-card/60 p-3 shadow-xs transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">
                          {item.emoji && (
                            <span
                              className="mr-1 opacity-70"
                              aria-hidden="true"
                            >
                              {item.emoji}
                            </span>
                          )}
                          {item.text}
                        </p>
                        {item.example && (
                          <p className="mt-1.5 rounded-lg border-l-2 border-primary/25 bg-muted/40 py-1 pl-2.5 pr-2 text-xs italic leading-snug text-muted-foreground">
                            {item.example}
                          </p>
                        )}
                        <p
                          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                            answeredItem
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {resp}
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
          className="w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={() => navigate("/filtro")}
          aria-label="Voltar ao filtro"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md">
          <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h1
            className="truncate text-lg leading-tight text-foreground"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {def.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {def.fullName} · {def.respondent} · {def.ageLabel}
          </p>
        </div>
      </motion.div>

      {def.validationNote && (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300"
          role="note"
        >
          ⚠️ {def.validationNote}
        </div>
      )}

      {draftRestored && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/30">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Respostas anteriores foram restauradas com segurança. Novo paciente?
            Comece do zero.
          </p>
          <button
            type="button"
            data-testid="button-clear-draft"
            onClick={() => {
              setShowResult(false);
              void clearDraft();
            }}
            className="shrink-0 rounded-lg border border-amber-400/70 px-2.5 py-1 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            Começar do zero
          </button>
        </div>
      )}

      {/* Barra de progresso pegajosa e viva — gradiente + microcopy encorajador */}
      <div className="sticky top-0 z-20 -mx-1 space-y-2 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur">
        <div
          className="flex items-center justify-between text-xs"
          aria-live="polite"
        >
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
          aria-label={`Progresso: ${answered} de ${total}`}
        />
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <p className="font-medium text-muted-foreground">{progressHint}</p>
          {answered > 0 && (
            <span
              className={`flex items-center gap-1 ${
                draftStatus === "error"
                  ? "text-red-700 dark:text-red-300"
                  : "text-emerald-700 dark:text-emerald-300"
              }`}
              role="status"
              aria-live="polite"
            >
              <Save className="h-3.5 w-3.5" />
              {draftStatus === "saving"
                ? "Criptografando…"
                : draftStatus === "error"
                  ? "Falha ao salvar"
                  : "Rascunho protegido"}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs leading-relaxed text-foreground">
          <strong>Instruções:</strong> {def.instructions}
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {def.items.map((item, i) => {
          const isAnswered = answers[i] != null;
          return (
            <motion.div key={i} variants={staggerItem}>
              <Card
                data-testid={`card-question-${i}`}
                className={`group border-card-border transition-all duration-200 ${isAnswered ? "bg-card ring-1 ring-emerald-400/40" : "bg-card/60 hover:bg-card"}`}
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isAnswered
                          ? "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm"
                          : "bg-gradient-to-br from-primary/15 to-chart-2/10 text-primary ring-1 ring-primary/15"
                      }`}
                    >
                      {isAnswered ? (
                        <Check className="h-4 w-4" strokeWidth={2.5} />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <p className="text-sm leading-relaxed text-foreground">
                        {item.emoji && (
                          <span
                            className="mr-1.5 text-sm opacity-60 align-middle"
                            aria-hidden="true"
                          >
                            {item.emoji}
                          </span>
                        )}
                        {item.text}
                      </p>
                      {item.example && (
                        <p className="border-l-2 border-primary/25 pl-2.5 text-xs italic leading-snug text-muted-foreground">
                          {item.example}
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className="grid grid-cols-1 gap-1.5 pl-10"
                    role="radiogroup"
                    aria-label={item.text}
                  >
                    {item.options.map((opt, oi) => {
                      const selected = answers[i] === oi;
                      return (
                        <button
                          key={oi}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => pick(i, oi)}
                          data-testid={`item-${i}-opt-${oi}`}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 active:scale-[0.99] ${
                            selected
                              ? "border-transparent bg-gradient-to-r from-primary to-chart-2 font-semibold text-white shadow-sm"
                              : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              selected
                                ? "border-white bg-white/25"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {selected && (
                              <Check
                                className="h-3 w-3 text-white"
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <span className="min-w-0">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        size="lg"
        className="h-12 w-full gap-2 bg-gradient-to-r from-primary to-chart-2 font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
        data-testid="button-submit"
      >
        {allAnswered ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Ver respostas
          </>
        ) : (
          `Responda todas (${answered}/${total})`
        )}
      </Button>
    </div>
  );
}

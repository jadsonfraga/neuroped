import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, CheckCircle2, Check, AlertTriangle, Info, RotateCcw, ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClinicalReport } from "@/components/ClinicalReport";
import { softTick, softSuccess } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { celebrate } from "@/lib/confetti";
import { easing, duration, scaleIn, staggerContainer, staggerItem } from "@/lib/motion";
import { type InteractiveScaleDef, maxScoreOf } from "@/data/interactiveScales";

/**
 * InteractiveScaleRunner — renderiza QUALQUER escala definida em
 * interactiveScales.ts como uma aplicação completa: itens, escore, faixa de
 * interpretação e relatório clínico (PDF). Uma só implementação para todas —
 * com um acabamento visual caprichado (progresso animado, opções táteis,
 * resultado comemorativo) para tornar a aplicação agradável de responder.
 */
export function InteractiveScaleRunner({ def }: { def: InteractiveScaleDef }) {
  const [, navigate] = useLocation();
  // answers[i] = índice da opção escolhida no item i
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const total = def.items.length;
  const answered = Object.keys(answers).length;
  const progress = total ? (answered / total) * 100 : 0;
  const allAnswered = answered === total;
  const maxScore = maxScoreOf(def);

  const score = def.items.reduce((acc, item, i) => {
    const opt = answers[i];
    return acc + (opt != null ? item.options[opt].value : 0);
  }, 0);

  const band =
    def.bands.find((b) => score >= b.min && score <= b.max) ?? def.bands[def.bands.length - 1];

  // Microcopy que acompanha o progresso — deixa a aplicação mais acolhedora.
  const progressHint = useMemo(() => {
    if (answered === 0) return "Toque numa opção para começar";
    if (allAnswered) return "Tudo respondido — veja o resultado ✨";
    if (progress >= 66) return "Quase lá! 💪";
    if (progress >= 33) return "Indo muito bem…";
    return "Continue no seu ritmo";
  }, [answered, allAnswered, progress]);

  // Herói do resultado — gradiente conforme a gravidade da faixa.
  const heroGradient: Record<string, string> = {
    ok: "from-emerald-500 via-emerald-600 to-green-700",
    warn: "from-amber-500 via-orange-500 to-yellow-600",
    alert: "from-red-500 via-rose-600 to-red-700",
  };

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
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
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
            <h1 className="text-lg font-bold leading-tight">Respostas — {def.name}</h1>
            <p className="text-xs italic text-muted-foreground">Perguntas e respostas registradas — análise clínica pelo profissional</p>
          </div>
        </div>

        {/* RESULTADO = perguntas e respostas por extenso. Sem escore, corte ou
            classificação (pedido do autor, 2026). */}
        <Card className="border-card-border">
          <CardContent className="space-y-3 p-6">
            <h3 className="text-sm font-semibold text-foreground">Perguntas e respostas ({answered}/{total})</h3>
            <ol className="space-y-2">
              {def.items.map((item, i) => (
                <li key={i} className="border-b border-border/40 pb-2 last:border-0">
                  <p className="text-sm leading-snug text-foreground">
                    <span className="font-mono text-xs text-muted-foreground">{i + 1}.</span>{" "}
                    {item.emoji && <span className="mr-0.5" aria-hidden="true">{item.emoji}</span>}
                    {item.text}
                  </p>
                  {item.example && (
                    <p className="mt-0.5 text-xs italic text-muted-foreground leading-snug">💡 {item.example}</p>
                  )}
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    → {answers[i] != null ? item.options[answers[i]].label : "—"}
                  </p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName={def.name}
          scaleFullName={def.fullName}
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description="Transcrição por extenso das perguntas e das respostas selecionadas. Sem escore, ponto de corte ou classificação automática."
          items={def.items.map((item, i) => ({
            question: item.text,
            answer: answers[i] != null ? item.options[answers[i]].label : "—",
            value: answers[i] != null ? item.options[answers[i]].value : 0,
          }))}
          patientAge={def.ageLabel}
        />

        <Button onClick={handleReset} variant="outline" className="w-full gap-2" data-testid="button-reset">
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
        <Button variant="ghost" size="sm" className="px-2" onClick={() => navigate("/filtro")} aria-label="Voltar ao filtro">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md">
          <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight">{def.name}</h1>
          <p className="text-xs text-muted-foreground">{def.fullName} · {def.respondent} · {def.ageLabel}</p>
        </div>
      </motion.div>

      {def.validationNote && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300" role="note">
          ⚠️ {def.validationNote}
        </div>
      )}

      {/* Barra de progresso pegajosa e viva — gradiente + microcopy encorajador */}
      <div className="sticky top-0 z-20 -mx-1 space-y-2 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-xs" aria-live="polite">
          <span className="font-semibold text-foreground">{answered} de {total} respondidas</span>
          <span className="tabular-nums font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2.5" aria-label={`Progresso: ${answered} de ${total}`} />
        <p className="text-[11px] font-medium text-muted-foreground">{progressHint}</p>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs leading-relaxed text-foreground"><strong>Instruções:</strong> {def.instructions}</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
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
                      {isAnswered ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                    </div>
                    <div className="flex-1 space-y-1.5 pt-0.5">
                      <p className="text-sm leading-relaxed text-foreground">
                        {item.emoji && <span className="mr-1 text-base align-middle" aria-hidden="true">{item.emoji}</span>}
                        {item.text}
                      </p>
                      {item.example && (
                        <div className="flex items-start gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5">
                          <span className="text-sm leading-none mt-0.5" aria-hidden="true">💡</span>
                          <p className="text-xs italic text-muted-foreground leading-snug">{item.example}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 pl-10" role="radiogroup" aria-label={item.text}>
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
                              selected ? "border-white bg-white/25" : "border-muted-foreground/40"
                            }`}
                          >
                            {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
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
          <><CheckCircle2 className="h-4 w-4" /> Ver resultado</>
        ) : (
          `Responda todas (${answered}/${total})`
        )}
      </Button>
    </div>
  );
}

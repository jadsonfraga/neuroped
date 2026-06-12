import { useState } from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle, Info, RotateCcw, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClinicalReport } from "@/components/ClinicalReport";
import { softTick, softSuccess } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { type InteractiveScaleDef, maxScoreOf } from "@/data/interactiveScales";

/**
 * InteractiveScaleRunner — renderiza QUALQUER escala definida em
 * interactiveScales.ts como uma aplicação completa: itens, escore, faixa de
 * interpretação e relatório clínico (PDF). Uma só implementação para todas.
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

  const toneClasses: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    alert: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  function pick(itemIndex: number, optionIndex: number) {
    softTick();
    haptic.select();
    setAnswers((prev) => ({ ...prev, [itemIndex]: optionIndex }));
  }

  function handleSubmit() {
    softSuccess();
    haptic.success();
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — {def.name}</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{score}</div>
              <p className="text-xs text-muted-foreground">de {maxScore} pontos</p>
              <Badge className={`text-sm px-4 py-1.5 ${toneClasses[band.tone]}`}>{band.risk}</Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                {band.tone === "ok" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">{band.description}</p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p><strong>Faixas de interpretação:</strong></p>
                  {def.bands.map((b) => (
                    <p key={b.risk}>{b.min}–{b.max}: {b.risk}</p>
                  ))}
                  <p className="pt-1 italic">Fonte: {def.source}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName={def.name}
          scaleFullName={def.fullName}
          totalScore={score}
          maxScore={maxScore}
          classification={band.risk}
          description={band.description}
          items={def.items.map((item, i) => ({
            question: item.text,
            answer: answers[i] != null ? item.options[answers[i]].label : "—",
            value: answers[i] != null ? item.options[answers[i]].value : 0,
          }))}
          patientAge={def.ageLabel}
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="px-2" onClick={() => navigate("/filtro")} aria-label="Voltar ao filtro">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
          <ClipboardCheck className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">{def.name}</h1>
          <p className="text-xs text-muted-foreground">{def.fullName} · {def.respondent} · {def.ageLabel}</p>
        </div>
      </div>

      {def.validationNote && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-300" role="note">
          ⚠️ {def.validationNote}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground" aria-live="polite">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" aria-label={`Progresso: ${answered} de ${total}`} />
      </div>

      <div className="rounded-xl bg-muted/40 border border-border p-4">
        <p className="text-xs text-foreground leading-relaxed"><strong>Instruções:</strong> {def.instructions}</p>
      </div>

      <div className="space-y-3">
        {def.items.map((item, i) => (
          <Card key={i} data-testid={`card-question-${i}`} className={`border-card-border ${answers[i] != null ? "bg-card" : "bg-card/60"}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 flex-shrink-0 text-xs font-mono">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
              <div className="grid grid-cols-1 gap-1.5" role="radiogroup" aria-label={item.text}>
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
                      className={`text-left rounded-lg border px-3 py-2 text-sm transition ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground font-semibold"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/60"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full h-12 gap-2 bg-gradient-to-r from-primary to-chart-2 text-white font-semibold"
        data-testid="button-submit"
      >
        {allAnswered ? "Ver resultado" : `Responda todas (${answered}/${total})`}
      </Button>
    </div>
  );
}

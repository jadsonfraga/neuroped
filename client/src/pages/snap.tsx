import { useRef, useState } from "react";
import { snapQuestions, snapLabels, classifySnap } from "@/data/scales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Activity, RotateCcw, AlertTriangle, CheckCircle2, Info, Eye, Zap } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function SnapPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = snapQuestions.length;
  const answered = snapQuestions.reduce((count, _, i) => count + (answers[i] !== undefined ? 1 : 0), 0);
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = snapQuestions.findIndex((_, i) => answers[i] === undefined);
  const missingCount = Math.max(total - answered, 0);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/results", data);
      return res.json();
    },
  });

  function calculateScores(): { inattention: number; hyperactivity: number } {
    let inattention = 0;
    let hyperactivity = 0;
    for (let i = 0; i < 9; i++) {
      inattention += answers[i] ?? 0;
    }
    for (let i = 9; i < 18; i++) {
      hyperactivity += answers[i] ?? 0;
    }
    return { inattention, hyperactivity };
  }

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      if (firstMissingIndex >= 0) {
        itemRefs.current[firstMissingIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => itemRefs.current[firstMissingIndex]?.focus({ preventScroll: true }), 250);
      }
      return;
    }
    const { inattention, hyperactivity } = calculateScores();
    const result = classifySnap(inattention, hyperactivity);
    saveMutation.mutate({
      scaleName: "SNAP-IV",
      answers,
      totalScore: inattention + hyperactivity,
      classification: result.combinedResult,
      patientAge: "6-18 anos",
    });
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
    setSubmitAttempted(false);
  }

  if (showResult) {
    const { inattention, hyperactivity } = calculateScores();
    const result = classifySnap(inattention, hyperactivity);
    const inattentionAvg = (inattention / 9).toFixed(2);
    const hyperactivityAvg = (hyperactivity / 9).toFixed(2);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — SNAP-IV</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            {/* Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center space-y-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <Eye className="w-5 h-5 mx-auto text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-muted-foreground">Desatenção</p>
                <p className="text-2xl font-bold text-foreground">{inattentionAvg}</p>
                <Badge className={`text-xs ${
                  parseFloat(inattentionAvg) >= 1.5
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}>
                  {result.inattentionResult}
                </Badge>
              </div>
              <div className="text-center space-y-2 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20">
                <Zap className="w-5 h-5 mx-auto text-orange-600 dark:text-orange-400" />
                <p className="text-xs text-muted-foreground">Hiper/Impulsividade</p>
                <p className="text-2xl font-bold text-foreground">{hyperactivityAvg}</p>
                <Badge className={`text-xs ${
                  parseFloat(hyperactivityAvg) >= 1.5
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}>
                  {result.hyperactivityResult}
                </Badge>
              </div>
            </div>

            {/* Overall */}
            <div className="text-center space-y-2">
              <Badge className={`text-sm px-4 py-1.5 ${
                result.combinedResult === "Sem indicativos de TDAH"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : result.combinedResult === "Apresentação Combinada"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}>
                {result.combinedResult}
              </Badge>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.combinedResult === "Sem indicativos de TDAH" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-teal-800 dark:text-teal-300 space-y-1">
                  <p><strong>Ponto de corte (SNAP-IV):</strong></p>
                  <p>Média ≥ 1.5 por domínio sugere presença de sintomas</p>
                  <p>Desatenção: itens 1-9 / Hiper-Impulsividade: itens 10-18</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="SNAP-IV"
          scaleFullName="Swanson, Nolan and Pelham Questionnaire"
          totalScore={inattention + hyperactivity}
          maxScore={54}
          classification={result.combinedResult}
          description={result.description}
          domainResults={[
            { domain: "Desatenção", score: inattention, classification: result.inattentionResult },
            { domain: "Hiperatividade/Impulsividade", score: hyperactivity, classification: result.hyperactivityResult },
          ]}
          items={snapQuestions.map((q, i) => ({ question: q, answer: snapLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="6-18 anos"
        />
        <SaveToPatient
          scaleName="SNAP-IV"
          totalScore={inattention + hyperactivity}
          classification={result.combinedResult}
          answers={answers}
          domainScores={{ "Desatenção": inattention, "Hiperatividade": hyperactivity }}
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">SNAP-IV</h1>
          <p className="text-xs text-muted-foreground">Escala de TDAH — 6 a 18 anos</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
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
          <strong>Instruções:</strong> Para cada item, selecione a opção que melhor descreve o comportamento da criança/adolescente nos últimos 6 meses, segundo relato de pais ou professores.
        </p>
      </div>

      {/* Section: Desatenção */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 py-2">
          <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Desatenção (itens 1-9)</h2>
        </div>
      </div>

      <div className="space-y-3">
        {snapQuestions.slice(0, 9).map((q, i) => {
          const pending = submitAttempted && answers[i] === undefined;
          return (
          <Card
            key={i}
            ref={(node) => { itemRefs.current[i] = node; }}
            tabIndex={-1}
            aria-invalid={pending}
            data-testid={`card-question-${i}`}
            className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-sm text-foreground leading-relaxed">{q}</p>
              </div>
              {pending && (
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">
                  Resposta obrigatória para concluir a escala.
                </p>
              )}
              <RadioGroup
                value={answers[i]?.toString()}
                onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
                className="flex flex-wrap gap-2"
              >
                {snapLabels.map((label, j) => (
                  <div key={j} className="flex items-center">
                    <RadioGroupItem value={j.toString()} id={`q${i}-o${j}`} className="peer sr-only" />
                    <Label
                      htmlFor={`q${i}-o${j}`}
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

      {/* Section: Hiperatividade/Impulsividade */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 py-2">
          <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <h2 className="text-sm font-semibold text-orange-600 dark:text-orange-400">Hiperatividade/Impulsividade (itens 10-18)</h2>
        </div>
      </div>

      <div className="space-y-3">
        {snapQuestions.slice(9).map((q, idx) => {
          const i = idx + 9;
          const pending = submitAttempted && answers[i] === undefined;
          return (
            <Card
              key={i}
              ref={(node) => { itemRefs.current[i] = node; }}
              tabIndex={-1}
              aria-invalid={pending}
              data-testid={`card-question-${i}`}
              className={`border-card-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${pending ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
                  <p className="text-sm text-foreground leading-relaxed">{q}</p>
                </div>
                {pending && (
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300" role="alert">
                    Resposta obrigatória para concluir a escala.
                  </p>
                )}
                <RadioGroup
                  value={answers[i]?.toString()}
                  onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
                  className="flex flex-wrap gap-2"
                >
                  {snapLabels.map((label, j) => (
                    <div key={j} className="flex items-center">
                      <RadioGroupItem value={j.toString()} id={`q${i}-o${j}`} className="peer sr-only" />
                      <Label
                        htmlFor={`q${i}-o${j}`}
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
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. A primeira pergunta pendente foi destacada.
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
      <ScaleReference scaleId="snap" />
    </div>
  );
}

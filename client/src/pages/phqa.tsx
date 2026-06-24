import { useRef, useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertTriangle, CheckCircle2, Info, HeartPulse } from "lucide-react";
import { phqaQuestions, phqaLabels, classifyPhqa } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function PhqaPage() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const total = phqaQuestions.length;
  const answered = phqaQuestions.reduce((count, _, i) => count + (answers[i] !== undefined ? 1 : 0), 0);
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;
  const firstMissingIndex = phqaQuestions.findIndex((_, i) => answers[i] === undefined);
  const missingCount = Math.max(total - answered, 0);

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      if (firstMissingIndex >= 0) {
        itemRefs.current[firstMissingIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => itemRefs.current[firstMissingIndex]?.focus({ preventScroll: true }), 250);
      }
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
    const sum = Object.values(answers).reduce((a, b) => a + b, 0);
    const result = classifyPhqa(sum);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-sm">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — PHQ-A</h1>
            <p className="text-xs text-muted-foreground">Patient Health Questionnaire — Adolescentes</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{sum}</div>
              <p className="text-xs text-muted-foreground">Pontuação total (0-27)</p>
              <Badge className={`text-sm px-4 py-1.5 ${result.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : result.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : result.color === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                {result.classification}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>
            </div>
            <div className="rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-fuchsia-800 dark:text-fuchsia-300 space-y-1">
                  <p><strong>PHQ-A — Pontos de corte:</strong></p>
                  <p>Mínima: 0-4 / Leve: 5-9 / Moderada: 10-14 / Mod-Grave: 15-19 / Grave: 20-27</p>
                  <p>Item 9 (ideação suicida) requer atenção especial independente do total.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ClinicalReport
          scaleName="PHQ-A"
          scaleFullName="Patient Health Questionnaire for Adolescents"
          totalScore={sum}
          maxScore={phqaQuestions.length * 3}
          classification={result.classification}
          description={result.description}
          items={phqaQuestions.map((q, i) => ({ question: q, answer: phqaLabels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="12-17 anos"
        />
        <SaveToPatient
          scaleName="PHQ-A"
          totalScore={sum}
          classification={result.classification}
          answers={answers}
        />
        <Button onClick={handleReset} variant="outline" className="w-full gap-2"><RotateCcw className="w-4 h-4" /> Nova Avaliação</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-sm">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">PHQ-A</h1>
          <p className="text-xs text-muted-foreground">Questionário de Saúde do Paciente — Adolescentes (11-17 anos)</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total}</span><span>{Math.round(progress)}%</span>
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
          <strong>Instruções:</strong> Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas a seguir?
        </p>
      </div>
      {phqaQuestions.map((q, i) => {
        const pending = submitAttempted && answers[i] === undefined;
        return (
        <Card
          key={i}
          ref={(node) => { itemRefs.current[i] = node; }}
          tabIndex={-1}
          aria-invalid={pending}
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
            <RadioGroup value={answers[i]?.toString()} onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })} className="flex flex-wrap gap-2">
              {phqaLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem value={j.toString()} id={`phqa-q${i}-o${j}`} className="peer sr-only" />
                  <Label htmlFor={`phqa-q${i}-o${j}`} aria-pressed={answers[i] === j} className={`inline-flex min-h-[40px] cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${answers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        );
      })}
      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. A primeira pergunta pendente foi destacada.
        </div>
      )}
      <Button onClick={handleSubmit} aria-disabled={!allAnswered} className="w-full" size="lg">{allAnswered ? "Ver Resultado" : `Responder pendências (${answered}/${total})`}</Button>
      <ScaleReference scaleId="phqa" />
    </div>
  );
}

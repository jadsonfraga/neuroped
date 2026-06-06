import { useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertTriangle, CheckCircle2, Info, CloudRain } from "lucide-react";
import { cdi2Questions, cdi2Labels, classifyCdi2 } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function Cdi2Page() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const total = cdi2Questions.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  if (showResult) {
    const sum = Object.values(answers).reduce((a, b) => a + b, 0);
    const result = classifyCdi2(sum);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <CloudRain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — CDI-2</h1>
            <p className="text-xs text-muted-foreground">Inventário de Depressão Infantil</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{sum}</div>
              <p className="text-xs text-muted-foreground">Pontuação total (0-56)</p>
              <Badge className={`text-sm px-4 py-1.5 bg-${result.color}-100 text-${result.color}-700 dark:bg-${result.color}-900/40 dark:text-${result.color}-300`}>
                {result.classification}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>
            </div>
            <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-sky-800 dark:text-sky-300 space-y-1">
                  <p><strong>CDI-2 — Pontos de corte:</strong></p>
                  <p>Mínima: 0-13 / Leve: 14-19 / Moderada: 20-25 / Grave: ≥26</p>
                  <p>Atenção especial ao item 9 (ideação suicida) independentemente do total.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ClinicalReport
          scaleName="CDI-2"
          scaleFullName="Children's Depression Inventory 2"
          totalScore={sum}
          maxScore={cdi2Questions.length * 2}
          classification={result.classification}
          description={result.description}
          items={cdi2Questions.map((q, i) => ({ question: q, answer: cdi2Labels[answers[i] ?? 0], value: answers[i] ?? 0 }))}
          patientAge="7-17 anos"
        />
        <SaveToPatient
          scaleName="CDI-2"
          totalScore={sum}
          classification={result.classification}
          answers={answers}
        />
        <Button onClick={() => { setAnswers({}); setShowResult(false); }} variant="outline" className="w-full gap-2" data-testid="button-reset">
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
          <CloudRain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CDI-2</h1>
          <p className="text-xs text-muted-foreground">Inventário de Depressão Infantil — 7 a 17 anos</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 p-4">
        <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, escolha a frase que melhor descreve como a criança/adolescente tem se sentido nas últimas duas semanas.
        </p>
      </div>
      {cdi2Questions.map((q, i) => (
        <Card key={i} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{i + 1}</Badge>
              <p className="text-sm text-foreground leading-relaxed">{q}</p>
            </div>
            <RadioGroup
              value={answers[i]?.toString()}
              onValueChange={(val) => setAnswers({ ...answers, [i]: parseInt(val) })}
              className="flex flex-wrap gap-2"
            >
              {cdi2Labels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem value={j.toString()} id={`cdi2-q${i}-o${j}`} className="sr-only" />
                  <Label htmlFor={`cdi2-q${i}-o${j}`} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${answers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      <Button onClick={() => setShowResult(true)} disabled={answered < total} className="w-full" size="lg" data-testid="button-submit">
        {answered >= total ? "Ver Resultado" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="cdi2" />
    </div>
  );
}

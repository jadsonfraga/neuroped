import { useState } from "react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RotateCcw, CloudRain } from "lucide-react";
import { cdi2Questions, cdi2Labels } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { ClinicalReport } from "@/components/ClinicalReport";
import { formatScaleResponseAnswer } from "@/lib/scaleResponseReport";

export default function Cdi2Page() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);

  const total = cdi2Questions.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  if (showResult) {
    const reportItems = cdi2Questions.map((question, index) => ({
      question,
      answer:
        answers[index] !== undefined
          ? formatScaleResponseAnswer(cdi2Labels[answers[index]])
          : "Não respondida",
    }));
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <CloudRain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — CDI-2</h1>
            <p className="text-xs text-muted-foreground">
              Inventário de Depressão Infantil
            </p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            <div className="space-y-3">
              {cdi2Questions.map((q, i) => (
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
                    → {reportItems[i].answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="CDI-2"
          scaleFullName="Children's Depression Inventory 2"
          items={reportItems}
          patientAge="7-17 anos"
        />
        <SaveToPatient
          scaleName="CDI-2"
          responses={reportItems}
          patientAge="7-17 anos"
        />
        <Button
          onClick={() => {
            setAnswers({});
            setShowResult(false);
          }}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
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
          <p className="text-xs text-muted-foreground">
            Inventário de Depressão Infantil — 7 a 17 anos
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} respondidas
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 p-4">
        <p className="text-xs text-sky-800 dark:text-sky-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, escolha a frase que
          melhor descreve como a criança/adolescente tem se sentido nas últimas
          duas semanas.
        </p>
      </div>
      {cdi2Questions.map((q, i) => (
        <Card key={i} className="border-card-border">
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
            <RadioGroup
              value={answers[i]?.toString()}
              onValueChange={(val) =>
                setAnswers({ ...answers, [i]: parseInt(val) })
              }
              className="flex flex-wrap gap-2"
            >
              {cdi2Labels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem
                    value={j.toString()}
                    id={`cdi2-q${i}-o${j}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`cdi2-q${i}-o${j}`}
                    className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${answers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}
      <Button
        onClick={() => setShowResult(true)}
        disabled={answered < total}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {answered >= total
          ? "Ver Resultado"
          : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="cdi2" />
    </div>
  );
}

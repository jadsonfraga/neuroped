import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cssrsQuestions, classifyCssrs } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function CssrsPage() {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const total = cssrsQuestions.length;
  const answered = Object.keys(answers).length;

  if (showResult) {
    const result = classifyCssrs(answers);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — C-SSRS</h1>
            <p className="text-xs text-muted-foreground">Escala Columbia de Gravidade de Ideação Suicida</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">Nível {result.level}</div>
              <p className="text-xs text-muted-foreground">Nível mais alto identificado (0-6)</p>
              <Badge className={`text-sm px-4 py-1.5 ${result.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : result.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : result.color === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                {result.classification}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Respostas por nível</h3>
              {cssrsQuestions.map((q) => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{q.level}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{q.text}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${answers[q.id] ? "text-red-600 border-red-300" : "text-emerald-600 border-emerald-300"}`}>
                    {answers[q.id] ? "Sim" : "Não"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-800 dark:text-red-300 space-y-1">
                  <p><strong>Importante:</strong> A C-SSRS é uma triagem. Qualquer resposta positiva (especialmente questões 3-6) requer avaliação profissional imediata.</p>
                  <p>Se houver risco iminente, encaminhar para emergência psiquiátrica.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ClinicalReport
          scaleName="C-SSRS"
          scaleFullName="Columbia Suicide Severity Rating Scale"
          totalScore={result.level}
          maxScore={6}
          classification={result.classification}
          description={result.description}
          items={cssrsQuestions.map((q, i) => ({ question: q.text, answer: answers[i] ? "Sim" : "Não", value: answers[i] ? 1 : 0 }))}
          patientAge="≥ 6 anos"
        />
        <SaveToPatient
          scaleName="C-SSRS"
          totalScore={result.level}
          classification={result.classification}
          answers={answers}
        />
        <Button onClick={() => { setAnswers({}); setShowResult(false); }} variant="outline" className="w-full gap-2"><RotateCcw className="w-4 h-4" /> Nova Avaliação</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">C-SSRS</h1>
          <p className="text-xs text-muted-foreground">Escala Columbia de Gravidade de Ideação Suicida</p>
        </div>
      </div>
      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
        <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
          <strong>Instruções:</strong> Pergunte ao paciente cada questão. Se a resposta for "Sim", prossiga com as perguntas seguintes. Cada nível escala a gravidade da ideação/comportamento suicida.
        </p>
      </div>
      {cssrsQuestions.map((q) => (
        <Card key={q.id} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{q.id}</Badge>
              <div>
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">{q.level}</p>
                <p className="text-sm text-foreground leading-relaxed">{q.text}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={val.toString()}
                  onClick={() => setAnswers({ ...answers, [q.id]: val })}
                  className={`text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${
                    answers[q.id] === val
                      ? val ? "bg-red-500 text-white border-red-500" : "bg-emerald-500 text-white border-emerald-500"
                      : "bg-card text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={() => setShowResult(true)} disabled={answered < total} className="w-full" size="lg">
        {answered >= total ? "Ver Resultado" : `Responda todas as ${total} perguntas`}
      </Button>
      <ScaleReference scaleId="cssrs" />
    </div>
  );
}

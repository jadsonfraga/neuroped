import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle, CheckCircle2, Info, Wine } from "lucide-react";
import { crafftPartA, crafftPartB, classifyCrafft } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function CrafftPage() {
  const [partAAnswers, setPartAAnswers] = useState<Record<number, boolean>>({});
  const [partBAnswers, setPartBAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const anyPartAYes = Object.values(partAAnswers).some((v) => v === true);
  const partAComplete = Object.keys(partAAnswers).length === crafftPartA.length;
  const partBComplete = Object.keys(partBAnswers).length === crafftPartB.length;
  const allDone = partAComplete && partBComplete;

  if (showResult) {
    const score = Object.values(partBAnswers).filter(Boolean).length;
    const result = classifyCrafft(score);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm">
            <Wine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — CRAFFT</h1>
            <p className="text-xs text-muted-foreground">Screening de Uso de Substâncias</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{score}</div>
              <p className="text-xs text-muted-foreground">Pontuação Parte B (0-6)</p>
              <Badge className={`text-sm px-4 py-1.5 ${result.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : result.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                {result.classification}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />}
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Parte A — Uso nos últimos 12 meses</h3>
              {crafftPartA.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <p className="text-xs text-foreground flex-1 mr-2">{q}</p>
                  <Badge variant="outline" className={`text-xs ${partAAnswers[i] ? "text-red-600 border-red-300" : "text-emerald-600 border-emerald-300"}`}>
                    {partAAnswers[i] ? "Sim" : "Não"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Parte B — CRAFFT</h3>
              {crafftPartB.map((q, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex-1 mr-2">
                    <Badge className="mr-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{q.letter}</Badge>
                    <span className="text-xs text-foreground">{q.keyword}</span>
                  </div>
                  <Badge variant="outline" className={`text-xs ${partBAnswers[i] ? "text-red-600 border-red-300" : "text-emerald-600 border-emerald-300"}`}>
                    {partBAnswers[i] ? "Sim" : "Não"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p><strong>CRAFFT:</strong> Ponto de corte ≥2 indica necessidade de avaliação aprofundada.</p>
                  <p>Aplicável a adolescentes de 12-21 anos. Validado para álcool, maconha e outras substâncias.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ClinicalReport
          scaleName="CRAFFT"
          scaleFullName="Car, Relax, Alone, Forget, Friends, Trouble"
          totalScore={score}
          maxScore={6}
          classification={result.classification}
          description={result.description}
          items={[...crafftPartA.map((q, i) => ({ question: `[Parte A] ${q}`, answer: partAAnswers[i] ? "Sim" : "Não", value: partAAnswers[i] ? 1 : 0 })), ...crafftPartB.map((q, i) => ({ question: `[Parte B] ${q}`, answer: partBAnswers[i] ? "Sim" : "Não", value: partBAnswers[i] ? 1 : 0 }))]}
          patientAge="12-21 anos"
        />
        <SaveToPatient
          scaleName="CRAFFT"
          totalScore={score}
          classification={result.classification}
          answers={partBAnswers}
        />
        <Button onClick={() => { setPartAAnswers({}); setPartBAnswers({}); setShowResult(false); }} variant="outline" className="w-full gap-2"><RotateCcw className="w-4 h-4" /> Nova Avaliação</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-sm">
          <Wine className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">CRAFFT</h1>
          <p className="text-xs text-muted-foreground">Screening de Uso de Substâncias — 12 a 21 anos</p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          <strong>Instruções:</strong> Faça as perguntas da Parte A primeiro. Depois, aplique a Parte B (CRAFFT) independentemente das respostas da Parte A.
        </p>
      </div>

      <h2 className="text-sm font-bold text-foreground">Parte A — Uso nos últimos 12 meses</h2>
      {crafftPartA.map((q, i) => (
        <Card key={i} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{q}</p>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button key={val.toString()} onClick={() => setPartAAnswers({ ...partAAnswers, [i]: val })}
                  className={`text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${partAAnswers[i] === val ? (val ? "bg-red-500 text-white border-red-500" : "bg-emerald-500 text-white border-emerald-500") : "bg-card text-foreground border-border hover:bg-muted"}`}>
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-sm font-bold text-foreground">Parte B — CRAFFT</h2>
      {crafftPartB.map((q, i) => (
        <Card key={i} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs flex-shrink-0">{q.letter}</Badge>
              <p className="text-sm text-foreground leading-relaxed">{q.question}</p>
            </div>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button key={val.toString()} onClick={() => setPartBAnswers({ ...partBAnswers, [i]: val })}
                  className={`text-xs px-4 py-1.5 rounded-full border cursor-pointer transition-colors ${partBAnswers[i] === val ? (val ? "bg-red-500 text-white border-red-500" : "bg-emerald-500 text-white border-emerald-500") : "bg-card text-foreground border-border hover:bg-muted"}`}>
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={() => setShowResult(true)} disabled={!allDone} className="w-full" size="lg">
        {allDone ? "Ver Resultado" : "Responda todas as perguntas"}
      </Button>
      <ScaleReference scaleId="crafft" />
    </div>
  );
}

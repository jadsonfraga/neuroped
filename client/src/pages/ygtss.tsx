import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, AlertTriangle, CheckCircle2, Info, Sparkles } from "lucide-react";
import { ygtssMotorTics, ygtssVocalTics, ygtssFrequencyLabels, classifyYgtss } from "@/data/expandedScales";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function YgtssPage() {
  const [motorAnswers, setMotorAnswers] = useState<Record<number, number>>({});
  const [vocalAnswers, setVocalAnswers] = useState<Record<number, number>>({});
  const [impairment, setImpairment] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);

  const totalQ = ygtssMotorTics.length + ygtssVocalTics.length;
  const answered = Object.keys(motorAnswers).length + Object.keys(vocalAnswers).length;
  const progress = (answered / totalQ) * 100;

  if (showResult) {
    const motorScore = Object.values(motorAnswers).reduce((a, b) => a + b, 0);
    const vocalScore = Object.values(vocalAnswers).reduce((a, b) => a + b, 0);
    const result = classifyYgtss(motorScore, vocalScore, impairment);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — YGTSS</h1>
            <p className="text-xs text-muted-foreground">Yale Global Tic Severity Scale</p>
          </div>
        </div>
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-5">
            <div className="text-center space-y-3">
              <div className="text-4xl font-bold text-foreground">{result.globalScore}</div>
              <p className="text-xs text-muted-foreground">Pontuação Global (Tics + Impacto)</p>
              <Badge className={`text-sm px-4 py-1.5 ${result.color === "emerald" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : result.color === "amber" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : result.color === "orange" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"}`}>
                {result.severity}
              </Badge>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tics Motores</span>
                <span className="text-sm font-bold">{result.motorScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Tics Vocais</span>
                <span className="text-sm font-bold">{result.vocalScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total de Tics</span>
                <span className="text-sm font-bold">{result.totalTic}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Impacto Funcional</span>
                <span className="text-sm font-bold">{result.impairment}</span>
              </div>
            </div>
            <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1">
                  <p><strong>YGTSS:</strong> Pontuação Global = Total de Tics + Impacto Funcional</p>
                  <p>Mínimo: 1-9 / Leve: 10-29 / Moderado: 30-49 / Grave: ≥50</p>
                  <p>Padrão-ouro para avaliação de gravidade de tiques na Síndrome de Tourette.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <ClinicalReport
          scaleName="YGTSS"
          scaleFullName="Yale Global Tic Severity Scale"
          totalScore={result.globalScore}
          maxScore={100}
          classification={result.severity}
          description={result.description}
          domainResults={[
            { domain: "Tics Motores", score: result.motorScore, classification: result.motorScore <= 10 ? "Leve" : result.motorScore <= 20 ? "Moderado" : "Grave" },
            { domain: "Tics Vocais", score: result.vocalScore, classification: result.vocalScore <= 10 ? "Leve" : result.vocalScore <= 20 ? "Moderado" : "Grave" },
            { domain: "Impacto Funcional", score: result.impairment, classification: result.impairment <= 10 ? "Leve" : result.impairment <= 30 ? "Moderado" : "Grave" },
          ]}
          items={[
            ...ygtssMotorTics.map((t, i) => ({ question: `[Motor] ${t}`, answer: ygtssFrequencyLabels[motorAnswers[i] ?? 0], value: motorAnswers[i] ?? 0 })),
            ...ygtssVocalTics.map((t, i) => ({ question: `[Vocal] ${t}`, answer: ygtssFrequencyLabels[vocalAnswers[i] ?? 0], value: vocalAnswers[i] ?? 0 })),
            { question: "Impacto Funcional Global", answer: String(impairment), value: impairment },
          ]}
          patientAge="5-18 anos"
        />
        <SaveToPatient
          scaleName="YGTSS"
          totalScore={result.globalScore}
          classification={result.severity}
          answers={{ ...motorAnswers, ...vocalAnswers }}
          domainScores={{ "Tics Motores": result.motorScore, "Tics Vocais": result.vocalScore, "Impacto Funcional": result.impairment }}
        />
        <Button onClick={() => { setMotorAnswers({}); setVocalAnswers({}); setImpairment(0); setShowResult(false); }} variant="outline" className="w-full gap-2">
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">YGTSS</h1>
          <p className="text-xs text-muted-foreground">Yale Global Tic Severity Scale — Avaliação de Tiques</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {totalQ} tiques avaliados</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/40 p-4">
        <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
          <strong>Instruções:</strong> Avalie a frequência de cada tique na última semana. Para cada tique presente, pontue a frequência de 0 (ausente) a 4 (constante).
        </p>
      </div>

      <h2 className="text-sm font-bold text-orange-600 dark:text-orange-400">Tiques Motores</h2>
      {ygtssMotorTics.map((tic, i) => (
        <Card key={`m-${i}`} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">M{i + 1}</Badge>
              <p className="text-sm text-foreground leading-relaxed">{tic}</p>
            </div>
            <RadioGroup value={motorAnswers[i]?.toString()} onValueChange={(val) => setMotorAnswers({ ...motorAnswers, [i]: parseInt(val) })} className="flex flex-wrap gap-2">
              {ygtssFrequencyLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem value={j.toString()} id={`motor-${i}-${j}`} className="sr-only" />
                  <Label htmlFor={`motor-${i}-${j}`} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${motorAnswers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-sm font-bold text-purple-600 dark:text-purple-400">Tiques Vocais</h2>
      {ygtssVocalTics.map((tic, i) => (
        <Card key={`v-${i}`} className="border-card-border">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">V{i + 1}</Badge>
              <p className="text-sm text-foreground leading-relaxed">{tic}</p>
            </div>
            <RadioGroup value={vocalAnswers[i]?.toString()} onValueChange={(val) => setVocalAnswers({ ...vocalAnswers, [i]: parseInt(val) })} className="flex flex-wrap gap-2">
              {ygtssFrequencyLabels.map((label, j) => (
                <div key={j} className="flex items-center">
                  <RadioGroupItem value={j.toString()} id={`vocal-${i}-${j}`} className="sr-only" />
                  <Label htmlFor={`vocal-${i}-${j}`} className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${vocalAnswers[i] === j ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"}`}>{label}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-sm font-bold text-foreground">Impacto Funcional (0-50)</h2>
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">Quanto os tiques interferem na vida diária, escola, socialização e autoestima?</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">0</span>
            <Slider value={[impairment]} onValueChange={([v]) => setImpairment(v)} max={50} step={10} className="flex-1" />
            <span className="text-sm font-bold w-8 text-right">{impairment}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nenhum</span><span>Leve</span><span>Moderado</span><span>Grave</span><span>Extremo</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => setShowResult(true)} disabled={answered < totalQ} className="w-full" size="lg">
        {answered >= totalQ ? "Ver Resultado" : `Avalie todos os ${totalQ} tiques`}
      </Button>
      <ScaleReference scaleId="ygtss" />
    </div>
  );
}

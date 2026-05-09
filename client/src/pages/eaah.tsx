import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertTriangle, CheckCircle2, Flame, Info } from "lucide-react";
import { eaahDomains, eaahLabels, eaahProtectiveLabels, classifyEaah } from "@/data/bateriaJadsonPsiq";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function EaahPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const PROTECTIVE_DOMAIN_IDX = 2; // Domain C (index 2)
  const allItems = eaahDomains.flatMap((d, di) =>
    d.items.map((item, ii) => ({ key: `${di}-${ii}`, text: item, domainIdx: di }))
  );
  const total = allItems.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  function handleSubmit() { setShowResult(true); }
  function handleReset() { setAnswers({}); setShowResult(false); }

  if (showResult) {
    let riskScore = 0;
    let protectionScore = 0;
    eaahDomains.forEach((domain, di) => {
      domain.items.forEach((_, ii) => {
        const val = answers[`${di}-${ii}`] || 0;
        if (di === PROTECTIVE_DOMAIN_IDX) protectionScore += val;
        else riskScore += val;
      });
    });
    const result = classifyEaah(riskScore, protectionScore);
    const finalScore = riskScore - protectionScore;

    const domainResults = eaahDomains.map((domain, di) => {
      const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
      const maxD = domain.items.length * 3;
      const ratio = score / maxD;
      const isProtective = di === PROTECTIVE_DOMAIN_IDX;
      return {
        domain: domain.name,
        score,
        classification: isProtective
          ? (ratio >= 0.75 ? "Bom" : ratio >= 0.5 ? "Parcial" : "Frágil")
          : (ratio <= 0.25 ? "Baixo" : ratio <= 0.5 ? "Leve" : ratio <= 0.75 ? "Moderado" : "Alto"),
        color: isProtective
          ? (ratio >= 0.75 ? "emerald" : ratio >= 0.5 ? "amber" : "red")
          : (ratio <= 0.25 ? "emerald" : ratio <= 0.5 ? "amber" : ratio <= 0.75 ? "orange" : "red"),
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — EAAH-J26</h1>
            <p className="text-xs text-muted-foreground">Avaliação concluída</p>
          </div>
        </div>

        <Card className="border-card-border overflow-hidden">
          <div className={`p-6 text-center space-y-3 ${
            result.color === "emerald" ? "bg-gradient-to-br from-emerald-500 to-green-600" :
            result.color === "amber" ? "bg-gradient-to-br from-amber-500 to-yellow-600" :
            result.color === "orange" ? "bg-gradient-to-br from-orange-500 to-red-500" :
            "bg-gradient-to-br from-red-500 to-rose-600"
          }`}>
            <div className="text-5xl font-bold text-white">{finalScore}</div>
            <p className="text-sm text-white/80">Escore Final (Risco {riskScore} − Proteção {protectionScore})</p>
            <Badge className="text-sm px-4 py-1.5 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {result.classification}
            </Badge>
          </div>
          <CardContent className="p-6 space-y-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">{result.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Domínios</h3>
              {domainResults.map((dr) => (
                <div key={dr.domain} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{dr.domain}</p>
                    <p className="text-xs text-muted-foreground">Pontuação: {dr.score}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    dr.color === "emerald" ? "text-emerald-600 border-emerald-300" :
                    dr.color === "amber" ? "text-amber-600 border-amber-300" :
                    dr.color === "orange" ? "text-orange-600 border-orange-300" :
                    "text-red-600 border-red-300"
                  }`}>
                    {dr.classification}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  EAAH-J26: 20 itens (17 risco + 3 proteção). Escore = Risco − Proteção. Domínio C (fatores protetores) usa escala invertida. Instrumento autoral — Dr. Jadson Fraga, 2026.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="EAAH-J26"
          scaleFullName="Escala de Autoagressividade e Heteroagressividade"
          totalScore={finalScore}
          classification={result.classification}
          description={result.description}
          domainResults={domainResults.map(dr => ({ domain: dr.domain, score: dr.score, classification: dr.classification }))}
          items={allItems.map(item => ({ question: item.text, answer: String(answers[item.key] ?? 0), value: answers[item.key] ?? 0 }))}
          patientAge="4-17 anos"
        />
        <SaveToPatient
          scaleName="EAAH-J26"
          totalScore={finalScore}
          classification={result.classification}
          answers={answers}
          domainScores={{ riskScore, protectionScore }}
        />
        <Button onClick={handleReset} variant="outline" className="w-full gap-2" data-testid="button-reset">
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
          <Flame className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">EAAH-J26</h1>
          <p className="text-xs text-muted-foreground">Escala de Autoagressividade e Heteroagressividade</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, indique a frequência. O Domínio C (Fatores Protetores) usa escala invertida — pontuações mais altas indicam melhor proteção.
        </p>
      </div>

      {eaahDomains.map((domain, di) => {
        const isProtective = di === PROTECTIVE_DOMAIN_IDX;
        const labels = isProtective ? eaahProtectiveLabels : eaahLabels;
        return (
          <div key={di} className="space-y-3">
            <div className="flex items-center gap-2 py-2">
              <div className={`w-3 h-3 rounded-full ${isProtective ? "bg-emerald-500" : domain.color.includes("red") ? "bg-red-500" : "bg-orange-500"}`} />
              <h2 className={`text-sm font-semibold ${domain.color}`}>{domain.name}</h2>
              {isProtective && (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Invertido</Badge>
              )}
            </div>

            {domain.items.map((item, ii) => {
              const key = `${di}-${ii}`;
              return (
                <Card key={key} className="border-card-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">
                        {eaahDomains.slice(0, di).reduce((s, d) => s + d.items.length, 0) + ii + 1}
                      </Badge>
                      <p className="text-sm text-foreground leading-relaxed">{item}</p>
                    </div>
                    <RadioGroup
                      value={answers[key]?.toString()}
                      onValueChange={(val) => setAnswers({ ...answers, [key]: parseInt(val) })}
                      className="flex flex-wrap gap-2"
                    >
                      {labels.map((label, j) => {
                        const maxIdx = labels.length - 1;
                        const ratio = maxIdx > 0 ? j / maxIdx : 0;
                        const selectedColor = isProtective
                          ? (ratio === 0 ? "bg-red-500 text-white border-red-500"
                            : ratio <= 0.33 ? "bg-amber-500 text-white border-amber-500"
                            : ratio <= 0.66 ? "bg-lime-500 text-white border-lime-500"
                            : "bg-emerald-500 text-white border-emerald-500")
                          : (ratio === 0 ? "bg-emerald-500 text-white border-emerald-500"
                            : ratio <= 0.33 ? "bg-lime-500 text-white border-lime-500"
                            : ratio <= 0.66 ? "bg-amber-500 text-white border-amber-500"
                            : "bg-red-500 text-white border-red-500");
                        return (
                          <div key={j} className="flex items-center">
                            <RadioGroupItem value={j.toString()} id={`q-${key}-o${j}`} className="sr-only" />
                            <Label
                              htmlFor={`q-${key}-o${j}`}
                              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200 ${
                                answers[key] === j
                                  ? selectedColor
                                  : "bg-card text-foreground border-border hover:bg-muted"
                              }`}
                            >
                              {label}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );
      })}

      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {allAnswered ? "Ver Resultado" : `Responda todas as ${total} perguntas`}
      </Button>
    </div>
  );
}

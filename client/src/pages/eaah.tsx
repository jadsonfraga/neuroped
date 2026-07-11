import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RotateCcw, AlertTriangle, Flame } from "lucide-react";
import { eaahDomains, eaahLabels, eaahProtectiveLabels } from "@/data/bateriaJadsonPsiq";
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
    const finalScore = riskScore - protectionScore;

    const labelFor = (item: { key: string; domainIdx: number }) => {
      const val = answers[item.key];
      if (val === undefined) return "—";
      const labels = item.domainIdx === PROTECTIVE_DOMAIN_IDX ? eaahProtectiveLabels : eaahLabels;
      return labels[val] ?? "—";
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-sm">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — EAAH-NEXUS</h1>
            <p className="text-xs text-muted-foreground">Registro de respostas</p>
          </div>
        </div>

        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Perguntas e respostas</h2>
            {eaahDomains.map((domain, di) => (
              <div key={di} className="space-y-2">
                <h3 className={`text-sm font-semibold ${domain.color}`}>{domain.name}</h3>
                {domain.items.map((item, ii) => {
                  const key = `${di}-${ii}`;
                  const number = eaahDomains.slice(0, di).reduce((s, d) => s + d.items.length, 0) + ii + 1;
                  return (
                    <div key={key} className="rounded-lg bg-muted/30 p-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs font-mono flex-shrink-0 mt-0.5">{number}</Badge>
                        <p className="text-sm text-foreground leading-relaxed">{item}</p>
                      </div>
                      <p className="text-sm font-medium text-primary pl-8">→ {labelFor({ key, domainIdx: di })}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
              Instrumento de triagem. Em caso de risco de autoagressão ou heteroagressão, aciones avaliação de segurança imediata (SAMU 192 / CVV 188).
            </p>
          </div>
        </div>

        <ClinicalReport
          scaleName="EAAH-NEXUS"
          scaleFullName="Escala de Autoagressividade e Heteroagressividade"
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description="Transcrição das perguntas e respostas selecionadas."
          items={allItems.map(item => ({ question: item.text, answer: labelFor(item), value: answers[item.key] ?? 0 }))}
          patientAge="4-17 anos"
        />
        <SaveToPatient
          scaleName="EAAH-NEXUS"
          totalScore={finalScore}
          classification="Registro de respostas"
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
          <h1 className="text-lg font-bold">EAAH-NEXUS</h1>
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

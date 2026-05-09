import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  RotateCcw, AlertTriangle, ShieldAlert, Info, Phone, CheckCircle2,
} from "lucide-react";
import {
  ecarsiDomains, ecarsiLabels, ecarsiProtectiveLabels, classifyEcarsi,
} from "@/data/bateriaJadsonPsiq";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function EcarSiPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const PROTECTIVE_DOMAIN_IDX = 8; // Block I (index 8)
  const allItems = ecarsiDomains.flatMap((d, di) =>
    d.items.map((item, ii) => ({ key: `${di}-${ii}`, text: item, domainIdx: di, domainName: d.name, color: d.color }))
  );
  const total = allItems.length;
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  function handleSubmit() {
    setShowResult(true);
  }

  function handleReset() {
    setAnswers({});
    setShowResult(false);
  }

  if (showResult) {
    let riskScore = 0;
    let protectionScore = 0;
    ecarsiDomains.forEach((domain, di) => {
      domain.items.forEach((_, ii) => {
        const val = answers[`${di}-${ii}`] || 0;
        if (di === PROTECTIVE_DOMAIN_IDX) {
          protectionScore += val;
        } else {
          riskScore += val;
        }
      });
    });
    const finalScore = riskScore - protectionScore;
    const result = classifyEcarsi(riskScore, protectionScore);

    // Domain results for blocks A-H
    const riskDomainResults = ecarsiDomains.slice(0, 8).map((domain, di) => {
      const score = domain.items.reduce((sum, _, ii) => sum + (answers[`${di}-${ii}`] || 0), 0);
      const maxD = domain.items.length * 3;
      const ratio = score / maxD;
      return {
        domain: domain.name,
        score,
        classification: ratio <= 0.25 ? "Baixo" : ratio <= 0.5 ? "Leve" : ratio <= 0.75 ? "Moderado" : "Alto",
        color: ratio <= 0.25 ? "emerald" : ratio <= 0.5 ? "amber" : ratio <= 0.75 ? "orange" : "red",
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — ECAR-SI J26</h1>
            <p className="text-xs text-muted-foreground">Avaliação de risco concluída</p>
          </div>
        </div>

        {/* Score summary */}
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

            {/* Domain breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Blocos de Risco (A–H)</h3>
              {riskDomainResults.map((dr) => (
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
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">I. Fatores protetores</p>
                  <p className="text-xs text-muted-foreground">Pontuação: {protectionScore} / 12</p>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  protectionScore >= 9 ? "text-emerald-600 border-emerald-300" :
                  protectionScore >= 5 ? "text-amber-600 border-amber-300" :
                  "text-red-600 border-red-300"
                }`}>
                  {protectionScore >= 9 ? "Bom" : protectionScore >= 5 ? "Parcial" : "Frágil"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alarm rules */}
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-sm font-bold text-red-700 dark:text-red-300">REGRAS DE ALARME CLÍNICO</h2>
            </div>
            <ul className="text-xs text-red-800 dark:text-red-300 leading-relaxed space-y-2 list-disc pl-4">
              <li><strong>Qualquer item ≥ 2 nos Blocos D, E ou F</strong> — ativar protocolo de segurança imediato, independentemente do escore final.</li>
              <li><strong>Bloco G com item ≥ 2</strong> — histórico de autoagressão grave ou tentativa prévia exige reavaliação de risco e plano de segurança atualizado.</li>
              <li><strong>Bloco I com escore total ≤ 4</strong> — fatores protetores frágeis ou ausentes amplificam qualquer nível de risco. Considerar supervisão intensificada.</li>
              <li><strong>Escore final ≥ 37</strong> — risco alto. Avaliação presencial imediata, considerar encaminhamento emergencial.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Conduct guidelines */}
        <Card className="border-card-border">
          <CardContent className="p-5 space-y-4">
            <h2 className="text-sm font-bold text-foreground">CONDUTA VINCULADA AO RESULTADO</h2>

            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Risco Baixo (0–12)</p>
                <p className="text-xs text-muted-foreground mt-1">Acompanhamento clínico de rotina. Orientação familiar sobre sinais de alerta. Reavaliação em consultas programadas.</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Risco Leve a Moderado (13–24)</p>
                <p className="text-xs text-muted-foreground mt-1">Consultas mais frequentes. Psicoeducação familiar. Plano de segurança básico. Verificar acesso a meios. Contrato terapêutico.</p>
              </div>
              <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">Risco Moderado a Importante (25–36)</p>
                <p className="text-xs text-muted-foreground mt-1">Plano de segurança ativo e documentado. Supervisão intensificada. Avaliação psiquiátrica urgente. Comunicação com família e escola. Restringir acesso a meios.</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">Risco Alto (37–48) e Muito Alto (49+)</p>
                <p className="text-xs text-muted-foreground mt-1">Avaliação psiquiátrica imediata. Supervisão contínua 24h. Considerar internação ou observação em ambiente protegido. Acionar rede de suporte de emergência.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency contacts */}
        <Card className="border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-sm font-bold text-red-700 dark:text-red-300">CONTATOS DE EMERGÊNCIA</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">192</p>
                <p className="text-xs text-muted-foreground">SAMU — Serviço Móvel de Urgência</p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">188</p>
                <p className="text-xs text-muted-foreground">CVV — Centro de Valorização da Vida</p>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <ClinicalReport
          scaleName="ECAR-SI J26"
          scaleFullName="Escala de Avaliação de Risco de Autoagressão e Suicidalidade Infantil"
          totalScore={finalScore}
          classification={result.classification}
          description={result.description}
          domainResults={riskDomainResults.map(dr => ({ domain: dr.domain, score: dr.score, classification: dr.classification }))}
          items={allItems.map(item => ({ question: item.text, answer: String(answers[item.key] ?? 0), value: answers[item.key] ?? 0 }))}
          patientAge="6-17 anos"
        />
        <SaveToPatient
          scaleName="ECAR-SI J26"
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

  // ── Questionnaire form ──
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-sm">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">ECAR-SI J26</h1>
          <p className="text-xs text-muted-foreground">Escala Clínica de Risco de Autoagressão e Suicidalidade</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} de {total} respondidas</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
        <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, indique o nível que melhor descreve a situação atual do paciente. O Bloco I (Fatores Protetores) utiliza escala invertida: pontuações mais altas indicam maior proteção.
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Atenção:</strong> Esta escala é um instrumento de triagem clínica. Qualquer pontuação elevada nos blocos D, E ou F deve acionar avaliação de segurança imediata, independentemente do escore total.
          </p>
        </div>
      </div>

      {ecarsiDomains.map((domain, di) => {
        const isProtective = di === PROTECTIVE_DOMAIN_IDX;
        const labels = isProtective ? ecarsiProtectiveLabels : ecarsiLabels;
        return (
          <div key={di} className="space-y-3">
            <div className="flex items-center gap-2 py-2">
              <div className={`w-3 h-3 rounded-full ${isProtective ? "bg-emerald-500" : "bg-red-500"}`} />
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
                        {ecarsiDomains.slice(0, di).reduce((s, d) => s + d.items.length, 0) + ii + 1}
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

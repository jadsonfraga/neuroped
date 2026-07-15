import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  RotateCcw,
  AlertTriangle,
  ShieldAlert,
  Info,
  Phone,
} from "lucide-react";
import {
  ecarsiDomains,
  ecarsiLabels,
  ecarsiProtectiveLabels,
} from "@/data/bateriaJadsonPsiq";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";

export default function EcarSiPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);

  const PROTECTIVE_DOMAIN_IDX = 8; // Block I (index 8)
  const allItems = ecarsiDomains.flatMap((d, di) =>
    d.items.map((item, ii) => ({
      key: `${di}-${ii}`,
      text: item,
      domainIdx: di,
      domainName: d.name,
      color: d.color,
    })),
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
    const labelFor = (di: number, key: string) => {
      const val = answers[key];
      if (val === undefined) return "Não respondida";
      const labels =
        di === PROTECTIVE_DOMAIN_IDX ? ecarsiProtectiveLabels : ecarsiLabels;
      return labels[val] ?? "Não respondida";
    };
    const reportItems = allItems.map((item) => ({
      question: item.text,
      answer: labelFor(item.domainIdx, item.key),
    }));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Resultado — ECAR-SI NEXUS</h1>
            <p className="text-xs text-muted-foreground">
              Registro de respostas
            </p>
          </div>
        </div>

        {/* Perguntas e respostas */}
        <Card className="border-card-border">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Perguntas e respostas
            </h2>
            {ecarsiDomains.map((domain, di) => (
              <div key={di} className="space-y-2">
                <h3 className={`text-sm font-semibold ${domain.color}`}>
                  {domain.name}
                </h3>
                {domain.items.map((item, ii) => {
                  const key = `${di}-${ii}`;
                  const number =
                    ecarsiDomains
                      .slice(0, di)
                      .reduce((s, d) => s + d.items.length, 0) +
                    ii +
                    1;
                  return (
                    <div
                      key={key}
                      className="rounded-lg bg-muted/30 p-3 space-y-1"
                    >
                      <div className="flex items-start gap-2">
                        <Badge
                          variant="outline"
                          className="text-xs font-mono flex-shrink-0 mt-0.5"
                        >
                          {number}
                        </Badge>
                        <p className="text-sm text-foreground leading-relaxed">
                          {item}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-primary pl-8">
                        → {labelFor(di, key)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety warning */}
        <Card className="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-sm font-bold text-red-700 dark:text-red-300">
                ATENÇÃO CLÍNICA
              </h2>
            </div>
            <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
              Instrumento de triagem de risco de autoagressão e suicidalidade.
              Diante de qualquer indicador de risco, aciones avaliação de
              segurança imediata. A análise clínica das respostas é
              responsabilidade do profissional.
            </p>
          </CardContent>
        </Card>

        {/* Emergency contacts */}
        <Card className="border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-sm font-bold text-red-700 dark:text-red-300">
                CONTATOS DE EMERGÊNCIA
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  192
                </p>
                <p className="text-xs text-muted-foreground">
                  SAMU — Serviço Móvel de Urgência
                </p>
              </div>
              <div className="rounded-lg bg-white/60 dark:bg-white/5 p-3 text-center">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  188
                </p>
                <p className="text-xs text-muted-foreground">
                  CVV — Centro de Valorização da Vida
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName="ECAR-SI NEXUS"
          scaleFullName="Escala de Avaliação de Risco de Autoagressão e Suicidalidade Infantil"
          items={reportItems}
          patientAge="6-17 anos"
        />
        <SaveToPatient
          scaleName="ECAR-SI NEXUS"
          responses={reportItems}
          patientAge="6-17 anos"
        />
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
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
          <h1 className="text-lg font-bold">ECAR-SI NEXUS</h1>
          <p className="text-xs text-muted-foreground">
            Escala Clínica de Risco de Autoagressão e Suicidalidade
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

      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4">
        <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
          <strong>Instruções:</strong> Para cada item, indique o nível que
          melhor descreve a situação atual do paciente. O Bloco I (Fatores
          Protetores) utiliza escala invertida: pontuações mais altas indicam
          maior proteção.
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Atenção:</strong> Esta escala é um instrumento de triagem
            clínica. Qualquer pontuação elevada nos blocos D, E ou F deve
            acionar avaliação de segurança imediata, independentemente do escore
            total.
          </p>
        </div>
      </div>

      {ecarsiDomains.map((domain, di) => {
        const isProtective = di === PROTECTIVE_DOMAIN_IDX;
        const labels = isProtective ? ecarsiProtectiveLabels : ecarsiLabels;
        return (
          <div key={di} className="space-y-3">
            <div className="flex items-center gap-2 py-2">
              <div
                className={`w-3 h-3 rounded-full ${isProtective ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <h2 className={`text-sm font-semibold ${domain.color}`}>
                {domain.name}
              </h2>
              {isProtective && (
                <Badge
                  variant="outline"
                  className="text-xs text-emerald-600 border-emerald-300"
                >
                  Invertido
                </Badge>
              )}
            </div>

            {domain.items.map((item, ii) => {
              const key = `${di}-${ii}`;
              return (
                <Card key={key} className="border-card-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs font-mono flex-shrink-0 mt-0.5"
                      >
                        {ecarsiDomains
                          .slice(0, di)
                          .reduce((s, d) => s + d.items.length, 0) +
                          ii +
                          1}
                      </Badge>
                      <p className="text-sm text-foreground leading-relaxed">
                        {item}
                      </p>
                    </div>
                    <RadioGroup
                      value={answers[key]?.toString()}
                      onValueChange={(val) =>
                        setAnswers({ ...answers, [key]: parseInt(val) })
                      }
                      className="flex flex-wrap gap-2"
                    >
                      {labels.map((label, j) => {
                        const maxIdx = labels.length - 1;
                        const ratio = maxIdx > 0 ? j / maxIdx : 0;
                        const selectedColor = isProtective
                          ? ratio === 0
                            ? "bg-red-500 text-white border-red-500"
                            : ratio <= 0.33
                              ? "bg-amber-500 text-white border-amber-500"
                              : ratio <= 0.66
                                ? "bg-lime-500 text-white border-lime-500"
                                : "bg-emerald-500 text-white border-emerald-500"
                          : ratio === 0
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : ratio <= 0.33
                              ? "bg-lime-500 text-white border-lime-500"
                              : ratio <= 0.66
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-red-500 text-white border-red-500";
                        return (
                          <div key={j} className="flex items-center">
                            <RadioGroupItem
                              value={j.toString()}
                              id={`q-${key}-o${j}`}
                              className="sr-only"
                            />
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

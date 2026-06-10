import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Save,
  type LucideIcon,
} from "lucide-react";
import { ScaleReference } from "@/components/ScaleReference";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import { Mascote } from "@/components/Mascote";
import { celebrate } from "@/lib/confetti";
import { softTick, softSuccess, softTap } from "@/lib/softSounds";
import { haptic } from "@/lib/haptic";
import { easing, duration } from "@/lib/motion";

interface DomainConfig {
  name: string;
  color: string;
  items: string[];
}

interface ResultDomain {
  domain: string;
  score: number;
  classification: string;
  color: string;
}

interface ScaleConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  instruction: string;
  labels: string[];
  domains: DomainConfig[];
  infoBox?: string;
  scaleId?: string;
  onCalculate: (answers: Record<string, number>) => {
    total?: number;
    totalLabel?: string;
    classification?: string;
    description: string;
    color: string;
    domainResults?: ResultDomain[];
  };
}

export function GenericScale({ config }: { config: ScaleConfig }) {
  const draftKey = `neuroped:scale-draft:${config.title.replace(/\s+/g, "-").toLowerCase()}`;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allItems = useMemo(
    () =>
      config.domains.flatMap((d, di) =>
        d.items.map((item, ii) => ({
          key: `${di}-${ii}`,
          text: item,
          domain: d.name,
          domainIdx: di,
          color: d.color,
        })),
      ),
    [config.domains],
  );
  const total = allItems.length;
  const answered = Object.keys(answers).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;
  const allAnswered = total > 0 && answered === total;
  const missingCount = Math.max(total - answered, 0);
  const firstMissing = allItems.find((item) => answers[item.key] === undefined);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        answers?: Record<string, number>;
        showResult?: boolean;
      };
      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
      }
      if (
        parsed.showResult &&
        parsed.answers &&
        Object.keys(parsed.answers).length === total
      ) {
        setShowResult(true);
      }
    } catch {
      // Rascunho inválido não deve interromper a escala.
    }
  }, [draftKey, total]);

  useEffect(() => {
    try {
      if (answered === 0 && !showResult) {
        window.localStorage.removeItem(draftKey);
        return;
      }
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          answers,
          showResult,
          updatedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // Persistência local é apoio; a aplicação da escala continua funcional sem ela.
    }
  }, [answers, answered, draftKey, showResult]);

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!allAnswered) {
      softTap();
      haptic.notify();
      if (firstMissing) {
        itemRefs.current[firstMissing.key]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }
    softSuccess();
    haptic.success();
    celebrate();
    setShowResult(true);
  }

  function handleReset() {
    softTap();
    haptic.tap();
    setAnswers({});
    setShowResult(false);
    setSubmitAttempted(false);
    try {
      window.localStorage.removeItem(draftKey);
    } catch {
      /* storage indisponível — ignora limpeza local */
    }
  }

  if (showResult) {
    const result = config.onCalculate(answers);
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: duration.normal, ease: easing.spring }}
            className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}
          >
            <config.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
          </motion.div>
          <div>
            <h1
              className="text-xl text-foreground leading-tight"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              Resultado — {config.title}
            </h1>
            <p className="text-xs text-muted-foreground italic">
              Avaliação concluída
            </p>
          </div>
        </div>

        <Mascote
          contexto="resultado"
          size="sm"
          fala="Avaliação concluída! Use este resultado como apoio à conversa clínica — ele não substitui o julgamento profissional."
        />

        <Card className="border-card-border overflow-hidden">
          {result.total !== undefined && (
            <div
              className={`p-6 text-center space-y-3 ${
                result.color === "emerald"
                  ? "bg-gradient-to-br from-emerald-500 to-green-600"
                  : result.color === "amber"
                    ? "bg-gradient-to-br from-amber-500 to-yellow-600"
                    : result.color === "orange"
                      ? "bg-gradient-to-br from-orange-500 to-red-500"
                      : "bg-gradient-to-br from-red-500 to-rose-600"
              }`}
            >
              <div className="text-5xl font-bold text-white">
                {result.total}
              </div>
              {result.totalLabel && (
                <p className="text-sm text-white/80">{result.totalLabel}</p>
              )}
              {result.classification && (
                <Badge className="text-sm px-4 py-1.5 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {result.classification}
                </Badge>
              )}
            </div>
          )}
          <CardContent className="p-6 space-y-5">
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                {result.color === "emerald" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {result.description}
                </p>
              </div>
            </div>

            {result.domainResults && result.domainResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Domínios
                </h3>
                {result.domainResults.map((dr) => (
                  <div
                    key={dr.domain}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {dr.domain}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pontuação: {dr.score}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        dr.color === "emerald"
                          ? "text-emerald-600 border-emerald-300"
                          : dr.color === "amber"
                            ? "text-amber-600 border-amber-300"
                            : dr.color === "orange"
                              ? "text-orange-600 border-orange-300"
                              : "text-red-600 border-red-300"
                      }`}
                    >
                      {dr.classification}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {config.infoBox && (
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    {config.infoBox}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ClinicalReport
          scaleName={config.title}
          scaleFullName={config.subtitle}
          totalScore={result.total ?? 0}
          classification={result.classification ?? result.description}
          description={result.description}
          domainResults={result.domainResults?.map((dr) => ({
            domain: dr.domain,
            score: dr.score,
            classification: dr.classification,
          }))}
          items={allItems.map((item) => ({
            question: item.text,
            answer: config.labels[answers[item.key] ?? 0] ?? "—",
            value: answers[item.key] ?? 0,
          }))}
        />

        <WhatsAppShare
          scaleName={config.title}
          reportText={`Escala: ${config.title}\n\nPontuação Total: ${result.total ?? "—"}\nClassificação: ${result.classification ?? result.description}\n\nDescrição: ${result.description}`}
          totalScore={result.total}
        />

        <SaveToPatient
          scaleName={config.title}
          totalScore={result.total ?? 0}
          classification={result.classification ?? result.description}
          answers={answers}
          domainScores={
            result.domainResults
              ? Object.fromEntries(
                  result.domainResults.map((dr) => [dr.domain, dr.score]),
                )
              : undefined
          }
        />

        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" /> Nova Avaliação
        </Button>

        {config.scaleId && <ScaleReference scaleId={config.scaleId} />}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.normal, ease: easing.smooth }}
        className="flex items-center gap-3"
      >
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-md`}
        >
          <config.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <h1
            className="text-xl text-foreground leading-tight"
            style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
          >
            {config.title}
          </h1>
          <p className="text-xs text-muted-foreground italic">
            {config.subtitle}
          </p>
        </div>
      </motion.div>

      <div className="sticky top-0 z-20 -mx-1 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} respondidas
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        {answered > 0 && !showResult && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
            <Save className="h-3.5 w-3.5" /> Progresso salvo neste dispositivo
          </div>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Instruções:</strong> {config.instruction}
        </p>
      </div>

      {config.domains.map((domain, di) => (
        <div key={di} className="space-y-3">
          <div className="flex items-center gap-2 py-2">
            <div
              className={`w-3 h-3 rounded-full ${
                domain.color.includes("red")
                  ? "bg-red-500"
                  : domain.color.includes("blue")
                    ? "bg-blue-500"
                    : domain.color.includes("green")
                      ? "bg-green-500"
                      : domain.color.includes("purple")
                        ? "bg-purple-500"
                        : domain.color.includes("orange")
                          ? "bg-orange-500"
                          : domain.color.includes("pink")
                            ? "bg-pink-500"
                            : domain.color.includes("amber")
                              ? "bg-amber-500"
                              : domain.color.includes("teal")
                                ? "bg-teal-500"
                                : domain.color.includes("indigo")
                                  ? "bg-indigo-500"
                                  : "bg-gray-500"
              }`}
            />
            <h2 className={`text-sm font-semibold ${domain.color}`}>
              {domain.name}
            </h2>
          </div>

          {domain.items.map((item, ii) => {
            const key = `${di}-${ii}`;
            return (
              <Card
                key={key}
                ref={(node) => {
                  itemRefs.current[key] = node;
                }}
                className={`border-card-border ${submitAttempted && answers[key] === undefined ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20" : ""}`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Badge
                      variant="outline"
                      className="text-xs font-mono flex-shrink-0 mt-0.5"
                    >
                      {config.domains
                        .slice(0, di)
                        .reduce((s, d) => s + d.items.length, 0) +
                        ii +
                        1}
                    </Badge>
                    <p className="text-sm text-foreground leading-relaxed">
                      {item}
                    </p>
                  </div>
                  {submitAttempted && answers[key] === undefined && (
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      Resposta obrigatória para concluir a escala.
                    </p>
                  )}
                  <RadioGroup
                    value={answers[key]?.toString()}
                    onValueChange={(val) => {
                      softTick();
                      haptic.select();
                      setAnswers((current) => ({
                        ...current,
                        [key]: Number.parseInt(val, 10),
                      }));
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    {config.labels.map((label, j) => {
                      const maxIdx = config.labels.length - 1;
                      const ratio = maxIdx > 0 ? j / maxIdx : 0;
                      const selectedColor =
                        ratio === 0
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
      ))}

      {submitAttempted && !allAnswered && (
        <div
          className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-200"
          role="alert"
        >
          Faltam {missingCount} resposta{missingCount !== 1 ? "s" : ""}. O
          primeiro item pendente foi destacado; nenhuma resposta será perdida.
        </div>
      )}

      <Button
        onClick={handleSubmit}
        aria-disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {total === 0
          ? "Escala sem itens configurados"
          : allAnswered
            ? "Ver Resultado"
            : `Faltam ${missingCount} resposta${missingCount !== 1 ? "s" : ""}`}
      </Button>

      {config.scaleId && <ScaleReference scaleId={config.scaleId} />}
    </div>
  );
}

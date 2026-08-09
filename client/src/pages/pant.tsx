import { useState, useMemo } from "react";
import {
  pantScales,
  pantDomains,
  pantLevelLabels,
  pantLevelColors,
  type PantScale,
} from "@/data/pantScales";
import { pantExamples, pantLevelExamples } from "@/data/pantExamples";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/PageHero";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Printer,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Languages,
  Lightbulb,
  Hand,
  Heart,
} from "lucide-react";
import { SaveToPatient } from "@/components/SaveToPatient";
import { ClinicalReport } from "@/components/ClinicalReport";
import { buildPantBlankFormText } from "@/lib/pantBlankForm";
import { printPlainTextDocument } from "@/lib/printDocument";
import {
  ScaleDraftLoading,
  ScaleDraftRestoredNotice,
} from "@/components/ScaleDraftLoading";
import { useSecureTypedScaleDraft } from "@/hooks/useSecureScaleDraft";
import { hasRecordEntries, sanitizeNumberRecord } from "@/lib/scaleDraftCore";

const PANT_DRAFT_VALUES = Object.fromEntries(
  pantScales.map((scale) => [
    String(scale.number),
    new Set(scale.levels.map((_, index) => index)),
  ]),
);

const domainIcons: Record<number, React.ElementType> = {
  1: MessageCircle,
  2: Languages,
  3: Lightbulb,
  4: Hand,
  5: Heart,
};

const domainGradients: Record<number, string> = {
  1: "from-pink-500 to-rose-500",
  2: "from-violet-500 to-purple-500",
  3: "from-amber-500 to-yellow-500",
  4: "from-teal-500 to-cyan-500",
  5: "from-rose-500 to-red-500",
};

const domainAccentBg: Record<number, string> = {
  1: "bg-pink-50 dark:bg-pink-950/20",
  2: "bg-violet-50 dark:bg-violet-950/20",
  3: "bg-amber-50 dark:bg-amber-950/20",
  4: "bg-teal-50 dark:bg-teal-950/20",
  5: "bg-rose-50 dark:bg-rose-950/20",
};

const domainAccentBorder: Record<number, string> = {
  1: "border-pink-200 dark:border-pink-800/40",
  2: "border-violet-200 dark:border-violet-800/40",
  3: "border-amber-200 dark:border-amber-800/40",
  4: "border-teal-200 dark:border-teal-800/40",
  5: "border-rose-200 dark:border-rose-800/40",
};

const domainTextColor: Record<number, string> = {
  1: "text-pink-600 dark:text-pink-400",
  2: "text-violet-600 dark:text-violet-400",
  3: "text-amber-600 dark:text-amber-400",
  4: "text-teal-600 dark:text-teal-400",
  5: "text-rose-600 dark:text-rose-400",
};

export default function PantPage() {
  const [showResult, setShowResult] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState<number | null>(1);
  const [showAnchor, setShowAnchor] = useState<string | null>(null);
  const {
    value: answers,
    setValue: setAnswers,
    ready: draftReady,
    restored: draftRestored,
    clearDraft,
  } = useSecureTypedScaleDraft<Record<number, number>>({
    draftId: "dedicated:pant-100",
    schemaVersion: 1,
    createEmpty: () => ({}),
    sanitize: (value) => sanitizeNumberRecord(value, PANT_DRAFT_VALUES),
    hasContent: hasRecordEntries,
  });

  const answered = Object.keys(answers).length;
  const total = pantScales.length;
  const progress = (answered / total) * 100;
  const allAnswered = answered === total;

  const scalesByDomain = useMemo(() => {
    const grouped: Record<number, PantScale[]> = {};
    for (const s of pantScales) {
      if (!grouped[s.domain]) grouped[s.domain] = [];
      grouped[s.domain].push(s);
    }
    return grouped;
  }, []);

  const responseItems = useMemo(
    () =>
      pantScales.map((scale) => ({
        question: scale.name,
        answer:
          answers[scale.number] === undefined
            ? "—"
            : (scale.levels[answers[scale.number]]?.label ??
              pantLevelLabels[answers[scale.number]]),
      })),
    [answers],
  );

  function handleSubmit() {
    if (!allAnswered) return;
    setShowResult(true);
  }

  function handleReset() {
    void clearDraft();
    setShowResult(false);
    setExpandedDomain(1);
  }

  function handlePrintBlankForm() {
    printPlainTextDocument({
      title: "PANT — formulário em branco",
      text: buildPantBlankFormText(pantScales, pantDomains, pantLevelLabels),
    });
  }

  function domainProgress(domainId: number) {
    const domainScales = scalesByDomain[domainId] || [];
    const domainAnswered = domainScales.filter(
      (s) => answers[s.number] !== undefined,
    ).length;
    return { answered: domainAnswered, total: domainScales.length };
  }

  if (!draftReady) return <ScaleDraftLoading />;

  if (showResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Respostas — PANT</h1>
            <p className="text-xs text-muted-foreground">
              100 Escalas Passivas de Neurodesenvolvimento
            </p>
          </div>
        </div>

        <ClinicalReport
          scaleName="PANT"
          scaleFullName="100 Escalas Passivas de Neurodesenvolvimento"
          items={responseItems}
        />

        <SaveToPatient scaleName="PANT" responses={responseItems} />
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full gap-2"
          data-testid="button-reset"
        >
          <RotateCcw className="w-4 h-4" />
          Nova Avaliação
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:hidden">
      <ScaleDraftRestoredNotice visible={draftRestored} onClear={handleReset} />
      {/* Header */}
      <PageHero
        icon={FileText}
        eyebrow="avaliação funcional"
        title="PANT — 100 Escalas Passivas"
        subtitle="Avaliação Funcional do Neurodesenvolvimento."
        gradient="from-primary to-chart-2"
      />

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 sm:w-auto"
        onClick={handlePrintBlankForm}
        data-testid="button-print-pant-blank"
      >
        <Printer className="h-4 w-4" aria-hidden="true" />
        Imprimir formulário em branco (0–4)
      </Button>

      {/* Global Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {answered} de {total} respondidas
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Instruction */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
        <p className="text-xs text-foreground/80 leading-relaxed">
          <strong>Instruções:</strong> Para cada escala passiva, atribua o nível
          observado de 0 a 4 conforme a régua de regulação. Use o{" "}
          <strong>exemplo do dia a dia</strong> em cada item para responder com
          mais segurança, avaliando espontaneidade, frequência, generalização e
          impacto funcional no cotidiano.
        </p>
      </div>

      {/* Régua reference — nível + exemplo para os pais */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
        {pantLevelLabels.map((label, i) => (
          <div
            key={i}
            className={`px-2 py-1.5 rounded-md ${pantLevelColors[i]}`}
          >
            <span className="font-bold">
              {i}: {label}
            </span>
            <span className="block mt-0.5 leading-snug">
              {pantLevelExamples[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Domains as accordion */}
      {pantDomains.map((domain) => {
        const isExpanded = expandedDomain === domain.id;
        const dp = domainProgress(domain.id);
        const Icon = domainIcons[domain.id];
        const domainScales = scalesByDomain[domain.id] || [];

        return (
          <div key={domain.id} className="space-y-3">
            {/* Domain header */}
            <button
              onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl ${domainAccentBg[domain.id]} border ${domainAccentBorder[domain.id]} transition-colors hover:opacity-90`}
              data-testid={`button-domain-${domain.id}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${domainGradients[domain.id]} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <h2
                    className={`text-sm font-semibold ${domainTextColor[domain.id]}`}
                  >
                    Macrodomínio {domain.id}: {domain.short}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {domain.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="text-xs font-mono">
                  {dp.answered}/{dp.total}
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Scales within domain */}
            {isExpanded && (
              <div className="space-y-2 ml-1">
                {domainScales.map((scale) => {
                  const currentAnswer = answers[scale.number];
                  const isAnswered = currentAnswer !== undefined;

                  return (
                    <Card
                      key={scale.number}
                      data-testid={`card-scale-${scale.number}`}
                      className={`border-card-border transition-all ${isAnswered ? "bg-card" : "bg-card/60"}`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono flex-shrink-0 mt-0.5 min-w-[36px] justify-center ${
                              isAnswered ? domainTextColor[domain.id] : ""
                            }`}
                          >
                            {String(scale.number).padStart(2, "0")}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-foreground font-medium leading-relaxed">
                              {scale.name}
                            </p>
                            {pantExamples[scale.number] && (
                              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                <span className="font-semibold text-foreground/70">
                                  Ex.:
                                </span>{" "}
                                {pantExamples[scale.number]}
                              </p>
                            )}
                            {/* Show anchor on tap */}
                            {showAnchor ===
                              `${scale.number}-${currentAnswer}` &&
                              currentAnswer !== undefined &&
                              scale.levels[currentAnswer] && (
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic">
                                  {scale.levels[currentAnswer].anchor.substring(
                                    0,
                                    200,
                                  )}
                                  {scale.levels[currentAnswer].anchor.length >
                                  200
                                    ? "..."
                                    : ""}
                                </p>
                              )}
                          </div>
                        </div>

                        {/* 0-4 rating buttons */}
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3, 4].map((level) => (
                            <button
                              key={level}
                              onClick={() => {
                                setAnswers({
                                  ...answers,
                                  [scale.number]: level,
                                });
                                setShowAnchor(`${scale.number}-${level}`);
                              }}
                              className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-medium transition-all border ${
                                currentAnswer === level
                                  ? pantLevelColors[level] +
                                    " border-current ring-1 ring-current/30"
                                  : "bg-card text-muted-foreground border-border hover:bg-muted"
                              }`}
                              data-testid={`button-rate-${scale.number}-${level}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>

                        {/* Selected level label */}
                        {isAnswered && (
                          <p className="text-xs text-muted-foreground">
                            Nível {currentAnswer}:{" "}
                            <span className="font-medium capitalize">
                              {scale.levels[currentAnswer]?.label ??
                                pantLevelLabels[currentAnswer]}
                            </span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full"
        size="lg"
        data-testid="button-submit"
      >
        {allAnswered
          ? "Ver perguntas e respostas"
          : `Responda todas as ${total} escalas (${answered}/${total})`}
      </Button>
    </div>
  );
}

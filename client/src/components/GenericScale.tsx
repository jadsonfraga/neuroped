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
  CheckCircle2,
  ChevronDown,
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

/**
 * Item de escala. Pode ser uma string simples (compatível com todo o acervo
 * antigo) ou um objeto com emoji e um exemplo prático que explica, em
 * linguagem do dia a dia, o que a pergunta está querendo saber — facilita a
 * resposta da família por dar um exemplo concreto do comportamento.
 */
export type ScaleItem = string | { text: string; emoji?: string; example?: string };

export function itemText(item: ScaleItem): string {
  return typeof item === "string" ? item : item.text;
}
export function itemEmoji(item: ScaleItem): string | undefined {
  return typeof item === "string" ? undefined : item.emoji;
}
export function itemExample(item: ScaleItem): string | undefined {
  return typeof item === "string" ? undefined : item.example;
}

interface DomainConfig {
  name: string;
  color: string;
  items: ScaleItem[];
}

interface ResultDomain {
  domain: string;
  score: number;
  classification: string;
  color: string;
}

export interface ScaleConfig {
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
  const [draftRestored, setDraftRestored] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const allItems = useMemo(
    () =>
      config.domains.flatMap((d, di) =>
        d.items.map((item, ii) => ({
          key: `${di}-${ii}`,
          text: itemText(item),
          emoji: itemEmoji(item),
          example: itemExample(item),
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
        updatedAt?: string;
      };
      // Rascunho com mais de 12h é descartado: evita restaurar respostas de um
      // atendimento anterior (vazamento de rascunho entre pacientes).
      if (parsed.updatedAt) {
        const ageMs = Date.now() - new Date(parsed.updatedAt).getTime();
        if (Number.isFinite(ageMs) && ageMs > 12 * 60 * 60 * 1000) {
          window.localStorage.removeItem(draftKey);
          return;
        }
      }
      if (parsed.answers && typeof parsed.answers === "object") {
        setAnswers(parsed.answers);
        if (Object.keys(parsed.answers).length > 0) setDraftRestored(true);
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
        window.setTimeout(() => itemRefs.current[firstMissing.key]?.focus({ preventScroll: true }), 250);
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

  // Leva à primeira pendência sem enviar — usado pela barra sticky para virar um
  // controle de navegação em escalas longas (evita rolar caçando o que falta).
  function goToFirstMissing() {
    if (!firstMissing) return;
    softTap();
    haptic.tap();
    itemRefs.current[firstMissing.key]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  if (showResult) {
    // Transcrição por extenso: perguntas + respostas selecionadas. É o resultado
    // que o app entrega — sem escore, corte ou classificação (pedido do autor).
    const qaItems = allItems.map((item) => ({
      question: item.text,
      answer: config.labels[answers[item.key] ?? -1] ?? "—",
      value: answers[item.key] ?? 0,
    }));
    const qaTranscript = qaItems
      .map((it, i) => `${i + 1}. ${it.question}\n→ ${it.answer}`)
      .join("\n\n");
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
          fala="Respostas registradas! Abaixo estão as perguntas e as respostas selecionadas, por extenso — a análise clínica fica com você, profissional."
        />

        <Card className="border-card-border overflow-hidden">
          <CardContent className="p-6 space-y-5">
            {/* RESULTADO = perguntas e respostas por extenso. Sem escore, ponto de
                corte, percentual ou classificação — o registro fiel do que foi
                perguntado e do que foi respondido, para o profissional fazer a
                própria análise clínica (pedido do autor, 2026). */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Perguntas e respostas ({answered}/{allItems.length})
              </h3>
              {config.domains.map((d, di) => (
                <div key={di} className="space-y-1.5">
                  {config.domains.length > 1 && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-wide text-primary">{d.name}</p>
                  )}
                  <ol className="space-y-2">
                    {d.items.map((item, ii) => {
                      const idx = answers[`${di}-${ii}`];
                      const resp = idx === undefined ? "—" : (config.labels[idx] ?? `Opção ${idx + 1}`);
                      const globalN =
                        config.domains.slice(0, di).reduce((s, dd) => s + dd.items.length, 0) + ii + 1;
                      const emoji = itemEmoji(item);
                      const example = itemExample(item);
                      return (
                        <li key={ii} className="border-b border-border/40 pb-2 last:border-0">
                          <p className="text-sm text-foreground leading-snug">
                            <span className="font-mono text-xs text-muted-foreground">{globalN}.</span>{" "}
                            {emoji && <span className="mr-0.5 text-xs opacity-60" aria-hidden="true">{emoji}</span>}
                            {itemText(item)}
                          </p>
                          {example && (
                            <p className="mt-1 border-l-2 border-primary/20 pl-2 text-xs italic leading-snug text-muted-foreground">
                              {example}
                            </p>
                          )}
                          <p className="mt-0.5 text-sm font-semibold text-primary">
                            → {resp}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>

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
          hideScore
          classification="Registro de respostas — análise clínica pelo profissional"
          description="Transcrição por extenso das perguntas e das respostas selecionadas. Sem escore, ponto de corte ou classificação automática."
          items={qaItems}
        />

        <WhatsAppShare
          scaleName={config.title}
          reportText={`${config.title}\n\nPerguntas e respostas:\n\n${qaTranscript}`}
        />

        <SaveToPatient
          scaleName={config.title}
          classification="Respostas registradas"
          answers={answers}
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

      {draftRestored && !showResult && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-2">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Respostas de uma aplicação anterior foram restauradas. Novo paciente? Comece do zero.
          </p>
          <button
            type="button"
            data-testid="button-clear-draft"
            onClick={() => {
              try { window.localStorage.removeItem(draftKey); } catch { /* sem storage */ }
              setAnswers({});
              setShowResult(false);
              setSubmitAttempted(false);
              setDraftRestored(false);
            }}
            className="shrink-0 rounded-lg border border-amber-400/70 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
          >
            Começar do zero
          </button>
        </div>
      )}

      <div className="sticky top-0 z-20 -mx-1 rounded-2xl border border-border/70 bg-background/95 p-3.5 shadow-sm backdrop-blur space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            {answered} de {total} respondidas
          </span>
          <span className="tabular-nums font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <Progress
          value={progress}
          className="h-2.5"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answered}
          aria-label={`Progresso da escala: ${answered} de ${total} perguntas respondidas`}
        />
        <div className="flex items-center justify-between gap-2">
          {answered > 0 ? (
            <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
              <Save className="h-3.5 w-3.5" /> Progresso salvo
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Toque numa opção para começar</span>
          )}
          {total > 0 &&
            (allAnswered ? (
              <Button
                size="sm"
                onClick={handleSubmit}
                className="h-7 gap-1 px-3 text-xs"
                data-testid="button-submit-sticky"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Ver resultado
              </Button>
            ) : answered > 0 ? (
              <button
                type="button"
                onClick={goToFirstMissing}
                data-testid="button-next-missing"
                className="flex shrink-0 items-center gap-1 rounded-full border border-amber-400/70 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                Próxima pendente <ChevronDown className="h-3.5 w-3.5" />
              </button>
            ) : null)}
        </div>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-4">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Instruções:</strong> {config.instruction}
        </p>
      </div>

      {config.domains.map((domain, di) => {
        const domTotal = domain.items.length;
        const domAnswered = domain.items.reduce(
          (s, _, ii) => s + (answers[`${di}-${ii}`] !== undefined ? 1 : 0),
          0,
        );
        const domComplete = domTotal > 0 && domAnswered === domTotal;
        return (
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
            <span
              className={`ml-auto flex items-center gap-1 text-[11px] tabular-nums ${
                domComplete ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {domComplete && <CheckCircle2 className="h-3.5 w-3.5" />}
              {domAnswered}/{domTotal}
            </span>
          </div>

          {domain.items.map((item, ii) => {
            const key = `${di}-${ii}`;
            return (
              <Card
                key={key}
                ref={(node) => {
                  itemRefs.current[key] = node;
                }}
                tabIndex={-1}
                aria-invalid={submitAttempted && answers[key] === undefined}
                className={`rounded-2xl border-card-border shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  submitAttempted && answers[key] === undefined
                    ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20"
                    : answers[key] !== undefined
                      ? "bg-card ring-1 ring-emerald-400/40 hover:shadow-md"
                      : "bg-card/70 hover:bg-card hover:shadow-md"
                }`}
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
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm text-foreground leading-relaxed">
                        {itemEmoji(item) && (
                          <span className="mr-1.5 text-sm opacity-60 align-middle" aria-hidden="true">{itemEmoji(item)}</span>
                        )}
                        {itemText(item)}
                      </p>
                      {itemExample(item) && (
                        <p className="border-l-2 border-primary/25 pl-2.5 text-xs italic leading-snug text-muted-foreground">
                          {itemExample(item)}
                        </p>
                      )}
                    </div>
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
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`q-${key}-o${j}`}
                            aria-pressed={answers[key] === j}
                            className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-full border px-3.5 py-2 text-xs transition-all duration-200 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background ${
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

import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getInteractiveScale as getItemScale } from "@/data/interactiveScaleItems";
import {
  getInteractiveScale as getRunnerScale,
  type InteractiveScaleDef as RunnerScaleDef,
} from "@/data/interactiveScales";

interface SharedScale {
  id: string;
  name: string;
  fullName?: string;
}

interface SharePayload {
  shareId: string;
  status: "pending" | "submitted" | "revoked";
  scales: SharedScale[];
  expiresAt: string;
  submittedAt?: string | null;
}

interface ResponseItem {
  question: string;
  answer: string;
}

interface SubmittedScale {
  scaleId: string;
  patientAge: string | null;
  responses: ResponseItem[];
}

function formatDate(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return "Não foi possível abrir este link.";
  const match = error.message.match(/\d+:\s*(\{.*\})$/s);
  if (match) {
    try {
      const body = JSON.parse(match[1]);
      if (typeof body.error === "string") return body.error;
    } catch {
      /* usa a mensagem genérica abaixo */
    }
  }
  return "Não foi possível abrir este link. Solicite um novo acesso ao consultório.";
}

function itemKey(scaleId: string, index: number): string {
  return `${scaleId}:${index}`;
}

type RemoteItem = {
  text: string;
  example?: string;
  responseType?: "choice" | "text";
  placeholder?: string;
  maxLength?: number;
};

function remoteItem(item: unknown): RemoteItem {
  if (typeof item === "string") return { text: item };
  return item as RemoteItem;
}

function itemText(item: unknown): string {
  return remoteItem(item).text;
}

function itemExample(item: unknown): string | undefined {
  return remoteItem(item).example;
}

function itemPlaceholder(item: unknown): string | undefined {
  return remoteItem(item).placeholder;
}

function itemResponseType(item: unknown): "choice" | "text" {
  return remoteItem(item).responseType ?? "choice";
}

function flattenItems(def: ReturnType<typeof getItemScale>): unknown[] {
  return def ? def.domains.flatMap((domain) => domain.items) : [];
}

function currentItemAnswer(
  answers: Record<string, string>,
  key: string,
): string {
  return answers[key] ?? "";
}

function answerLabel(value: string): string {
  return value || "Não respondida";
}

function FamilyItemScale({
  scale,
  answers,
  onAnswer,
}: {
  scale: SharedScale;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
}) {
  const def = getItemScale(scale.id);
  const items = flattenItems(def);
  if (!def) return null;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed text-blue-950 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-100">
        {def.instruction}
      </div>
      {def.infoBox && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {def.infoBox}
        </p>
      )}
      {def.domains.map((domain, domainIndex) => (
        <section
          key={domain.name}
          className="space-y-3"
          aria-labelledby={`domain-${scale.id}-${domainIndex}`}
        >
          {def.domains.length > 1 && (
            <h3
              id={`domain-${scale.id}-${domainIndex}`}
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary"
            >
              {domain.name}
            </h3>
          )}
          <ol className="space-y-3">
            {domain.items.map((item, localIndex) => {
              const globalIndex =
                def.domains
                  .slice(0, domainIndex)
                  .reduce((count, current) => count + current.items.length, 0) +
                localIndex;
              const key = itemKey(scale.id, globalIndex);
              const responseType = itemResponseType(item);
              const value = currentItemAnswer(answers, key);
              return (
                <li
                  key={key}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <p className="text-sm font-semibold leading-relaxed text-foreground">
                    <span className="mr-2 text-xs font-bold text-primary">
                      {globalIndex + 1}.
                    </span>
                    {itemText(item)}
                  </p>
                  {itemExample(item) && (
                    <p className="mt-2 rounded-lg border-l-2 border-primary/30 bg-muted/40 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground">
                      {itemExample(item)}
                    </p>
                  )}
                  {responseType === "text" ? (
                    <Textarea
                      className="mt-3 min-h-24"
                      value={value}
                      onChange={(event) => onAnswer(key, event.target.value)}
                      placeholder={
                        itemPlaceholder(item) ?? "Escreva sua resposta"
                      }
                      maxLength={remoteItem(item).maxLength}
                      aria-label={`Resposta ${globalIndex + 1}`}
                    />
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {def.labels.map((label, optionIndex) => {
                        const optionValue = String(optionIndex);
                        const selected = value === optionValue;
                        return (
                          <button
                            key={optionValue}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onAnswer(key, optionValue)}
                            className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        {items.length} pergunta{items.length === 1 ? "" : "s"}. Responda
        pensando no comportamento habitual da criança.
      </p>
    </div>
  );
}

function FamilyRunnerScale({
  scale,
  answers,
  onAnswer,
}: {
  scale: SharedScale;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
}) {
  const def = getRunnerScale(scale.id) as RunnerScaleDef | undefined;
  if (!def) return null;
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed text-blue-950 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-100">
        {def.instructions}
      </div>
      {def.validationNote && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {def.validationNote}
        </p>
      )}
      <ol className="space-y-3">
        {def.items.map((item, index) => {
          const key = itemKey(scale.id, index);
          const value = answers[key] ?? "";
          return (
            <li
              key={key}
              className="rounded-xl border border-border bg-background p-4"
            >
              <p className="text-sm font-semibold leading-relaxed text-foreground">
                <span className="mr-2 text-xs font-bold text-primary">
                  {index + 1}.
                </span>
                {item.text}
              </p>
              {item.example && (
                <p className="mt-2 rounded-lg border-l-2 border-primary/30 bg-muted/40 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground">
                  {item.example}
                </p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.options.map((option, optionIndex) => {
                  const optionValue = String(optionIndex);
                  const selected = value === optionValue;
                  return (
                    <button
                      key={optionValue}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onAnswer(key, optionValue)}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-left text-sm transition active:scale-[0.99] ${selected ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50"}`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        {def.items.length} pergunta{def.items.length === 1 ? "" : "s"}. Responda
        pensando no comportamento habitual da criança.
      </p>
    </div>
  );
}

export default function ResponderEscalasPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [activeIndex, setActiveIndex] = useState(0);
  const [answersByScale, setAnswersByScale] = useState<
    Record<string, Record<string, string>>
  >({});
  const [respondentName, setRespondentName] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const shareQuery = useQuery<SharePayload>({
    queryKey: ["parent-scale-share", token],
    enabled: Boolean(token),
    retry: false,
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/scale-shares/open", {
        token,
      });
      return response.json() as Promise<SharePayload>;
    },
  });
  const share = shareQuery.data;
  const scales = share?.scales ?? [];
  const currentScale = scales[activeIndex];
  const currentAnswers = currentScale
    ? (answersByScale[currentScale.id] ?? {})
    : {};
  const currentDefinition = currentScale
    ? (getItemScale(currentScale.id) ?? getRunnerScale(currentScale.id))
    : undefined;

  const currentItemCount = useMemo(() => {
    if (!currentDefinition) return 0;
    if ("items" in currentDefinition) return currentDefinition.items.length;
    return currentDefinition.domains.reduce(
      (total, domain) => total + domain.items.length,
      0,
    );
  }, [currentDefinition]);
  const currentAnsweredCount =
    Object.values(currentAnswers).filter(Boolean).length;
  const currentComplete =
    currentItemCount > 0 && currentAnsweredCount === currentItemCount;

  useEffect(() => {
    if (share?.status === "submitted") setSubmitted(true);
  }, [share?.status]);

  function onAnswer(key: string, value: string) {
    if (!currentScale) return;
    setAnswersByScale((previous) => ({
      ...previous,
      [currentScale.id]: { ...(previous[currentScale.id] ?? {}), [key]: value },
    }));
    setSubmitError(null);
  }

  function responsesForScale(scale: SharedScale): SubmittedScale {
    const answers = answersByScale[scale.id] ?? {};
    const itemDef = getItemScale(scale.id);
    if (itemDef) {
      const items = flattenItems(itemDef);
      return {
        scaleId: scale.id,
        patientAge: null,
        responses: items.map((item, index) => {
          const value = answers[itemKey(scale.id, index)] ?? "";
          const responseType = itemResponseType(item);
          const label =
            responseType === "text"
              ? value
              : (itemDef.labels[Number(value)] ?? "");
          return { question: itemText(item), answer: answerLabel(label) };
        }),
      };
    }
    const runnerDef = getRunnerScale(scale.id);
    return {
      scaleId: scale.id,
      patientAge: null,
      responses:
        runnerDef?.items.map((item, index) => {
          const value = answers[itemKey(scale.id, index)] ?? "";
          return {
            question: item.text,
            answer: answerLabel(item.options[Number(value)]?.label ?? ""),
          };
        }) ?? [],
    };
  }

  function goNext() {
    if (!currentComplete) {
      setSubmitError(
        "Responda todas as perguntas desta escala antes de continuar.",
      );
      return;
    }
    setSubmitError(null);
    if (activeIndex < scales.length - 1) {
      setActiveIndex((value) => value + 1);
      return;
    }
    setReviewing(true);
  }

  async function submitAll() {
    if (!token || scales.length === 0) return;
    setSubmitError(null);
    try {
      await apiRequest("POST", "/api/scale-shares/submit", {
        token,
        respondentName: respondentName.trim() || null,
        results: scales.map(responsesForScale),
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(errorText(error));
    }
  }

  if (!token)
    return (
      <PublicShell>
        <ErrorCard message="Este link está incompleto. Solicite um novo link ao consultório." />
      </PublicShell>
    );
  if (shareQuery.isLoading)
    return (
      <PublicShell>
        <div
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"
          role="status"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Abrindo formulário seguro…
        </div>
      </PublicShell>
    );
  if (shareQuery.isError || !share)
    return (
      <PublicShell>
        <ErrorCard message={errorText(shareQuery.error)} />
      </PublicShell>
    );
  if (submitted)
    return (
      <PublicShell>
        <Card className="overflow-hidden border-emerald-300/60">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="space-y-4 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="text-xl font-bold text-foreground">
              Respostas enviadas e guardadas
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              O consultório recebeu as respostas de {scales.length} escala
              {scales.length === 1 ? "" : "s"}. Você já pode fechar esta página.
            </p>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-100">
              <ShieldCheck className="mr-1 inline h-4 w-4" />O resultado foi
              associado ao cadastro informado pelo consultório.
            </div>
          </CardContent>
        </Card>
      </PublicShell>
    );
  if (reviewing)
    return (
      <PublicShell>
        <Card className="overflow-hidden border-primary/25">
          <CardHeader className="border-b border-border/70 p-5">
            <Badge className="w-fit bg-primary/10 text-primary">
              Revisão final
            </Badge>
            <CardTitle className="text-xl">Confira antes de enviar</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              As respostas serão guardadas no cadastro do paciente pelo
              consultório. Não há diagnóstico automático nesta tela.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-3">
              {scales.map((scale) => {
                const result = responsesForScale(scale);
                return (
                  <div
                    key={scale.id}
                    className="rounded-xl border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-foreground">
                          {scale.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {scale.fullName}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {result.responses.length} respostas
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Primeira resposta:{" "}
                      <strong className="text-foreground">
                        {result.responses[0]?.answer ?? "—"}
                      </strong>
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 px-0 text-xs text-primary"
                      onClick={() => {
                        setReviewing(false);
                        setActiveIndex(
                          scales.findIndex((item) => item.id === scale.id),
                        );
                      }}
                    >
                      Revisar esta escala
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1">
              <label
                htmlFor="parent-respondent-name"
                className="text-xs font-semibold text-muted-foreground"
              >
                Seu nome (opcional)
              </label>
              <Input
                id="parent-respondent-name"
                value={respondentName}
                onChange={(event) => setRespondentName(event.target.value)}
                placeholder="Nome do responsável"
                maxLength={160}
              />
            </div>
            {submitError && <ErrorInline message={submitError} />}
            <Button
              type="button"
              onClick={submitAll}
              className="h-12 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ClipboardCheck className="h-5 w-5" />
              Enviar e guardar respostas
            </Button>
          </CardContent>
        </Card>
      </PublicShell>
    );

  if (!currentScale || !currentDefinition)
    return (
      <PublicShell>
        <ErrorCard message="Uma das escalas deste link não está disponível nesta versão do app. Solicite um novo link." />
      </PublicShell>
    );
  return (
    <PublicShell>
      <Card className="overflow-hidden border-primary/25">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-chart-2" />
        <CardHeader className="gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <Badge className="bg-primary/10 text-primary">
              Escala {activeIndex + 1} de {scales.length}
            </Badge>
            <span className="text-xs font-semibold text-muted-foreground">
              Expira {formatDate(share.expiresAt)}
            </span>
          </div>
          <CardTitle className="text-xl">{currentScale.name}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {currentScale.fullName}
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${currentItemCount ? (currentAnsweredCount / currentItemCount) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {currentAnsweredCount} de {currentItemCount} respondidas
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {getItemScale(currentScale.id) ? (
            <FamilyItemScale
              scale={currentScale}
              answers={currentAnswers}
              onAnswer={onAnswer}
            />
          ) : (
            <FamilyRunnerScale
              scale={currentScale}
              answers={currentAnswers}
              onAnswer={onAnswer}
            />
          )}
          {submitError && <ErrorInline message={submitError} />}
          <div className="flex gap-2">
            {activeIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmitError(null);
                  setActiveIndex((value) => value - 1);
                }}
                className="h-11 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            )}
            <Button
              type="button"
              onClick={goNext}
              className="h-11 flex-1 gap-2"
            >
              {activeIndex < scales.length - 1
                ? "Próxima escala"
                : "Revisar respostas"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-background to-emerald-50 px-4 py-8 dark:from-slate-950 dark:via-background dark:to-emerald-950/20">
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            NeuroPed
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Formulário enviado pelo consultório
          </p>
        </div>
        {children}
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          Responda com base no cotidiano da criança. Esta página registra
          respostas e não substitui avaliação profissional.
        </p>
      </div>
    </main>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-amber-300">
      <CardContent className="flex items-start gap-3 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
function ErrorInline({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

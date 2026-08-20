import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Ruler,
  Target,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ClinicalEvent, ClinicalEventInput, OutcomeContext } from "@shared/clinical-core";
import {
  deriveTherapyGoals,
  therapyGoalStatusLabels,
  type TherapyGoalSnapshot,
} from "@shared/therapy-goals";

interface TherapyGoalsPanelProps {
  patientId: string;
  clinicId?: string;
  liveEnabled?: boolean;
  events: ClinicalEvent[];
  unavailable?: boolean;
}

const outcomeContextLabels: Record<OutcomeContext, string> = {
  clinic: "Consultório",
  home: "Casa",
  school: "Escola",
  therapy: "Terapia",
  telemedicine: "Telemedicina",
  other: "Outro",
};

const directionLabels = {
  improved: "Melhora",
  stable: "Estável",
  worsened: "Piora",
  mixed: "Misto",
  unknown: "Sem classificação",
} as const;

type OutcomeDirection = keyof typeof directionLabels;

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function measurementText(goal: TherapyGoalSnapshot): string {
  const measurement = goal.latestMeasurement;
  if (!measurement) return "Sem medida de evolução registrada";
  if (typeof measurement.data.valueNumber === "number") {
    return `${measurement.data.valueNumber}${measurement.data.unit ? ` ${measurement.data.unit}` : ""}`;
  }
  return measurement.data.valueText || "Medida registrada sem valor resumível";
}

export function TherapyGoalsPanel({ patientId, clinicId = "", liveEnabled = false, events, unavailable = false }: TherapyGoalsPanelProps) {
  const { toast } = useToast();
  const goals = useMemo(() => deriveTherapyGoals(events), [events]);
  const activeCount = goals.filter((goal) => ["planned", "in_progress"].includes(goal.plan.data.status)).length;
  const liveMode = liveEnabled && Boolean(clinicId);
  const queryKey = liveMode
    ? `/api/live/events?clinicId=${encodeURIComponent(clinicId)}&patientId=${encodeURIComponent(patientId)}`
    : `/api/clinical-core/events?patient_id=${encodeURIComponent(patientId)}&days=3650`;

  const [createOpen, setCreateOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [domain, setDomain] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [successCriterion, setSuccessCriterion] = useState("");
  const [baselineValue, setBaselineValue] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");
  const [measurementMethod, setMeasurementMethod] = useState("");

  const [measureGoal, setMeasureGoal] = useState<TherapyGoalSnapshot | null>(null);
  const [measureLabel, setMeasureLabel] = useState("");
  const [measureValue, setMeasureValue] = useState("");
  const [measureUnit, setMeasureUnit] = useState("");
  const [measureText, setMeasureText] = useState("");
  const [measureContext, setMeasureContext] = useState<OutcomeContext>("clinic");
  const [measureDirection, setMeasureDirection] = useState<OutcomeDirection>("unknown");
  const [measureNote, setMeasureNote] = useState("");

  async function postEvent(input: ClinicalEventInput): Promise<ClinicalEvent | { id: string; duplicate?: boolean }> {
    if (unavailable || !patientId || (liveEnabled && !clinicId)) {
      throw new Error("O Clinical Core não está disponível para escrita neste contexto.");
    }
    const path = liveMode ? "/api/live/events" : "/api/clinical-core/events";
    const body = liveMode
      ? {
          clinicId,
          patientId: input.patientId,
          eventType: input.eventType,
          occurredAt: input.occurredAt,
          provenanceKind: input.provenance.kind,
          provenanceSource: input.provenance.source,
          ...(input.supersedesEventId ? { supersedesEventId: input.supersedesEventId } : {}),
          ...(input.encounterId ? { encounterId: input.encounterId } : {}),
          payload: input.data,
        }
      : input;
    const response = await apiRequest("POST", path, body);
    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);
      throw new Error(responseBody?.error || "Não foi possível salvar no Clinical Core.");
    }
    return response.json();
  }

  const createGoalMutation = useMutation({
    mutationFn: async () => {
      const baseline = optionalNumber(baselineValue);
      const numericTarget = optionalNumber(targetValue);
      const goalId = `goal-${crypto.randomUUID()}`;
      const input: ClinicalEventInput = {
        patientId,
        eventType: "plan",
        occurredAt: new Date().toISOString(),
        provenance: {
          kind: "decision",
          source: "clinician",
          sourceLabel: "Meta terapêutica revisada pelo profissional",
        },
        data: {
          kind: "therapy",
          target: target.trim(),
          status: "in_progress",
          priority: "routine",
          goalId,
          ...(domain.trim() ? { goalDomain: domain.trim() } : {}),
          ...(responsibleRole.trim() ? { responsibleRole: responsibleRole.trim() } : {}),
          ...(successCriterion.trim() ? { successCriterion: successCriterion.trim() } : {}),
          ...(typeof baseline === "number" ? { baselineValue: baseline } : {}),
          ...(typeof numericTarget === "number" ? { targetValue: numericTarget } : {}),
          ...(unit.trim() && typeof baseline === "number" ? { baselineUnit: unit.trim() } : {}),
          ...(unit.trim() && typeof numericTarget === "number" ? { targetUnit: unit.trim() } : {}),
          ...(measurementMethod.trim() ? { measurementMethod: measurementMethod.trim() } : {}),
        },
      };
      return postEvent(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      setCreateOpen(false);
      setTarget("");
      setDomain("");
      setResponsibleRole("");
      setSuccessCriterion("");
      setBaselineValue("");
      setTargetValue("");
      setUnit("");
      setMeasurementMethod("");
      toast({ title: "Meta terapêutica registrada." });
    },
    onError: (error) => {
      toast({ title: "Não foi possível registrar a meta.", description: String(error), variant: "destructive" });
    },
  });

  const measurementMutation = useMutation({
    mutationFn: async () => {
      if (!measureGoal) throw new Error("Meta não selecionada.");
      const numericValue = optionalNumber(measureValue);
      const qualitativeValue = measureText.trim();
      if (numericValue === undefined && !qualitativeValue) {
        throw new Error("Informe um valor numérico ou uma observação qualitativa.");
      }
      const input: ClinicalEventInput = {
        patientId,
        eventType: "outcome",
        occurredAt: new Date().toISOString(),
        provenance: {
          kind: numericValue !== undefined ? "measured" : "observed",
          source: "clinician",
          sourceLabel: "Medida de evolução vinculada a meta terapêutica",
        },
        ...(measureNote.trim() ? { note: measureNote.trim() } : {}),
        data: {
          domain: measureGoal.plan.data.goalDomain || "therapy_goal",
          measure: measureLabel.trim() || measureGoal.plan.data.measurementMethod || "Evolução da meta",
          goalId: measureGoal.goalId,
          context: measureContext,
          direction: measureDirection,
          ...(numericValue !== undefined ? { valueNumber: numericValue } : {}),
          ...(qualitativeValue ? { valueText: qualitativeValue } : {}),
          ...(measureUnit.trim() && numericValue !== undefined ? { unit: measureUnit.trim() } : {}),
        },
      };
      return postEvent(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      setMeasureGoal(null);
      setMeasureLabel("");
      setMeasureValue("");
      setMeasureUnit("");
      setMeasureText("");
      setMeasureContext("clinic");
      setMeasureDirection("unknown");
      setMeasureNote("");
      toast({ title: "Medida de evolução registrada." });
    },
    onError: (error) => {
      toast({ title: "Não foi possível registrar a medida.", description: String(error), variant: "destructive" });
    },
  });

  const completeGoalMutation = useMutation({
    mutationFn: async (goal: TherapyGoalSnapshot) => {
      const input: ClinicalEventInput = {
        patientId,
        eventType: "plan",
        occurredAt: new Date().toISOString(),
        supersedesEventId: goal.plan.id,
        provenance: {
          kind: "decision",
          source: "clinician",
          sourceLabel: "Conclusão de meta terapêutica revisada pelo profissional",
        },
        data: {
          ...goal.plan.data,
          status: "completed",
        },
      };
      return postEvent(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast({ title: "Meta marcada como concluída." });
    },
    onError: (error) => {
      toast({ title: "Não foi possível concluir a meta.", description: String(error), variant: "destructive" });
    },
  });

  function openMeasurement(goal: TherapyGoalSnapshot) {
    setMeasureGoal(goal);
    setMeasureLabel(goal.plan.data.measurementMethod || "Evolução da meta");
    setMeasureUnit(goal.plan.data.targetUnit || goal.plan.data.baselineUnit || "");
    setMeasureValue("");
    setMeasureText("");
    setMeasureContext("clinic");
    setMeasureDirection("unknown");
    setMeasureNote("");
  }

  function completeGoal(goal: TherapyGoalSnapshot) {
    const confirmed = window.confirm(
      "Marcar esta meta como concluída? A decisão será registrada no histórico e o evento anterior será preservado como corrigido.",
    );
    if (confirmed) completeGoalMutation.mutate(goal);
  }

  return (
    <section className="space-y-3" data-testid="therapy-goals-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Outcomes</p>
          <h3 className="text-base font-bold text-foreground">Metas terapêuticas & evolução</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Baseline, alvo e medidas repetidas ficam ligados ao Clinical Core. A trajetória numérica não substitui julgamento clínico nem confirma causalidade.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="min-h-10 gap-2"
          onClick={() => setCreateOpen(true)}
          disabled={unavailable || !patientId}
        >
          <Plus className="h-4 w-4" /> Nova meta
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Metas ativas" value={unavailable ? "—" : String(activeCount)} icon={<Target className="h-4 w-4" />} />
        <Metric label="Metas no histórico" value={unavailable ? "—" : String(goals.length)} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Metric
          label="Medidas vinculadas"
          value={unavailable ? "—" : String(goals.reduce((sum, goal) => sum + goal.measurements.length, 0))}
          icon={<Ruler className="h-4 w-4" />}
        />
      </div>

      {unavailable ? (
        <Card className="border-card-border">
          <CardContent className="p-4 text-xs text-muted-foreground">
            Clinical Core indisponível; nenhuma meta foi simulada.
          </CardContent>
        </Card>
      ) : goals.length === 0 ? (
        <Card className="border-dashed border-card-border">
          <CardContent className="flex items-start gap-3 p-4">
            <Target className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Nenhuma meta longitudinal registrada.</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Registre somente objetivos clinicamente definidos. Campos numéricos são opcionais para metas cujo desfecho é qualitativo ou instrumental.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const status = goal.plan.data.status;
            const completed = status === "completed" || status === "cancelled";
            const baseline = goal.plan.data.baselineValue;
            const targetNumber = goal.plan.data.targetValue;
            const latest = goal.latestMeasurement;
            return (
              <Card key={goal.goalId} className="border-card-border">
                <CardContent className="space-y-4 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={completed ? "secondary" : "outline"}>{therapyGoalStatusLabels[status]}</Badge>
                        {goal.plan.data.goalDomain && <Badge variant="secondary">{goal.plan.data.goalDomain}</Badge>}
                      </div>
                      <p className="mt-2 text-sm font-bold leading-relaxed">{goal.plan.data.target}</p>
                      {goal.plan.data.successCriterion && (
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          Critério: {goal.plan.data.successCriterion}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openMeasurement(goal)} disabled={completed}>
                        <TrendingUp className="mr-1.5 h-4 w-4" /> Registrar medida
                      </Button>
                      {!completed && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => completeGoal(goal)}
                          disabled={completeGoalMutation.isPending}
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Concluir
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <GoalDatum
                      label="Baseline"
                      value={typeof baseline === "number" ? `${baseline}${goal.plan.data.baselineUnit ? ` ${goal.plan.data.baselineUnit}` : ""}` : "Não estruturado"}
                    />
                    <GoalDatum
                      label="Última medida"
                      value={measurementText(goal)}
                      detail={latest ? formatDate(latest.occurredAt) : undefined}
                    />
                    <GoalDatum
                      label="Alvo numérico"
                      value={typeof targetNumber === "number" ? `${targetNumber}${goal.plan.data.targetUnit ? ` ${goal.plan.data.targetUnit}` : ""}` : "Não estruturado"}
                    />
                  </div>

                  {goal.numericProgressPercent !== null && (
                    <div className="space-y-2">
                      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.numericProgressPercent}%` }} />
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {goal.numericProgressPercent}% da trajetória matemática entre baseline e alvo. Este percentual não equivale, isoladamente, a resposta clínica ou domínio da habilidade.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <span>{goal.measurements.length} medida{goal.measurements.length === 1 ? "" : "s"}</span>
                    {goal.plan.data.responsibleRole && <span>Responsável: {goal.plan.data.responsibleRole}</span>}
                    {goal.plan.data.measurementMethod && <span>Método: {goal.plan.data.measurementMethod}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova meta terapêutica</DialogTitle>
            <DialogDescription>
              Registre uma decisão já revisada clinicamente. O sistema organiza e mede; não define a meta por conta própria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Objetivo / meta" htmlFor="goal-target">
              <Textarea id="goal-target" rows={3} value={target} onChange={(event) => setTarget(event.target.value.slice(0, 1000))} placeholder="Ex.: ampliar comunicação funcional para solicitar ajuda em contextos cotidianos" />
            </Field>
            <Field label="Domínio" htmlFor="goal-domain">
              <Input id="goal-domain" value={domain} onChange={(event) => setDomain(event.target.value.slice(0, 120))} placeholder="Comunicação, autonomia, atenção..." />
            </Field>
            <Field label="Profissional / papel responsável" htmlFor="goal-role">
              <Input id="goal-role" value={responsibleRole} onChange={(event) => setResponsibleRole(event.target.value.slice(0, 160))} placeholder="Fonoaudiologia, TO, Psicologia..." />
            </Field>
            <Field label="Baseline numérico (opcional)" htmlFor="goal-baseline">
              <Input id="goal-baseline" inputMode="decimal" value={baselineValue} onChange={(event) => setBaselineValue(event.target.value)} placeholder="Ex.: 20" />
            </Field>
            <Field label="Alvo numérico (opcional)" htmlFor="goal-target-value">
              <Input id="goal-target-value" inputMode="decimal" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} placeholder="Ex.: 80" />
            </Field>
            <Field label="Unidade dos valores" htmlFor="goal-unit">
              <Input id="goal-unit" value={unit} onChange={(event) => setUnit(event.target.value.slice(0, 40))} placeholder="%, episódios/dia, minutos..." />
            </Field>
            <Field label="Método de medida" htmlFor="goal-method">
              <Input id="goal-method" value={measurementMethod} onChange={(event) => setMeasurementMethod(event.target.value.slice(0, 500))} placeholder="Observação estruturada, instrumento, registro funcional..." />
            </Field>
            <Field className="sm:col-span-2" label="Critério de sucesso" htmlFor="goal-criterion">
              <Textarea id="goal-criterion" rows={2} value={successCriterion} onChange={(event) => setSuccessCriterion(event.target.value.slice(0, 1000))} placeholder="Critério clínico mensurável e revisado pelo profissional" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createGoalMutation.isPending}>Cancelar</Button>
            <Button type="button" onClick={() => createGoalMutation.mutate()} disabled={!target.trim() || createGoalMutation.isPending}>
              {createGoalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(measureGoal)} onOpenChange={(open) => { if (!open) setMeasureGoal(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar medida de evolução</DialogTitle>
            <DialogDescription>{measureGoal?.plan.data.target}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Medida" htmlFor="goal-measure-label">
              <Input id="goal-measure-label" value={measureLabel} onChange={(event) => setMeasureLabel(event.target.value.slice(0, 240))} placeholder="Ex.: percentual de respostas independentes" />
            </Field>
            <Field label="Valor numérico" htmlFor="goal-measure-value">
              <Input id="goal-measure-value" inputMode="decimal" value={measureValue} onChange={(event) => setMeasureValue(event.target.value)} placeholder="Opcional" />
            </Field>
            <Field label="Unidade" htmlFor="goal-measure-unit">
              <Input id="goal-measure-unit" value={measureUnit} onChange={(event) => setMeasureUnit(event.target.value.slice(0, 40))} placeholder="%, minutos, episódios..." />
            </Field>
            <Field label="Contexto" htmlFor="goal-measure-context">
              <select id="goal-measure-context" value={measureContext} onChange={(event) => setMeasureContext(event.target.value as OutcomeContext)} className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(outcomeContextLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Direção observada" htmlFor="goal-measure-direction">
              <select id="goal-measure-direction" value={measureDirection} onChange={(event) => setMeasureDirection(event.target.value as OutcomeDirection)} className="min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {Object.entries(directionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field className="sm:col-span-2" label="Observação qualitativa" htmlFor="goal-measure-text">
              <Textarea id="goal-measure-text" rows={2} value={measureText} onChange={(event) => setMeasureText(event.target.value.slice(0, 1000))} placeholder="Opcional; pode ser usada sem valor numérico" />
            </Field>
            <Field className="sm:col-span-2" label="Nota / contexto adicional" htmlFor="goal-measure-note">
              <Textarea id="goal-measure-note" rows={2} value={measureNote} onChange={(event) => setMeasureNote(event.target.value.slice(0, 5000))} placeholder="Registre apenas o que foi observado ou medido" />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMeasureGoal(null)} disabled={measurementMutation.isPending}>Cancelar</Button>
            <Button
              type="button"
              onClick={() => measurementMutation.mutate()}
              disabled={measurementMutation.isPending || (!measureValue.trim() && !measureText.trim())}
            >
              {measurementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar medida
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="border-card-border">
      <CardContent className="flex items-start justify-between gap-3 p-3">
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold">{value}</p>
        </div>
        <span className="rounded-lg border border-border p-2 text-muted-foreground">{icon}</span>
      </CardContent>
    </Card>
  );
}

function GoalDatum({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

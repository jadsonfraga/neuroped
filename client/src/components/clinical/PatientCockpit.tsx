import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, Pill, Stethoscope } from "lucide-react";
import type { ClinicalEvent } from "@shared/clinical-core";
import { TherapyGoalsPanel } from "@/components/clinical/TherapyGoalsPanel";
import { RemoteIntakePanel } from "@/components/clinical/RemoteIntakePanel";

interface PatientCockpitProps {
  patientId: string;
  scaleCount: number | null;
}

interface ClinicalCoreResponse {
  data: ClinicalEvent[];
  total: number;
  mode?: string;
}

interface ConsultationRecord {
  id: string;
  date: string;
}

interface ConsultationResponse {
  data: ConsultationRecord[];
  total: number;
  mode?: string;
}

interface ConectaResponse {
  data: Array<{ id: string; occurredAt?: string; occurred_at?: string }>;
  total: number;
  mode?: string;
}

const eventTypeLabel: Record<ClinicalEvent["eventType"], string> = {
  encounter: "Consulta",
  problem: "Problema clínico",
  medication: "Medicação",
  observation: "Achado",
  plan: "Plano",
  outcome: "Desfecho",
  safety: "Segurança",
};

const provenanceLabel: Record<ClinicalEvent["provenance"]["kind"], string> = {
  reported: "Relatado",
  observed: "Observado",
  measured: "Medido",
  documented: "Documento",
  inferred: "Inferência",
  decision: "Decisão",
};

const medicationActionLabel = {
  reported_use: "uso relatado",
  start: "início registrado",
  continue: "manutenção registrada",
  adjust: "ajuste registrado",
  hold: "pausa registrada",
  stop: "suspensão registrada",
} as const;

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function latestBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return [...items]
    .sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .filter((item) => {
      const value = key(item);
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function eventHeadline(event: ClinicalEvent): string {
  switch (event.eventType) {
    case "encounter":
      return event.data.reason || event.data.encounterType;
    case "problem":
      return event.data.label;
    case "medication":
      return `${event.data.genericName} · ${medicationActionLabel[event.data.action]}`;
    case "observation":
      return `${event.data.domain} · ${event.data.findingStatus}`;
    case "plan":
      return event.data.target;
    case "outcome":
      return `${event.data.measure}${event.data.direction ? ` · ${event.data.direction}` : ""}`;
    case "safety":
      return `${event.data.domain} · ${event.data.severity}`;
  }
}

export function PatientCockpit({ patientId, scaleCount }: PatientCockpitProps) {
  const coreQuery = useQuery<ClinicalCoreResponse>({
    queryKey: [`/api/clinical-core/events?patient_id=${encodeURIComponent(patientId)}&days=3650`],
    enabled: Boolean(patientId),
  });
  const consultationQuery = useQuery<ConsultationResponse>({
    queryKey: [`/api/consultations?patient_id=${encodeURIComponent(patientId)}`],
    enabled: Boolean(patientId),
  });
  const conectaQuery = useQuery<ConectaResponse>({
    queryKey: [`/api/conecta/events?patient_id=${encodeURIComponent(patientId)}&days=90`],
    enabled: Boolean(patientId),
  });

  const coreEvents = coreQuery.data?.data;
  const events = useMemo(() => coreEvents ?? [], [coreEvents]);
  const latestProblems = useMemo(
    () =>
      latestBy(
        events.filter((event): event is Extract<ClinicalEvent, { eventType: "problem" }> =>
          event.eventType === "problem" && event.status === "active",
        ),
        (event) => event.data.code || event.data.label.toLocaleLowerCase("pt-BR"),
      ),
    [events],
  );
  const activeProblems = latestProblems.filter(
    (event) => event.data.status === "active" && event.data.certainty !== "ruled_out",
  );

  const latestMedications = useMemo(
    () =>
      latestBy(
        events.filter((event): event is Extract<ClinicalEvent, { eventType: "medication" }> =>
          event.eventType === "medication" && event.status === "active",
        ),
        (event) => event.data.genericName.toLocaleLowerCase("pt-BR"),
      ),
    [events],
  );
  const activeMedications = latestMedications.filter((event) =>
    ["reported_use", "start", "continue", "adjust"].includes(event.data.action),
  );

  const safetyEvents = useMemo(
    () =>
      events
        .filter(
          (event) =>
            event.status === "active" &&
            ((event.eventType === "safety" && event.data.status !== "resolved") ||
              (event.eventType === "observation" && event.data.redFlag === true)),
        )
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    [events],
  );

  const recentEvents = useMemo(
    () =>
      [...events]
        .filter((event) => event.status === "active")
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 6),
    [events],
  );

  const consultations = consultationQuery.data?.data ?? [];
  const latestConsultation = [...consultations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
  const coreUnavailable = coreQuery.isError;

  return (
    <section className="space-y-4" data-testid="patient-cockpit">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Clinical OS
          </p>
          <h2 className="text-lg font-bold text-foreground">Cockpit do paciente</h2>
        </div>
        <p className="max-w-xl text-xs text-muted-foreground">
          Síntese operacional baseada apenas nos registros disponíveis. Ausência de registro não é interpretada como normalidade.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Problemas ativos"
          value={coreUnavailable ? "—" : String(activeProblems.length)}
          detail={coreUnavailable ? "Clinical Core indisponível" : "hipóteses/problemas estruturados"}
          icon={<Stethoscope className="h-4 w-4" />}
        />
        <SummaryCard
          label="Medicações em uso"
          value={coreUnavailable ? "—" : String(activeMedications.length)}
          detail="conforme registros estruturados"
          icon={<Pill className="h-4 w-4" />}
        />
        <SummaryCard
          label="Red flags abertas"
          value={coreUnavailable ? "—" : String(safetyEvents.length)}
          detail="exigem revisão clínica, não inferência automática"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <SummaryCard
          label="Eventos longitudinais"
          value={coreUnavailable ? "—" : String(events.length)}
          detail="com proveniência explícita"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <RemoteIntakePanel patientId={patientId} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-card-border">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">Foco clínico atual</p>
                <p className="text-xs text-muted-foreground">Problemas e medicações derivados do último evento de cada item.</p>
              </div>
              <Badge variant="secondary">revisão humana</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problemas</p>
              {coreUnavailable ? (
                <UnavailableCopy />
              ) : activeProblems.length === 0 ? (
                <EmptyCopy text="Nenhum problema ativo estruturado registrado." />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeProblems.slice(0, 8).map((event) => (
                    <Badge key={event.id} variant="outline" className="max-w-full whitespace-normal text-left">
                      {event.data.label}
                      {event.data.certainty !== "confirmed" ? ` · ${event.data.certainty}` : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Medicações</p>
              {coreUnavailable ? (
                <UnavailableCopy />
              ) : activeMedications.length === 0 ? (
                <EmptyCopy text="Nenhuma medicação em uso estruturada no Clinical Core." />
              ) : (
                <div className="space-y-2">
                  {activeMedications.slice(0, 8).map((event) => (
                    <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{event.data.genericName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[event.data.doseMg != null ? `${event.data.doseMg} mg` : null, event.data.frequency]
                            .filter(Boolean)
                            .join(" · ") || "Dose/frequência não estruturadas"}
                        </p>
                      </div>
                      <Badge variant="secondary">{medicationActionLabel[event.data.action]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardContent className="space-y-4 p-4">
            <div>
              <p className="text-sm font-bold">Continuidade do cuidado</p>
              <p className="text-xs text-muted-foreground">Cobertura dos principais fluxos do produto.</p>
            </div>
            <ContinuityRow label="Última consulta" value={latestConsultation ? formatDate(latestConsultation.date) : "Sem consulta registrada"} />
            <ContinuityRow label="Conecta · últimos 90 dias" value={conectaQuery.isError ? "Indisponível" : `${conectaQuery.data?.total ?? 0} registros`} />
            <ContinuityRow
              label="Escalas vinculadas"
              value={scaleCount === null ? "Indisponível" : `${scaleCount} aplicações`}
            />
            <ContinuityRow label="Clinical Core" value={coreUnavailable ? "Indisponível" : `${events.length} eventos`} />
          </CardContent>
        </Card>
      </div>

      <TherapyGoalsPanel patientId={patientId} events={events} unavailable={coreUnavailable} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-card-border">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-bold">Linha clínica recente</p>
              <p className="text-xs text-muted-foreground">Cada item mantém tipo, data e proveniência.</p>
            </div>
            {coreUnavailable ? (
              <UnavailableCopy />
            ) : recentEvents.length === 0 ? (
              <EmptyCopy text="A linha clínica estruturada começa a partir dos próximos registros." />
            ) : (
              <ol className="space-y-3">
                {recentEvents.map((event) => (
                  <li key={event.id} className="border-l-2 border-border pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{eventTypeLabel[event.eventType]}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</span>
                      <span className="text-xs text-muted-foreground">· {provenanceLabel[event.provenance.kind]}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{eventHeadline(event)}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm font-bold">Segurança</p>
            </div>
            {coreUnavailable ? (
              <UnavailableCopy />
            ) : safetyEvents.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                Nenhum red flag estruturado está aberto. Isso não confirma ausência de risco; revise a avaliação clínica e os dados ainda não registrados.
              </p>
            ) : (
              <div className="space-y-2">
                {safetyEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="destructive">revisar</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(event.occurredAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{eventHeadline(event)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Fonte: {event.provenance.source}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <Card className="border-card-border">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-lg border border-border p-2 text-muted-foreground">{icon}</div>
      </CardContent>
    </Card>
  );
}

function ContinuityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-right">{value}</span>
    </div>
  );
}

function EmptyCopy({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">{text}</p>;
}

function UnavailableCopy() {
  return <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Clinical Core indisponível neste ambiente; nenhum dado clínico foi simulado.</p>;
}

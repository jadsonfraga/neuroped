import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Bell,
  CalendarDays,
  Clock3,
  Download,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AGENDA_TIMEZONE,
  agendaStatusLabels,
  agendaVisitLabels,
  appointmentEndTime,
  buildAppointmentReminder,
  buildPrivateAppointmentIcs,
  createAgendaAppointment,
  createAgendaBlock,
  createWaitlistItem,
  emptyAgendaWorkspace,
  findAppointmentConflicts,
  findBlockConflicts,
  formatAgendaDate,
  loadAgendaWorkspace,
  preferredPeriodLabels,
  saveAgendaWorkspace,
  sortAgendaAppointments,
  waitlistStatusLabels,
  type AgendaAppointment,
  type AgendaStatus,
  type AgendaVisitType,
  type AgendaWaitlistItem,
  type AgendaWorkspace,
  type PreferredPeriod,
  type WaitlistStatus,
} from "@/lib/agendaCore";

const fieldClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const textareaClass =
  "min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function agendaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AGENDA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

interface AppointmentFormState {
  patientLabel: string;
  guardianLabel: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  visitType: AgendaVisitType;
  operationalNote: string;
}

interface BlockFormState {
  date: string;
  startTime: string;
  endTime: string;
  label: string;
}

interface WaitlistFormState {
  patientLabel: string;
  guardianLabel: string;
  visitType: AgendaVisitType;
  preferredPeriod: PreferredPeriod;
  availabilityNote: string;
}

function initialAppointment(date: string): AppointmentFormState {
  return {
    patientLabel: "",
    guardianLabel: "",
    date,
    startTime: "08:00",
    durationMinutes: "60",
    visitType: "primeira-consulta",
    operationalNote: "",
  };
}

function initialBlock(date: string): BlockFormState {
  return { date, startTime: "12:00", endTime: "13:00", label: "Indisponível" };
}

const initialWaitlist: WaitlistFormState = {
  patientLabel: "",
  guardianLabel: "",
  visitType: "retorno",
  preferredPeriod: "qualquer",
  availabilityNote: "",
};

function statusBadgeClass(status: AgendaStatus): string {
  if (status === "confirmado") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "aguardando" || status === "em-atendimento") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  if (status === "faltou" || status === "cancelado") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  if (status === "concluido") return "border-primary/30 bg-primary/10 text-primary";
  return "border-border bg-muted/40 text-muted-foreground";
}

export function AgendaBoard() {
  const [workspace, setWorkspace] = useState<AgendaWorkspace>(emptyAgendaWorkspace());
  const [selectedDate, setSelectedDate] = useState(agendaToday);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(() =>
    initialAppointment(agendaToday()),
  );
  const [blockForm, setBlockForm] = useState<BlockFormState>(() => initialBlock(agendaToday()));
  const [waitlistForm, setWaitlistForm] = useState<WaitlistFormState>(initialWaitlist);
  const [prefilledWaitlistId, setPrefilledWaitlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void loadAgendaWorkspace().then((loaded) => {
      if (!active) return;
      setWorkspace(loaded);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const dayAppointments = useMemo(
    () => sortAgendaAppointments(workspace.appointments.filter((item) => item.date === selectedDate)),
    [selectedDate, workspace.appointments],
  );
  const dayBlocks = useMemo(
    () =>
      workspace.blocks
        .filter((item) => item.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [selectedDate, workspace.blocks],
  );
  const activeWaitlist = useMemo(
    () => [...workspace.waitlist].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [workspace.waitlist],
  );

  async function persist(next: AgendaWorkspace, successMessage?: string): Promise<boolean> {
    setError("");
    setNotice("");
    const stored = await saveAgendaWorkspace(next);
    if (!stored) {
      setError(
        "Não foi possível salvar a agenda cifrada neste dispositivo. Nenhuma alteração visual foi confirmada.",
      );
      return false;
    }
    setWorkspace(next);
    if (successMessage) setNotice(successMessage);
    return true;
  }

  function selectDate(value: string) {
    setSelectedDate(value);
    setAppointmentForm((current) => ({ ...current, date: value }));
    setBlockForm((current) => ({ ...current, date: value }));
  }

  async function addAppointment(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const appointment = createAgendaAppointment({
        patientLabel: appointmentForm.patientLabel,
        ...(appointmentForm.guardianLabel.trim()
          ? { guardianLabel: appointmentForm.guardianLabel }
          : {}),
        date: appointmentForm.date,
        startTime: appointmentForm.startTime,
        durationMinutes: Number(appointmentForm.durationMinutes),
        visitType: appointmentForm.visitType,
        status: "agendado",
        ...(appointmentForm.operationalNote.trim()
          ? { operationalNote: appointmentForm.operationalNote }
          : {}),
      });
      const conflicts = findAppointmentConflicts(appointment, workspace);
      if (conflicts.length > 0) {
        setError(
          `Conflito de horário: ${conflicts.map((item) => item.label).join("; ")}. Ajuste o horário antes de salvar.`,
        );
        return;
      }

      const now = new Date().toISOString();
      const waitlist = prefilledWaitlistId
        ? workspace.waitlist.map((item) =>
            item.id === prefilledWaitlistId
              ? { ...item, status: "agendado" as const, updatedAt: now }
              : item,
          )
        : workspace.waitlist;
      const next: AgendaWorkspace = {
        ...workspace,
        appointments: [...workspace.appointments, appointment],
        waitlist,
      };
      if (await persist(next, "Horário salvo na agenda local cifrada.")) {
        setSelectedDate(appointment.date);
        setAppointmentForm(initialAppointment(appointment.date));
        setPrefilledWaitlistId(null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o agendamento.");
    }
  }

  async function updateAppointmentStatus(appointment: AgendaAppointment, status: AgendaStatus) {
    const now = new Date().toISOString();
    await persist({
      ...workspace,
      appointments: workspace.appointments.map((item) =>
        item.id === appointment.id ? { ...item, status, updatedAt: now } : item,
      ),
    });
  }

  async function addBlock(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const block = createAgendaBlock(blockForm);
      const conflicts = findBlockConflicts(block, workspace);
      if (conflicts.length > 0) {
        setError(`O bloqueio conflita com: ${conflicts.map((item) => item.label).join("; ")}.`);
        return;
      }
      const next = { ...workspace, blocks: [...workspace.blocks, block] };
      if (await persist(next, "Bloqueio registrado.")) setBlockForm(initialBlock(block.date));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o bloqueio.");
    }
  }

  async function removeBlock(blockId: string) {
    await persist(
      { ...workspace, blocks: workspace.blocks.filter((item) => item.id !== blockId) },
      "Bloqueio removido.",
    );
  }

  async function addWaitlist(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const item = createWaitlistItem(waitlistForm);
      const next = { ...workspace, waitlist: [...workspace.waitlist, item] };
      if (await persist(next, "Paciente incluído na lista de espera.")) {
        setWaitlistForm(initialWaitlist);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível incluir na lista de espera.");
    }
  }

  async function updateWaitlistStatus(item: AgendaWaitlistItem, status: WaitlistStatus) {
    const now = new Date().toISOString();
    await persist({
      ...workspace,
      waitlist: workspace.waitlist.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status, updatedAt: now } : candidate,
      ),
    });
  }

  async function prefillFromWaitlist(item: AgendaWaitlistItem) {
    setAppointmentForm((current) => ({
      ...current,
      patientLabel: item.patientLabel,
      guardianLabel: item.guardianLabel ?? "",
      visitType: item.visitType,
    }));
    setPrefilledWaitlistId(item.id);
    await updateWaitlistStatus(item, "ofertado");
    setNotice(
      "Dados operacionais trazidos da lista de espera. Escolha data e horário e salve o encaixe.",
    );
  }

  async function copyReminder(appointment: AgendaAppointment) {
    try {
      await navigator.clipboard.writeText(buildAppointmentReminder(appointment));
      setNotice(
        "Lembrete copiado. O envio continua manual; nenhuma mensagem foi disparada pelo NeuroPed.",
      );
    } catch {
      setError("Não foi possível copiar o lembrete neste navegador.");
    }
  }

  function downloadIcs(appointment: AgendaAppointment) {
    const blob = new Blob([buildPrivateAppointmentIcs(appointment)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `neuroped-${appointment.date}-${appointment.startTime.replace(":", "")}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
    setNotice("Arquivo .ics criado sem nome do paciente nem informação clínica.");
  }

  const activeAppointments = dayAppointments.filter((item) => item.status !== "cancelado");
  const confirmed = dayAppointments.filter((item) => item.status === "confirmado").length;
  const waiting = dayAppointments.filter((item) => item.status === "aguardando").length;
  const waitingListCount = activeWaitlist.filter((item) => item.status !== "agendado").length;

  return (
    <section className="space-y-4" aria-labelledby="agenda-neuroped-title">
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-chart-2/[0.08]">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2 rounded-full">
                  agenda · operação neuropediátrica
                </Badge>
                <h2 id="agenda-neuroped-title" className="text-xl font-black tracking-tight text-foreground">
                  Agenda NeuroPed
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Horários, status, bloqueios e lista de espera integrados à recepção. A agenda organiza o atendimento; dados clínicos continuam no prontuário e no Clinical Core.
                </p>
              </div>
            </div>
            <label className="min-w-52 text-xs font-bold text-muted-foreground">
              Dia em foco
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => selectDate(event.target.value)}
                className={`${fieldClass} mt-1`}
                aria-label="Dia da agenda"
              />
            </label>
          </div>

          <div className="flex gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] p-3 text-xs leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <p>
              <strong className="text-foreground">Escopo seguro desta versão:</strong> armazenamento local cifrado neste dispositivo, sem sincronização automática com servidor. Use apenas identificação mínima e notas operacionais. Não registre diagnóstico, medicação, laudo ou informação clínica sensível na agenda.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-primary/20 bg-primary/[0.07] p-3 text-xs text-foreground">
          {notice}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Atendimentos" value={loading ? "—" : String(activeAppointments.length)} icon={<CalendarDays className="h-4 w-4" />} />
        <Metric label="Confirmados" value={loading ? "—" : String(confirmed)} icon={<ShieldCheck className="h-4 w-4" />} />
        <Metric label="Aguardando" value={loading ? "—" : String(waiting)} icon={<Clock3 className="h-4 w-4" />} />
        <Metric label="Bloqueios" value={loading ? "—" : String(dayBlocks.length)} icon={<Ban className="h-4 w-4" />} />
        <Metric label="Lista de espera" value={loading ? "—" : String(waitingListCount)} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-black text-foreground">{formatAgendaDate(selectedDate)}</p>
                <p className="text-xs text-muted-foreground">Fluxo do dia e status operacional.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/pre-consulta">Abrir pré-consulta</Link>
              </Button>
            </div>

            {loading ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground" role="status">
                Carregando agenda cifrada…
              </p>
            ) : dayAppointments.length === 0 && dayBlocks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Nenhum atendimento ou bloqueio neste dia.
              </p>
            ) : (
              <div className="space-y-2">
                {dayBlocks.map((block) => (
                  <div key={block.id} className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Ban className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">{block.startTime}–{block.endTime} · {block.label}</p>
                        <p className="text-xs text-muted-foreground">Horário indisponível</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void removeBlock(block.id)}>
                      Remover
                    </Button>
                  </div>
                ))}

                {dayAppointments.map((appointment) => (
                  <article key={appointment.id} className="rounded-2xl border border-border bg-background p-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-foreground">
                            {appointment.startTime}–{appointmentEndTime(appointment)}
                          </p>
                          <Badge variant="outline" className={statusBadgeClass(appointment.status)}>
                            {agendaStatusLabels[appointment.status]}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-sm font-bold text-foreground">
                          <UserRound className="h-3.5 w-3.5" />
                          {appointment.patientLabel}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agendaVisitLabels[appointment.visitType]} · {appointment.durationMinutes} min
                          {appointment.guardianLabel ? ` · responsável: ${appointment.guardianLabel}` : ""}
                        </p>
                        {appointment.operationalNote && (
                          <p className="mt-1 text-xs text-muted-foreground">Operacional: {appointment.operationalNote}</p>
                        )}
                      </div>
                      <label className="text-[11px] font-bold text-muted-foreground">
                        Status
                        <select
                          value={appointment.status}
                          onChange={(event) =>
                            void updateAppointmentStatus(appointment, event.target.value as AgendaStatus)
                          }
                          className={`${fieldClass} mt-1 min-w-40`}
                          aria-label={`Status do agendamento de ${appointment.patientLabel}`}
                        >
                          {Object.entries(agendaStatusLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void copyReminder(appointment)}>
                        <Bell className="h-3.5 w-3.5" />Copiar lembrete
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => downloadIcs(appointment)}>
                        <Download className="h-3.5 w-3.5" />Exportar .ics
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-black text-foreground">Novo horário</p>
              <p className="text-xs text-muted-foreground">
                Conflitos com consultas e bloqueios são recusados antes de salvar.
              </p>
            </div>
            <form className="space-y-3" onSubmit={addAppointment}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Paciente / código interno">
                  <input required maxLength={80} value={appointmentForm.patientLabel} onChange={(event) => setAppointmentForm((form) => ({ ...form, patientLabel: event.target.value }))} className={fieldClass} />
                </Field>
                <Field label="Responsável (opcional)">
                  <input maxLength={80} value={appointmentForm.guardianLabel} onChange={(event) => setAppointmentForm((form) => ({ ...form, guardianLabel: event.target.value }))} className={fieldClass} />
                </Field>
                <Field label="Data">
                  <input required type="date" value={appointmentForm.date} onChange={(event) => setAppointmentForm((form) => ({ ...form, date: event.target.value }))} className={fieldClass} />
                </Field>
                <Field label="Horário">
                  <input required type="time" value={appointmentForm.startTime} onChange={(event) => setAppointmentForm((form) => ({ ...form, startTime: event.target.value }))} className={fieldClass} />
                </Field>
                <Field label="Duração">
                  <select value={appointmentForm.durationMinutes} onChange={(event) => setAppointmentForm((form) => ({ ...form, durationMinutes: event.target.value }))} className={fieldClass}>
                    {[30, 45, 60, 90, 120].map((value) => <option key={value} value={value}>{value} min</option>)}
                  </select>
                </Field>
                <Field label="Tipo de atendimento">
                  <select value={appointmentForm.visitType} onChange={(event) => setAppointmentForm((form) => ({ ...form, visitType: event.target.value as AgendaVisitType }))} className={fieldClass}>
                    {Object.entries(agendaVisitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Observação operacional — não inserir conteúdo clínico">
                <textarea maxLength={160} value={appointmentForm.operationalNote} onChange={(event) => setAppointmentForm((form) => ({ ...form, operationalNote: event.target.value }))} className={textareaClass} placeholder="Ex.: chegar 15 min antes; trazer documento já solicitado." />
              </Field>
              {prefilledWaitlistId && (
                <p className="text-xs text-primary">Encaixe iniciado a partir da lista de espera.</p>
              )}
              <Button type="submit" className="w-full gap-2">
                <Plus className="h-4 w-4" />Salvar horário
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-black text-foreground">Bloqueios de agenda</p>
              <p className="text-xs text-muted-foreground">
                Intervalo, reunião ou indisponibilidade. Um bloqueio não pode sobrepor consulta existente.
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={addBlock}>
              <Field label="Data">
                <input required type="date" value={blockForm.date} onChange={(event) => setBlockForm((form) => ({ ...form, date: event.target.value }))} className={fieldClass} />
              </Field>
              <Field label="Motivo operacional">
                <input required maxLength={80} value={blockForm.label} onChange={(event) => setBlockForm((form) => ({ ...form, label: event.target.value }))} className={fieldClass} />
              </Field>
              <Field label="Início">
                <input required type="time" value={blockForm.startTime} onChange={(event) => setBlockForm((form) => ({ ...form, startTime: event.target.value }))} className={fieldClass} />
              </Field>
              <Field label="Fim">
                <input required type="time" value={blockForm.endTime} onChange={(event) => setBlockForm((form) => ({ ...form, endTime: event.target.value }))} className={fieldClass} />
              </Field>
              <Button type="submit" variant="outline" className="gap-2 sm:col-span-2">
                <Ban className="h-4 w-4" />Criar bloqueio
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="text-sm font-black text-foreground">Lista de espera / encaixes</p>
              <p className="text-xs text-muted-foreground">
                Fila operacional simples para aproveitar horários liberados sem prometer disponibilidade automática.
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={addWaitlist}>
              <Field label="Paciente / código">
                <input required maxLength={80} value={waitlistForm.patientLabel} onChange={(event) => setWaitlistForm((form) => ({ ...form, patientLabel: event.target.value }))} className={fieldClass} />
              </Field>
              <Field label="Responsável (opcional)">
                <input maxLength={80} value={waitlistForm.guardianLabel} onChange={(event) => setWaitlistForm((form) => ({ ...form, guardianLabel: event.target.value }))} className={fieldClass} />
              </Field>
              <Field label="Atendimento">
                <select value={waitlistForm.visitType} onChange={(event) => setWaitlistForm((form) => ({ ...form, visitType: event.target.value as AgendaVisitType }))} className={fieldClass}>
                  {Object.entries(agendaVisitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Preferência">
                <select value={waitlistForm.preferredPeriod} onChange={(event) => setWaitlistForm((form) => ({ ...form, preferredPeriod: event.target.value as PreferredPeriod }))} className={fieldClass}>
                  {Object.entries(preferredPeriodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Disponibilidade operacional">
                  <input maxLength={160} value={waitlistForm.availabilityNote} onChange={(event) => setWaitlistForm((form) => ({ ...form, availabilityNote: event.target.value }))} className={fieldClass} placeholder="Ex.: consegue chegar com 2 h de antecedência." />
                </Field>
              </div>
              <Button type="submit" variant="outline" className="gap-2 sm:col-span-2">
                <Users className="h-4 w-4" />Adicionar à lista
              </Button>
            </form>

            <div className="space-y-2 pt-1">
              {activeWaitlist.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Lista de espera vazia.
                </p>
              ) : (
                activeWaitlist.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{item.patientLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {agendaVisitLabels[item.visitType]} · {preferredPeriodLabels[item.preferredPeriod]}
                        </p>
                        {item.availabilityNote && (
                          <p className="mt-1 text-xs text-muted-foreground">{item.availabilityNote}</p>
                        )}
                      </div>
                      <Badge variant="outline">{waitlistStatusLabels[item.status]}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.status !== "agendado" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void prefillFromWaitlist(item)}
                        >
                          Usar para encaixe
                        </Button>
                      )}
                      <select
                        aria-label={`Status da lista de espera de ${item.patientLabel}`}
                        value={item.status}
                        onChange={(event) =>
                          void updateWaitlistStatus(item, event.target.value as WaitlistStatus)
                        }
                        className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                      >
                        {Object.entries(waitlistStatusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Não há envio automático de WhatsApp/SMS, integração OAuth com Google Calendar, pagamento ou telemedicina embutida nesta versão. “Copiar lembrete” apenas copia texto; “Exportar .ics” apenas cria um arquivo de calendário sem identificação do paciente.
      </p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs font-bold text-muted-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
          <p className="text-xl font-black text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

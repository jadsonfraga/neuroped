import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  History,
  ListPlus,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  formatMoneyBRL,
  minutesToClock,
  type Appointment,
  type AppointmentStatus,
  type OperationsDashboard,
} from "@shared/operations";

const DASHBOARD_KEY = "/api/operations?resource=dashboard";
const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const scheduleRows = Array.from({ length: 27 }, (_, index) => {
  const total = 7 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

function localDateInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

const statusLabel: Record<AppointmentStatus, string> = {
  requested: "solicitada",
  confirmed: "confirmada",
  checked_in: "check-in",
  in_care: "em atendimento",
  completed: "concluída",
  cancelled: "cancelada",
  no_show: "faltou",
};

const nextStatuses: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  requested: ["confirmed", "cancelled", "no_show"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["in_care", "cancelled"],
  in_care: ["completed"],
};

function toMinute(value: string): number | null {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hour, minute] = value.split(":").map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function dateTimeLabel(value: string): string {
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} · ${time}`;
}

function auditDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Recife",
  }).format(date);
}

function auditActionLabel(value: string): string {
  const labels: Record<string, string> = {
    create_appointment: "agendamento criado",
    appointment_status: "status da consulta alterado",
    appointment_payment: "financeiro atualizado",
    waitlist_status: "lista de espera alterada",
    notification_status: "comunicação atualizada",
    create_service: "serviço criado",
    update_service: "serviço alterado",
    create_rule: "disponibilidade criada",
    delete_rule: "disponibilidade removida",
    create_block: "bloqueio criado",
    delete_block: "bloqueio removido",
    upsert_profile: "perfil público alterado",
    review_moderate: "avaliação moderada",
    staff_link: "recepção vinculada",
    staff_active: "vínculo da recepção alterado",
  };
  return labels[value] ?? value;
}

export default function AgendaPage() {
  const { toast } = useToast();
  const dashboard = useQuery<OperationsDashboard>({ queryKey: [DASHBOARD_KEY] });
  const data = dashboard.data;
  const [patientSearch, setPatientSearch] = useState("");
  const patientSearchParam = encodeURIComponent(patientSearch.trim());
  const patientsQuery = useQuery<{ data: Array<{ id: string; name: string; birthDate?: string | null }>; total?: number }>({
    queryKey: [`/api/patients?limit=50&page=1&q=${patientSearchParam}`],
    enabled: Boolean(data?.access.canConfigure),
    staleTime: 30_000,
  });
  const patientOptions = patientsQuery.data?.data ?? [];
  const [busy, setBusy] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [agendaDate, setAgendaDate] = useState(localDateInput);

  const [profile, setProfile] = useState({
    displayName: "",
    specialty: "Neuropediatria",
    locationLabel: "",
    slug: "",
    timezone: "America/Recife",
  });
  useEffect(() => {
    if (!data?.profile) return;
    setProfile({
      displayName: data.profile.displayName,
      specialty: data.profile.specialty,
      locationLabel: data.profile.locationLabel ?? "",
      slug: data.profile.slug,
      timezone: data.profile.timezone,
    });
  }, [data?.profile]);

  const [service, setService] = useState({ name: "", duration: "60", price: "", modality: "in_person" });
  const [rule, setRule] = useState({ weekday: "1", start: "08:00", end: "12:00", slot: "30" });
  const [block, setBlock] = useState({ start: "", end: "", reason: "" });
  const [manual, setManual] = useState({ serviceId: "", startsAtLocal: "", patientId: "", guardianName: "", patientName: "", phone: "", email: "" });

  async function mutate(payload: Record<string, unknown>, success: string): Promise<boolean> {
    setBusy(true);
    try {
      await apiRequest("POST", "/api/operations", payload);
    } catch (error) {
      toast({ title: "Não foi possível concluir.", description: String(error), variant: "destructive" });
      setBusy(false);
      return false;
    }

    try {
      await queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
      const refreshed = await dashboard.refetch();
      if (refreshed.isError) throw refreshed.error ?? new Error("Falha ao atualizar a agenda.");
      toast({ title: success });
    } catch (error) {
      // A mutação já foi persistida. Não rotular uma falha de atualização da UI
      // como falha transacional, pois isso pode induzir o usuário a repetir a ação.
      toast({
        title: success,
        description: `A alteração foi salva, mas a tela não conseguiu atualizar agora. Use “Tentar novamente” se necessário. (${String(error)})`,
      });
    } finally {
      setBusy(false);
    }
    return true;
  }

  const upcoming = useMemo(
    () => [...(data?.appointments ?? [])]
      .filter((item) => !["completed", "cancelled", "no_show"].includes(item.status))
      .sort((a, b) => a.startsAtLocal.localeCompare(b.startsAtLocal)),
    [data?.appointments],
  );

  const dayAppointments = useMemo(
    () => (data?.appointments ?? [])
      .filter((item) => item.startsAtLocal.startsWith(`${agendaDate}T`))
      .filter((item) => !["cancelled", "no_show"].includes(item.status))
      .sort((a, b) => a.startsAtLocal.localeCompare(b.startsAtLocal)),
    [data?.appointments, agendaDate],
  );
  const appointmentsByTime = useMemo(
    () => new Map(dayAppointments.map((item) => [item.startsAtLocal.slice(11, 16), item] as const)),
    [dayAppointments],
  );

  if (dashboard.isLoading) {
    return <div className="rounded-3xl border p-8 text-sm text-muted-foreground" role="status">Carregando Agenda NeuroPed…</div>;
  }
  if (dashboard.isError || !data) {
    const detail = dashboard.error instanceof Error ? dashboard.error.message : "";
    return (
      <div className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold">Agenda temporariamente indisponível</h1>
        <p className="text-sm text-muted-foreground">
          {detail.includes("STAFF_LINK_REQUIRED")
            ? "Esta conta da recepção ainda precisa ser vinculada pelo profissional responsável na aba Equipe da Agenda & Gestão."
            : detail.includes("401") || detail.includes("AUTH")
              ? "Sua sessão profissional não está disponível. Entre novamente para acessar a agenda persistente."
              : "Nenhum dado foi simulado. Verifique autenticação, vínculo de equipe e banco persistente."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(detail.includes("401") || detail.includes("AUTH")) && <Button asChild><Link href="/login">Entrar na área profissional</Link></Button>}
          <Button variant="outline" onClick={() => dashboard.refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const canConfigure = data.access.canConfigure;
  const publicHref = `/agendar?provider=${encodeURIComponent(data.profile.slug)}`;

  return (
    <div className="space-y-6 pb-16">
      <header className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">NeuroPed Operacional</Badge>
              {data.access.delegated && <Badge variant="outline">Recepção vinculada · {data.access.providerName}</Badge>}
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Agenda & Gestão</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Agenda cloud, autoagendamento, check-in, lista de espera e comunicação em uma única fonte. Configurações, reputação e financeiro permanecem restritos ao profissional responsável.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canConfigure && <Button asChild variant="outline" className="gap-2"><Link href={publicHref}><ExternalLink className="h-4 w-4" />Ver página pública</Link></Button>}
            <Button asChild className="gap-2"><Link href="/recepcao"><Users className="h-4 w-4" />Recepção</Link></Button>
          </div>
        </div>
      </header>

      {data.access.delegated && (
        <div className="flex gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p><strong className="text-foreground">Modo recepção:</strong> você opera a agenda do profissional vinculado. Valores financeiros, configuração do serviço e moderação de avaliações não são disponibilizados para este perfil.</p>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarClock} label="Hoje" value={String(data.metrics.today)} />
        <Metric icon={Clock3} label="Próximas" value={String(data.metrics.upcoming)} detail={`${data.metrics.requested} aguardando confirmação`} />
        {canConfigure
          ? <Metric icon={CircleDollarSign} label="Previsto" value={formatMoneyBRL(data.metrics.expectedCents)} detail={`Recebido: ${formatMoneyBRL(data.metrics.paidCents)}`} />
          : <Metric icon={Activity} label="Solicitadas" value={String(data.metrics.requested)} detail="aguardando ação da clínica" />}
        <Metric icon={ListPlus} label="Lista de espera" value={String(data.metrics.waitlist)} detail={`${data.metrics.noShow30d} faltas em 30 dias`} />
      </section>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="espera">Espera</TabsTrigger>
          <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
          <TabsTrigger value="atividade">Atividade</TabsTrigger>
          {canConfigure && <TabsTrigger value="config">Disponibilidade</TabsTrigger>}
          {canConfigure && <TabsTrigger value="publico">Página pública</TabsTrigger>}
          {canConfigure && <TabsTrigger value="equipe">Equipe</TabsTrigger>}
          {canConfigure && <TabsTrigger value="reputacao">Avaliações</TabsTrigger>}
          {canConfigure && <TabsTrigger value="financeiro">Financeiro</TabsTrigger>}
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Novo agendamento manual</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Serviço"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={manual.serviceId} onChange={(e) => setManual((p) => ({ ...p, serviceId: e.target.value }))}><option value="">Selecione</option>{data.services.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Data e horário"><Input type="datetime-local" value={manual.startsAtLocal} onChange={(e) => setManual((p) => ({ ...p, startsAtLocal: e.target.value }))} /></Field>
              {canConfigure && <Field label="Vincular paciente ao prontuário"><div className="space-y-2"><Input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar por nome ou identificador" aria-label="Buscar paciente para vínculo clínico" /><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={manual.patientId} onChange={(e) => { const patientId = e.target.value; const selected = patientOptions.find((item) => item.id === patientId); setManual((p) => ({ ...p, patientId, patientName: selected?.name ?? p.patientName })); }}><option value="">Sem vínculo clínico</option>{patientsQuery.isFetching && <option disabled>Buscando pacientes…</option>}{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select><p className="text-[11px] text-muted-foreground">{patientsQuery.data?.total ?? patientOptions.length} resultado(s) encontrado(s).</p></div></Field>}
              <Field label="Criança"><Input value={manual.patientName} onChange={(e) => setManual((p) => ({ ...p, patientName: e.target.value }))} placeholder="Nome" /></Field>
              <Field label="Responsável"><Input value={manual.guardianName} onChange={(e) => setManual((p) => ({ ...p, guardianName: e.target.value }))} /></Field>
              <Field label="Telefone"><Input value={manual.phone} onChange={(e) => setManual((p) => ({ ...p, phone: e.target.value }))} /></Field>
              <Field label="E-mail"><Input type="email" value={manual.email} onChange={(e) => setManual((p) => ({ ...p, email: e.target.value }))} /></Field>
              <div className="md:col-span-2 xl:col-span-3"><Button disabled={busy || !manual.serviceId || !manual.startsAtLocal} onClick={() => mutate({ action: "create_appointment", serviceId: manual.serviceId, startsAtLocal: manual.startsAtLocal, patientId: canConfigure ? manual.patientId || undefined : undefined, guardianName: manual.guardianName, patientName: manual.patientName, guardianPhone: manual.phone, guardianEmail: manual.email }, "Consulta adicionada à agenda.")} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Grade horária da agenda</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">Clique em um horário livre para preparar um novo agendamento. Os registros exibidos vêm do backend persistente.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="agenda-date" className="text-xs text-muted-foreground">Dia</Label>
                  <Input id="agenda-date" type="date" value={agendaDate} onChange={(e) => setAgendaDate(e.target.value)} className="w-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="grid grid-cols-[4.5rem_1fr] gap-2 border-b px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Hora</span><span>Paciente / situação</span>
              </div>
              <div className="max-h-[34rem] space-y-1 overflow-y-auto pr-1">
                {scheduleRows.map((time) => {
                  const appointment = appointmentsByTime.get(time);
                  const occupied = Boolean(appointment);
                  return (
                    <div
                      key={time}
                      role="button"
                      tabIndex={occupied ? -1 : 0}
                      onClick={() => {
                        if (occupied) return;
                        setManual((current) => ({ ...current, startsAtLocal: `${agendaDate}T${time}` }));
                      }}
                      onKeyDown={(event) => {
                        if (!occupied && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          setManual((current) => ({ ...current, startsAtLocal: `${agendaDate}T${time}` }));
                        }
                      }}
                      className={`grid min-h-11 grid-cols-[4.5rem_1fr] gap-2 rounded-xl border px-2 py-2 text-sm ${occupied ? "border-primary/30 bg-primary/5" : "cursor-pointer border-dashed hover:border-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/20"}`}
                    >
                      <span className="font-mono text-xs font-semibold text-muted-foreground">{time}</span>
                      {appointment ? (
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <strong className="truncate">{appointment.patientName || "Paciente não informado"}</strong>
                          <Badge variant="outline">{statusLabel[appointment.status]}</Badge>
                          <span className="text-xs text-muted-foreground">{appointment.serviceName || "Serviço"} · até {appointment.endsAtLocal.slice(11, 16)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Horário livre · selecionar para marcar</span>
                      )}
                    </div>
                  );
                })}
              </div>
              {dayAppointments.some((item) => !scheduleRows.includes(item.startsAtLocal.slice(11, 16))) && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Há consultas fora da grade padrão de 07:00–20:00 ou em minutos intermediários; elas continuam preservadas e aparecem na lista abaixo.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Próximas consultas</CardTitle><p className="text-xs text-muted-foreground">{upcoming.length} consulta(s) futura(s) carregada(s).</p></CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 ? <Empty text="Nenhuma consulta futura nesta agenda." /> : upcoming.map((apt) => (
                <div key={apt.id} className="rounded-2xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><strong>{apt.patientName || "Paciente não informado"}</strong><Badge variant="outline">{statusLabel[apt.status]}</Badge></div>
                      <p className="mt-1 text-sm text-muted-foreground">{dateTimeLabel(apt.startsAtLocal)} · {apt.serviceName || "Serviço"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{apt.guardianName || "Responsável não informado"}{apt.guardianPhone ? ` · ${apt.guardianPhone}` : ""}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {apt.patientId && <Button size="sm" variant="outline" asChild><Link href={`/prontuario?patientId=${encodeURIComponent(apt.patientId)}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Prontuário</Link></Button>}

                      {(nextStatuses[apt.status] ?? []).map((status) => <Button key={status} size="sm" variant={status === "cancelled" || status === "no_show" ? "outline" : "default"} disabled={busy} onClick={() => mutate({ action: "appointment_status", id: apt.id, status }, `Consulta: ${statusLabel[status]}.`)}>{statusLabel[status]}</Button>)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="espera">
          <Card><CardHeader><CardTitle className="text-base">Lista de espera</CardTitle></CardHeader><CardContent className="space-y-2">{data.waitlist.length === 0 ? <Empty text="Ninguém na lista de espera." /> : data.waitlist.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{item.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{item.serviceName} · {item.guardianName}{item.guardianPhone ? ` · ${item.guardianPhone}` : ""}</p></div><div className="flex gap-2"><Badge variant="outline">{item.status}</Badge>{item.status === "waiting" && <Button size="sm" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "offered" }, "Horário marcado como oferecido.")}>Oferecer</Button>}{item.status !== "closed" && <Button size="sm" variant="outline" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "closed" }, "Item encerrado.")}>Encerrar</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="comunicacao">
          <Card><CardHeader><CardTitle className="text-base">Caixa de saída operacional</CardTitle></CardHeader><CardContent className="space-y-3"><p className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">WhatsApp, SMS e e-mail externos não são simulados. Enquanto não houver provedor conectado, mensagens ficam como <strong>pendentes</strong> e podem ser copiadas/enviadas manualmente.</p>{data.notifications.length === 0 ? <Empty text="Nenhuma mensagem pendente." /> : data.notifications.map((item) => <div key={item.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.status}</Badge><span className="text-xs text-muted-foreground">{item.template}</span></div><p className="mt-2 text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">Destino: {item.recipient || "não informado"}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(item.message)}><Copy className="mr-2 h-3.5 w-3.5" />Copiar</Button>{item.status === "pending_provider" && <Button size="sm" onClick={() => mutate({ action: "notification_status", id: item.id, status: "manual_sent" }, "Marcada como enviada manualmente.")}>Marcar enviada</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="atividade">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />Trilha operacional</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">Registra quem alterou a operação sem copiar nomes de pacientes, telefones ou mensagens para os metadados de auditoria.</p>
              {data.audit.length === 0 ? <Empty text="Nenhuma alteração operacional auditada ainda." /> : data.audit.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-1 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div><strong className="text-foreground">{entry.actorName}</strong><span className="text-muted-foreground"> · {auditActionLabel(entry.action)}</span></div>
                  <span className="shrink-0 text-muted-foreground">{auditDate(entry.createdAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {canConfigure && (
          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Serviços</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Field label="Nome"><Input value={service.name} onChange={(e) => setService((p) => ({ ...p, name: e.target.value }))} placeholder="Consulta neuropediátrica" /></Field>
                  <Field label="Duração (min)"><Input type="number" min="10" value={service.duration} onChange={(e) => setService((p) => ({ ...p, duration: e.target.value }))} /></Field>
                  <Field label="Valor (R$)"><Input inputMode="decimal" value={service.price} onChange={(e) => setService((p) => ({ ...p, price: e.target.value }))} placeholder="Opcional" /></Field>
                  <Field label="Modalidade"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={service.modality} onChange={(e) => setService((p) => ({ ...p, modality: e.target.value }))}><option value="in_person">Presencial</option><option value="remote">Remota</option></select></Field>
                  <div className="self-end"><Button className="w-full" disabled={busy || !service.name.trim()} onClick={() => mutate({ action: "create_service", name: service.name, durationMinutes: Number(service.duration), priceCents: service.price ? Math.round(Number(service.price.replace(",", ".")) * 100) : null, modality: service.modality }, "Serviço criado.")}>Adicionar</Button></div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">{data.services.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl border p-3"><div className="min-w-0 flex-1"><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.durationMinutes} min · {formatMoneyBRL(item.priceCents)} · {item.modality === "remote" ? "remota" : "presencial"}</p></div><Button size="sm" variant="outline" onClick={() => mutate({ action: "update_service", id: item.id, active: !item.active }, item.active ? "Serviço pausado." : "Serviço ativado.")}>{item.active ? "Pausar" : "Ativar"}</Button></div>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Disponibilidade semanal</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Field label="Dia"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={rule.weekday} onChange={(e) => setRule((p) => ({ ...p, weekday: e.target.value }))}>{weekdays.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></Field>
                  <Field label="Início"><Input type="time" value={rule.start} onChange={(e) => setRule((p) => ({ ...p, start: e.target.value }))} /></Field>
                  <Field label="Fim"><Input type="time" value={rule.end} onChange={(e) => setRule((p) => ({ ...p, end: e.target.value }))} /></Field>
                  <Field label="Passo (min)"><Input type="number" min="5" value={rule.slot} onChange={(e) => setRule((p) => ({ ...p, slot: e.target.value }))} /></Field>
                  <div className="self-end"><Button className="w-full" disabled={busy} onClick={() => mutate({ action: "create_rule", weekday: Number(rule.weekday), startMinute: toMinute(rule.start), endMinute: toMinute(rule.end), slotMinutes: Number(rule.slot) }, "Disponibilidade adicionada.")}>Adicionar</Button></div>
                </div>
                <div className="flex flex-wrap gap-2">{data.rules.map((item) => <Badge key={item.id} variant="secondary" className="gap-2 py-2">{weekdays[item.weekday]} {minutesToClock(item.startMinute)}–{item.endMinute === 1440 ? "24:00" : minutesToClock(item.endMinute)} <button type="button" onClick={() => mutate({ action: "delete_rule", id: item.id }, "Regra removida.")} aria-label="Remover regra"><Trash2 className="h-3.5 w-3.5" /></button></Badge>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Bloqueios e férias</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Início"><Input type="datetime-local" value={block.start} onChange={(e) => setBlock((p) => ({ ...p, start: e.target.value }))} /></Field><Field label="Fim"><Input type="datetime-local" value={block.end} onChange={(e) => setBlock((p) => ({ ...p, end: e.target.value }))} /></Field><Field label="Motivo"><Input value={block.reason} onChange={(e) => setBlock((p) => ({ ...p, reason: e.target.value }))} placeholder="Férias, reunião…" /></Field><div className="self-end"><Button className="w-full" disabled={busy || !block.start || !block.end} onClick={() => mutate({ action: "create_block", startsAtLocal: block.start, endsAtLocal: block.end, reason: block.reason }, "Bloqueio adicionado.")}>Bloquear</Button></div></div>
                <div className="space-y-2">{data.blocks.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span>{dateTimeLabel(item.startsAtLocal)} → {dateTimeLabel(item.endsAtLocal)}{item.reason ? ` · ${item.reason}` : ""}</span><Button size="icon" variant="ghost" onClick={() => mutate({ action: "delete_block", id: item.id }, "Bloqueio removido.")}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canConfigure && (
          <TabsContent value="publico">
            <Card><CardContent className="space-y-5 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 text-primary" /><div><h2 className="font-bold">Perfil e autoagendamento</h2><p className="text-sm text-muted-foreground">O booking público só abre horários quando você o ativa. Contatos são cifrados antes de persistir; não há campo livre para hipótese diagnóstica.</p></div></div><div className="grid gap-3 md:grid-cols-2"><Field label="Nome público"><Input value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} /></Field><Field label="Especialidade"><Input value={profile.specialty} onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))} /></Field><Field label="Local"><Input value={profile.locationLabel} onChange={(e) => setProfile((p) => ({ ...p, locationLabel: e.target.value }))} /></Field><Field label="Endereço público"><Input value={profile.slug} onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value.toLowerCase() }))} /></Field></div><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => mutate({ action: "upsert_profile", ...profile, bookingEnabled: data.profile.bookingEnabled }, "Perfil salvo.")}>Salvar perfil</Button><Button variant={data.profile.bookingEnabled ? "destructive" : "default"} disabled={busy} onClick={() => mutate({ action: "upsert_profile", ...profile, bookingEnabled: !data.profile.bookingEnabled }, data.profile.bookingEnabled ? "Agendamento público pausado." : "Agendamento público ativado.")}>{data.profile.bookingEnabled ? "Pausar agendamento" : "Ativar agendamento"}</Button><Button asChild variant="outline"><Link href={publicHref}>Abrir página pública</Link></Button></div>{!data.services.some((item) => item.active && item.publicVisible) || data.rules.length === 0 ? <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Antes de ativar, cadastre pelo menos um serviço ativo e uma regra de disponibilidade.</p> : null}</CardContent></Card>
          </TabsContent>
        )}

        {canConfigure && (
          <TabsContent value="equipe">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Recepção vinculada</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-muted-foreground">Vincule uma conta existente cujo perfil seja <code>operator</code>. O vínculo concede acesso somente à agenda operacional; não concede prontuário, prescrição, Clinical Core, configuração de serviços ou financeiro.</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="email.da.recepcao@exemplo.com" />
                  <Button className="gap-2" disabled={busy || !staffEmail.includes("@") } onClick={async () => {
                    const saved = await mutate({ action: "staff_link", email: staffEmail }, "Recepção vinculada à agenda.");
                    if (saved) setStaffEmail("");
                  }}><UserPlus className="h-4 w-4" />Vincular</Button>
                </div>
                {data.staff.length === 0 ? <Empty text="Nenhuma conta de recepção vinculada." /> : data.staff.map((staff) => (
                  <div key={staff.staffUserId} className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><p className="font-semibold">{staff.staffName}</p><p className="text-xs text-muted-foreground">{staff.staffEmail}</p></div>
                    <div className="flex items-center gap-2"><Badge variant={staff.active ? "default" : "outline"}>{staff.active ? "ativo" : "inativo"}</Badge><Button size="sm" variant="outline" disabled={busy} onClick={() => mutate({ action: "staff_active", staffUserId: staff.staffUserId, active: !staff.active }, staff.active ? "Acesso da recepção suspenso." : "Acesso da recepção reativado.")}>{staff.active ? "Suspender" : "Reativar"}</Button></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canConfigure && (
          <TabsContent value="reputacao">
            <Card><CardHeader><CardTitle className="text-base">Avaliações verificadas</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Somente consultas concluídas podem gerar avaliação. Comentários ficam privados até moderação.</p>{data.reviews.length === 0 ? <Empty text="Nenhuma avaliação recebida." /> : data.reviews.map((item) => <div key={item.id} className="rounded-2xl border p-4"><div className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-500" /><strong>{item.rating}/5</strong><Badge variant="outline">{item.approved ? "pública" : "aguardando moderação"}</Badge></div>{item.comment && <p className="mt-2 text-sm text-muted-foreground">{item.comment}</p>}<div className="mt-3 flex gap-2"><Button size="sm" onClick={() => mutate({ action: "review_moderate", id: item.id, approved: true }, "Avaliação publicada.")}>Aprovar</Button>{item.approved && <Button size="sm" variant="outline" onClick={() => mutate({ action: "review_moderate", id: item.id, approved: false }, "Avaliação retirada da página pública.")}>Ocultar</Button>}</div></div>)}</CardContent></Card>
          </TabsContent>
        )}

        {canConfigure && (
          <TabsContent value="financeiro">
            <div className="grid gap-4 lg:grid-cols-3"><Metric icon={WalletCards} label="Previsto" value={formatMoneyBRL(data.metrics.expectedCents)} /><Metric icon={CheckCircle2} label="Recebido" value={formatMoneyBRL(data.metrics.paidCents)} /><Metric icon={MessageSquareText} label="Pendências de comunicação" value={String(data.metrics.pendingNotifications)} /></div>
            <Card className="mt-4"><CardHeader><CardTitle className="text-base">Consultas e recebimentos</CardTitle></CardHeader><CardContent className="space-y-2">{data.appointments.slice(0, 100).map((apt) => <PaymentRow key={apt.id} appointment={apt} busy={busy} mutate={mutate} />)}</CardContent></Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof CalendarClock; label: string; value: string; detail?: string }) {
  return <Card><CardContent className="flex items-start gap-3 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{value}</p>{detail && <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>}</div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function PaymentRow({ appointment, busy, mutate }: { appointment: Appointment; busy: boolean; mutate: (payload: Record<string, unknown>, success: string) => Promise<boolean> }) {
  const [amount, setAmount] = useState(appointment.amountCents !== null ? String(appointment.amountCents / 100) : "");
  return <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_140px_150px_auto] md:items-end"><div><p className="font-semibold">{appointment.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{dateTimeLabel(appointment.startsAtLocal)} · {appointment.serviceName}</p></div><Field label="Valor R$"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></Field><Field label="Situação"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" defaultValue={appointment.paymentStatus} id={`payment-${appointment.id}`}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="waived">Cortesia</option><option value="refunded">Estornado</option></select></Field><Button disabled={busy} onClick={() => { const select = document.getElementById(`payment-${appointment.id}`) as HTMLSelectElement | null; return mutate({ action: "appointment_payment", id: appointment.id, amountCents: amount ? Math.round(Number(amount.replace(",", ".")) * 100) : null, paymentStatus: select?.value || appointment.paymentStatus, paymentMethod: "manual" }, "Financeiro atualizado."); }}>Salvar</Button></div>;
}

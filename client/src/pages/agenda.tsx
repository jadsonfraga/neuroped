import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  CalendarClock,
  CalendarOff,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  History,
  ListPlus,
  Mail,
  MailWarning,
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
import { AgendaUnifiedDay } from "@/components/AgendaUnifiedDay";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { apiQueryKeyMatches } from "@/lib/apiQueryKey";
import {
  OPERATIONS_ENDPOINT,
  agendaOfSuffix,
  dashboardKeyFor,
  isProviderUnavailable,
  operationsUrlFor,
  parseSelectionRequired,
  readStoredProvider,
  storeProvider,
} from "@/lib/agendaProvider";
import {
  appointmentStatusLabel as statusLabel,
  formatMoneyBRL,
  minutesToClock,
  notificationTemplateLabel,
  waitlistStatusLabel,
  type Appointment,
  type AppointmentStatus,
  type OperationsDashboard,
} from "@shared/operations";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const scheduleRows = Array.from({ length: 14 }, (_, index) => {
  const total = 7 * 60 + index * 60;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});

function localDateInput(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

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

/** Bloqueio gravado por `create_day_block`: 00:00 do dia até 00:00 do dia seguinte. */
function fullDayBlockDate(startsAtLocal: string, endsAtLocal: string): string | null {
  if (!startsAtLocal.endsWith("T00:00") || !endsAtLocal.endsWith("T00:00")) return null;
  const start = startsAtLocal.slice(0, 10);
  const next = new Date(`${start}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10) === endsAtLocal.slice(0, 10) ? start : null;
}

function dateLabel(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
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

const NOTIFICATION_STATUS_LABELS: Record<string, string> = {
  pending_provider: "pendente",
  manual_sent: "enviada manualmente",
  delivered: "enviada por e-mail",
  failed: "falhou",
};

function notificationStatusLabel(value: string): string {
  return NOTIFICATION_STATUS_LABELS[value] ?? value;
}

function auditActionLabel(value: string): string {
  const labels: Record<string, string> = {
    create_appointment: "agendamento criado",
    appointment_reschedule: "consulta remarcada pela equipe",
    create_day_block: "dia inteiro bloqueado",
    appointment_status: "status da consulta alterado",
    appointment_payment: "financeiro atualizado",
    waitlist_status: "lista de espera alterada",
    notification_status: "comunicação atualizada",
    notification_retry_email: "reenvio de e-mail solicitado",
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
    appointment_link_patient: "consulta vinculada ao prontuário",
  };
  return labels[value] ?? value;
}

export default function AgendaPage() {
  const { toast } = useToast();
  const { activeClinic } = useClinic();
  const { user: actor } = useAuth();
  // Só a recepção com mais de um profissional escolhe de qual agenda opera. O
  // servidor valida o alvo contra o vínculo ativo persistido; aqui é conveniência.
  // A escolha lembrada é por conta e a chave da consulta inclui o profissional,
  // então o cache de uma agenda nunca aparece em outra.
  const [providerId, setProviderId] = useState<string | null>(() => readStoredProvider(actor?.id));
  const dashboardKey = dashboardKeyFor(providerId);
  const dashboard = useQuery<OperationsDashboard>({ queryKey: [dashboardKey] });
  const data = dashboard.data;
  function chooseProvider(next: string | null) {
    setProviderId(next);
    storeProvider(actor?.id, next);
  }
  const restoredFor = useRef<string | null>(null);
  useEffect(() => {
    // A conta só fica conhecida depois do primeiro render em alguns caminhos:
    // quando aparecer, recupera a escolha que ela mesma fez. Uma vez por conta,
    // para nunca competir com o esquecimento da escolha recusada pelo servidor.
    if (!actor?.id || restoredFor.current === actor.id) return;
    restoredFor.current = actor.id;
    if (providerId !== null) return;
    const remembered = readStoredProvider(actor.id);
    if (remembered) setProviderId(remembered);
  }, [actor?.id, providerId]);
  useEffect(() => {
    // Quem não é recepção com vários profissionais não manda `provider` (a
    // escolha lembrada de outra época, ou de outra conta, é esquecida).
    if (!data || !providerId) return;
    if (!data.access.delegated || (data.access.availableProviders?.length ?? 0) <= 1) {
      setProviderId(null);
      storeProvider(actor?.id, null);
    }
  }, [data, providerId, actor?.id]);
  useEffect(() => {
    // A escolha lembrada que o servidor recusou (vínculo suspenso etc.) volta a
    // pedir a escolha, em vez de prender a recepção num erro.
    if (providerId && isProviderUnavailable(dashboard.error)) {
      setProviderId(null);
      storeProvider(actor?.id, null);
    }
  }, [dashboard.error, providerId, actor?.id]);
  const [patientSearch, setPatientSearch] = useState("");
  const clinicId = data?.access.clinicId ?? "";
  const patientSearchParam = encodeURIComponent(patientSearch.trim());
  const patientsQuery = useQuery<{ data: Array<{ id: string; profile?: { name?: string; birthDate?: string | null } }>; total?: number }>({
    queryKey: [`/api/live/patients?clinicId=${encodeURIComponent(clinicId)}&q=${patientSearchParam}`],
    enabled: Boolean(data?.access.canConfigure && clinicId),
    staleTime: 30_000,
  });
  const patientOptions = useMemo(
    () => (patientsQuery.data?.data ?? []).map((patient) => ({
      id: patient.id,
      name: patient.profile?.name?.trim() || "Paciente",
      birthDate: patient.profile?.birthDate ?? null,
    })),
    [patientsQuery.data?.data],
  );
  const [busy, setBusy] = useState(false);
  const [staffEmail, setStaffEmail] = useState("");
  const [agendaDate, setAgendaDate] = useState(localDateInput);
  // Aba controlada: "Abrir agenda de X", na visão do dia de todos, volta à aba da agenda.
  const [tab, setTab] = useState("agenda");

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
  const [rule, setRule] = useState({ weekday: "1", start: "08:00", end: "12:00", slot: "60" });
  const [block, setBlock] = useState({ start: "", end: "", reason: "" });
  const [dayBlock, setDayBlock] = useState({ date: "", reason: "Feriado" });
  const [rescheduling, setRescheduling] = useState<{ id: string; startsAtLocal: string } | null>(null);
  const [manual, setManual] = useState({ serviceId: "", startsAtLocal: "", patientId: "", guardianName: "", patientName: "", phone: "", email: "" });
  const activeProviderId = data?.access.providerUserId ?? null;
  useEffect(() => {
    // Trocar de profissional descarta o que estava sendo digitado: serviço,
    // horário e paciente pertencem à agenda anterior e seriam recusados (ou, pior,
    // aplicados à agenda errada).
    setManual({ serviceId: "", startsAtLocal: "", patientId: "", guardianName: "", patientName: "", phone: "", email: "" });
    setRescheduling(null);
    setPatientSearch("");
  }, [activeProviderId]);

  async function mutate(payload: Record<string, unknown>, success: string): Promise<boolean> {
    setBusy(true);
    try {
      await apiRequest("POST", operationsUrlFor(providerId), payload);
    } catch (error) {
      toast({ title: "Não foi possível concluir.", description: String(error), variant: "destructive" });
      setBusy(false);
      return false;
    }

    try {
      // Todas as agendas em cache (cada profissional tem a sua chave).
      await queryClient.invalidateQueries({ predicate: (query) => apiQueryKeyMatches(query.queryKey, OPERATIONS_ENDPOINT) });
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
  // Recepção com mais de um profissional e nenhuma escolha: o servidor devolveu a
  // lista (409). A tela pede a escolha em vez de mostrar um erro.
  const selectionRequired = parseSelectionRequired(dashboard.error);
  if (selectionRequired) {
    return <ProviderChooser providers={selectionRequired} onChoose={chooseProvider} />;
  }
  if (dashboard.isError || !data) {
    const detail = dashboard.error instanceof Error ? dashboard.error.message : "";
    return (
      <div className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold">Agenda temporariamente indisponível</h1>
        <p className="text-sm text-muted-foreground">
          {detail.includes("STAFF_LINK_REQUIRED")
            ? "Esta conta da recepção ainda precisa ser vinculada pelo profissional responsável (aba Equipe da Agenda & Gestão) e ter o convite da clínica aceito."
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
  // Resposta antiga (sem `emailDelivery`) = envio manual.
  const emailActive = data.emailDelivery?.active === true;
  const maxEmailAttempts = data.emailDelivery?.maxAttempts ?? 3;

  const canConfigure = data.access.canConfigure;
  // Recepção: em qual agenda cada ação está sendo feita (e entre quais ela escolhe).
  const agendaOf = agendaOfSuffix(data.access.delegated, data.access.providerName);
  const providerChoices = data.access.availableProviders ?? [];
  // A visão do dia de todos só existe para a recepção com mais de um profissional;
  // se isso deixar de valer com a aba aberta, volta para a agenda.
  const unifiedAvailable = data.access.delegated && providerChoices.length > 1;
  const activeTab = tab === "dia" && !unifiedAvailable ? "agenda" : tab;
  // S13: o link compartilhado pela clínica já sai com `clinic=<slug da
  // clínica>`, então um profissional em mais de uma clínica nunca cai na
  // ambiguidade que faz o backend recusar o agendamento público (ver
  // resolveProviderClinicBySlug em functions/api/operations/_core.ts).
  const publicHref = activeClinic
    ? `/agendar?provider=${encodeURIComponent(data.profile.slug)}&clinic=${encodeURIComponent(activeClinic.slug)}`
    : `/agendar?provider=${encodeURIComponent(data.profile.slug)}`;

  return (
    <div className="space-y-6 pb-16" data-testid="agenda-shell">
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
        <section
          aria-label="Agenda em operação"
          data-testid="agenda-provider-bar"
          className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/[0.08] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm" data-testid="agenda-provider-label">
            Agenda de <strong className="text-foreground">{data.access.providerName}</strong>
          </p>
          {providerChoices.length > 1 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Trocar profissional
              <select
                data-testid="agenda-provider-select"
                className="min-h-11 rounded-xl border bg-background px-3 text-sm text-foreground"
                value={data.access.providerUserId}
                disabled={busy}
                onChange={(event) => chooseProvider(event.target.value)}
              >
                {providerChoices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}
              </select>
            </label>
          )}
        </section>
      )}

      {data.access.delegated && (
        <div className="flex gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p><strong className="text-foreground">Modo recepção:</strong> você opera a agenda do profissional vinculado. Valores financeiros, configuração do serviço e moderação de avaliações não são disponibilizados para este perfil.</p>
        </div>
      )}

      {/* Em telas compactas o CSS do shell converte esta faixa em rolagem
          horizontal com scroll-snap (premium-polish-10.css). Uma região que
          rola precisa ser alcançável pelo teclado, senão os indicadores fora
          da área visível ficam inacessíveis (axe: scrollable-region-focusable). */}
      <section
        className="grid gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-2 xl:grid-cols-4"
        tabIndex={0}
        aria-label="Indicadores da agenda"
      >
        <Metric icon={CalendarClock} label="Hoje" value={String(data.metrics.today)} />
        <Metric icon={Clock3} label="Próximas" value={String(data.metrics.upcoming)} detail={`${data.metrics.requested} aguardando confirmação`} />
        {canConfigure
          ? <Metric icon={CircleDollarSign} label="Previsto" value={formatMoneyBRL(data.metrics.expectedCents)} detail={`Recebido: ${formatMoneyBRL(data.metrics.paidCents)}`} />
          : <Metric icon={Activity} label="Solicitadas" value={String(data.metrics.requested)} detail="aguardando ação da clínica" />}
        <Metric icon={ListPlus} label="Lista de espera" value={String(data.metrics.waitlist)} detail={`${data.metrics.noShow30d} faltas em 30 dias`} />
      </section>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          {unifiedAvailable && <TabsTrigger value="dia">Dia de todos</TabsTrigger>}
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
              {canConfigure && <Field label="Vincular paciente ao prontuário"><div className="space-y-2"><Input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Buscar paciente por nome" aria-label="Buscar paciente para vínculo clínico" /><select aria-label="Selecionar paciente para vínculo clínico" className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={manual.patientId} onChange={(e) => { const patientId = e.target.value; const selected = patientOptions.find((item) => item.id === patientId); setManual((p) => ({ ...p, patientId, patientName: selected?.name ?? p.patientName })); }}><option value="">Sem vínculo clínico</option>{patientsQuery.isFetching && <option disabled>Buscando pacientes…</option>}{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select><p className="text-[11px] text-muted-foreground">{patientOptions.length} paciente(s) LIVE encontrado(s) nesta clínica.</p></div></Field>}
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
              {/* Região com rolagem própria: sem foco de teclado, quem navega por Tab
                  não alcança os horários fora da área visível (axe:
                  scrollable-region-focusable). O rótulo diz o que a região é. */}
              <div
                className="max-h-[34rem] space-y-1 overflow-y-auto pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                tabIndex={0}
                role="group"
                aria-label="Grade de horários da agenda"
              >
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
                      {apt.patientId && <Button size="sm" variant="outline" asChild><Link href={`/prontuario?patientId=${encodeURIComponent(apt.patientId)}&appointmentId=${encodeURIComponent(apt.id)}`}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Prontuário</Link></Button>}
                      {canConfigure && !apt.patientId && (
                        <select
                          aria-label={`Vincular ${apt.patientName || "paciente"} ao prontuário LIVE`}
                          className="min-h-9 max-w-56 rounded-lg border bg-background px-2 text-xs"
                          defaultValue=""
                          disabled={busy || patientsQuery.isFetching}
                          onChange={async (event) => {
                            const patientId = event.target.value;
                            if (!patientId) return;
                            const linked = await mutate(
                              { action: "appointment_link_patient", id: apt.id, patientId },
                              "Consulta vinculada ao prontuário LIVE.",
                            );
                            if (!linked) event.currentTarget.value = "";
                          }}
                        >
                          <option value="">Vincular prontuário…</option>
                          {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                        </select>
                      )}

                      {(apt.status === "requested" || apt.status === "confirmed") && rescheduling?.id !== apt.id && (
                        <Button size="sm" variant="outline" disabled={busy} className="gap-1.5" title={agendaOf ? `Remarcar${agendaOf}` : undefined} onClick={() => setRescheduling({ id: apt.id, startsAtLocal: apt.startsAtLocal })}>
                          <CalendarRange className="h-3.5 w-3.5" />Remarcar
                        </Button>
                      )}
                      {(nextStatuses[apt.status] ?? []).map((status) => <Button key={status} size="sm" variant={status === "cancelled" || status === "no_show" ? "outline" : "default"} disabled={busy} title={agendaOf ? `${statusLabel[status]}${agendaOf}` : undefined} onClick={() => mutate({ action: "appointment_status", id: apt.id, status }, `Consulta: ${statusLabel[status]}${agendaOf}.`)}>{statusLabel[status]}</Button>)}
                    </div>
                  </div>
                  {rescheduling?.id === apt.id && (
                    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3 sm:flex-row sm:items-end" data-testid="reschedule-form">
                      <div className="flex-1">
                        <Field label="Nova data e horário">
                          <Input type="datetime-local" value={rescheduling.startsAtLocal} onChange={(e) => setRescheduling({ id: apt.id, startsAtLocal: e.target.value })} />
                        </Field>
                        {agendaOf && <p className="mt-1 text-[11px] font-semibold text-foreground" data-testid="reschedule-agenda-of">Remarcando na agenda de {data.access.providerName}.</p>}
                        <p className="mt-1 text-[11px] text-muted-foreground">A duração do serviço é mantida. Conflitos com outra consulta ou bloqueio são recusados, e uma mensagem de remarcação entra na caixa de saída.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" disabled={busy || !rescheduling.startsAtLocal || rescheduling.startsAtLocal === apt.startsAtLocal} onClick={async () => {
                          const saved = await mutate({ action: "appointment_reschedule", id: apt.id, startsAtLocal: rescheduling.startsAtLocal }, `Consulta remarcada${agendaOf}.`);
                          if (saved) setRescheduling(null);
                        }}>Confirmar remarcação</Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setRescheduling(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {unifiedAvailable && (
          <TabsContent value="dia" className="space-y-4">
            <AgendaUnifiedDay
              providers={providerChoices}
              date={agendaDate}
              onDateChange={setAgendaDate}
              onOpenAgenda={(providerUserId) => {
                chooseProvider(providerUserId);
                setTab("agenda");
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="espera">
          <Card><CardHeader><CardTitle className="text-base">Lista de espera</CardTitle></CardHeader><CardContent className="space-y-2">{data.waitlist.length === 0 ? <Empty text="Ninguém na lista de espera." /> : data.waitlist.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{item.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{item.serviceName} · {item.guardianName}{item.guardianPhone ? ` · ${item.guardianPhone}` : ""}</p></div><div className="flex gap-2"><Badge variant="outline">{waitlistStatusLabel[item.status] ?? item.status}</Badge>{item.status === "waiting" && <Button size="sm" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "offered" }, "Horário marcado como oferecido.")}>Oferecer</Button>}{item.status !== "closed" && <Button size="sm" variant="outline" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "closed" }, "Item encerrado.")}>Encerrar</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="comunicacao">
          <Card>
            <CardHeader><CardTitle className="text-base">Caixa de saída operacional</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {emailActive ? (
                <div data-testid="email-delivery-indicator" data-state="active" className="flex gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">Envio por e-mail ativo <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300">automático</Badge></p>
                    <p className="mt-1 text-muted-foreground">Confirmações, remarcações e cancelamentos saem automaticamente para o e-mail do responsável. Sem e-mail cadastrado, a mensagem fica pendente para envio manual. Falhas podem ser reenviadas até {maxEmailAttempts} tentativas. WhatsApp e SMS não são enviados.</p>
                  </div>
                </div>
              ) : (
                <div data-testid="email-delivery-indicator" data-state="manual" className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                  <div className="text-xs">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-foreground">Envio manual <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-300">e-mail não configurado</Badge></p>
                    <p className="mt-1 text-muted-foreground">Nenhum provedor de e-mail está conectado. As mensagens ficam como <strong>pendentes</strong>: copie e envie pelo seu canal e depois marque como enviada. WhatsApp, SMS e e-mail externos não são simulados.</p>
                  </div>
                </div>
              )}
              {data.notifications.length === 0 ? <Empty text="Nenhuma mensagem pendente." /> : data.notifications.map((item) => {
                const attempts = item.attempts ?? 0;
                const canEmail = emailActive && item.status === "pending_provider" && item.emailEligible === true && attempts < maxEmailAttempts;
                return (
                  <div key={item.id} data-testid="notification-item" className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{notificationStatusLabel(item.status)}</Badge>
                      {item.channel === "email" && <Badge variant="secondary"><Mail className="mr-1 h-3 w-3" aria-hidden="true" />e-mail</Badge>}
                      <span className="text-xs text-muted-foreground">{notificationTemplateLabel(item.template)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm">{item.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Destino: {item.channel === "email" ? "e-mail do responsável" : item.recipient || "não informado"}</p>
                    {(attempts > 0 || item.lastError === "rate_limited") && item.status !== "delivered" && (
                      <p className="mt-1 text-xs text-muted-foreground" data-testid="notification-attempts">
                        Tentativas de e-mail: {attempts}/{maxEmailAttempts}
                        {item.lastError === "rate_limited"
                          ? " · limite de e-mails para este endereço; use o envio manual"
                          : item.lastError ? " · o provedor recusou ou não respondeu" : ""}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(item.message)}><Copy className="mr-2 h-3.5 w-3.5" />Copiar</Button>
                      {canEmail && <Button size="sm" variant="outline" disabled={busy} onClick={() => mutate({ action: "notification_retry_email", id: item.id }, "Envio por e-mail solicitado.")}><Mail className="mr-2 h-3.5 w-3.5" />{attempts > 0 ? "Tentar e-mail novamente" : "Enviar por e-mail"}</Button>}
                      {(item.status === "pending_provider" || item.status === "failed") && <Button size="sm" onClick={() => mutate({ action: "notification_status", id: item.id, status: "manual_sent" }, "Marcada como enviada manualmente.")}>Marcar enviada</Button>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
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
                  <Field label="Intervalo entre pacientes (min)"><Input type="number" min="5" value={rule.slot} onChange={(e) => setRule((p) => ({ ...p, slot: e.target.value }))} /></Field>
                  <div className="self-end"><Button className="w-full" disabled={busy} onClick={() => mutate({ action: "create_rule", weekday: Number(rule.weekday), startMinute: toMinute(rule.start), endMinute: toMinute(rule.end), slotMinutes: Number(rule.slot) }, "Disponibilidade adicionada.")}>Adicionar</Button></div>
                </div>
                <div className="flex flex-wrap gap-2">{data.rules.map((item) => <Badge key={item.id} variant="secondary" className="gap-2 py-2">{weekdays[item.weekday]} {minutesToClock(item.startMinute)}–{item.endMinute === 1440 ? "24:00" : minutesToClock(item.endMinute)} <button type="button" onClick={() => mutate({ action: "delete_rule", id: item.id }, "Regra removida.")} aria-label="Remover regra"><Trash2 className="h-3.5 w-3.5" /></button></Badge>)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Bloqueios e férias</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field label="Início"><Input type="datetime-local" value={block.start} onChange={(e) => setBlock((p) => ({ ...p, start: e.target.value }))} /></Field><Field label="Fim"><Input type="datetime-local" value={block.end} onChange={(e) => setBlock((p) => ({ ...p, end: e.target.value }))} /></Field><Field label="Motivo"><Input value={block.reason} onChange={(e) => setBlock((p) => ({ ...p, reason: e.target.value }))} placeholder="Férias, reunião…" /></Field><div className="self-end"><Button className="w-full" disabled={busy || !block.start || !block.end} onClick={() => mutate({ action: "create_block", startsAtLocal: block.start, endsAtLocal: block.end, reason: block.reason }, "Bloqueio adicionado.")}>Bloquear</Button></div></div>
                <div className="grid gap-3 rounded-2xl border border-dashed p-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="day-block-form">
                  <Field label="Dia inteiro"><Input type="date" value={dayBlock.date} onChange={(e) => setDayBlock((p) => ({ ...p, date: e.target.value }))} /></Field>
                  <Field label="Rótulo"><Input value={dayBlock.reason} maxLength={160} onChange={(e) => setDayBlock((p) => ({ ...p, reason: e.target.value }))} placeholder="Feriado, congresso…" /></Field>
                  <p className="self-end text-[11px] leading-relaxed text-muted-foreground">Fecha o dia todo (00:00–24:00) para autoagendamento e novas marcações. Dias com consulta ativa são recusados: remarque ou cancele antes.</p>
                  <div className="self-end"><Button className="w-full gap-2" variant="secondary" disabled={busy || !dayBlock.date || !dayBlock.reason.trim()} onClick={async () => {
                    const saved = await mutate({ action: "create_day_block", date: dayBlock.date, reason: dayBlock.reason.trim() }, "Dia inteiro bloqueado.");
                    if (saved) setDayBlock((p) => ({ ...p, date: "" }));
                  }}><CalendarOff className="h-4 w-4" />Bloquear dia</Button></div>
                </div>
                <div className="space-y-2">{data.blocks.map((item) => { const fullDay = fullDayBlockDate(item.startsAtLocal, item.endsAtLocal); return <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"><span className="flex flex-wrap items-center gap-2">{fullDay ? <><Badge variant="secondary">dia inteiro</Badge>{dateLabel(fullDay)}</> : <>{dateTimeLabel(item.startsAtLocal)} → {dateTimeLabel(item.endsAtLocal)}</>}{item.reason ? ` · ${item.reason}` : ""}</span><Button size="icon" variant="ghost" aria-label="Remover bloqueio" onClick={() => mutate({ action: "delete_block", id: item.id }, "Bloqueio removido.")}><Trash2 className="h-4 w-4" /></Button></div>; })}</div>
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
                <p className="text-xs leading-relaxed text-muted-foreground">Primeiro convide a recepção como <strong>Assistente</strong> em <a className="font-medium text-primary underline-offset-2 hover:underline" href="#/configuracoes?secao=equipe">Configurações › Equipe</a>. Depois que o convite for aceito, vincule o e-mail aqui. O vínculo concede acesso somente à agenda operacional; não concede prontuário, prescrição, Clinical Core, configuração de serviços ou financeiro.</p>
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

/**
 * Campo rotulado da Agenda.
 *
 * O rótulo envolve o controle: sem isso o `<Label>` ficava órfão e o axe
 * apontava `label`/`select-name` (críticos) em datas, e-mail, serviço e
 * situação de pagamento — a agenda inteira era operável só por quem enxerga o
 * texto ao lado. A associação implícita cobre o primeiro controle rotulável;
 * campos compostos declaram `aria-label` no controle extra.
 */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <Label asChild><span>{label}</span></Label>
      {children}
    </label>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

/** Recepção com mais de um profissional: pede de qual agenda ela vai operar. */
function ProviderChooser({ providers, onChoose }: { providers: Array<{ id: string; name: string }>; onChoose: (providerId: string) => void }) {
  return (
    <section
      className="space-y-4 rounded-3xl border border-primary/20 bg-primary/[0.04] p-6"
      data-testid="agenda-provider-chooser"
      aria-labelledby="agenda-provider-chooser-title"
    >
      <h1 id="agenda-provider-chooser-title" className="text-xl font-bold">Qual agenda você vai operar?</h1>
      <p className="text-sm text-muted-foreground">
        Sua conta de recepção atende mais de um profissional. Escolha a agenda; você pode trocar a qualquer momento e nada é misturado entre elas.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <li key={provider.id}>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 w-full justify-start whitespace-normal py-3 text-left"
              onClick={() => onChoose(provider.id)}
            >
              Agenda de {provider.name}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PaymentRow({ appointment, busy, mutate }: { appointment: Appointment; busy: boolean; mutate: (payload: Record<string, unknown>, success: string) => Promise<boolean> }) {
  const [amount, setAmount] = useState(appointment.amountCents !== null ? String(appointment.amountCents / 100) : "");
  return <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_140px_150px_auto] md:items-end"><div><p className="font-semibold">{appointment.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{dateTimeLabel(appointment.startsAtLocal)} · {appointment.serviceName}</p></div><Field label="Valor R$"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></Field><Field label="Situação"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" defaultValue={appointment.paymentStatus} id={`payment-${appointment.id}`}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="waived">Cortesia</option><option value="refunded">Estornado</option></select></Field><Button disabled={busy} onClick={() => { const select = document.getElementById(`payment-${appointment.id}`) as HTMLSelectElement | null; return mutate({ action: "appointment_payment", id: appointment.id, amountCents: amount ? Math.round(Number(amount.replace(",", ".")) * 100) : null, paymentStatus: select?.value || appointment.paymentStatus, paymentMethod: "manual" }, "Financeiro atualizado."); }}>Salvar</Button></div>;
}

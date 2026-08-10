import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Copy,
  ExternalLink,
  ListPlus,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
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

export default function AgendaPage() {
  const { toast } = useToast();
  const dashboard = useQuery<OperationsDashboard>({ queryKey: [DASHBOARD_KEY] });
  const data = dashboard.data;
  const [busy, setBusy] = useState(false);

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
  const [manual, setManual] = useState({ serviceId: "", startsAtLocal: "", guardianName: "", patientName: "", phone: "", email: "" });

  async function mutate(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    try {
      await apiRequest("POST", "/api/operations", payload);
      await queryClient.invalidateQueries({ queryKey: [DASHBOARD_KEY] });
      await dashboard.refetch();
      toast({ title: success });
    } catch (error) {
      toast({ title: "Não foi possível concluir.", description: String(error), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  const upcoming = useMemo(
    () => [...(data?.appointments ?? [])]
      .filter((item) => !["completed", "cancelled", "no_show"].includes(item.status))
      .sort((a, b) => a.startsAtLocal.localeCompare(b.startsAtLocal))
      .slice(0, 40),
    [data?.appointments],
  );

  if (dashboard.isLoading) {
    return <div className="rounded-3xl border p-8 text-sm text-muted-foreground" role="status">Carregando Agenda NeuroPed…</div>;
  }
  if (dashboard.isError || !data) {
    return (
      <div className="space-y-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-xl font-bold">Agenda temporariamente indisponível</h1>
        <p className="text-sm text-muted-foreground">Nenhum dado foi simulado. Verifique autenticação e banco persistente.</p>
        <Button variant="outline" onClick={() => dashboard.refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const publicHref = `/agendar?provider=${encodeURIComponent(data.profile.slug)}`;

  return (
    <div className="space-y-6 pb-16">
      <header className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">NeuroPed Operacional</Badge>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Agenda & Gestão</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Disponibilidade, autoagendamento, check-in, lista de espera, avaliações, comunicação e financeiro básico em um único fluxo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="gap-2"><Link href={publicHref}><ExternalLink className="h-4 w-4" />Ver página pública</Link></Button>
            <Button asChild className="gap-2"><Link href="/recepcao"><Users className="h-4 w-4" />Recepção</Link></Button>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarClock} label="Hoje" value={String(data.metrics.today)} />
        <Metric icon={Clock3} label="Próximas" value={String(data.metrics.upcoming)} detail={`${data.metrics.requested} aguardando confirmação`} />
        <Metric icon={CircleDollarSign} label="Previsto" value={formatMoneyBRL(data.metrics.expectedCents)} detail={`Recebido: ${formatMoneyBRL(data.metrics.paidCents)}`} />
        <Metric icon={ListPlus} label="Lista de espera" value={String(data.metrics.waitlist)} detail={`${data.metrics.noShow30d} faltas em 30 dias`} />
      </section>

      <Tabs defaultValue="agenda" className="space-y-4">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl p-1">
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="config">Disponibilidade</TabsTrigger>
          <TabsTrigger value="publico">Página pública</TabsTrigger>
          <TabsTrigger value="espera">Espera</TabsTrigger>
          <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
          <TabsTrigger value="reputacao">Avaliações</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Novo agendamento manual</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Serviço"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" value={manual.serviceId} onChange={(e) => setManual((p) => ({ ...p, serviceId: e.target.value }))}><option value="">Selecione</option>{data.services.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Data e horário"><Input type="datetime-local" value={manual.startsAtLocal} onChange={(e) => setManual((p) => ({ ...p, startsAtLocal: e.target.value }))} /></Field>
              <Field label="Criança"><Input value={manual.patientName} onChange={(e) => setManual((p) => ({ ...p, patientName: e.target.value }))} placeholder="Nome" /></Field>
              <Field label="Responsável"><Input value={manual.guardianName} onChange={(e) => setManual((p) => ({ ...p, guardianName: e.target.value }))} /></Field>
              <Field label="Telefone"><Input value={manual.phone} onChange={(e) => setManual((p) => ({ ...p, phone: e.target.value }))} /></Field>
              <Field label="E-mail"><Input type="email" value={manual.email} onChange={(e) => setManual((p) => ({ ...p, email: e.target.value }))} /></Field>
              <div className="md:col-span-2 xl:col-span-3"><Button disabled={busy || !manual.serviceId || !manual.startsAtLocal} onClick={() => mutate({ action: "create_appointment", serviceId: manual.serviceId, startsAtLocal: manual.startsAtLocal, guardianName: manual.guardianName, patientName: manual.patientName, guardianPhone: manual.phone, guardianEmail: manual.email }, "Consulta adicionada à agenda.")} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Próximas consultas</CardTitle></CardHeader>
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
                      {(nextStatuses[apt.status] ?? []).map((status) => <Button key={status} size="sm" variant={status === "cancelled" || status === "no_show" ? "outline" : "default"} disabled={busy} onClick={() => mutate({ action: "appointment_status", id: apt.id, status }, `Consulta: ${statusLabel[status]}.`)}>{statusLabel[status]}</Button>)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

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
              <div className="flex flex-wrap gap-2">{data.rules.map((item) => <Badge key={item.id} variant="secondary" className="gap-2 py-2">{weekdays[item.weekday]} {minutesToClock(item.startMinute)}–{item.endMinute === 1440 ? "24:00" : minutesToClock(item.endMinute)} <button onClick={() => mutate({ action: "delete_rule", id: item.id }, "Regra removida.")} aria-label="Remover regra"><Trash2 className="h-3.5 w-3.5" /></button></Badge>)}</div>
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

        <TabsContent value="publico">
          <Card><CardContent className="space-y-5 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 text-primary" /><div><h2 className="font-bold">Perfil e autoagendamento</h2><p className="text-sm text-muted-foreground">O booking público só abre horários quando você o ativa. Contatos são cifrados antes de persistir; não há campo livre para hipótese diagnóstica.</p></div></div><div className="grid gap-3 md:grid-cols-2"><Field label="Nome público"><Input value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} /></Field><Field label="Especialidade"><Input value={profile.specialty} onChange={(e) => setProfile((p) => ({ ...p, specialty: e.target.value }))} /></Field><Field label="Local"><Input value={profile.locationLabel} onChange={(e) => setProfile((p) => ({ ...p, locationLabel: e.target.value }))} /></Field><Field label="Endereço público"><Input value={profile.slug} onChange={(e) => setProfile((p) => ({ ...p, slug: e.target.value.toLowerCase() }))} /></Field></div><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => mutate({ action: "upsert_profile", ...profile, bookingEnabled: data.profile.bookingEnabled }, "Perfil salvo.")}>Salvar perfil</Button><Button variant={data.profile.bookingEnabled ? "destructive" : "default"} disabled={busy} onClick={() => mutate({ action: "upsert_profile", ...profile, bookingEnabled: !data.profile.bookingEnabled }, data.profile.bookingEnabled ? "Agendamento público pausado." : "Agendamento público ativado.")}>{data.profile.bookingEnabled ? "Pausar agendamento" : "Ativar agendamento"}</Button><Button asChild variant="outline"><Link href={publicHref}>Abrir página pública</Link></Button></div>{!data.services.some((item) => item.active && item.publicVisible) || data.rules.length === 0 ? <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">Antes de ativar, cadastre pelo menos um serviço ativo e uma regra de disponibilidade.</p> : null}</CardContent></Card>
        </TabsContent>

        <TabsContent value="espera">
          <Card><CardHeader><CardTitle className="text-base">Lista de espera</CardTitle></CardHeader><CardContent className="space-y-2">{data.waitlist.length === 0 ? <Empty text="Ninguém na lista de espera." /> : data.waitlist.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{item.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{item.serviceName} · {item.guardianName}{item.guardianPhone ? ` · ${item.guardianPhone}` : ""}</p></div><div className="flex gap-2"><Badge variant="outline">{item.status}</Badge>{item.status === "waiting" && <Button size="sm" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "offered" }, "Horário marcado como oferecido.")}>Oferecer</Button>}{item.status !== "closed" && <Button size="sm" variant="outline" onClick={() => mutate({ action: "waitlist_status", id: item.id, status: "closed" }, "Item encerrado.")}>Encerrar</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="comunicacao">
          <Card><CardHeader><CardTitle className="text-base">Caixa de saída operacional</CardTitle></CardHeader><CardContent className="space-y-3"><p className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">WhatsApp, SMS e e-mail externos não são simulados. Enquanto não houver provedor conectado, mensagens ficam como <strong>pendentes do profissional</strong> e podem ser copiadas/enviadas manualmente.</p>{data.notifications.length === 0 ? <Empty text="Nenhuma mensagem pendente." /> : data.notifications.map((item) => <div key={item.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.status}</Badge><span className="text-xs text-muted-foreground">{item.template}</span></div><p className="mt-2 text-sm">{item.message}</p><p className="mt-1 text-xs text-muted-foreground">Destino: {item.recipient || "não informado"}</p><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(item.message)}><Copy className="mr-2 h-3.5 w-3.5" />Copiar</Button>{item.status === "pending_provider" && <Button size="sm" onClick={() => mutate({ action: "notification_status", id: item.id, status: "manual_sent" }, "Marcada como enviada manualmente.")}>Marcar enviada</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="reputacao">
          <Card><CardHeader><CardTitle className="text-base">Avaliações verificadas</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Somente consultas concluídas podem gerar avaliação. Comentários ficam privados até moderação.</p>{data.reviews.length === 0 ? <Empty text="Nenhuma avaliação recebida." /> : data.reviews.map((item) => <div key={item.id} className="rounded-2xl border p-4"><div className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-500" /><strong>{item.rating}/5</strong><Badge variant="outline">{item.approved ? "pública" : "aguardando moderação"}</Badge></div>{item.comment && <p className="mt-2 text-sm text-muted-foreground">{item.comment}</p>}<div className="mt-3 flex gap-2"><Button size="sm" onClick={() => mutate({ action: "review_moderate", id: item.id, approved: true }, "Avaliação publicada.")}>Aprovar</Button>{item.approved && <Button size="sm" variant="outline" onClick={() => mutate({ action: "review_moderate", id: item.id, approved: false }, "Avaliação retirada da página pública.")}>Ocultar</Button>}</div></div>)}</CardContent></Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <div className="grid gap-4 lg:grid-cols-3"><Metric icon={WalletCards} label="Previsto" value={formatMoneyBRL(data.metrics.expectedCents)} /><Metric icon={CheckCircle2} label="Recebido" value={formatMoneyBRL(data.metrics.paidCents)} /><Metric icon={MessageSquareText} label="Pendências de comunicação" value={String(data.metrics.pendingNotifications)} /></div>
          <Card className="mt-4"><CardHeader><CardTitle className="text-base">Consultas e recebimentos</CardTitle></CardHeader><CardContent className="space-y-2">{data.appointments.slice(0, 100).map((apt) => <PaymentRow key={apt.id} appointment={apt} busy={busy} mutate={mutate} />)}</CardContent></Card>
        </TabsContent>
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

function PaymentRow({ appointment, busy, mutate }: { appointment: Appointment; busy: boolean; mutate: (payload: Record<string, unknown>, success: string) => Promise<void> }) {
  const [amount, setAmount] = useState(appointment.amountCents !== null ? String(appointment.amountCents / 100) : "");
  return <div className="grid gap-3 rounded-2xl border p-4 md:grid-cols-[minmax(0,1fr)_140px_150px_auto] md:items-end"><div><p className="font-semibold">{appointment.patientName || "Paciente"}</p><p className="text-xs text-muted-foreground">{dateTimeLabel(appointment.startsAtLocal)} · {appointment.serviceName}</p></div><Field label="Valor R$"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></Field><Field label="Situação"><select className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm" defaultValue={appointment.paymentStatus} id={`payment-${appointment.id}`}><option value="pending">Pendente</option><option value="paid">Pago</option><option value="waived">Cortesia</option><option value="refunded">Estornado</option></select></Field><Button disabled={busy} onClick={() => { const select = document.getElementById(`payment-${appointment.id}`) as HTMLSelectElement | null; return mutate({ action: "appointment_payment", id: appointment.id, amountCents: amount ? Math.round(Number(amount.replace(",", ".")) * 100) : null, paymentStatus: select?.value || appointment.paymentStatus, paymentMethod: "manual" }, "Financeiro atualizado."); }}>Salvar</Button></div>;
}

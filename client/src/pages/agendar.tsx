import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarClock, CheckCircle2, Clock3, MapPin, ShieldCheck, Star, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  formatMoneyBRL,
  type Appointment,
  type PublicProviderProfile,
  type PublicSlot,
} from "@shared/operations";

function queryParam(name: string): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  return new URLSearchParams(query).get(name)?.trim() ?? "";
}

function todayLocal(): string {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function displayLocal(value: string): string {
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} às ${time}`;
}

export default function AgendarPage() {
  const { toast } = useToast();
  const providerSlug = queryParam("provider");
  const [profile, setProfile] = useState<PublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [slots, setSlots] = useState<PublicSlot[]>([]);
  const [slot, setSlot] = useState<PublicSlot | null>(null);
  const [booking, setBooking] = useState({ guardianName: "", guardianPhone: "", guardianEmail: "", patientName: "", privacy: false });
  const [bookingToken, setBookingToken] = useState(() => {
    try { return sessionStorage.getItem("neuroped:booking-token") || ""; } catch { return ""; }
  });
  const [managed, setManaged] = useState<Appointment | null>(null);
  const [manageToken, setManageToken] = useState(bookingToken);
  const [review, setReview] = useState({ rating: "5", comment: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!providerSlug) {
        setError("Este link de agendamento não informa o profissional.");
        setLoading(false);
        return;
      }
      try {
        const response = await apiRequest("GET", `/api/public-booking?action=profile&provider=${encodeURIComponent(providerSlug)}`);
        const data = await response.json() as PublicProviderProfile;
        if (!active) return;
        setProfile(data);
        setServiceId(data.services[0]?.id ?? "");
      } catch {
        if (active) setError("O perfil de agendamento não está disponível agora.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [providerSlug]);

  const selectedService = useMemo(() => profile?.services.find((item) => item.id === serviceId) ?? null, [profile, serviceId]);
  const averageRating = useMemo(() => {
    if (!profile?.reviews.length) return null;
    return profile.reviews.reduce((sum, item) => sum + item.rating, 0) / profile.reviews.length;
  }, [profile]);

  async function loadSlots() {
    if (!providerSlug || !serviceId || !date) return;
    setBusy(true);
    setSlot(null);
    try {
      const response = await apiRequest("GET", `/api/public-booking?action=slots&provider=${encodeURIComponent(providerSlug)}&service=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`);
      const data = await response.json() as { slots: PublicSlot[] };
      setSlots(data.slots ?? []);
    } catch (err) {
      setSlots([]);
      toast({ title: "Não foi possível consultar horários.", description: String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function submitBooking() {
    if (!slot || !selectedService) return;
    setBusy(true);
    try {
      const response = await apiRequest("POST", "/api/public-booking", {
        action: "book",
        provider: providerSlug,
        serviceId: selectedService.id,
        startsAtLocal: slot.startsAtLocal,
        guardianName: booking.guardianName,
        guardianPhone: booking.guardianPhone,
        guardianEmail: booking.guardianEmail,
        patientName: booking.patientName,
        privacyAccepted: booking.privacy,
      });
      const data = await response.json() as { bookingToken: string; message: string };
      setBookingToken(data.bookingToken);
      setManageToken(data.bookingToken);
      try { sessionStorage.setItem("neuroped:booking-token", data.bookingToken); } catch { /* token segue visível */ }
      toast({ title: "Solicitação registrada ✓", description: data.message });
      await manageBooking(data.bookingToken);
    } catch (err) {
      toast({ title: "Não foi possível solicitar o horário.", description: String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function manageBooking(token = manageToken) {
    if (!token.trim()) return;
    setBusy(true);
    try {
      const response = await apiRequest("POST", "/api/public-booking", { action: "manage", token: token.trim() });
      const data = await response.json() as { appointment: Appointment };
      setManaged(data.appointment);
      setServiceId(data.appointment.serviceId);
      setManageToken(token.trim());
    } catch (err) {
      setManaged(null);
      toast({ title: "Reserva não encontrada.", description: String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function rescheduleBooking() {
    if (!manageToken || !managed || !slot) return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/public-booking", {
        action: "reschedule",
        token: manageToken,
        startsAtLocal: slot.startsAtLocal,
      });
      toast({ title: "Remarcação solicitada ✓", description: "A clínica precisa reconfirmar o novo horário." });
      setSlot(null);
      await manageBooking(manageToken);
    } catch (err) {
      toast({ title: "Não foi possível remarcar.", description: String(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking() {
    if (!manageToken || !managed) return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/public-booking", { action: "cancel", token: manageToken });
      toast({ title: "Reserva cancelada." });
      await manageBooking(manageToken);
    } catch (err) {
      toast({ title: "Não foi possível cancelar.", description: String(err), variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function joinWaitlist() {
    if (!selectedService) return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/public-booking", {
        action: "waitlist",
        provider: providerSlug,
        serviceId: selectedService.id,
        preferredDate: date,
        guardianName: booking.guardianName,
        guardianPhone: booking.guardianPhone,
        guardianEmail: booking.guardianEmail,
        patientName: booking.patientName,
        privacyAccepted: booking.privacy,
      });
      toast({ title: "Entrada na lista de espera registrada ✓" });
    } catch (err) {
      toast({ title: "Não foi possível entrar na lista de espera.", description: String(err), variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function sendReview() {
    if (!manageToken || managed?.status !== "completed") return;
    setBusy(true);
    try {
      await apiRequest("POST", "/api/public-booking", { action: "review", token: manageToken, rating: Number(review.rating), comment: review.comment });
      toast({ title: "Avaliação recebida. Ela será moderada antes de ficar pública." });
      setReview({ rating: "5", comment: "" });
    } catch (err) {
      toast({ title: "Não foi possível enviar a avaliação.", description: String(err), variant: "destructive" });
    } finally { setBusy(false); }
  }

  if (loading) return <div className="mx-auto max-w-3xl p-8 text-sm text-muted-foreground">Carregando agendamento…</div>;
  if (error || !profile) return <div className="mx-auto max-w-2xl rounded-3xl border p-8 text-center"><h1 className="text-xl font-bold">Agendamento indisponível</h1><p className="mt-2 text-sm text-muted-foreground">{error || "Perfil não encontrado."}</p></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <header className="overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-6 sm:p-8">
        <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><UserRound className="h-6 w-6" /></span><div><Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/10">Agendamento NeuroPed</Badge><h1 className="text-2xl font-black">{profile.displayName}</h1><p className="mt-1 text-sm text-muted-foreground">{profile.specialty}</p>{profile.locationLabel && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{profile.locationLabel}</p>}{averageRating !== null && <p className="mt-2 flex items-center gap-1.5 text-xs"><Star className="h-3.5 w-3.5 fill-current text-amber-500" />{averageRating.toFixed(1)} · {profile.reviews.length} avaliação{profile.reviews.length === 1 ? "" : "ões"}</p>}</div></div>
      </header>

      {!profile.bookingEnabled ? (
        <Card><CardContent className="p-6"><h2 className="font-bold">Agendamento online ainda não está ativo</h2><p className="mt-2 text-sm text-muted-foreground">O perfil pode ser consultado, mas nenhum horário é oferecido enquanto a clínica não habilitar a agenda.</p></CardContent></Card>
      ) : (
        <Card><CardContent className="space-y-5 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label htmlFor="public-service">Serviço</Label><select id="public-service" value={serviceId} onChange={(e) => { setServiceId(e.target.value); setSlots([]); setSlot(null); }} className="min-h-11 w-full rounded-xl border bg-background px-3 text-sm">{profile.services.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} min</option>)}</select></div><div className="space-y-1.5"><Label htmlFor="public-date">Data</Label><Input id="public-date" type="date" min={todayLocal()} value={date} onChange={(e) => { setDate(e.target.value); setSlots([]); setSlot(null); }} /></div></div>{selectedService && <div className="rounded-2xl border bg-muted/30 p-4 text-sm"><div className="flex flex-wrap items-center gap-3"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" />{selectedService.durationMinutes} min</span><span>{selectedService.modality === "remote" ? "Atendimento remoto" : "Atendimento presencial"}</span><strong>{formatMoneyBRL(selectedService.priceCents)}</strong></div></div>}<Button onClick={loadSlots} disabled={busy || !serviceId || !date} className="gap-2"><CalendarClock className="h-4 w-4" />Consultar horários</Button>{slots.length > 0 && <div><Label>Horários disponíveis</Label><div className="mt-2 flex flex-wrap gap-2">{slots.map((item) => <button type="button" key={item.startsAtLocal} onClick={() => setSlot(item)} className={`min-h-11 rounded-xl border px-4 text-sm font-semibold ${slot?.startsAtLocal === item.startsAtLocal ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/40"}`}>{item.startsAtLocal.slice(11)}</button>)}</div></div>}{slots.length === 0 && !busy && <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum horário carregado para esta data. Consulte os horários ou use a lista de espera.</div>}

          <div className="grid gap-4 sm:grid-cols-2"><Field label="Nome da criança"><Input value={booking.patientName} onChange={(e) => setBooking((p) => ({ ...p, patientName: e.target.value }))} autoComplete="off" /></Field><Field label="Responsável"><Input value={booking.guardianName} onChange={(e) => setBooking((p) => ({ ...p, guardianName: e.target.value }))} autoComplete="name" /></Field><Field label="Telefone"><Input value={booking.guardianPhone} onChange={(e) => setBooking((p) => ({ ...p, guardianPhone: e.target.value }))} inputMode="tel" autoComplete="tel" /></Field><Field label="E-mail"><Input value={booking.guardianEmail} onChange={(e) => setBooking((p) => ({ ...p, guardianEmail: e.target.value }))} type="email" autoComplete="email" /></Field></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm"><input type="checkbox" checked={booking.privacy} onChange={(e) => setBooking((p) => ({ ...p, privacy: e.target.checked }))} className="mt-1 h-4 w-4" /><span><strong>Aviso de privacidade do agendamento.</strong><span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Concordo com o uso destes dados mínimos para solicitar, confirmar, remarcar ou cancelar a consulta. Não informe diagnóstico, medicação ou detalhes clínicos nesta etapa.</span></span></label>
          <div className="flex flex-wrap gap-2"><Button disabled={busy || !slot || !booking.privacy || !booking.guardianName || !booking.patientName} onClick={submitBooking}>Solicitar este horário</Button><Button variant="outline" disabled={busy || !booking.privacy || !booking.guardianName || !booking.patientName} onClick={joinWaitlist}>Entrar na lista de espera</Button></div>
        </CardContent></Card>
      )}

      {bookingToken && <Card className="border-emerald-500/25 bg-emerald-500/5"><CardContent className="p-5"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div className="min-w-0"><p className="font-bold">Código da reserva</p><p className="mt-1 break-all font-mono text-xs">{bookingToken}</p><p className="mt-2 text-xs text-muted-foreground">Guarde este código. Ele é a chave para consultar ou cancelar a reserva; não compartilhe em público.</p></div></div></CardContent></Card>}

      <Card><CardContent className="space-y-4 p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="font-bold">Consultar minha reserva</h2></div><div className="flex flex-col gap-2 sm:flex-row"><Input value={manageToken} onChange={(e) => setManageToken(e.target.value)} placeholder="Cole o código da reserva" className="font-mono text-xs" /><Button onClick={() => manageBooking()} disabled={busy || !manageToken.trim()}>Consultar</Button></div>{managed && <div className="rounded-2xl border p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{managed.status}</Badge><strong>{managed.serviceName}</strong></div><p className="mt-2 text-sm">{displayLocal(managed.startsAtLocal)}</p><p className="mt-1 text-xs text-muted-foreground">{managed.patientName} · responsável: {managed.guardianName}</p>{["requested", "confirmed"].includes(managed.status) && <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={cancelBooking} disabled={busy}>Cancelar reserva</Button>{slot && slot.startsAtLocal !== managed.startsAtLocal && <Button onClick={rescheduleBooking} disabled={busy}>Remarcar para {slot.startsAtLocal.slice(11)}</Button>}</div>}{managed.status === "completed" && <div className="mt-5 space-y-3 border-t pt-4"><h3 className="font-semibold">Avaliar atendimento</h3><div className="flex gap-2">{[1,2,3,4,5].map((n) => <button key={n} type="button" onClick={() => setReview((p) => ({ ...p, rating: String(n) }))} aria-label={`${n} estrelas`} className={review.rating === String(n) ? "text-amber-500" : "text-muted-foreground"}><Star className="h-6 w-6 fill-current" /></button>)}</div><Textarea value={review.comment} onChange={(e) => setReview((p) => ({ ...p, comment: e.target.value.slice(0, 600) }))} placeholder="Comentário opcional; evite dados clínicos sensíveis." /><Button onClick={sendReview} disabled={busy}>Enviar avaliação</Button></div>}</div>}</CardContent></Card>

      {profile.reviews.length > 0 && <section className="space-y-3"><h2 className="text-lg font-bold">Avaliações após consultas concluídas</h2><div className="grid gap-3 md:grid-cols-2">{profile.reviews.slice(0, 6).map((item, index) => <Card key={`${item.createdAt}-${index}`}><CardContent className="p-4"><div className="flex items-center gap-1 text-amber-500">{Array.from({ length: item.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>{item.comment && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.comment}</p>}</CardContent></Card>)}</div></section>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

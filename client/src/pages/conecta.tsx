import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  MessageCircle,
  Moon,
  Pill,
  Plus,
  School,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  persistentSecureGet,
  persistentSecureSet,
} from "@/lib/persistentSecureStorage";
import {
  CONECTA_DISCLAIMER,
  conectaCategories,
  conectaCategoryLabels,
  conectaContextLabels,
  type ConectaCategory,
  type ConectaContext,
  type ConectaEvent,
  type ConectaEventInput,
  type ConectaInsight,
} from "@shared/conecta";
import {
  buildConectaInsights,
  countByCategory,
  eventsWithinDays,
  latestConectaEvent,
} from "@/lib/conectaEngine";

interface PatientSummary {
  id: string;
  name: string;
  birthDate?: string | null;
}

type BackendMode = "remote" | "local" | "demo-db" | "unavailable";

const PERIODS = [7, 30, 90, 180] as const;
const VALUE_CATEGORIES = new Set<ConectaCategory>([
  "humor",
  "irritabilidade",
  "atencao",
  "energia_agitacao",
  "apetite",
  "efeito_percebido",
  "efeito_adverso",
  "escola",
  "terapia",
  "cefaleia",
  "comportamento",
  "autonomia",
  "sensorial",
  "comunicacao",
]);
const DURATION_CATEGORIES = new Set<ConectaCategory>([
  "sono",
  "crise_epileptica",
  "cefaleia",
]);

function initialPatientFromHash(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  return new URLSearchParams(query).get("patient")?.trim() ?? "";
}

function localStoreKey(patientId: string): string {
  return `conecta:events:${patientId}:v1`;
}

function nowForInput(): string {
  const date = new Date();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "Horário não disponível";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ageText(birthDate?: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(`${birthDate}T12:00:00`);
  if (!Number.isFinite(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? `${age} ano${age === 1 ? "" : "s"}` : null;
}

function categoryIcon(category: ConectaCategory) {
  if (category === "sono") return Moon;
  if (category === "medicacao" || category === "efeito_percebido" || category === "efeito_adverso") return Pill;
  if (category === "escola") return School;
  if (category === "terapia") return Users;
  if (category === "crise_epileptica" || category === "cefaleia") return Activity;
  if (category === "comunicacao") return MessageCircle;
  if (category === "atencao") return Brain;
  return Sparkles;
}

function emptyDetail(): NonNullable<ConectaEventInput["detail"]> {
  return {};
}

export default function ConectaPage() {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const remoteSession = accessMode === "remote" && isAuthenticated;
  const [patientId, setPatientId] = useState(initialPatientFromHash);
  const [periodDays, setPeriodDays] = useState<(typeof PERIODS)[number]>(30);
  const [events, setEvents] = useState<ConectaEvent[]>([]);
  const [backendMode, setBackendMode] = useState<BackendMode>(remoteSession ? "remote" : "local");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [savedEvent, setSavedEvent] = useState<ConectaEvent | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<ConectaInsight | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<ConectaCategory | "all">("all");

  const [category, setCategory] = useState<ConectaCategory>("sono");
  const [occurredAt, setOccurredAt] = useState(nowForInput);
  const [context, setContext] = useState<ConectaContext | "">("");
  const [value, setValue] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [note, setNote] = useState("");
  const [detail, setDetail] = useState<NonNullable<ConectaEventInput["detail"]>>(emptyDetail);
  const [saving, setSaving] = useState(false);

  const patientsQuery = useQuery<any>({
    queryKey: ["/api/patients"],
    enabled: accessMode !== "checking",
  });
  const patients = useMemo<PatientSummary[]>(() => {
    if (Array.isArray(patientsQuery.data)) return patientsQuery.data;
    if (Array.isArray(patientsQuery.data?.data)) return patientsQuery.data.data;
    return [];
  }, [patientsQuery.data]);
  const selectedPatient = patients.find((patient) => patient.id === patientId) ?? null;

  useEffect(() => {
    if (!patientId && patients.length === 1) setPatientId(patients[0].id);
  }, [patientId, patients]);

  useEffect(() => {
    setBackendMode(remoteSession ? "remote" : "local");
  }, [remoteSession]);

  useEffect(() => {
    // Estado transitório e contagens pertencem exclusivamente ao paciente/modo ativo.
    // Isso impede que confirmação, insight ou contagem do paciente anterior apareçam na troca.
    setEvents([]);
    setSavedEvent(null);
    setSelectedInsight(null);
    setRegisterOpen(false);
    setTimelineFilter("all");
    setStorageError(null);
  }, [patientId, remoteSession]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!patientId) {
        setEvents([]);
        return;
      }
      setLoadingEvents(true);
      setStorageError(null);
      try {
        if (remoteSession) {
          const response = await apiRequest(
            "GET",
            `/api/conecta/events?patient_id=${encodeURIComponent(patientId)}&days=365`,
          );
          const data = await response.json();
          if (cancelled) return;
          const rows = Array.isArray(data?.data) ? (data.data as ConectaEvent[]) : [];
          setEvents(rows);
          setBackendMode(data?.mode === "demo-db" ? "demo-db" : "remote");
        } else {
          const restored = await persistentSecureGet<ConectaEvent[]>(localStoreKey(patientId));
          if (cancelled) return;
          setEvents(Array.isArray(restored) ? restored : []);
          setBackendMode("local");
        }
      } catch {
        if (cancelled) return;
        setEvents([]);
        setStorageError(
          remoteSession
            ? "Não foi possível carregar os registros agora. Nenhum dado demonstrativo foi usado como substituto."
            : "O armazenamento local protegido não pôde ser lido neste dispositivo.",
        );
        setBackendMode("unavailable");
      } finally {
        if (!cancelled) setLoadingEvents(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [patientId, remoteSession]);

  const periodEvents = useMemo(
    () => eventsWithinDays(events, periodDays),
    [events, periodDays],
  );
  const todayEvents = useMemo(() => eventsWithinDays(events, 1), [events]);
  const categoryCounts = useMemo(() => countByCategory(events, periodDays), [events, periodDays]);
  const insights = useMemo(
    () => buildConectaInsights(events, periodDays),
    [events, periodDays],
  );
  const latest = useMemo(() => latestConectaEvent(events), [events]);
  const timeline = useMemo(
    () =>
      [...periodEvents]
        .filter((event) => timelineFilter === "all" || event.category === timelineFilter)
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 60),
    [periodEvents, timelineFilter],
  );

  function resetForm(nextCategory: ConectaCategory = "sono") {
    setCategory(nextCategory);
    setOccurredAt(nowForInput());
    setContext("");
    setValue("");
    setDurationMinutes("");
    setNote("");
    setDetail(emptyDetail());
  }

  function openRegister(nextCategory?: ConectaCategory) {
    resetForm(nextCategory ?? category);
    setSavedEvent(null);
    setRegisterOpen(true);
  }

  async function saveEvent() {
    if (!patientId) {
      toast({ title: "Selecione um paciente antes de registrar.", variant: "destructive" });
      return;
    }
    const date = new Date(occurredAt);
    if (!Number.isFinite(date.getTime())) {
      toast({ title: "Informe uma data e horário válidos.", variant: "destructive" });
      return;
    }
    const parsedValue = value ? Number(value) : undefined;
    const parsedDuration = durationMinutes ? Number(durationMinutes) : undefined;
    const input: ConectaEventInput = {
      patientId,
      category,
      occurredAt: date.toISOString(),
      ...(context ? { context } : {}),
      ...(Number.isFinite(parsedValue) ? { value: parsedValue } : {}),
      ...(Number.isFinite(parsedDuration) ? { durationMinutes: parsedDuration } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(Object.keys(detail).length ? { detail } : {}),
    };

    setSaving(true);
    setStorageError(null);
    try {
      let created: ConectaEvent;
      if (remoteSession) {
        const response = await apiRequest("POST", "/api/conecta/events", input);
        created = (await response.json()) as ConectaEvent;
        setBackendMode(created.storageMode === "demo-db" ? "demo-db" : "remote");
      } else {
        created = {
          id: `local-conecta-${crypto.randomUUID()}`,
          ...input,
          authorUserId: null,
          createdAt: new Date().toISOString(),
          storageMode: "local",
        };
        const next = [...events, created].slice(-1000);
        const persisted = await persistentSecureSet(localStoreKey(patientId), next);
        if (!persisted) throw new Error("local storage failed");
      }
      setEvents((previous) => [...previous.filter((item) => item.id !== created.id), created]);
      setSavedEvent(created);
      toast({ title: "Registro salvo ✓" });
    } catch {
      setStorageError("Não foi possível salvar o registro. Nada foi simulado ou considerado salvo.");
      toast({ title: "Não foi possível salvar o registro.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(event: ConectaEvent) {
    if (!confirm("Apagar este registro da jornada?")) return;
    try {
      if (remoteSession) {
        await apiRequest("DELETE", `/api/conecta/events/${encodeURIComponent(event.id)}`);
      } else {
        const next = events.filter((item) => item.id !== event.id);
        const persisted = await persistentSecureSet(localStoreKey(patientId), next);
        if (!persisted) throw new Error("local storage failed");
      }
      setEvents((previous) => previous.filter((item) => item.id !== event.id));
      toast({ title: "Registro removido." });
    } catch {
      toast({ title: "Não foi possível remover o registro.", variant: "destructive" });
    }
  }

  const modeLabel =
    backendMode === "demo-db"
      ? "DEMONSTRAÇÃO"
      : backendMode === "remote"
        ? "Conta autenticada"
        : backendMode === "local"
          ? "Modo local protegido"
          : "Armazenamento indisponível";

  return (
    <div className="space-y-6 pb-20">
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-indigo-500/10 p-5 sm:p-7">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">NeuroPed Conecta</Badge>
              <Badge variant={backendMode === "demo-db" ? "destructive" : "outline"}>{modeLabel}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Jornada neurofuncional</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Registre, organize e visualize mudanças de casa, escola, terapias, sono, comportamento, medicações e eventos neurológicos sem transformar tendências em diagnóstico.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="min-h-12 gap-2 rounded-2xl px-5 shadow-sm"
            onClick={() => openRegister()}
            disabled={!patientId || backendMode === "unavailable"}
          >
            <Plus className="h-5 w-5" /> Registrar
          </Button>
        </div>
      </section>

      <Card className="border-border/70">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="conecta-patient">Paciente</Label>
              <select
                id="conecta-patient"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                aria-label="Selecionar paciente da jornada"
              >
                <option value="">Selecione um paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
              {patientsQuery.isError && (
                <p className="text-xs text-destructive">Não foi possível carregar a lista de pacientes.</p>
              )}
            </div>
            <Link href="/pacientes">
              <Button variant="outline" className="min-h-11 w-full gap-2 lg:w-auto">
                <Users className="h-4 w-4" /> Gerenciar pacientes
              </Button>
            </Link>
          </div>
          {selectedPatient && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedPatient.name}</span>
              {ageText(selectedPatient.birthDate) && <span>• {ageText(selectedPatient.birthDate)}</span>}
              <span>• {events.length} registro{events.length === 1 ? "" : "s"} carregado{events.length === 1 ? "" : "s"}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {storageError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {storageError}
        </div>
      )}

      {!patientId ? (
        <Card>
          <CardContent className="grid min-h-56 place-items-center p-8 text-center">
            <div className="max-w-md space-y-3">
              <Brain className="mx-auto h-9 w-9 text-primary/70" />
              <h2 className="font-semibold">Selecione uma criança para abrir a jornada</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O Conecta nunca preenche uma conta real com dados fictícios. Sem paciente selecionado, a jornada permanece vazia.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : loadingEvents ? (
        <Card><CardContent className="p-8 text-sm text-muted-foreground" role="status">Carregando jornada protegida…</CardContent></Card>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 overflow-hidden border-primary/15">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Hoje</p>
                    <h2 className="mt-1 text-xl font-semibold">Como está a jornada registrada?</h2>
                  </div>
                  <Badge variant="secondary">{todayEvents.length} hoje</Badge>
                </div>
                {todayEvents.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed p-5">
                    <p className="text-sm font-medium">Ainda não há registros nas últimas 24 horas.</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Ausência de registro não é interpretada como normalidade.</p>
                    <Button variant="outline" className="mt-4 min-h-11" onClick={() => openRegister()}>
                      <Plus className="mr-2 h-4 w-4" /> Fazer primeiro registro de hoje
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {["sono", "humor", "atencao", "irritabilidade", "escola", "terapia"].map((raw) => {
                      const item = raw as ConectaCategory;
                      const count = todayEvents.filter((event) => event.category === item).length;
                      const Icon = categoryIcon(item);
                      return (
                        <button
                          type="button"
                          key={item}
                          onClick={() => openRegister(item)}
                          className="flex min-h-14 items-center gap-3 rounded-2xl border bg-card p-3 text-left transition hover:border-primary/30 hover:bg-primary/[0.03]"
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{conectaCategoryLabels[item]}</span><span className="block text-xs text-muted-foreground">{count ? `${count} registro${count > 1 ? "s" : ""}` : "Sem registro hoje"}</span></span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-indigo-500/15 bg-gradient-to-b from-indigo-500/[0.06] to-background">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-[0.12em]">Insight do período</span>
                </div>
                {insights[0] ? (
                  <div className="mt-4 space-y-3">
                    <h2 className="font-semibold leading-snug">{insights[0].title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{insights[0].body}</p>
                    <Button variant="outline" className="min-h-11 w-full" onClick={() => setSelectedInsight(insights[0])}>
                      Por que estou vendo isso?
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <h2 className="font-semibold">Ainda não há dados suficientes</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">O Conecta não cria inferências para preencher espaços vazios. Continue registrando somente o que foi observado.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {savedEvent && (
            <Card className="border-emerald-500/25 bg-emerald-500/[0.05]">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Registro salvo ✓</p>
                  <p className="mt-1 text-sm text-muted-foreground">{conectaCategoryLabels[savedEvent.category]} · {formatWhen(savedEvent.occurredAt)}. Já entrou na jornada longitudinal.</p>
                </div>
                <Button variant="outline" className="min-h-11" onClick={() => setPeriodDays(30)}><BarChart3 className="mr-2 h-4 w-4" /> Ver tendência</Button>
              </CardContent>
            </Card>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Insights</p>
                <h2 className="mt-1 text-xl font-semibold">Padrões explicáveis, sem caixa-preta</h2>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Período dos insights">
                {PERIODS.map((days) => (
                  <Button key={days} size="sm" variant={periodDays === days ? "default" : "outline"} className="min-h-10" onClick={() => setPeriodDays(days)}>
                    {days} dias
                  </Button>
                ))}
              </div>
            </div>
            {insights.length === 0 ? (
              <Card><CardContent className="p-6"><div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-medium">Sem insight seguro para este período</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Há {periodEvents.length} registro{periodEvents.length === 1 ? "" : "s"}. O motor só destaca padrões quando há quantidade e contraste mínimos; do contrário, retorna dados insuficientes.</p></div></div></CardContent></Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {insights.map((insight) => (
                  <Card key={insight.id} className="h-full border-border/70">
                    <CardContent className="flex h-full flex-col p-5">
                      <Badge variant="secondary" className="w-fit capitalize">{insight.kind}</Badge>
                      <h3 className="mt-3 font-semibold">{insight.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{insight.body}</p>
                      <button type="button" className="mt-4 min-h-11 text-left text-sm font-medium text-primary hover:underline" onClick={() => setSelectedInsight(insight)}>Por que estou vendo isso?</button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <p className="rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">{CONECTA_DISCLAIMER}</p>
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,.5fr)]">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Timeline</p><h2 className="mt-1 text-lg font-semibold">Jornada unificada</h2></div>
                  <select value={timelineFilter} onChange={(event) => setTimelineFilter(event.target.value as ConectaCategory | "all")} className="min-h-11 rounded-xl border border-input bg-background px-3 text-sm" aria-label="Filtrar timeline">
                    <option value="all">Tudo</option>
                    {conectaCategories.map((item) => <option key={item} value={item}>{conectaCategoryLabels[item]}</option>)}
                  </select>
                </div>
                {timeline.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-dashed p-6 text-center"><ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-medium">Nenhum registro neste recorte.</p><p className="mt-1 text-xs text-muted-foreground">O estado vazio é mantido sem preenchimento automático.</p></div>
                ) : (
                  <div className="mt-5 space-y-2">
                    {timeline.map((event) => {
                      const Icon = categoryIcon(event.category);
                      return (
                        <div key={event.id} className="group flex gap-3 rounded-2xl border border-transparent p-3 hover:border-border hover:bg-muted/30">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><p className="text-sm font-semibold">{conectaCategoryLabels[event.category]}</p><span className="text-xs text-muted-foreground">{formatWhen(event.occurredAt)}</span></div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {event.context && <span>{conectaContextLabels[event.context]}</span>}
                              {typeof event.value === "number" && <span>Intensidade {event.value}/5</span>}
                              {typeof event.durationMinutes === "number" && <span>{event.durationMinutes} min</span>}
                            </div>
                            {event.note && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{event.note}</p>}
                          </div>
                          <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground opacity-70 hover:bg-destructive/10 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100" onClick={() => void removeEvent(event)} aria-label={`Apagar registro de ${conectaCategoryLabels[event.category]}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Resumo</p><div className="mt-4 space-y-3"><div className="flex items-center justify-between text-sm"><span>Registros no período</span><strong>{periodEvents.length}</strong></div><div className="flex items-center justify-between text-sm"><span>Último registro</span><strong className="text-right text-xs">{latest ? formatWhen(latest.occurredAt) : "—"}</strong></div>{Object.entries(categoryCounts).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 4).map(([key, count]) => <div key={key} className="flex items-center justify-between text-sm"><span>{conectaCategoryLabels[key as ConectaCategory]}</span><strong>{count}</strong></div>)}</div></CardContent></Card>
              <Card className="border-amber-500/20"><CardContent className="p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-600" /><h3 className="font-semibold">Segurança medicamentosa</h3></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">O Conecta registra adesão, efeitos percebidos e eventos adversos. Não inicia, suspende, aumenta ou reduz dose. Alterações de tratamento devem ser realizadas somente pelo profissional responsável.</p></CardContent></Card>
            </div>
          </section>

          <section className="space-y-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Acoplamento NeuroPed</p><h2 className="mt-1 text-lg font-semibold">Abrir módulos relacionados</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["/diario-sono", "Sono", Moon],
                ["/diario-escola", "Escola", School],
                ["/epilepsia", "Epilepsia", Activity],
                ["/satisfacao-medicacao", "Medicações", Pill],
                ["/plano-terapeutico", "Terapias", HeartPulse],
                ["/documentos", "Documentos", BookOpen],
                ["/pre-consulta", "Preparar consulta", Calendar],
                ["/portal-familia", "Portal da família", Users],
              ].map(([href, label, Icon]) => (
                <Link key={String(href)} href={String(href)}>
                  <Card className="h-full transition hover:border-primary/30 hover:shadow-sm"><CardContent className="flex min-h-20 items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><span className="text-sm font-medium">{String(label)}</span><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></CardContent></Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      <Sheet open={registerOpen} onOpenChange={setRegisterOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
          <SheetHeader className="mx-auto w-full max-w-3xl text-left">
            <SheetTitle>Registrar na jornada</SheetTitle>
            <SheetDescription>Registro observacional rápido. Preencha apenas o que foi efetivamente observado ou informado.</SheetDescription>
          </SheetHeader>
          <div className="mx-auto mt-5 w-full max-w-3xl space-y-5">
            <div className="space-y-2"><Label>O que você quer registrar?</Label><div className="flex gap-2 overflow-x-auto pb-2">{conectaCategories.map((item) => { const Icon = categoryIcon(item); return <button type="button" key={item} onClick={() => { setCategory(item); setValue(""); setDurationMinutes(""); setDetail(emptyDetail()); }} className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-medium transition ${category === item ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/30"}`}><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{conectaCategoryLabels[item]}</span></button>; })}</div></div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="conecta-when">Data e horário</Label><Input id="conecta-when" type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="conecta-context">Contexto</Label><select id="conecta-context" value={context} onChange={(event) => setContext(event.target.value as ConectaContext | "")} className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Não informado</option>{Object.entries(conectaContextLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
            </div>

            {VALUE_CATEGORIES.has(category) && (
              <div className="space-y-2"><Label>Intensidade / impacto percebido</Label><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((item) => <button key={item} type="button" onClick={() => setValue(String(item))} className={`min-h-12 rounded-xl border text-sm font-semibold ${value === String(item) ? "border-primary bg-primary text-primary-foreground" : "bg-background"}`}>{item}</button>)}</div><p className="text-[11px] text-muted-foreground">1 = menor · 5 = maior. É uma escala de registro, não um escore diagnóstico.</p></div>
            )}

            {DURATION_CATEGORIES.has(category) && (
              <div className="space-y-2"><Label htmlFor="conecta-duration">Duração em minutos</Label><Input id="conecta-duration" type="number" min={0} max={10080} inputMode="numeric" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} placeholder={category === "sono" ? "Ex.: 480 para 8 horas" : "Ex.: 2"} /></div>
            )}

            {category === "medicacao" && (
              <div className="space-y-2"><Label htmlFor="conecta-med-taken">Medicação programada foi administrada?</Label><select id="conecta-med-taken" value={detail.medicationTaken === undefined ? "" : detail.medicationTaken ? "sim" : "nao"} onChange={(event) => setDetail((previous) => ({ ...previous, medicationTaken: event.target.value === "" ? undefined : event.target.value === "sim" }))} className="min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Não informado</option><option value="sim">Sim</option><option value="nao">Não</option></select><p className="text-xs text-muted-foreground">O registro não oferece qualquer comando de ajuste de tratamento.</p></div>
            )}
            {category === "efeito_percebido" && <div className="space-y-2"><Label htmlFor="conecta-effect">Efeito percebido</Label><Input id="conecta-effect" value={detail.perceivedEffect ?? ""} onChange={(event) => setDetail((previous) => ({ ...previous, perceivedEffect: event.target.value.slice(0, 240) }))} placeholder="Descrição breve e observacional" /></div>}
            {category === "efeito_adverso" && <div className="space-y-2"><Label htmlFor="conecta-adverse">Efeito adverso percebido</Label><Input id="conecta-adverse" value={detail.adverseEffect ?? ""} onChange={(event) => setDetail((previous) => ({ ...previous, adverseEffect: event.target.value.slice(0, 240) }))} placeholder="Descrição breve" /></div>}
            {category === "crise_epileptica" && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="conecta-recovery">Recuperação</Label><Input id="conecta-recovery" value={detail.recovery ?? ""} onChange={(event) => setDetail((previous) => ({ ...previous, recovery: event.target.value.slice(0, 240) }))} placeholder="Como ficou após o evento" /></div><div className="space-y-2"><Label htmlFor="conecta-trigger">Possível gatilho relatado</Label><Input id="conecta-trigger" value={detail.trigger ?? ""} onChange={(event) => setDetail((previous) => ({ ...previous, trigger: event.target.value.slice(0, 240) }))} placeholder="Opcional; não implica causalidade" /></div></div>}
            {category === "escola" && <div className="space-y-2"><Label htmlFor="conecta-school-support">Adaptação / apoio utilizado</Label><Input id="conecta-school-support" value={detail.schoolSupport ?? ""} onChange={(event) => setDetail((previous) => ({ ...previous, schoolSupport: event.target.value.slice(0, 240) }))} placeholder="Ex.: instrução curta, pausa, apoio visual" /></div>}

            <div className="space-y-2"><Label htmlFor="conecta-note">Observação opcional</Label><Textarea id="conecta-note" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Somente fatos observados ou claramente informados" rows={3} /><p className="text-right text-[11px] text-muted-foreground">{note.length}/1000</p></div>

            {category === "crise_epileptica" && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4"><p className="font-semibold">Durante uma crise</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Proteja contra trauma, afaste objetos, lateralize quando possível, não coloque nada na boca, observe a duração e siga o plano de emergência individual. Acione o SAMU 192 quando indicado pelo plano ou diante de emergência.</p></div>
            )}

            <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 pb-1 pt-4 backdrop-blur sm:-mx-6 sm:px-6"><Button className="min-h-12 w-full" disabled={saving} onClick={() => void saveEvent()}>{saving ? "Salvando…" : "Salvar registro"}</Button></div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Por que estou vendo isso?</DialogTitle><DialogDescription>Transparência da análise — dados, período e limitações.</DialogDescription></DialogHeader>
          {selectedInsight && (
            <div className="space-y-4">
              <div><h3 className="font-semibold">{selectedInsight.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{selectedInsight.body}</p></div>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Período</p><p className="mt-1 font-semibold">{selectedInsight.evidence.periodDays} dias</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Registros analisados</p><p className="mt-1 font-semibold">{selectedInsight.evidence.recordCount}</p></div></div>
              <div><p className="text-sm font-medium">Fontes</p><div className="mt-2 flex flex-wrap gap-2">{selectedInsight.evidence.sources.map((source) => <Badge key={source} variant="secondary">{source}</Badge>)}</div></div>
              <div><p className="text-sm font-medium">Limitações</p><ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">{selectedInsight.evidence.limitations.map((limitation) => <li key={limitation}>• {limitation}</li>)}</ul></div>
              <p className="rounded-xl border p-3 text-xs leading-relaxed text-muted-foreground">{CONECTA_DISCLAIMER}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

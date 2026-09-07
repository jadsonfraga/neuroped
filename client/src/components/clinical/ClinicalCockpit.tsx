import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileText,
  Filter,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";
import { differenceInYears, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { useRecents } from "@/hooks/useFavorites";
import { ErrorState } from "@/components/ui/VisualStates";
import { SafeAssetImage, brandAssets } from "@/components/BrandAssets";

/**
 * Cockpit clínico da área autenticada.
 *
 * Responde, na ordem em que o consultório precisa: **quem é o paciente
 * atual → qual é o contexto → qual é a próxima ação**. A entrada visual do
 * Portal Profissional organiza os atalhos de rotina sem criar dados paralelos:
 * todos os CTAs apontam para rotas reais do app e o contexto clínico continua
 * derivado exclusivamente do backend da clínica ativa.
 *
 * Fronteira de dados deliberada: o cockpit **não cria nenhuma persistência nova
 * no navegador**. O paciente em foco é derivado do próprio backend (o registro
 * mais recentemente atualizado da clínica ativa) e a troca de contexto é uma
 * navegação para a ficha — nada de identificador clínico guardado em
 * localStorage/sessionStorage, coerente com a doutrina LIVE de
 * `clinicalBrowserPersistencePolicy.ts`.
 */

interface CockpitPatient {
  id: string;
  name: string;
  birthDate: string | null;
  updatedAt: string | null;
}

interface PortalLinkItem {
  href: string;
  label: string;
  hint: string;
  icon: typeof ClipboardCheck;
}

const portalQuickActions: PortalLinkItem[] = [
  {
    href: "/pacientes",
    label: "Nova avaliação",
    hint: "Paciente e contexto clínico",
    icon: UserPlus,
  },
  {
    href: "/agenda",
    label: "Agenda",
    hint: "Consultas e retornos",
    icon: CalendarDays,
  },
  {
    href: "/documentos",
    label: "Documentos",
    hint: "Laudos e materiais clínicos",
    icon: FileText,
  },
  {
    href: "/filtro",
    label: "Escalas",
    hint: "Filtro e instrumentos",
    icon: Filter,
  },
];

const portalFlow = [
  {
    step: "1",
    href: "/pre-consulta",
    label: "Anamnese e escuta ativa",
    hint: "História, contexto e queixas principais",
  },
  {
    step: "2",
    href: "/filtro",
    label: "Avaliação e hipóteses",
    hint: "Exame clínico e instrumentos adequados",
  },
  {
    step: "3",
    href: "/plano-terapeutico",
    label: "Plano de intervenção",
    hint: "Condutas, objetivos e orientações",
  },
  {
    step: "4",
    href: "/pacientes",
    label: "Acompanhamento",
    hint: "Evolução, retornos e continuidade",
  },
] as const;

const portalResources = [
  { href: "/laudo-neuroped", label: "Modelos de laudos" },
  { href: "/orientacao-parental", label: "Orientações para famílias" },
  { href: "/filtro", label: "Escalas e questionários" },
  { href: "/biblioteca-instrumentos", label: "Biblioteca de instrumentos" },
] as const;

function ageLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;
  try {
    const years = differenceInYears(new Date(), parseISO(birthDate));
    if (!Number.isFinite(years) || years < 0) return null;
    return `${years} ano${years === 1 ? "" : "s"}`;
  } catch {
    return null;
  }
}

function normalizePatients(payload: unknown): CockpitPatient[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: unknown[] }).data)
      : [];
  return rows
    .map((row) => {
      const record = row as Record<string, any>;
      const profile = (record.profile ?? record) as Record<string, any>;
      const id = typeof record.id === "string" ? record.id : null;
      if (!id) return null;
      return {
        id,
        name:
          typeof profile.name === "string" && profile.name.trim()
            ? profile.name
            : "Paciente sem nome",
        birthDate:
          typeof profile.birthDate === "string" ? profile.birthDate : null,
        updatedAt:
          typeof record.updatedAt === "string"
            ? record.updatedAt
            : typeof record.createdAt === "string"
              ? record.createdAt
              : null,
      } satisfies CockpitPatient;
    })
    .filter((patient): patient is CockpitPatient => patient !== null)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

function ActionLink({
  href,
  icon: Icon,
  label,
  hint,
  primary = false,
  testId,
}: {
  href: string;
  icon: typeof ClipboardCheck;
  label: string;
  hint: string;
  primary?: boolean;
  testId: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className={`group flex min-h-[3.25rem] items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-colors ${
        primary
          ? "border-primary/30 bg-primary/10 hover:bg-primary/15"
          : "border-border/70 bg-card/70 hover:border-border hover:bg-card"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          primary
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">
          {label}
        </span>
        <span className="block truncate text-[11.5px] text-muted-foreground">
          {hint}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

function PortalQuickAction({ item }: { item: PortalLinkItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="group flex min-h-[4.75rem] items-center gap-3 border-t border-amber-300/30 bg-card/80 px-4 py-3 transition-colors hover:bg-amber-50/80 dark:border-amber-400/15 dark:bg-card/60 dark:hover:bg-amber-950/15 sm:border-l sm:first:border-l-0"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ring-1 ring-amber-300/50 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-500/20">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-foreground">
          {item.label}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
          {item.hint}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-amber-700/70 transition-transform group-hover:translate-x-0.5 dark:text-amber-300/70"
        aria-hidden="true"
      />
    </Link>
  );
}

export function ClinicalCockpit() {
  const { accessMode, isAuthenticated, user } = useAuth();
  const { activeClinic, activeClinicId } = useClinic();
  const { recents } = useRecents();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;

  const queryKey =
    isRemoteClinical && activeClinicId
      ? `/api/live/patients?clinicId=${encodeURIComponent(activeClinicId)}`
      : "/api/patients";
  const { data, isLoading, isError, refetch } = useQuery<unknown>({
    queryKey: [queryKey],
    enabled: isRemoteClinical && Boolean(activeClinicId),
  });

  const patients = useMemo(() => normalizePatients(data), [data]);
  const current = patients[0] ?? null;
  const others = patients.slice(1, 5);

  if (!isRemoteClinical) return null;

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "";

  return (
    <section
      data-testid="cockpit-context"
      aria-label="Portal profissional e contexto clínico atual"
      className="space-y-4"
    >
      <section
        aria-label="Entrada do Portal Profissional"
        data-testid="professional-portal-entry"
        className="overflow-hidden rounded-[2rem] border border-amber-300/35 bg-card shadow-[0_30px_80px_-52px_hsl(var(--foreground)/0.55)] dark:border-amber-400/15"
      >
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
          <div className="relative z-10 flex flex-col justify-center bg-gradient-to-br from-card via-card to-amber-50/70 p-5 sm:p-7 lg:p-8 dark:to-amber-950/10">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.28em] text-amber-700 dark:text-amber-300">
              Seja bem-vindo ao
            </p>
            <h2
              className="mt-2 max-w-[8ch] text-[2.45rem] font-semibold leading-[0.9] tracking-[-0.055em] text-foreground sm:text-[3.2rem] lg:text-[3.7rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Portal{" "}
              <span className="text-amber-700 dark:text-amber-300">
                Profissional
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-[13.5px] leading-relaxed text-muted-foreground sm:text-[14.5px]">
              Um espaço para facilitar sua rotina, organizar o atendimento e
              ampliar o impacto positivo na vida de cada criança e família.
            </p>
            <p
              className="mt-5 max-w-sm text-[18px] italic leading-snug text-foreground/85"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Conhecimento hoje. Mais infâncias possíveis amanhã.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                href="/pacientes"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-[13px] font-bold text-amber-950 shadow-[0_14px_28px_-18px_hsl(40_95%_45%/0.8)] transition-transform hover:-translate-y-0.5"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Nova avaliação
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/documentos"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                Revisar documentos
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative min-h-[20rem] overflow-hidden bg-muted sm:min-h-[23rem] lg:min-h-[27rem]">
            <SafeAssetImage
              src={brandAssets.photography.retratoJaleco}
              alt="Retrato institucional do Dr. Jadson Fraga"
              className="absolute inset-0 h-full w-full object-cover object-[52%_30%]"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-card/30 via-transparent to-transparent lg:from-card/10"
              aria-hidden="true"
            />
            <figure className="absolute bottom-4 right-4 w-[47%] min-w-[11rem] max-w-[20rem] overflow-hidden rounded-[1.4rem] border-4 border-card bg-card shadow-[0_24px_55px_-28px_hsl(var(--foreground)/0.65)] sm:bottom-5 sm:right-5">
              <SafeAssetImage
                src={brandAssets.photography.atendimentoCrianca}
                alt="Dr. Jadson Fraga em atendimento com uma criança"
                className="aspect-[4/3] h-full w-full object-cover object-center"
              />
              <figcaption className="sr-only">
                Atendimento neuropediátrico em contexto lúdico.
              </figcaption>
            </figure>
            <div className="absolute right-4 top-4 max-w-[12rem] rounded-2xl border border-white/70 bg-card/90 p-3 shadow-lg backdrop-blur-md sm:right-5 sm:top-5 sm:max-w-[14rem]">
              <p
                className="text-[16px] italic leading-snug text-foreground"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cada criança tem um grande potencial.
              </p>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {portalQuickActions.map((item) => (
            <PortalQuickAction key={item.href} item={item} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.15fr_0.95fr]">
        <article className="rounded-3xl border border-border/70 bg-card/75 p-4 shadow-[0_18px_50px_-42px_hsl(var(--foreground)/0.4)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <CalendarDays className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Rotina
                </p>
                <h3 className="text-[17px] font-semibold text-foreground">
                  Agenda do dia
                </h3>
              </div>
            </div>
            <Link
              href="/agenda"
              className="inline-flex min-h-11 items-center gap-1 px-2 text-[11.5px] font-semibold text-primary hover:underline"
            >
              Ver agenda
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-muted-foreground">
            Consulte horários, retornos e status de atendimento diretamente na
            agenda clínica, sem duplicar dados de pacientes nesta página.
          </p>
          <div className="mt-4 grid gap-2">
            <ActionLink
              testId="portal-action-agenda"
              href="/agenda"
              icon={CalendarDays}
              label="Abrir agenda clínica"
              hint="Consultas, check-in e retornos"
              primary
            />
            <ActionLink
              testId="portal-action-preconsulta"
              href="/pre-consulta"
              icon={ClipboardCheck}
              label="Pré-consultas"
              hint="Organizar dados antes do atendimento"
            />
          </div>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/75 p-4 shadow-[0_18px_50px_-42px_hsl(var(--foreground)/0.4)] sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Stethoscope className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Jornada clínica
              </p>
              <h3 className="text-[17px] font-semibold text-foreground">
                Fluxo de atendimento
              </h3>
            </div>
          </div>
          <ol className="mt-4 space-y-1.5">
            {portalFlow.map((item) => (
              <li key={item.step}>
                <Link
                  href={item.href}
                  className="group flex min-h-[3.5rem] items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors hover:bg-muted/55"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[12px] font-bold text-amber-800 ring-1 ring-amber-300/50 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-500/20">
                    {item.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                      {item.hint}
                    </span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ol>
        </article>

        <article className="rounded-3xl border border-border/70 bg-card/75 p-4 shadow-[0_18px_50px_-42px_hsl(var(--foreground)/0.4)] sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FileText className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Apoio
              </p>
              <h3 className="text-[17px] font-semibold text-foreground">
                Modelos e materiais
              </h3>
            </div>
          </div>
          <ul className="mt-4 space-y-1.5">
            {portalResources.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted/55"
                >
                  <FileText
                    className="h-4 w-4 shrink-0 text-primary/80"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-[0_18px_50px_-40px_hsl(var(--foreground)/0.45)] sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Contexto clínico
            </p>
            <h2 className="mt-0.5 text-[19px] font-semibold tracking-[-0.02em] text-foreground">
              {firstName
                ? `Vamos ao atendimento, ${firstName}`
                : "Vamos ao atendimento"}
            </h2>
          </div>
          {activeClinic && (
            <p className="text-[11.5px] text-muted-foreground">
              Clínica ativa:{" "}
              <span className="font-medium text-foreground">
                {activeClinic.name}
              </span>
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {isLoading ? (
              <div
                className="space-y-2.5"
                role="status"
                aria-live="polite"
                aria-busy="true"
                data-testid="cockpit-loading"
              >
                <span className="sr-only">Carregando o contexto clínico…</span>
                <div className="h-20 animate-pulse rounded-2xl bg-muted/60 motion-reduce:animate-none" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="h-14 animate-pulse rounded-2xl bg-muted/50 motion-reduce:animate-none" />
                  <div className="h-14 animate-pulse rounded-2xl bg-muted/50 motion-reduce:animate-none" />
                </div>
              </div>
            ) : isError ? (
              <ErrorState
                compact
                message="Não foi possível carregar seus pacientes agora."
                onRetry={() => void refetch()}
              />
            ) : current ? (
              <>
                <div
                  className="rounded-2xl border border-primary/25 bg-primary/[0.07] p-3.5"
                  data-testid="cockpit-current-patient"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Paciente em foco
                  </p>
                  <p className="mt-1 truncate text-[17px] font-semibold tracking-[-0.01em] text-foreground">
                    {current.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {[
                      ageLabel(current.birthDate),
                      "registro mais recente da clínica",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <ActionLink
                    primary
                    testId="cockpit-action-prontuario"
                    href={`/prontuario?patientId=${encodeURIComponent(current.id)}`}
                    icon={Stethoscope}
                    label="Abrir prontuário"
                    hint="Anamnese, marcos e conduta"
                  />
                  <ActionLink
                    testId="cockpit-action-ficha"
                    href={`/paciente/${encodeURIComponent(current.id)}`}
                    icon={ClipboardCheck}
                    label="Ver histórico"
                    hint="Avaliações e linha clínica"
                  />
                  <ActionLink
                    testId="cockpit-action-escala"
                    href="/filtro"
                    icon={Filter}
                    label="Escolher instrumento"
                    hint="Por idade, queixa e objetivo"
                  />
                  <ActionLink
                    testId="cockpit-action-documento"
                    href={`/laudo-neuroped?patientId=${encodeURIComponent(current.id)}`}
                    icon={FileText}
                    label="Gerar documento"
                    hint="Laudo e receita a partir da ficha"
                  />
                </div>
              </>
            ) : (
              <div
                className="rounded-2xl border border-dashed border-border/70 p-4"
                data-testid="cockpit-empty"
              >
                <p className="text-[14px] font-semibold text-foreground">
                  Nenhum paciente nesta clínica ainda
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  Cadastre o primeiro paciente para abrir prontuário, aplicar
                  escalas e emitir documentos vinculados.
                </p>
                <Link
                  href="/pacientes"
                  data-testid="cockpit-action-primeiro-paciente"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-[13px] font-semibold text-foreground hover:bg-primary/15"
                >
                  <UserPlus
                    className="h-4 w-4 text-primary"
                    aria-hidden="true"
                  />
                  Cadastrar paciente
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-background/40 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Trocar de paciente
                </p>
                <Link
                  href="/pacientes"
                  data-testid="cockpit-todos-pacientes"
                  className="-mr-2 inline-flex min-h-11 items-center gap-1 px-2 text-[11.5px] font-semibold text-primary hover:underline"
                >
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  Todos
                </Link>
              </div>
              {others.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {others.map((patient) => (
                    <li key={patient.id}>
                      <Link
                        href={`/paciente/${encodeURIComponent(patient.id)}`}
                        data-testid={`cockpit-switch-${patient.id}`}
                        className="flex min-h-11 items-center gap-2 rounded-xl px-2.5 text-[13px] text-foreground transition-colors hover:bg-muted/60"
                      >
                        <span className="truncate">{patient.name}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                          {ageLabel(patient.birthDate) ?? "—"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                  Quando houver mais pacientes ativos, eles aparecem aqui para
                  troca em um toque.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/40 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Continuar de onde parou
              </p>
              {recents.length > 0 ? (
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Você aplicou {recents.length} instrumento
                  {recents.length === 1 ? "" : "s"} recentemente. Os atalhos
                  ficam logo abaixo, em “Usados recentemente”.
                </p>
              ) : (
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  Os instrumentos aplicados nesta sessão aparecem aqui para
                  retomada imediata.
                </p>
              )}
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                <ActionLink
                  testId="cockpit-action-agenda"
                  href="/agenda"
                  icon={CalendarDays}
                  label="Agenda"
                  hint="Consultas e check-in"
                />
                <ActionLink
                  testId="cockpit-action-triagem"
                  href="/filtro-escalas?mode=flash"
                  icon={Clock3}
                  label="Triagem rápida"
                  hint="Sessão efêmera, sem registro"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

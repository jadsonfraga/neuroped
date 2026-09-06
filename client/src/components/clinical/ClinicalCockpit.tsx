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

/**
 * Cockpit clínico da área autenticada.
 *
 * Responde, na ordem em que o consultório precisa: **quem é o paciente
 * atual → qual é o contexto → qual é a próxima ação**. Antes a Home
 * autenticada abria com uma vitrine do produto (manchete, métricas de catálogo)
 * e o profissional precisava atravessar a sidebar para chegar ao primeiro
 * paciente.
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
        name: typeof profile.name === "string" && profile.name.trim()
          ? profile.name
          : "Paciente sem nome",
        birthDate: typeof profile.birthDate === "string" ? profile.birthDate : null,
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
          primary ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">{label}</span>
        <span className="block truncate text-[11.5px] text-muted-foreground">{hint}</span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5"
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

  const queryKey = isRemoteClinical && activeClinicId
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
      aria-label="Contexto clínico atual"
      className="rounded-3xl border border-border/70 bg-card/70 p-4 shadow-[0_18px_50px_-40px_hsl(var(--foreground)/0.45)] sm:p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Contexto clínico
          </p>
          <h2 className="mt-0.5 text-[19px] font-semibold tracking-[-0.02em] text-foreground">
            {firstName ? `Vamos ao atendimento, ${firstName}` : "Vamos ao atendimento"}
          </h2>
        </div>
        {activeClinic && (
          <p className="text-[11.5px] text-muted-foreground">
            Clínica ativa: <span className="font-medium text-foreground">{activeClinic.name}</span>
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Paciente atual + próxima ação */}
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
                  {[ageLabel(current.birthDate), "registro mais recente da clínica"]
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
                Cadastre o primeiro paciente para abrir prontuário, aplicar escalas e emitir
                documentos vinculados.
              </p>
              <Link
                href="/pacientes"
                data-testid="cockpit-action-primeiro-paciente"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3.5 text-[13px] font-semibold text-foreground hover:bg-primary/15"
              >
                <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
                Cadastrar paciente
              </Link>
            </div>
          )}
        </div>

        {/* Troca de contexto + continuidade */}
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
                Quando houver mais pacientes ativos, eles aparecem aqui para troca em um toque.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 p-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Continuar de onde parou
            </p>
            {recents.length > 0 ? (
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Você aplicou {recents.length} instrumento{recents.length === 1 ? "" : "s"} recentemente.
                Os atalhos ficam logo abaixo, em “Usados recentemente”.
              </p>
            ) : (
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Os instrumentos aplicados nesta sessão aparecem aqui para retomada imediata.
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
    </section>
  );
}

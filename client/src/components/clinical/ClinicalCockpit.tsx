import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { differenceInYears, differenceInMonths, parseISO } from "date-fns";
import {
  ArrowRight,
  ClipboardList,
  FileSignature,
  FileText,
  Filter,
  Loader2,
  Stethoscope,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import {
  clearFocusPatient,
  getFocusPatientId,
  setFocusPatientId,
  subscribeFocusPatient,
} from "@/lib/patientFocus";

/**
 * Cockpit clínico da home autenticada.
 *
 * A home comunicava um catálogo: título grande, métricas de inventário e
 * cartões de fluxo. Faltava a única pergunta que abre um atendimento — "quem
 * está na minha frente e qual é o próximo passo?". Este painel responde a ela
 * em uma faixa: paciente em foco → contexto → próxima ação, com a troca de
 * paciente a um clique.
 *
 * Ele só existe em sessão clínica remota (há backend e há tenant). Sem sessão,
 * a home segue sendo a capa institucional, e nada aqui é montado.
 */

interface LivePatient {
  id: string;
  status?: string;
  updatedAt?: string | null;
  createdAt?: string | null;
  profile?: {
    name?: string | null;
    birthDate?: string | null;
    diagnosisCode?: string | null;
  } | null;
}

interface LivePatientsResponse {
  data?: LivePatient[];
}

function ageLabel(birthDate: string | null | undefined): string | null {
  if (!birthDate) return null;
  try {
    const parsed = parseISO(birthDate);
    const years = differenceInYears(new Date(), parsed);
    if (years >= 2) return `${years} anos`;
    const months = differenceInMonths(new Date(), parsed);
    if (months < 0) return null;
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  } catch {
    return null;
  }
}

interface CockpitAction {
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  href: (patientId: string) => string;
}

/** Ações de maior frequência a partir de um paciente já escolhido. */
const PATIENT_ACTIONS: CockpitAction[] = [
  {
    label: "Prontuário",
    hint: "Registrar consulta",
    icon: ClipboardList,
    href: (id) => `/prontuario?patientId=${encodeURIComponent(id)}`,
  },
  {
    label: "Aplicar escala",
    hint: "Escolher instrumento",
    icon: Filter,
    href: () => "/filtro",
  },
  {
    label: "Laudo",
    hint: "Documento estruturado",
    icon: FileText,
    href: (id) => `/laudo-neuroped?patientId=${encodeURIComponent(id)}`,
  },
  {
    label: "Receita C1",
    hint: "Notificação especial",
    icon: FileSignature,
    href: (id) => `/receita-c1?patientId=${encodeURIComponent(id)}`,
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </p>
  );
}

export function ClinicalCockpit() {
  const { accessMode, isAuthenticated, user } = useAuth();
  const { activeClinicId, activeClinic } = useClinic();
  const isClinicalSession = accessMode === "remote" && isAuthenticated;
  const [focusId, setFocusId] = useState<string | null>(getFocusPatientId);

  useEffect(() => subscribeFocusPatient(() => setFocusId(getFocusPatientId())), []);

  const { data, isLoading, isError } = useQuery<LivePatientsResponse>({
    queryKey: [`/api/live/patients?clinicId=${encodeURIComponent(activeClinicId ?? "")}`],
    enabled: isClinicalSession && Boolean(activeClinicId),
  });

  const patients = useMemo(
    () => (data?.data ?? []).filter((patient) => patient.status !== "archived"),
    [data],
  );
  const focusPatient = patients.find((patient) => patient.id === focusId) ?? null;
  // O paciente em foco nunca ocupa também a fila de retomada.
  const recentPatients = patients.filter((patient) => patient.id !== focusPatient?.id).slice(0, 3);

  if (!isClinicalSession) return null;

  const firstName = (user?.name ?? "").trim().split(/\s+/)[0] || "profissional";

  return (
    <section
      aria-label="Cockpit clínico"
      data-testid="clinical-cockpit"
      className="grid gap-3 rounded-3xl border border-border/70 bg-card/85 p-4 shadow-[0_18px_50px_-40px_rgba(38,24,53,0.45)] backdrop-blur-xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_minmax(0,0.9fr)] lg:p-5"
    >
      {/* ── 1. Quem está na frente ── */}
      <div className="min-w-0 space-y-2.5">
        <SectionLabel>Paciente em foco</SectionLabel>
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Carregando pacientes…
          </p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            Lista de pacientes indisponível agora.{" "}
            <Link href="/pacientes" className="font-semibold text-primary underline-offset-2 hover:underline">
              Abrir pacientes
            </Link>
          </p>
        ) : focusPatient ? (
          <div className="space-y-1.5">
            <div className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
              >
                <UserRound className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p
                  className="truncate text-[17px] font-semibold leading-tight tracking-[-0.01em] text-foreground"
                  data-testid="cockpit-focus-name"
                >
                  {focusPatient.profile?.name ?? "Paciente sem nome"}
                </p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                  {[
                    ageLabel(focusPatient.profile?.birthDate),
                    focusPatient.profile?.diagnosisCode,
                    activeClinic?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sem dados complementares registrados"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                href={`/paciente/${focusPatient.id}`}
                className="inline-flex min-h-8 items-center gap-1 text-[12.5px] font-semibold text-primary underline-offset-2 hover:underline"
              >
                Abrir ficha completa
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => clearFocusPatient()}
                className="inline-flex min-h-8 items-center gap-1 text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                data-testid="cockpit-clear-focus"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Tirar do foco
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[15px] font-semibold leading-tight text-foreground">
              Bom trabalho, {firstName}. Nenhum paciente em foco.
            </p>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Escolha um paciente para que prontuário, laudo e receita já abram
              no contexto certo.
            </p>
            <Link
              href="/pacientes"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary/10"
              data-testid="cockpit-choose-patient"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              Escolher paciente
            </Link>
          </div>
        )}
      </div>

      {/* ── 2. Próxima ação ── */}
      <div className="min-w-0 space-y-2.5 lg:border-l lg:border-border/60 lg:pl-5">
        <SectionLabel>Próxima ação</SectionLabel>
        <div className="grid grid-cols-2 gap-2" data-testid="cockpit-actions">
          {PATIENT_ACTIONS.map((action) => {
            const Icon = action.icon;
            const enabled = Boolean(focusPatient) || action.href("") === "/filtro";
            const href = focusPatient ? action.href(focusPatient.id) : "/pacientes";
            return (
              <Link
                key={action.label}
                href={enabled ? href : "/pacientes"}
                className="group flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-primary/[0.06]"
                data-testid={`cockpit-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
                    {action.label}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                    {focusPatient || action.href("") === "/filtro"
                      ? action.hint
                      : "Escolher paciente antes"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── 3. Retomar ── */}
      <div className="min-w-0 space-y-2.5 lg:border-l lg:border-border/60 lg:pl-5">
        <SectionLabel>Trocar de paciente</SectionLabel>
        {recentPatients.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {isLoading
              ? "Carregando…"
              : "Nenhum outro paciente cadastrado nesta clínica ainda."}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {recentPatients.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => setFocusPatientId(patient.id)}
                  className="flex min-h-9 w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-muted/70"
                  data-testid={`cockpit-switch-${patient.id}`}
                >
                  <Stethoscope className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium text-foreground">
                      {patient.profile?.name ?? "Paciente sem nome"}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {ageLabel(patient.profile?.birthDate) ?? "Idade não informada"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/pacientes"
          className="inline-flex min-h-8 items-center gap-1 text-[12px] font-semibold text-primary underline-offset-2 hover:underline"
        >
          Ver todos os pacientes
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

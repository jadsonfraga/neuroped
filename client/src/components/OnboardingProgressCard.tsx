import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import {
  onboardingMilestoneDefinitions,
  type OnboardingMilestone,
  type OnboardingMilestoneKey,
  type OnboardingMilestoneSource,
  type TenantOnboardingSnapshot,
} from "../../../shared/onboarding";
import { roleHasPermission } from "../../../shared/permissions";

const milestoneKeys = onboardingMilestoneDefinitions.map(
  (definition) => definition.key,
) as [OnboardingMilestoneKey, ...OnboardingMilestoneKey[]];
const milestoneSources = onboardingMilestoneDefinitions.map(
  (definition) => definition.source,
) as [OnboardingMilestoneSource, ...OnboardingMilestoneSource[]];
const milestoneDefinitionsByKey = new Map(
  onboardingMilestoneDefinitions.map((definition) => [
    definition.key,
    definition,
  ]),
);

// `shared/onboarding.ts` é a autoridade de tipos e catálogo. Como o contrato
// compartilhado não expõe um parser runtime, a fronteira HTTP é validada aqui
// de modo estrito antes de qualquer progresso ser apresentado.
const milestoneKeySchema = z.enum(milestoneKeys);

export const onboardingProgressSchema = z
  .object({
    clinicId: z.string().min(1),
    generatedAt: z.string().datetime({ offset: true }),
    progress: z
      .object({
        completed: z
          .number()
          .int()
          .min(0)
          .max(onboardingMilestoneDefinitions.length),
        total: z.literal(onboardingMilestoneDefinitions.length),
        percent: z.number().min(0).max(100),
      })
      .strict(),
    billingEvidence: z
      .object({
        status: z.enum([
          "SERVER_CONFIRMED",
          "AWAITING_PROVIDER_EVENT",
          "BLOCKED_EXTERNAL",
        ]),
        provider: z.literal("asaas"),
        environment: z.enum(["sandbox", "production"]).nullable(),
        confirmedAt: z.string().datetime({ offset: true }).nullable(),
        source: z.literal("billing_invoice_events.charge_paid").nullable(),
        limitation: z.string().min(1),
      })
      .strict(),
    milestones: z
      .array(
        z
          .object({
            key: milestoneKeySchema,
            label: z.string().min(1),
            status: z.enum(["completed", "pending", "blocked_external"]),
            completedAt: z.string().datetime({ offset: true }).nullable(),
            source: z.enum(milestoneSources),
          })
          .strict(),
      )
      .length(onboardingMilestoneDefinitions.length),
  })
  .strict()
  .superRefine((value, context) => {
    const keys = new Set(value.milestones.map((milestone) => milestone.key));
    if (keys.size !== value.milestones.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["milestones"],
        message: "Marcos duplicados no progresso de onboarding.",
      });
    }
    const completed = value.milestones.filter(
      (milestone) => milestone.status === "completed",
    ).length;
    if (completed !== value.progress.completed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progress", "completed"],
        message: "Contagem de marcos concluídos inconsistente.",
      });
    }
    const expectedPercent = Math.round(
      (value.progress.completed / value.progress.total) * 100,
    );
    if (value.progress.percent !== expectedPercent) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["progress", "percent"],
        message: "Percentual de onboarding inconsistente.",
      });
    }
    for (const [index, milestone] of value.milestones.entries()) {
      const definition = milestoneDefinitionsByKey.get(milestone.key);
      if (
        !definition ||
        definition.label !== milestone.label ||
        definition.source !== milestone.source
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index],
          message: "Marco divergente do catálogo canônico.",
        });
      }
      const hasCompletionDate = milestone.completedAt !== null;
      if ((milestone.status === "completed") !== hasCompletionDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index, "completedAt"],
          message: "Timestamp de conclusão inconsistente com o estado.",
        });
      }
    }
    const billing = value.milestones.find(
      (milestone) => milestone.key === "billing_configured",
    );
    const expectedBillingStatus =
      value.billingEvidence.status === "SERVER_CONFIRMED"
        ? "completed"
        : value.billingEvidence.status === "BLOCKED_EXTERNAL"
          ? "blocked_external"
          : "pending";
    if (billing?.status !== expectedBillingStatus) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["milestones"],
        message: "Evidência de billing inconsistente com o marco exibido.",
      });
    }
    const billingConfirmed =
      value.billingEvidence.confirmedAt !== null &&
      value.billingEvidence.source === "billing_invoice_events.charge_paid";
    if (
      (value.billingEvidence.status === "SERVER_CONFIRMED") !==
      billingConfirmed
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billingEvidence"],
        message: "Confirmação de billing sem evidência persistida coerente.",
      });
    }
    if (
      billing &&
      billing.completedAt !== value.billingEvidence.confirmedAt
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["billingEvidence", "confirmedAt"],
        message: "Timestamp de billing divergente do marco canônico.",
      });
    }
  }) satisfies z.ZodType<TenantOnboardingSnapshot>;

const milestoneActions: Record<
  OnboardingMilestone["key"],
  { href: string; label: string } | null
> = {
  account_created: null,
  email_verified: { href: "/verificar-email", label: "Verificar e-mail" },
  clinic_created: { href: "/onboarding", label: "Criar clínica" },
  plan_selected: {
    href: "/configuracoes?secao=plano",
    label: "Escolher plano",
  },
  billing_configured: {
    href: "/configuracoes?secao=plano",
    label: "Configurar cobrança",
  },
  first_member: {
    href: "/configuracoes?secao=equipe",
    label: "Convidar equipe",
  },
  first_patient: { href: "/pacientes", label: "Cadastrar paciente" },
  first_consultation: { href: "/pacientes", label: "Iniciar atendimento" },
  first_document: { href: "/documentos", label: "Criar documento" },
  first_assessment: { href: "/filtro", label: "Aplicar avaliação" },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function completedDate(value: string | null): string | null {
  return value ? dateFormatter.format(new Date(value)) : null;
}

function MilestoneStatus({ milestone }: { milestone: OnboardingMilestone }) {
  if (milestone.status === "completed") {
    return (
      <CheckCircle2
        className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden="true"
      />
    );
  }
  if (milestone.status === "blocked_external") {
    return (
      <AlertTriangle
        className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
    );
  }
  return (
    <Circle
      className="h-5 w-5 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
  );
}

function milestoneStatusLabel(milestone: OnboardingMilestone): string {
  if (milestone.status === "blocked_external") {
    return "Validação externa pendente";
  }
  if (milestone.status === "completed") {
    const date = completedDate(milestone.completedAt);
    return date ? `Concluído em ${date}` : "Concluído";
  }
  return "Pendente";
}

export function OnboardingProgressSummary({
  onboarding,
}: {
  onboarding: TenantOnboardingSnapshot;
}) {
  const isComplete = onboarding.progress.completed === onboarding.progress.total;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-primary/20 bg-card/85 shadow-[0_18px_55px_-42px_hsl(var(--foreground)/0.45)]"
      aria-labelledby="onboarding-progress-title"
      data-testid="onboarding-progress-card"
    >
      <div className="border-b border-border/60 bg-primary/[0.045] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {isComplete ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Rocket className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-primary">
                Primeiros passos
              </p>
              <h2
                id="onboarding-progress-title"
                className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em] text-foreground"
              >
                {isComplete
                  ? "Configuração inicial concluída"
                  : "Prepare sua clínica para operar"}
              </h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Progresso calculado pelo servidor a partir de registros reais da
                clínica ativa.
              </p>
            </div>
          </div>
          <p
            className="rounded-full border border-primary/20 bg-background/75 px-3 py-1 text-[12px] font-semibold tabular-nums text-foreground"
            data-testid="onboarding-progress-summary"
          >
            {onboarding.progress.completed} de {onboarding.progress.total}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Progress
            value={onboarding.progress.percent}
            aria-label={`Progresso do onboarding: ${onboarding.progress.percent}%`}
            className="h-2.5"
            data-testid="onboarding-progress-bar"
          />
          <span className="w-11 shrink-0 text-right text-[12px] font-semibold tabular-nums text-muted-foreground">
            {onboarding.progress.percent}%
          </span>
        </div>
      </div>

      <ol className="grid gap-px bg-border/50 sm:grid-cols-2">
        {onboarding.milestones.map((milestone) => {
          const action = milestoneActions[milestone.key];
          return (
            <li
              key={milestone.key}
              className="flex min-w-0 items-start gap-3 bg-card px-4 py-3.5 sm:px-5"
              data-testid={`onboarding-milestone-${milestone.key}`}
              data-status={milestone.status}
            >
              <MilestoneStatus milestone={milestone} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-snug text-foreground">
                  {milestone.label}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                  {milestoneStatusLabel(milestone)}
                </p>
              </div>
              {milestone.status !== "completed" && action && (
                <a
                  href={`#${action.href}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[11.5px] font-semibold text-primary hover:bg-primary/10 hover:underline"
                  data-testid={`onboarding-action-${milestone.key}`}
                >
                  {action.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
      <div
        className="border-t border-border/60 bg-muted/20 px-4 py-3 text-[11.5px] leading-relaxed text-muted-foreground sm:px-5"
        data-testid="onboarding-billing-evidence"
      >
        <span className="font-semibold text-foreground">Cobrança: </span>
        {onboarding.billingEvidence.status === "SERVER_CONFIRMED"
          ? "confirmada por evento persistido no servidor. "
          : onboarding.billingEvidence.status === "AWAITING_PROVIDER_EVENT"
            ? "aguardando evento confirmado do provedor. "
            : "bloqueada por dependência externa. "}
        {onboarding.billingEvidence.limitation}
      </div>
    </section>
  );
}

function OnboardingLoading() {
  return (
    <section
      className="rounded-3xl border border-border/70 bg-card/70 p-5"
      aria-label="Carregando progresso do onboarding"
      aria-busy="true"
      role="status"
      data-testid="onboarding-progress-loading"
    >
      <span className="sr-only">Carregando progresso do onboarding…</span>
      <div className="h-5 w-52 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      <div className="mt-3 h-2.5 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="h-14 animate-pulse rounded-2xl bg-muted/70 motion-reduce:animate-none" />
        <div className="h-14 animate-pulse rounded-2xl bg-muted/70 motion-reduce:animate-none" />
      </div>
    </section>
  );
}

export function OnboardingProgressCard() {
  const { accessMode, isAuthenticated, isLoading, user } = useAuth();
  const { activeClinic, activeClinicId } = useClinic();
  const canLoad =
    !isLoading &&
    accessMode === "remote" &&
    isAuthenticated &&
    !user?.mustChangePassword &&
    activeClinic?.status === "active" &&
    roleHasPermission(activeClinic.role, "organization.manage") &&
    Boolean(activeClinicId);

  const query = useQuery({
    queryKey: ["tenant-onboarding-progress", user?.id, activeClinicId],
    enabled: canLoad,
    retry: false,
    staleTime: 15_000,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    queryFn: async ({ signal }) => {
      if (!activeClinicId) throw new Error("ONBOARDING_UNAVAILABLE");
      const response = await authFetch(
        `/api/tenants/${encodeURIComponent(activeClinicId)}/onboarding`,
        {
          signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );
      if (!response.ok) throw new Error("ONBOARDING_UNAVAILABLE");
      return onboardingProgressSchema.parse(await response.json());
    },
  });

  if (!canLoad) return null;
  if (query.isPending) return <OnboardingLoading />;
  if (query.isError || !query.data) {
    return (
      <section
        className="rounded-3xl border border-destructive/20 bg-card p-4 sm:p-5"
        aria-labelledby="onboarding-progress-error-title"
        data-testid="onboarding-progress-error"
      >
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2
              id="onboarding-progress-error-title"
              className="text-[14px] font-semibold text-foreground"
            >
              Progresso indisponível
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground" role="alert">
              Não foi possível confirmar as etapas agora. Nenhuma conclusão foi
              presumida.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Tentar novamente
          </Button>
        </div>
      </section>
    );
  }

  return <OnboardingProgressSummary onboarding={query.data} />;
}

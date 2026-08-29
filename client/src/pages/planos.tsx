import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { apiRequest } from "@/lib/queryClient";
import { authFetch } from "@/lib/authClient";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Info,
  KeyRound,
  Loader2,
  Rocket,
  ShieldCheck,
  Users,
} from "lucide-react";
import { CANONICAL_PRICE_CENTS, CANONICAL_TRIAL_DAYS } from "@shared/billing";

/**
 * Planos & Assinatura — vitrine comercial do plano canônico + gestão da
 * assinatura da clínica ativa.
 *
 * Contratos honrados (fonte única de preço: shared/billing.ts):
 *   GET  /api/billing/me?scope=finance  → snapshot de entitlement
 *   POST /api/billing/checkout {clinicId, seats} → { url } (Asaas)
 *
 * A página degrada graciosamente: sem sessão vira vitrine com CTA de login;
 * backend sem billing (503 BILLING_UNAVAILABLE) vira orientação de contato.
 */

const PLAN_FEATURES = [
  "Catálogo completo de escalas e testes interativos",
  "Filtro inteligente por idade, queixa e contexto",
  "Pacientes, prontuário, laudos e documentos em PDF",
  "Agenda, recepção e marcação com Secretaria IA",
  "Portal da Família, pré-consulta e diários de acompanhamento",
  "Equipe com papéis, convites por e-mail e troca de clínica",
  "Criptografia no servidor, auditoria e conformidade LGPD",
];

interface BillingEntitlement {
  planId: string | null;
  subscriptionStatus: string | null;
  trialActive: boolean;
  trialEndsAt: string | null;
  isActive: boolean;
  isPastDue: boolean;
  isSuspended: boolean;
  deniedReason: string | null;
}

interface BillingMeResponse {
  membership: { clinicId: string; role: string } | null;
  entitlement: BillingEntitlement;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function statusBadge(entitlement: BillingEntitlement) {
  if (entitlement.trialActive) {
    return (
      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
        Período de avaliação até {fmtDate(entitlement.trialEndsAt)}
      </Badge>
    );
  }
  if (entitlement.isPastDue) {
    return (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        Pagamento pendente (carência ativa)
      </Badge>
    );
  }
  if (entitlement.isSuspended) {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
        Assinatura suspensa
      </Badge>
    );
  }
  if (entitlement.isActive) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
        Assinatura ativa
      </Badge>
    );
  }
  return <Badge variant="secondary">Sem assinatura ativa</Badge>;
}

function SubscriptionPanel() {
  const { activeClinic } = useClinic();
  const [seats, setSeats] = useState<number>(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const billingQuery = useQuery<BillingMeResponse>({
    queryKey: ["billing-me-finance"],
    queryFn: async () => {
      const res = await authFetch("/api/billing/me?scope=finance");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error(body?.error ?? `Erro ${res.status}`), {
          status: res.status,
          code: body?.code,
        });
      }
      return res.json();
    },
    retry: false,
  });

  const startCheckout = async () => {
    if (!activeClinic) return;
    setCheckoutError(null);
    setIsRedirecting(true);
    try {
      const res = await apiRequest("POST", "/api/billing/checkout", {
        clinicId: activeClinic.id,
        seats,
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setCheckoutError("Checkout criado, mas sem link de pagamento. Tente novamente.");
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 403) {
        setCheckoutError("Apenas gestores da clínica podem iniciar a assinatura.");
      } else if (status === 409) {
        setCheckoutError(
          "Não foi possível iniciar: verifique assentos versus membros ativos ou reative a assinatura cancelada.",
        );
      } else if (status === 503) {
        setCheckoutError(
          "O pagamento está temporariamente indisponível. Tente novamente em instantes ou fale com a equipe.",
        );
      } else {
        setCheckoutError("Não foi possível iniciar o checkout. Tente novamente.");
      }
    } finally {
      setIsRedirecting(false);
    }
  };

  if (billingQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando a situação da assinatura…
        </CardContent>
      </Card>
    );
  }

  if (billingQuery.isError) {
    const status = (billingQuery.error as { status?: number }).status;
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-primary" /> Assinatura gerenciada com a equipe
          </h3>
          <p className="text-sm text-muted-foreground">
            {status === 503
              ? "O módulo de assinatura não está habilitado neste ambiente."
              : "Não foi possível carregar a situação da assinatura agora."}{" "}
            Fale com a equipe pela página de marcação para ativar o plano da sua clínica.
          </p>
          <Link href="/marcacao">
            <Button size="sm" variant="outline" className="mt-3 gap-1.5">
              <Calendar className="w-4 h-4" /> Falar com a equipe
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const snapshot = billingQuery.data;
  if (!snapshot?.membership || !activeClinic) {
    return (
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-primary" /> Você ainda não participa de uma clínica
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie a sua clínica (ou aceite um convite recebido por e-mail) para iniciar o
            período de avaliação e gerenciar a assinatura por aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { entitlement } = snapshot;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" /> {activeClinic.name}
          </span>
          {statusBadge(entitlement)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        {entitlement.isPastDue && (
          <p className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Identificamos um pagamento pendente. Regularize para manter o acesso da equipe
            após o período de carência.
          </p>
        )}
        {entitlement.isSuspended && (
          <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            A assinatura está suspensa. Conclua um novo checkout para reativar o acesso.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-xs font-semibold text-muted-foreground mb-1">
              Assentos (membros da equipe)
            </span>
            <Input
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={(event) => {
                const next = Number(event.target.value);
                setSeats(Number.isInteger(next) ? Math.min(500, Math.max(1, next)) : 1);
              }}
              className="w-28"
            />
          </label>
          <div className="text-sm text-muted-foreground pb-2">
            Total mensal:{" "}
            <strong className="text-foreground">
              {formatBRL(CANONICAL_PRICE_CENTS * seats)}
            </strong>
          </div>
        </div>
        <Button onClick={startCheckout} disabled={isRedirecting} className="gap-1.5">
          {isRedirecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {entitlement.isActive && !entitlement.trialActive
            ? "Atualizar assinatura"
            : "Assinar agora"}
        </Button>
        {checkoutError && (
          <p className="text-sm text-red-600 dark:text-red-400">{checkoutError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          O pagamento é processado com segurança pelo provedor Asaas. O número de assentos
          não pode ser menor que o número de membros ativos da clínica.
        </p>
      </CardContent>
    </Card>
  );
}

export default function PlanosPage() {
  const { isAuthenticated, accessMode } = useAuth();

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Planos &amp; Assinatura
          </span>
        </div>
        <h1 className="text-2xl font-bold">Um plano simples, por assento</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Toda a plataforma, para toda a equipe. Comece com{" "}
          {CANONICAL_TRIAL_DAYS} dias de avaliação e pague apenas pelos assentos
          que a sua clínica usa.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Rocket className="w-4 h-4 text-primary" /> Plano Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <p className="text-3xl font-bold">
              {formatBRL(CANONICAL_PRICE_CENTS)}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                /assento/mês
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {CANONICAL_TRIAL_DAYS} dias de avaliação gratuita · cancele quando quiser
            </p>
            <ul className="space-y-2 mt-4">
              {PLAN_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isAuthenticated ? (
            <SubscriptionPanel />
          ) : (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                  <KeyRound className="w-4 h-4 text-primary" /> Entre para gerenciar a assinatura
                </h3>
                <p className="text-sm text-muted-foreground">
                  {accessMode === "remote"
                    ? "Faça login com a sua conta profissional para iniciar o período de avaliação ou gerenciar o plano da sua clínica."
                    : "A gestão da assinatura acontece na versão conectada do NeuroPed. Faça login para continuar."}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href="/login">
                    <Button size="sm" className="gap-1.5">
                      <KeyRound className="w-4 h-4" /> Entrar
                    </Button>
                  </Link>
                  <Link href="/para-clinicas">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Building2 className="w-4 h-4" /> Conhecer o NeuroPed para clínicas
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" /> Como funcionam os assentos
              </h3>
              <p className="text-sm text-muted-foreground">
                Cada membro ativo da clínica ocupa um assento — gestores, profissionais,
                assistentes e financeiro. Convide a equipe por e-mail e ajuste os assentos
                conforme a clínica cresce.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Transparência
              </h3>
              <p className="text-sm text-muted-foreground">
                Sem taxa de implantação e sem fidelidade. Os dados da clínica pertencem à
                clínica: exportação disponível e exclusão sob solicitação, em conformidade
                com a LGPD.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

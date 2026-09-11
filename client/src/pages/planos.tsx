import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LifeBuoy,
  LockKeyhole,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  INSTITUTIONAL_ANNUAL_OFFER,
  INSTITUTIONAL_PILOT_OFFER,
  type CommercialFeatureCode,
} from "@shared/commercial";

/**
 * Vitrine pública do SKU comercial institucional.
 *
 * Esta página NÃO usa `shared/billing.ts`: o billing genérico por assento é
 * infraestrutura legada do SaaS amplo e não define o produto que está sendo
 * oferecido na coorte comercial de 2026.
 *
 * O domínio comercial (`shared/commercial.ts`) é a única fonte de preço,
 * escopo, limites e saleMode. A vitrine nunca transforma um offer invite_only
 * ou gated em checkout público.
 */

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const FEATURE_LABELS: Record<CommercialFeatureCode, string> = {
  "form.preconsultation": "Preparação estruturada da consulta",
  "form.change_log": "Registro organizado de mudanças",
  "form.school_feedback": "Devolutiva escolar estruturada",
  "form.approved_plan": "Plano aprovado em uma página",
  "form.routine_log": "Registro descritivo da rotina",
};

const PILOT_PRICE = priceFormatter.format(INSTITUTIONAL_PILOT_OFFER.priceCents / 100);
const ANNUAL_PRICE = priceFormatter.format(INSTITUTIONAL_ANNUAL_OFFER.priceCents / 100);

const BOUNDARIES = [
  "Não recebe dado identificável de paciente no produto comercial.",
  "Não inclui consulta, parecer de caso, diagnóstico, prescrição ou apoio à decisão clínica.",
  "Não inclui pontuação psicométrica, PANT ou NeuroBoard.",
  "Não autoriza redistribuição, sublicenciamento, certificação institucional ou white-label.",
];

export default function PlanosPage() {
  return (
    <div className="space-y-6 pb-12">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          NeuroPed Institucional
        </span>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Uma licença pequena para organizar o fluxo antes de ampliar o sistema
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          O produto comercial inicial do NeuroPed é deliberadamente restrito:
          cinco materiais educativo-operacionais para uma unidade institucional,
          com usuários autorizados e suporte limitado. O prontuário clínico, PANT,
          NeuroBoard e funções de decisão clínica não fazem parte desta oferta.
        </p>
      </header>

      <Card className="border-primary/30" data-testid="institutional-pilot-card">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-bold text-foreground">
                  {INSTITUTIONAL_PILOT_OFFER.name}
                </h2>
              </div>
              <p className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground" data-testid="pilot-price">
                  {PILOT_PRICE}
                </span>
                <span className="text-sm text-muted-foreground">
                  por unidade / {INSTITUTIONAL_PILOT_OFFER.termDays} dias
                </span>
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Coorte fechada por convite, limitada a {INSTITUTIONAL_PILOT_OFFER.maxLicenses} instituições.
                Cada licença cobre {INSTITUTIONAL_PILOT_OFFER.maxUnits} unidade e até{" "}
                {INSTITUTIONAL_PILOT_OFFER.maxAuthorizedUsers} usuários autorizados.
              </p>
            </div>

            <div className="flex min-w-52 flex-col gap-2">
              <Button asChild size="lg">
                <a
                  href="mailto:drjadsonfraga@proton.me?subject=Interesse%20no%20NeuroPed%20Institucional%20Piloto%201.0"
                  data-testid="pilot-interest-cta"
                >
                  Solicitar convite
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sem checkout público. A licença só nasce após provisionamento e aceite institucional.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <FileCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />
                Cinco materiais incluídos
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {INSTITUTIONAL_PILOT_OFFER.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{FEATURE_LABELS[feature]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                <LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" />
                Operação incluída
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Até {INSTITUTIONAL_PILOT_OFFER.maxAuthorizedUsers} usuários nominados da mesma unidade.
                </li>
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {INSTITUTIONAL_PILOT_OFFER.onboardingMinutes} min de onboarding +{" "}
                  {INSTITUTIONAL_PILOT_OFFER.supportMinutes} min de suporte incluído.
                </li>
                <li className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Acesso concedido somente a usuário ativo e explicitamente autorizado na licença.
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="institutional-annual-card">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Próxima etapa — ainda fechada
              </span>
              <h2 className="mt-1 text-base font-bold text-foreground">
                {INSTITUTIONAL_ANNUAL_OFFER.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Preço de lista definido em <strong className="text-foreground">{ANNUAL_PRICE}</strong> por unidade/ano,
                mas a oferta permanece bloqueada até o gate pós-piloto.
              </p>
            </div>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Não disponível para contratação
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400">
            <XCircle className="h-4 w-4" aria-hidden="true" /> Limites clínicos e comerciais
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {BOUNDARIES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Como a licença é protegida
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• A licença começa pendente; não pode nascer ativa no banco.</li>
            <li>• Ativação exige conciliação comercial, aceite da versão contratual correta e ao menos um usuário autorizado.</li>
            <li>• Ser membro da clínica não basta: cada usuário precisa constar explicitamente na licença.</li>
            <li>• O limite da coorte piloto e o teto de usuários são impostos no servidor e no banco.</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Consulte também os{" "}
            <Link href="/termos" className="underline">
              Termos de uso
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

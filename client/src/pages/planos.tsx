import { Link } from "wouter";
import { ArrowRight, Check, Clock3, ShieldCheck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CANONICAL_PRICE_CENTS, CANONICAL_TRIAL_DAYS } from "@shared/billing";

const price = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
}).format(CANONICAL_PRICE_CENTS / 100);

const benefits = [
  "Clínica e equipe em um único espaço de trabalho",
  "Agenda, pré-consulta, instrumentos e documentos em fluxos organizados",
  "Convites com limite de assentos e permissões por papel",
  "Trial de 14 dias para validar o fluxo antes da contratação",
];

const safeguards = [
  { icon: ShieldCheck, title: "Segurança por padrão", description: "Entitlements são decididos no servidor e cada clínica possui fronteira de acesso própria." },
  { icon: Users, title: "Trabalho em equipe", description: "Convide profissionais, assistentes e financeiro sem compartilhar credenciais." },
  { icon: Zap, title: "Menos retrabalho", description: "Centralize triagem, acompanhamento e documentos em uma experiência coerente." },
];

export default function PlanosPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-16" data-testid="pricing-page">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-card to-chart-2/[0.08] px-6 py-10 shadow-xl shadow-primary/5 sm:px-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-primary">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {CANONICAL_TRIAL_DAYS} dias para experimentar
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight text-foreground sm:text-5xl">
              O workspace que transforma a rotina clínica em um processo claro.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              O NeuroPed reúne os fluxos de uma equipe de neuropediatria em uma experiência única para organizar atendimento, acompanhamento e colaboração — sem transformar a família em mais uma planilha.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?next=/assinatura">
                <Button size="lg" className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 sm:w-auto">
                  Começar agora <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/familia">
                <Button size="lg" variant="outline" className="w-full rounded-xl sm:w-auto">Conhecer o conteúdo aberto</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              A contratação é por assento. O acesso a dados clínicos reais depende da configuração do ambiente, dos gates de segurança e das obrigações legais aplicáveis.
            </p>
          </div>

          <div className="rounded-3xl border border-primary/20 bg-card/95 p-6 shadow-2xl shadow-primary/10 sm:p-8" data-testid="pricing-card">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Plano profissional</p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black tracking-tight text-foreground">{price}</span>
              <span className="pb-1 text-sm text-muted-foreground">por usuário / mês</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Um plano simples para começar pequeno e crescer com a equipe.</p>
            <ul className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link href="/login?next=/assinatura" className="mt-7 block">
              <Button className="w-full rounded-xl">Criar acesso profissional</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="Pilares do produto">
        {safeguards.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-bold text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground">Importante sobre o uso clínico</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-muted-foreground">
          O NeuroPed é uma plataforma de apoio ao trabalho profissional. Ele não substitui avaliação clínica, não deve ser usado para diagnóstico automático e não libera dados identificáveis apenas porque uma assinatura foi iniciada. A ativação de cada ambiente segue autenticação, isolamento de tenant, consentimento, retenção e validações operacionais.
        </p>
      </section>
    </main>
  );
}

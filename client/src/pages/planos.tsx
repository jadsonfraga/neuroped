import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, CheckCircle2, Clock3, ShieldCheck, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CANONICAL_PRICE_CENTS, CANONICAL_TRIAL_DAYS } from "@shared/billing";
import { registerOwnerAccount, SaasApiError } from "@/lib/saasClient";

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  function focusSignup() {
    document.getElementById("cadastro-profissional")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => document.getElementById("signup-name")?.focus(), 250);
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupError(null);
    setSubmitting(true);
    try {
      await registerOwnerAccount({ name: name.trim(), email: email.trim(), password });
      setCreated(true);
      setPassword("");
    } catch (cause) {
      if (cause instanceof SaasApiError && cause.code === "EMAIL_TAKEN") {
        setSignupError("Este e-mail já possui conta. Entre normalmente para continuar.");
      } else {
        setSignupError(cause instanceof Error ? cause.message : "Não foi possível criar sua conta agora.");
      }
    } finally {
      setSubmitting(false);
    }
  }

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
              <Button type="button" size="lg" onClick={focusSignup} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 sm:w-auto">
                Começar agora <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Link href="/familia">
                <Button size="lg" variant="outline" className="w-full rounded-xl sm:w-auto">Conhecer o conteúdo aberto</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              A contratação é por assento. O acesso a dados clínicos reais depende da configuração do ambiente, dos gates de segurança e das obrigações legais aplicáveis.
            </p>
          </div>

          <div id="cadastro-profissional" className="rounded-3xl border border-primary/20 bg-card/95 p-6 shadow-2xl shadow-primary/10 sm:p-8" data-testid="pricing-card">
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

            {created ? (
              <div className="mt-7 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4" data-testid="signup-created">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-foreground">Conta criada com segurança.</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Entre com o e-mail e a senha que você acabou de definir. Em seguida, crie o espaço da sua clínica para iniciar o trial.</p>
                  </div>
                </div>
                <Link href="/login?next=/assinatura" className="mt-4 block">
                  <Button className="w-full gap-2 rounded-xl">Entrar e criar minha clínica <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="mt-7 space-y-4" data-testid="professional-signup-form">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome profissional</Label>
                  <Input id="signup-name" required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input id="signup-email" type="email" required maxLength={320} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@clinica.com.br" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Crie uma senha</Label>
                  <Input id="signup-password" type="password" required minLength={10} maxLength={200} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Pelo menos 10 caracteres" />
                </div>
                {signupError && <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{signupError}</p>}
                <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl">
                  {submitting ? "Criando acesso…" : "Criar acesso profissional"}
                  {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  O cadastro cria somente sua conta profissional. Nenhuma clínica, assinatura ou cobrança é criada até você entrar e concluir o onboarding. Ao continuar, consulte os <Link href="/termos" className="underline underline-offset-2">Termos de uso</Link>.
                </p>
              </form>
            )}
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

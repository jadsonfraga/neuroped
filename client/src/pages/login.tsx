import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLIC_HOME } from "@/lib/publicRoutes";
import { MEDICAL_URL } from "@/lib/zone";
import neuralAbstract from "@assets/images/neural-abstract.webp";

function readableLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|credenciais|inválid|invalid/i.test(message)) return "E-mail ou senha não conferem. Verifique os dados e tente novamente.";
  if (/429|rate|muitas tentativas/i.test(message)) return "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
  if (/network|fetch|failed|backend|configur/i.test(message)) return "O servidor de autenticação não está disponível neste endereço. Abra a área médica protegida ou tente novamente mais tarde.";
  return "Não foi possível iniciar a sessão. Verifique a conexão e tente novamente.";
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoading, remoteConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      setLocation("/");
    } catch (loginError) {
      setError(readableLoginError(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="np-login-stage mx-auto grid min-h-[70vh] w-full max-w-6xl gap-5 px-4 py-10 sm:gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:px-6 lg:py-12"
      aria-labelledby="login-title"
    >
      <article className="np-login-story order-2 overflow-hidden rounded-[1.75rem] border border-slate-800/80 bg-slate-950 text-white shadow-[0_28px_80px_-46px_rgba(4,26,38,0.75)] lg:order-1">
        <div className="np-login-story-art" aria-hidden="true">
          <img src={neuralAbstract} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="relative z-10 flex h-full min-h-[28rem] flex-col justify-between p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl">
            <span className="np-login-kicker inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-teal-100">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(253,230,138,0.8)]" aria-hidden="true" />
              Plataforma clínica pediátrica
            </span>
            <h2 className="mt-7 max-w-[11ch] text-4xl font-semibold leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
              Clareza para cuidar. <span className="text-teal-200">Contexto para decidir.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-slate-200/80 sm:text-base">
              Um espaço protegido para organizar observações, instrumentos e continuidade clínica com a calma que cada consulta merece.
            </p>
          </div>

          <div className="mt-8 grid gap-2 sm:grid-cols-3 lg:gap-3" aria-label="Pilares do NeuroPed">
            <div className="np-login-pillar rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85">01</p>
              <p className="mt-2 text-xs font-semibold text-white">Segurança</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300/70">Acesso e contexto sob controle.</p>
            </div>
            <div className="np-login-pillar rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85">02</p>
              <p className="mt-2 text-xs font-semibold text-white">Observação</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300/70">Menos ruído para enxergar sinais.</p>
            </div>
            <div className="np-login-pillar rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/85">03</p>
              <p className="mt-2 text-xs font-semibold text-white">Continuidade</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-300/70">Uma história clínica mais legível.</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/30 bg-white/10 p-1 shadow-[0_12px_28px_-14px_rgba(253,230,138,0.55)]">
              <img src="/neuroped-mascot-premium.webp" alt="" className="h-full w-full object-contain" loading="lazy" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Um guia para cada etapa</p>
              <p className="mt-0.5 text-[11px] text-slate-300/65">Design autoral, cuidado responsável.</p>
            </div>
          </div>
        </div>
      </article>

      <div className="np-login-panel order-1 flex flex-col justify-center lg:order-2">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
          <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <h1 id="login-title" className="text-xl font-bold text-foreground">Entrar na área profissional</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Use sua conta profissional para acessar Agenda, Receitas C1, Laudos, prontuários e demais ferramentas clínicas protegidas.
        </p>

        <form onSubmit={handleSubmit} className="np-login-form mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail profissional</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" placeholder="nome@dominio.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Sua senha" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          {!isLoading && !remoteConfigured && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">A autenticação profissional não está configurada neste endereço público. Use a área médica protegida ou peça a configuração do backend antes de operar dados clínicos.</p>
          )}
          <Button type="submit" disabled={submitting || isLoading} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Entrando…" : "Entrar com segurança"}
          </Button>
        </form>

        <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
          <a href={`#${PUBLIC_HOME}`} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ir para o conteúdo das famílias
          </a>
          {MEDICAL_URL && (
            <a href={MEDICAL_URL} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir área médica protegida
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

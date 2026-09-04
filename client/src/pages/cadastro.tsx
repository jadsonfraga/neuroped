import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

function readableSignupError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const message = error instanceof Error ? error.message : String(error);
  if (code === "SIGNUP_DISABLED") {
    return "O cadastro self-service ainda não está habilitado nesta instalação. Peça um convite à sua clínica ou fale com o suporte.";
  }
  if (code === "EMAIL_IN_USE") return "Este e-mail não está disponível para cadastro. Se a conta já é sua, entre pelo login.";
  if (code === "WEAK_PASSWORD" || /senha/i.test(message)) return message;
  if (/429|rate/i.test(message)) return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  return "Não foi possível concluir o cadastro. Verifique a conexão e tente novamente.";
}

export default function CadastroPage() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      setLocation("/onboarding");
    } catch (signupError) {
      setError(readableSignupError(signupError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Criar conta profissional</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Crie sua conta, monte sua clínica e comece com 14 dias de avaliação. Seus dados clínicos ficam isolados por clínica e cifrados no servidor.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="signup-form">
        <div className="space-y-2">
          <Label htmlFor="signup-name">Nome completo</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="signup-name" name="name" autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="pl-9" placeholder="Como você assina" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">E-mail profissional</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="signup-email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" placeholder="nome@dominio.com" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Senha</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="signup-password" name="password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Mínimo 12 caracteres" />
          </div>
          <p className="text-[11px] leading-4 text-muted-foreground">Use ao menos 12 caracteres com maiúscula, minúscula, número e símbolo.</p>
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          {submitting ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
        <a href="#/login" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Já tenho conta — entrar
        </a>
      </div>
    </section>
  );
}

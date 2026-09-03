import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/passwordRecoveryClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch {
      // A API é anti-enumeração (202 genérico); um erro aqui é indisponibilidade
      // real de rede/backend — sem revelar nada sobre a existência da conta.
      setError("Não foi possível registrar a solicitação agora. Verifique a conexão e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Recuperar acesso</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Informe o e-mail da sua conta profissional. Se houver uma conta ativa, enviaremos um link de redefinição válido por 30 minutos.
      </p>

      {sent ? (
        <div className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="forgot-password-sent">
          <div className="flex items-center gap-3">
            <MailCheck className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              Se existir uma conta ativa para <span className="font-semibold">{email.trim()}</span>, as instruções de redefinição chegarão em instantes.
            </p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Não recebeu? Confira a caixa de spam ou aguarde alguns minutos antes de solicitar novamente — há um limite de solicitações por hora.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="forgot-password-form">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-mail profissional</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="forgot-email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" placeholder="nome@dominio.com" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Enviando…" : "Enviar link de redefinição"}
          </Button>
        </form>
      )}

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
        <a href="#/login" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para o login
        </a>
      </div>
    </section>
  );
}

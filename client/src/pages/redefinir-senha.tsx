import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/passwordRecoveryClient";

/** Token vem no fragmento (#/redefinir-senha?token=…): não vai ao origin/CDN. */
function parseResetToken(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  const params = new URLSearchParams(queryIndex >= 0 ? hash.slice(queryIndex + 1) : "");
  return (params.get("token") ?? "").trim();
}

// Espelho client-side da política do servidor (reset-password.ts / change-password.ts).
function passwordPolicyError(password: string): string | null {
  if (password.length < 12 || password.length > 128) {
    return "A nova senha deve ter entre 12 e 128 caracteres.";
  }
  if (!/[A-Z]/.test(password)) return "A nova senha deve conter letra maiúscula.";
  if (!/[a-z]/.test(password)) return "A nova senha deve conter letra minúscula.";
  if (!/[0-9]/.test(password)) return "A nova senha deve conter número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "A nova senha deve conter símbolo.";
  return null;
}

function readableResetError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/inválido|expirado|invalid/i.test(message)) {
    return "Este link de redefinição é inválido, expirou ou já foi usado. Solicite um novo em “Esqueci minha senha”.";
  }
  if (/senha/i.test(message)) return message;
  return "Não foi possível redefinir a senha agora. Verifique a conexão e tente novamente.";
}

export default function ResetPasswordPage() {
  const token = useMemo(parseResetToken, []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const policyError = passwordPolicyError(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (resetError) {
      setError(readableResetError(resetError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Definir nova senha</h1>

      {done ? (
        <div className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="reset-password-done">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              Senha redefinida com sucesso. Por segurança, todas as sessões anteriores foram encerradas — entre novamente com a nova senha.
            </p>
          </div>
          <Button asChild className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            <a href="#/login">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Ir para o login
            </a>
          </Button>
        </div>
      ) : !token || token.length < 32 ? (
        <div className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-destructive/25 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="reset-password-missing-token">
          <p className="text-sm leading-relaxed text-foreground">
            Este endereço não contém um link de redefinição válido. Abra o link mais recente recebido por e-mail ou solicite um novo.
          </p>
          <Button asChild variant="outline" className="w-full gap-2 rounded-xl">
            <a href="#/esqueci-senha">
              <KeyRound className="h-4 w-4" aria-hidden="true" /> Solicitar novo link
            </a>
          </Button>
        </div>
      ) : (
        <>
          <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            Escolha uma nova senha com pelo menos 12 caracteres, combinando maiúsculas, minúsculas, números e símbolos.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="reset-password-form">
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nova senha</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="reset-password" name="password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Nova senha" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm">Confirmar nova senha</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="reset-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={12} value={confirm} onChange={(event) => setConfirm(event.target.value)} className="pl-9" placeholder="Repita a nova senha" />
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {submitting ? "Redefinindo…" : "Redefinir senha"}
            </Button>
          </form>
        </>
      )}

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
        <a href="#/login" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para o login
        </a>
      </div>
    </section>
  );
}

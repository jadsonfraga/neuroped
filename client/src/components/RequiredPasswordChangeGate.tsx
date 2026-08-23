import { FormEvent, useMemo, useState } from "react";
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

function passwordPolicyError(password: string): string | null {
  if (password.length < 12 || password.length > 128) {
    return "Use entre 12 e 128 caracteres.";
  }
  if (!/[A-Z]/.test(password)) return "Inclua pelo menos uma letra maiúscula.";
  if (!/[a-z]/.test(password)) return "Inclua pelo menos uma letra minúscula.";
  if (!/[0-9]/.test(password)) return "Inclua pelo menos um número.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Inclua pelo menos um símbolo.";
  return null;
}

function readablePasswordError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/senha atual|current/i.test(message)) return "A senha atual não confere.";
  if (/diferente|reuse/i.test(message)) return "A nova senha precisa ser diferente da senha atual.";
  if (/muitas|rate|429/i.test(message)) return "Muitas tentativas. Aguarde antes de tentar novamente.";
  if (/pol[ií]tica|mai[uú]scula|min[uú]scula|n[uú]mero|s[ií]mbolo|12|128/i.test(message)) return message;
  return "Não foi possível trocar a senha. Tente novamente.";
}

export function RequiredPasswordChangeGate() {
  const { changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword === currentPassword) return "A nova senha precisa ser diferente da senha atual.";
    const policy = passwordPolicyError(newPassword);
    if (policy) return policy;
    if (confirmation && confirmation !== newPassword) return "A confirmação não corresponde à nova senha.";
    return null;
  }, [currentPassword, newPassword, confirmation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const policy = passwordPolicyError(newPassword);
    if (!currentPassword || policy || newPassword === currentPassword || confirmation !== newPassword) {
      setError(
        !currentPassword
          ? "Informe a senha atual."
          : policy ?? (newPassword === currentPassword
            ? "A nova senha precisa ser diferente da senha atual."
            : "A confirmação não corresponde à nova senha."),
      );
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
    } catch (cause) {
      setError(readablePasswordError(cause));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center overflow-y-auto bg-background/95 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="required-password-change-title"
      data-testid="required-password-change-gate"
    >
      <section className="w-full max-w-md rounded-3xl border border-primary/15 bg-card p-5 shadow-2xl sm:p-7">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 id="required-password-change-title" className="text-center text-xl font-bold text-foreground">
          Troca de senha obrigatória
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Esta conta precisa definir uma nova senha antes de acessar qualquer dado clínico.
          As sessões anteriores serão revogadas automaticamente.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="required-password-change-form">
          <div className="space-y-2">
            <Label htmlFor="required-current-password">Senha atual</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="required-current-password"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="required-new-password">Nova senha</Label>
            <Input
              id="required-new-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              aria-describedby="required-password-policy"
            />
            <p id="required-password-policy" className="text-xs leading-relaxed text-muted-foreground">
              12–128 caracteres, com maiúscula, minúscula, número e símbolo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="required-confirm-password">Confirmar nova senha</Label>
            <Input
              id="required-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          {(error || validationError) && (
            <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">
              {error ?? validationError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full gap-2 rounded-xl"
            disabled={submitting || !currentPassword || !newPassword || !confirmation || Boolean(validationError)}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Trocando senha…" : "Trocar senha e continuar"}
          </Button>
        </form>

        <Button
          type="button"
          variant="ghost"
          className="mt-3 w-full gap-2"
          onClick={() => void logout()}
          disabled={submitting}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Sair desta conta
        </Button>
      </section>
    </div>
  );
}

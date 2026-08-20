import { useMemo, useState, type FormEvent } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { changePasswordRequest } from "@/lib/authClient";

function errorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  if (code === "WRONG_PASSWORD") return "A senha atual não confere.";
  if (code === "PASSWORD_REUSE_NOT_ALLOWED") return "Escolha uma senha diferente da atual.";
  if (code === "PASSWORD_POLICY_FAILED") return "A nova senha ainda não atende a todos os requisitos.";
  return error instanceof Error ? error.message : "Não foi possível alterar a senha.";
}

export default function AlterarSenhaPage() {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requirements = useMemo(() => ({
    length: newPassword.length >= 12,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    symbol: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmation,
  }), [confirmation, newPassword]);
  const valid = Object.values(requirements).every(Boolean) && currentPassword.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await changePasswordRequest(currentPassword, newPassword);
      await logout();
      navigate("/login?password=changed");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl py-8">
      <Card className="border-primary/15 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-7 w-7" aria-hidden="true" />
          </div>
          <CardTitle>Segurança da conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            {user?.mustChangePassword
              ? "Sua senha é temporária. Troque-a antes de acessar informações protegidas."
              : "Altere sua senha e encerre imediatamente todas as sessões abertas."}
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input id="current-password" type="password" autoComplete="current-password" maxLength={1024} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input id="new-password" type="password" autoComplete="new-password" maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
            </div>
            <ul className="grid gap-1 rounded-2xl border bg-muted/30 p-4 text-xs sm:grid-cols-2" aria-label="Requisitos da nova senha">
              {[
                [requirements.length, "12 ou mais caracteres"],
                [requirements.upper, "Uma letra maiúscula"],
                [requirements.lower, "Uma letra minúscula"],
                [requirements.number, "Um número"],
                [requirements.symbol, "Um símbolo"],
                [requirements.match, "Confirmação idêntica"],
              ].map(([done, label]) => (
                <li key={String(label)} className={done ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>
                  {done ? "✓" : "○"} {label}
                </li>
              ))}
            </ul>
            {error && <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
            <Button className="w-full gap-2" type="submit" disabled={!valid || submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {submitting ? "Alterando…" : "Alterar senha e encerrar sessões"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

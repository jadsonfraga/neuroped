import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Building2, KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  acceptInvitationRequest,
  previewInvitation,
  type InvitationPreview,
} from "@/lib/authClient";

const ROLE_LABELS: Record<InvitationPreview["role"], string> = {
  owner: "Proprietário",
  clinic_admin: "Administrador da clínica",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

function currentToken(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.split("?", 2)[1] ?? "").get("token")?.trim() ?? "";
}

function errorMessage(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
  if (code === "INVITATION_NOT_AVAILABLE") return "Este convite não existe, expirou ou já foi utilizado.";
  if (code === "INVITE_CREDENTIALS_INVALID") return "A senha da conta não confere ou o acesso está temporariamente bloqueado.";
  if (code === "SEAT_LIMIT_REACHED") return "O assento reservado não está mais disponível. Peça um novo convite ao gestor.";
  if (code === "PASSWORD_POLICY_FAILED") return "A senha ainda não atende a todos os requisitos de segurança.";
  return error instanceof Error ? error.message : "Não foi possível aceitar o convite.";
}

export default function AceitarConvitePage() {
  const [, navigate] = useLocation();
  const token = useMemo(currentToken, []);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!token) {
      setError("O link do convite está incompleto.");
      setLoading(false);
      return () => { active = false; };
    }
    previewInvitation(token)
      .then((data) => {
        if (!active) return;
        setPreview(data);
        setName(data.existingName ?? "");
      })
      .catch((failure) => {
        if (active) setError(errorMessage(failure));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [token]);

  const requirements = useMemo(() => ({
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirmation,
  }), [confirmation, password]);
  const newAccountValid = Boolean(
    preview
    && !preview.existingAccount
    && name.trim().length >= 2
    && Object.values(requirements).every(Boolean),
  );
  const existingAccountValid = Boolean(preview?.existingAccount && password.length > 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!preview || submitting || (!newAccountValid && !existingAccountValid)) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await acceptInvitationRequest({
        token,
        ...(preview.existingAccount ? {} : { name: name.trim() }),
        password,
      });
      navigate(`/login?invite=accepted&email=${encodeURIComponent(result.email)}`);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[55vh] items-center justify-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Validando convite</span></div>;
  }

  return (
    <section className="mx-auto max-w-xl py-8">
      <Card className="overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
        <div className="h-1.5 bg-gradient-to-r from-primary to-chart-2" />
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserPlus className="h-7 w-7" aria-hidden="true" /></div>
          <CardTitle>Convite para o NeuroPed</CardTitle>
          <CardDescription>{preview ? "Confirme sua entrada no ambiente clínico protegido." : "Não foi possível validar este link."}</CardDescription>
        </CardHeader>
        <CardContent>
          {preview ? (
            <form className="space-y-4" onSubmit={submit}>
              <div className="rounded-2xl border bg-muted/25 p-4">
                <div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-semibold">{preview.clinicName}</p><p className="mt-1 text-sm text-muted-foreground">{preview.email}</p><Badge className="mt-2" variant="outline">{ROLE_LABELS[preview.role]}</Badge></div></div>
              </div>
              {!preview.existingAccount && (
                <div className="space-y-2"><Label htmlFor="invite-name">Seu nome</Label><Input id="invite-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} required /></div>
              )}
              <div className="space-y-2">
                <Label htmlFor="invite-password">{preview.existingAccount ? "Senha da sua conta NeuroPed" : "Crie uma senha"}</Label>
                <Input id="invite-password" type="password" autoComplete={preview.existingAccount ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} maxLength={preview.existingAccount ? 1024 : 128} required />
              </div>
              {!preview.existingAccount && (
                <>
                  <div className="space-y-2"><Label htmlFor="invite-confirmation">Confirmar senha</Label><Input id="invite-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} maxLength={128} required /></div>
                  <ul className="grid gap-1 rounded-2xl border bg-muted/25 p-4 text-xs sm:grid-cols-2" aria-label="Requisitos da senha">
                    {[
                      [requirements.length, "12 ou mais caracteres"],
                      [requirements.upper, "Uma letra maiúscula"],
                      [requirements.lower, "Uma letra minúscula"],
                      [requirements.number, "Um número"],
                      [requirements.symbol, "Um símbolo"],
                      [requirements.match, "Confirmação idêntica"],
                    ].map(([done, label]) => <li key={String(label)} className={done ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>{done ? "✓" : "○"} {label}</li>)}
                  </ul>
                </>
              )}
              {error && <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
              <Button className="w-full gap-2" type="submit" disabled={submitting || (!newAccountValid && !existingAccountValid)}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}{submitting ? "Confirmando…" : preview.existingAccount ? "Confirmar com minha senha" : "Criar conta e entrar na equipe"}</Button>
              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />O link é de uso único e expira em 7 dias. Depois da confirmação, entre normalmente com o e-mail acima.</p>
            </form>
          ) : (
            <div className="space-y-4 text-center"><p className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{error}</p><Button variant="outline" onClick={() => navigate("/login")}>Ir para o login</Button></div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

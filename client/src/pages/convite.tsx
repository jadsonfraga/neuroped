import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaasApiError, acceptInvitation } from "@/lib/saasClient";
import type { ClinicMembershipRole } from "@shared/tenant";

function invitationToken(): string {
  if (typeof window === "undefined") return "";
  const fromSearch = new URLSearchParams(window.location.search).get("token");
  if (fromSearch) return fromSearch.trim();
  const hashQuery = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(hashQuery).get("token")?.trim() ?? "";
}

function postInviteDestination(role: ClinicMembershipRole | null): string {
  return role === "owner" || role === "clinic_admin" ? "/assinatura" : "/ajuda";
}

export default function ConvitePage() {
  const token = useMemo(invitationToken, []);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [acceptedRole, setAcceptedRole] = useState<ClinicMembershipRole | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Este link de convite não contém um token válido.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await acceptInvitation(token, name.trim(), password);
      setAccountCreated(result.accountCreated);
      setAcceptedRole(result.role);
      setAccepted(true);
    } catch (cause) {
      if (cause instanceof SaasApiError && cause.code === "ACCOUNT_DATA_REQUIRED") {
        setError("Para criar sua primeira conta, informe seu nome e uma senha com pelo menos 10 caracteres.");
      } else if (cause instanceof SaasApiError && cause.code === "BILLING_ENTITLEMENT_DENIED") {
        setError("A clínica precisa ter um plano ativo ou trial vigente antes de aceitar novos membros.");
      } else if (cause instanceof SaasApiError && cause.code === "SEAT_LIMIT_REACHED") {
        setError("O limite de assentos da clínica foi atingido. Peça ao gestor para atualizar o plano.");
      } else {
        setError(cause instanceof Error ? cause.message : "Não foi possível aceitar o convite.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (accepted) {
    const nextPath = postInviteDestination(acceptedRole);
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
        <section className="w-full rounded-3xl border border-emerald-500/20 bg-card p-7 text-center shadow-xl shadow-emerald-500/5 sm:p-10" data-testid="invitation-accepted">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black text-foreground">Convite aceito</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {accountCreated ? "Sua conta de equipe foi criada e já está vinculada à clínica." : "Sua conta já existia e foi vinculada à clínica."} Agora entre com seu e-mail e senha para continuar com as permissões do seu papel.
          </p>
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="mt-7 inline-flex">
            <Button className="gap-2 rounded-xl">Entrar no NeuroPed <ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-10">
      <section className="w-full rounded-3xl border border-primary/15 bg-card p-7 shadow-xl shadow-primary/5 sm:p-10" data-testid="invitation-page">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-black text-foreground">Entrar para a equipe</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Use este convite para entrar no espaço de trabalho da sua clínica. Se você já possui conta NeuroPed, os dados de criação abaixo não alteram sua senha existente.
        </p>

        {!token && (
          <p className="mt-5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm leading-relaxed text-amber-800 dark:text-amber-200" role="alert">
            O link está incompleto. Solicite ao gestor um novo convite com o endereço completo.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invitation-name">Seu nome, se for criar uma conta</Label>
            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="invitation-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="pl-9" placeholder="Nome completo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invitation-password">Senha, se for criar uma conta</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="invitation-password" type="password" autoComplete="new-password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Pelo menos 10 caracteres" />
            </div>
          </div>
          {error && <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm leading-relaxed text-destructive" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting || !token} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? "Validando convite…" : "Aceitar convite"}
            {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>

        <div className="mt-6 grid gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:grid-cols-2">
          <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> O token é validado no servidor e expira automaticamente.</p>
          <p className="flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> O convite define seu papel e não compartilha credenciais.</p>
        </div>
      </section>
    </main>
  );
}

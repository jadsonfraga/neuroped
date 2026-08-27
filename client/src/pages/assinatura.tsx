import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Loader2,
  MailPlus,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import {
  SaasApiError,
  createInvitation,
  createTenant,
  getBillingSnapshot,
  listClinicMembers,
  listInvitations,
  resendInvitation,
  revokeInvitation,
  startCheckout,
  type BillingSnapshot,
  type ClinicInvitation,
  type ClinicMember,
} from "@/lib/saasClient";
import type { ClinicMembershipRole } from "@shared/tenant";
import { CANONICAL_PRICE_CENTS } from "@shared/billing";

const ROLE_LABELS: Record<ClinicMembershipRole, string> = {
  owner: "Owner",
  clinic_admin: "Administrador da clínica",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

const INVITABLE_ROLES: ClinicMembershipRole[] = ["professional", "assistant", "financial"];

function money(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return "não informado";
  const parsed = new Date(value.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? "não informado" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(parsed);
}

function apiErrorMessage(cause: unknown): string {
  if (cause instanceof SaasApiError) {
    if (cause.code === "BILLING_PROVIDER_UNAVAILABLE") return "O provedor de cobrança ainda não está configurado neste ambiente. Nenhum pagamento foi iniciado.";
    if (cause.code === "BILLING_DB_NOT_CONFIGURED" || cause.code === "BILLING_UNAVAILABLE") return "A camada de cobrança não está disponível neste ambiente.";
    if (cause.code === "ONBOARDING_BASE_URL_NOT_CONFIGURED") return "A origem HTTPS do onboarding ainda não foi configurada para emitir convites.";
    if (cause.code === "SEAT_LIMIT_REACHED") return "O limite de assentos ou o entitlement da clínica não permite este convite.";
    if (cause.code === "TENANT_FORBIDDEN") return "Seu perfil não possui permissão para administrar esta clínica.";
    return cause.message;
  }
  return cause instanceof Error ? cause.message : "Não foi possível concluir a operação.";
}

function hasUsableSubscription(entitlement: BillingSnapshot["entitlement"] | null | undefined): boolean {
  if (!entitlement) return false;
  if (entitlement.deniedReason === "ENTITLEMENT_NO_SUBSCRIPTION") return false;
  if (entitlement.trialActive) return true;
  return entitlement.subscriptionStatus === "active" || entitlement.subscriptionStatus === "past_due";
}

function statusCopy(snapshot: BillingSnapshot | null): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  const entitlement = snapshot?.entitlement;
  if (!entitlement) return { label: "Aguardando configuração", tone: "neutral" };
  if (entitlement.isSuspended) return { label: "Suspensa", tone: "danger" };
  if (entitlement.isPastDue) return { label: "Pagamento pendente", tone: "warning" };
  if (entitlement.trialActive) return { label: "Trial ativo", tone: "success" };
  if (entitlement.deniedReason === "ENTITLEMENT_NO_SUBSCRIPTION") return { label: "Sem assinatura ativa", tone: "warning" };
  if (entitlement.subscriptionStatus === "active") return { label: "Ativa", tone: "success" };
  return { label: "Sem assinatura ativa", tone: "warning" };
}

function toneClass(tone: ReturnType<typeof statusCopy>["tone"]): string {
  if (tone === "success") return "border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300";
  if (tone === "warning") return "border-amber-500/25 bg-amber-500/[0.07] text-amber-800 dark:text-amber-200";
  if (tone === "danger") return "border-destructive/25 bg-destructive/5 text-destructive";
  return "border-border bg-muted/40 text-muted-foreground";
}

export default function AssinaturaPage() {
  const { user } = useAuth();
  const {
    activeClinic,
    activeClinicId,
    clinics,
    isLoading: clinicsLoading,
    error: clinicsError,
    reloadClinics,
  } = useClinic();
  const canManage = activeClinic?.role === "owner" || activeClinic?.role === "clinic_admin";

  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [invitations, setInvitations] = useState<ClinicInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  const [clinicName, setClinicName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ClinicMembershipRole>("professional");
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeMemberCount = members.filter((member) => member.active).length;
  const currentStatus = useMemo(() => statusCopy(billing), [billing]);
  const monthlyEstimate = seats * CANONICAL_PRICE_CENTS;

  async function reloadCommercialData() {
    if (!activeClinicId) return;
    setLoading(true);
    setError(null);
    setTeamError(null);
    try {
      const [billingResult, memberResult] = await Promise.all([
        getBillingSnapshot(activeClinicId),
        canManage ? listClinicMembers(activeClinicId) : Promise.resolve<ClinicMember[]>([]),
      ]);
      setBilling(billingResult);
      setMembers(memberResult);
      setSeats((current) => Math.max(current, memberResult.filter((member) => member.active).length, 1));
      if (canManage) {
        try {
          setInvitations(await listInvitations(activeClinicId));
        } catch (cause) {
          setTeamError(apiErrorMessage(cause));
        }
      } else {
        setInvitations([]);
      }
    } catch (cause) {
      setBilling(null);
      setMembers([]);
      setInvitations([]);
      setError(apiErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reloadCommercialData();
    // O tenant ativo é a fronteira; a função consulta sempre o identificador atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClinicId, canManage]);

  async function handleCreateClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("clinic");
    setError(null);
    try {
      await createTenant({ name: clinicName.trim(), legalName: legalName.trim() || undefined });
      setClinicName("");
      setLegalName("");
      await reloadClinics();
    } catch (cause) {
      setError(apiErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handleCheckout() {
    if (!activeClinicId) return;
    setBusy("checkout");
    setError(null);
    try {
      const checkout = await startCheckout(activeClinicId, seats);
      if (!checkout.url) throw new Error("O provedor não retornou um link de checkout.");
      window.location.assign(checkout.url);
    } catch (cause) {
      setError(apiErrorMessage(cause));
      setBusy(null);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeClinicId) return;
    setBusy("invite");
    setError(null);
    setTeamError(null);
    try {
      const result = await createInvitation({ clinicId: activeClinicId, email: inviteEmail.trim(), role: inviteRole });
      setLastInviteUrl(result.invitationUrl);
      setInviteEmail("");
      await reloadCommercialData();
    } catch (cause) {
      setTeamError(apiErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handleResend(invitationId: string) {
    if (!activeClinicId) return;
    setBusy(`resend:${invitationId}`);
    setTeamError(null);
    try {
      const result = await resendInvitation(activeClinicId, invitationId);
      setLastInviteUrl(result.invitationUrl);
      await reloadCommercialData();
    } catch (cause) {
      setTeamError(apiErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function handleRevoke(invitationId: string) {
    if (!activeClinicId) return;
    setBusy(`revoke:${invitationId}`);
    setTeamError(null);
    try {
      await revokeInvitation(activeClinicId, invitationId);
      await reloadCommercialData();
    } catch (cause) {
      setTeamError(apiErrorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function copyInviteUrl() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setTeamError("O link foi criado, mas não foi possível copiá-lo automaticamente.");
    }
  }

  if (clinicsLoading && clinics.length === 0) {
    return <div className="mx-auto flex min-h-[60vh] items-center justify-center p-6" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" /><span className="ml-3 text-sm text-muted-foreground">Carregando seu espaço de trabalho…</span></div>;
  }

  if (!activeClinicId) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6" data-testid="saas-onboarding-page">
        <section className="rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.1] via-card to-chart-2/[0.08] p-7 shadow-xl shadow-primary/5 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" aria-hidden="true" /></div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-primary">Primeiro passo</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Crie o espaço da sua clínica</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">O espaço de trabalho separa equipe, permissões, billing e dados por organização. Você poderá iniciar o trial e convidar a equipe depois da criação.</p>
          <form onSubmit={handleCreateClinic} className="mt-7 grid gap-4 sm:grid-cols-2" data-testid="create-clinic-form">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="clinic-name">Nome da clínica</Label><Input id="clinic-name" required minLength={2} value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Ex.: NeuroPed Recife" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="clinic-legal-name">Razão social <span className="font-normal text-muted-foreground">(opcional)</span></Label><Input id="clinic-legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} placeholder="Ex.: NeuroPed Serviços Médicos Ltda." /></div>
            {error && <p className="sm:col-span-2 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p>}
            {clinicsError && <p className="sm:col-span-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-sm text-amber-800 dark:text-amber-200" role="alert">{clinicsError}</p>}
            <Button type="submit" disabled={busy === "clinic"} className="gap-2 rounded-xl sm:col-span-2 sm:w-fit">{busy === "clinic" ? "Criando espaço…" : "Criar espaço da clínica"}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Button>
          </form>
        </section>
      </section>
    );
  }

  const entitlement = billing?.entitlement;
  const hasBillingPlan = hasUsableSubscription(entitlement);
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12" data-testid="subscription-page">
      <header className="flex flex-col gap-4 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Central do SaaS</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground">Plano e equipe</h1>
          <p className="mt-2 text-sm text-muted-foreground">{activeClinic?.name} · {ROLE_LABELS[activeClinic?.role ?? "professional"]}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void reloadCommercialData()} disabled={loading} className="gap-2 rounded-xl"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" /> Atualizar status</Button>
      </header>

      {error && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive" role="alert"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}

      <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl border border-primary/15 bg-card p-6 shadow-lg shadow-primary/5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Plano profissional</p><h2 className="mt-2 text-2xl font-black text-foreground">{money(CANONICAL_PRICE_CENTS)} <span className="text-sm font-medium text-muted-foreground">/ assento / mês</span></h2></div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${toneClass(currentStatus.tone)}`}>{currentStatus.label}</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Assentos contratados</p><p className="mt-1 text-xl font-black text-foreground">{seats}</p></div>
            <div className="rounded-2xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Membros ativos</p><p className="mt-1 text-xl font-black text-foreground">{activeMemberCount}</p></div>
            <div className="rounded-2xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Estimativa mensal</p><p className="mt-1 text-xl font-black text-foreground">{money(monthlyEstimate)}</p></div>
          </div>
          {entitlement?.trialActive && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><Clock3 className="h-4 w-4" aria-hidden="true" /> Trial até {dateLabel(entitlement.trialEndsAt)}</p>}
          {entitlement?.isPastDue && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200"><ShieldAlert className="h-4 w-4" aria-hidden="true" /> Há uma pendência de pagamento; o acesso segue a carência definida no servidor.</p>}
          {!canManage ? <p className="mt-5 rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">Seu papel pode usar o espaço de trabalho, mas somente Owner ou Administrador da clínica pode alterar plano, assentos e convites.</p> : (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary/[0.05] p-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2"><Label htmlFor="seat-count">Quantidade de assentos</Label><Input id="seat-count" type="number" min={Math.max(activeMemberCount, 1)} max={500} value={seats} onChange={(event) => setSeats(Math.max(Math.max(activeMemberCount, 1), Number(event.target.value) || 1))} /></div>
              <Button type="button" onClick={() => void handleCheckout()} disabled={busy === "checkout"} className="gap-2 rounded-xl">{busy === "checkout" ? "Abrindo checkout…" : hasBillingPlan ? "Atualizar cobrança" : "Iniciar contratação"}<CreditCard className="h-4 w-4" aria-hidden="true" /></Button>
            </div>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">O frontend apenas inicia o checkout. O servidor revalida clínica, papel, assentos e entitlement antes de criar a cobrança.</p>
        </article>

        <aside className="rounded-3xl border border-card-border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></div>
          <h2 className="mt-4 text-lg font-bold text-foreground">Pronto para começar?</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A sequência recomendada é simples: criar clínica, confirmar o trial, convidar a equipe e só então configurar os fluxos do atendimento.</p>
          <ol className="mt-5 space-y-3 text-sm text-foreground">
            <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Confirmar o espaço ativo</li>
            <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Escolher assentos compatíveis com a equipe</li>
            <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Enviar convites individuais</li>
          </ol>
          <Link href="/ajuda" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Ver orientações de uso <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </aside>
      </section>

      <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-card-border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Equipe</p><h2 className="mt-2 text-xl font-black text-foreground">Membros ativos</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{members.length} registros</span></div>
          {members.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">A equipe ainda não foi carregada ou não há membros visíveis para este papel.</p> : <div className="mt-5 divide-y divide-border">{members.map((member) => <div key={member.userId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.email ?? "e-mail não informado"}</p></div><Badge variant="secondary" className="shrink-0">{ROLE_LABELS[member.role] ?? member.role}</Badge></div>)}</div>}
        </article>

        <article className="rounded-3xl border border-card-border bg-card p-6 shadow-sm sm:p-7">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserPlus className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Onboarding</p><h2 className="mt-1 text-xl font-black text-foreground">Convidar profissional</h2></div></div>
          {!canManage ? <p className="mt-5 text-sm leading-relaxed text-muted-foreground">Somente Owner ou Administrador da clínica pode criar convites.</p> : <form onSubmit={handleInvite} className="mt-5 space-y-4" data-testid="invite-member-form"><div className="space-y-2"><Label htmlFor="invite-email">E-mail profissional</Label><Input id="invite-email" type="email" required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="nome@dominio.com" /></div><div className="space-y-2"><Label htmlFor="invite-role">Papel no espaço</Label><select id="invite-role" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as ClinicMembershipRole)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{INVITABLE_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></div>{teamError && <p className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive" role="alert">{teamError}</p>}<Button type="submit" disabled={busy === "invite"} className="w-full gap-2 rounded-xl">{busy === "invite" ? "Criando convite…" : "Criar convite"}<MailPlus className="h-4 w-4" aria-hidden="true" /></Button></form>}
        </article>
      </section>

      {lastInviteUrl && canManage && <section className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5" data-testid="created-invitation-link"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-foreground">Link de convite pronto</p><p className="mt-1 break-all text-xs text-muted-foreground">{lastInviteUrl}</p></div><Button type="button" variant="outline" onClick={() => void copyInviteUrl()} className="shrink-0 gap-2 rounded-xl"><Copy className="h-4 w-4" aria-hidden="true" /> {copied ? "Copiado" : "Copiar link"}</Button></div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">O backend registrou o convite e aplicou a validade. Esta tela entrega o link para envio pelo canal autorizado da clínica; nenhuma credencial é exposta.</p></section>}

      {canManage && <section className="mt-5 rounded-3xl border border-card-border bg-card p-6 shadow-sm sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Convites</p><h2 className="mt-2 text-xl font-black text-foreground">Acompanhar onboarding</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">{pendingInvitations.length} pendentes</span></div>{teamError && !lastInviteUrl && <p className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive" role="alert">{teamError}</p>}{pendingInvitations.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Nenhum convite pendente nesta clínica.</p> : <div className="mt-5 space-y-3">{pendingInvitations.map((invitation) => <div key={invitation.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{invitation.email}</p><p className="mt-1 text-xs text-muted-foreground">{ROLE_LABELS[invitation.role] ?? invitation.role} · expira em {dateLabel(invitation.expires_at)}</p></div><div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="outline" onClick={() => void handleResend(invitation.id)} disabled={busy === `resend:${invitation.id}`} className="gap-1.5 rounded-lg"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Reenviar</Button><Button type="button" size="sm" variant="ghost" onClick={() => void handleRevoke(invitation.id)} disabled={busy === `revoke:${invitation.id}`} className="gap-1.5 rounded-lg text-destructive hover:text-destructive"><XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Revogar</Button></div></div>)}</div>}</section>}

      <footer className="mt-7 flex flex-col gap-2 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Conta: {user?.email}</span><span className="inline-flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> A decisão de acesso permanece no servidor.</span></footer>
    </section>
  );
}

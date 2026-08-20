import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/authClient";

type TenantRole = "owner" | "clinic_admin" | "professional" | "assistant" | "financial";

interface Tenant {
  id: string;
  name: string;
  legalName: string | null;
  timezone: string;
  status: string;
  role: TenantRole;
}

interface BillingOverview {
  plan: {
    code: string;
    name: string;
    currency: "BRL";
    unitAmountCents: number;
    interval: "month";
    trialDays: number;
    minSeats: number;
    maxSeats: number;
  };
  billingConfigured: boolean;
  account: null | {
    clinicId: string;
    planCode: string;
    status: string;
    seatQuantity: number;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    customerPortalAvailable: boolean;
  };
  usage: { activeMembers: number; pendingInvitations: number; remainingSeats: number };
  access: { canRead: boolean; canWrite: boolean; reason: string | null };
}

interface TeamMember {
  userId: string;
  name: string;
  email: string | null;
  role: TenantRole;
  active: boolean;
  globalRole: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TenantRole;
  expiresAt: string;
  createdAt: string;
}

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(path, init);
  const payload = await response.json().catch(() => ({})) as T & ApiErrorPayload;
  if (!response.ok) {
    throw new ApiError(payload.error || `Operação indisponível (${response.status}).`, payload.code);
  }
  return payload;
}

const FINANCE_ROLES = new Set<TenantRole>(["owner", "clinic_admin", "financial"]);
const MANAGER_ROLES = new Set<TenantRole>(["owner", "clinic_admin"]);

const ROLE_LABELS: Record<TenantRole, string> = {
  owner: "Proprietário",
  clinic_admin: "Administrador da clínica",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Período de avaliação",
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
  suspended: "Suspenso",
  incomplete: "Contratação incompleta",
};

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

function accessMessage(reason: string | null): string {
  if (reason === "TRIAL_EXPIRED") return "O período de avaliação terminou. A leitura permanece disponível; novas gravações exigem ativação.";
  if (reason === "SEAT_LIMIT_EXCEEDED") return "A equipe ativa excede os assentos contratados. Ajuste o plano antes de novas gravações.";
  if (reason === "SUBSCRIPTION_INACTIVE") return "A assinatura não permite novas gravações neste momento. Seus dados continuam disponíveis para leitura.";
  if (reason === "ACCOUNT_MISSING") return "A conta comercial desta clínica precisa ser regularizada pelo suporte.";
  return "Plano regular: leitura e gravação estão liberadas.";
}

function failureMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "USER_NOT_REGISTERED") {
    return "Essa pessoa ainda precisa criar uma conta NeuroPed antes de entrar na equipe.";
  }
  if (error instanceof ApiError && error.code === "SEAT_LIMIT_REACHED") {
    return "Todos os assentos estão ocupados. Aumente o plano antes de adicionar outra pessoa.";
  }
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

export default function PlanoEquipePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [seats, setSeats] = useState(1);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TenantRole>("professional");
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [revoking, setRevoking] = useState<TeamInvitation | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [timezone, setTimezone] = useState("America/Recife");

  const selected = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedId) ?? null,
    [selectedId, tenants],
  );
  const canSeeFinance = Boolean(selected && FINANCE_ROLES.has(selected.role));
  const canManage = Boolean(selected && MANAGER_ROLES.has(selected.role));

  const loadTenants = useCallback(async (preferredId?: string) => {
    const payload = await requestJson<{ data: Tenant[] }>("/api/tenants", { cache: "no-store" });
    setTenants(payload.data);
    const nextId = preferredId && payload.data.some((tenant) => tenant.id === preferredId)
      ? preferredId
      : payload.data.find((tenant) => FINANCE_ROLES.has(tenant.role))?.id ?? payload.data[0]?.id ?? "";
    setSelectedId(nextId);
  }, []);

  const loadDetails = useCallback(async (tenant: Tenant) => {
    if (!FINANCE_ROLES.has(tenant.role)) {
      setOverview(null);
      setMembers([]);
      setInvitations([]);
      return;
    }
    setLoadingDetails(true);
    try {
      const manager = MANAGER_ROLES.has(tenant.role);
      const [billing, team, pending] = await Promise.all([
        requestJson<BillingOverview>(
          `/api/billing/overview?clinicId=${encodeURIComponent(tenant.id)}`,
          { cache: "no-store" },
        ),
        manager
          ? requestJson<{ data: TeamMember[] }>(
              `/api/tenants/${encodeURIComponent(tenant.id)}/members`,
              { cache: "no-store" },
            )
          : Promise.resolve<{ data: TeamMember[] }>({ data: [] }),
        manager
          ? requestJson<{ data: TeamInvitation[] }>(
              `/api/tenants/${encodeURIComponent(tenant.id)}/invitations`,
              { cache: "no-store" },
            )
          : Promise.resolve<{ data: TeamInvitation[] }>({ data: [] }),
      ]);
      setOverview(billing);
      setSeats(Math.max(
        billing.usage.activeMembers + billing.usage.pendingInvitations,
        billing.account?.seatQuantity ?? 1,
      ));
      setMembers(team.data);
      setInvitations(pending.data);
    } catch (error) {
      setOverview(null);
      setMembers([]);
      setInvitations([]);
      toast({ title: "Não foi possível carregar plano e equipe", description: failureMessage(error), variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadTenants()
      .catch((error) => {
        if (active) toast({ title: "Área comercial indisponível", description: failureMessage(error), variant: "destructive" });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadTenants, toast]);

  useEffect(() => {
    if (selected) void loadDetails(selected);
  }, [loadDetails, selected]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.hash.split("?", 2)[1] ?? "").get("checkout");
    if (result === "success") toast({ title: "Contratação recebida", description: "A confirmação do provedor atualizará o plano automaticamente." });
    if (result === "cancelled") toast({ title: "Contratação cancelada", description: "Nenhuma cobrança foi concluída." });
  }, [toast]);

  async function createClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action || clinicName.trim().length < 2) return;
    setAction("create-clinic");
    try {
      const clinic = await requestJson<Tenant>("/api/tenants", {
        method: "POST",
        body: JSON.stringify({ name: clinicName, legalName, timezone }),
      });
      await loadTenants(clinic.id);
      toast({ title: "Clínica criada", description: "Seu período de avaliação de 14 dias começou agora." });
    } catch (error) {
      toast({ title: "Não foi possível criar a clínica", description: failureMessage(error), variant: "destructive" });
    } finally {
      setAction(null);
    }
  }

  async function openCheckout() {
    if (!selected || !overview || action) return;
    setAction("checkout");
    try {
      const payload = await requestJson<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ clinicId: selected.id, seats }),
      });
      window.location.assign(payload.url);
    } catch (error) {
      toast({ title: "Contratação não iniciada", description: failureMessage(error), variant: "destructive" });
      setAction(null);
    }
  }

  async function openPortal() {
    if (!selected || action) return;
    setAction("portal");
    try {
      const payload = await requestJson<{ url: string }>("/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({ clinicId: selected.id }),
      });
      window.location.assign(payload.url);
    } catch (error) {
      toast({ title: "Portal indisponível", description: failureMessage(error), variant: "destructive" });
      setAction(null);
    }
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || action || !inviteEmail.trim()) return;
    setAction("add-member");
    try {
      const invitation = await requestJson<{ url: string }>(
        `/api/tenants/${encodeURIComponent(selected.id)}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail("");
      setInvitationLink(invitation.url);
      await loadDetails(selected);
      toast({ title: "Convite criado", description: "Copie o link seguro e envie à pessoa convidada." });
    } catch (error) {
      toast({ title: "Não foi possível criar o convite", description: failureMessage(error), variant: "destructive" });
    } finally {
      setAction(null);
    }
  }

  async function revokeInvitation() {
    if (!selected || !revoking || action) return;
    setAction("revoke-invitation");
    try {
      await requestJson(
        `/api/tenants/${encodeURIComponent(selected.id)}/invitations?invitationId=${encodeURIComponent(revoking.id)}`,
        { method: "DELETE" },
      );
      setRevoking(null);
      await loadDetails(selected);
      toast({ title: "Convite revogado", description: "O assento reservado voltou a ficar disponível." });
    } catch (error) {
      toast({ title: "Não foi possível revogar", description: failureMessage(error), variant: "destructive" });
    } finally {
      setAction(null);
    }
  }

  async function copyInvitationLink() {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      toast({ title: "Link copiado", description: "O convite expira em 7 dias e só pode ser usado uma vez." });
    } catch {
      toast({ title: "Não foi possível copiar", description: "Selecione o link e copie manualmente.", variant: "destructive" });
    }
  }

  async function removeMember() {
    if (!selected || !removing || action) return;
    setAction("remove-member");
    try {
      await requestJson(
        `/api/tenants/${encodeURIComponent(selected.id)}/members?userId=${encodeURIComponent(removing.userId)}`,
        { method: "DELETE" },
      );
      setRemoving(null);
      await loadDetails(selected);
      toast({ title: "Acesso removido", description: "O assento ficou disponível para outra pessoa." });
    } catch (error) {
      toast({ title: "Não foi possível remover", description: failureMessage(error), variant: "destructive" });
    } finally {
      setAction(null);
    }
  }

  if (loading) {
    return <div className="flex min-h-[45vh] items-center justify-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Carregando área comercial</span></div>;
  }

  if (tenants.length === 0) {
    return (
      <section className="mx-auto max-w-2xl py-8">
        <Card className="border-primary/20 shadow-xl shadow-primary/5">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" aria-hidden="true" /></div>
            <CardTitle>Comece sua clínica no NeuroPed</CardTitle>
            <CardDescription>Crie o ambiente isolado da sua equipe e use todos os recursos por 14 dias. Não é necessário cartão para iniciar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={createClinic}>
              <div className="space-y-2"><Label htmlFor="clinic-name">Nome da clínica</Label><Input id="clinic-name" value={clinicName} onChange={(event) => setClinicName(event.target.value)} maxLength={160} required /></div>
              <div className="space-y-2"><Label htmlFor="legal-name">Razão social <span className="text-muted-foreground">(opcional)</span></Label><Input id="legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} maxLength={200} /></div>
              <div className="space-y-2"><Label htmlFor="clinic-timezone">Fuso horário IANA</Label><Input id="clinic-timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} maxLength={80} required /></div>
              <Button className="w-full gap-2" type="submit" disabled={Boolean(action) || clinicName.trim().length < 2}>{action === "create-clinic" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}Criar clínica e iniciar avaliação</Button>
              <p className="text-center text-xs text-muted-foreground">Uma avaliação gratuita por conta. Depois, o plano custa R$ 99 por pessoa/mês.</p>
            </form>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Gestão comercial protegida</div>
          <h1 className="text-3xl font-semibold tracking-tight">Plano e equipe</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Assentos, acesso e cobrança são validados pelo servidor. Cancelamentos nunca bloqueiam a leitura dos seus dados.</p>
        </div>
        <div className="w-full md:w-80">
          <Label htmlFor="tenant-select" className="sr-only">Clínica</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger id="tenant-select"><SelectValue placeholder="Selecione a clínica" /></SelectTrigger>
            <SelectContent>{tenants.map((tenant) => <SelectItem key={tenant.id} value={tenant.id}>{tenant.name} · {ROLE_LABELS[tenant.role]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </header>

      {!canSeeFinance && selected && (
        <Card><CardContent className="flex gap-3 py-6"><ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-semibold">Visão financeira restrita</p><p className="mt-1 text-sm text-muted-foreground">Seu acesso em {selected.name} é de {ROLE_LABELS[selected.role]}. Um proprietário, administrador ou financeiro pode consultar o plano.</p></div></CardContent></Card>
      )}

      {canSeeFinance && loadingDetails && (
        <div className="flex min-h-48 items-center justify-center" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Carregando plano</span></div>
      )}

      {canSeeFinance && !loadingDetails && overview && (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="overflow-hidden border-primary/20">
              <CardHeader className="bg-primary/[0.04]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />{overview.plan.name}</CardTitle><CardDescription className="mt-2">{formatMoney(overview.plan.unitAmountCents)} por assento/mês · cobrança recorrente</CardDescription></div>
                  <Badge variant={overview.access.canWrite ? "default" : "outline"}>{STATUS_LABELS[overview.account?.status ?? ""] ?? overview.account?.status ?? "Sem conta"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Equipe ativa</p><p className="mt-1 text-2xl font-semibold">{overview.usage.activeMembers}</p></div>
                  <div className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Convites</p><p className="mt-1 text-2xl font-semibold">{overview.usage.pendingInvitations}</p></div>
                  <div className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Assentos</p><p className="mt-1 text-2xl font-semibold">{overview.account?.seatQuantity ?? 0}</p></div>
                  <div className="rounded-2xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Disponíveis</p><p className="mt-1 text-2xl font-semibold">{overview.usage.remainingSeats}</p></div>
                </div>
                <div className={`rounded-2xl border p-4 text-sm ${overview.access.canWrite ? "border-emerald-500/25 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}><strong>{overview.access.canWrite ? "Operação liberada. " : "Ação necessária. "}</strong>{accessMessage(overview.access.reason)}</div>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Fim da avaliação</dt><dd className="font-medium">{formatDate(overview.account?.trialEndsAt ?? null)}</dd></div>
                  <div><dt className="text-muted-foreground">Próximo período</dt><dd className="font-medium">{formatDate(overview.account?.currentPeriodEnd ?? null)}</dd></div>
                </dl>
                {canManage && (
                  <div className="border-t pt-5">
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="space-y-2"><Label htmlFor="seat-quantity">Quantidade de assentos</Label><Input id="seat-quantity" type="number" inputMode="numeric" min={Math.max(overview.plan.minSeats, overview.usage.activeMembers + overview.usage.pendingInvitations)} max={overview.plan.maxSeats} value={seats} onChange={(event) => setSeats(Number(event.target.value))} /></div>
                      {overview.account?.customerPortalAvailable ? (
                        <Button className="gap-2" onClick={openPortal} disabled={Boolean(action)}>{action === "portal" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ExternalLink className="h-4 w-4" aria-hidden="true" />}Gerenciar cobrança</Button>
                      ) : (
                        <Button className="gap-2" onClick={openCheckout} disabled={Boolean(action) || !overview.billingConfigured || seats < overview.usage.activeMembers + overview.usage.pendingInvitations || seats > overview.plan.maxSeats}>{action === "checkout" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}{overview.billingConfigured ? "Ativar plano" : "Contratação em configuração"}</Button>
                      )}
                    </div>
                    {!overview.billingConfigured && <p className="mt-2 text-xs text-muted-foreground">A integração de cobrança está protegida e permanece desativada até as credenciais Stripe de produção serem instaladas.</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" aria-hidden="true" />{selected?.name}</CardTitle><CardDescription>{selected?.legalName || "Ambiente clínico isolado"}</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Seu papel</span><span className="font-medium">{selected ? ROLE_LABELS[selected.role] : "—"}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Fuso horário</span><span className="font-medium">{selected?.timezone}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Leitura de dados</span><Badge variant="outline">Preservada</Badge></div>
                <div className="rounded-2xl border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">Cobrança, webhooks e limites de assentos não dependem de flags do navegador. Toda autorização é revalidada no backend.</div>
              </CardContent>
            </Card>
          </div>

          {canManage && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" aria-hidden="true" />Equipe</CardTitle><CardDescription>Crie um link de uso único. A pessoa pode confirmar uma conta existente ou criar a própria conta com senha forte.</CardDescription></CardHeader>
              <CardContent className="space-y-5">
                <form className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-[1fr_0.8fr_auto] md:items-end" onSubmit={createInvitation}>
                  <div className="space-y-2"><Label htmlFor="member-email">E-mail da pessoa convidada</Label><Input id="member-email" type="email" autoComplete="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} maxLength={254} required /></div>
                  <div className="space-y-2"><Label htmlFor="member-role">Papel na clínica</Label><Select value={inviteRole} onValueChange={(value) => setInviteRole(value as TenantRole)}><SelectTrigger id="member-role"><SelectValue /></SelectTrigger><SelectContent>{(["professional", "assistant", "financial", "clinic_admin"] as TenantRole[]).map((role) => <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>)}{selected?.role === "owner" && <SelectItem value="owner">{ROLE_LABELS.owner}</SelectItem>}</SelectContent></Select></div>
                  <Button className="gap-2" type="submit" disabled={Boolean(action) || !inviteEmail.trim() || overview.usage.remainingSeats < 1}>{action === "add-member" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}Criar convite</Button>
                </form>
                {invitationLink && <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4"><p className="text-sm font-semibold">Link seguro criado</p><p className="mt-1 break-all text-xs text-muted-foreground">{invitationLink}</p><Button type="button" size="sm" variant="outline" className="mt-3 gap-2" onClick={copyInvitationLink}><Copy className="h-4 w-4" aria-hidden="true" />Copiar link</Button></div>}
                {overview.usage.remainingSeats < 1 && <p className="text-xs text-amber-700 dark:text-amber-300">Não há assentos livres. Ajuste o plano antes de adicionar outra pessoa.</p>}
                {invitations.length > 0 && <div className="space-y-2"><p className="text-sm font-semibold">Convites pendentes</p><div className="divide-y rounded-2xl border">{invitations.map((invitation) => <div key={invitation.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-medium">{invitation.email}</p><p className="text-xs text-muted-foreground">{ROLE_LABELS[invitation.role]} · expira em {formatDate(invitation.expiresAt)}</p></div><Button type="button" size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive" disabled={Boolean(action)} onClick={() => setRevoking(invitation)}><Trash2 className="h-4 w-4" aria-hidden="true" />Revogar</Button></div>)}</div></div>}
                <div className="divide-y rounded-2xl border">
                  {members.filter((member) => member.active).map((member) => (
                    <div key={member.userId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0"><p className="truncate font-medium">{member.name}</p><p className="truncate text-xs text-muted-foreground">{member.email || "Conta sem e-mail"} · {ROLE_LABELS[member.role]}</p></div>
                      <Button type="button" size="sm" variant="ghost" className="gap-2 text-destructive hover:text-destructive" disabled={member.userId === user?.id || Boolean(action)} onClick={() => setRemoving(member)}><Trash2 className="h-4 w-4" aria-hidden="true" />Remover acesso</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <ConfirmDialog open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={removeMember} loading={action === "remove-member"} title={`Remover ${removing?.name ?? "esta pessoa"}?`} description="O acesso à clínica será desativado e o assento ficará disponível. Registros e auditoria permanecem preservados." confirmLabel="Remover acesso" variant="destructive" />
      <ConfirmDialog open={Boolean(revoking)} onClose={() => setRevoking(null)} onConfirm={revokeInvitation} loading={action === "revoke-invitation"} title="Revogar este convite?" description="O link deixará de funcionar imediatamente e o assento reservado voltará a ficar disponível." confirmLabel="Revogar convite" variant="destructive" />
    </div>
  );
}

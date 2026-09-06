import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  CreditCard,
  Loader2,
  Mail,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { invalidateIssuerCache } from "@/lib/issuer";
import { useToast } from "@/hooks/use-toast";

type SectionId = "perfil" | "clinica" | "equipe" | "plano";

const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof Building2 }> = [
  { id: "perfil", label: "Perfil", icon: Stethoscope },
  { id: "clinica", label: "Clínica", icon: Building2 },
  { id: "equipe", label: "Equipe", icon: UsersRound },
  { id: "plano", label: "Plano", icon: CreditCard },
];

/**
 * Seção inicial a partir do link (`#/configuracoes?secao=plano`).
 *
 * Sem isto, todo link para Configurações caía em "Perfil" e quem precisava de
 * Plano ou Equipe tinha que adivinhar em qual aba estava — inclusive o aviso
 * de assinatura pendente, que já apontava para cá e deixava a pessoa a um
 * clique de distância do que ela tinha acabado de pedir.
 *
 * Valor desconhecido cai em "perfil": a URL é entrada externa, não comando.
 */
function initialSectionFromLocation(): SectionId {
  if (typeof window === "undefined") return "perfil";
  const raw = window.location.hash.replace(/^#/, "");
  const query = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  const requested = new URLSearchParams(query).get("secao");
  return SECTIONS.some((entry) => entry.id === requested)
    ? (requested as SectionId)
    : "perfil";
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietário(a)",
  clinic_admin: "Administrador(a)",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  legalName: string | null;
  timezone: string;
  status: string;
  role: string;
  canManage: boolean;
  settings: {
    displayName: string;
    addressLine1: string;
    addressLine2: string;
    phone: string;
    publicEmail: string;
    companyLine: string;
    motto: string;
  };
}

interface MemberRow {
  userId: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
}

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
}

interface BillingSnapshot {
  entitlement: {
    planId: string | null;
    subscriptionStatus: string | null;
    trialActive: boolean;
    trialEndsAt: string | null;
    trialDaysRemaining: number;
    isActive: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    deniedReason: string | null;
  };
  seats: { contracted: number | null; activeMembers: number | null };
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `Falha (${response.status})`);
  return body;
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function PerfilSection() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ displayName: "", credentialsLine: "", specialty: "", documentEmail: "" });
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authFetch("/api/me/profile")
      .then((response) => readJson<typeof form & { configured: boolean; fallbackDisplayName: string; accountEmail: string }>(response))
      .then((profile) => {
        if (cancelled) return;
        setForm({
          displayName: profile.displayName || profile.fallbackDisplayName,
          credentialsLine: profile.credentialsLine,
          specialty: profile.specialty,
          documentEmail: profile.documentEmail || profile.accountEmail,
        });
        setConfigured(profile.configured);
      })
      .catch((loadError: Error) => !cancelled && setError(loadError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await readJson(await authFetch("/api/me/profile", { method: "PUT", body: JSON.stringify(form) }));
      invalidateIssuerCache();
      setConfigured(true);
      toast({ title: "Perfil profissional salvo ✓", description: "Seus documentos passam a usar esta identidade." });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground" role="status">Carregando perfil…</p>;

  return (
    <SectionCard
      title="Identidade profissional"
      description="Nome, registro e especialidade usados na assinatura de laudos, receitas e demais documentos que você emite."
    >
      {!configured && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          Perfil ainda não configurado: documentos emitidos indicarão a ausência de registro profissional até você salvar esta seção.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="perfil-nome">Nome como assina</Label>
          <Input id="perfil-nome" required minLength={2} maxLength={160} value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perfil-registro">Registro profissional</Label>
          <Input id="perfil-registro" maxLength={240} placeholder="Ex.: CRM-SP 12345 · RQE 6789" value={form.credentialsLine} onChange={(event) => setForm({ ...form, credentialsLine: event.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="perfil-especialidade">Especialidade</Label>
            <Input id="perfil-especialidade" maxLength={120} value={form.specialty} onChange={(event) => setForm({ ...form, specialty: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-email">E-mail nos documentos</Label>
            <Input id="perfil-email" type="email" maxLength={254} value={form.documentEmail} onChange={(event) => setForm({ ...form, documentEmail: event.target.value })} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Salvar perfil
        </Button>
      </form>
    </SectionCard>
  );
}

function ClinicaSection({ clinicId }: { clinicId: string }) {
  const { toast } = useToast();
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    void authFetch(`/api/tenants/${clinicId}`)
      .then((response) => readJson<TenantDetail>(response))
      .then(setDetail)
      .catch((loadError: Error) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [clinicId]);
  useEffect(load, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await readJson<TenantDetail>(
        await authFetch(`/api/tenants/${clinicId}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: detail.name,
            legalName: detail.legalName ?? "",
            timezone: detail.timezone,
            settings: detail.settings,
          }),
        }),
      );
      setDetail(updated);
      invalidateIssuerCache();
      toast({ title: "Clínica atualizada ✓" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground" role="status">Carregando clínica…</p>;
  if (!detail) return <p role="alert" className="text-sm text-destructive">{error ?? "Clínica indisponível."}</p>;

  const readOnly = !detail.canManage;
  const set = (patch: Partial<TenantDetail>) => setDetail({ ...detail, ...patch });
  const setSettings = (patch: Partial<TenantDetail["settings"]>) => setDetail({ ...detail, settings: { ...detail.settings, ...patch } });

  return (
    <SectionCard
      title="Dados da clínica"
      description={readOnly ? "Somente proprietário(a) e administrador(a) alteram estes dados." : "Nome, contato e papel timbrado institucional dos documentos desta clínica."}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cli-nome">Nome</Label>
            <Input id="cli-nome" required maxLength={160} disabled={readOnly} value={detail.name} onChange={(event) => set({ name: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-razao">Razão social</Label>
            <Input id="cli-razao" maxLength={200} disabled={readOnly} value={detail.legalName ?? ""} onChange={(event) => set({ legalName: event.target.value })} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cli-tz">Timezone (IANA)</Label>
            <Input id="cli-tz" maxLength={80} disabled={readOnly} value={detail.timezone} onChange={(event) => set({ timezone: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-fone">Telefone</Label>
            <Input id="cli-fone" maxLength={40} disabled={readOnly} value={detail.settings.phone} onChange={(event) => setSettings({ phone: event.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cli-end1">Endereço (linha 1)</Label>
          <Input id="cli-end1" maxLength={240} disabled={readOnly} value={detail.settings.addressLine1} onChange={(event) => setSettings({ addressLine1: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cli-end2">Endereço (linha 2)</Label>
          <Input id="cli-end2" maxLength={240} disabled={readOnly} value={detail.settings.addressLine2} onChange={(event) => setSettings({ addressLine2: event.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cli-email">E-mail público</Label>
            <Input id="cli-email" type="email" maxLength={254} disabled={readOnly} value={detail.settings.publicEmail} onChange={(event) => setSettings({ publicEmail: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cli-cnpj">Linha jurídica (CNPJ)</Label>
            <Input id="cli-cnpj" maxLength={240} disabled={readOnly} placeholder="Ex.: Empresa LTDA · CNPJ 00.000.000/0000-00" value={detail.settings.companyLine} onChange={(event) => setSettings({ companyLine: event.target.value })} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
        {!readOnly && (
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            Salvar clínica
          </Button>
        )}
      </form>
    </SectionCard>
  );
}

function EquipeSection({ clinicId }: { clinicId: string }) {
  const { toast } = useToast();
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [invitations, setInvitations] = useState<InvitationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("professional");
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(() => {
    setError(null);
    void Promise.all([
      authFetch(`/api/tenants/${clinicId}/members`),
      authFetch(`/api/billing/invitations?clinicId=${encodeURIComponent(clinicId)}`),
    ])
      .then(async ([membersResponse, invitationsResponse]) => {
        if (membersResponse.status === 403 || membersResponse.status === 402) {
          setForbidden(true);
          setMembers([]);
          setInvitations([]);
          return;
        }
        const membersBody = await readJson<{ data: MemberRow[] }>(membersResponse);
        setMembers(membersBody.data);
        if (invitationsResponse.ok) {
          const invitationsBody = await readJson<{ data: InvitationRow[] }>(invitationsResponse);
          setInvitations(invitationsBody.data);
        } else {
          setInvitations([]);
        }
      })
      .catch((loadError: Error) => setError(loadError.message));
  }, [clinicId]);
  useEffect(load, [load]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await readJson<{ delivery?: "email" }>(
        await authFetch("/api/billing/invitations", {
          method: "POST",
          body: JSON.stringify({ clinicId, email: inviteEmail.trim(), role: inviteRole, action: "create" }),
        }),
      );
      if (body.delivery !== "email") {
        throw new Error("O servidor não confirmou a entrega segura do convite por e-mail.");
      }
      setInviteEmail("");
      toast({
        title: "Convite enviado ✓",
        description: "O link foi enviado por e-mail ao convidado e expira em 7 dias.",
      });
      load();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Falha ao convidar.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitationId: string) {
    try {
      await readJson(
        await authFetch(`/api/billing/invitations?clinicId=${encodeURIComponent(clinicId)}&invitationId=${encodeURIComponent(invitationId)}`, { method: "DELETE" }),
      );
      load();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Falha ao revogar convite.");
    }
  }

  async function deactivate(userId: string) {
    try {
      await readJson(
        await authFetch(`/api/tenants/${clinicId}/members?userId=${encodeURIComponent(userId)}`, { method: "DELETE" }),
      );
      load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Falha ao revogar acesso.");
    }
  }

  if (forbidden) {
    return (
      <SectionCard title="Equipe" description="Gestão de equipe é restrita a proprietário(a) e administrador(a) da clínica.">
        <p className="text-sm text-muted-foreground">Peça a um gestor da clínica para convidar ou alterar membros.</p>
      </SectionCard>
    );
  }
  if (!members) return <p className="text-sm text-muted-foreground" role="status">Carregando equipe…</p>;

  const pending = (invitations ?? []).filter((invitation) => invitation.status === "pending");

  return (
    <div className="space-y-5">
      <SectionCard title="Membros" description="Quem tem acesso a esta clínica e com qual papel.">
        {members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro ainda.</p>}
        <ul className="divide-y divide-border">
          {members.map((member) => (
            <li key={member.userId} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.active ? "outline" : "secondary"}>{ROLE_LABEL[member.role] ?? member.role}</Badge>
                {!member.active && <Badge variant="secondary">inativo</Badge>}
                {member.active && (
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => void deactivate(member.userId)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Revogar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Convidar membro" description="O convite gera um link único com validade de 7 dias, limitado aos assentos da assinatura, e o envia diretamente ao e-mail do convidado.">
        <form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="equipe-email">E-mail do convidado</Label>
            <Input id="equipe-email" type="email" required maxLength={254} value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="pessoa@dominio.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="equipe-papel">Papel</Label>
            <select
              id="equipe-papel"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="professional">Profissional</option>
              <option value="clinic_admin">Administrador(a)</option>
              <option value="assistant">Assistente</option>
              <option value="financial">Financeiro</option>
              <option value="owner">Proprietário(a)</option>
            </select>
          </div>
          <Button type="submit" disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Mail className="h-4 w-4" aria-hidden="true" />}
            Convidar
          </Button>
        </form>
        {pending.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Convites pendentes</p>
            <ul className="mt-2 divide-y divide-border">
              {pending.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm text-foreground">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABEL[invitation.role] ?? invitation.role} · expira {new Date(invitation.expires_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => void revoke(invitation.id)}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Revogar
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
      </SectionCard>
    </div>
  );
}

function PlanoSection({ clinicId }: { clinicId: string }) {
  const [snapshot, setSnapshot] = useState<BillingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void authFetch(`/api/billing/me?clinicId=${encodeURIComponent(clinicId)}`)
      .then((response) => readJson<BillingSnapshot>(response))
      .then((body) => !cancelled && setSnapshot(body))
      .catch((loadError: Error) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  async function startCheckout() {
    if (!snapshot) return;
    setCheckoutBusy(true);
    setCheckoutError(null);
    const seats = Math.max(snapshot.seats.contracted ?? 2, snapshot.seats.activeMembers ?? 1);
    try {
      const body = await readJson<{ url?: string }>(
        await authFetch("/api/billing/checkout", { method: "POST", body: JSON.stringify({ clinicId, seats }) }),
      );
      if (body.url) window.open(body.url, "_blank", "noopener,noreferrer");
      else setCheckoutError("O provedor de pagamento não retornou o link de checkout.");
    } catch (checkoutFailure) {
      const message = checkoutFailure instanceof Error ? checkoutFailure.message : "Falha ao iniciar o checkout.";
      setCheckoutError(
        /provider|503|indispon/i.test(message)
          ? "O gateway de pagamento ainda não está configurado nesta instalação. Fale com o suporte para ativar a assinatura."
          : message,
      );
    } finally {
      setCheckoutBusy(false);
    }
  }

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!snapshot) return <p className="text-sm text-muted-foreground" role="status">Carregando plano…</p>;

  const { entitlement, seats } = snapshot;
  const statusLabel = entitlement.trialActive
    ? `Avaliação — ${entitlement.trialDaysRemaining} dia(s) restante(s)`
    : entitlement.subscriptionStatus === "active"
      ? "Assinatura ativa"
      : entitlement.isPastDue
        ? "Pagamento pendente"
        : entitlement.isSuspended
          ? "Assinatura suspensa"
          : "Sem assinatura ativa";

  return (
    <SectionCard title="Plano e assinatura" description="Estado real da assinatura desta clínica — o mesmo que o servidor aplica.">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Situação</p>
          <p className="mt-1 text-sm font-bold text-foreground">{statusLabel}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Plano</p>
          <p className="mt-1 text-sm font-bold text-foreground">{entitlement.planId ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Assentos</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {seats.activeMembers ?? "—"} de {seats.contracted ?? "—"} em uso
          </p>
        </div>
      </div>
      {!entitlement.isActive && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
          Sem assinatura vigente, as áreas clínicas ficam bloqueadas (a exportação LGPD permanece disponível). Ative a assinatura para continuar.
        </p>
      )}
      <Button onClick={() => void startCheckout()} disabled={checkoutBusy} className="gap-2">
        {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
        {entitlement.subscriptionStatus === "active" ? "Gerenciar assentos" : "Assinar / regularizar"}
      </Button>
      {checkoutError && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{checkoutError}</p>}
    </SectionCard>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { activeClinicId, clinics } = useClinic();
  const [section, setSection] = useState<SectionId>(initialSectionFromLocation);

  const activeClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === activeClinicId) ?? null,
    [clinics, activeClinicId],
  );

  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6 sm:px-6" data-testid="configuracoes-shell">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" aria-hidden="true" />Configurações</div>
        <h1 className="text-2xl font-semibold tracking-tight">Sua conta e sua clínica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeClinic ? `Clínica ativa: ${activeClinic.name}` : "Nenhuma clínica ativa — crie ou selecione uma clínica."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-2" role="tablist" aria-label="Seções de configurações">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${section === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {section === "perfil" && <PerfilSection />}
      {section !== "perfil" && !activeClinicId && (
        <SectionCard title="Nenhuma clínica ativa" description="Crie sua clínica para gerenciar equipe, dados institucionais e assinatura.">
          <a href="#/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <Building2 className="h-4 w-4" aria-hidden="true" /> Criar clínica agora
          </a>
        </SectionCard>
      )}
      {section === "clinica" && activeClinicId && <ClinicaSection clinicId={activeClinicId} />}
      {section === "equipe" && activeClinicId && <EquipeSection clinicId={activeClinicId} />}
      {section === "plano" && activeClinicId && <PlanoSection clinicId={activeClinicId} />}
    </div>
  );
}

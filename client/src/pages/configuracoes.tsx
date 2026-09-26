import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  CreditCard,
  Loader2,
  Mail,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Trash2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { invalidateIssuerCache } from "@/lib/issuer";
import { useToast } from "@/hooks/use-toast";
import TenantMetricsPanel from "@/components/TenantMetricsPanel";
import type { TenantPermission } from "../../../shared/permissions";
import type { ClinicFeatureState } from "../../../shared/clinicFeatures";

type SectionId = "perfil" | "clinica" | "equipe" | "plano" | "atividade" | "auditoria" | "recursos";

/**
 * Cada seção declara a permissão do catálogo (`shared/permissions.ts`) que a
 * torna visível. A lista efetiva vem do servidor em `GET /api/tenants/:id`
 * (`permissions`), já com o status da clínica aplicado — a tela nunca compara
 * nome de papel nem confia em um booleano derivado. Seção sem `requires` é
 * visível a qualquer membro ativo.
 */
const SECTIONS: Array<{ id: SectionId; label: string; icon: typeof Building2; requires?: TenantPermission }> = [
  { id: "perfil", label: "Perfil", icon: Stethoscope },
  { id: "clinica", label: "Clínica", icon: Building2 },
  { id: "equipe", label: "Equipe", icon: UsersRound, requires: "team.manage" },
  { id: "plano", label: "Plano", icon: CreditCard, requires: "billing.manage" },
  { id: "atividade", label: "Atividade", icon: ShieldCheck, requires: "organization.metrics.read" },
  { id: "auditoria", label: "Auditoria", icon: ScrollText, requires: "audit.read" },
  { id: "recursos", label: "Recursos", icon: SlidersHorizontal },
];

function hasPermission(permissions: readonly TenantPermission[] | null, permission: TenantPermission): boolean {
  return permissions !== null && permissions.includes(permission);
}

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
  /** Permissões efetivas calculadas no servidor (vazio com clínica inativa). */
  permissions: TenantPermission[];
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

interface TenantAuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actorUserId: string;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface TenantAuditPage {
  data: TenantAuditEntry[];
  total: number;
  page: number;
  limit: number;
}

const AUDIT_ACTION_LABEL: Record<string, string> = {
  clinic_update: "Dados da clínica alterados",
  clinic_membership_upsert: "Membro adicionado ou papel alterado",
  clinic_membership_deactivate: "Acesso de membro revogado",
  remote_intake_invite_create: "Convite de pré-consulta remota criado",
  remote_intake_invite_revoke: "Convite de pré-consulta remota revogado",
  remote_intake_accept: "Pré-consulta remota aceita",
  remote_intake_reject: "Pré-consulta remota rejeitada",
  remote_scale_invite_create: "Convite de questionário remoto criado",
  remote_scale_invite_revoke: "Convite de questionário remoto revogado",
  remote_scale_response_review: "Questionário remoto revisado",
  live_patient_create: "Paciente cadastrado",
  live_patient_update: "Paciente atualizado",
  live_patient_archive: "Paciente arquivado",
  live_clinical_event_create: "Evento clínico registrado",
  live_assessment_create: "Avaliação registrada",
  live_retention_policy_upsert: "Política de retenção alterada",
  lgpd_export_executed: "Exportação LGPD executada",
  lgpd_deletion_executed: "Eliminação LGPD executada",
};

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || `Falha (${response.status})`);
  return body;
}

function normalizeTenantDetail(detail: TenantDetail): TenantDetail {
  // Resposta antiga (sem `permissions`) ou malformada vira "sem permissão":
  // a ausência da lista nunca pode ser lida como acesso.
  return { ...detail, permissions: Array.isArray(detail.permissions) ? detail.permissions : [] };
}

function useTenantDetail(clinicId: string | null) {
  const [detail, setDetail] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(clinicId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!clinicId) {
      setDetail(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void authFetch(`/api/tenants/${clinicId}`)
      .then((response) => readJson<TenantDetail>(response))
      .then((body) => !cancelled && setDetail(normalizeTenantDetail(body)))
      .catch((loadError: Error) => !cancelled && setError(loadError.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [clinicId]);
  useEffect(load, [load]);

  const apply = useCallback((next: TenantDetail) => setDetail(normalizeTenantDetail(next)), []);
  return { detail, loading, error, reload: load, apply };
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

function ClinicaSection({
  clinicId,
  detail: loaded,
  loading,
  loadError,
  onSaved,
}: {
  clinicId: string;
  detail: TenantDetail | null;
  loading: boolean;
  loadError: string | null;
  onSaved: (next: TenantDetail) => void;
}) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<TenantDetail | null>(loaded);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setDraft(loaded), [loaded]);
  const detail = draft;

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
      // PATCH devolve o detalhe sem `permissions`; a lista efetiva continua a
      // do GET, para a tela não perder ou ganhar abas ao salvar.
      onSaved({ ...updated, permissions: loaded?.permissions ?? [] });
      invalidateIssuerCache();
      toast({ title: "Clínica atualizada ✓" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !detail) return <p className="text-sm text-muted-foreground" role="status">Carregando clínica…</p>;
  if (!detail) return <p role="alert" className="text-sm text-destructive">{loadError ?? "Clínica indisponível."}</p>;

  const readOnly = !hasPermission(detail.permissions, "organization.manage");
  const set = (patch: Partial<TenantDetail>) => setDraft({ ...detail, ...patch });
  const setSettings = (patch: Partial<TenantDetail["settings"]>) => setDraft({ ...detail, settings: { ...detail.settings, ...patch } });

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

// A tela decide edição por `permissions` (organization.manage); o booleano
// que a API também devolve não é lido aqui de propósito.
interface ClinicFeaturesPayload {
  clinicId: string;
  features: ClinicFeatureState[];
}

function RecursosSection({ clinicId, permissions }: { clinicId: string; permissions: TenantPermission[] | null }) {
  const { toast } = useToast();
  const [payload, setPayload] = useState<ClinicFeaturesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const editable = hasPermission(permissions, "organization.manage");

  useEffect(() => {
    let cancelled = false;
    void authFetch(`/api/tenants/${clinicId}/features`)
      .then((response) => readJson<ClinicFeaturesPayload>(response))
      .then((body) => !cancelled && setPayload(body))
      .catch((loadError: Error) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  async function toggle(feature: ClinicFeatureState, enabled: boolean) {
    setBusyKey(feature.key);
    setError(null);
    try {
      const updated = await readJson<ClinicFeaturesPayload>(
        await authFetch(`/api/tenants/${clinicId}/features`, {
          method: "PATCH",
          body: JSON.stringify({ features: { [feature.key]: enabled } }),
        }),
      );
      setPayload(updated);
      toast({ title: enabled ? `${feature.label} ligado ✓` : `${feature.label} desligado`, description: "A mudança ficou registrada na auditoria da clínica." });
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Falha ao alterar o recurso.");
    } finally {
      setBusyKey(null);
    }
  }

  if (error && !payload) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!payload) return <p className="text-sm text-muted-foreground" role="status">Carregando recursos…</p>;

  return (
    <SectionCard
      title="Recursos da clínica"
      description={editable
        ? "O que esta clínica mantém ligado, dentro do que o plano concede. Desligar um recurso vale na hora para toda a equipe."
        : "O que esta clínica mantém ligado. Somente proprietário(a) e administrador(a) alteram."}
    >
      <ul className="divide-y divide-border">
        {payload.features.map((feature) => (
          <li key={feature.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{feature.label}</p>
              <p className="text-xs leading-5 text-muted-foreground">{feature.description}</p>
              {feature.source === "default" && <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">Padrão do produto</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{feature.enabled ? "Ligado" : "Desligado"}</span>
              <Switch
                aria-label={`${feature.label}: ${feature.enabled ? "ligado" : "desligado"}`}
                checked={feature.enabled}
                disabled={!editable || busyKey !== null}
                onCheckedChange={(next) => void toggle(feature, next)}
              />
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{error}</p>}
    </SectionCard>
  );
}

function AuditoriaSection({ clinicId }: { clinicId: string }) {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [appliedAction, setAppliedAction] = useState("");
  const [result, setResult] = useState<TenantAuditPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (appliedAction) params.set("action", appliedAction);
    void authFetch(`/api/tenants/${clinicId}/audit?${params.toString()}`)
      .then((response) => readJson<TenantAuditPage>(response))
      .then((body) => !cancelled && setResult(body))
      .catch((loadError: Error) => !cancelled && setError(loadError.message));
    return () => {
      cancelled = true;
    };
  }, [clinicId, page, appliedAction]);

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedAction(actionFilter.trim());
  }

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!result) return <p className="text-sm text-muted-foreground" role="status">Carregando auditoria…</p>;

  const lastPage = Math.max(1, Math.ceil(result.total / result.limit));

  return (
    <SectionCard
      title="Auditoria da clínica"
      description="Quem fez o quê e quando nesta clínica. São metadados de operação — nunca conteúdo clínico — e a mesma trilha que o servidor grava a cada ação."
    >
      <form onSubmit={applyFilter} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="auditoria-acao">Filtrar por ação</Label>
          <Input id="auditoria-acao" maxLength={160} placeholder="Ex.: membership, intake, lgpd" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} />
        </div>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>
      {result.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro para este filtro.</p>}
      <ul className="divide-y divide-border">
        {result.data.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{AUDIT_ACTION_LABEL[entry.action] ?? entry.action}</p>
              <p className="text-xs text-muted-foreground">
                {entry.actorName ?? "Conta removida"} · {entry.targetType}
                {entry.targetId ? ` · ${entry.targetId}` : ""}
              </p>
            </div>
            <time dateTime={entry.createdAt} className="text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleString("pt-BR")}
            </time>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{result.total} registro(s) · página {result.page} de {lastPage}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
          <Button size="sm" variant="ghost" disabled={page >= lastPage} onClick={() => setPage((current) => current + 1)}>Próxima</Button>
        </div>
      </div>
    </SectionCard>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { activeClinicId, clinics } = useClinic();
  const [section, setSection] = useState<SectionId>(initialSectionFromLocation);
  const tenant = useTenantDetail(activeClinicId);

  const activeClinic = useMemo(
    () => clinics.find((clinic) => clinic.id === activeClinicId) ?? null,
    [clinics, activeClinicId],
  );

  // Enquanto a lista não chegou, só as seções sem exigência aparecem; uma
  // seção restrita nunca é mostrada "por enquanto" à espera da resposta.
  const permissions: TenantPermission[] | null = tenant.detail?.permissions ?? null;
  const visibleSections = useMemo(
    () => SECTIONS.filter((entry) => !entry.requires || hasPermission(permissions, entry.requires)),
    [permissions],
  );

  // Link profundo (`?secao=plano`) para uma seção que este membro não tem
  // permissão de ver cai em "Perfil" assim que a lista chega.
  useEffect(() => {
    if (tenant.loading) return;
    if (!visibleSections.some((entry) => entry.id === section)) setSection("perfil");
  }, [section, tenant.loading, visibleSections]);

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
        {visibleSections.map(({ id, label, icon: Icon }) => (
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
      {section === "clinica" && activeClinicId && (
        <ClinicaSection
          clinicId={activeClinicId}
          detail={tenant.detail}
          loading={tenant.loading}
          loadError={tenant.error}
          onSaved={tenant.apply}
        />
      )}
      {section === "equipe" && activeClinicId && hasPermission(permissions, "team.manage") && <EquipeSection clinicId={activeClinicId} />}
      {section === "plano" && activeClinicId && hasPermission(permissions, "billing.manage") && <PlanoSection clinicId={activeClinicId} />}
      {section === "atividade" && activeClinicId && hasPermission(permissions, "organization.metrics.read") && <TenantMetricsPanel key={activeClinicId} />}
      {section === "auditoria" && activeClinicId && hasPermission(permissions, "audit.read") && <AuditoriaSection key={activeClinicId} clinicId={activeClinicId} />}
      {section === "recursos" && activeClinicId && <RecursosSection key={activeClinicId} clinicId={activeClinicId} permissions={permissions} />}
    </div>
  );
}

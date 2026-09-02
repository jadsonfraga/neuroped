import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, CreditCard, FileText, Loader2, RefreshCw, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";

type MembershipRole = "owner" | "clinic_admin" | "professional" | "assistant" | "financial";

interface ClinicSettings {
  clinicId: string;
  name: string;
  legalName: string | null;
  timezone: string;
  specialty: string | null;
  institutionalIdentity: string | null;
  professionalDisplayName: string | null;
  professionalRegistry: string | null;
  documentPreferences?: {
    showLogo?: boolean;
    includeProfessionalRegistry?: boolean;
    defaultFooter?: string;
    defaultLanguage?: string;
  };
  brandPrimaryColor: string | null;
}

interface TeamMember {
  userId: string;
  name: string;
  email: string | null;
  role: MembershipRole;
  active: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: MembershipRole;
  status: string;
  expires_at?: string;
}

interface BillingSnapshot {
  membership: { clinicId: string; role: MembershipRole } | null;
  entitlement: {
    planId: string | null;
    subscriptionStatus: string | null;
    trialActive: boolean;
    trialEndsAt: string | null;
    isActive: boolean;
    isPastDue: boolean;
    isSuspended: boolean;
    deniedReason: string | null;
  };
}

const MANAGER_ROLES = new Set<MembershipRole>(["owner", "clinic_admin"]);
const INVITABLE_ROLES: Array<{ value: MembershipRole; label: string }> = [
  { value: "clinic_admin", label: "Admin" },
  { value: "professional", label: "Profissional" },
  { value: "assistant", label: "Assistente" },
  { value: "financial", label: "Financeiro" },
];

async function responseJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : `Operação falhou (${response.status})`);
  }
  return body as T;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function statusLabel(status: string | null | undefined): string {
  if (!status) return "sem assinatura";
  const labels: Record<string, string> = {
    trial: "trial",
    active: "ativa",
    past_due: "pagamento pendente",
    canceled: "cancelada",
    suspended: "suspensa",
  };
  return labels[status] ?? status;
}

export function SaaSOrganizationSettings() {
  const { user } = useAuth();
  const { activeClinic, activeClinicId } = useClinic();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [billing, setBilling] = useState<BillingSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MembershipRole>("professional");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const canManage = Boolean(activeClinic && MANAGER_ROLES.has(activeClinic.role));

  const encodedClinicId = useMemo(
    () => activeClinicId ? encodeURIComponent(activeClinicId) : "",
    [activeClinicId],
  );

  const load = useCallback(async () => {
    if (!activeClinicId) {
      setSettings(null);
      setMembers([]);
      setInvitations([]);
      setBilling(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const requests: Promise<unknown>[] = [
        authFetch(`/api/tenants/${encodedClinicId}/settings`).then((response) => responseJson<{ data: ClinicSettings }>(response)),
        authFetch(`/api/billing/me?scope=admin&clinicId=${encodedClinicId}`).then((response) => responseJson<BillingSnapshot>(response)),
      ];
      if (canManage) {
        requests.push(
          authFetch(`/api/tenants/${encodedClinicId}/members`).then((response) => responseJson<{ data: TeamMember[] }>(response)),
          authFetch(`/api/billing/invitations?clinicId=${encodedClinicId}`).then((response) => responseJson<{ data: Invitation[] }>(response)),
        );
      }
      const results = await Promise.all(requests);
      setSettings((results[0] as { data: ClinicSettings }).data);
      setBilling(results[1] as BillingSnapshot);
      if (canManage) {
        setMembers((results[2] as { data: TeamMember[] }).data ?? []);
        setInvitations((results[3] as { data: Invitation[] }).data ?? []);
      } else {
        setMembers([]);
        setInvitations([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as configurações SaaS.");
    } finally {
      setLoading(false);
    }
  }, [activeClinicId, canManage, encodedClinicId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings() {
    if (!activeClinicId || !settings || !canManage) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await responseJson(
        await authFetch(`/api/tenants/${encodedClinicId}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            specialty: settings.specialty,
            institutionalIdentity: settings.institutionalIdentity,
            professionalDisplayName: settings.professionalDisplayName,
            professionalRegistry: settings.professionalRegistry,
            brandPrimaryColor: settings.brandPrimaryColor,
            documentPreferences: settings.documentPreferences ?? {},
          }),
        }),
      );
      setMessage("Configurações da clínica salvas.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function createInvitation() {
    if (!activeClinicId || !canManage || !inviteEmail.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    setLatestInviteUrl("");
    try {
      const body = await responseJson<{ invitationUrl?: string }>(
        await authFetch("/api/billing/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinicId: activeClinicId, email: inviteEmail.trim(), role: inviteRole }),
        }),
      );
      setLatestInviteUrl(body.invitationUrl ?? "");
      setInviteEmail("");
      setMessage("Convite criado e registrado com segurança.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o convite.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateMember(member: TeamMember) {
    if (!activeClinicId || !canManage || member.userId === user?.id) return;
    setSaving(true);
    setError("");
    try {
      await responseJson(
        await authFetch(`/api/tenants/${encodedClinicId}/members?userId=${encodeURIComponent(member.userId)}`, {
          method: "DELETE",
        }),
      );
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível revogar o acesso.");
    } finally {
      setSaving(false);
    }
  }

  if (!activeClinicId || !activeClinic) {
    return <p className="border-b border-card-border p-4 text-xs text-muted-foreground">Nenhuma clínica ativa selecionada.</p>;
  }

  return (
    <div className="border-b border-card-border p-4" data-testid="saas-organization-settings">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Configurações SaaS</p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">Perfil, clínica, equipe, documentos e plano usam a clínica ativa como fronteira.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" disabled={loading} onClick={() => void load()} aria-label="Atualizar configurações">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>

      {error && <p role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{error}</p>}
      {message && <p role="status" className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-2 text-xs text-muted-foreground">{message}</p>}

      <div className="space-y-4">
        <section className="rounded-xl border border-card-border p-3">
          <div className="mb-2 flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">Perfil e clínica</p></div>
          <p className="mb-3 text-[10px] text-muted-foreground">{user?.name ?? "Usuário"} · {activeClinic.name} · papel {activeClinic.role}</p>
          {settings && (
            <div className="space-y-2">
              <div><Label htmlFor="saas-specialty" className="text-[11px]">Especialidade</Label><Input id="saas-specialty" disabled={!canManage} value={settings.specialty ?? ""} onChange={(event) => setSettings({ ...settings, specialty: event.target.value })} /></div>
              <div><Label htmlFor="saas-identity" className="text-[11px]">Identidade institucional</Label><Input id="saas-identity" disabled={!canManage} value={settings.institutionalIdentity ?? ""} onChange={(event) => setSettings({ ...settings, institutionalIdentity: event.target.value })} /></div>
              <div><Label htmlFor="saas-registry" className="text-[11px]">Registro profissional</Label><Input id="saas-registry" disabled={!canManage} value={settings.professionalRegistry ?? ""} onChange={(event) => setSettings({ ...settings, professionalRegistry: event.target.value })} /></div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-card-border p-3">
          <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">Documentos</p></div>
          {settings && (
            <>
              <label className="flex items-center gap-2 py-1 text-[11px]"><input type="checkbox" disabled={!canManage} checked={settings.documentPreferences?.showLogo ?? true} onChange={(event) => setSettings({ ...settings, documentPreferences: { ...settings.documentPreferences, showLogo: event.target.checked } })} /> Exibir logo institucional</label>
              <label className="flex items-center gap-2 py-1 text-[11px]"><input type="checkbox" disabled={!canManage} checked={settings.documentPreferences?.includeProfessionalRegistry ?? true} onChange={(event) => setSettings({ ...settings, documentPreferences: { ...settings.documentPreferences, includeProfessionalRegistry: event.target.checked } })} /> Incluir registro profissional</label>
              <div className="mt-2"><Label htmlFor="saas-footer" className="text-[11px]">Rodapé padrão</Label><Input id="saas-footer" disabled={!canManage} value={settings.documentPreferences?.defaultFooter ?? ""} onChange={(event) => setSettings({ ...settings, documentPreferences: { ...settings.documentPreferences, defaultFooter: event.target.value } })} /></div>
              {canManage && <Button type="button" size="sm" className="mt-3 w-full" disabled={saving || loading} onClick={() => void saveSettings()}>{saving ? "Salvando…" : "Salvar clínica e documentos"}</Button>}
            </>
          )}
        </section>

        {canManage && (
          <section className="rounded-xl border border-card-border p-3">
            <div className="mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">Equipe</p></div>
            <div className="space-y-2">
              {members.filter((member) => member.active).map((member) => (
                <div key={member.userId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 p-2">
                  <div className="min-w-0"><p className="truncate text-[11px] font-medium">{member.name}</p><p className="truncate text-[10px] text-muted-foreground">{member.email ?? "sem e-mail"} · {member.role}</p></div>
                  {member.userId !== user?.id && <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => void deactivateMember(member)}>Revogar</Button>}
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
              <Label htmlFor="invite-email" className="text-[11px]">Convidar membro</Label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="profissional@dominio.com" />
              <select className="h-9 rounded-md border border-input bg-background px-3 text-xs" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as MembershipRole)}>
                {INVITABLE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <Button type="button" size="sm" disabled={saving || !inviteEmail.trim()} onClick={() => void createInvitation()}><UserPlus className="mr-2 h-4 w-4" />Criar convite</Button>
              {latestInviteUrl && <div className="rounded-lg border border-primary/20 bg-primary/5 p-2"><p className="mb-1 text-[10px] text-muted-foreground">Link de convite</p><Input readOnly value={latestInviteUrl} onFocus={(event) => event.currentTarget.select()} /></div>}
              {invitations.some((invite) => invite.status === "pending") && <p className="text-[10px] text-muted-foreground">Pendentes: {invitations.filter((invite) => invite.status === "pending").map((invite) => `${invite.email} (${invite.role}, até ${formatDate(invite.expires_at)})`).join(" · ")}</p>}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-card-border p-3">
          <div className="mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><p className="text-xs font-semibold">Plano e cobrança</p></div>
          {billing ? (
            <div className="text-[11px] leading-relaxed text-muted-foreground">
              <p><strong className="text-foreground">Plano:</strong> {billing.entitlement.planId ?? "não definido"}</p>
              <p><strong className="text-foreground">Status:</strong> {statusLabel(billing.entitlement.subscriptionStatus)}</p>
              {billing.entitlement.trialEndsAt && <p><strong className="text-foreground">Trial até:</strong> {formatDate(billing.entitlement.trialEndsAt)}</p>}
              {billing.entitlement.deniedReason && <p className="mt-1 text-destructive">Acesso condicionado: {billing.entitlement.deniedReason}</p>}
            </div>
          ) : <p className="text-[11px] text-muted-foreground">Estado do plano indisponível.</p>}
        </section>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { apiRequest } from "@/lib/queryClient";
import { authFetch } from "@/lib/authClient";
import {
  Building2,
  Check,
  Copy,
  CreditCard,
  Info,
  Loader2,
  Mail,
  RefreshCw,
  Rocket,
  Trash2,
  Users,
} from "lucide-react";
import { canManageClinic, type ClinicMembershipRole } from "@shared/tenant";

/**
 * Minha Clínica & Equipe — onboarding self-service do funil SaaS.
 *
 * Contratos honrados:
 *   POST   /api/tenants {name, legalName?, timezone?}            → cria clínica (owner)
 *   GET    /api/billing/invitations?clinicId=…                    → lista convites
 *   POST   /api/billing/invitations {clinicId, email, role}       → convida (retorna invitationUrl)
 *   POST   /api/billing/invitations {clinicId, action:"resend", invitationId}
 *   DELETE /api/billing/invitations?clinicId=…&invitationId=…     → revoga
 *
 * Rota clínica (fora da allowlist pública): exige sessão remota com papel
 * admin/professional; a gestão de convites exige ainda owner/clinic_admin
 * no backend.
 */

const INVITE_ROLES: { value: ClinicMembershipRole; label: string }[] = [
  { value: "professional", label: "Profissional" },
  { value: "assistant", label: "Assistente" },
  { value: "financial", label: "Financeiro" },
  { value: "clinic_admin", label: "Administração da clínica" },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Responsável (owner)",
  clinic_admin: "Administração",
  professional: "Profissional",
  assistant: "Assistente",
  financial: "Financeiro",
};

const INVITE_STATUS: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pendente",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  accepted: {
    label: "Aceito",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  revoked: {
    label: "Revogado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  },
  expired: {
    label: "Expirado",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
};

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string | null;
  created_at: string;
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

async function readError(error: unknown): Promise<{ status?: number; message: string }> {
  const status = (error as { status?: number }).status;
  const raw = (error as { message?: string }).message ?? "";
  // apiRequest lança "STATUS: corpo" — o corpo costuma ser JSON {error, code}.
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const body = JSON.parse(raw.slice(jsonStart)) as { error?: string };
      if (body.error) return { status, message: body.error };
    } catch {
      // corpo não-JSON: mantém mensagem genérica abaixo
    }
  }
  return { status, message: "Não foi possível concluir a operação. Tente novamente." };
}

function CreateClinicCard({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const createClinic = async () => {
    setError(null);
    if (name.trim().length < 2) {
      setError("Informe o nome da clínica.");
      return;
    }
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/tenants", {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
      });
      await onCreated();
    } catch (err) {
      const parsed = await readError(err);
      setError(
        parsed.status === 409
          ? "Já existe uma clínica com este identificador. Tente outro nome."
          : parsed.message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-4 h-4 text-primary" /> Crie a sua clínica
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          A clínica nasce isolada, com você como responsável. Depois, convide a equipe e
          gerencie o plano em Planos &amp; Assinatura.
        </p>
        <label className="block text-sm">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">
            Nome da clínica *
          </span>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={160}
            placeholder="Ex.: Clínica Desenvolvimento Infantil"
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">
            Razão social (opcional)
          </span>
          <Input
            value={legalName}
            onChange={(event) => setLegalName(event.target.value)}
            maxLength={200}
            placeholder="Ex.: Desenvolvimento Infantil LTDA"
          />
        </label>
        <Button onClick={createClinic} disabled={isSaving} className="gap-1.5">
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Building2 className="w-4 h-4" />
          )}
          Criar clínica
        </Button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}

function InvitationsCard({ clinicId }: { clinicId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ClinicMembershipRole>("professional");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const invitationsQuery = useQuery<{ data: InvitationRow[] }>({
    queryKey: ["clinic-invitations", clinicId],
    queryFn: async () => {
      const res = await authFetch(
        `/api/billing/invitations?clinicId=${encodeURIComponent(clinicId)}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw Object.assign(new Error(body?.error ?? `Erro ${res.status}`), {
          status: res.status,
        });
      }
      return res.json();
    },
    retry: false,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["clinic-invitations", clinicId] });

  const runInvitationAction = async (payload: Record<string, unknown>) => {
    setFeedback(null);
    setInviteUrl(null);
    setCopied(false);
    setIsWorking(true);
    try {
      const res = await apiRequest("POST", "/api/billing/invitations", {
        clinicId,
        ...payload,
      });
      const data = (await res.json()) as { invitationUrl?: string; email?: string };
      if (data.invitationUrl) {
        setInviteUrl(data.invitationUrl);
        setFeedback(
          `Convite pronto para ${data.email ?? "o e-mail informado"}. Compartilhe o link com segurança.`,
        );
      }
      setEmail("");
      await refresh();
    } catch (err) {
      const parsed = await readError(err);
      if (parsed.status === 409) {
        setFeedback(parsed.message);
      } else if (parsed.status === 403) {
        setFeedback("Apenas gestores (owner ou administração) gerenciam convites.");
      } else {
        setFeedback(parsed.message);
      }
    } finally {
      setIsWorking(false);
    }
  };

  const revoke = async (invitationId: string) => {
    setFeedback(null);
    setIsWorking(true);
    try {
      await apiRequest(
        "DELETE",
        `/api/billing/invitations?clinicId=${encodeURIComponent(clinicId)}&invitationId=${encodeURIComponent(invitationId)}`,
      );
      await refresh();
    } catch (err) {
      setFeedback((await readError(err)).message);
    } finally {
      setIsWorking(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Convites da equipe
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 pt-2 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm grow min-w-56">
            <span className="block text-xs font-semibold text-muted-foreground mb-1">
              E-mail do novo membro
            </span>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={320}
              placeholder="nome@clinica.com.br"
            />
          </label>
          <label className="text-sm">
            <span className="block text-xs font-semibold text-muted-foreground mb-1">
              Papel
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as ClinicMembershipRole)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {INVITE_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            onClick={() => runInvitationAction({ email: email.trim(), role })}
            disabled={isWorking || !email.trim()}
            className="gap-1.5"
          >
            {isWorking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Convidar
          </Button>
        </div>

        {feedback && (
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" /> {feedback}
          </p>
        )}
        {inviteUrl && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
            <code className="text-xs break-all grow">{inviteUrl}</code>
            <Button size="sm" variant="outline" onClick={copyInviteUrl} className="gap-1.5">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar link"}
            </Button>
          </div>
        )}

        {invitationsQuery.isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando convites…
          </p>
        )}
        {invitationsQuery.isError && (
          <p className="text-sm text-muted-foreground">
            {(invitationsQuery.error as { status?: number }).status === 403
              ? "Apenas gestores (owner ou administração) visualizam os convites."
              : "Não foi possível carregar os convites agora."}
          </p>
        )}
        {invitationsQuery.data && invitationsQuery.data.data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum convite ainda. Convide o primeiro membro da equipe acima.
          </p>
        )}
        {invitationsQuery.data && invitationsQuery.data.data.length > 0 && (
          <ul className="space-y-2">
            {invitationsQuery.data.data.map((invitation) => {
              const status = INVITE_STATUS[invitation.status] ?? {
                label: invitation.status,
                className: "bg-muted text-muted-foreground",
              };
              return (
                <li
                  key={invitation.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3"
                >
                  <div className="grow min-w-48">
                    <p className="text-sm font-medium break-all">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[invitation.role] ?? invitation.role} · expira em{" "}
                      {fmtDate(invitation.expires_at)}
                    </p>
                  </div>
                  <Badge className={status.className}>{status.label}</Badge>
                  {invitation.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWorking}
                        onClick={() =>
                          runInvitationAction({
                            action: "resend",
                            invitationId: invitation.id,
                          })
                        }
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-4 h-4" /> Reenviar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWorking}
                        onClick={() => revoke(invitation.id)}
                        className="gap-1.5 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" /> Revogar
                      </Button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          Cada membro ativo ocupa um assento do plano. Se o limite for atingido, ajuste os
          assentos em{" "}
          <Link href="/planos" className="underline underline-offset-2">
            Planos &amp; Assinatura
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}

export default function MinhaClinicaPage() {
  const { isAuthenticated } = useAuth();
  const { clinics, activeClinic, isLoading, reloadClinics } = useClinic();

  return (
    <div className="space-y-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-chart-2/10 to-transparent border border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Minha Clínica &amp; Equipe
          </span>
        </div>
        <h1 className="text-2xl font-bold">Sua clínica no NeuroPed</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Crie a clínica, convide a equipe com papéis definidos e acompanhe os convites —
          o plano por assento é gerenciado em Planos &amp; Assinatura.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/planos">
            <Button size="sm" variant="outline" className="gap-1.5">
              <CreditCard className="w-4 h-4" /> Planos &amp; Assinatura
            </Button>
          </Link>
        </div>
      </div>

      {!isAuthenticated && (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            A gestão da clínica acontece na versão conectada do NeuroPed. Faça login para
            continuar.
          </CardContent>
        </Card>
      )}

      {isAuthenticated && isLoading && (
        <Card>
          <CardContent className="p-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando as suas clínicas…
          </CardContent>
        </Card>
      )}

      {isAuthenticated && !isLoading && clinics.length === 0 && (
        <CreateClinicCard onCreated={reloadClinics} />
      )}

      {isAuthenticated && !isLoading && activeClinic && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> {activeClinic.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-2 text-sm text-muted-foreground">
              Seu papel:{" "}
              <strong className="text-foreground">
                {ROLE_LABELS[activeClinic.role] ?? activeClinic.role}
              </strong>
              {" · "}Fuso horário: {activeClinic.timezone}
              {clinics.length > 1 &&
                " · Use o seletor de clínicas do topo para alternar entre clínicas."}
            </CardContent>
          </Card>

          {canManageClinic(activeClinic.role) ? (
            <InvitationsCard clinicId={activeClinic.id} />
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Os convites da equipe são gerenciados pelo responsável ou pela
                administração da clínica.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

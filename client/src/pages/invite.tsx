import { FormEvent, useMemo, useState } from "react";
import { KeyRound, Loader2, Mail, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authClient";

function tokenFromLocation(): string {
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const hashQuery = raw.includes("?") ? raw.slice(raw.indexOf("?") + 1) : "";
  const fromHash = new URLSearchParams(hashQuery).get("token")?.trim() ?? "";
  if (fromHash) return fromHash;
  // Compatibilidade com links antigos no formato de caminho (/invite?token=).
  return new URLSearchParams(window.location.search).get("token")?.trim() ?? "";
}

const ROLE_LABEL: Record<string, string> = {
  owner: "proprietário(a)",
  clinic_admin: "administrador(a)",
  professional: "profissional",
  assistant: "assistente/recepção",
  financial: "financeiro",
};

function readableAcceptError(status: number, body: { error?: string; code?: string }): string {
  const code = body.code ?? "";
  if (code === "INVITATION_EMAIL_MISMATCH") {
    return "Este convite foi emitido para outro e-mail. Saia desta conta e abra o link com a conta convidada.";
  }
  if (code === "INVITATION_EXPIRED") return "Este convite expirou. Peça um novo à clínica.";
  if (code === "SEAT_LIMIT_REACHED") return "A clínica está sem assentos disponíveis. Peça ao gestor para ampliar a assinatura.";
  if (code === "ACCOUNT_EXISTS_LOGIN_REQUIRED" || status === 409) {
    return body.error || "Este e-mail já possui conta. Entre primeiro e abra o link do convite novamente.";
  }
  if (status === 402) return "A assinatura da clínica não está ativa. Avise o gestor da clínica.";
  return body.error || "Não foi possível aceitar o convite.";
}

/**
 * Aceite de convite de clínica. Sem sessão, o formulário cria a conta junto do
 * aceite (o servidor valida o token do convite); com sessão, o aceite é da
 * própria conta logada — o servidor exige que o e-mail confira.
 */
export default function InvitePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const token = useMemo(tokenFromLocation, []);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{ clinicId: string; role: string; accountCreated: boolean } | null>(null);

  async function accept(payload: Record<string, unknown>) {
    setError(null);
    setSubmitting(true);
    try {
      const response = await authFetch("/api/billing/accept", {
        method: "POST",
        body: JSON.stringify({ token, ...payload }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(readableAcceptError(response.status, body as { error?: string; code?: string }));
        return;
      }
      const result = body as { clinicId: string; role: string; accountCreated: boolean };
      setAccepted(result);
      if (user) {
        try {
          sessionStorage.setItem("neuroped:active-clinic-id", result.clinicId);
        } catch {
          // O switcher permite escolher manualmente.
        }
        await refreshUser();
      }
    } catch {
      setError("Falha de conexão ao aceitar o convite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewAccountSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void accept({ name: name.trim(), password });
  }

  if (!token) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold text-foreground">Link de convite incompleto.</p>
        <p className="mt-2 text-sm text-muted-foreground">Abra exatamente o link recebido da clínica — ele contém um código de acesso único.</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Carregando…</span>
      </section>
    );
  }

  if (accepted) {
    return (
      <section className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
          <UsersRound className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Convite aceito ✓</h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Você entrou na clínica como {ROLE_LABEL[accepted.role] ?? accepted.role}.
          {accepted.accountCreated ? " Sua conta foi criada — entre com o e-mail convidado e a senha que você definiu." : ""}
        </p>
        <a
          href={accepted.accountCreated ? "#/login" : "#/"}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2 px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
          onClick={() => {
            if (!accepted.accountCreated) window.setTimeout(() => window.location.reload(), 50);
          }}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {accepted.accountCreated ? "Ir para o login" : "Entrar na clínica"}
        </a>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <UsersRound className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Convite para entrar numa clínica</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        {user
          ? `Você está conectado(a) como ${user.email}. O convite precisa ter sido emitido para este e-mail.`
          : "Se você ainda não tem conta no NeuroPed, crie a senha abaixo para aceitar o convite. Se já tem, entre primeiro e reabra o link."}
      </p>

      {user ? (
        <div className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6">
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          <Button onClick={() => void accept({})} disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Aceitando…" : "Aceitar convite com esta conta"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleNewAccountSubmit} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="invite-form">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Nome completo</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="invite-name" required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="pl-9" placeholder="Como você assina" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-password">Defina sua senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="invite-password" type="password" required minLength={10} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Mínimo 10 caracteres" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Aceitando…" : "Criar conta e aceitar convite"}
          </Button>
          <a href="#/login" className="flex items-center justify-center gap-2 text-xs font-semibold text-primary hover:underline">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Já tenho conta — entrar primeiro
          </a>
        </form>
      )}
    </section>
  );
}

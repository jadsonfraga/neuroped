import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { registerSelfService } from "@/lib/registrationClient";
import { PUBLIC_HOME } from "@/lib/publicRoutes";
import { MEDICAL_URL } from "@/lib/zone";

type ScreenMode = "login" | "register" | "clinic";

function readableLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|credenciais|inválid|invalid/i.test(message)) return "E-mail ou senha não conferem. Verifique os dados e tente novamente.";
  if (/429|rate|muitas tentativas/i.test(message)) return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
  if (/network|fetch|failed|backend|configur/i.test(message)) return "O servidor de autenticação não está disponível neste endereço. Tente novamente mais tarde.";
  return "Não foi possível iniciar a sessão. Verifique a conexão e tente novamente.";
}

function readableRegistrationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/existe|conflict/i.test(message)) return "Já existe uma conta para este e-mail. Entre com sua senha para continuar.";
  if (/12 caracteres|weak|senha/i.test(message)) return "Use uma senha com pelo menos 12 caracteres.";
  if (/429|muitas tentativas|rate/i.test(message)) return "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.";
  return message || "Não foi possível criar a conta.";
}

function readableClinicError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/slug|identificador.*uso|conflict/i.test(message)) return "Já existe uma clínica com esse identificador. Ajuste o nome e tente novamente.";
  if (/billing|entitlement|seat/i.test(message)) return "Não foi possível ativar o plano inicial da clínica. Nenhum dado clínico foi criado.";
  return message || "Não foi possível criar a clínica.";
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoading, remoteConfigured, user } = useAuth();
  const { reloadClinics } = useClinic();
  const [mode, setMode] = useState<ScreenMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [professionalRegistry, setProfessionalRegistry] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [institutionalIdentity, setInstitutionalIdentity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function hasClinicMembership(): Promise<boolean> {
    const response = await authFetch("/api/tenants");
    if (!response.ok) return true;
    const body = await response.json().catch(() => ({})) as { data?: unknown[] };
    return Array.isArray(body.data) && body.data.length > 0;
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      if (!(await hasClinicMembership())) {
        setMode("clinic");
        return;
      }
      setLocation("/");
    } catch (loginError) {
      setError(readableLoginError(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password !== passwordConfirmation) {
      setError("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      await registerSelfService({
        name: name.trim(),
        email: email.trim(),
        password,
        specialty: specialty.trim() || undefined,
        professionalRegistry: professionalRegistry.trim() || undefined,
      });
      await login(email.trim(), password);
      setMode("clinic");
    } catch (registrationError) {
      setError(readableRegistrationError(registrationError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authFetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clinicName.trim(),
          legalName: legalName.trim() || undefined,
          timezone: "America/Recife",
          settings: {
            specialty: specialty.trim() || undefined,
            institutionalIdentity: institutionalIdentity.trim() || undefined,
            professionalDisplayName: (user?.name || name).trim() || undefined,
            professionalRegistry: professionalRegistry.trim() || undefined,
            documentPreferences: {
              showLogo: true,
              includeProfessionalRegistry: true,
              defaultLanguage: "pt-BR",
            },
          },
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(typeof body?.error === "string" ? body.error : `Criação da clínica falhou (${response.status})`);
      }
      await reloadClinics();
      setLocation("/");
    } catch (clinicError) {
      setError(readableClinicError(clinicError));
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "login"
    ? "Entrar na área profissional"
    : mode === "register"
      ? "Criar conta profissional"
      : "Configurar sua clínica";
  const description = mode === "login"
    ? "Use sua conta profissional para acessar as ferramentas clínicas protegidas."
    : mode === "register"
      ? "Crie sua identidade de acesso. Os dados da sua clínica serão configurados no próximo passo."
      : "A clínica será seu tenant isolado. Pacientes, documentos, equipe e configurações ficarão vinculados a ela.";

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        {mode === "clinic"
          ? <Building2 className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
          : mode === "register"
            ? <UserPlus className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
            : <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />}
      </div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">{description}</p>

      {mode === "login" && (
        <form onSubmit={handleLogin} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="login-email">E-mail profissional</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="pl-9" placeholder="nome@dominio.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Senha</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9" placeholder="Sua senha" />
            </div>
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          {!isLoading && !remoteConfigured && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">A autenticação profissional não está configurada neste endereço público. Use a área médica protegida ou peça a configuração do backend antes de operar dados clínicos.</p>
          )}
          <Button type="submit" disabled={submitting || isLoading} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Entrando…" : "Entrar com segurança"}
          </Button>
          <button type="button" onClick={() => { setMode("register"); setError(null); }} className="w-full text-center text-sm font-semibold text-primary hover:underline">
            Criar uma conta profissional
          </button>
        </form>
      )}

      {mode === "register" && (
        <form onSubmit={handleRegister} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="register-form">
          <div className="space-y-2">
            <Label htmlFor="register-name">Nome profissional</Label>
            <Input id="register-name" required value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">E-mail</Label>
            <Input id="register-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="nome@dominio.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-specialty">Especialidade <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <div className="relative">
              <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input id="register-specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="pl-9" placeholder="Ex.: Neuropediatria" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-registry">Registro profissional <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="register-registry" value={professionalRegistry} onChange={(event) => setProfessionalRegistry(event.target.value)} placeholder="Ex.: CRM / CRP / CREFITO" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Senha</Label>
            <Input id="register-password" type="password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Mínimo de 12 caracteres" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password-confirmation">Confirmar senha</Label>
            <Input id="register-password-confirmation" type="password" minLength={12} required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} autoComplete="new-password" />
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          <Button type="submit" disabled={submitting || isLoading} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Criando conta…" : "Criar conta e continuar"}
          </Button>
          <button type="button" onClick={() => { setMode("login"); setError(null); }} className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
            Já tenho conta
          </button>
        </form>
      )}

      {mode === "clinic" && (
        <form onSubmit={handleClinic} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="clinic-onboarding-form">
          <div className="space-y-2">
            <Label htmlFor="clinic-name">Nome da clínica / organização</Label>
            <Input id="clinic-name" required minLength={2} value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Ex.: Clínica Neurodesenvolvimento" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-legal-name">Razão social <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="clinic-legal-name" value={legalName} onChange={(event) => setLegalName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-specialty">Especialidade principal <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="clinic-specialty" value={specialty} onChange={(event) => setSpecialty(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-identity">Identidade institucional <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="clinic-identity" value={institutionalIdentity} onChange={(event) => setInstitutionalIdentity(event.target.value)} placeholder="Nome/marca exibida nos documentos" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinic-registry">Registro profissional <span className="font-normal text-muted-foreground">(opcional)</span></Label>
            <Input id="clinic-registry" value={professionalRegistry} onChange={(event) => setProfessionalRegistry(event.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
          <p className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3 text-xs leading-relaxed text-muted-foreground">
            A clínica será criada com você como <strong className="text-foreground">owner</strong> e com o plano inicial definido pelo backend. O isolamento entre clínicas é aplicado no servidor e no banco.
          </p>
          <Button type="submit" disabled={submitting} className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
            {submitting ? "Configurando clínica…" : "Criar clínica e entrar"}
          </Button>
        </form>
      )}

      {mode !== "clinic" && (
        <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
          <a href={`#${PUBLIC_HOME}`} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ir para o conteúdo das famílias
          </a>
          {MEDICAL_URL && (
            <a href={MEDICAL_URL} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir área médica protegida
            </a>
          )}
        </div>
      )}
    </section>
  );
}

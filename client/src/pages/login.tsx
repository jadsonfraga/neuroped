import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { SafeAssetImage, brandAssets } from "@/components/BrandAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { PUBLIC_HOME } from "@/lib/publicRoutes";
import { MEDICAL_URL } from "@/lib/zone";

/**
 * Destino pós-login pedido pelo RouteGuard (`/login?next=...`).
 *
 * O parâmetro só pode devolver o profissional a uma rota interna: qualquer valor
 * absoluto, protocolo-relativo ou com esquema é descartado, para que um link
 * externo nunca use a tela de login como trampolim de redirecionamento.
 */
function safeNextRoute(): string | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  const candidate = raw.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return null;
  if (/[:\\]/.test(candidate)) return null;
  if (candidate === "/login") return null;
  return candidate;
}

/** Remove o `next` já consumido para não contaminar as próximas navegações. */
function clearNextParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has("next")) return;
  url.searchParams.delete("next");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function readableLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/401|credenciais|inválid|invalid/i.test(message)) return "E-mail ou senha não conferem. Verifique os dados e tente novamente.";
  if (/429|rate|muitas tentativas/i.test(message)) return "Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.";
  if (/network|fetch|failed|backend|configur/i.test(message)) return "O servidor de autenticação não está disponível neste endereço. Abra a área médica protegida ou tente novamente mais tarde.";
  return "Não foi possível iniciar a sessão. Verifique a conexão e tente novamente.";
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login, isLoading, isAuthenticated, remoteConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A saída da tela de login é reativa ao estado de sessão, não à conclusão da
  // chamada. Navegar dentro do `handleSubmit` trocava a rota antes de o
  // AuthProvider ter comitado o usuário: o RouteGuard reavaliava a rota clínica
  // como anônima e devolvia para `/login?next=...` — a sessão ficava válida e o
  // profissional preso no formulário. Reagir a `isAuthenticated` elimina a
  // corrida em qualquer ordem de commit.
  useEffect(() => {
    if (!isAuthenticated) return;
    const destination = safeNextRoute() ?? "/";
    clearNextParam();
    setLocation(destination);
  }, [isAuthenticated, setLocation]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (loginError) {
      setError(readableLoginError(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="np-signature-login" data-testid="signature-login">
      <aside className="np-signature-login__brand" aria-label="NeuroPed SDG">
        <div className="np-signature-login__wordmark">
          <SafeAssetImage src={brandAssets.masterShieldFile} alt="" className="np-signature-login__shield" />
          <div><p>NeuroPed</p><span>NEUROPED SDG · SOLI DEO GLORIA</span></div>
        </div>
        <figure className="np-signature-login__portrait">
          <SafeAssetImage src={brandAssets.photography.retratoInstitucional}
            alt="Retrato institucional do Dr. Jadson Fraga" className="np-signature-login__photo" priority />
          <figcaption>
            <strong>Dr. Jadson Fraga</strong>
            <span>Neuropediatra · CRM-PE 25227 · RQE 17756</span>
          </figcaption>
        </figure>
        <div className="np-signature-login__message">
          <h2>Ciência e cuidado.<br />Clareza em cada decisão.</h2>
          <p>Pacientes, avaliações e documentos em um só lugar.</p>
          <span>Um espaço profissional. Cada criança, uma história.</span>
        </div>
      </aside>

      <div className="np-signature-login__access flex w-full flex-col items-center justify-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <p className="np-signature-eyebrow">SEU CONSULTÓRIO, ORGANIZADO</p>
      <h1 className="text-xl font-bold text-foreground">Entrar na área profissional</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Entre para continuar seus atendimentos, avaliações e documentos.
      </p>

      <form onSubmit={handleSubmit} className="np-signature-login__form mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="login-form">
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
            {showPassword ? (
              <Input id="login-password" name="password" type="text" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9 pr-12" placeholder="Sua senha" />
            ) : (
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pl-9 pr-12" placeholder="Sua senha" />
            )}
            <button type="button" className="np-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar caracteres" : "Exibir caracteres"} aria-controls="login-password" aria-pressed={showPassword} data-testid="toggle-password">
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive">{error}</p>}
        {!isLoading && !remoteConfigured && (
          <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">A autenticação profissional não está configurada neste endereço público. Use a área médica protegida ou peça a configuração do backend antes de operar dados clínicos.</p>
        )}
        <Button type="submit" disabled={submitting || isLoading} className="np-signature-submit w-full gap-2 rounded-xl">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
          {submitting ? "Entrando…" : "Entrar com segurança"}
        </Button>
      </form>

      <div className="np-signature-login__links mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
        <a href="#/esqueci-senha" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="forgot-password-link">
          <KeyRound className="h-4 w-4" aria-hidden="true" /> Esqueci minha senha
        </a>
        <a href="#/cadastro" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
          Criar conta profissional
        </a>
        {/* Quem chegou aqui sem conhecer o produto precisa de um caminho que
            não comece pedindo senha. */}
        <a href="#/planos" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline" data-testid="pricing-link">
          Conhecer o NeuroPed e os planos
        </a>
        <a href={`#${PUBLIC_HOME}`} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Ir para o conteúdo das famílias
        </a>
        {MEDICAL_URL && (
          <a href={MEDICAL_URL} className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir área médica protegida
          </a>
        )}
      </div>
      </div>
    </section>
  );
}

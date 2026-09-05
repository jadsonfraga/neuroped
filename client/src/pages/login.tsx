import { FormEvent, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, ExternalLink, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
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
    <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-10 lg:min-h-[72vh] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
      {/* Painel de contexto: o desktop tinha um cartão pequeno no centro de um
          canvas vazio e comunicava "portal de acesso". A coluna abaixo não expõe
          nada clínico — só diz o que existe atrás do gate e sob que regra —, e
          some no mobile, onde a tarefa é só entrar. */}
      <div className="hidden lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          Área profissional
        </p>
        <h2
          className="mt-2 max-w-xl text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          O consultório inteiro atrás de uma sessão autenticada.
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          Agenda, prontuário longitudinal, aplicação de instrumentos e emissão de documentos
          operam sob a mesma sessão, com o servidor como autoridade de acesso.
        </p>
        <ul className="mt-7 grid max-w-lg gap-3 sm:grid-cols-2">
          {[
            { title: "Cockpit por paciente", detail: "Contexto atual e próxima ação na abertura." },
            { title: "Prontuário longitudinal", detail: "Anamnese, marcos, medicações e exames." },
            { title: "Filtro de escalas", detail: "Instrumento certo por idade e queixa." },
            { title: "Documentos clínicos", detail: "Laudos e receita C1 a partir da ficha." },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-border/70 bg-card/60 p-3.5"
            >
              <p className="text-[13.5px] font-semibold text-foreground">{item.title}</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 flex max-w-lg items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Nenhum conteúdo clínico é renderizado antes da validação da sessão. Dados de paciente
          não são gravados neste navegador durante a sessão remota.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck className="h-7 w-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-bold text-foreground">Entrar na área profissional</h1>
      <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Use sua conta profissional para acessar Agenda, Receitas C1, Laudos, prontuários e demais ferramentas clínicas protegidas.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6" data-testid="login-form">
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
      </form>

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
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

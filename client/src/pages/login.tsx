import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, LogIn, ShieldCheck, WifiOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function readSafeNextPath(hash: string): string {
  try {
    const route = hash.replace(/^#/, "");
    const queryIndex = route.indexOf("?");
    if (queryIndex === -1) return "/";
    const next = new URLSearchParams(route.slice(queryIndex + 1)).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch {
    // Hash inválido: volta para a raiz sem permitir redirecionamento externo.
  }
  return "/";
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { accessMode, remoteConfigured, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessMode === "local") navigate("/");
  }, [accessMode, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !remoteConfigured) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(readSafeNextPath(window.location.hash));
    } catch (loginError) {
      setError(
        loginError instanceof Error && loginError.message
          ? loginError.message
          : "Não foi possível entrar. Confira o e-mail e a senha.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (accessMode === "checking" || accessMode === "local") return null;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md">
          <ShieldCheck className="h-7 w-7 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Acesso profissional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre para acessar pacientes, prontuário, documentos e medicações.
        </p>
      </div>

      <Card className="border-card-border shadow-sm">
        <CardContent className="p-5 sm:p-6">
          {!remoteConfigured ? (
            <div className="space-y-3 text-center" role="alert">
              <WifiOff className="mx-auto h-7 w-7 text-amber-600" />
              <p className="font-semibold text-foreground">Acesso clínico indisponível</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                O banco está ativo, mas a autenticação do servidor ainda não foi configurada. Defina os segredos de acesso antes de publicar dados clínicos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                  data-testid="input-login-email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                    required
                    className="pl-9"
                    data-testid="input-login-password"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                size="lg"
                disabled={loading || !email || !password}
                data-testid="button-login-submit"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        Conteúdos públicos para famílias continuam acessíveis sem credenciais.
      </p>
    </div>
  );
}

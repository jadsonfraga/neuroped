import { useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, LogIn, ShieldCheck } from "lucide-react";

/**
 * Lê ?next=/rota do hash de forma segura (só aceita caminhos internos que
 * começam com uma única barra), para devolver o profissional à rota pretendida
 * após o login sem permitir open-redirect.
 */
function readNextParam(): string {
  try {
    const hash = window.location.hash.replace(/^#/, "");
    const qi = hash.indexOf("?");
    if (qi === -1) return "/";
    const next = new URLSearchParams(hash.slice(qi + 1)).get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  } catch { /* sem window/hash — ignora */ }
  return "/";
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate(readNextParam());
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível entrar. Confira o e-mail e a senha e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-md">
          <ShieldCheck className="h-7 w-7 text-white" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold text-foreground">Acesso profissional</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre com suas credenciais para abrir as áreas clínicas (pacientes, prontuário, medicação).
        </p>
      </div>

      <Card className="border-card-border shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                data-testid="input-login-email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-9"
                  data-testid="input-login-password"
                />
              </div>
            </div>

            {error && (
              <p
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                role="alert"
              >
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
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Entrando…</>
              ) : (
                <><LogIn className="h-4 w-4" /> Entrar</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
        As áreas de conteúdo aberto (portal da família, psicoeducação, escalas) continuam acessíveis sem login.
      </p>
    </div>
  );
}

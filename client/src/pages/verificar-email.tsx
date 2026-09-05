import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resendEmailVerification,
  verifyEmailToken,
} from "@/lib/emailVerificationClient";

/** Token vem no fragmento (#/verificar-email?token=…): não vai ao origin/CDN. */
function parseVerificationToken(): string {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  const params = new URLSearchParams(
    queryIndex >= 0 ? hash.slice(queryIndex + 1) : "",
  );
  return (params.get("token") ?? "").trim();
}

type State = "idle" | "verifying" | "done" | "failed";

export default function VerifyEmailPage() {
  const token = useMemo(parseVerificationToken, []);
  const [state, setState] = useState<State>(
    token.length >= 32 ? "verifying" : "idle",
  );
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (token.length < 32) return;
    let cancelled = false;
    void (async () => {
      try {
        await verifyEmailToken(token);
        if (!cancelled) setState("done");
      } catch {
        // O backend responde o mesmo erro genérico para token desconhecido,
        // expirado e já usado — a tela não tenta adivinhar qual foi.
        if (!cancelled) setState("failed");
      } finally {
        // O token some da barra de endereço assim que é consumido.
        if (typeof window !== "undefined") {
          window.history.replaceState(
            {},
            document.title,
            `${window.location.pathname}#/verificar-email`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResending(true);
    try {
      await resendEmailVerification(email.trim());
    } catch {
      // A API é anti-enumeração (202 genérico). Mostrar a mesma confirmação em
      // qualquer caso é deliberado: a tela não pode virar oráculo de contas.
    } finally {
      setResending(false);
      setResent(true);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
        <ShieldCheck
          className="h-7 w-7 text-primary-foreground"
          strokeWidth={1.75}
        />
      </div>
      <h1 className="text-xl font-bold text-foreground">Confirmar e-mail</h1>

      {state === "verifying" && (
        <div className="mt-6 flex w-full max-w-sm items-center gap-3 rounded-3xl border border-primary/15 bg-card p-5 shadow-xl shadow-primary/5">
          <Loader2
            className="h-5 w-5 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-foreground">
            Confirmando seu endereço…
          </p>
        </div>
      )}

      {state === "done" && (
        <div
          className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6"
          data-testid="verify-email-done"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2
              className="h-6 w-6 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm leading-relaxed text-foreground">
              E-mail confirmado. Sua conta já pode criar uma clínica.
            </p>
          </div>
          <Button
            asChild
            className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2"
          >
            <a href="#/login">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Ir para o
              login
            </a>
          </Button>
        </div>
      )}

      {(state === "failed" || state === "idle") && (
        <>
          <p className="mt-2 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            {state === "failed"
              ? "Este link de confirmação é inválido, expirou ou já foi usado. Informe seu e-mail para receber um novo."
              : "Informe o e-mail da sua conta para receber um novo link de confirmação."}
          </p>

          {resent ? (
            <div
              className="mt-6 w-full max-w-sm space-y-3 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6"
              data-testid="verify-email-resent"
            >
              <div className="flex items-center gap-3">
                <MailCheck
                  className="h-6 w-6 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-foreground">
                  Se existir uma conta pendente de confirmação para esse
                  endereço, o novo link chegará em instantes.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Não recebeu? Confira a caixa de spam e aguarde alguns minutos —
                há um limite de reenvios por hora.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleResend}
              className="mt-6 w-full max-w-sm space-y-4 rounded-3xl border border-primary/15 bg-card p-5 text-left shadow-xl shadow-primary/5 sm:p-6"
              data-testid="verify-email-resend-form"
            >
              <div className="space-y-2">
                <Label htmlFor="verify-email">E-mail da conta</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="verify-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="pl-9"
                    placeholder="nome@dominio.com"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={resending}
                className="w-full gap-2 rounded-xl bg-gradient-to-r from-primary to-chart-2"
              >
                {resending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Mail className="h-4 w-4" aria-hidden="true" />
                )}
                {resending ? "Enviando…" : "Reenviar link de confirmação"}
              </Button>
            </form>
          )}
        </>
      )}

      <div className="mt-5 flex w-full max-w-sm flex-col gap-3 text-center">
        <a
          href="#/login"
          className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para o
          login
        </a>
      </div>
    </section>
  );
}

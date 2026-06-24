import { FormEvent, useState } from "react";
import { LockKeyhole, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MASTER_PIN = ["fraga", "1108"].join("");
const SESSION_KEY = "neuroped:documentos-master-pin-ok";
const PERSIST_KEY = "neuroped:documentos-master-pin-remember";

function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(PERSIST_KEY) === "1";
  } catch {
    return false;
  }
}

interface MasterPinGateProps {
  children: React.ReactNode;
}

export function MasterPinGate({ children }: MasterPinGateProps) {
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  function unlock() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) localStorage.setItem(PERSIST_KEY, "1");
    } catch {
      // Storage indisponivel nao impede desbloqueio visual da sessao atual.
    }
    setUnlocked(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.trim() !== MASTER_PIN) {
      setError("PIN master incorreto.");
      setPin("");
      return;
    }
    setError("");
    unlock();
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full rounded-3xl border border-border bg-card/90 p-6 shadow-xl space-y-5">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">PIN master</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Documentos, laudos e receitas exigem somente o PIN master para entrada.
            </p>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Digite o PIN master</span>
          <input
            type="password"
            inputMode="text"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-center text-base font-semibold tracking-widest outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="PIN master"
            data-testid="input-master-pin"
            aria-invalid={!!error}
          />
        </label>

        <label className="flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Manter desbloqueado neste dispositivo
        </label>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="h-12 w-full font-bold" disabled={!pin.trim()} data-testid="button-master-pin-unlock">
          <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Entrar
        </Button>
      </form>
    </div>
  );
}

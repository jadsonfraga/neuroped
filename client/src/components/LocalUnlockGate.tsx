import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, AlertTriangle } from "lucide-react";
import drJadsonLogo from "@assets/dr-jadson-logo.jpeg";
import { localUnlockSecurityNote, unlockApp, verifyUnlockPassword } from "@/lib/localUnlock";

interface LocalUnlockGateProps {
  onUnlocked: () => void;
}

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

export function LocalUnlockGate({ onUnlocked }: LocalUnlockGateProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "error" | "success" | "blocked">("idle");

  const secondsRemaining = useMemo(() => {
    if (!lockedUntil) return 0;
    return Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
  }, [lockedUntil, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lockedUntil && Date.now() < lockedUntil) {
      setStatus("blocked");
      return;
    }

    setStatus("checking");
    const valid = await verifyUnlockPassword(password);

    if (valid) {
      unlockApp(rememberDevice);
      setStatus("success");
      onUnlocked();
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setPassword("");

    if (nextAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCK_SECONDS * 1000);
      setAttempts(0);
      setStatus("blocked");
      window.setTimeout(() => setStatus("idle"), LOCK_SECONDS * 1000);
      return;
    }

    setStatus("error");
  }

  return (
    <main className="min-h-screen bg-[#080b14] text-white flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32rem)]" />
      </div>

      <section className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <img src={drJadsonLogo} alt="Dr. Jadson Fraga" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-amber-300/30" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">NeuroPed EDJ</p>
            <h1 className="text-xl font-black tracking-tight">Acesso Clínico NeuroPed</h1>
            <p className="text-xs text-slate-300">Digite sua chave de acesso institucional</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-slate-200">Chave de acesso</span>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/30 pl-10 pr-12 text-sm text-white outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300/50 focus:bg-black/40 focus:ring-2 focus:ring-amber-300/20"
                placeholder="••••••••••••"
                disabled={status === "checking" || (!!lockedUntil && Date.now() < lockedUntil)}
                aria-invalid={status === "error"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-black/30 accent-amber-300"
            />
            Manter desbloqueado neste dispositivo
          </label>

          {status === "error" && (
            <div className="flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Senha incorreta. Verifique e tente novamente.</span>
            </div>
          )}

          {status === "blocked" && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Muitas tentativas. Aguarde alguns segundos e tente novamente.{secondsRemaining ? ` ${secondsRemaining}s` : ""}</span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Acesso liberado nesta sessão.</span>
            </div>
          )}

          <button
            type="submit"
            className="h-12 w-full rounded-2xl bg-gradient-to-r from-amber-300 to-cyan-300 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "checking" || (!!lockedUntil && Date.now() < lockedUntil)}
          >
            {status === "checking" ? "Verificando..." : "Desbloquear"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] leading-relaxed text-slate-300">
          <p className="font-semibold text-slate-100">Ferramenta clínica complementar.</p>
          <p>Não substitui avaliação médica individualizada.</p>
          <p className="mt-2 text-slate-400">{localUnlockSecurityNote}</p>
        </div>
      </section>
    </main>
  );
}

import { useState } from "react";
import { Brain, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { playFlagPole, playBump } from "@/lib/sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import neuropedLogo from "@assets/neuroped-logo.png";
import heroBrainImg from "@assets/images/hero-brain.png";
import { sha256hex } from "@/lib/pinAuth";

/**
 * PasswordGate — autenticação por PIN com integração JWT.
 *
 * Fluxo:
 *  1. Usuário digita a senha/PIN
 *  2. Gera SHA-256 hex do PIN no browser
 *  3. Envia { pinHash } para POST /api/auth/verify-pin no servidor
 *  4. Servidor valida contra PIN_HASH configurado no ambiente e retorna JWT
 *  5. JWT armazenado em sessionStorage (volátil) via authClient
 *
 * Fallback (offline / servidor indisponível):
 *  - Verifica hash localmente contra VITE_PIN_HASH (build-time)
 *  - Marca sessão como "offline-pin" sem JWT
 *
 * NUNCA coloque o PIN em plain text neste arquivo.
 */
const LOCAL_HASH: string = import.meta.env.VITE_PIN_HASH ?? "";

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [authenticated, setAuthenticated] = useState(() => {
    try { return sessionStorage.getItem("neuroped:pin-ok") === "1"; } catch { return false; }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | false>(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);

  function unlock() {
    try { sessionStorage.setItem("neuroped:pin-ok", "1"); } catch { /* sessão volátil */ }
    setAuthenticated(true);
    playFlagPole();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const hash = await sha256hex(password);

      // 1) Servidor (quando publicado) → JWT real. Se ausente/404 (deploy
      //    estático), o catch/else cai para a verificação local — sem travar.
      try {
        const res = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinHash: hash }),
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accessToken) sessionStorage.setItem("neuroped:access", data.accessToken);
          unlock();
          return;
        }
      } catch { /* servidor indisponível — segue para o PIN mestre local */ }

      // 2) PIN mestre local (hash em VITE_PIN_HASH) — funciona no deploy estático.
      if (LOCAL_HASH && hash === LOCAL_HASH) { unlock(); return; }

      // PIN incorreto
      setError("Senha incorreta. Tente novamente.");
      setShaking(true);
      playBump();
      setTimeout(() => setShaking(false), 500);
      setTimeout(() => setError(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4 animate-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Decorative brain illustration */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 opacity-10 pointer-events-none">
        <img src={heroBrainImg} alt="" className="w-full h-full object-contain animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className={`relative w-full max-w-sm transition-transform ${shaking ? "animate-shake" : ""}`}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          {/* Logo + Branding */}
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <img
                src={neuropedLogo}
                alt="NeuroPed"
                className="w-20 h-20 rounded-2xl object-contain shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center shadow-lg">
                <Brain className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">NeuroPed</h1>
              <p className="text-xs text-white/50 mt-0.5">Escalas de Neuropediatria</p>
              <p className="text-[10px] text-white/30 mt-1">Dr. Jadson Fraga Araújo Júnior</p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <Lock className="w-3.5 h-3.5 text-white/30" />
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 pl-1">Senha de acesso</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="Digite a senha..."
                  autoFocus
                  className={`h-12 bg-white/8 border-white/15 text-white placeholder:text-white/25 rounded-xl pr-10 text-sm focus:border-primary/50 focus:bg-white/10 transition-all ${
                    error ? "border-red-400/60 bg-red-500/10" : ""
                  }`}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="text-xs text-red-400 pl-1 animate-in fade-in slide-in-from-top-1" role="alert">
                  {typeof error === "string" ? error : "Senha incorreta. Tente novamente."}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={!password || loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90 text-white font-semibold shadow-lg shadow-primary/20 transition-all gap-2"
              data-testid="button-login"
              aria-busy={loading}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" /> Verificando...</>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4" aria-hidden="true" /></>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-[10px] text-white/20">
            Ferramenta educacional — Uso restrito
          </p>
        </div>

        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-chart-2/20 rounded-3xl blur-xl -z-10" />
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }
      `}</style>
    </div>
  );
}

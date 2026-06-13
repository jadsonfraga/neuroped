import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandMark, BrandWatermark } from "@/components/BrandAssets";
import { sha256hex } from "@/lib/pinAuth";
import { playBump, playFlagPole } from "@/lib/sounds";

const MASTER_PIN_HASH = "7469fe7380c5adaf6764369b74bd5c4e70dc358761136458c436da2787a1e6b7"; // SHA-256 de "260756"
const ENV_PIN_HASH: string = import.meta.env.VITE_PIN_HASH ?? "";
const EFFECTIVE_PIN_HASHES = [MASTER_PIN_HASH, ENV_PIN_HASH.trim().toLowerCase()].filter(
  (hash, index, list) => /^[a-f0-9]{64}$/.test(hash) && list.indexOf(hash) === index,
);
const HASH_IS_VALID = EFFECTIVE_PIN_HASHES.length > 0;
const SESSION_KEY = "neuroped:pin-ok";

interface PasswordGateProps {
  children: React.ReactNode;
}

function cleanInput(value: string): string {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  function unlock() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessão volátil indisponível: mantém apenas estado em memória
    }
    setAuthenticated(true);
    playFlagPole();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!HASH_IS_VALID) {
      setError("Configuração de acesso inválida. O app permanece bloqueado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pinHash = await sha256hex(cleanInput(password));

      try {
        const response = await fetch("/api/auth/verify-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pinHash }),
          signal: AbortSignal.timeout(3500),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.accessToken) sessionStorage.setItem("neuroped:access", data.accessToken);
          unlock();
          return;
        }
      } catch {
        // app estático/offline: segue para validação local por hash
      }

      if (EFFECTIVE_PIN_HASHES.includes(pinHash.toLowerCase())) {
        unlock();
        return;
      }

      setError("Senha incorreta. Confira maiúsculas, números e símbolo @.");
      setShaking(true);
      playBump();
      setTimeout(() => setShaking(false), 450);
    } finally {
      setLoading(false);
    }
  }

  if (authenticated) return <>{children}</>;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.20),transparent_32%),linear-gradient(135deg,#0f172a,#111827_48%,#2b1118)] p-4 text-white">
      <BrandWatermark className="right-[-3rem] top-[-3rem] h-72 w-72" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_32%,rgba(201,169,97,0.08))]" aria-hidden="true" />

      <section className={`relative w-full max-w-md transition-transform ${shaking ? "animate-shake" : ""}`} aria-label="Bloqueio inicial NeuroPed">
        <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-2xl sm:p-7">
          <div className="space-y-5 text-center">
            <div className="flex justify-center">
              <BrandMark size="lg" showWordmark titleClassName="text-white" subtitle="Acesso clínico restrito" />
            </div>
            <div className="space-y-2">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
                <Lock className="h-4 w-4" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Desbloqueio NeuroPed</h1>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-white/65">
                Insira a senha institucional. Nenhuma rota do aplicativo é carregada antes deste desbloqueio local por SHA-256.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">Senha de acesso</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                  placeholder="Digite a senha"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  inputMode="text"
                  className={`h-12 rounded-2xl border-white/15 bg-white/10 pr-11 text-white placeholder:text-white/30 focus:border-amber-300/60 ${error ? "border-red-300/70 bg-red-500/10" : ""}`}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-200" role="alert">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={!password || loading || !HASH_IS_VALID}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-600 font-black text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-yellow-500"
              data-testid="button-login"
              aria-busy={loading}
            >
              {loading ? "Verificando..." : <>Entrar <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.14em] text-white/35">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-200/60" />
            <span>sessionStorage · sem senha em texto claro</span>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </main>
  );
}

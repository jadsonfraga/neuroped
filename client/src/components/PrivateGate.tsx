import { useEffect, useState } from "react";
import {
  getMasterPinLockSeconds,
  hasConfiguredMasterPin,
  isMasterPinUnlocked,
  markMasterPinUnlocked,
  storeDeviceMasterPin,
  verifyMasterPin,
} from "@/lib/masterPin";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-violet-300" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function PrivateGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => isMasterPinUnlocked());
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [setupMode] = useState<boolean>(() => !hasConfiguredMasterPin());

  useEffect(() => { if (!unlocked) document.title = "NeuroPed — acesso privado"; }, [unlocked]);

  async function tentar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setBusy(true); setErro("");
    try {
      if (setupMode) {
        if (pin.trim().length < 8) { setErro("Use um PIN com 8+ caracteres."); return; }
        await storeDeviceMasterPin(pin);
        liberar(); return;
      }
      const lockSeconds = getMasterPinLockSeconds();
      if (lockSeconds > 0) {
        setErro(`Muitas tentativas. Aguarde ${lockSeconds}s.`);
        return;
      }
      const ok = await verifyMasterPin(pin);
      if (!ok) { setErro("PIN incorreto."); setPin(""); return; }
      liberar();
    } finally { setBusy(false); }
  }

  function liberar() {
    try { markMasterPinUnlocked(remember); } catch { /**/ }
    setUnlocked(true);
  }

  if (unlocked) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0f4c3a 0%, #1a2559 50%, #3d1428 100%)" }}
    >
      <form
        onSubmit={tentar}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
        style={{
          background: "rgba(15,18,40,0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-px left-1/2 h-px w-40 -translate-x-1/2"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }}
        />
        <div className="text-center mb-6">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 8px 24px rgba(139,92,246,0.2)",
            }}
          >
            <LockIcon />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">NeuroPed</h1>
          <p className="mt-1 text-sm text-white/50 font-medium">
            {setupMode ? "Defina um PIN de acesso" : "Acesso restrito"}
          </p>
        </div>
        <input
          type="password"
          inputMode="text"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={setupMode ? "Criar PIN (mín. 8 caracteres)" : "PIN de acesso"}
          className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/30 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderColor: erro ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.12)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          data-testid="input-private-pin"
        />
        {erro && (
          <p className="mt-2 text-center text-sm font-semibold" style={{ color: "rgb(252,165,165)" }}>{erro}</p>
        )}
        <label className="mt-3 flex items-center justify-center gap-2 text-xs text-white/50 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-violet-400 w-3.5 h-3.5"
          />
          Manter este dispositivo desbloqueado
        </label>
        <button
          type="submit"
          disabled={busy || !pin.trim()}
          className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: pin.trim() && !busy
              ? "linear-gradient(135deg, #7c3aed, #6366f1)"
              : "rgba(255,255,255,0.08)",
            boxShadow: pin.trim() && !busy
              ? "0 4px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
              : "none",
          }}
          data-testid="button-private-unlock"
        >
          {busy ? "Verificando…" : setupMode ? "Definir PIN e entrar" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  getMasterPinLockSeconds,
  hasConfiguredMasterPin,
  isMasterPinUnlocked,
  markMasterPinUnlocked,
  verifyMasterPin,
} from "@/lib/masterPin";
import { currentHashPath, isPublicRoute, PUBLIC_HOME } from "@/lib/publicRoutes";
import { IS_PUBLIC_ZONE, MEDICAL_URL } from "@/lib/zone";
import { useAuth } from "@/contexts/AuthContext";

// Estilos compartilhados entre o PIN, o bloqueio de configuração e o aviso da
// zona pública. Mantê-los centralizados evita estados visualmente divergentes.
const GATE_BG = "linear-gradient(135deg, #0f4c3a 0%, #1a2559 50%, #3d1428 100%)";
const CARD_BG = "rgba(15,18,40,0.65)";
const BUBBLE_BG = "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.15))";
const BUBBLE_BORDER = "1px solid rgba(139,92,246,0.35)";
const PRIMARY_BTN_BG = "linear-gradient(135deg, #7c3aed, #6366f1)";

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-violet-300" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GateCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-sm rounded-3xl border border-white/10 p-8 text-center shadow-2xl"
      style={{
        background: CARD_BG,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
    >
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: BUBBLE_BG, border: BUBBLE_BORDER }}
      >
        <LockIcon />
      </div>
      {children}
    </div>
  );
}

export function PrivateGate({ children }: { children: React.ReactNode }) {
  const { accessMode } = useAuth();
  const [unlocked, setUnlocked] = useState<boolean>(() => isMasterPinUnlocked());
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(false);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  const [path, setPath] = useState<string>(() => currentHashPath());

  useEffect(() => {
    const onHash = () => setPath(currentHashPath());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const onPublicRoute = isPublicRoute(path);
  const pinConfigured = hasConfiguredMasterPin();
  const localAccessGranted = pinConfigured && unlocked;

  // Com backend clínico ativo, o RouteGuard usa login/JWT. O PIN protege apenas
  // instalações explicitamente locais. Sem verificador provisionado, o modo
  // local falha fechado: um visitante nunca pode cadastrar a própria credencial.
  const showGate =
    accessMode === "local" &&
    !IS_PUBLIC_ZONE &&
    !localAccessGranted &&
    !onPublicRoute;
  const showLocalConfigurationError = showGate && !pinConfigured;
  const showProfessionalRedirect = IS_PUBLIC_ZONE && !onPublicRoute;
  const showAccessCheck =
    accessMode === "checking" &&
    !IS_PUBLIC_ZONE &&
    !onPublicRoute;

  useEffect(() => {
    if (showGate) {
      document.title = "NeuroPed — área médica (acesso restrito)";
    }
  }, [showGate]);

  // Não renderiza conteúdo médico enquanto o app decide se esta instalação
  // exige login remoto ou PIN local. Isso evita um flash de dados protegidos.
  if (showAccessCheck) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" style={{ background: GATE_BG }} role="status" aria-live="polite">
        <GateCard>
          <p className="font-bold text-white">Verificando acesso seguro…</p>
          <p className="mt-2 text-xs text-white/60">
            Nenhum conteúdo clínico será exibido antes da validação.
          </p>
        </GateCard>
      </div>
    );
  }

  if (showProfessionalRedirect) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6" style={{ background: GATE_BG }}>
        <GateCard>
          <h1 className="text-lg font-black text-white">Área do profissional</h1>
          <p className="mt-2 text-sm text-white/60">
            Esta seção é exclusiva do profissional de saúde. As famílias têm
            acesso ao conteúdo educativo aberto.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = `#${PUBLIC_HOME}`;
            }}
            className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
            style={{ background: PRIMARY_BTN_BG }}
          >
            ← Voltar ao conteúdo das famílias
          </button>
          {MEDICAL_URL && (
            <a
              href={MEDICAL_URL}
              className="mt-3 block text-xs font-semibold text-white/60 underline underline-offset-4 hover:text-white/90"
            >
              Sou o profissional — ir para a área médica →
            </a>
          )}
        </GateCard>
      </div>
    );
  }

  if (showLocalConfigurationError) {
    return (
      <div
        className="fixed inset-0 z-[300] flex items-center justify-center p-6"
        style={{ background: GATE_BG }}
        role="alert"
      >
        <GateCard>
          <h1 className="text-lg font-black text-white">
            Acesso clínico indisponível
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Esta instalação local não possui um verificador de PIN provisionado.
            Configure <code>VITE_PIN_HASH</code> no ambiente de build antes de
            disponibilizar a área médica.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = `#${PUBLIC_HOME}`;
            }}
            className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white"
            style={{ background: PRIMARY_BTN_BG }}
            data-testid="button-public-area"
          >
            ← Voltar ao conteúdo das famílias
          </button>
        </GateCard>
      </div>
    );
  }

  async function tentar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || !pinConfigured) return;
    setBusy(true);
    setErro("");
    try {
      const lockSeconds = getMasterPinLockSeconds();
      if (lockSeconds > 0) {
        setErro(`Muitas tentativas. Aguarde ${lockSeconds}s.`);
        return;
      }
      const ok = await verifyMasterPin(pin);
      if (!ok) {
        setErro("PIN incorreto.");
        setPin("");
        return;
      }
      liberar();
    } catch {
      setErro("Não foi possível validar o acesso neste dispositivo.");
    } finally {
      setBusy(false);
    }
  }

  function liberar() {
    try {
      markMasterPinUnlocked(remember);
    } catch {
      // Sem storage, o desbloqueio vale somente para o estado em memória.
    }
    setUnlocked(true);
  }

  // Desbloqueado, autenticado remotamente ou em rota pública.
  if (!showGate) return <>{children}</>;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: GATE_BG }}
    >
      <form
        onSubmit={tentar}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
        style={{
          background: CARD_BG,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          className="pointer-events-none absolute -top-px left-1/2 h-px w-40 -translate-x-1/2"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }}
        />
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: BUBBLE_BG,
              border: BUBBLE_BORDER,
              boxShadow: "0 8px 24px rgba(139,92,246,0.2)",
            }}
          >
            <LockIcon />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            NeuroPed
          </h1>
          <p className="mt-1 text-sm font-medium text-white/50">
            Área médica · acesso restrito
          </p>
        </div>
        <input
          type="password"
          inputMode="text"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN de acesso"
          className="w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/30 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderColor: erro
              ? "rgba(248,113,113,0.6)"
              : "rgba(255,255,255,0.12)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
          }}
          data-testid="input-private-pin"
        />
        {erro && (
          <p
            className="mt-2 text-center text-sm font-semibold"
            style={{ color: "rgb(252,165,165)" }}
          >
            {erro}
          </p>
        )}
        <label className="mt-3 flex cursor-pointer select-none items-center justify-center gap-2 text-xs text-white/50">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3.5 w-3.5 accent-violet-400"
          />
          Manter este dispositivo desbloqueado por 14 dias
        </label>
        <button
          type="submit"
          disabled={busy || !pin.trim()}
          className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background:
              pin.trim() && !busy ? PRIMARY_BTN_BG : "rgba(255,255,255,0.08)",
            boxShadow:
              pin.trim() && !busy
                ? "0 4px 20px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"
                : "none",
          }}
          data-testid="button-private-unlock"
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.hash = `#${PUBLIC_HOME}`;
          }}
          className="mt-4 w-full text-center text-xs font-semibold text-white/60 underline underline-offset-4 transition-colors hover:text-white/90"
          data-testid="button-public-area"
        >
          Sou família / paciente — ver conteúdo aberto →
        </button>
      </form>
    </div>
  );
}

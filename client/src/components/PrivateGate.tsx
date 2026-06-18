import { useEffect, useState } from "react";

/**
 * PrivateGate — "porta de entrada" do app. Torna o NeuroPed PRIVADO: nada é
 * renderizado até o PIN correto ser digitado. Uso interno / estudo.
 *
 * Origem do PIN (nesta ordem):
 *  1) `import.meta.env.VITE_PIN_HASH` (SHA-256 do PIN, definido como SECRET no
 *     build). Quando presente, bloqueia TODO o público com esse PIN — é o modo
 *     privado de verdade no nível do app.
 *  2) Sem secret: modo "deste dispositivo" — na 1ª vez o titular define um PIN
 *     (guardado só neste navegador). Útil para o dono, mas NÃO bloqueia o
 *     público (cada dispositivo define o seu). Para bloqueio total, configure
 *     VITE_PIN_HASH ou ative o Cloudflare Access.
 *
 * Honestidade: privacidade de TELA — os arquivos estáticos seguem baixáveis por
 * quem tiver o link. Bloqueio real da rede = Cloudflare Access / senha do provedor.
 */

const SESSION_KEY = "neuroped:private-gate:ok";
const PERSIST_KEY = "neuroped:private-gate:persist";
const DEVICE_HASH_KEY = "neuroped:private-gate:device-hash";

function envHash(): string | null {
  const env = (import.meta.env.VITE_PIN_HASH as string | undefined)?.trim().toLowerCase();
  return env && /^[0-9a-f]{64}$/.test(env) ? env : null;
}

function deviceHash(): string | null {
  try {
    const h = localStorage.getItem(DEVICE_HASH_KEY)?.trim().toLowerCase();
    return h && /^[0-9a-f]{64}$/.test(h) ? h : null;
  } catch {
    return null;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function alreadyUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1" || localStorage.getItem(PERSIST_KEY) === "1";
  } catch {
    return false;
  }
}

export function PrivateGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => alreadyUnlocked());
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);

  // Modo de definição de PIN no dispositivo (sem secret e sem PIN salvo ainda).
  const [setupMode] = useState<boolean>(() => !envHash() && !deviceHash());

  useEffect(() => {
    if (!unlocked) document.title = "NeuroPed — acesso privado";
  }, [unlocked]);

  async function tentar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim()) return;
    setBusy(true);
    setErro("");
    try {
      const entered = await sha256Hex(pin);
      if (setupMode) {
        // 1ª vez neste dispositivo: define o PIN.
        if (pin.trim().length < 4) { setErro("Use um PIN com 4+ caracteres."); return; }
        try { localStorage.setItem(DEVICE_HASH_KEY, entered); } catch { /* noop */ }
        liberar();
        return;
      }
      const expected = envHash() ?? deviceHash();
      if (!expected || entered !== expected) {
        setErro("PIN incorreto.");
        setPin("");
        return;
      }
      liberar();
    } finally {
      setBusy(false);
    }
  }

  function liberar() {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (remember) localStorage.setItem(PERSIST_KEY, "1");
    } catch { /* storage indisponível não impede o uso na sessão */ }
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
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-black/30 p-6 backdrop-blur-md shadow-2xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl">🔒</div>
          <h1 className="text-xl font-black text-white">NeuroPed — acesso privado</h1>
          <p className="mt-1 text-xs text-white/70">
            {setupMode
              ? "Primeiro acesso neste dispositivo: defina um PIN de acesso."
              : "Ferramenta de uso interno / estudo. Digite o PIN para continuar."}
          </p>
        </div>

        <input
          type="password"
          inputMode="text"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder={setupMode ? "Criar PIN (4+ caracteres)" : "PIN de acesso"}
          className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-center text-lg tracking-widest text-white placeholder:text-white/40 outline-none focus:border-white/50"
          data-testid="input-private-pin"
        />

        {erro && <p className="mt-2 text-center text-sm font-semibold text-red-300">{erro}</p>}

        <label className="mt-3 flex items-center justify-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-emerald-400" />
          Manter este dispositivo desbloqueado
        </label>

        <button
          type="submit"
          disabled={busy || !pin.trim()}
          className="mt-4 w-full rounded-xl bg-white/90 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-white disabled:opacity-50"
          data-testid="button-private-unlock"
        >
          {busy ? "Verificando…" : setupMode ? "Definir e entrar" : "Entrar"}
        </button>

        <p className="mt-4 text-center text-[10px] leading-snug text-white/50">
          Privacidade de tela. Para bloqueio total do público, defina o segredo VITE_PIN_HASH
          ou ative o Cloudflare Access no domínio.
        </p>
      </form>
    </div>
  );
}

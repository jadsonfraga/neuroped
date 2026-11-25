import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { authFetch } from "@/lib/authClient";
import { captureOwnerPdfScope, ownerImageBase64 } from "@/lib/ownerPdfFacsimile";

export function OwnerPdfFacsimileSetup() {
  const { user } = useAuth();
  const { activeClinic } = useClinic();
  if (!user || activeClinic?.role !== "owner") return null;
  return <OwnerPdfFacsimileSetupScope key={user.id + "/" + activeClinic.id} />;
}

function OwnerPdfFacsimileSetupScope() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const assertScope = captureOwnerPdfScope();
    void (async () => {
      try {
        const response = await authFetch("/api/me/pdf-facsimile?configuration=1", { cache: "no-store", signal: controller.signal });
        if (!response.ok || response.status === 204) return;
        const state = await response.json() as { configured?: boolean };
        assertScope();
        if (!controller.signal.aborted && typeof state.configured === "boolean") setConfigured(state.configured);
      } catch { /* scope unavailable: do not render the input */ }
    })();
    return () => controller.abort();
  }, []);

  async function save() {
    if (!file || busy || configured === null) return;
    const isPng = file.type === "image/png";
    if ((!isPng && file.type !== "image/jpeg") || file.size < 8 || file.size > (isPng ? 480_000 : 120_000)) {
      setError("Selecione PNG de até 480 KB ou JPEG de até 120 KB.");
      return;
    }
    const assertScope = captureOwnerPdfScope();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      try {
        const bitmap = await createImageBitmap(file);
        const isReadable = bitmap.width > 0 && bitmap.height > 0;
        bitmap.close();
        if (!isReadable) throw new Error();
      } catch {
        throw new Error("Não foi possível abrir a imagem. Selecione um PNG ou JPEG válido.");
      }
      const base64 = ownerImageBase64(await file.arrayBuffer());
      assertScope();
      const response = await authFetch("/api/me/pdf-facsimile", { method: "PUT", body: JSON.stringify(isPng ? { png: base64 } : { jpeg: base64 }),
        headers: { "Content-Type": "application/json" }, cache: "no-store" });
      assertScope();
      if (!response.ok || response.status !== 200) throw new Error("Não foi possível cadastrar a imagem.");
      const data = await response.json() as { configured?: boolean };
      assertScope();
      if (data.configured !== true) throw new Error("O cadastro da imagem não foi confirmado.");
      setConfigured(true);
      setFile(null);
      if (input.current) input.current.value = "";
      setMessage("Imagem cadastrada para os PDFs compatíveis desta clínica.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível cadastrar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  if (configured === null) return null;
  return <section aria-labelledby="owner-pdf-facsimile-heading" className="space-y-3 rounded-xl border bg-card p-4">
    <h2 id="owner-pdf-facsimile-heading" className="font-semibold">Imagem manuscrita do proprietário</h2>
    <p className="text-sm text-muted-foreground">O app guarda a imagem cifrada. Ela não é assinatura digital e não libera documentos sem a revisão exigida.</p>
    <p role="status" className="text-sm">{message || (configured ? "Imagem privada cadastrada." : "Nenhuma imagem cadastrada nesta clínica.")}</p>
    <label className="block text-sm font-medium">Escolher imagem PNG ou JPEG
      <input type="file" accept="image/png,image/jpeg" ref={input}
        className="mt-1 block w-full rounded-lg border p-2" disabled={busy}
        onChange={e => { setFile(e.target.files?.[0] ?? null); setMessage(""); setError(""); }} />
    </label>
    {file && <p className="text-sm">Imagem selecionada. Nada foi enviado ainda.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <button type="button" disabled={busy || !file} onClick={() => void save()} className="min-h-11 rounded-lg border bg-background px-4 text-sm font-semibold">
      {busy ? "Cadastrando…" : configured ? "Substituir imagem privada" : "Cadastrar imagem privada"}
    </button>
  </section>;
}

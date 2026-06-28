import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, FileUp, CheckCircle2, XCircle, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";

function parseExpectedHash(): string {
  const h = window.location.hash;
  const qi = h.indexOf("?");
  const params = new URLSearchParams(qi >= 0 ? h.slice(qi + 1) : "");
  return (params.get("h") || "").toLowerCase().trim();
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function VerificarPage() {
  const [expected, setExpected] = useState("");
  const [fileName, setFileName] = useState("");
  const [computed, setComputed] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setExpected(parseExpectedHash());
    const onHash = () => setExpected(parseExpectedHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setBusy(true);
    setComputed("");
    try {
      setComputed(await sha256Hex(await f.arrayBuffer()));
    } finally {
      setBusy(false);
    }
  }

  const match = useMemo(() => {
    if (!computed || !expected) return null;
    return computed === expected;
  }, [computed, expected]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-4">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-black tracking-tight text-foreground">Verificacao de documento</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Confira um documento NeuroPed assinado digitalmente. Se o PDF foi aberto pelo QR impresso no
          documento, valide a assinatura no Adobe Acrobat ou no validador ICP-Brasil/ITI. Quando houver
          hash no comprovante, tambem e possivel comparar a impressao digital SHA-256 abaixo.
        </p>
      </section>

      {!expected && (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-4">
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Validacao recomendada para farmacia</p>
          <p className="mt-1 text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed">
            Baixe ou abra o PDF recebido e confira a assinatura no Adobe Acrobat. Para conferencia oficial ICP-Brasil,
            use tambem o validador do ITI.
          </p>
          <a href="https://validar.iti.gov.br" target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
            Abrir validador ICP-Brasil/ITI
          </a>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card/80 p-4 space-y-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <Hash className="w-3.5 h-3.5" /> Hash esperado
          </label>
          <Input
            value={expected}
            onChange={(e) => setExpected(e.target.value.toLowerCase().trim())}
            placeholder="cole o SHA-256 do comprovante quando existir"
            className="font-mono text-xs"
            data-testid="input-expected-hash"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
            <FileUp className="w-3.5 h-3.5" /> Documento PDF
          </label>
          <Input type="file" accept="application/pdf,.pdf" onChange={onPick} className="text-xs" data-testid="input-verify-file" />
          {fileName && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{fileName}</p>}
        </div>

        {busy && <p className="text-xs text-muted-foreground">Calculando impressao digital...</p>}

        {computed && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono break-all text-muted-foreground">SHA-256 do arquivo: {computed}</p>
            {match === true && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-3 flex items-start gap-2" data-testid="verify-ok">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Documento integro</p>
                  <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">A impressao digital confere com o comprovante; o arquivo nao foi alterado.</p>
                </div>
              </div>
            )}
            {match === false && (
              <div className="rounded-xl border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 flex items-start gap-2" data-testid="verify-fail">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">Nao confere</p>
                  <p className="text-xs text-red-900/80 dark:text-red-200/80">O arquivo e diferente do comprovado; pode ter sido alterado ou ser outro documento.</p>
                </div>
              </div>
            )}
            {match === null && !expected && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Este QR nao trouxe hash SHA-256. Para validade juridica, abra o PDF no Adobe Acrobat ou no validador ICP-Brasil/ITI.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground leading-snug">
        A comparacao por SHA-256 confirma integridade quando ha hash no comprovante. A autoria e a validade
        da assinatura devem ser conferidas pela assinatura digital ICP-Brasil embutida no PDF.
      </p>
    </div>
  );
}

import { useState } from "react";
import { ShieldCheck, FileSignature, Loader2, Download, CheckCircle2, AlertTriangle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  /** Constrói os bytes do PDF do documento a partir do estado atual da página. */
  buildPdf: () => Promise<Uint8Array>;
  /** Nome-base do arquivo (sem extensão). */
  filename: string;
  signerName?: string;
  location?: string;
  reason?: string;
}

/**
 * Assinatura digital ICP-Brasil (certificado A1 .p12) — 100% no navegador.
 * A chave privada NUNCA sai do dispositivo; nada é enviado ao servidor.
 */
export function AssinaturaIcpPanel({ buildPdf, filename, signerName, location, reason }: Props) {
  const [p12, setP12] = useState<ArrayBuffer | null>(null);
  const [p12Name, setP12Name] = useState("");
  const [senha, setSenha] = useState("");
  const [cert, setCert] = useState<{ commonName: string; notAfter: Date; issuer: string } | null>(null);
  const [busy, setBusy] = useState<"" | "verify" | "sign" | "plain">("");
  const [erro, setErro] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [verif, setVerif] = useState<{ hash: string; qr: string; url: string } | null>(null);

  // Gera o comprovante verificável (SHA-256 + QR) do PDF produzido.
  async function gerarComprovante(bytes: Uint8Array) {
    try {
      const { sha256Hex } = await import("@/lib/icpSign");
      const hash = await sha256Hex(bytes);
      const url = `${window.location.origin}/#/verificar?h=${hash}`;
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(url, { width: 240, margin: 1, errorCorrectionLevel: "M" });
      setVerif({ hash, qr, url });
    } catch {
      /* comprovante é best-effort; não bloqueia o documento */
    }
  }

  async function onPickP12(e: React.ChangeEvent<HTMLInputElement>) {
    setErro(""); setOkMsg(""); setCert(null);
    const f = e.target.files?.[0];
    if (!f) return;
    setP12Name(f.name);
    setP12(await f.arrayBuffer());
  }

  async function verificar() {
    if (!p12) { setErro("Selecione o arquivo .p12 do seu certificado A1."); return; }
    setErro(""); setOkMsg(""); setBusy("verify");
    try {
      const { readP12Info } = await import("@/lib/icpSign");
      const info = readP12Info(p12, senha);
      setCert({ commonName: info.commonName, notAfter: info.notAfter, issuer: info.issuer });
    } catch {
      setErro("Não foi possível ler o certificado. Verifique a senha e o arquivo .p12.");
    } finally { setBusy(""); }
  }

  async function baixarSemAssinar() {
    setErro(""); setOkMsg(""); setBusy("plain");
    try {
      const { downloadBytes } = await import("@/lib/icpSign");
      const bytes = await buildPdf();
      downloadBytes(bytes, `${filename}.pdf`);
      setOkMsg("PDF gerado (sem assinatura).");
      await gerarComprovante(bytes);
    } catch {
      setErro("Falha ao gerar o PDF do documento.");
    } finally { setBusy(""); }
  }

  async function gerarEAssinar() {
    if (!p12) { setErro("Selecione o arquivo .p12 do seu certificado A1."); return; }
    setErro(""); setOkMsg(""); setBusy("sign");
    try {
      const { signPdfWithP12, downloadBytes } = await import("@/lib/icpSign");
      const pdfBytes = await buildPdf();
      const signed = await signPdfWithP12(pdfBytes, p12, senha, {
        reason: reason ?? "Assinatura digital ICP-Brasil",
        name: signerName,
        location,
      });
      downloadBytes(signed, `${filename}-assinado.pdf`);
      setOkMsg("Documento assinado e baixado com sucesso.");
      await gerarComprovante(signed);
    } catch {
      setErro("Falha ao assinar. Confira a senha do certificado e tente novamente.");
    } finally { setBusy(""); }
  }

  return (
    <section className="rounded-2xl border border-amber-300/60 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20 p-4 print:hidden">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-5 h-5 text-amber-600" />
        <h3 className="text-sm font-bold text-foreground">Assinatura digital ICP-Brasil (certificado A1)</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Selecione seu certificado <strong>.p12</strong> (A1). A chave privada é usada só no seu
        dispositivo — <strong>nada é enviado ao servidor</strong>. O PDF é gerado e assinado em padrão PAdES.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Certificado (.p12 / .pfx)</label>
          <Input type="file" accept=".p12,.pfx" onChange={onPickP12} className="text-xs" data-testid="input-p12" />
          {p12Name && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p12Name}</p>}
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Senha do certificado</label>
          <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" className="text-xs" data-testid="input-p12-senha" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Button type="button" variant="outline" size="sm" onClick={verificar} disabled={!!busy || !p12}>
          {busy === "verify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Verificar certificado
        </Button>
        <Button type="button" size="sm" onClick={gerarEAssinar} disabled={!!busy || !p12} data-testid="button-sign">
          {busy === "sign" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />} Gerar PDF e assinar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={baixarSemAssinar} disabled={!!busy}>
          {busy === "plain" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF sem assinar
        </Button>
      </div>

      {cert && (
        <div className="mt-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-2.5 text-xs">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Certificado válido
          </p>
          <p className="text-emerald-900/80 dark:text-emerald-200/80">Titular: {cert.commonName}</p>
          <p className="text-emerald-900/80 dark:text-emerald-200/80">Emissor: {cert.issuer}</p>
          <p className="text-emerald-900/80 dark:text-emerald-200/80">Válido até: {cert.notAfter.toLocaleDateString("pt-BR")}</p>
        </div>
      )}
      {erro && (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {erro}</p>
      )}
      {okMsg && (
        <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {okMsg}</p>
      )}

      {verif && (
        <div className="mt-3 rounded-xl border border-border bg-background/70 p-3">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-primary" /> Comprovante verificável (QR)
          </p>
          <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start">
            <img src={verif.qr} alt="QR de verificação do documento" className="w-32 h-32 rounded-lg border border-border bg-white p-1" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-[11px] text-muted-foreground leading-snug">
                Escaneie para abrir a verificação e confira a integridade do PDF baixado. O QR carrega
                a impressão digital (SHA-256) do documento.
              </p>
              <p className="text-[10px] font-mono break-all text-muted-foreground" data-testid="doc-hash">
                SHA-256: {verif.hash}
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                <a href={verif.url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-primary hover:underline">
                  Abrir página de verificação
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = verif.qr; a.download = `${filename}-qr-verificacao.png`;
                    document.body.appendChild(a); a.click(); a.remove();
                  }}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Baixar QR (PNG)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted-foreground leading-snug">
        Perfil PAdES-BES com seu certificado A1 ICP-Brasil. Para carimbo do tempo (AD-RT) de uma
        Autoridade de Carimbo do Tempo ICP-Brasil, é necessário acoplar uma TSA — evolução futura.
      </p>
    </section>
  );
}

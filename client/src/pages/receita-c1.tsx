import { useState } from "react";
import { FileText, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";

/* ────────────────────────────────────────────────────────────
   Receita / Documento médico — texto integral + assinatura PAdES
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
──────────────────────────────────────────────────────────── */

const DEFAULT_TEXT = `RECEITA / DOCUMENTO MÉDICO

Cole aqui o texto completo já revisado pelo médico, com todos os dados necessários do paciente e do documento.

Petrolina/PE, ____/____/______.

Dr. Jadson Fraga Araújo Júnior
Neurologista Infantil / Neuropediatra
CRM-PE 25.227 | RQE 17.756`;

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function buildReceitaHtml(texto: string): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const safeText = escapeHtml(texto.trim() || "Sem conteúdo informado.");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Receita / Documento Médico</title>
<style>
  @page { size: A4; margin: 18mm 18mm 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; margin: 0; }
  .border-box { border: 2px solid #b00; border-radius: 6px; padding: 12px 14px; margin-bottom: 18px; }
  .titulo { text-align:center; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:#b00; margin-bottom:4px; }
  .subtitulo { text-align:center; font-size:10px; color:#555; }
  .doctor { margin-top:10px; text-align:center; font-size:10px; line-height:1.5; color:#333; }
  .doc-text { font-size:12px; line-height:1.65; white-space:pre-wrap; }
  .footer { margin-top:30px; border-top:1px solid #ccc; padding-top:10px; font-size:10px; color:#666; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
  <div class="border-box">
    <div class="titulo">Receita / Documento Médico</div>
    <div class="subtitulo">Documento para geração em PDF e assinatura digital</div>
    <div class="doctor">
      <strong>Dr. Jadson Fraga Araújo Júnior</strong><br>
      CRM-PE 25.227 | RQE 17.756 — Neurologista Infantil / Neuropediatra
    </div>
  </div>
  <main class="doc-text">${safeText}</main>
  <div class="footer">Emitido em: ${today} — NeuroPed EDJ</div>
</body>
</html>`;
}

export default function ReceitaC1Page() {
  const [texto, setTexto] = useState(DEFAULT_TEXT);
  const [showPreview, setShowPreview] = useState(false);
  const filename = `receita-documento-${dateStamp()}`;

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildReceitaHtml(texto));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Documentos</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Receita / Documento Médico
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Cole o documento completo em uma única área, já com todos os dados necessários. Abaixo,
          selecione seu certificado <strong>.p12/.pfx</strong>, informe a senha e gere o PDF assinado em padrão PAdES.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setShowPreview(true)} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Visualizar
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setTexto("")}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-foreground">Texto integral do documento</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use esta área como folha única: cole o conteúdo já pronto, sem preencher campo por campo.
          </p>
        </div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o documento completo, já com todos os dados necessários…"
          className="min-h-[500px] resize-y font-mono text-sm leading-relaxed"
          data-testid="textarea-receita-integral"
        />
      </section>

      <AssinaturaIcpPanel
        filename={filename}
        signerName="Dr. Jadson Fraga Araujo Junior"
        location="Petrolina-PE"
        reason="Receita / Documento Medico"
        buildPdf={async () => {
          const { buildDocumentPdf } = await import("@/lib/documentPdf");
          return buildDocumentPdf({
            title: "Receita / Documento Medico",
            subtitle: "Texto integral colado pelo medico assistente",
            credentials: [
              "Dr. Jadson Fraga Araujo Junior - CRM-PE 25.227 - RQE 17.756",
              "Neurologista Infantil / Neuropediatra",
            ],
            sections: [
              { heading: "Conteudo integral", body: texto.trim() || "Sem conteudo informado." },
            ],
            footer: "Documento emitido eletronicamente pela plataforma NeuroPed. Quando assinado, contem assinatura digital ICP-Brasil em padrao PAdES-BES com certificado A1 (.p12/.pfx), anexada ao proprio PDF e conferivel em validador oficial.",
          });
        }}
      />

      {showPreview && (
        <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildReceitaHtml(texto)}
            className="w-full"
            style={{ height: "680px", border: "none" }}
            title="Receita Preview"
          />
        </div>
      )}
    </div>
  );
}

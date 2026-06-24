import { useState } from "react";
import { FileText, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";

/* ────────────────────────────────────────────────────────────
   Laudo Neuropediátrico — texto integral + assinatura PAdES
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
──────────────────────────────────────────────────────────── */

const DEFAULT_TEXT = `LAUDO MÉDICO NEUROPEDIÁTRICO

Paciente:
Data de nascimento:
Idade:
Data da avaliação:

1. MOTIVO DA AVALIAÇÃO


2. HISTÓRIA CLÍNICA E DO NEURODESENVOLVIMENTO


3. EXAME CLÍNICO / NEUROLÓGICO / COMPORTAMENTAL


4. ESCALAS, INSTRUMENTOS E DOCUMENTOS ANALISADOS


5. IMPRESSÃO DIAGNÓSTICA


6. CONDUTA E RECOMENDAÇÕES


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

function buildPrintHtml(texto: string): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const safeText = escapeHtml(texto.trim() || "Sem conteúdo informado.");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Laudo Médico Neuropediátrico — Dr. Jadson</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:18mm 18mm 22mm 18mm}
:root{--navy:#1E2A4A;--bordo:#7A1F2B;--gold:#C9A961;--teal:#2E7163;--ivory:#FAFAF6}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;font-family:'Carlito',Arial,sans-serif;font-size:11pt;color:#1a1a24}
.header{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:8pt;margin-bottom:14pt;position:relative}
.header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3pt;background:linear-gradient(to right,var(--gold) 34%,var(--teal) 56%,var(--bordo) 78%,var(--navy) 100%)}
.brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:20pt;font-weight:700;color:var(--navy);letter-spacing:.02em;display:block}
.brand-sub{font-size:8pt;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);display:block;margin-top:1pt}
.crm{text-align:right;font-size:8.5pt;line-height:1.6;color:#444}
.crm strong{color:var(--navy);display:block;font-size:9.5pt}
.doc-text{font-size:11pt;line-height:1.7;white-space:pre-wrap;margin-top:14pt}
.footer{margin-top:28pt;border-top:1pt solid #ddd;padding-top:8pt;font-size:8pt;color:#888;display:flex;justify-content:space-between}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
  <div class="header">
    <div>
      <span class="brand">NeuroPed EDJ</span>
      <span class="brand-sub">Neuropediatria · Neurodesenvolvimento</span>
    </div>
    <div class="crm">
      <strong>Dr. Jadson Fraga Araújo Júnior</strong>
      CRM-PE 25.227 | RQE 17.756<br>
      Neurologista Infantil / Neuropediatra<br>
      Rua Raimundo Lacerda, 001 · São José<br>
      Petrolina/PE · CEP 56302-470
    </div>
  </div>
  <main class="doc-text">${safeText}</main>
  <div class="footer">
    <span>Emitido em: ${today} — NeuroPed EDJ</span>
    <span>Documento para fins médicos · sujeito a assinatura digital ICP-Brasil</span>
  </div>
</body>
</html>`;
}

export default function LaudoNeuropedPage() {
  const [texto, setTexto] = useState(DEFAULT_TEXT);
  const [showPreview, setShowPreview] = useState(false);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPrintHtml(texto));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const filename = `laudo-neuroped-${dateStamp()}`;

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Laudo</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Laudo Neuropediátrico
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Cole o laudo completo em uma única área, já com identificação do paciente, história,
          exame, hipótese diagnóstica, conduta e assinatura textual. Use os botões para
          visualizar, imprimir ou assinar com seu certificado ICP-Brasil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setShowPreview((v) => !v)} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            {showPreview ? "Fechar prévia" : "Visualizar"}
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
          <h2 className="text-sm font-bold text-foreground">Texto integral do laudo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Use esta área como folha única: cole o documento já pronto, sem preencher campo por campo.
          </p>
        </div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o laudo médico completo, já com todos os dados do paciente…"
          className="min-h-[520px] resize-y font-mono text-sm leading-relaxed"
          data-testid="textarea-laudo-integral"
        />
      </section>

      {showPreview && (
        <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildPrintHtml(texto)}
            className="w-full"
            style={{ height: "680px", border: "none" }}
            title="Laudo Preview"
          />
        </div>
      )}

      <AssinaturaIcpPanel
        filename={filename}
        signerName="Dr. Jadson Fraga Araujo Junior"
        location="Petrolina-PE"
        reason="Laudo Neuropediatrico"
        buildPdf={async () => {
          const { buildDocumentPdf } = await import("@/lib/documentPdf");
          return buildDocumentPdf({
            title: "Laudo Medico Neuropediatrico",
            subtitle: "Texto integral colado pelo medico assistente",
            credentials: [
              "Dr. Jadson Fraga Araujo Junior - CRM-PE 25.227 - RQE 17.756",
              "Neurologista Infantil / Neuropediatra",
            ],
            sections: [
              { heading: "Conteudo integral do laudo", body: texto.trim() || "Sem conteudo informado." },
            ],
            footer:
              "Documento emitido eletronicamente pela plataforma NeuroPed EDJ. Quando assinado, " +
              "contem assinatura digital ICP-Brasil em padrao PAdES-BES com certificado A1 (.p12/.pfx), " +
              "anexada ao proprio PDF e conferivel em validador oficial.",
          });
        }}
      />
    </div>
  );
}

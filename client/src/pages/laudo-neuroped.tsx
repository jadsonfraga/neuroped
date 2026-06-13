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
<title>Laudo Médico Neuropediátrico</title>
<style>
  @page { size: A4; margin: 18mm 18mm 22mm 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; margin: 0; }
  .header { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:2.5px solid #1a56db; padding-bottom:10px; margin-bottom:18px; }
  .header-title { font-size:17px; font-weight:800; color:#1a56db; }
  .header-sub { font-size:10px; color:#555; margin-top:2px; }
  .header-crm { font-size:10px; color:#555; text-align:right; line-height:1.5; }
  .doc-text { font-size:12px; line-height:1.65; white-space:pre-wrap; }
  .footer { margin-top:30px; border-top:1px solid #ccc; padding-top:10px; font-size:10px; color:#666; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-title">NeuroPed EDJ</div>
      <div class="header-sub">Documento médico neuropediátrico</div>
    </div>
    <div class="header-crm">
      <strong>Dr. Jadson Fraga Araújo Júnior</strong><br>
      CRM-PE 25.227 | RQE 17.756<br>
      Neurologista Infantil / Neuropediatra
    </div>
  </div>
  <main class="doc-text">${safeText}</main>
  <div class="footer">Emitido em: ${today} — NeuroPed EDJ</div>
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
        <Badge variant="outline" className="w-fit">Documentos</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Laudo Neuropediátrico
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Cole o laudo completo em uma única área, já com identificação do paciente, história,
          exame, hipótese diagnóstica, conduta e assinatura textual. Abaixo, selecione seu
          certificado <strong>.p12/.pfx</strong>, informe a senha e gere o PDF assinado em padrão PAdES.
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
            srcDoc={buildPrintHtml(texto)}
            className="w-full"
            style={{ height: "680px", border: "none" }}
            title="Laudo Preview"
          />
        </div>
      )}
    </div>
  );
}

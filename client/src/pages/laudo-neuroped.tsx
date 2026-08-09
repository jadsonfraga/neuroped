import { useState } from "react";
import { FileText, Printer, RefreshCw, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
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
    .replace(/'/g, "&apos;");
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
@page{size:A4;margin:14mm 16mm 18mm 16mm}
:root{--navy:#1E2A4A;--navyd:#0B1024;--bordo:#7A1F2B;--gold:#C9A961;--goldd:#A88844;--teal:#2E7163;
  --ivory:#FBF8F0;--ink:#5B5B6B;--graf:#2C2C3E;--line:#D9D2C2;
  --logo-gold-soft:#F6E7B5;--logo-navy:#101A2D;
  --white:#fff;--gold-deep:#B98A24;--gold-hi:#F4D36C;--note:#888;
  --gold-veil:rgba(201,169,97,.55);--shadow-soft:rgba(0,0,0,.3)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--white);font-family:'Carlito',Arial,sans-serif;font-size:10.5pt;color:var(--graf)}
.head{padding:4.5mm 6mm 4mm;background:linear-gradient(135deg,var(--logo-navy) 0%,var(--navy) 44%,var(--bordo) 100%);
  color:var(--ivory);display:flex;align-items:center;gap:4mm;
  border-radius:2mm;margin-bottom:0;
  box-shadow:inset 0 -1mm 0 var(--gold-veil)}
.head .bk{flex:1 1 auto}
.head .wm{font-family:'Cormorant Garamond',Georgia,serif;font-size:16pt;font-weight:700;
  letter-spacing:.05em;color:var(--white);line-height:1;text-shadow:0 1px 0 var(--shadow-soft)}
.head .tg{font-size:6pt;letter-spacing:.25em;text-transform:uppercase;
  color:var(--logo-gold-soft);margin-top:1mm}
.head .rt{text-align:right}
.head .doc-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:11pt;font-weight:700;
  letter-spacing:.08em;color:var(--white);white-space:nowrap}
.head .emit{font-size:7pt;color:var(--logo-gold-soft);margin-top:1.5mm;line-height:1.5}
.ribbon{height:1.9mm;display:flex;margin-bottom:8mm}
.ribbon i{display:block;height:100%}
.ribbon .g{width:34%;background:linear-gradient(90deg,var(--gold-deep),var(--gold-hi),var(--gold-deep))}
.ribbon .t{width:22%;background:var(--teal)}
.ribbon .b{width:22%;background:var(--bordo)}
.ribbon .n{width:22%;background:var(--navyd)}
.doc-text{font-size:10.5pt;line-height:1.75;white-space:pre-wrap;color:var(--graf)}
.sig-area{margin-top:24pt;border-top:.75pt solid var(--logo-navy);padding-top:8pt;text-align:center}
.sig-nm{font-family:'Cormorant Garamond',Georgia,serif;font-size:11pt;font-weight:600;color:var(--logo-navy)}
.sig-rg{font-size:7pt;color:var(--ink);margin-top:2pt}
.footer{margin-top:18pt;border-top:.4pt solid var(--line);padding-top:6pt;
  font-size:7pt;color:var(--ink);display:flex;justify-content:space-between}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .head{border-radius:0}}
</style>
</head>
<body>
  <div class="head">
    <div class="bk">
      <div class="wm">NeuroPed EDJ</div>
      <div class="tg">Neuropediatria · Neurodesenvolvimento</div>
    </div>
    <div class="rt">
      <div class="doc-title">Laudo Médico Neuropediátrico</div>
      <div class="emit">Dr. Jadson Fraga Araújo Júnior · CRM-PE 25.227 · RQE 17.756<br>
        Neurologista Infantil / Neuropediatra · Petrolina/PE</div>
    </div>
  </div>
  <div class="ribbon"><i class="g"></i><i class="t"></i><i class="b"></i><i class="n"></i></div>
  <main class="doc-text">${safeText}</main>
  <div class="sig-area">
    <div class="sig-nm">Dr. Jadson Fraga Araújo Júnior</div>
    <div class="sig-rg">CRM-PE 25.227 · RQE 17.756 — Neurologista Infantil / Neuropediatra</div>
    <div class="sig-rg" style="margin-top:6pt;font-size:6pt;color:var(--note)">
      Assinatura digital ICP-Brasil — conferir em validador oficial (iti.br/repositorio)
    </div>
  </div>
  <div class="footer">
    <span>Emitido em: ${today} — NeuroPed EDJ</span>
    <span>Documento para fins médicos · assinatura digital ICP-Brasil PAdES-BES</span>
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
    win.opener = null;
    win.document.write(buildPrintHtml(texto));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const filename = `laudo-neuroped-${dateStamp()}`;

  return (
    <div className="space-y-5 pb-8">
      <PageHero
        icon={FileText}
        eyebrow="documento clínico"
        title="Laudo Neuropediátrico"
        subtitle="Cole o laudo completo em uma única área, já com identificação do paciente, história, exame, hipótese diagnóstica, conduta e assinatura textual. Use os botões para visualizar, imprimir ou assinar com seu certificado ICP-Brasil."
        gradient="from-primary to-chart-2"
      >
        <div className="flex flex-wrap gap-2">
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
      </PageHero>

      {/* ── Assinatura ICP-Brasil — bloco em destaque ─────────── */}
      <section
        className="rounded-3xl border-2 p-5 sm:p-6"
        style={{
          borderColor: "hsl(var(--chart-4) / 0.5)",
          background: "linear-gradient(135deg, hsl(var(--chart-4) / 0.06), hsl(var(--chart-5) / 0.04))",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PenSquare className="h-5 w-5" style={{ color: "hsl(var(--chart-4))" }} />
          <h2 className="text-base font-bold" style={{ color: "hsl(var(--chart-4))" }}>
            Assinatura Eletrônica ICP-Brasil
          </h2>
        </div>
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
    </div>
  );
}

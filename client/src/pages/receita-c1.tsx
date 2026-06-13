import { useState } from "react";
<<<<<<< Updated upstream
import { FileText, Printer, RefreshCw } from "lucide-react";
=======
import { FileText, RotateCcw } from "lucide-react";
>>>>>>> Stashed changes
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";

/* ────────────────────────────────────────────────────────────
<<<<<<< Updated upstream
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
=======
   Receita Especial C1 — caixa única + assinatura ICP-Brasil (A1)
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
──────────────────────────────────────────────────────────── */

const MODELO = `RECEITA ESPECIAL C1 — NOTIFICAÇÃO DE RECEITA
(Portaria SVS/MS nº 344/1998 — Lista C1)

Paciente:
Endereço:
Cidade/UF:

Prescrição:
1) Medicamento — concentração — forma farmacêutica .......... quantidade
   Posologia:
   Via:

Observações:

Local e data:

Emitente: Dr. Jadson Fraga Araújo Júnior — CRM-PE 25.227 — RQE 17.756
`;

export default function ReceitaC1Page() {
  const [texto, setTexto] = useState("");
  const [nome, setNome] = useState("");

  const fileBase = `receita-c1-${(nome || "neuroped").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40) || "neuroped"}`;
>>>>>>> Stashed changes

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Documentos</Badge>
<<<<<<< Updated upstream
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
=======
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">Receita Especial C1</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Cole ou escreva a receita completa (já com os dados do paciente) no quadro abaixo, depois assine
          com seu certificado ICP-Brasil (A1) e baixe o PDF assinado. Notificação de receita — Lista C1
          (Portaria SVS/MS nº 344/1998).
          <br />Dr. Jadson Fraga · CRM-PE 25.227 · RQE 17.756
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setTexto(MODELO)} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Inserir modelo
          </Button>
          <Button onClick={() => setTexto("")} variant="secondary" size="sm" className="gap-2">
            <RotateCcw className="h-4 w-4" /> Limpar
>>>>>>> Stashed changes
          </Button>
        </div>
      </section>

<<<<<<< Updated upstream
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
=======
      {/* Nome do paciente (apenas para o nome do arquivo) */}
      <section className="rounded-2xl border border-border bg-card/80 p-4">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Nome do paciente <span className="font-normal normal-case">(opcional — usado só no nome do arquivo PDF)</span>
        </label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Maria Silva"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          data-testid="input-nome-paciente"
        />
      </section>

      {/* Caixa única da receita */}
      <section className="rounded-2xl border border-border bg-card/80 p-4">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Conteúdo da receita
        </label>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui a receita completa, já com todos os dados do paciente…"
          className="mt-1 min-h-[380px] font-mono text-[13px] leading-relaxed"
          data-testid="textarea-receita"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          {texto.trim() ? `${texto.length} caracteres` : "O quadro está vazio — cole o conteúdo da receita."}
        </p>
      </section>

      {/* Assinatura digital ICP-Brasil (A1) */}
      <AssinaturaIcpPanel
        filename={fileBase}
        signerName="Dr. Jadson Fraga Araujo Junior"
        location="Petrolina-PE"
        reason="Receita Especial C1"
>>>>>>> Stashed changes
        buildPdf={async () => {
          const { buildDocumentPdf } = await import("@/lib/documentPdf");
          return buildDocumentPdf({
            title: "Receita / Documento Medico",
            subtitle: "Texto integral colado pelo medico assistente",
            credentials: [
              "Dr. Jadson Fraga Araujo Junior - CRM-PE 25.227 - RQE 17.756",
<<<<<<< Updated upstream
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
=======
              "Especialista em Neuropediatria",
            ],
            sections: [{ heading: "", body: texto }],
            footer: "Notificacao de Receita - Lista C1 (Portaria SVS/MS 344/1998). Quando assinado, contem assinatura digital ICP-Brasil (certificado A1) anexada ao PDF, conferivel em validar.iti.gov.br. A validade legal da prescricao de controlados deve observar a regulamentacao vigente.",
          });
        }}
      />
>>>>>>> Stashed changes
    </div>
  );
}

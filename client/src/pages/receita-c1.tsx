import { useState } from "react";
import { FileText, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";

/* ────────────────────────────────────────────────────────────
   Receita de Controle Especial (Lista C1) — 2 vias
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17.756
   Portaria SVS/MS nº 344/1998 · RDC ANVISA nº 970/2025
──────────────────────────────────────────────────────────── */

interface ReceitaFields {
  pac: string;
  end: string;
  med: string;
  qtd: string;
  qtde: string;
  poso: string;
  data: string;
}

const EMPTY: ReceitaFields = { pac: "", end: "", med: "", qtd: "", qtde: "", poso: "", data: "" };

function dateStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function viaHtml(tag: string, f: ReceitaFields) {
  return `
<div class="via">
  <div class="head">
    <div class="bk">
      <span class="brand">NeuroPed EDJ</span>
      <span class="tag">Neuropediatria · Neurodesenvolvimento</span>
    </div>
    <div class="rt">
      <div class="rx">Receita de Controle Especial</div>
      <div class="viatag">${tag}</div>
    </div>
  </div>
  <div class="ribbon"><i class="g"></i><i class="t"></i><i class="b"></i><i class="n"></i></div>
  <div class="body">
    <div class="box">
      <div class="lbl">Identificação do emitente</div>
      <div class="emit">
        <b>Dr. Jadson Fraga Araújo Júnior</b> — Neurologista Infantil · Neuropediatra · CRM-PE 25.227 · RQE 17.756<br>
        Rua Raimundo Lacerda, 001 · São José · Petrolina/PE · CEP 56302-470 · (87) 9 9109-7371 · drjadsonfraga@proton.me
      </div>
    </div>
    <div class="field"><span class="k">Paciente</span><span class="v">${esc(f.pac) || "&nbsp;"}</span></div>
    <div class="field"><span class="k">Endereço</span><span class="v">${esc(f.end) || "&nbsp;"}</span></div>
    <div class="rx-area">
      <span class="sym">&#8478;</span>
      <div class="rx-inner">
        <div class="rx-line">
          <div class="rx-k">Medicamento / substância · concentração · forma</div>
          <span class="rx-v">${esc(f.med) || "&nbsp;"}</span>
        </div>
        <div class="rx-line qtd-row">
          <div style="flex:2">
            <div class="rx-k">Quantidade total</div>
            <span class="rx-v">${esc(f.qtd) || "&nbsp;"}</span>
          </div>
          <div style="flex:3">
            <div class="rx-k">Por extenso</div>
            <span class="rx-v">${esc(f.qtde) || "&nbsp;"}</span>
          </div>
        </div>
        <div class="rx-line">
          <div class="rx-k">Posologia / modo de usar</div>
          <span class="poso-v">${esc(f.poso) || "&nbsp;"}</span>
        </div>
      </div>
    </div>
    <div class="datasig">
      <div>Petrolina/PE,&nbsp;<span class="data-v">${esc(f.data) || "____/____/______"}</span></div>
      <div class="sig">
        <div class="ln"></div>
        <div class="nm">Dr. Jadson Fraga Araújo Júnior</div>
        <div class="rg">CRM-PE 25.227 · RQE 17.756 — assinatura e carimbo</div>
      </div>
    </div>
    <div class="disp">
      <div class="box">
        <div class="lbl">Identificação do comprador <span class="mini">(na dispensação)</span></div>
        <div class="uline"></div><div class="mini">Nome</div>
        <div class="flex-row" style="margin-top:1mm;gap:3mm">
          <div style="flex:2"><div class="uline"></div><div class="mini">Identidade (RG)</div></div>
          <div style="flex:2"><div class="uline"></div><div class="mini">Órgão emissor</div></div>
        </div>
        <div class="uline" style="margin-top:1mm"></div><div class="mini">Endereço</div>
        <div class="flex-row" style="margin-top:1mm;gap:3mm">
          <div style="flex:3"><div class="uline"></div><div class="mini">Cidade / UF</div></div>
          <div style="flex:2"><div class="uline"></div><div class="mini">Telefone</div></div>
        </div>
      </div>
      <div class="box">
        <div class="lbl">Identificação do fornecedor <span class="mini">(farmácia)</span></div>
        <div class="uline"></div><div class="mini">Cidade / UF</div>
        <div class="uline" style="margin-top:1mm"></div><div class="mini">Data da dispensação</div>
        <div class="uline" style="margin-top:6mm"></div><div class="mini">Assinatura do farmacêutico</div>
      </div>
    </div>
    <div class="legal">
      Validade de <b>30 dias</b> a partir da data de emissão. Emitida em <b>2 vias</b> — 1ª via retida pela farmácia ou drogaria,
      2ª via do paciente. Substância da <b>Lista C1</b> (Portaria SVS/MS nº 344/1998 e atualizações; RDC ANVISA nº 970/2025).
      Sem rasuras. Uma via retida no ato da dispensação.
    </div>
  </div>
</div>`;
}

function buildReceitaC1Html(f: ReceitaFields): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Receita de Controle Especial — Dr. Jadson</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:10mm 12mm 10mm 12mm}
:root{--navy:#1E2A4A;--bordo:#7A1F2B;--gold:#C9A961;--goldd:#A88844;--teal:#2E7163;--ivory:#FAFAF6;--graf:#1a1a24}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;font-family:'Carlito',Arial,sans-serif;font-size:9pt;color:var(--graf)}
.wrap{display:flex;flex-direction:column;gap:5mm}
.via{border:1pt solid #ccc;border-radius:2.5mm;overflow:hidden;page-break-inside:avoid}
.head{background:linear-gradient(135deg,#26345e 0%,var(--navy) 100%);color:var(--ivory);display:flex;align-items:center;justify-content:space-between;padding:3mm 4mm;gap:4mm}
.brand{font-family:'Cormorant Garamond',Georgia,serif;font-size:15pt;font-weight:700;letter-spacing:.04em;display:block}
.tag{font-size:5.5pt;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);display:block;margin-top:.6mm}
.rt{text-align:right}
.rx{font-family:'Cormorant Garamond',Georgia,serif;font-size:11pt;font-weight:600}
.viatag{font-size:5.5pt;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-top:.8mm}
.ribbon{height:2.2mm;display:flex}
.ribbon .g{width:34%;background:var(--gold)}.ribbon .t{width:22%;background:var(--teal)}
.ribbon .b{width:22%;background:var(--bordo)}.ribbon .n{width:22%;background:var(--navy)}
.body{padding:3mm 4mm;display:flex;flex-direction:column;gap:2mm}
.box{border:1pt solid #e0d8c8;border-radius:1.5mm;padding:2mm 3mm;background:var(--ivory)}
.lbl{font-size:5.5pt;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--navy);margin-bottom:1mm}
.emit{font-size:7.5pt;line-height:1.5}
.field{display:flex;align-items:baseline;gap:2mm;border-bottom:.4pt solid var(--goldd);padding-bottom:1mm}
.k{font-size:6.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--navy);white-space:nowrap}
.v{font-size:9pt;flex:1;padding:0 1mm;min-height:4mm}
.rx-area{border:1pt solid var(--goldd);border-radius:1.5mm;padding:2mm 2mm 2mm 7mm;background:#fffdf7;position:relative}
.sym{position:absolute;top:1mm;left:1.5mm;font-size:16pt;font-family:Georgia,serif;color:var(--navy);line-height:1}
.rx-inner{display:flex;flex-direction:column;gap:1.5mm}
.rx-line{display:flex;flex-direction:column}
.qtd-row{flex-direction:row;gap:3mm}
.rx-k{font-size:5.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--navy);margin-bottom:.5mm}
.rx-v{font-size:9pt;border-bottom:.4pt solid var(--goldd);display:block;min-height:5mm;padding:0 1mm}
.poso-v{font-size:9pt;border-bottom:.4pt solid var(--goldd);display:block;min-height:9mm;padding:.5mm 1mm;white-space:pre-wrap}
.datasig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:1mm}
.data-v{font-size:8.5pt;border-bottom:.4pt solid var(--goldd);padding:0 1mm;min-width:52mm;display:inline-block}
.sig .ln{border-top:.6pt solid var(--navy);margin-bottom:1mm;margin-top:7mm;width:55mm}
.sig .nm{font-family:'Cormorant Garamond',Georgia,serif;font-size:9.5pt;font-weight:600;color:var(--navy);text-align:center}
.sig .rg{font-size:5.5pt;text-align:center;color:var(--navy)}
.disp{display:grid;grid-template-columns:1fr 1fr;gap:2mm;margin-top:1mm}
.disp .box{padding:1.5mm 2mm}
.uline{border-bottom:.4pt solid #aaa;margin-top:2.5mm}
.mini{font-size:5pt;color:#666;margin-top:.3mm}
.flex-row{display:flex;gap:2mm}
.legal{font-size:5.5pt;color:#777;line-height:1.5;border-top:.4pt solid #ddd;padding-top:1mm}
.cut{text-align:center;font-size:6pt;color:#bbb;padding:2mm 0;font-family:monospace;letter-spacing:.05em}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.cut{border:none;background:none}}
</style>
</head>
<body>
<div class="wrap">
  ${viaHtml("1ª via · Retenção da farmácia", f)}
  <div class="cut">— — — — — — — destaque aqui · 1ª via para farmácia · 2ª via do paciente — — — — — — —</div>
  ${viaHtml("2ª via · Paciente", f)}
</div>
</body>
</html>`;
}

export default function ReceitaC1Page() {
  const [f, setF] = useState<ReceitaFields>(EMPTY);
  const [showPreview, setShowPreview] = useState(false);
  const filename = `receita-c1-${dateStamp()}`;

  function set(k: keyof ReceitaFields) {
    return ({ target }: { target: { value: string } }) =>
      setF((prev) => ({ ...prev, [k]: target.value }));
  }

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildReceitaC1Html(f));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Receita C1</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Receita de Controle Especial
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Preencha os campos abaixo. A receita é gerada em <strong>2 vias</strong> (farmácia + paciente)
          conforme a Portaria SVS/MS nº 344/1998 e RDC ANVISA nº 970/2025. Imprima ou baixe o PDF
          e assine com seu certificado ICP-Brasil.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setShowPreview((v) => !v)} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            {showPreview ? "Fechar prévia" : "Visualizar"}
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setF(EMPTY)}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Dados da receita</h2>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Paciente</label>
          <Input
            value={f.pac}
            onChange={set("pac")}
            placeholder="Nome completo do paciente"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Endereço do paciente</label>
          <Input
            value={f.end}
            onChange={set("end")}
            placeholder="Endereço completo"
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">
            Medicamento / substância · concentração · forma
          </label>
          <Input
            value={f.med}
            onChange={set("med")}
            placeholder="ex.: Lamotrigina 25 mg — comprimido dispersível"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Quantidade total</label>
            <Input
              value={f.qtd}
              onChange={set("qtd")}
              placeholder="ex.: 60 comprimidos"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Quantidade por extenso</label>
            <Input
              value={f.qtde}
              onChange={set("qtde")}
              placeholder="(por extenso)"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Posologia / modo de usar</label>
          <Textarea
            value={f.poso}
            onChange={set("poso")}
            placeholder="ex.: Tomar 1 comprimido à noite, por via oral, por 7 dias; após, 1 comprimido pela manhã e 1 à noite, de uso contínuo."
            className="mt-1 min-h-[80px] resize-y"
          />
        </div>

        <div className="max-w-xs">
          <label className="text-xs font-semibold text-muted-foreground">Data</label>
          <Input
            value={f.data}
            onChange={set("data")}
            placeholder="__ de __________ de 20__"
            className="mt-1"
          />
        </div>
      </section>

      {showPreview && (
        <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização — 2 vias</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildReceitaC1Html(f)}
            className="w-full"
            style={{ height: "760px", border: "none" }}
            title="Receita C1 Preview"
          />
        </div>
      )}

      <AssinaturaIcpPanel
        filename={filename}
        signerName="Dr. Jadson Fraga Araujo Junior"
        location="Petrolina-PE"
        reason="Receita de Controle Especial - Lista C1"
        buildPdf={async () => {
          const { buildDocumentPdf } = await import("@/lib/documentPdf");
          return buildDocumentPdf({
            title: "Receita de Controle Especial - Lista C1",
            subtitle: "Portaria SVS/MS n. 344/1998 · RDC ANVISA n. 970/2025",
            credentials: [
              "Dr. Jadson Fraga Araujo Junior - CRM-PE 25.227 - RQE 17.756",
              "Neurologista Infantil / Neuropediatra",
            ],
            sections: [
              { heading: "Paciente", body: f.pac || "-" },
              { heading: "Endereco", body: f.end || "-" },
              { heading: "Medicamento", body: f.med || "-" },
              {
                heading: "Quantidade",
                body: [f.qtd, f.qtde].filter(Boolean).join(" — ") || "-",
              },
              { heading: "Posologia", body: f.poso || "-" },
              { heading: "Data", body: f.data ? `Petrolina/PE, ${f.data}` : "-" },
            ],
            footer:
              "Receita de Controle Especial (Lista C1). Validade 30 dias. Emitida em 2 vias. " +
              "Portaria SVS/MS n. 344/1998 e RDC ANVISA n. 970/2025.",
          });
        }}
      />
    </div>
  );
}

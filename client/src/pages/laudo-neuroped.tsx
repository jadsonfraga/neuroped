import { useState, useRef, type ReactNode } from "react";
import { FileText, Printer, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ────────────────────────────────────────────────────────────
   Laudo Neuropediátrico — template SuperNeuroPed
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
──────────────────────────────────────────────────────────── */

interface LaudoData {
  // Dados do paciente
  nomePaciente: string;
  dataNascimento: string;
  idadeAnos: string;
  idadeMeses: string;
  sexo: string;
  nomeMae: string;
  nomePai: string;
  dataConsulta: string;
  // Histórico
  queixaPrincipal: string;
  historiaClinica: string;
  historiaGestacional: string;
  historiaNeonatal: string;
  marcosDev: string;
  historicoFamiliar: string;
  medicamentosUso: string;
  // Exame
  exameFisico: string;
  exameNeurologico: string;
  examePsiquico: string;
  // Resultados de escalas / exames
  escalasAplicadas: string;
  examesComplementares: string;
  // Impressão / diagnóstico
  hipoteseDiagnostica: string;
  cid10: string;
  conduta: string;
  encaminhamentos: string;
  retorno: string;
  observacoes: string;
}

const emptyData = (): LaudoData => ({
  nomePaciente: "",
  dataNascimento: "",
  idadeAnos: "",
  idadeMeses: "",
  sexo: "",
  nomeMae: "",
  nomePai: "",
  dataConsulta: new Date().toLocaleDateString("pt-BR"),
  queixaPrincipal: "",
  historiaClinica: "",
  historiaGestacional: "",
  historiaNeonatal: "",
  marcosDev: "",
  historicoFamiliar: "",
  medicamentosUso: "",
  exameFisico: "",
  exameNeurologico: "",
  examePsiquico: "",
  escalasAplicadas: "",
  examesComplementares: "",
  hipoteseDiagnostica: "",
  cid10: "",
  conduta: "",
  encaminhamentos: "",
  retorno: "",
  observacoes: "",
});

function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: {
  label: string;
  name: keyof LaudoData;
  value: string;
  onChange: (n: keyof LaudoData, v: string) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none";
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      {multiline ? (
        <textarea
          rows={rows}
          className={cls}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={cls.replace("resize-none", "")}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
        />
      )}
    </label>
  );
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
    children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-border/60 bg-card/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 font-bold text-sm text-foreground hover:bg-muted/40 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-4 grid gap-3 sm:grid-cols-2">{children}</div>}
    </div>
  );
}

/* ──────────────────── Preview do laudo (HTML para impressão) ──────────────────── */
function buildPrintHtml(d: LaudoData): string {
  const today = d.dataConsulta || new Date().toLocaleDateString("pt-BR");
  const idade =
    [d.idadeAnos && d.idadeAnos + " anos", d.idadeMeses && d.idadeMeses + " meses"]
      .filter(Boolean)
      .join(" e ") || "—";

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="font-weight:600;padding:4px 12px 4px 0;white-space:nowrap;vertical-align:top">${label}:</td><td style="padding:4px 0">${value}</td></tr>`
      : "";

  const sec = (title: string, content: string) =>
    content
      ? `<div style="margin-top:18px"><div style="font-weight:700;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:#1a56db;border-bottom:1.5px solid #1a56db;padding-bottom:3px;margin-bottom:8px">${title}</div><div style="font-size:12px;line-height:1.7;white-space:pre-wrap">${content}</div></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 18mm 18mm 22mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
  .header { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:2.5px solid #1a56db; padding-bottom:10px; margin-bottom:12px; }
  .header-title { font-size:17px; font-weight:800; color:#1a56db; }
  .header-sub { font-size:10px; color:#555; margin-top:2px; }
  .header-crm { font-size:10px; color:#555; text-align:right; line-height:1.5; }
  .title-box { text-align:center; margin:14px 0; }
  .title-box h2 { font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
  table { border-collapse:collapse; font-size:12px; }
  .footer { margin-top:30px; border-top:1px solid #ccc; padding-top:14px; display:flex; justify-content:space-between; align-items:flex-end; }
  .sign-line { width:220px; border-top:1.5px solid #333; text-align:center; padding-top:4px; font-size:10px; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="header-title">SuperNeuroPed</div>
    <div class="header-sub">Plataforma de Neuropediatria Clínica</div>
  </div>
  <div class="header-crm">
    <strong>Dr. Jadson Fraga Araújo Júnior</strong><br>
    CRM-PE 25.227 | RQE 17.756<br>
    Neuropediatria
  </div>
</div>

<div class="title-box"><h2>Laudo Médico — Neuropediatria</h2></div>

<table>
  ${row("Paciente", d.nomePaciente || "—")}
  ${row("Data de nasc.", d.dataNascimento || "—")}
  ${row("Idade", idade)}
  ${row("Sexo", d.sexo || "—")}
  ${row("Mãe", d.nomeMae)}
  ${row("Pai", d.nomePai)}
  ${row("Data da consulta", today)}
</table>

${sec("Queixa principal", d.queixaPrincipal)}
${sec("História clínica", d.historiaClinica)}
${sec("História gestacional e neonatal", [d.historiaGestacional, d.historiaNeonatal].filter(Boolean).join("\n"))}
${sec("Marcos do desenvolvimento", d.marcosDev)}
${sec("Histórico familiar", d.historicoFamiliar)}
${sec("Medicamentos em uso", d.medicamentosUso)}
${sec("Exame físico", d.exameFisico)}
${sec("Exame neurológico", d.exameNeurologico)}
${sec("Exame psíquico", d.examePsiquico)}
${sec("Escalas e instrumentos aplicados", d.escalasAplicadas)}
${sec("Exames complementares", d.examesComplementares)}
${sec("Hipótese diagnóstica / CID-10", [d.hipoteseDiagnostica, d.cid10 && "CID-10: " + d.cid10].filter(Boolean).join("\n"))}
${sec("Conduta", d.conduta)}
${sec("Encaminhamentos", d.encaminhamentos)}
${sec("Retorno", d.retorno)}
${sec("Observações", d.observacoes)}

<div class="footer">
  <div style="font-size:10px;color:#666">Emitido em: ${today} — NeuroPed EDJ</div>
  <div class="sign-line">
    Dr. Jadson Fraga Araújo Júnior<br>
    CRM-PE 25.227 | RQE 17.756
  </div>
</div>
</body>
</html>`;
}

/* ──────────────────── Componente principal ──────────────────── */
export default function LaudoNeuropedPage() {
  const [data, setData] = useState<LaudoData>(emptyData());
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const set = (name: keyof LaudoData, value: string) =>
    setData((prev) => ({ ...prev, [name]: value }));

  const handlePrint = () => {
    const html = buildPrintHtml(data);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const handlePreview = () => {
    setShowPreview(true);
    setTimeout(() => {
      if (previewRef.current) {
        const doc = previewRef.current.contentDocument;
        if (doc) { doc.open(); doc.write(buildPrintHtml(data)); doc.close(); }
      }
    }, 100);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Documentos</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Laudo Neuropediátrico
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Template oficial SuperNeuroPed — Dr. Jadson Fraga Araújo Júnior · CRM-PE 25.227 · RQE 17.756
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handlePreview} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Visualizar laudo
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={() => setData(emptyData())}
          >
            <Download className="h-4 w-4 rotate-180" /> Limpar
          </Button>
        </div>
      </section>

      {/* Preview iframe */}
      {showPreview && (
        <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            ref={previewRef}
            className="w-full"
            style={{ height: "600px", border: "none" }}
            title="Laudo Preview"
          />
        </div>
      )}

      {/* Form sections */}
      <Section title="1. Identificação do Paciente">
        <Field label="Nome do Paciente" name="nomePaciente" value={data.nomePaciente} onChange={set} />
        <Field label="Data de Nascimento" name="dataNascimento" value={data.dataNascimento} onChange={set} />
        <Field label="Idade (anos)" name="idadeAnos" value={data.idadeAnos} onChange={set} />
        <Field label="Idade (meses complementares)" name="idadeMeses" value={data.idadeMeses} onChange={set} />
        <Field label="Sexo" name="sexo" value={data.sexo} onChange={set} />
        <Field label="Nome da Mãe" name="nomeMae" value={data.nomeMae} onChange={set} />
        <Field label="Nome do Pai" name="nomePai" value={data.nomePai} onChange={set} />
        <Field label="Data da Consulta" name="dataConsulta" value={data.dataConsulta} onChange={set} />
      </Section>

      <Section title="2. Anamnese">
        <div className="sm:col-span-2">
          <Field label="Queixa Principal" name="queixaPrincipal" value={data.queixaPrincipal} onChange={set} multiline rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Field label="História Clínica" name="historiaClinica" value={data.historiaClinica} onChange={set} multiline rows={5} />
        </div>
        <div className="sm:col-span-2">
          <Field label="História Gestacional" name="historiaGestacional" value={data.historiaGestacional} onChange={set} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="História Neonatal / Perinatal" name="historiaNeonatal" value={data.historiaNeonatal} onChange={set} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Marcos do Desenvolvimento" name="marcosDev" value={data.marcosDev} onChange={set} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Histórico Familiar" name="historicoFamiliar" value={data.historicoFamiliar} onChange={set} multiline rows={2} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Medicamentos em Uso" name="medicamentosUso" value={data.medicamentosUso} onChange={set} multiline rows={2} />
        </div>
      </Section>

      <Section title="3. Exame Clínico">
        <div className="sm:col-span-2">
          <Field label="Exame Físico Geral" name="exameFisico" value={data.exameFisico} onChange={set} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Exame Neurológico" name="exameNeurologico" value={data.exameNeurologico} onChange={set} multiline rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Exame Psíquico / Comportamental" name="examePsiquico" value={data.examePsiquico} onChange={set} multiline rows={3} />
        </div>
      </Section>

      <Section title="4. Escalas e Exames Complementares">
        <div className="sm:col-span-2">
          <Field label="Escalas e Instrumentos Aplicados" name="escalasAplicadas" value={data.escalasAplicadas} onChange={set} multiline rows={3} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Exames Complementares" name="examesComplementares" value={data.examesComplementares} onChange={set} multiline rows={3} />
        </div>
      </Section>

      <Section title="5. Impressão Diagnóstica e Conduta">
        <div className="sm:col-span-2">
          <Field label="Hipótese Diagnóstica" name="hipoteseDiagnostica" value={data.hipoteseDiagnostica} onChange={set} multiline rows={3} />
        </div>
        <Field label="CID-10" name="cid10" value={data.cid10} onChange={set} />
        <div className="sm:col-span-2">
          <Field label="Conduta" name="conduta" value={data.conduta} onChange={set} multiline rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Encaminhamentos" name="encaminhamentos" value={data.encaminhamentos} onChange={set} multiline rows={2} />
        </div>
        <Field label="Retorno" name="retorno" value={data.retorno} onChange={set} />
        <div className="sm:col-span-2">
          <Field label="Observações" name="observacoes" value={data.observacoes} onChange={set} multiline rows={2} />
        </div>
      </Section>

      {/* Bottom action bar */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button onClick={handlePreview} variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" /> Visualizar
        </Button>
        <Button onClick={handlePrint} size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>
    </div>
  );
          }

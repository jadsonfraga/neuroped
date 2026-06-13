import { useState } from "react";
import { Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ────────────────────────────────────────────────────────────
   Receita Especial C1 — Notificação de Receita Amarela
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
──────────────────────────────────────────────────────────── */

interface ReceitaData {
  // Paciente
  nomePaciente: string;
  enderecoP: string;
  cidadeUFP: string;
  // Médico
  nomeMedico: string;
  crm: string;
  rqe: string;
  especialidade: string;
  endereco: string;
  cidadeUF: string;
  telefone: string;
  // Prescrição
  medicamento: string;
  concentracao: string;
  formaFarm: string;
  quantidade: string;
  posologia: string;
  via: string;
  duracao: string;
  observacoes: string;
  // Data
  data: string;
  local: string;
}

const defaultData = (): ReceitaData => ({
  nomePaciente: "",
  enderecoP: "",
  cidadeUFP: "",
  nomeMedico: "Dr. Jadson Fraga Araújo Júnior",
  crm: "CRM-PE 25.227",
  rqe: "RQE 17.756",
  especialidade: "Neuropediatria",
  endereco: "",
  cidadeUF: "Recife – PE",
  telefone: "",
  medicamento: "",
  concentracao: "",
  formaFarm: "Solução oral",
  quantidade: "",
  posologia: "",
  via: "",
  duracao: "",
  observacoes: "",
  data: new Date().toLocaleDateString("pt-BR"),
  local: "Recife",
});

function buildReceita(d: ReceitaData): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  @page { size: 148mm 210mm; margin: 10mm 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1a1a1a; background: #fff; }
  .border-box { border: 2px solid #b00; border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; }
  .titulo { text-align:center; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.12em; color:#b00; margin-bottom:6px; }
  .subtitulo { text-align:center; font-size:9px; color:#555; margin-bottom:8px; }
  .header { display:flex; justify-content:space-between; margin-bottom:8px; }
  .header-medico { font-size:10px; line-height:1.5; }
  .header-medico .nome { font-size:11px; font-weight:700; color:#b00; }
  .section-label { font-size:8px; text-transform:uppercase; letter-spacing:.08em; color:#888; margin-bottom:2px; font-weight:600; }
  .section-value { font-size:11px; margin-bottom:6px; border-bottom:0.5px solid #ddd; padding-bottom:3px; min-height:16px; }
  .rx { font-size:22px; font-weight:800; color:#b00; margin-right:4px; vertical-align:middle; }
  .med-box { background:#fff8f8; border:1px solid #f5a0a0; border-radius:4px; padding:8px 10px; margin:8px 0; }
  .med-name { font-size:13px; font-weight:700; color:#b00; }
  .med-conc { font-size:10px; color:#333; margin-bottom:3px; }
  .med-posol { font-size:11px; margin-top:4px; white-space:pre-wrap; }
  .footer { margin-top:16px; display:flex; justify-content:space-between; align-items:flex-end; }
  .sign { width:160px; border-top:1.5px solid #333; text-align:center; padding-top:4px; font-size:9px; }
  .warn { font-size:7.5px; color:#666; text-align:center; margin-top:6px; border-top:0.5px solid #ccc; padding-top:4px; }
  .cns-box { display:flex; gap:6px; margin-top:4px; }
  .cns-item { font-size:9px; border:1px solid #ccc; border-radius:3px; padding:2px 6px; flex:1; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>

<div class="border-box">
  <div class="titulo">Notificação de Receita — Lista C1</div>
  <div class="subtitulo">Receita Especial — Válida em todo o território nacional por 30 dias</div>

  <!-- Médico -->
  <div class="header-medico">
    <div class="nome">${d.nomeMedico}</div>
    <div>${d.crm} | ${d.rqe} — ${d.especialidade}</div>
    <div>${d.endereco || "—"} &nbsp;·&nbsp; ${d.cidadeUF} &nbsp;·&nbsp; ${d.telefone || "—"}</div>
  </div>
</div>

<!-- Paciente -->
<div style="margin-bottom:10px">
  <div class="section-label">Paciente</div>
  <div class="section-value">${d.nomePaciente || "—"}</div>
  <div class="section-label">Endereço</div>
  <div class="section-value">${d.enderecoP || "—"}</div>
  <div class="section-label">Cidade / UF</div>
  <div class="section-value">${d.cidadeUFP || "—"}</div>
</div>

<!-- Prescrição -->
<div style="margin-bottom:10px">
  <span class="rx">Rp</span>
  <div class="med-box">
    <div class="med-name">${d.medicamento || "— medicamento —"}</div>
    <div class="med-conc">${[d.concentracao, d.formaFarm].filter(Boolean).join(" · ")}</div>
    <div class="med-conc">Qtd: ${d.quantidade || "—"}</div>
    <div class="med-posol">${d.posologia || "—"}
${d.via ? "Via: " + d.via : ""}${d.duracao ? "\nDuração: " + d.duracao : ""}</div>
  </div>
  ${d.observacoes ? '<div style="font-size:10px;margin-top:4px"><strong>Obs:</strong> ' + d.observacoes + '</div>' : ""}
</div>

<!-- Uso médico -->
<div class="cns-box">
  <div class="cns-item"><strong>1ª via — Farmácia</strong></div>
  <div class="cns-item"><strong>2ª via — Paciente</strong></div>
</div>

<div class="footer">
  <div style="font-size:9px;color:#555">
    Local: ${d.local || "—"} &nbsp; Data: ${d.data}
  </div>
  <div class="sign">
    ${d.nomeMedico}<br>
    ${d.crm}
  </div>
</div>

<div class="warn">
  ⚠ Uso sujeito a controle especial (Portaria SVS/MS nº 344/1998 e atualizações).
  Receita válida por 30 dias a partir da data de emissão.
</div>

</body>
</html>`;
}

function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  rows = 2,
  colSpan = false,
}: {
  label: string;
  name: keyof ReceitaData;
  value: string;
  onChange: (n: keyof ReceitaData, v: string) => void;
  multiline?: boolean;
  rows?: number;
  colSpan?: boolean;
}) {
  const cls =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none";
  return (
    <label className={"flex flex-col gap-1 text-sm" + (colSpan ? " sm:col-span-2" : "")}>
      <span className="font-semibold text-foreground">{label}</span>
      {multiline ? (
        <textarea rows={rows} className={cls} value={value} onChange={(e) => onChange(name, e.target.value)} />
      ) : (
        <input type="text" className={cls.replace("resize-none", "")} value={value} onChange={(e) => onChange(name, e.target.value)} />
      )}
    </label>
  );
}

export default function ReceitaC1Page() {
  const [data, setData] = useState<ReceitaData>(defaultData());
  const set = (name: keyof ReceitaData, value: string) =>
    setData((prev) => ({ ...prev, [name]: value }));

  const handlePrint = () => {
    const html = buildReceita(data);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <section className="rounded-3xl border border-border bg-card/75 p-5 shadow-sm sm:p-6">
        <Badge variant="outline" className="w-fit">Documentos</Badge>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">
          Receita Especial C1
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Notificação de receita para medicamentos da Lista C1 — Portaria SVS/MS nº 344/1998.
          Dr. Jadson Fraga · CRM-PE 25.227 · RQE 17.756
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setData(defaultData())}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </section>

      {/* Paciente */}
      <div className="rounded-xl border border-border/60 bg-card/70 p-4">
        <h2 className="font-bold text-sm text-foreground mb-3">Dados do Paciente</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do Paciente" name="nomePaciente" value={data.nomePaciente} onChange={set} colSpan />
          <Field label="Endereço" name="enderecoP" value={data.enderecoP} onChange={set} colSpan />
          <Field label="Cidade / UF" name="cidadeUFP" value={data.cidadeUFP} onChange={set} />
        </div>
      </div>

      {/* Médico */}
      <div className="rounded-xl border border-border/60 bg-card/70 p-4">
        <h2 className="font-bold text-sm text-foreground mb-3">Dados do Médico</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome do Médico" name="nomeMedico" value={data.nomeMedico} onChange={set} colSpan />
          <Field label="CRM" name="crm" value={data.crm} onChange={set} />
          <Field label="RQE" name="rqe" value={data.rqe} onChange={set} />
          <Field label="Especialidade" name="especialidade" value={data.especialidade} onChange={set} />
          <Field label="Endereço do consultório" name="endereco" value={data.endereco} onChange={set} colSpan />
          <Field label="Cidade / UF" name="cidadeUF" value={data.cidadeUF} onChange={set} />
          <Field label="Telefone" name="telefone" value={data.telefone} onChange={set} />
        </div>
      </div>

      {/* Prescrição */}
      <div className="rounded-xl border border-border/60 bg-card/70 p-4">
        <h2 className="font-bold text-sm text-foreground mb-3">Prescrição</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Medicamento (nome genérico)" name="medicamento" value={data.medicamento} onChange={set} colSpan />
          <Field label="Concentração" name="concentracao" value={data.concentracao} onChange={set} />
          <Field label="Forma farmacêutica" name="formaFarm" value={data.formaFarm} onChange={set} />
          <Field label="Quantidade / Volume total" name="quantidade" value={data.quantidade} onChange={set} />
          <Field label="Via de administração" name="via" value={data.via} onChange={set} />
          <Field label="Posologia (dose e horários)" name="posologia" value={data.posologia} onChange={set} multiline rows={3} colSpan />
          <Field label="Duração do tratamento" name="duracao" value={data.duracao} onChange={set} />
          <Field label="Observações" name="observacoes" value={data.observacoes} onChange={set} multiline rows={2} colSpan />
        </div>
      </div>

      {/* Data e local */}
      <div className="rounded-xl border border-border/60 bg-card/70 p-4">
        <h2 className="font-bold text-sm text-foreground mb-3">Emissão</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Local" name="local" value={data.local} onChange={set} />
          <Field label="Data" name="data" value={data.data} onChange={set} />
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button onClick={handlePrint} size="sm" className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        ⚠️ Receita de controle especial — emitir em 2 vias. 1ª via retida na farmácia, 2ª via entregue ao paciente.
        Válida por 30 dias. Portaria SVS/MS nº 344/1998.
      </p>
    </div>
  );
}

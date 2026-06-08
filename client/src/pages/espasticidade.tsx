import { useState } from "react";
import { Activity, Printer, Mail, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const EMAIL_TO = "jadsonfraga@hotmail.com";

const MUSCLE_GROUPS = [
  "Flexores de cotovelo",
  "Flexores de punho",
  "Adutores de quadril",
  "Flexores de joelho",
  "Flexores plantares",
];

const ASHWORTH_GRADES = ["0", "1", "1+", "2", "3", "4"];
const TARDIEU_QUALITY = ["0", "1", "2", "3", "4", "5"];

// Paleta única dos laudos imprimíveis (fonte de verdade — evita cores cruas repetidas).
const PRINT_INK = "#1a1a1a";
const PRINT_BRAND = "#6d28d9";
const PRINT_SUB = "#555";
const PRINT_FIELD_BG = "#f8f7ff";
const PRINT_FIELD_BORDER = "#e5e7eb";
const PRINT_LABEL = "#888";
const PRINT_ROW_BORDER = "#eee";
const PRINT_ROW_ALT = "#faf9ff";
const PRINT_NOTE_BG = "#f3f0ff";

const PRINT_STYLE = `
  @page{margin:2cm;size:A4;}*{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:11pt;color:${PRINT_INK};}
  .header{border-bottom:3px solid ${PRINT_BRAND};padding-bottom:12px;margin-bottom:16px;}
  .header h1{font-size:15pt;color:${PRINT_BRAND};}
  .header .sub{font-size:10pt;color:${PRINT_SUB};margin-top:4px;}
  .pg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:16px;font-size:10pt;}
  .pg .f{background:${PRINT_FIELD_BG};border:1px solid ${PRINT_FIELD_BORDER};border-radius:4px;padding:6px 10px;}
  .pg .f .l{font-size:8pt;color:${PRINT_LABEL};}.pg .f .v{font-weight:bold;}
  table{width:100%;border-collapse:collapse;font-size:10pt;margin-top:10px;}
  th{background:${PRINT_BRAND};color:white;padding:6px 10px;text-align:left;}
  td{padding:5px 10px;border-bottom:1px solid ${PRINT_ROW_BORDER};}
  tr:nth-child(even){background:${PRINT_ROW_ALT};}
  .scale{background:${PRINT_NOTE_BG};border-left:4px solid ${PRINT_BRAND};padding:8px 12px;margin:12px 0;font-size:9pt;}
  .footer{margin-top:24px;border-top:2px solid ${PRINT_BRAND};padding-top:10px;font-size:9pt;color:${PRINT_SUB};text-align:center;}
  .footer .doc{font-size:10pt;font-weight:bold;color:${PRINT_INK};}
  @media print{body{padding:0;}}
`;

interface AshworthRow {
  msd: string;
  mse: string;
  mid: string;
  mie: string;
}

interface TardieuRow {
  r2: string;
  r1: string;
  quality: string;
}

interface PatientInfo {
  nome: string;
  nascimento: string;
  data: string;
  examinador: string;
}

// ── Patient header ────────────────────────────────────────────────────────

function PatientHeaderForm({
  value,
  onChange,
}: {
  value: PatientInfo;
  onChange: (v: PatientInfo) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="space-y-1">
        <Label className="text-xs">Nome do Paciente</Label>
        <Input
          className="h-8 text-xs"
          value={value.nome}
          onChange={(e) => onChange({ ...value, nome: e.target.value })}
          placeholder="Nome completo"
          data-testid="input-patient-name-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data de Nascimento</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.nascimento}
          onChange={(e) => onChange({ ...value, nascimento: e.target.value })}
          data-testid="input-dob-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Data da Avaliação</Label>
        <Input
          type="date"
          className="h-8 text-xs"
          value={value.data}
          onChange={(e) => onChange({ ...value, data: e.target.value })}
          data-testid="input-date-esp"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Examinador(a)</Label>
        <Input
          className="h-8 text-xs"
          value={value.examinador}
          onChange={(e) => onChange({ ...value, examinador: e.target.value })}
          placeholder="Nome do profissional"
          data-testid="input-examiner-esp"
        />
      </div>
    </div>
  );
}

// ── Ashworth Tab ─────────────────────────────────────────────────────────

function AshworthTab() {
  const [patient, setPatient] = useState<PatientInfo>({
    nome: "",
    nascimento: "",
    data: new Date().toISOString().slice(0, 10),
    examinador: "",
  });
  const [rows, setRows] = useState<Record<string, AshworthRow>>(
    Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, { msd: "", mse: "", mid: "", mie: "" }]))
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  function setCell(group: string, col: keyof AshworthRow, val: string) {
    setRows((prev) => ({ ...prev, [group]: { ...prev[group], [col]: val } }));
  }

  function buildHtml() {
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const rowsHtml = MUSCLE_GROUPS.map((g) => {
      const r = rows[g];
      return `<tr><td>${g}</td><td style="text-align:center">${r.msd || "—"}</td><td style="text-align:center">${r.mse || "—"}</td><td style="text-align:center">${r.mid || "—"}</td><td style="text-align:center">${r.mie || "—"}</td></tr>`;
    }).join("");
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Ashworth Modificada</title>
<style>${PRINT_STYLE}</style></head><body>
<div class="header"><h1>🧠 NeuroPed — Escala de Ashworth Modificada</h1><div class="sub">Data: ${dateStr}</div></div>
<div class="pg">
  <div class="f"><div class="l">Paciente</div><div class="v">${patient.nome || "—"}</div></div>
  <div class="f"><div class="l">Nascimento</div><div class="v">${patient.nascimento ? new Date(patient.nascimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
  <div class="f"><div class="l">Data da Avaliação</div><div class="v">${patient.data ? new Date(patient.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
  <div class="f"><div class="l">Examinador(a)</div><div class="v">${patient.examinador || "—"}</div></div>
</div>
<div class="scale"><strong>Escala:</strong> 0=sem aumento do tônus | 1=leve catch no final da ADM | 1+=catch + resistência em menos de 50% da ADM | 2=aumento acentuado do tônus, mas parte passiva fácil | 3=movimento passivo difícil | 4=rigidez em flexão ou extensão</div>
<table><thead><tr><th>Grupo Muscular</th><th>MSD</th><th>MSE</th><th>MID</th><th>MIE</th></tr></thead>
<tbody>${rowsHtml}</tbody></table>
<div class="footer"><div class="doc">Dr. Jadson Fraga Araújo Júnior</div>CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>NeuroPed — Escalas de Neuropediatria</div>
</body></html>`;
  }

  function buildText() {
    let t = `ESCALA DE ASHWORTH MODIFICADA\n`;
    t += `Paciente: ${patient.nome || "—"} | Nasc: ${patient.nascimento || "—"} | Data: ${patient.data || "—"} | Examinador: ${patient.examinador || "—"}\n\n`;
    MUSCLE_GROUPS.forEach((g) => {
      const r = rows[g];
      t += `${g}: MSD=${r.msd || "—"} MSE=${r.mse || "—"} MID=${r.mid || "—"} MIE=${r.mie || "—"}\n`;
    });
    t += `\n---\nDr. Jadson Fraga — Neuropediatra | NeuroPed\n`;
    return t;
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Erro", description: "Pop-up bloqueado.", variant: "destructive" }); return; }
    win.document.write(buildHtml());
    win.document.close();
    win.onload = () => win.print();
    toast({ title: "Impressão", description: "Janela de impressão aberta." });
  }

  async function handleEmail() {
    setSending(true);
    const subject = `[NeuroPed] Ashworth Modificada — ${patient.nome || "Paciente"} — ${new Date().toLocaleDateString("pt-BR")}`;
    const body = buildText();
    try {
      const res = await apiRequest("POST", "/api/send-report", { subject, body });
      if (res.ok) {
        setSent(true); toast({ title: "Enviado", description: `Relatório enviado para ${EMAIL_TO}` }); setSending(false); return;
      }
    } catch { /* envio via API falhou — cai no fallback mailto abaixo */ }
    window.open(`mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`, "_blank");
    setSent(true); toast({ title: "Email aberto", description: "Seu app de email foi aberto." }); setSending(false);
  }

  return (
    <div className="space-y-4">
      <PatientHeaderForm value={patient} onChange={setPatient} />

      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3">
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>Escala de Ashworth Modificada:</strong>{" "}
          0 = sem aumento | 1 = catch leve no fim | 1+ = catch + resistência &lt;50% da ADM | 2 = aumento acentuado, mas mobilização passiva possível | 3 = mobilização passiva difícil | 4 = rígido
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="text-left p-2 border border-border font-semibold">Grupo Muscular</th>
              {["MSD", "MSE", "MID", "MIE"].map((col) => (
                <th key={col} className="text-center p-2 border border-border font-semibold w-[18%]">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((g) => (
              <tr key={g} className="hover:bg-muted/20">
                <td className="p-2 border border-border font-medium">{g}</td>
                {(["msd", "mse", "mid", "mie"] as const).map((col) => (
                  <td key={col} className="p-1 border border-border text-center">
                    <Select
                      value={rows[g]?.[col] || ""}
                      onValueChange={(v) => setCell(g, col, v)}
                    >
                      <SelectTrigger className="h-7 text-xs" data-testid={`sel-ash-${g}-${col}`}>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASHWORTH_GRADES.map((gr) => (
                          <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button onClick={handlePrint} className="flex-1 gap-2 h-9" data-testid="button-print-ashworth">
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </Button>
        <Button variant="outline" onClick={handleEmail} disabled={sending || sent} className="flex-1 gap-2 h-9" data-testid="button-email-ashworth">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {sent ? "Enviado" : sending ? "Enviando..." : "Enviar Email"}
        </Button>
      </div>
    </div>
  );
}

// ── Tardieu Tab ────────────────────────────────────────────────────────────

function TardieuTab() {
  const [patient, setPatient] = useState<PatientInfo>({
    nome: "",
    nascimento: "",
    data: new Date().toISOString().slice(0, 10),
    examinador: "",
  });
  const [rows, setRows] = useState<Record<string, TardieuRow>>(
    Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, { r2: "", r1: "", quality: "" }]))
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  function setCell(group: string, col: keyof TardieuRow, val: string) {
    setRows((prev) => ({ ...prev, [group]: { ...prev[group], [col]: val } }));
  }

  function getDynamic(group: string): string {
    const r = rows[group];
    const r2 = parseFloat(r.r2);
    const r1 = parseFloat(r.r1);
    if (isNaN(r2) || isNaN(r1)) return "—";
    return `${(r2 - r1).toFixed(0)}°`;
  }

  function buildHtml() {
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const rowsHtml = MUSCLE_GROUPS.map((g) => {
      const r = rows[g];
      return `<tr><td>${g}</td><td style="text-align:center">${r.r2 ? r.r2 + "°" : "—"}</td><td style="text-align:center">${r.r1 ? r.r1 + "°" : "—"}</td><td style="text-align:center">${getDynamic(g)}</td><td style="text-align:center">${r.quality || "—"}</td></tr>`;
    }).join("");
    return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Tardieu Modificada</title>
<style>${PRINT_STYLE}</style></head><body>
<div class="header"><h1>🧠 NeuroPed — Escala de Tardieu Modificada</h1><div class="sub">Data: ${dateStr}</div></div>
<div class="pg">
  <div class="f"><div class="l">Paciente</div><div class="v">${patient.nome || "—"}</div></div>
  <div class="f"><div class="l">Nascimento</div><div class="v">${patient.nascimento ? new Date(patient.nascimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
  <div class="f"><div class="l">Data da Avaliação</div><div class="v">${patient.data ? new Date(patient.data + "T00:00:00").toLocaleDateString("pt-BR") : "—"}</div></div>
  <div class="f"><div class="l">Examinador(a)</div><div class="v">${patient.examinador || "—"}</div></div>
</div>
<div class="scale"><strong>Escala de Qualidade (X):</strong> 0=sem resistência | 1=leve resistência sem catch | 2=catch claro em velocidade específica | 3=clônus fatigável (&lt;10s) | 4=clônus não fatigável (≥10s) | 5=segmento imóvel. <br><strong>Componente Dinâmico = R2 – R1</strong> (quanto maior, maior a espasticidade dinâmica)</div>
<table><thead><tr><th>Grupo Muscular</th><th>R2 (Passivo)</th><th>R1 (Catch)</th><th>Din. (R2–R1)</th><th>Qualidade (X)</th></tr></thead>
<tbody>${rowsHtml}</tbody></table>
<div class="footer"><div class="doc">Dr. Jadson Fraga Araújo Júnior</div>CRM-PE 25227 | CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>NeuroPed — Escalas de Neuropediatria</div>
</body></html>`;
  }

  function buildText() {
    let t = `ESCALA DE TARDIEU MODIFICADA\n`;
    t += `Paciente: ${patient.nome || "—"} | Nasc: ${patient.nascimento || "—"} | Data: ${patient.data || "—"} | Examinador: ${patient.examinador || "—"}\n\n`;
    MUSCLE_GROUPS.forEach((g) => {
      const r = rows[g];
      t += `${g}: R2=${r.r2 || "—"}° R1=${r.r1 || "—"}° Dinâmico=${getDynamic(g)} Qualidade=${r.quality || "—"}\n`;
    });
    t += `\n---\nDr. Jadson Fraga — Neuropediatra | NeuroPed\n`;
    return t;
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) { toast({ title: "Erro", description: "Pop-up bloqueado.", variant: "destructive" }); return; }
    win.document.write(buildHtml());
    win.document.close();
    win.onload = () => win.print();
    toast({ title: "Impressão", description: "Janela de impressão aberta." });
  }

  async function handleEmail() {
    setSending(true);
    const subject = `[NeuroPed] Tardieu Modificada — ${patient.nome || "Paciente"} — ${new Date().toLocaleDateString("pt-BR")}`;
    const body = buildText();
    try {
      const res = await apiRequest("POST", "/api/send-report", { subject, body });
      if (res.ok) {
        setSent(true); toast({ title: "Enviado", description: `Relatório enviado para ${EMAIL_TO}` }); setSending(false); return;
      }
    } catch { /* envio via API falhou — cai no fallback mailto abaixo */ }
    window.open(`mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.slice(0, 1800))}`, "_blank");
    setSent(true); toast({ title: "Email aberto", description: "Seu app de email foi aberto." }); setSending(false);
  }

  return (
    <div className="space-y-4">
      <PatientHeaderForm value={patient} onChange={setPatient} />

      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3">
        <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
          <strong>Escala de Qualidade (X):</strong> 0=sem resistência | 1=resistência leve sem catch | 2=catch claro | 3=clônus fatigável (&lt;10s) | 4=clônus não fatigável (≥10s) | 5=segmento imóvel.{" "}
          <strong>Componente Dinâmico = R2 – R1</strong> (estimativa da espasticidade dinâmica).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60">
              <th className="text-left p-2 border border-border font-semibold">Grupo Muscular</th>
              <th className="text-center p-2 border border-border font-semibold w-[15%]">R2 (°)</th>
              <th className="text-center p-2 border border-border font-semibold w-[15%]">R1 (°)</th>
              <th className="text-center p-2 border border-border font-semibold w-[16%]">Din. (R2–R1)</th>
              <th className="text-center p-2 border border-border font-semibold w-[18%]">Qualidade (X)</th>
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map((g) => (
              <tr key={g} className="hover:bg-muted/20">
                <td className="p-2 border border-border font-medium">{g}</td>
                <td className="p-1 border border-border text-center">
                  <Input
                    type="number"
                    className="h-7 text-xs text-center"
                    value={rows[g]?.r2 || ""}
                    onChange={(e) => setCell(g, "r2", e.target.value)}
                    placeholder="—"
                    data-testid={`input-r2-${g}`}
                  />
                </td>
                <td className="p-1 border border-border text-center">
                  <Input
                    type="number"
                    className="h-7 text-xs text-center"
                    value={rows[g]?.r1 || ""}
                    onChange={(e) => setCell(g, "r1", e.target.value)}
                    placeholder="—"
                    data-testid={`input-r1-${g}`}
                  />
                </td>
                <td className="p-2 border border-border text-center font-semibold text-primary">
                  {getDynamic(g)}
                </td>
                <td className="p-1 border border-border text-center">
                  <Select
                    value={rows[g]?.quality || ""}
                    onValueChange={(v) => setCell(g, "quality", v)}
                  >
                    <SelectTrigger className="h-7 text-xs" data-testid={`sel-tq-${g}`}>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARDIEU_QUALITY.map((q) => (
                        <SelectItem key={q} value={q}>{q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button onClick={handlePrint} className="flex-1 gap-2 h-9" data-testid="button-print-tardieu">
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </Button>
        <Button variant="outline" onClick={handleEmail} disabled={sending || sent} className="flex-1 gap-2 h-9" data-testid="button-email-tardieu">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {sent ? "Enviado" : sending ? "Enviando..." : "Enviar Email"}
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function EspasticidadePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Avaliação de Espasticidade</h1>
          <p className="text-xs text-muted-foreground">
            Escala de Ashworth Modificada e Escala de Tardieu Modificada
          </p>
        </div>
      </div>

      <Card className="border-card-border">
        <CardContent className="p-4">
          <Tabs defaultValue="ashworth">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="ashworth" className="flex-1 text-xs" data-testid="tab-ashworth">
                Ashworth Modificada
              </TabsTrigger>
              <TabsTrigger value="tardieu" className="flex-1 text-xs" data-testid="tab-tardieu">
                Tardieu Modificada
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ashworth">
              <AshworthTab />
            </TabsContent>
            <TabsContent value="tardieu">
              <TardieuTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
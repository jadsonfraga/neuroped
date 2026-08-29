import { cloneElement, isValidElement, useState, useCallback, useEffect, useRef, type ReactElement, type ReactNode } from "react";
import {
  User, Users, Baby, Stethoscope, FileText, PlusCircle, Trash2,
  Activity, MessageSquare, Pill, Dumbbell, FlaskConical,
  Printer, Copy, CheckCircle2, AlertTriangle, Clock, Save,
  TrendingUp, Heart, School, ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { softTap, softSuccess, softError, softBell } from "@/lib/softSounds";
import { getRouteQueryParam } from "@/lib/utils";
import { haptic } from "@/lib/haptic";
import { escapeHtml, escapeHtmlWithBreaks } from "@/lib/htmlEscape";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";

// ─── helpers ────────────────────────────────────────────────────────────────

// Data LOCAL em YYYY-MM-DD (não UTC). `toISOString()` usa UTC e, no fuso do
// Brasil (UTC-3), após ~21h retornava a data de AMANHÃ como padrão da consulta.
function localISODate(d = new Date()): string {
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().split("T")[0];
}
const today = localISODate();

// Exibe uma data "YYYY-MM-DD" (input date) sem o desvio de fuso: `new Date("YYYY-
// MM-DD")` é interpretada como meia-noite UTC e recuava um dia no horário do
// Brasil. Ancorar ao meio-dia local resolve (mesmo padrão já usado p/ nascimento).
function formatInputDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

function uid() {
  return crypto.randomUUID();
}

// ─── types ──────────────────────────────────────────────────────────────────

interface Medicacao {
  id: string;
  nome: string;
  dose: string;
  posologia: string;
  peso: string;
  dataInicio: string;
  objetivo: string;
  resposta: string;
  efeitosAdversos: string;
}

interface Terapia {
  id: string;
  tipo: string;
  profissional: string;
  frequencia: string;
  local: string;
  objetivo: string;
  inicio: string;
  evolucao: string;
}

interface Exame {
  id: string;
  tipo: string;
  data: string;
  resultado: string;
  status: string;
}

interface Marcos {
  sustentouCabeca: string;
  sentouSemApoio: string;
  engatinhou: string;
  ficouEmPe: string;
  andouSozinho: string;
  balbucio: string;
  primeiraspalavras: string;
  frasesDuasPalavras: string;
  linguagemFluente: string;
  sorrisoSocial: string;
  apontar: string;
  esfincteriDiurno: string;
  esfincteriNoturno: string;
  regressao: string;
  regressaoDesc: string;
  crises: string;
  crisesDesc: string;
}

interface Identificacao {
  nomeCompleto: string;
  dataNascimento: string;
  sexo: string;
  nomeResponsavel: string;
  parentesco: string;
  telefone: string;
  email: string;
  convenio: string;
  medicoResponsavel: string;
  cid: string;
  hipoteseDiagnostica: string;
  dataConsulta: string;
}

interface Anamnese {
  queixaPrincipal: string;
  gestacional: string;
  perinatal: string;
  patologicos: string;
  familiares: string;
  escolar: string;
}

type StoredClinicalEvent = {
  id: string;
  eventType: string;
  status: string;
  occurredAt: string;
  note?: string;
  data?: Record<string, unknown>;
};

const anamneseKeys: (keyof Anamnese)[] = [
  "queixaPrincipal", "gestacional", "perinatal", "patologicos", "familiares", "escolar",
];
const marcoKeys: (keyof Marcos)[] = [
  "sustentouCabeca", "sentouSemApoio", "engatinhou", "ficouEmPe", "andouSozinho",
  "balbucio", "primeiraspalavras", "frasesDuasPalavras", "linguagemFluente",
  "sorrisoSocial", "apontar", "esfincteriDiurno", "esfincteriNoturno",
  "regressao", "regressaoDesc", "crises", "crisesDesc",
];

function patientIdFromQuery(): string {
  return getRouteQueryParam("patientId");
}

function parseClinicalNote(note: unknown): Record<string, unknown> {
  if (typeof note !== "string" || !note.trim()) return {};
  try {
    const parsed = JSON.parse(note);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

// ─── milestone definitions ───────────────────────────────────────────────────

interface MilestoneConfig {
  key: keyof Marcos;
  label: string;
  domain: "Motor" | "Linguagem" | "Social/Adaptativo";
  greenMin: number;
  greenMax: number;
  yellowMax: number;
  unit?: string;
}

const milestoneConfigs: MilestoneConfig[] = [
  { key: "sustentouCabeca",    label: "Sustentou a cabeça",           domain: "Motor",             greenMin: 2, greenMax: 4,  yellowMax: 6  },
  { key: "sorrisoSocial",      label: "Sorriso social",               domain: "Social/Adaptativo", greenMin: 1, greenMax: 3,  yellowMax: 5  },
  { key: "balbucio",           label: "Balbucio",                     domain: "Linguagem",         greenMin: 4, greenMax: 9,  yellowMax: 12 },
  { key: "sentouSemApoio",     label: "Sentou sem apoio",             domain: "Motor",             greenMin: 6, greenMax: 8,  yellowMax: 10 },
  { key: "engatinhou",         label: "Engatinhou",                   domain: "Motor",             greenMin: 7, greenMax: 10, yellowMax: 13 },
  { key: "ficouEmPe",          label: "Ficou em pé com apoio",        domain: "Motor",             greenMin: 9, greenMax: 12, yellowMax: 15 },
  { key: "primeiraspalavras",  label: "Primeiras palavras",           domain: "Linguagem",         greenMin: 10, greenMax: 18, yellowMax: 24 },
  { key: "apontar",            label: "Apontar para pedir",           domain: "Social/Adaptativo", greenMin: 10, greenMax: 14, yellowMax: 18 },
  { key: "andouSozinho",       label: "Andou sozinho",                domain: "Motor",             greenMin: 12, greenMax: 18, yellowMax: 24 },
  { key: "frasesDuasPalavras", label: "Frases de 2 palavras",         domain: "Linguagem",         greenMin: 18, greenMax: 30, yellowMax: 36 },
  { key: "esfincteriDiurno",   label: "Controle esfincteriano diurno",domain: "Social/Adaptativo", greenMin: 24, greenMax: 36, yellowMax: 42 },
  { key: "linguagemFluente",   label: "Linguagem fluente",            domain: "Linguagem",         greenMin: 30, greenMax: 48, yellowMax: 60 },
  { key: "esfincteriNoturno",  label: "Controle esfincteriano noturno",domain:"Social/Adaptativo", greenMin: 36, greenMax: 60, yellowMax: 72 },
];

type MilestoneStatus = "normal" | "borderline" | "delayed" | "missing";

function getMilestoneStatus(value: string, cfg: MilestoneConfig): MilestoneStatus {
  const v = value.trim().toLowerCase();
  if (!v || v === "") return "missing";
  if (v === "não engatinhou" || v === "nao engatinhou") return "borderline";
  const n = parseInt(v, 10);
  if (isNaN(n)) return "missing";
  if (n <= cfg.greenMax) return "normal";
  if (n <= cfg.yellowMax) return "borderline";
  return "delayed";
}

const statusColors: Record<MilestoneStatus, { dot: string; bg: string; text: string; label: string }> = {
  normal:     { dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", label: "Adequado"  },
  borderline: { dot: "bg-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30",     text: "text-amber-700 dark:text-amber-400",     label: "Limítrofe" },
  delayed:    { dot: "bg-red-500",      bg: "bg-red-50 dark:bg-red-950/30",         text: "text-red-700 dark:text-red-400",         label: "Atrasado"  },
  missing:    { dot: "bg-gray-300",     bg: "bg-gray-50 dark:bg-gray-900/30",       text: "text-gray-400",                          label: "—"         },
};

const _domainColors: Record<string, string> = {
  "Motor":            "from-blue-500 to-cyan-500",
  "Linguagem":        "from-violet-500 to-purple-500",
  "Social/Adaptativo":"from-pink-500 to-rose-500",
};
const domainBg: Record<string, string> = {
  "Motor":            "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  "Linguagem":        "bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
  "Social/Adaptativo":"bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300",
};

// ─── Tab completion counters ─────────────────────────────────────────────────

function countIdentificacao(id: Identificacao) {
  const vals = Object.values(id).filter(v => v.trim() !== "");
  return vals.length;
}
function countAnamnese(a: Anamnese) {
  return Object.values(a).filter(v => v.trim() !== "").length;
}
function countMarcos(m: Marcos) {
  const keys: (keyof Marcos)[] = [
    "sustentouCabeca","sentouSemApoio","engatinhou","ficouEmPe","andouSozinho",
    "balbucio","primeiraspalavras","frasesDuasPalavras","linguagemFluente",
    "sorrisoSocial","apontar","esfincteriDiurno","esfincteriNoturno",
  ];
  return keys.filter(k => m[k].trim() !== "").length;
}

// ─── section header helper ────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, gradient, count }: {
  icon: any; title: string; gradient: string; count?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-sm mb-4`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="font-semibold text-sm">{title}</span>
      {count && <Badge className="ml-auto bg-white/25 text-white border-0 text-xs">{count}</Badge>}
    </div>
  );
}

// ─── field row ────────────────────────────────────────────────────────────────

function Field({ label, children, span2 }: { label: string; children: ReactNode; span2?: boolean }) {
  const labelledControl = isValidElement(children)
    ? cloneElement(children as ReactElement<{ "aria-label"?: string }>, {
        "aria-label": (children as ReactElement<{ "aria-label"?: string }>).props["aria-label"] ?? label,
      })
    : children;
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <Label className="text-xs font-semibold text-muted-foreground mb-1 block" aria-hidden="true">{label}</Label>
      {labelledControl}
    </div>
  );
}

// ─── report generation ────────────────────────────────────────────────────────

function buildReport(
  id: Identificacao,
  anamnese: Anamnese,
  marcos: Marcos,
  medicacoes: Medicacao[],
  terapias: Terapia[],
  exames: Exame[]
): string {
  const linha = "─".repeat(60);
  const dateStr = formatInputDate(id.dataConsulta || today);

  let r = "";
  r += `RELATÓRIO MÉDICO — DR. JADSON FRAGA ARAÚJO JÚNIOR\n`;
  r += `Neuropediatra | CRM-PE 25227 · CRM-BA 23384 | RQE 17756 / 14499 / 13119\n`;
  r += `NeuroPed — Escalas de Neuropediatria\n`;
  r += `${linha}\n\n`;

  r += `IDENTIFICAÇÃO DO PACIENTE\n`;
  r += `${linha}\n`;
  r += `Paciente:          ${id.nomeCompleto || "—"}\n`;
  r += `Data de nasc.:     ${id.dataNascimento ? new Date(id.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}\n`;
  r += `Sexo:              ${id.sexo || "—"}\n`;
  r += `Responsável:       ${id.nomeResponsavel || "—"} (${id.parentesco || "—"})\n`;
  r += `Telefone:          ${id.telefone || "—"}\n`;
  r += `E-mail:            ${id.email || "—"}\n`;
  r += `Convênio/SUS:      ${id.convenio || "—"}\n`;
  r += `Médico resp.:      ${id.medicoResponsavel || "—"}\n`;
  r += `CID principal:     ${id.cid || "—"}\n`;
  r += `Hipótese diagn.:   ${id.hipoteseDiagnostica || "—"}\n`;
  r += `Data da consulta:  ${dateStr}\n\n`;

  r += `ANAMNESE\n`;
  r += `${linha}\n`;
  if (anamnese.queixaPrincipal) r += `Queixa principal e HDA:\n${anamnese.queixaPrincipal}\n\n`;
  if (anamnese.gestacional)    r += `Antecedentes gestacionais:\n${anamnese.gestacional}\n\n`;
  if (anamnese.perinatal)      r += `Antecedentes perinatais:\n${anamnese.perinatal}\n\n`;
  if (anamnese.patologicos)    r += `Antecedentes patológicos:\n${anamnese.patologicos}\n\n`;
  if (anamnese.familiares)     r += `Antecedentes familiares:\n${anamnese.familiares}\n\n`;
  if (anamnese.escolar)        r += `Histórico escolar:\n${anamnese.escolar}\n\n`;

  r += `MARCOS DO NEURODESENVOLVIMENTO\n`;
  r += `${linha}\n`;
  const marcoLabels: { label: string; key: keyof Marcos }[] = [
    { label: "Sustentou a cabeça",             key: "sustentouCabeca"    },
    { label: "Sentou sem apoio",               key: "sentouSemApoio"     },
    { label: "Engatinhou",                     key: "engatinhou"         },
    { label: "Ficou em pé com apoio",          key: "ficouEmPe"          },
    { label: "Andou sozinho",                  key: "andouSozinho"       },
    { label: "Balbucio",                       key: "balbucio"           },
    { label: "Primeiras palavras",             key: "primeiraspalavras"  },
    { label: "Frases de 2 palavras",           key: "frasesDuasPalavras" },
    { label: "Linguagem fluente",              key: "linguagemFluente"   },
    { label: "Sorriso social",                 key: "sorrisoSocial"      },
    { label: "Apontar para pedir",             key: "apontar"            },
    { label: "Contr. esfinct. diurno",         key: "esfincteriDiurno"   },
    { label: "Contr. esfinct. noturno",        key: "esfincteriNoturno"  },
  ];
  marcoLabels.forEach(({ label, key }) => {
    const v = marcos[key];
    if (v.trim()) {
      const suffix = /^\d+$/.test(v.trim()) ? " meses" : "";
      r += `  ${label.padEnd(38)}: ${v}${suffix}\n`;
    }
  });
  if (marcos.regressao === "Sim")
    r += `  Regressão: SIM — ${marcos.regressaoDesc || "sem descrição"}\n`;
  if (marcos.crises === "Sim")
    r += `  Crises convulsivas: SIM — ${marcos.crisesDesc || "sem descrição"}\n`;
  r += "\n";

  if (medicacoes.length > 0) {
    r += `MEDICAÇÕES ATUAIS\n`;
    r += `${linha}\n`;
    medicacoes.forEach((m, i) => {
      r += `\n${i + 1}. ${m.nome} ${m.dose} — ${m.posologia}\n`;
      if (m.peso)        r += `   Peso: ${m.peso} kg${m.nome && m.dose ? ` | mg/kg: ${calcMgKg(m.dose, m.peso)}` : ""}\n`;
      if (m.dataInicio)  r += `   Início: ${m.dataInicio}\n`;
      if (m.objetivo)    r += `   Objetivo: ${m.objetivo}\n`;
      if (m.resposta)    r += `   Resposta: ${m.resposta}\n`;
      if (m.efeitosAdversos) r += `   Efeitos adversos: ${m.efeitosAdversos}\n`;
    });
    r += "\n";
  }

  if (terapias.length > 0) {
    r += `TERAPIAS\n`;
    r += `${linha}\n`;
    terapias.forEach((t, i) => {
      r += `\n${i + 1}. ${t.tipo} — ${t.profissional || "—"} | ${t.frequencia || "—"} | ${t.local || "—"}\n`;
      if (t.objetivo)  r += `   Objetivo: ${t.objetivo}\n`;
      if (t.inicio)    r += `   Início: ${t.inicio}\n`;
      if (t.evolucao)  r += `   Evolução: ${t.evolucao}\n`;
    });
    r += "\n";
  }

  if (exames.length > 0) {
    r += `EXAMES\n`;
    r += `${linha}\n`;
    exames.forEach((e, i) => {
      r += `\n${i + 1}. ${e.tipo} | Data: ${e.data || "—"} | Status: ${e.status || "—"}\n`;
      if (e.resultado) r += `   Resultado: ${e.resultado}\n`;
    });
    r += "\n";
  }

  r += `${linha}\n`;
  r += `Dr. Jadson Fraga Araújo Júnior — Neuropediatra\n`;
  r += `CRM-PE 25227 · CRM-BA 23384 | RQE 17756 / 14499 / 13119\n`;
  r += `NeuroPed — Escalas de Neuropediatria\n`;
  return r;
}

function calcMgKg(dose: string, peso: string): string {
  const d = parseFloat(dose.replace(",", "."));
  const p = parseFloat(peso.replace(",", "."));
  if (isNaN(d) || isNaN(p) || p === 0) return "—";
  return (d / p).toFixed(3);
}

// ─── PRINT WINDOW ─────────────────────────────────────────────────────────────

function printReport(
  id: Identificacao,
  anamnese: Anamnese,
  marcos: Marcos,
  medicacoes: Medicacao[],
  terapias: Terapia[],
  exames: Exame[]
) {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.opener = null;

  const dateStr = formatInputDate(id.dataConsulta || today);
  const dn = id.dataNascimento ? new Date(id.dataNascimento + "T12:00:00").toLocaleDateString("pt-BR") : "—";

  const milestoneRows = milestoneConfigs.map(cfg => {
    const v = marcos[cfg.key];
    if (!v.trim()) return "";
    const status = getMilestoneStatus(v, cfg);
    const col = status === "normal" ? "var(--doc-status-normal)" : status === "borderline" ? "var(--doc-status-borderline)" : status === "delayed" ? "var(--doc-status-delayed)" : "var(--doc-status-none)";
    const suffix = /^\d+$/.test(v.trim()) ? " m" : "";
    return `<tr>
      <td>${escapeHtml(cfg.label)}</td>
      <td>${escapeHtml(cfg.domain)}</td>
      <td style="font-weight:bold;color:${col}">${escapeHtml(v)}${suffix}</td>
      <td style="color:${col}">${escapeHtml(statusColors[status].label)}</td>
    </tr>`;
  }).filter(Boolean).join("");

  const medRows = medicacoes.map((m, i) => `
    <div class="med-card">
      <b>${i + 1}. ${escapeHtml(m.nome)} ${escapeHtml(m.dose)}</b> &nbsp;—&nbsp; ${escapeHtml(m.posologia)}<br>
      ${m.peso ? `<span class="sub">Peso: ${escapeHtml(m.peso)} kg | mg/kg: ${escapeHtml(calcMgKg(m.dose, m.peso))}</span><br>` : ""}
      ${m.dataInicio ? `<span class="sub">Início: ${escapeHtml(m.dataInicio)}</span><br>` : ""}
      ${m.objetivo ? `<span class="sub">Objetivo: ${escapeHtmlWithBreaks(m.objetivo)}</span><br>` : ""}
      ${m.resposta ? `<span class="sub">Resposta: ${escapeHtmlWithBreaks(m.resposta)}</span><br>` : ""}
      ${m.efeitosAdversos ? `<span class="sub">Efeitos adversos: ${escapeHtmlWithBreaks(m.efeitosAdversos)}</span>` : ""}
    </div>
  `).join("");

  const terRows = terapias.map((t, i) => `
    <div class="med-card">
      <b>${i + 1}. ${escapeHtml(t.tipo)}</b>${t.profissional ? ` — ${escapeHtml(t.profissional)}` : ""}<br>
      ${t.frequencia ? `<span class="sub">${escapeHtml(t.frequencia)}${t.local ? ` | ${escapeHtml(t.local)}` : ""}</span><br>` : ""}
      ${t.objetivo ? `<span class="sub">Objetivo: ${escapeHtmlWithBreaks(t.objetivo)}</span><br>` : ""}
      ${t.inicio ? `<span class="sub">Início: ${escapeHtml(t.inicio)}</span><br>` : ""}
      ${t.evolucao ? `<span class="sub">Evolução: ${escapeHtmlWithBreaks(t.evolucao)}</span>` : ""}
    </div>
  `).join("");

  const examRows = exames.map((e, i) => `
    <div class="med-card">
      <b>${i + 1}. ${escapeHtml(e.tipo)}</b>${e.data ? ` — ${escapeHtml(e.data)}` : ""} &nbsp;
      <span class="badge ${e.status === "Normal" ? "badge-ok" : e.status === "Alterado" ? "badge-err" : "badge-pend"}">${escapeHtml(e.status || "Pendente")}</span><br>
      ${e.resultado ? `<span class="sub">${escapeHtmlWithBreaks(e.resultado)}</span>` : ""}
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Prontuário — ${escapeHtml(id.nomeCompleto || "Paciente")} — ${escapeHtml(dateStr)}</title>
<style>
@page { margin: 2cm; size: A4; }
:root { --doc-ink: #111; --doc-accent: #7c3aed; --doc-accent-deep: #4c1d95; --doc-muted: #555; --doc-body: #333; --doc-inverse: #fff; --doc-rule: #ddd6fe; --doc-row-line: #eee; --doc-tint: #faf5ff; --doc-ok-bg: #d1fae5; --doc-ok-ink: #065f46; --doc-err-bg: #fee2e2; --doc-err-ink: #991b1b; --doc-pend-bg: #fef3c7; --doc-pend-ink: #92400e; --doc-alert-bg: #fff7ed; --doc-alert-border: #f59e0b; --doc-status-normal: #059669; --doc-status-borderline: #d97706; --doc-status-delayed: #dc2626; --doc-status-none: #9ca3af; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.65; color: var(--doc-ink); }
.header { border-bottom: 3px solid var(--doc-accent); padding-bottom: 14px; margin-bottom: 20px; }
.header h1 { font-size: 15pt; color: var(--doc-accent); margin-bottom: 2px; }
.header .sub { font-size: 9pt; color: var(--doc-muted); }
.section { margin-bottom: 18px; break-inside: avoid; }
.section h2 { font-size: 11pt; color: var(--doc-accent); border-bottom: 1px solid var(--doc-rule); padding-bottom: 3px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: .5px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; font-size: 9.5pt; }
.grid2 .row { display: flex; gap: 6px; }
.grid2 .lbl { color: var(--doc-muted); min-width: 110px; font-size: 9pt; }
.grid2 .val { font-weight: 600; color: var(--doc-ink); }
.narrative { font-size: 9.5pt; color: var(--doc-body); line-height: 1.7; margin-bottom: 8px; }
.narrative b { color: var(--doc-accent); }
table.milestones { width: 100%; border-collapse: collapse; font-size: 9pt; }
table.milestones th { background: var(--doc-accent); color: var(--doc-inverse); padding: 5px 10px; text-align: left; }
table.milestones td { padding: 4px 10px; border-bottom: 1px solid var(--doc-row-line); }
table.milestones tr:nth-child(even) td { background: var(--doc-tint); }
.med-card { background: var(--doc-tint); border-left: 3px solid var(--doc-accent); border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; font-size: 9.5pt; }
.med-card b { color: var(--doc-accent-deep); }
.sub { color: var(--doc-muted); font-size: 8.5pt; }
.badge { display: inline-block; padding: 1px 8px; border-radius: 12px; font-size: 8pt; font-weight: bold; }
.badge-ok { background:var(--doc-ok-bg); color:var(--doc-ok-ink); }
.badge-err { background:var(--doc-err-bg); color:var(--doc-err-ink); }
.badge-pend { background:var(--doc-pend-bg); color:var(--doc-pend-ink); }
.alerts-box { background:var(--doc-alert-bg); border-left: 3px solid var(--doc-alert-border); padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; font-size: 9.5pt; }
.footer { margin-top: 30px; border-top: 2px solid var(--doc-accent); padding-top: 12px; font-size: 8.5pt; color: var(--doc-muted); text-align: center; }
.footer .name { font-size: 11pt; font-weight: bold; color: var(--doc-ink); }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="header">
  <h1>🧠 NeuroPed — Prontuário Clínico</h1>
  <div class="sub"><b>Dr. Jadson Fraga Araújo Júnior</b> — Neuropediatra | CRM-PE 25227 · CRM-BA 23384 | RQE 17756 / 14499 / 13119</div>
  <div class="sub">Data da consulta: ${escapeHtml(dateStr)}</div>
</div>

<div class="section">
  <h2>Identificação do Paciente</h2>
  <div class="grid2">
    <div class="row"><span class="lbl">Paciente:</span><span class="val">${escapeHtml(id.nomeCompleto || "—")}</span></div>
    <div class="row"><span class="lbl">Nasc.:</span><span class="val">${escapeHtml(dn)}</span></div>
    <div class="row"><span class="lbl">Sexo:</span><span class="val">${escapeHtml(id.sexo || "—")}</span></div>
    <div class="row"><span class="lbl">Responsável:</span><span class="val">${escapeHtml(id.nomeResponsavel || "—")} (${escapeHtml(id.parentesco || "—")})</span></div>
    <div class="row"><span class="lbl">Telefone:</span><span class="val">${escapeHtml(id.telefone || "—")}</span></div>
    <div class="row"><span class="lbl">E-mail:</span><span class="val">${escapeHtml(id.email || "—")}</span></div>
    <div class="row"><span class="lbl">Convênio/SUS:</span><span class="val">${escapeHtml(id.convenio || "—")}</span></div>
    <div class="row"><span class="lbl">Médico resp.:</span><span class="val">${escapeHtml(id.medicoResponsavel || "—")}</span></div>
    <div class="row"><span class="lbl">CID:</span><span class="val">${escapeHtml(id.cid || "—")}</span></div>
    <div class="row"><span class="lbl">Hipótese diagn.:</span><span class="val">${escapeHtml(id.hipoteseDiagnostica || "—")}</span></div>
  </div>
</div>

${[
  { label: "Queixa Principal e HDA", value: anamnese.queixaPrincipal },
  { label: "Antecedentes Gestacionais", value: anamnese.gestacional },
  { label: "Antecedentes Perinatais", value: anamnese.perinatal },
  { label: "Antecedentes Patológicos", value: anamnese.patologicos },
  { label: "Antecedentes Familiares", value: anamnese.familiares },
  { label: "Histórico Escolar", value: anamnese.escolar },
].filter(s => s.value.trim()).map(s => `
<div class="section">
  <h2>${escapeHtml(s.label)}</h2>
  <p class="narrative">${escapeHtmlWithBreaks(s.value)}</p>
</div>`).join("")}

${milestoneRows ? `
<div class="section">
  <h2>Marcos do Neurodesenvolvimento</h2>
  <table class="milestones">
    <thead><tr><th>Marco</th><th>Domínio</th><th>Idade</th><th>Status</th></tr></thead>
    <tbody>${milestoneRows}</tbody>
  </table>
  ${marcos.regressao === "Sim" ? `<div class="alerts-box" style="margin-top:8px"><b>⚠ Regressão:</b> ${escapeHtmlWithBreaks(marcos.regressaoDesc || "Sim")}</div>` : ""}
  ${marcos.crises === "Sim" ? `<div class="alerts-box"><b>⚠ Crises convulsivas:</b> ${escapeHtmlWithBreaks(marcos.crisesDesc || "Sim")}</div>` : ""}
</div>` : ""}

${medRows ? `<div class="section"><h2>Medicações Atuais</h2>${medRows}</div>` : ""}
${terRows ? `<div class="section"><h2>Terapias</h2>${terRows}</div>` : ""}
${examRows ? `<div class="section"><h2>Exames</h2>${examRows}</div>` : ""}

<div class="footer">
  <div class="name">Dr. Jadson Fraga Araújo Júnior</div>
  Neuropediatra<br>
  CRM-PE 25227 · CRM-BA 23384 | RQE 17756 / 14499 / 13119<br>
  NeuroPed — Escalas de Neuropediatria
</div>
</body>
</html>`;

  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
  return true;
}

// ─── DEFAULT STATE FACTORIES ──────────────────────────────────────────────────

function emptyMed(): Medicacao {
  return { id: uid(), nome: "", dose: "", posologia: "", peso: "", dataInicio: "", objetivo: "", resposta: "", efeitosAdversos: "" };
}
function emptyTerapia(): Terapia {
  return { id: uid(), tipo: "", profissional: "", frequencia: "", local: "", objetivo: "", inicio: "", evolucao: "" };
}
function emptyExame(): Exame {
  return { id: uid(), tipo: "", data: "", resultado: "", status: "" };
}
function defaultMarcos(): Marcos {
  return {
    sustentouCabeca: "", sentouSemApoio: "", engatinhou: "", ficouEmPe: "", andouSozinho: "",
    balbucio: "", primeiraspalavras: "", frasesDuasPalavras: "", linguagemFluente: "",
    sorrisoSocial: "", apontar: "", esfincteriDiurno: "", esfincteriNoturno: "",
    regressao: "Não", regressaoDesc: "", crises: "Não", crisesDesc: "",
  };
}
function defaultId(): Identificacao {
  return {
    nomeCompleto: "", dataNascimento: "", sexo: "", nomeResponsavel: "", parentesco: "",
    telefone: "", email: "", convenio: "", medicoResponsavel: "Dr. Jadson Fraga",
    cid: "", hipoteseDiagnostica: "", dataConsulta: today,
  };
}
function defaultAnamnese(): Anamnese {
  return { queixaPrincipal: "", gestacional: "", perinatal: "", patologicos: "", familiares: "", escolar: "" };
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function ProntuarioPage() {
  const { toast } = useToast();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const liveContextReady = isRemoteClinical && Boolean(activeClinicId);
  const patientId = patientIdFromQuery();

  const [identificacao, setId] = useState<Identificacao>(defaultId);
  const [anamnese, setAnamnese] = useState<Anamnese>(defaultAnamnese);
  const [marcos, setMarcos] = useState<Marcos>(defaultMarcos);
  const [medicacoes, setMedicacoes] = useState<Medicacao[]>([]);
  const [terapias, setTerapias] = useState<Terapia[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [copied, setCopied] = useState(false);
  const [recordLoading, setRecordLoading] = useState(Boolean(patientId));
  const [recordSaving, setRecordSaving] = useState(false);
  const [eventIds, setEventIds] = useState<Record<string, string>>({});
  // Guard de edição: o effect de carga re-executa quando isRemoteClinical /
  // liveContextReady mudam (a sessão termina de resolver) e reaplicava os
  // valores do servidor por cima do que o usuário já tinha digitado —
  // minutos de anamnese perdidos sem aviso. Com o guard, a carga só
  // sobrescreve um formulário intocado.
  const formDirtyRef = useRef(false);

  useEffect(() => {
    if (!patientId || (isRemoteClinical && !liveContextReady)) return;
    let cancelled = false;
    setRecordLoading(true);
    const patientUrl = isRemoteClinical
      ? `/api/live/patients/${encodeURIComponent(patientId)}?clinicId=${encodeURIComponent(activeClinicId ?? "")}`
      : `/api/patients/${encodeURIComponent(patientId)}`;
    const eventsUrl = isRemoteClinical
      ? `/api/live/events?clinicId=${encodeURIComponent(activeClinicId ?? "")}&patientId=${encodeURIComponent(patientId)}`
      : `/api/clinical-core/events?patient_id=${encodeURIComponent(patientId)}&days=3650`;
    Promise.all([
      apiRequest("GET", patientUrl).then((response) => response.json()),
      apiRequest("GET", eventsUrl).then((response) => response.json()),
    ]).then(([patientPayload, eventPayload]) => {
      if (cancelled) return;
      const patient = isRemoteClinical
        ? { ...(patientPayload?.profile ?? {}), ...(patientPayload ?? {}) }
        : (patientPayload ?? {});
      const events = Array.isArray(eventPayload?.data)
        ? (eventPayload.data as any[]).map((event) => isRemoteClinical
          ? ({ ...event, data: event.payload ?? {}, note: event.encounterId ?? "" } as StoredClinicalEvent)
          : event as StoredClinicalEvent)
        : [];
      const activeEvents = events.filter((event) => event.status === "active");
      const nextIds: Record<string, string> = {};
      const nextAnamnese = defaultAnamnese();
      const nextMarcos = defaultMarcos();
      const nextMedications: Medicacao[] = [];
      const nextTerapias: Terapia[] = [];
      const nextExames: Exame[] = [];
      let nextId = {
        ...defaultId(),
        nomeCompleto: patient.name ?? "",
        dataNascimento: patient.birthDate ?? "",
        cid: patient.cid ?? patient.diagnosisCode ?? "",
      };

      for (const event of activeEvents) {
        const meta = isRemoteClinical
          ? { key: event.note ?? "" }
          : parseClinicalNote(event.note);
        const eventKey = typeof meta.key === "string" ? meta.key : "";
        if (eventKey) nextIds[eventKey] = event.id;
        const data = event.data ?? {};
        if (event.eventType === "encounter") {
          let savedIdentification = meta.identificacao;
          if (isRemoteClinical && typeof data.subjective === "string") {
            const stored = parseClinicalNote(data.subjective);
            savedIdentification = stored.identificacao;
          }
          if (savedIdentification && typeof savedIdentification === "object" && !Array.isArray(savedIdentification)) {
            nextId = { ...nextId, ...(savedIdentification as Partial<Identificacao>) };
          }
          if (event.occurredAt) nextId.dataConsulta = event.occurredAt.slice(0, 10);
        }
        if (event.eventType === "observation" && eventKey.startsWith("anamnese:")) {
          const field = eventKey.slice("anamnese:".length);
          if (field in nextAnamnese) nextAnamnese[field as keyof Anamnese] = String(data.valueText ?? "");
        }
        if (event.eventType === "observation" && eventKey.startsWith("marcos:")) {
          const field = eventKey.slice("marcos:".length);
          if (field in nextMarcos) nextMarcos[field as keyof Marcos] = String(data.valueText ?? "");
        }
        if (event.eventType === "medication" && eventKey.startsWith("medicacao:")) {
          const stored = isRemoteClinical ? parseClinicalNote(String(data.reason ?? "")) : parseClinicalNote(event.note);
          const item = stored.item;
          if (item && typeof item === "object" && !Array.isArray(item) && !stored.removed) nextMedications.push(item as Medicacao);
        }
        if (event.eventType === "plan" && eventKey.startsWith("terapia:")) {
          const stored = isRemoteClinical ? parseClinicalNote(String(data.successCriterion ?? "")) : parseClinicalNote(event.note);
          const item = stored.item;
          if (item && typeof item === "object" && !Array.isArray(item) && !stored.removed) nextTerapias.push(item as Terapia);
        }
        if (event.eventType === "plan" && eventKey.startsWith("exame:")) {
          const stored = isRemoteClinical ? parseClinicalNote(String(data.successCriterion ?? "")) : parseClinicalNote(event.note);
          const item = stored.item;
          if (item && typeof item === "object" && !Array.isArray(item) && !stored.removed) nextExames.push(item as Exame);
        }
      }

      if (formDirtyRef.current) {
        // Há texto não salvo do usuário: preserva o formulário e aplica só o
        // mapa de ids de eventos (necessário para o save direcionar updates).
        setEventIds(nextIds);
        setRecordLoading(false);
        return;
      }
      setId(nextId);
      setAnamnese(nextAnamnese);
      setMarcos(nextMarcos);
      setMedicacoes(nextMedications);
      setTerapias(nextTerapias);
      setExames(nextExames);
      setEventIds(nextIds);
      setRecordLoading(false);
    }).catch((error) => {
      if (cancelled) return;
      setRecordLoading(false);
      toast({ title: "Não foi possível carregar o prontuário persistente.", description: String(error), variant: "destructive" });
    });
    return () => { cancelled = true; };
  }, [activeClinicId, isRemoteClinical, liveContextReady, patientId, toast]);

  // ── updaters ──
  const updId = useCallback((field: keyof Identificacao, val: string) => {
    formDirtyRef.current = true;
    setId(p => ({ ...p, [field]: val }));
  }, []);
  const updAn = useCallback((field: keyof Anamnese, val: string) => {
    formDirtyRef.current = true;
    setAnamnese(p => ({ ...p, [field]: val }));
  }, []);
  const updMarco = useCallback((field: keyof Marcos, val: string) => {
    formDirtyRef.current = true;
    setMarcos(p => ({ ...p, [field]: val }));
  }, []);

  // ── medication handlers ──
  const addMed = () => { formDirtyRef.current = true; setMedicacoes(p => [...p, emptyMed()]); };
  const updMed = (id: string, field: keyof Medicacao, val: string) => {
    formDirtyRef.current = true;
    setMedicacoes(p => p.map(m => m.id === id ? { ...m, [field]: val } : m));
  };
  const removeMed = (id: string) => { formDirtyRef.current = true; setMedicacoes(p => p.filter(m => m.id !== id)); };

  // ── therapy handlers ──
  const addTer = () => { formDirtyRef.current = true; setTerapias(p => [...p, emptyTerapia()]); };
  const updTer = (id: string, field: keyof Terapia, val: string) => {
    formDirtyRef.current = true;
    setTerapias(p => p.map(t => t.id === id ? { ...t, [field]: val } : t));
  };
  const removeTer = (id: string) => { formDirtyRef.current = true; setTerapias(p => p.filter(t => t.id !== id)); };

  // ── exam handlers ──
  const addExame = () => { formDirtyRef.current = true; setExames(p => [...p, emptyExame()]); };
  const updExame = (id: string, field: keyof Exame, val: string) => {
    formDirtyRef.current = true;
    setExames(p => p.map(e => e.id === id ? { ...e, [field]: val } : e));
  };
  const removeExame = (id: string) => { formDirtyRef.current = true; setExames(p => p.filter(e => e.id !== id)); };

  // ── report ──
  const reportText = buildReport(identificacao, anamnese, marcos, medicacoes, terapias, exames);

  const handlePrint = () => {
    const ok = printReport(identificacao, anamnese, marcos, medicacoes, terapias, exames);
    if (!ok) {
      softError();
      haptic.error();
      toast({ title: "Erro", description: "Habilite pop-ups para esta página.", variant: "destructive" });
    } else {
      softBell();
      haptic.notify();
      toast({ title: "Impressão", description: "Janela de impressão aberta." });
    }
  };

  const handleSave = async () => {
    if (isRemoteClinical && !activeClinicId) {
      toast({ title: "Selecione uma clínica ativa", description: "O prontuário LIVE não pode ser salvo sem um tenant explícito.", variant: "destructive" });
      return;
    }
    if (!patientId) {
      toast({ title: "Selecione um paciente", description: "Abra o prontuário a partir de um cadastro em Pacientes para habilitar a persistência.", variant: "destructive" });
      return;
    }
    if (!identificacao.nomeCompleto.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe o nome da criança antes de salvar.", variant: "destructive" });
      return;
    }

    setRecordSaving(true);
    try {
      await apiRequest(
        "PATCH",
        isRemoteClinical ? `/api/live/patients/${encodeURIComponent(patientId)}` : `/api/patients/${encodeURIComponent(patientId)}`,
        isRemoteClinical
          ? {
              clinicId: activeClinicId,
              name: identificacao.nomeCompleto.trim(),
              birthDate: identificacao.dataNascimento || null,
              diagnosisCode: identificacao.cid.trim() || null,
            }
          : {
              name: identificacao.nomeCompleto.trim(),
              birthDate: identificacao.dataNascimento || null,
              cid: identificacao.cid.trim() || null,
            },
      );

      const occurredAt = new Date(`${identificacao.dataConsulta || today}T12:00:00`).toISOString();
      const nextIds = { ...eventIds };
      const postEvent = async (key: string, payload: Record<string, unknown>) => {
        const previousId = nextIds[key];
        const requestBody = isRemoteClinical
          ? {
              clinicId: activeClinicId,
              patientId,
              eventType: payload.eventType,
              occurredAt,
              encounterId: key,
              ...(previousId ? { supersedesEventId: previousId } : {}),
              provenanceKind: "documented",
              provenanceSource: "clinician",
              payload: payload.data,
            }
          : {
              patientId,
              occurredAt,
              encounterId: key,
              ...(previousId ? { supersedesEventId: previousId } : {}),
              provenance: { kind: "documented", source: "clinician", sourceLabel: "Prontuário NeuroPed" },
              ...payload,
            };
        const response = await apiRequest(
          "POST",
          isRemoteClinical ? "/api/live/events" : "/api/clinical-core/events",
          requestBody,
        );
        const created = await response.json() as StoredClinicalEvent;
        nextIds[key] = created.id;
        // Comita o progresso no estado a cada evento salvo (não só ao final):
        // se uma falha no meio do loop interromper o save, um retry precisa
        // ver os ids já criados para superseder em vez de duplicar eventos.
        setEventIds((prev) => ({ ...prev, [key]: created.id }));
      };

      await postEvent("encounter", {
        eventType: "encounter",
        data: {
          encounterType: "followup",
          reason: anamnese.queixaPrincipal.trim() || identificacao.hipoteseDiagnostica.trim() || "Consulta neuropediátrica",
          setting: "clinic",
          subjective: JSON.stringify({ identificacao }),
        },
        note: JSON.stringify({ key: "encounter", identificacao }),
      });

      for (const field of anamneseKeys) {
        const value = anamnese[field].trim();
        await postEvent(`anamnese:${field}`, {
          eventType: "observation",
          data: { domain: "other", findingStatus: value ? "present" : "not_assessed", valueText: value },
          note: JSON.stringify({ key: `anamnese:${field}`, section: "anamnese", field, value }),
        });
      }

      for (const field of marcoKeys) {
        const value = marcos[field].trim();
        const isRedFlag = (field === "regressao" || field === "crises") && value === "Sim";
        await postEvent(`marcos:${field}`, {
          eventType: "observation",
          data: { domain: field === "crises" || field === "crisesDesc" ? "seizure" : "development", findingStatus: value ? "present" : "not_assessed", valueText: value, redFlag: isRedFlag },
          note: JSON.stringify({ key: `marcos:${field}`, section: "marcos", field, value }),
        });
      }

      const activeMedicationKeys = new Set<string>();
      for (const item of medicacoes) {
        if (!item.nome.trim()) continue;
        const key = `medicacao:${item.id}`;
        activeMedicationKeys.add(key);
        const doseMg = Number.parseFloat(item.dose.replace(",", ".").replace(/[^0-9.]/g, ""));
        await postEvent(key, {
          eventType: "medication",
          data: {
            action: "reported_use",
            genericName: item.nome.trim(),
            ...(Number.isFinite(doseMg) ? { doseMg } : {}),
            frequency: item.posologia.trim() || undefined,
            indication: item.objetivo.trim() || undefined,
            reason: JSON.stringify({ item }),
            effectiveFrom: item.dataInicio ? new Date(`${item.dataInicio}T12:00:00`).toISOString() : undefined,
          },
          note: JSON.stringify({ key, section: "medicacao", item }),
        });
      }
      for (const key of Object.keys(nextIds).filter((item) => item.startsWith("medicacao:") && !activeMedicationKeys.has(item))) {
        await postEvent(key, {
          eventType: "medication",
          data: { action: "stop", genericName: "Medicação registrada anteriormente", reason: JSON.stringify({ removed: true }) },
          note: JSON.stringify({ key, section: "medicacao", removed: true }),
        });
      }

      const activeTherapyKeys = new Set<string>();
      for (const item of terapias) {
        if (!item.tipo.trim()) continue;
        const key = `terapia:${item.id}`;
        activeTherapyKeys.add(key);
        await postEvent(key, {
          eventType: "plan",
          data: { kind: "therapy", target: item.tipo.trim(), status: "planned", priority: "routine", responsibleRole: item.profissional.trim() || undefined, successCriterion: JSON.stringify({ item }) },
          note: JSON.stringify({ key, section: "terapia", item }),
        });
      }
      for (const key of Object.keys(nextIds).filter((item) => item.startsWith("terapia:") && !activeTherapyKeys.has(item))) {
        await postEvent(key, {
          eventType: "plan",
          data: { kind: "therapy", target: "Plano terapêutico registrado anteriormente", status: "cancelled", priority: "routine", successCriterion: JSON.stringify({ removed: true }) },
          note: JSON.stringify({ key, section: "terapia", removed: true }),
        });
      }

      const activeExamKeys = new Set<string>();
      for (const item of exames) {
        if (!item.tipo.trim()) continue;
        const key = `exame:${item.id}`;
        activeExamKeys.add(key);
        await postEvent(key, {
          eventType: "plan",
          data: { kind: "exam", target: item.tipo.trim(), status: item.status === "Concluído" ? "completed" : "planned", priority: "routine", successCriterion: JSON.stringify({ item }) },
          note: JSON.stringify({ key, section: "exame", item }),
        });
      }
      for (const key of Object.keys(nextIds).filter((item) => item.startsWith("exame:") && !activeExamKeys.has(item))) {
        await postEvent(key, {
          eventType: "plan",
          data: { kind: "exam", target: "Exame registrado anteriormente", status: "cancelled", priority: "routine", successCriterion: JSON.stringify({ removed: true }) },
          note: JSON.stringify({ key, section: "exame", removed: true }),
        });
      }

      setEventIds(nextIds);
      formDirtyRef.current = false;
      setRecordSaving(false);
      softSuccess();
      haptic.success();
      toast({ title: "Prontuário salvo", description: "Dados do paciente e registros clínicos persistidos com trilha de auditoria." });
    } catch (error) {
      setRecordSaving(false);
      softError();
      haptic.error();
      toast({ title: "Não foi possível salvar o prontuário", description: String(error), variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      softSuccess();
      haptic.success();
      toast({ title: "Copiado!", description: "Relatório copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      softError();
      haptic.error();
      toast({ title: "Erro", description: "Não foi possível copiar.", variant: "destructive" });
    }
  };

  // ── tab badge counts ──
  const idCount = countIdentificacao(identificacao);
  const anCount = countAnamnese(anamnese);
  const mkCount = countMarcos(marcos);

  // ── visual timeline ──
  const timelineItems = milestoneConfigs
    .map(cfg => {
      const v = marcos[cfg.key];
      const status = getMilestoneStatus(v, cfg);
      const numMonths = parseInt(v, 10);
      return { cfg, v, status, numMonths: isNaN(numMonths) ? null : numMonths };
    })
    .filter(item => item.status !== "missing")
    .sort((a, b) => {
      if (a.numMonths === null && b.numMonths === null) return 0;
      if (a.numMonths === null) return 1;
      if (b.numMonths === null) return -1;
      return a.numMonths - b.numMonths;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/60 via-purple-50/30 to-background pb-8 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-background lg:pb-16" data-testid="prontuario-shell">
      {/* ── page header ── */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur lg:top-0 sm:px-4 sm:py-3" data-testid="prontuario-header">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-md sm:h-11 sm:w-11">
              <ClipboardList className="h-5 w-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1
                className="truncate text-base leading-tight text-foreground sm:text-lg"
                style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
              >
                Prontuário Clínico
              </h1>
              <p className="truncate text-[11px] italic text-muted-foreground sm:text-xs">Neuropediatria — {isRemoteClinical ? "sessão LIVE" : "sessão DEMO/local"}
</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="outline" className="hidden border-violet-300 text-xs text-violet-700 dark:text-violet-300 sm:flex">
              <Clock className="mr-1 h-3 w-3" />
              {isRemoteClinical ? "Sessão LIVE auditada" : "Sessão DEMO/local"}
            </Badge>
            <Button
              size="sm"
              aria-label="Gerar relatório em PDF"
              data-testid="prontuario-print"
              onClick={() => { softTap(); haptic.tap(); handlePrint(); }}
              className="h-11 gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 px-3 text-white shadow-sm hover:from-violet-700 hover:to-purple-800 sm:px-4 btn-glow"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Gerar Relatório</span>
              <span className="sm:hidden">PDF</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── main content ── */}
      <div className="mx-auto max-w-4xl px-3 pt-4 sm:px-4 sm:pt-6">
        <Tabs defaultValue="identificacao" className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between px-1 sm:hidden" aria-hidden="true">
            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Etapas do prontuário</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground/75">Deslize →</span>
          </div>
          <TabsList className="np-prontuario-tabs flex h-auto w-full flex-nowrap justify-start gap-1.5 overflow-x-auto rounded-2xl bg-muted/80 p-1.5">
            <TabsTrigger value="identificacao" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Identificação</span>
              {idCount > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{idCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="anamnese" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Anamnese</span>
              {anCount > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{anCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="marcos" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Marcos</span>
              {mkCount > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{mkCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="medicacoes" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <Pill className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Medicações</span>
              {medicacoes.length > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{medicacoes.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="terapias" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <Heart className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Terapias</span>
              {terapias.length > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{terapias.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="exames" className="flex min-h-11 min-w-[8.25rem] shrink-0 items-center justify-center gap-1.5 text-xs sm:min-w-0 sm:flex-1">
              <FlaskConical className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Exames</span>
              {exames.length > 0 && <Badge className="ml-1 bg-violet-600 text-white text-[10px] h-4 px-1">{exames.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════
              TAB 1: IDENTIFICAÇÃO
          ══════════════════════════════════════════════ */}
          <TabsContent value="identificacao" className="space-y-4">
            <Card className="border-violet-200/60 dark:border-violet-800/40">
              <CardContent className="p-5">
                <SectionHeader icon={Baby} title="Dados da Criança" gradient="from-violet-600 to-purple-700" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome completo da criança" span2>
                    <Input
                      placeholder="Nome completo"
                      value={identificacao.nomeCompleto}
                      onChange={e => updId("nomeCompleto", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Data de nascimento">
                    <Input
                      type="date"
                      value={identificacao.dataNascimento}
                      onChange={e => updId("dataNascimento", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Sexo">
                    <Select value={identificacao.sexo} onValueChange={v => updId("sexo", v)}>
                      <SelectTrigger aria-label="Sexo" className="border-violet-200 dark:border-violet-800 focus:ring-violet-500">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200/60 dark:border-violet-800/40">
              <CardContent className="p-5">
                <SectionHeader icon={User} title="Responsável" gradient="from-purple-600 to-fuchsia-600" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Nome do responsável">
                    <Input
                      placeholder="Nome completo"
                      value={identificacao.nomeResponsavel}
                      onChange={e => updId("nomeResponsavel", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Parentesco">
                    <Select value={identificacao.parentesco} onValueChange={v => updId("parentesco", v)}>
                      <SelectTrigger aria-label="Parentesco" className="border-violet-200 dark:border-violet-800">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mãe">Mãe</SelectItem>
                        <SelectItem value="Pai">Pai</SelectItem>
                        <SelectItem value="Avó">Avó</SelectItem>
                        <SelectItem value="Avô">Avô</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Telefone">
                    <Input
                      placeholder="(81) 99999-9999"
                      value={identificacao.telefone}
                      onChange={e => updId("telefone", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="E-mail">
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={identificacao.email}
                      onChange={e => updId("email", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Convênio / SUS">
                    <Input
                      placeholder="Ex: Unimed, SUS..."
                      value={identificacao.convenio}
                      onChange={e => updId("convenio", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="border-violet-200/60 dark:border-violet-800/40">
              <CardContent className="p-5">
                <SectionHeader icon={Stethoscope} title="Dados Clínicos" gradient="from-indigo-600 to-violet-700" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Médico responsável">
                    <Input
                      value={identificacao.medicoResponsavel}
                      onChange={e => updId("medicoResponsavel", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Data da consulta">
                    <Input
                      type="date"
                      value={identificacao.dataConsulta}
                      onChange={e => updId("dataConsulta", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="CID principal">
                    <Input
                      placeholder="Ex: F84.0"
                      value={identificacao.cid}
                      onChange={e => updId("cid", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                  <Field label="Hipótese diagnóstica" span2>
                    <Input
                      placeholder="Ex: TEA, TDAH, Epilepsia..."
                      value={identificacao.hipoteseDiagnostica}
                      onChange={e => updId("hipoteseDiagnostica", e.target.value)}
                      className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════════════════════════════════════════
              TAB 2: ANAMNESE
          ══════════════════════════════════════════════ */}
          <TabsContent value="anamnese" className="space-y-4">
            {([
              {
                key: "queixaPrincipal" as keyof Anamnese,
                title: "Queixa Principal e HDA",
                icon: MessageSquare,
                gradient: "from-violet-600 to-purple-700",
                placeholder: "Descreva a queixa principal e história da doença atual..."
              },
              {
                key: "gestacional" as keyof Anamnese,
                title: "Antecedentes Gestacionais",
                icon: Baby,
                gradient: "from-pink-500 to-rose-600",
                placeholder: "Pré-natal, intercorrências, uso de medicações, infecções, TORCH..."
              },
              {
                key: "perinatal" as keyof Anamnese,
                title: "Antecedentes Perinatais",
                icon: Activity,
                gradient: "from-orange-500 to-amber-600",
                placeholder: "Tipo de parto, IG (semanas), peso ao nascer, Apgar, UTI neonatal, icterícia..."
              },
              {
                key: "patologicos" as keyof Anamnese,
                title: "Antecedentes Patológicos",
                icon: AlertTriangle,
                gradient: "from-red-500 to-rose-600",
                placeholder: "Internações, cirurgias, alergias, comorbidades..."
              },
              {
                key: "familiares" as keyof Anamnese,
                title: "Antecedentes Familiares",
                icon: Users,
                gradient: "from-teal-500 to-cyan-600",
                placeholder: "TEA, TDAH, epilepsia, DI, transtornos psiquiátricos, consanguinidade..."
              },
              {
                key: "escolar" as keyof Anamnese,
                title: "Histórico Escolar",
                icon: School,
                gradient: "from-blue-500 to-indigo-600",
                placeholder: "Escola atual, série, AEE, PEI, adaptações curriculares, queixas da escola..."
              },
            ] as { key: keyof Anamnese; title: string; icon: any; gradient: string; placeholder: string }[]).map(section => (
              <Card key={section.key} className="border-violet-200/60 dark:border-violet-800/40">
                <CardContent className="p-5">
                  <SectionHeader icon={section.icon} title={section.title} gradient={section.gradient} />
                  <Textarea
                    placeholder={section.placeholder}
                    value={anamnese[section.key]}
                    onChange={e => updAn(section.key, e.target.value)}
                    rows={4}
                    className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 resize-none text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ══════════════════════════════════════════════
              TAB 3: MARCOS DO DESENVOLVIMENTO
          ══════════════════════════════════════════════ */}
          <TabsContent value="marcos" className="space-y-4">
            {/* Input cards by domain */}
            {([
              {
                domain: "Motor" as const,
                icon: Dumbbell,
                gradient: "from-blue-500 to-cyan-600",
                fields: [
                  { key: "sustentouCabeca" as keyof Marcos, label: "Sustentou a cabeça", ref: "esperado 3-4m" },
                  { key: "sentouSemApoio" as keyof Marcos, label: "Sentou sem apoio", ref: "esperado 6-8m" },
                  { key: "engatinhou" as keyof Marcos, label: "Engatinhou", ref: "esperado 8-10m" },
                  { key: "ficouEmPe" as keyof Marcos, label: "Ficou em pé com apoio", ref: "esperado 9-12m" },
                  { key: "andouSozinho" as keyof Marcos, label: "Andou sozinho", ref: "esperado 12-18m" },
                ]
              },
              {
                domain: "Linguagem" as const,
                icon: MessageSquare,
                gradient: "from-violet-500 to-purple-700",
                fields: [
                  { key: "balbucio" as keyof Marcos, label: "Balbucio", ref: "esperado 6-9m" },
                  { key: "primeiraspalavras" as keyof Marcos, label: "Primeiras palavras", ref: "esperado 12-18m" },
                  { key: "frasesDuasPalavras" as keyof Marcos, label: "Frases de 2 palavras", ref: "esperado 18-30m" },
                  { key: "linguagemFluente" as keyof Marcos, label: "Linguagem fluente", ref: "esperado 36-48m" },
                ]
              },
              {
                domain: "Social/Adaptativo" as const,
                icon: Heart,
                gradient: "from-pink-500 to-rose-600",
                fields: [
                  { key: "sorrisoSocial" as keyof Marcos, label: "Sorriso social", ref: "esperado 1-3m" },
                  { key: "apontar" as keyof Marcos, label: "Apontar para pedir", ref: "esperado 10-14m" },
                  { key: "esfincteriDiurno" as keyof Marcos, label: "Controle esfincteriano diurno", ref: "esperado 24-36m" },
                  { key: "esfincteriNoturno" as keyof Marcos, label: "Controle esfincteriano noturno", ref: "esperado 36-60m" },
                ]
              },
            ] as { domain: "Motor"|"Linguagem"|"Social/Adaptativo"; icon: any; gradient: string; fields: {key: keyof Marcos; label: string; ref: string}[] }[]).map(domainSection => (
              <Card key={domainSection.domain} className="border-violet-200/60 dark:border-violet-800/40">
                <CardContent className="p-5">
                  <SectionHeader icon={domainSection.icon} title={`Domínio: ${domainSection.domain}`} gradient={domainSection.gradient} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {domainSection.fields.map(f => {
                      const cfg = milestoneConfigs.find(c => c.key === f.key);
                      const status = cfg ? getMilestoneStatus(marcos[f.key], cfg) : "missing";
                      const sc = statusColors[status];
                      return (
                        <div key={f.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
                            {status !== "missing" && (
                              <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${sc.bg} ${sc.text}`}>
                                {sc.label}
                              </Badge>
                            )}
                          </div>
                          <div className="relative">
                            <Input
                              placeholder={f.ref}
                              value={marcos[f.key]}
                              onChange={e => updMarco(f.key, e.target.value)}
                              className={`border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 pr-8 text-sm ${
                                status === "normal" ? "border-l-2 border-l-emerald-500" :
                                status === "borderline" ? "border-l-2 border-l-amber-400" :
                                status === "delayed" ? "border-l-2 border-l-red-500" : ""
                              }`}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Alertas */}
            <Card className="border-amber-200/60 dark:border-amber-800/40">
              <CardContent className="p-5">
                <SectionHeader icon={AlertTriangle} title="Alertas" gradient="from-amber-500 to-orange-600" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Field label="Regressão de marcos?">
                      <Select value={marcos.regressao} onValueChange={v => updMarco("regressao", v)}>
                        <SelectTrigger className="border-amber-200 dark:border-amber-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não">Não</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {marcos.regressao === "Sim" && (
                      <Textarea
                        placeholder="Descreva: qual marco, com que idade, contexto..."
                        value={marcos.regressaoDesc}
                        onChange={e => updMarco("regressaoDesc", e.target.value)}
                        rows={3}
                        className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500 resize-none text-sm"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Field label="Crises convulsivas?">
                      <Select value={marcos.crises} onValueChange={v => updMarco("crises", v)}>
                        <SelectTrigger className="border-amber-200 dark:border-amber-800">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não">Não</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {marcos.crises === "Sim" && (
                      <Textarea
                        placeholder="Idade de início, tipo, frequência, medicação em uso..."
                        value={marcos.crisesDesc}
                        onChange={e => updMarco("crisesDesc", e.target.value)}
                        rows={3}
                        className="border-amber-200 dark:border-amber-800 focus-visible:ring-amber-500 resize-none text-sm"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Visual Timeline */}
            {timelineItems.length > 0 && (
              <Card className="border-violet-200/60 dark:border-violet-800/40">
                <CardHeader className="pb-2 pt-5 px-5">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-600" />
                    Linha do Tempo Visual
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-2">
                    {(["normal", "borderline", "delayed"] as MilestoneStatus[]).map(s => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColors[s].dot}`} />
                        <span className="text-xs text-muted-foreground">{statusColors[s].label}</span>
                      </div>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="relative">
                    {/* vertical rail */}
                    <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-violet-300 via-purple-200 to-violet-100 dark:from-violet-700 dark:via-purple-800 dark:to-violet-900 rounded-full" />

                    <div className="space-y-3 pl-10">
                      {timelineItems.map(({ cfg, v, status }) => {
                        const sc = statusColors[status];
                        const dbg = domainBg[cfg.domain];
                        const suffix = /^\d+$/.test(v.trim()) ? " m" : "";
                        return (
                          <div key={cfg.key} className="relative flex items-start gap-3">
                            {/* dot */}
                            <div className={`absolute -left-[28px] w-5 h-5 rounded-full ${sc.dot} border-2 border-background shadow-sm flex items-center justify-center flex-shrink-0 top-0.5`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            </div>
                            <div className={`flex-1 rounded-lg p-2.5 ${sc.bg} border border-transparent`}>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                                <div className="flex items-center gap-2">
                                  <Badge className={`text-[10px] px-2 py-0 h-5 border-0 ${dbg}`}>{cfg.domain}</Badge>
                                  <span className={`text-sm font-bold ${sc.text}`}>{v}{suffix}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Esperado: {cfg.greenMin}–{cfg.greenMax}m &nbsp;·&nbsp; {sc.label}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══════════════════════════════════════════════
              TAB 4: MEDICAÇÕES
          ══════════════════════════════════════════════ */}
          <TabsContent value="medicacoes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Medicações Atuais</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{medicacoes.length} medicação(ões) registrada(s)</p>
              </div>
              <Button
                onClick={addMed}
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar medicação
              </Button>
            </div>

            {medicacoes.length === 0 && (
              <Card className="border-dashed border-violet-200 dark:border-violet-800">
                <CardContent className="p-8 flex flex-col items-center gap-2">
                  <Pill className="w-8 h-8 text-violet-300 dark:text-violet-700" />
                  <p className="text-sm text-muted-foreground text-center">Nenhuma medicação adicionada ainda.</p>
                  <p className="text-xs text-muted-foreground text-center">Clique em “Adicionar medicação” para começar.</p>
                </CardContent>
              </Card>
            )}

            {medicacoes.map((med, idx) => {
              const mgkg = calcMgKg(med.dose, med.peso);
              return (
                <Card key={med.id} className="border-violet-200/60 dark:border-violet-800/40">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{med.nome || `Medicação ${idx + 1}`}</span>
                      {med.resposta && (
                        <Badge className={`ml-auto text-xs border-0 ${
                          med.resposta === "Boa" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                          med.resposta === "Parcial" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                          med.resposta === "Piora" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                          "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}>{med.resposta}</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                        onClick={() => removeMed(med.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Field label="Nome da medicação">
                        <Input
                          placeholder="Ex: Risperidona"
                          value={med.nome}
                          onChange={e => updMed(med.id, "nome", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                      </Field>
                      <Field label="Dose">
                        <Input
                          placeholder="Ex: 0,5mg"
                          value={med.dose}
                          onChange={e => updMed(med.id, "dose", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                      </Field>
                      <Field label="Posologia">
                        <Input
                          placeholder="Ex: 1x ao dia, noite"
                          value={med.posologia}
                          onChange={e => updMed(med.id, "posologia", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                      </Field>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-muted-foreground">Peso da criança (kg)</Label>
                        <Input
                          placeholder="Ex: 18,5"
                          value={med.peso}
                          onChange={e => updMed(med.id, "peso", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                        {mgkg !== "—" && (
                          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">mg/kg: {mgkg}</p>
                        )}
                      </div>
                      <Field label="Data de início">
                        <Input
                          type="date"
                          value={med.dataInicio}
                          onChange={e => updMed(med.id, "dataInicio", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                      </Field>
                      <Field label="Objetivo">
                        <Input
                          placeholder="Ex: irritabilidade"
                          value={med.objetivo}
                          onChange={e => updMed(med.id, "objetivo", e.target.value)}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500"
                        />
                      </Field>
                      <Field label="Resposta clínica">
                        <Select value={med.resposta} onValueChange={v => updMed(med.id, "resposta", v)}>
                          <SelectTrigger className="border-violet-200 dark:border-violet-800">
                            <SelectValue placeholder="Selecionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Boa">✅ Boa</SelectItem>
                            <SelectItem value="Parcial">🟡 Parcial</SelectItem>
                            <SelectItem value="Sem resposta">⚪ Sem resposta</SelectItem>
                            <SelectItem value="Piora">🔴 Piora</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Efeitos adversos</Label>
                        <Textarea
                          placeholder="Descreva efeitos adversos observados..."
                          value={med.efeitosAdversos}
                          onChange={e => updMed(med.id, "efeitosAdversos", e.target.value)}
                          rows={2}
                          className="border-violet-200 dark:border-violet-800 focus-visible:ring-violet-500 resize-none text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ══════════════════════════════════════════════
              TAB 5: TERAPIAS
          ══════════════════════════════════════════════ */}
          <TabsContent value="terapias" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Terapias em Andamento</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{terapias.length} terapia(s) registrada(s)</p>
              </div>
              <Button
                onClick={addTer}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar terapia
              </Button>
            </div>

            {terapias.length === 0 && (
              <Card className="border-dashed border-pink-200 dark:border-pink-800">
                <CardContent className="p-8 flex flex-col items-center gap-2">
                  <Heart className="w-8 h-8 text-pink-300 dark:text-pink-700" />
                  <p className="text-sm text-muted-foreground text-center">Nenhuma terapia adicionada ainda.</p>
                </CardContent>
              </Card>
            )}

            {terapias.map((ter, idx) => (
              <Card key={ter.id} className="border-pink-200/60 dark:border-pink-800/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{ter.tipo || `Terapia ${idx + 1}`}</span>
                    {ter.frequencia && (
                      <Badge className="ml-2 bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-0 text-xs">
                        {ter.frequencia}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                      onClick={() => removeTer(ter.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Tipo de terapia">
                      <Select value={ter.tipo} onValueChange={v => updTer(ter.id, "tipo", v)}>
                        <SelectTrigger className="border-pink-200 dark:border-pink-800">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["ABA","Fonoaudiologia","TO (Terapia Ocupacional)","Psicologia","Psicopedagogia","Fisioterapia","Musicoterapia","AEE","Equoterapia","Outro"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Profissional">
                      <Input
                        placeholder="Nome do profissional"
                        value={ter.profissional}
                        onChange={e => updTer(ter.id, "profissional", e.target.value)}
                        className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500"
                      />
                    </Field>
                    <Field label="Frequência">
                      <Select value={ter.frequencia} onValueChange={v => updTer(ter.id, "frequencia", v)}>
                        <SelectTrigger className="border-pink-200 dark:border-pink-800">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {["1x/sem","2x/sem","3x/sem","Semanal","Quinzenal","Mensal"].map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Local / Clínica">
                      <Input
                        placeholder="Nome da clínica ou local"
                        value={ter.local}
                        onChange={e => updTer(ter.id, "local", e.target.value)}
                        className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500"
                      />
                    </Field>
                    <Field label="Objetivo">
                      <Input
                        placeholder="Ex: comunicação funcional"
                        value={ter.objetivo}
                        onChange={e => updTer(ter.id, "objetivo", e.target.value)}
                        className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500"
                      />
                    </Field>
                    <Field label="Início">
                      <Input
                        type="date"
                        value={ter.inicio}
                        onChange={e => updTer(ter.id, "inicio", e.target.value)}
                        className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500"
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Evolução</Label>
                      <Textarea
                        placeholder="Descreva a evolução clínica com esta terapia..."
                        value={ter.evolucao}
                        onChange={e => updTer(ter.id, "evolucao", e.target.value)}
                        rows={3}
                        className="border-pink-200 dark:border-pink-800 focus-visible:ring-pink-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ══════════════════════════════════════════════
              TAB 6: EXAMES
          ══════════════════════════════════════════════ */}
          <TabsContent value="exames" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Exames Complementares</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{exames.length} exame(s) registrado(s)</p>
              </div>
              <Button
                onClick={addExame}
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Adicionar exame
              </Button>
            </div>

            {exames.length === 0 && (
              <Card className="border-dashed border-teal-200 dark:border-teal-800">
                <CardContent className="p-8 flex flex-col items-center gap-2">
                  <FlaskConical className="w-8 h-8 text-teal-300 dark:text-teal-700" />
                  <p className="text-sm text-muted-foreground text-center">Nenhum exame adicionado ainda.</p>
                </CardContent>
              </Card>
            )}

            {exames.map((ex, idx) => (
              <Card key={ex.id} className="border-teal-200/60 dark:border-teal-800/40">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{ex.tipo || `Exame ${idx + 1}`}</span>
                    {ex.status && (
                      <Badge className={`ml-auto text-xs border-0 ${
                        ex.status === "Normal" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                        ex.status === "Alterado" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>{ex.status}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ${ex.status ? "" : "ml-auto"}`}
                      onClick={() => removeExame(ex.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Tipo de exame">
                      <Select value={ex.tipo} onValueChange={v => updExame(ex.id, "tipo", v)}>
                        <SelectTrigger className="border-teal-200 dark:border-teal-800">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "RM Crânio","EEG","Audiometria","BERA",
                            "Cariótipo","Microarray","Exoma","Genético outro",
                            "Lab sangue","Metabólico","Outro"
                          ].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Data">
                      <Input
                        type="date"
                        value={ex.data}
                        onChange={e => updExame(ex.id, "data", e.target.value)}
                        className="border-teal-200 dark:border-teal-800 focus-visible:ring-teal-500"
                      />
                    </Field>
                    <Field label="Status">
                      <Select value={ex.status} onValueChange={v => updExame(ex.id, "status", v)}>
                        <SelectTrigger className="border-teal-200 dark:border-teal-800">
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                          <SelectItem value="Normal">✅ Normal</SelectItem>
                          <SelectItem value="Alterado">⚠️ Alterado</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="sm:col-span-3">
                      <Label className="text-xs font-semibold text-muted-foreground mb-1 block">Resultado resumido</Label>
                      <Textarea
                        placeholder="Descreva o resultado do exame..."
                        value={ex.resultado}
                        onChange={e => updExame(ex.id, "resultado", e.target.value)}
                        rows={3}
                        className="border-teal-200 dark:border-teal-800 focus-visible:ring-teal-500 resize-none text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* ══════════════════════════════════════════════
            BOTTOM: GERAR RELATÓRIO
        ══════════════════════════════════════════════ */}
        <div className="mt-8">
          <Card className="border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Gerar Relatório Completo</h2>
                  <p className="text-xs text-muted-foreground">Relatório médico formal com todos os dados desta sessão</p>
                </div>
              </div>

              {/* preview */}
              <div className="rounded-xl bg-background/80 border border-violet-200 dark:border-violet-800 p-4 max-h-48 overflow-y-auto mb-4" tabIndex={0} role="region" aria-label="Prévia do relatório completo">
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {reportText}
                </pre>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={recordLoading || recordSaving || !patientId}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md h-11"
                >
                  <Save className="w-5 h-5" />
                  {recordLoading ? "Carregando…" : recordSaving ? "Salvando…" : "Salvar prontuário"}
                </Button>
                <Button
                  size="lg"
                  onClick={handlePrint}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white gap-2 shadow-md h-11"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir / Salvar PDF
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCopy}
                  className="flex-1 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 gap-2 h-11"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  {copied ? "Copiado!" : "Copiar Texto"}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                {isRemoteClinical ? "O botão Salvar grava no domínio LIVE da clínica ativa, com payload cifrado, supersession e trilha de auditoria. Imprimir ou copiar gera apenas uma saída documental." : "O botão Salvar grava no backend persistente DEMO/local. Imprimir ou copiar gera apenas uma saída documental."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

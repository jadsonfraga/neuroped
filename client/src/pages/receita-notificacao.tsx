import { useEffect, useState } from "react";
import { ExternalLink, FileText, Printer, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";
import { escapeHtml as esc } from "@/lib/htmlEscape";
import {
  issuerContactLine,
  issuerCredentials,
  issuerCityLine,
  useIssuer,
  type DocumentIssuer,
} from "@/lib/issuer";
import { readRouteParam } from "@/lib/routeQuery";

type NoticeType = "A" | "B";
interface NoticeFields {
  numeroFisicoVisa: string;
  paciente: string;
  documentoPaciente: string;
  enderecoPaciente: string;
  telefonePaciente: string;
  medicamento: string;
  concentracao: string;
  formaFarmaceutica: string;
  quantidade: string;
  posologia: string;
  data: string;
  graficaNome: string;
  graficaCnpj: string;
  graficaEndereco: string;
  confirmouNumeroVisa: boolean;
}
const EMPTY: NoticeFields = {
  numeroFisicoVisa: "",
  paciente: "",
  documentoPaciente: "",
  enderecoPaciente: "",
  telefonePaciente: "",
  medicamento: "",
  concentracao: "",
  formaFarmaceutica: "",
  quantidade: "",
  posologia: "",
  data: "",
  graficaNome: "",
  graficaCnpj: "",
  graficaEndereco: "",
  confirmouNumeroVisa: false,
};
const ANVISA_V2 = "Modelo físico Anvisa — Versão 2 (vigente para novas impressões desde 18/05/2026)";
const OFFICIAL_MODEL_A = "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-fisico/modelos-vigentes/notificacao-de-receita-a.pdf";
const OFFICIAL_MODEL_B = "https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/controlados/sncr/receituario-fisico/modelos-vigentes/notificacao-de-receita-b.pdf";

function todayBR(): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}
function recipePath(path: string, patientId: string | null): string {
  return patientId ? path + "?patientId=" + encodeURIComponent(patientId) : path;
}
function printValue(value: string): string {
  return esc((value || "").trim());
}
function buildPhysicalNoticeHtml(type: NoticeType, f: NoticeFields, issuer: DocumentIssuer): string {
  const title = type === "A" ? "NOTIFICAÇÃO DE RECEITA A" : "NOTIFICAÇÃO DE RECEITA B";
  const color = type === "A" ? "#d2a900" : "#1764a0";
  const pale = type === "A" ? "#fff8d7" : "#e9f3fb";
  const printDate = todayBR();
  const field = (label: string, value: string) =>
    "<div class=\"field\"><span>" + label + "</span><strong>" + (printValue(value) || "&nbsp;") + "</strong></div>";
  return "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>" + title + "</title>" +
    "<style>@page{size:A4 portrait;margin:7mm}*{box-sizing:border-box}body{margin:0;font:10pt Arial,sans-serif;color:#111}.sheet{width:196mm;min-height:282mm;margin:0 auto;border:1px solid #333;padding:5mm;background:" + pale + "}.head{display:grid;grid-template-columns:1.3fr 1fr .8fr;gap:4mm;border:1px solid #333;padding:3mm;background:#fff}.title{border:2px solid " + color + ";text-align:center;padding:4mm 2mm;font-size:14pt;font-weight:700}.badge{border:2px solid " + color + ";text-align:center;padding:2mm;font-weight:700}.badge b{display:block;font-size:20pt;color:" + color + "}.number{font-size:8pt;overflow-wrap:anywhere;margin-top:2mm}.date{margin-top:3mm;border-top:1px solid #333;padding-top:2mm}.section{margin-top:4mm;border:1px solid #333;background:#fff;padding:3mm}.section-title{font-weight:700;text-transform:uppercase;font-size:9pt;color:" + color + ";border-bottom:1px solid #777;padding-bottom:1.5mm;margin-bottom:2mm}.issuer{font-size:9pt;line-height:1.45}.grid{display:grid;grid-template-columns:1fr 1fr;gap:3mm}.field{min-height:15mm;border-bottom:1px solid #555;padding:1mm 1.5mm;display:flex;flex-direction:column;gap:1mm}.field span{font-size:7pt;text-transform:uppercase;font-weight:700;color:#333}.field strong{font-size:10pt;font-weight:400;white-space:pre-wrap;overflow-wrap:anywhere}.rx{min-height:64mm}.rx .field{min-height:17mm}.signature{margin-top:10mm;text-align:center;width:58%;margin-left:auto}.signature .line{border-top:1px solid #222;padding-top:2mm}.fine{font-size:7pt;line-height:1.35;color:#333}.footer{margin-top:4mm;border-top:1px solid #555;padding-top:2mm}@media print{html,body{width:100%;height:100%;background:#fff}.sheet{margin:0 auto;break-inside:avoid;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style>" +
    "</head><body><main class=\"sheet\">" +
    "<header class=\"head\"><div class=\"issuer\"><div class=\"section-title\">Identificação do emitente</div><b>" + printValue(issuer.doctorName) + "</b><br>" + printValue(issuerCredentials(issuer)) + "<br>" + printValue(issuerContactLine(issuer)) + "</div>" +
    "<div class=\"title\">" + title + "<div class=\"fine\">Modelo físico · Lista " + (type === "A" ? "A1" : "B1") + "</div></div>" +
    "<div class=\"badge\"><b>" + type + "</b>NÚMERO<div class=\"number\">" + printValue(f.numeroFisicoVisa) + "</div></div></header>" +
    "<section class=\"section\"><div class=\"section-title\">Prescrição</div><div class=\"grid\">" +
    field("Nome do medicamento", f.medicamento) + field("Concentração", f.concentracao) +
    field("Forma farmacêutica", f.formaFarmaceutica) + field("Quantidade", f.quantidade) +
    "</div><div class=\"field\"><span>Posologia</span><strong>" + (printValue(f.posologia) || "&nbsp;") + "</strong></div></section>" +
    "<section class=\"section\"><div class=\"section-title\">Paciente</div><div class=\"grid\">" +
    field("Nome", f.paciente) + field("CPF ou, se estrangeiro, passaporte", f.documentoPaciente) +
    field("Endereço completo", f.enderecoPaciente) + field("Telefone", f.telefonePaciente) +
    "</div></section>" +
    "<div class=\"signature\"><div class=\"line\"><b>" + printValue(issuer.doctorName) + "</b><br>" + printValue(issuerCredentials(issuer)) + "<br>Assinatura e carimbo do prescritor</div></div>" +
    "<section class=\"section\"><div class=\"section-title\">Identificação do comprador</div><div class=\"grid\">" +
    field("Nome", "") + field("CPF ou, se estrangeiro, passaporte", "") + field("Endereço completo", "") + field("Telefone", "") +
    "</div></section>" +
    "<section class=\"section\"><div class=\"section-title\">Impressão</div><div class=\"grid\">" +
    field("Nome da gráfica", f.graficaNome) + field("CNPJ", f.graficaCnpj) + field("Endereço completo da gráfica", f.graficaEndereco) + field("Data de impressão", printDate) +
    "</div></section>" +
    "<div class=\"footer fine\">Data da prescrição: " + printValue(f.data) + " · Município/UF: " + printValue(issuerCityLine(issuer)) + "</div>" +
    "</main></body></html>";
}

function PhysicalNoticePage({ type }: { type: NoticeType }) {
  const [, setLocation] = useLocation();
  const { issuer } = useIssuer();
  const { accessMode, isAuthenticated } = useAuth();
  const { activeClinicId } = useClinic();
  const isRemoteClinical = accessMode === "remote" && isAuthenticated;
  const patientId = readRouteParam("patientId") || null;
  const isA = type === "A";
  const listCode = isA ? "A1" : "B1";
  const title = isA ? "Receita A1" : "Receita B1";
  const officialModel = isA ? OFFICIAL_MODEL_A : OFFICIAL_MODEL_B;
  const [f, setF] = useState<NoticeFields>({ ...EMPTY, data: todayBR() });
  const [patientLoading, setPatientLoading] = useState(false);

  useEffect(() => {
    if (!patientId || (isRemoteClinical && !activeClinicId)) return;
    let cancelled = false;
    setPatientLoading(true);
    const patientUrl = isRemoteClinical
      ? "/api/live/patients/" + encodeURIComponent(patientId) + "?clinicId=" + encodeURIComponent(activeClinicId ?? "")
      : "/api/patients/" + encodeURIComponent(patientId);
    apiRequest("GET", patientUrl)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const patient = isRemoteClinical ? payload?.profile ?? {} : payload?.patient ?? payload?.data ?? payload;
        setF((current) => ({
          ...current,
          paciente: current.paciente || patient?.name || "",
          documentoPaciente: current.documentoPaciente || patient?.cpf || patient?.cpfDigits || patient?.passport || "",
          enderecoPaciente: current.enderecoPaciente || patient?.address || patient?.guardianAddress || "",
          telefonePaciente: current.telefonePaciente || patient?.phone || patient?.telephone || patient?.guardianPhone || "",
        }));
        setPatientLoading(false);
      })
      .catch(() => { if (!cancelled) setPatientLoading(false); });
    return () => { cancelled = true; };
  }, [activeClinicId, isRemoteClinical, patientId]);

  const set = (key: keyof NoticeFields) =>
    ({ target }: { target: { value: string; checked?: boolean } }) => {
      const value = key === "confirmouNumeroVisa" ? Boolean(target.checked) : target.value;
      setF((previous) => ({ ...previous, [key]: value }));
    };

  function validateForPrint(): string[] {
    const missing: string[] = [];
    if (!patientId) missing.push("abra o prontuário do paciente antes de emitir");
    if (!issuer.doctorName.trim()) missing.push("nome do prescritor");
    if (!issuer.credentialsLine.trim()) missing.push("inscrição profissional com conselho e UF");
    if (!(issuer.addressLine1.trim() || issuer.addressLine2.trim())) missing.push("endereço do emitente");
    if (!issuer.phone.trim()) missing.push("telefone do emitente");
    if (!f.numeroFisicoVisa.trim()) missing.push("número físico atribuído pela Visa");
    if (!f.confirmouNumeroVisa) missing.push("confirmação de que o número foi atribuído para uso físico neste tipo");
    if (!f.paciente.trim()) missing.push("nome do paciente");
    if (!f.documentoPaciente.trim()) missing.push("CPF ou passaporte do paciente");
    if (!f.enderecoPaciente.trim()) missing.push("endereço completo do paciente");
    if (!f.telefonePaciente.trim()) missing.push("telefone do paciente");
    if (!f.medicamento.trim()) missing.push("nome do medicamento");
    if (!f.concentracao.trim()) missing.push("concentração");
    if (!f.formaFarmaceutica.trim()) missing.push("forma farmacêutica");
    if (!f.quantidade.trim()) missing.push("quantidade");
    if (!f.posologia.trim()) missing.push("posologia");
    if (!f.data.trim()) missing.push("data da prescrição");
    if (!f.graficaNome.trim()) missing.push("nome da gráfica");
    if (!f.graficaCnpj.trim()) missing.push("CNPJ da gráfica");
    if (!f.graficaEndereco.trim()) missing.push("endereço da gráfica");
    return missing;
  }

  const handlePrint = () => {
    const missing = validateForPrint();
    if (missing.length) {
      window.alert("Antes de imprimir, complete: " + missing.join(", ") + ".");
      return;
    }
    const win = window.open("", "_blank");
    if (!win) {
      window.alert("O navegador bloqueou a janela de impressão. Autorize pop-ups para este aplicativo e tente novamente.");
      return;
    }
    win.opener = null;
    win.document.write(buildPhysicalNoticeHtml(type, f, issuer));
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 500);
  };

  const hrefFor = (path: string) => recipePath(path, patientId);
  const pageSubtitle = isA
    ? "Notificação de Receita A para medicamento da Lista A1. Este fluxo imprime somente o modelo físico."
    : "Notificação de Receita B para medicamento da Lista B1. Este fluxo imprime somente o modelo físico.";

  return (
    <div className="space-y-5 pb-8">
      <PageHero
        icon={FileText}
        eyebrow={ANVISA_V2}
        title={title}
        subtitle={pageSubtitle}
        gradient={isA ? "from-amber-500 to-yellow-700" : "from-sky-600 to-blue-800"}
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePrint} disabled={patientLoading || !patientId} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir Notificação {type}
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setF({ ...EMPTY, data: todayBR() })}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </PageHero>

      <nav aria-label="Tipos de receituário controlado" className="flex flex-wrap gap-2" role="tablist">
        <Button asChild variant="outline" size="sm" role="tab" aria-selected="false"><a href={hrefFor("/receita-c1")}>Receita C1</a></Button>
        <Button asChild variant={isA ? "default" : "outline"} size="sm" role="tab" aria-selected={isA}><a href={hrefFor("/receita-a1")}>Receita A1</a></Button>
        <Button asChild variant={!isA ? "default" : "outline"} size="sm" role="tab" aria-selected={!isA}><a href={hrefFor("/receita-b1")}>Receita B1</a></Button>
      </nav>

      <div className="rounded-2xl border border-amber-400/60 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100" data-testid="visa-numbering-notice">
        <strong>Numeração oficial:</strong> digite somente o número físico que a Vigilância Sanitária forneceu para esta espécie de Notificação e confirme a origem. O aplicativo não cria, reserva ou valida sequências oficiais. A numeração física não pode ser trocada por número eletrônico SNCR. A API SNCR não está conectada a esta emissão.
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <a href={officialModel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">
          Consultar modelo oficial físico Anvisa — Versão 2 <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <span className="text-muted-foreground">O PDF aberto pela Anvisa é a referência vigente; compare o formulário preenchido antes de imprimir.</span>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Dados da Notificação {type}</h2>
          <span className="text-xs text-muted-foreground">{patientLoading ? "Carregando paciente…" : patientId ? "Paciente vinculado ao prontuário" : "Abra esta tela pelo prontuário"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="notice-number" className="text-xs font-semibold">Número físico fornecido pela Vigilância Sanitária *</label>
            <Input id="notice-number" value={f.numeroFisicoVisa} onChange={set("numeroFisicoVisa")} placeholder="Transcreva exatamente o número atribuído para uso físico" className="mt-1" autoComplete="off" />
            <label className="mt-2 flex items-start gap-2 text-xs">
              <input type="checkbox" checked={f.confirmouNumeroVisa} onChange={set("confirmouNumeroVisa")} className="mt-0.5" />
              <span>Confirmo que este número foi atribuído pela Vigilância Sanitária para Notificação {type} em papel.</span>
            </label>
          </div>
          <div>
            <label htmlFor="notice-date" className="text-xs font-semibold">Data da prescrição *</label>
            <Input id="notice-date" value={f.data} onChange={set("data")} placeholder="DD/MM/AAAA" className="mt-1" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="notice-patient" className="text-xs font-semibold">Paciente *</label><Input id="notice-patient" value={f.paciente} onChange={set("paciente")} className="mt-1" /></div>
          <div><label htmlFor="notice-document" className="text-xs font-semibold">CPF ou passaporte do paciente *</label><Input id="notice-document" value={f.documentoPaciente} onChange={set("documentoPaciente")} className="mt-1" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="notice-address" className="text-xs font-semibold">Endereço completo do paciente *</label><Input id="notice-address" value={f.enderecoPaciente} onChange={set("enderecoPaciente")} className="mt-1" /></div>
          <div><label htmlFor="notice-phone" className="text-xs font-semibold">Telefone do paciente *</label><Input id="notice-phone" value={f.telefonePaciente} onChange={set("telefonePaciente")} className="mt-1" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="notice-drug" className="text-xs font-semibold">Nome do medicamento *</label><Input id="notice-drug" value={f.medicamento} onChange={set("medicamento")} className="mt-1" /></div>
          <div><label htmlFor="notice-strength" className="text-xs font-semibold">Concentração *</label><Input id="notice-strength" value={f.concentracao} onChange={set("concentracao")} className="mt-1" /></div>
          <div><label htmlFor="notice-form" className="text-xs font-semibold">Forma farmacêutica *</label><Input id="notice-form" value={f.formaFarmaceutica} onChange={set("formaFarmaceutica")} className="mt-1" /></div>
          <div><label htmlFor="notice-quantity" className="text-xs font-semibold">Quantidade *</label><Input id="notice-quantity" value={f.quantidade} onChange={set("quantidade")} className="mt-1" /></div>
        </div>
        <div><label htmlFor="notice-posology" className="text-xs font-semibold">Posologia *</label><Textarea id="notice-posology" value={f.posologia} onChange={set("posologia")} className="mt-1 min-h-[88px]" /></div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold">Dados da gráfica indicados no modelo físico</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label htmlFor="notice-printer-name" className="text-xs font-semibold">Nome da gráfica *</label><Input id="notice-printer-name" value={f.graficaNome} onChange={set("graficaNome")} className="mt-1" /></div>
          <div><label htmlFor="notice-printer-cnpj" className="text-xs font-semibold">CNPJ *</label><Input id="notice-printer-cnpj" value={f.graficaCnpj} onChange={set("graficaCnpj")} className="mt-1" /></div>
          <div><label htmlFor="notice-printer-address" className="text-xs font-semibold">Endereço completo da gráfica *</label><Input id="notice-printer-address" value={f.graficaEndereco} onChange={set("graficaEndereco")} className="mt-1" /></div>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">A identificação do comprador deve ser completada na dispensação. O profissional deve confirmar a classificação do medicamento e os dados antes da assinatura. A interface não classifica substâncias nem substitui avaliação do prescritor.</p>
    </div>
  );
}

export function ReceitaA1Page() {
  return <PhysicalNoticePage type="A" />;
}
export function ReceitaB1Page() {
  return <PhysicalNoticePage type="B" />;
}

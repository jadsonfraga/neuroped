import { useEffect, useMemo, useState } from "react";
import { FileText, Printer, RefreshCw, PenSquare, Sparkles, Copy, ClipboardPaste, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";
import { escapeHtml } from "@/lib/htmlEscape";
import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";
import { gerarEValidar, type EntradaLaudo } from "@/lib/laudo/gerador";
import { laudoParaTexto } from "@/lib/laudo/paraTexto";
import {
  issuerCityLine,
  issuerCredentials,
  useIssuer,
  type DocumentIssuer,
} from "@/lib/issuer";
import { dateStamp } from "@/lib/printDocument";
import { apiRequest } from "@/lib/queryClient";
import { readRouteParam } from "@/lib/routeQuery";

/* ────────────────────────────────────────────────────────────
   Laudo Neuropediátrico — WebUI de geração assistida (embutida)
   Identidade do emissor: fonte única client/src/lib/issuer.ts
   Geração 100% local (sem API externa), com a doutrina PANT:
     CID-10/CID-11 em paralelo · sem perfumaria de IA · sem "(est.)"
──────────────────────────────────────────────────────────── */

const CAMPOS_IDENTIFICACAO: { key: keyof EntradaLaudo; label: string; placeholder: string }[] = [
  { key: "paciente", label: "Nome do paciente", placeholder: "Ex.: Fulano de Tal" },
  { key: "dataNascimento", label: "Data de nascimento", placeholder: "AAAA-MM-DD" },
  { key: "idade", label: "Idade", placeholder: "Ex.: 7 anos" },
  { key: "sexo", label: "Sexo", placeholder: "Ex.: masculino" },
  { key: "cidade", label: "Cidade/UF", placeholder: "Ex.: Petrolina/PE" },
  { key: "dataAvaliacao", label: "Data da avaliação", placeholder: "AAAA-MM-DD" },
  { key: "protocolo", label: "Protocolo", placeholder: "Ex.: nº 2026-0145" },
];

const CAMPOS_CLINICOS: { key: keyof EntradaLaudo; label: string; ajuda: string; placeholder: string }[] = [
  { key: "motivoAvaliacao", label: "Motivo da avaliação", ajuda: "Demanda principal e encaminhamento.", placeholder: "Ex.: encaminhado pela escola para investigação de dificuldade de atenção e aprendizado…" },
  { key: "historiaClinica", label: "História clínica", ajuda: "História clínica geral, familiar, escolar e social.", placeholder: "Ex.: gestação sem intercorrências; parto a termo…" },
  { key: "historiaNeurodesenvolvimento", label: "História do neurodesenvolvimento", ajuda: "Marcos motores, de linguagem e sociais.", placeholder: "Ex.: sentou aos 8 meses, primeiros vocábulos aos 2 anos…" },
  { key: "gestacaoPartoPuerperio", label: "Gestação, parto e puerpério", ajuda: "Antecedentes perinatais.", placeholder: "Ex.: pré-natal com 8 consultas; Apgar 9/10…" },
  { key: "exameClinico", label: "Exame clínico", ajuda: "Estado geral, antropometria, cabeça, marcha etc.", placeholder: "Ex.: bom estado geral, perímetro cefálico no percentil 50…" },
  { key: "exameNeurologico", label: "Exame neurológico", ajuda: "Tônus, reflexos, coordenação, pares cranianos.", placeholder: "Ex.: tônus normal, reflexos presentes e simétricos…" },
  { key: "exameComportamental", label: "Exame comportamental / mental", ajuda: "Interação, atenção, linguagem, comportamento.", placeholder: "Ex.: contato visual fugaz, linguagem ecolálica parcial…" },
  { key: "escalasInstrumentos", label: "Escalas e instrumentos aplicados", ajuda: "Quais escalas/instrumentos foram usados.", placeholder: "Ex.: M-CHAT-R/F, SNAP-IV, avaliação fonoaudiológica…" },
  { key: "escalasResultado", label: "Resultado das escalas", ajuda: "Escores e classificação (números reais apenas).", placeholder: "Ex.: M-CHAT-R/F 6/23 — risco alto; SNAP-IV atenção 2.4…" },
  { key: "documentosAnalisados", label: "Documentos analisados", ajuda: "Laudos anteriores, laudos de outros profissionais.", placeholder: "Ex.: laudo fonoaudiológico de 03/2026; relatório escolar…" },
  { key: "hipoteseDiagnostica", label: "Hipótese / impressão diagnóstica (prosa)", ajuda: "Diagnósticos em prosa; o motor extrai os itens com CID.", placeholder: "Ex.: TEA nível 1 de gravidade (F84.0) associado a TDAH…; ou um por linha." },
  { key: "cid10", label: "CID-10 (paralelo)", ajuda: "Códigos CID-10 separados por ' · ' ou ', '.", placeholder: "Ex.: F84.0 · F90.0" },
  { key: "cid11", label: "CID-11 (paralelo)", ajuda: "Mesma ordem dos CID-10.", placeholder: "Ex.: 6A02.0 · 6A05.2" },
  { key: "conduta", label: "Conduta", ajuda: "Tratamento, medicações (com posologia se houver), encaminhamentos.", placeholder: "Ex.: iniciar metilfenidato; encaminhamento para fonoaudiologia e terapia ocupacional…" },
  { key: "recomendacoes", label: "Recomendações", ajuda: "Orientações à família e à escola.", placeholder: "Ex.: orientações de rotina, adaptações escolares…" },
];

function limpo(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function buildPrintHtml(texto: string, issuer: DocumentIssuer): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const safeText = escapeHtml(texto.trim() || "Sem conteúdo informado.");
  const esc = escapeHtml;
  const credenciais = issuerCredentials(issuer);
  const emitLinha1 = [issuer.doctorName, credenciais].filter(Boolean).join(" · ");
  const emitLinha2 = [issuer.specialty, issuerCityLine(issuer)].filter(Boolean).join(" · ");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Laudo Médico Neuropediátrico</title>
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
      <div class="wm">${esc(issuer.clinicName)}</div>
      <div class="tg">${esc(issuer.specialty)}</div>
    </div>
    <div class="rt">
      <div class="doc-title">Laudo Médico Neuropediátrico</div>
      <div class="emit">${esc(emitLinha1)}${emitLinha2 ? `<br>\n        ${esc(emitLinha2)}` : ""}</div>
    </div>
  </div>
  <div class="ribbon"><i class="g"></i><i class="t"></i><i class="b"></i><i class="n"></i></div>
  <main class="doc-text">${safeText}</main>
  <div class="sig-area">
    <div class="sig-nm">${esc(issuer.doctorName)}</div>
    <div class="sig-rg">${esc([credenciais, issuer.specialty].filter(Boolean).join(" — "))}</div>
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

const ENTRADA_VAZIA: EntradaLaudo = {
  paciente: "",
  dataNascimento: "",
  idade: "",
  sexo: "",
  cidade: "",
  dataAvaliacao: "",
  protocolo: "",
  motivoAvaliacao: "",
  historiaClinica: "",
  historiaNeurodesenvolvimento: "",
  gestacaoPartoPuerperio: "",
  exameClinico: "",
  exameNeurologico: "",
  exameComportamental: "",
  escalasInstrumentos: "",
  escalasResultado: "",
  documentosAnalisados: "",
  hipoteseDiagnostica: "",
  cid10: "",
  cid11: "",
  conduta: "",
  recomendacoes: "",
  diagnosticos: [],
};

export default function LaudoNeuropedPage() {
  const { issuer } = useIssuer();
  const [entrada, setEntrada] = useState<EntradaLaudo>(ENTRADA_VAZIA);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const patientId = readRouteParam("patientId") || null;

  // Aberto a partir de um paciente, o laudo já nasce identificado. Antes, o
  // `patientId` só era usado nos metadados do documento salvo: quem vinha da
  // ficha do paciente redigitava nome e data de nascimento — justamente os
  // campos em que um erro de digitação compromete o documento. A receita C1 já
  // fazia isso; o laudo estava fora do padrão.
  //
  // Só preenche campo VAZIO: conteúdo já digitado nunca é sobrescrito.
  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    apiRequest("GET", `/api/patients/${encodeURIComponent(patientId)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const patient = payload?.patient ?? payload?.data ?? payload;
        if (!patient?.name) return;
        setEntrada((current) => ({
          ...current,
          paciente: current.paciente || patient.name,
          dataNascimento: current.dataNascimento || patient.birthDate || "",
          cid10: current.cid10 || patient.diagnosisCode || "",
        }));
      })
      .catch(() => {
        // Sem backend alcançável o laudo continua totalmente preenchível à mão.
      });
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const configurado = useMemo(() => {
    return (
      limpo(entrada.paciente).length > 1 &&
      (limpo(entrada.hipoteseDiagnostica).length > 2 ||
        limpo(entrada.motivoAvaliacao).length > 2 ||
        limpo(entrada.conduta).length > 2)
    );
  }, [entrada]);

  const resultado = useMemo(() => {
    if (!configurado) return null;
    return gerarEValidar(entrada);
  }, [entrada, configurado]);

  const handleChange = (key: keyof EntradaLaudo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setEntrada((prev) => ({ ...prev, [key]: e.target.value }));

  const handleGerar = () => {
    if (!resultado) return;
    const textoIntegral = laudoParaTexto(resultado.laudo);
    setTexto(textoIntegral);
    setEditando(false);
    setShowPreview(true);
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.opener = null;
    win.document.write(buildPrintHtml(texto, issuer));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  const filename = `laudo-neuroped-${dateStamp()}`;

  const aprovado = resultado?.qa.startsWith("APROVADO");
  const aprovadoLabel = resultado
    ? resultado.qa.startsWith("APROVADO")
      ? "QA de doutrina: APROVADO — CID-10/CID-11 em paralelo, sem perfumaria de IA."
      : resultado.qa.replace("REPROVADO:", "QA de doutrina — corrigir antes de emitir:")
    : "";

  return (
    <div className="space-y-5 pb-8">
      <PageHero
        icon={FileText}
        eyebrow="documento clínico"
        title="Laudo Neuropediátrico"
        subtitle="Geração assistida embutida (100% local, sem API externa): preencha os dados clínicos, gere o laudo na estrutura PANT com QA automático de doutrina, revise e emita com assinatura ICP-Brasil."
        gradient="from-primary to-chart-2"
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEditando((v) => !v)} variant={editando ? "default" : "outline"} size="sm" className="gap-2">
            <ClipboardPaste className="h-4 w-4" />
            {editando ? "Preenchendo" : "Voltar ao preenchimento"}
          </Button>
          <Button onClick={handleGerar} disabled={!configurado} size="sm" className="gap-2">
            <Sparkles className="h-4 w-4" /> Gerar laudo
          </Button>
          <Button onClick={() => setShowPreview((v) => !v)} variant="outline" size="sm" className="gap-2" disabled={!texto}>
            <FileText className="h-4 w-4" />
            {showPreview ? "Fechar prévia" : "Visualizar"}
          </Button>
          <Button onClick={handlePrint} size="sm" className="gap-2" disabled={!texto}>
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => { setEntrada(ENTRADA_VAZIA); setTexto(""); setShowPreview(false); }}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </PageHero>

      {/* ── Preenchimento clínico (editor guiado) ─────────────── */}
      {editando && (
        <section className="rounded-2xl border border-border/70 bg-card/80 p-4 sm:p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-foreground">1 · Identificação do paciente</h2>
            <p className="mt-1 text-xs text-muted-foreground">Dados da capa do laudo. Preencha ao menos o nome.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS_IDENTIFICACAO.map((c) => (
                <div key={c.key} className="space-y-1">
                  <Label htmlFor={`id-${c.key}`} className="text-xs">{c.label}</Label>
                  <Input
                    id={`id-${c.key}`}
                    value={entrada[c.key] as string}
                    onChange={handleChange(c.key)}
                    placeholder={c.placeholder}
                    data-testid={`input-${c.key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-foreground">2 · Conteúdo clínico</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Texto livre: o motor preserva literalmente o que você escrever e compõe a prosa clínica ao redor. Preencha o que tiver; campos vazios recebem prosa neutra para revisão.
            </p>
            <div className="mt-3 space-y-3">
              {CAMPOS_CLINICOS.map((c) => (
                <div key={c.key} className="space-y-1">
                  <Label htmlFor={`cl-${c.key}`} className="text-xs">
                    {c.label}
                    <span className="ml-2 font-normal text-muted-foreground">{c.ajuda}</span>
                  </Label>
                  <Textarea
                    id={`cl-${c.key}`}
                    value={entrada[c.key] as string}
                    onChange={handleChange(c.key)}
                    placeholder={c.placeholder}
                    className="min-h-16 resize-y font-mono text-xs leading-relaxed"
                    data-testid={`textarea-${c.key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {configurado && resultado && (
            <div
              className={`rounded-xl border p-4 text-sm ${aprovado ? "border-emerald-400/60 bg-emerald-50/60 text-emerald-900" : "border-amber-400/70 bg-amber-50/70 text-amber-900"}`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {aprovado ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {aprovadoLabel}
              </div>
              {!aprovado && (
                <pre className="mt-2 whitespace-pre-wrap text-xs">{resultado.qa.replace("REPROVADO:", "")}</pre>
              )}
            </div>
          )}
        </section>
      )}

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
          signerName={issuer.doctorName || undefined}
          location={issuerCityLine(issuer) || undefined}
          reason="Laudo Neuropediatrico"
          archivePdf={async (bytes, meta) => {
            await archiveClinicalPdf({
              bytes,
              filename,
              documentType: "laudo",
              title: "Laudo Médico Neuropediátrico",
              patientId,
              signatureStatus: meta.signatureStatus,
              signatureType: meta.signatureType,
              signatureAlgorithm: meta.signatureAlgorithm,
              signerName: meta.signerName,
              certificateIssuer: meta.certificateIssuer,
              certificateValidUntil: meta.certificateValidUntil,
              metadata: { patientId, source: "laudo-neuroped", textLength: texto.trim().length },
            });
          }}
          buildPdf={async () => {
            const { buildDocumentPdf } = await import("@/lib/documentPdf");
            return buildDocumentPdf({
              title: "Laudo Medico Neuropediatrico",
              subtitle: "Gerado pela assistente embarcada NeuroPed EDJ",
              credentials: [
                [issuer.doctorName, issuerCredentials(issuer)].filter(Boolean).join(" - "),
                issuer.specialty,
              ].filter(Boolean),
              clinicName: issuer.clinicName,
              motto: issuer.motto,
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

      {/* ── Texto integral do laudo (revisão + emissão) ───────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground">Texto integral do laudo</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Revise e ajuste o texto antes de imprimir ou assinar. O gerador produz a versão inicial; tudo é editável.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleCopiar} disabled={!texto}>
            {copiado ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={
            editando
              ? "Preencha os campos clínicos acima e clique em \"Gerar laudo\"."
              : "Cole aqui o laudo médico completo, já com todos os dados do paciente…"
          }
          className="min-h-[520px] resize-y font-mono text-sm leading-relaxed"
          data-testid="textarea-laudo-integral"
        />
      </section>

      {showPreview && texto && (
        <div className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildPrintHtml(texto, issuer)}
            className="w-full"
            style={{ height: "680px", border: "none" }}
            title="Laudo Preview"
          />
        </div>
      )}
    </div>
  );
}

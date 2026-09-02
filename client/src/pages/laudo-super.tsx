import { useMemo, useState } from "react";
import { FileText, Printer, RefreshCw, Sparkles, Copy, ClipboardPaste, CheckCircle2, AlertCircle, Plus, Trash2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";
import { escapeHtml } from "@/lib/htmlEscape";
import {
  gerarEValidarSuper,
  gerarLaudoSuper,
  laudoSuperParaTexto,
  medicoSuper,
  type SuperEntrada,
} from "@/lib/laudo/modeloSuper";
import { dateStamp } from "@/lib/printDocument";

/* ────────────────────────────────────────────────────────────
   Laudo SuperNeuroPed — WebUI de geração assistida (embutida)
   Dr. Jadson Fraga Araújo Júnior | CRM-PE 25.227 | RQE 17756
   Perfil do modelo PANT real (Luiza Gonçalves Silva):
   capa rica · 14 seções · mapa funcional · hipóteses
   com prós/contras · 3 cenários · assin. Soli Deo Gloria
   100% local — sem API externa (sem Claude)
──────────────────────────────────────────────────────────── */

const ENTRADA_VAZIA: SuperEntrada = {
  nome: "",
  idade: "",
  tipoConsulta: "",
  dataConsulta: "",
  resumoCapa: "",
  caixaCid: "",
  protocolo: "",
  cidade: "",
  quemE: "",
  acompanhadoPor: "",
  observacaoEntrevista: "",
  motivo: "",
  motivoContexto: "",
  historiaSubsecoes: [],
  convergencia: "",
  divergencias: "",
  documentosConvergentes: "",
  funcionando: [],
  pedeAtencao: [],
  hipoteses: [],
  achadosComplementares: "",
  cids: [],
  planoMulti: [],
  condutaFarmaco: "",
  solicitacoes: [],
  prognosticoLeitura: "",
  cenarioFavoravel: [],
  cenarioEsperado: [],
  cenarioReservado: [],
  sinaisAlerta: [],
  retornoCondicao: "",
  sintese: "",
};

function vazia(e: SuperEntrada): boolean {
  for (const k of Object.keys(e) as (keyof SuperEntrada)[]) {
    const v = e[k];
    if (v === undefined) continue;
    if (typeof v === "string" && v.trim()) return false;
    if (Array.isArray(v) && v.length) return false;
  }
  return true;
}

// ── Impressão no perfil SuperNeuroPed ───────────────────────────────────────

function buildPrintHtmlSuper(texto: string, paciente: string): string {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  });
  const safe = escapeHtml(texto.trim() || "Sem conteúdo informado.");
  const protocolo = `SuperNeuroPed nº ${dateStamp()}`;
  const esc = escapeHtml;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Laudo SuperNeuroPed — ${esc(paciente)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Carlito:ital,wght@0,400;0,700;1,400&family=Marcellus&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:13mm 15mm 19mm 15mm}
:root{--navy:#1E2A4A;--navyd:#0B1024;--bordo:#7A1F2B;--gold:#C9A961;--goldd:#A88844;
  --teal:#2E7163;--salmon:#A8463D;--ink:#2C2C3E;--graf:#3A3A4C;--ink2:#5B5B6B;--line:#D9D2C2;
  --ivory:#FBF8F0;--box:#F7F4EC;--box2:#F3F5F2}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Carlito',Arial,sans-serif;font-size:10pt;color:var(--ink);background:#fff}

/* ── capa ── */
.cover{padding:10mm 10mm 8mm;border:1.6pt solid var(--navyd);border-radius:3mm}
.cover .brand{text-align:center;letter-spacing:.55em;font-family:'Marcellus',serif;font-size:17pt;color:var(--navyd);text-transform:uppercase}
.cover .kind{text-align:center;font-size:7pt;letter-spacing:.32em;color:var(--ink2);margin:1.5mm 0 7mm}
.cover .cols{display:flex;gap:8mm;align-items:flex-end}
.cover .left{flex:1.2}
.cover .left .av{font-family:'Cormorant Garamond',serif;font-size:13pt;line-height:1.25;color:var(--navy);font-weight:600;font-style:italic}
.cover .left .pat{font-size:7pt;letter-spacing:.22em;color:var(--ink2);margin:5mm 0 1mm}
.cover .left .nm{font-family:'Cormorant Garamond',serif;font-size:24pt;font-weight:600;color:var(--navyd);line-height:1.05}
.cover .left .meta{font-size:8.5pt;color:var(--ink2);margin-top:1.5mm}
.cover .right{flex:1;text-align:right}
.cover .right .bar{height:5mm;width:100%;background:linear-gradient(90deg,var(--gold) 0%,var(--bordo) 48%,var(--navyd) 100%)}
.cover .right .proto{font-size:7pt;color:var(--ink2);margin-top:2mm}
.cover .syn{margin-top:6mm;border:.6pt solid var(--line);background:var(--box);border-radius:2mm;padding:4mm 5mm;font-size:9.5pt;line-height:1.6;color:var(--graf)}
.cover .cid{margin-top:3mm;border:.6pt solid var(--line);background:var(--box2);border-radius:2mm;padding:3mm 5mm;font-size:9pt;line-height:1.55;color:var(--navy)}
.cover .medico{margin-top:6mm;padding-top:4mm;border-top:.5pt solid var(--line);font-size:7.5pt;color:var(--ink2);line-height:1.7}
.cover .medico b{font-weight:700;color:var(--navyd)}

/* ── corpo ── */
.doc{margin-top:7mm;font-size:9.6pt;line-height:1.68;color:var(--ink)}
.doc h2{font-family:'Cormorant Garamond',serif;font-size:14pt;font-weight:600;color:var(--navyd);border-bottom:.5pt solid var(--line);padding-bottom:1mm;margin:6mm 0 2.5mm}
.doc h2 .num{font-family:'Marcellus',serif;font-size:10pt;color:var(--goldd);margin-right:2mm}
.doc h3{font-family:'Marcellus',serif;font-size:10pt;font-weight:500;color:var(--navy);letter-spacing:.14em;text-transform:uppercase;margin:4mm 0 1.5mm}
.doc p{margin-bottom:2.2mm}
.doc .cap{font-size:7pt;font-weight:700;letter-spacing:.14em;color:var(--salmon);font-variant:small-caps;text-transform:uppercase;margin-right:1.5mm}
.doc .box{border:.6pt solid var(--line);background:var(--box);border-radius:2mm;padding:3mm 4mm;margin:2.5mm 0}
.doc .box h4{font-family:'Marcellus',serif;font-size:8.5pt;letter-spacing:.18em;color:var(--gold);text-transform:uppercase;margin-bottom:1.5mm}
.doc .two{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin:2.5mm 0}
.doc .col{border:.6pt solid var(--line);border-radius:2mm;padding:3mm 4mm}
.doc .col.pro{background:var(--box2)}
.doc .col.con{background:var(--box)}
.doc .col b{font-family:'Marcellus',serif;font-size:8.5pt;letter-spacing:.12em;color:var(--navy);text-transform:uppercase;display:block;margin-bottom:1.2mm}
.doc .col p{font-size:8.8pt;margin-bottom:1.2mm;line-height:1.45}
.doc .b-pro{color:var(--teal)}
.doc .b-con{color:var(--salmon)}
.doc table{width:100%;border-collapse:collapse;margin:2.5mm 0;font-size:8.6pt}
.doc th{background:var(--navyd);color:#fff;font-weight:700;text-align:left;padding:1.6mm 2.5mm}
.doc td{border-bottom:.4pt solid var(--line);padding:1.6mm 2.5mm;vertical-align:top}
.doc .sig{text-align:center;margin-top:9mm;padding-top:5mm;border-top:.6pt solid var(--navyd)}
.doc .sig .nm{font-family:'Marcellus',serif;font-size:14pt;color:var(--navyd)}
.doc .sig .tg{font-size:8pt;letter-spacing:.22em;color:var(--ink2);margin-top:1.5mm;font-variant:small-caps;text-transform:uppercase}
.doc .sig .rg{font-size:8pt;letter-spacing:.2em;color:var(--ink2);margin-top:1mm}
.doc .sig .motto{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:11pt;color:var(--gold);margin-top:4mm}
.doc .sig .emp{font-size:6.5pt;color:var(--ink2);margin-top:1mm}
.footer{margin-top:7mm;border-top:.4pt solid var(--line);padding-top:2mm;font-size:6.5pt;color:var(--ink2);display:flex;justify-content:space-between}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<section class="cover">
  <div class="brand">S u p e r N e u r o P e d</div>
  <div class="kind">Laudo Neuropediátrico</div>
  <div class="cols">
    <div class="left">
      <div class="av">Avaliação Neuropsiquiátrica<br>do Neurodesenvolvimento</div>
      <div class="pat">PACIENTE</div>
      <div class="nm">${esc(paciente || "—")}</div>
      <div class="meta">${esc(hoje)}</div>
    </div>
    <div class="right">
      <div class="bar"></div>
      <div class="proto">${esc(protocolo)}</div>
    </div>
  </div>
  <div class="syn">${safe.split("\\n").slice(0, 3).join("<br>").split("=".repeat(60))[0]}</div>
  <div class="medico">
    <b>Dr. Jadson Fraga Araújo Júnior</b> · Neurologista Infantil · Neuropediatra · CRM-PE 25.227 · RQE 17.756<br>
    Rua Raimundo Lacerda, 001 · São José · Petrolina/PE · CEP 56302-470 · (87) 9 9109-7371 · drjadsonfraga@proton.me
  </div>
</section>
<main class="doc">
  ${safe.split("\n").map(l => {
    const t = esc(l);
    if (t.trim() === "") return "";
    if (t.includes("=".repeat(60))) return "";
    if (/^\d{2}\s{2,}/.test(t)) {
      const m = t.match(/^(\d{2})\s+(.+)$/);
      return m ? `<h2><span class="num">${m[1]}</span>${m[2]}</h2>` : `<h2>${t}</h2>`;
    }
    if (/^\[/.test(t) && t.includes("]")) {
      const m = t.match(/^\[([^\]]+)\]\s*(.*)$/);
      return m ? `<div class="box"><h4>${m[1]}</h4>${m[2] ? `<p>${m[2]}</p>` : ""}</div>` : `<div class="box"><p>${t}</p></div>`;
    }
    if (/^— /i.test(t)) {
      const sub = t.replace(/^— /, "");
      return `<h3>${sub}</h3>`;
    }
    if (/^◆ /.test(t)) return `<p><span class="b-pro">◆</span> ${t.slice(2)}</p>`;
    if (/^■ /.test(t)) return `<p><span class="b-con">■</span> ${t.slice(2)}</p>`;
    if (/^✦ /.test(t)) return `<p><span class="b-con">✦</span> ${t.slice(2)}</p>`;
    if (/^· /.test(t) && t.includes("CID-10")) {
      const m = t.match(/^· (.+) — CID-10 ([A-Z0-9.]+) · CID-11 ([0-9A-Z.]+) — (.+)$/);
      if (m) return `<p><span class="cap">${m[1]}</span><br>CID-10 ${m[2]} · CID-11 ${m[3]} — ${m[4]}</p>`;
    }
    if (/^INDICAÇÃO:|^EVIDÊNCIA:|^SOLICITAÇÕES/i.test(t)) {
      const m = t.match(/^(INDICAÇÃO|EVIDÊNCIA|SOLICITAÇÕES DESTA CONSULTA):\s*(.*)$/i);
      return m ? `<p><span class="cap">${m[1]}:</span>${m[2]}</p>` : `<p>${t}</p>`;
    }
    if (/^Dr\. Jadson/.test(t)) return `<div class="sig"><div class="nm">${t}</div></div>`;
    if (/Neurologista Infantil · Neuropediatra/.test(t)) return `<div class="sig"><div class="tg">${t}</div></div>`;
    if (/CRM-PE 25\.227 · RQE 17\.756/.test(t)) return `<div class="sig"><div class="rg">${t}</div></div>`;
    if (/Soli Deo Gloria/.test(t)) return `<div class="sig"><div class="motto">${t}</div></div>`;
    if (/Fraga Serviços Médicos/.test(t)) return `<div class="sig"><div class="emp">${t}</div></div>`;
    return `<p>${t}</p>`;
  }).join("\n")}
</main>
<div class="footer">
  <span>${esc(paciente || "Paciente")} · Laudo SuperNeuroPed</span>
  <span>${esc(protocolo)} · emitido em ${esc(hoje)}</span>
</div>
</body>
</html>`;
}

// ── Formulários auxiliares (repetidores) ────────────────────────────────────

function CampoLista({
  titulo,
  ajuda,
  valores,
  onChange,
}: {
  titulo: string;
  ajuda?: string;
  valores: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold">{titulo}</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => onChange([...valores, ""])}
        >
          <Plus className="h-3 w-3" /> item
        </Button>
      </div>
      {ajuda && <p className="text-[11px] text-muted-foreground">{ajuda}</p>}
      <div className="space-y-1.5">
        {valores.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <Textarea
              value={v}
              onChange={(e) => {
                const nv = [...valores];
                nv[i] = e.target.value;
                onChange(nv);
              }}
              placeholder="Um achado por item…"
              className="min-h-8 resize-y text-xs leading-relaxed"
              data-testid={`lista-${titulo.toLowerCase().slice(0, 24)}-${i}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 text-destructive/70"
              onClick={() => onChange(valores.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubsecaoRepetidor({
  valores,
  onChange,
}: {
  valores: { titulo: string; texto: string }[];
  onChange: (v: { titulo: string; texto: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold">Subseções da história (Seção 03)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => onChange([...valores, { titulo: "", texto: "" }])}
        >
          <Plus className="h-3 w-3" /> subseção
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Ex.: "O quadro do humor", "Sono", "Escola e atenção". Cada subseção vira uma caixa temática no laudo.
      </p>
      <div className="space-y-2">
        {valores.map((s, i) => (
          <Card key={i} className="p-3 space-y-1.5 bg-card/60">
            <div className="flex gap-1.5">
              <Input
                value={s.titulo}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], titulo: e.target.value };
                  onChange(nv);
                }}
                placeholder="Título da subseção (ex.: Sono)"
                className="text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 text-destructive/70"
                onClick={() => onChange(valores.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              value={s.texto}
              onChange={(e) => {
                const nv = [...valores];
                nv[i] = { ...nv[i], texto: e.target.value };
                onChange(nv);
              }}
              placeholder="Conteúdo da subseção…"
              className="min-h-14 resize-y text-xs leading-relaxed"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

function HipoteseRepetidor({
  valores,
  onChange,
}: {
  valores: { titulo: string; texto: string; aFavor: string[]; aPonderar: string[] }[];
  onChange: (v: { titulo: string; texto: string; aFavor: string[]; aPonderar: string[] }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold">Hipóteses em avaliação (Seção 06)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => onChange([...valores, { titulo: "", texto: "", aFavor: [""], aPonderar: [""] }])}
        >
          <Plus className="h-3 w-3" /> hipótese
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        O modelo nunca firma hipótese sem instrumento validado. Para cada uma, registre a leitura clínica e as duas colunas: "a favor" e "a ponderar".
      </p>
      <div className="space-y-3">
        {valores.map((h, i) => (
          <Card key={i} className="p-3 space-y-2 bg-card/60">
            <div className="flex gap-1.5">
              <Input
                value={h.titulo}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], titulo: e.target.value };
                  onChange(nv);
                }}
                placeholder='Título (ex.: "Quadro do humor, em reavaliação")'
                className="text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 text-destructive/70"
                onClick={() => onChange(valores.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              value={h.texto}
              onChange={(e) => {
                const nv = [...valores];
                nv[i] = { ...nv[i], texto: e.target.value };
                onChange(nv);
              }}
              placeholder="Leitura diagnóstica da hipótese…"
              className="min-h-14 resize-y text-xs leading-relaxed"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-teal-700">◆ A favor</Label>
                {h.aFavor.map((v, j) => (
                  <div key={j} className="flex gap-1.5">
                    <Textarea
                      value={v}
                      onChange={(e) => {
                        const nv = [...valores];
                        const af = [...nv[i].aFavor];
                        af[j] = e.target.value;
                        nv[i] = { ...nv[i], aFavor: af };
                        onChange(nv);
                      }}
                      className="min-h-7 resize-y text-xs"
                      placeholder="Fator que sustenta a hipótese…"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 text-destructive/60"
                      onClick={() => {
                        const nv = [...valores];
                        nv[i] = { ...nv[i], aFavor: nv[i].aFavor.filter((_, k) => k !== j) };
                        onChange(nv);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-teal-700"
                  onClick={() => {
                    const nv = [...valores];
                    nv[i] = { ...nv[i], aFavor: [...nv[i].aFavor, ""] };
                    onChange(nv);
                  }}
                >
                  <Plus className="h-3 w-3" /> item a favor
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-rose-700">■ A ponderar</Label>
                {h.aPonderar.map((v, j) => (
                  <div key={j} className="flex gap-1.5">
                    <Textarea
                      value={v}
                      onChange={(e) => {
                        const nv = [...valores];
                        const ap = [...nv[i].aPonderar];
                        ap[j] = e.target.value;
                        nv[i] = { ...nv[i], aPonderar: ap };
                        onChange(nv);
                      }}
                      className="min-h-7 resize-y text-xs"
                      placeholder="Ressalva antes de qualquer conclusão…"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 text-destructive/60"
                      onClick={() => {
                        const nv = [...valores];
                        nv[i] = { ...nv[i], aPonderar: nv[i].aPonderar.filter((_, k) => k !== j) };
                        onChange(nv);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] text-rose-700"
                  onClick={() => {
                    const nv = [...valores];
                    nv[i] = { ...nv[i], aPonderar: [...nv[i].aPonderar, ""] };
                    onChange(nv);
                  }}
                >
                  <Plus className="h-3 w-3" /> item a ponderar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PlanoRepetidor({
  valores,
  onChange,
}: {
  valores: { titulo: string; indicacao: string; evidencia: string }[];
  onChange: (v: { titulo: string; indicacao: string; evidencia: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold">Plano terapêutico multiprofissional (Seção 09)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => onChange([...valores, { titulo: "", indicacao: "", evidencia: "" }])}
        >
          <Plus className="h-3 w-3" /> frente
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Ex.: "Acompanhamento psiquiátrico", "Avaliação neuropsicológica". Cada frente carrega INDICAÇÃO e EVIDÊNCIA.
      </p>
      <div className="space-y-2">
        {valores.map((p, i) => (
          <Card key={i} className="p-3 space-y-1.5 bg-card/60">
            <div className="flex gap-1.5">
              <Input
                value={p.titulo}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], titulo: e.target.value };
                  onChange(nv);
                }}
                placeholder="Frente (ex.: Acompanhamento psiquiátrico)"
                className="text-xs"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 text-destructive/70"
                onClick={() => onChange(valores.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              value={p.indicacao}
              onChange={(e) => {
                const nv = [...valores];
                nv[i] = { ...nv[i], indicacao: e.target.value };
                onChange(nv);
              }}
              placeholder="INDICAÇÃO: o que se indica…"
              className="min-h-8 resize-y text-xs leading-relaxed"
            />
            <Textarea
              value={p.evidencia}
              onChange={(e) => {
                const nv = [...valores];
                nv[i] = { ...nv[i], evidencia: e.target.value };
                onChange(nv);
              }}
              placeholder="EVIDÊNCIA: o que sustenta a indicação…"
              className="min-h-8 resize-y text-xs leading-relaxed"
            />
          </Card>
        ))}
      </div>
    </div>
  );
}

function CidRepetidor({
  valores,
  onChange,
}: {
  valores: { hipotese: string; cid10: string; cid11: string; status: string }[];
  onChange: (v: { hipotese: string; cid10: string; cid11: string; status: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold">Códigos classificatórios (Seção 08)</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => onChange([...valores, { hipotese: "", cid10: "", cid11: "", status: "hipótese em avaliação, não firmada" }])}
        >
          <Plus className="h-3 w-3" /> código
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">CID-10 e CID-11 sempre em paralelo.</p>
      <div className="space-y-2">
        {valores.map((c, i) => (
          <Card key={i} className="p-3 bg-card/60">
            <div className="grid gap-1.5 sm:grid-cols-2">
              <Input
                value={c.hipotese}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], hipotese: e.target.value };
                  onChange(nv);
                }}
                placeholder="Hipótese (ex.: Episódio depressivo moderado)"
                className="text-xs"
              />
              <Input
                value={c.status}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], status: e.target.value };
                  onChange(nv);
                }}
                placeholder="Status (ex.: hipótese em reavaliação, não firmada)"
                className="text-xs"
              />
              <Input
                value={c.cid10}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], cid10: e.target.value };
                  onChange(nv);
                }}
                placeholder="CID-10 (ex.: F32.1)"
                className="text-xs"
              />
              <Input
                value={c.cid11}
                onChange={(e) => {
                  const nv = [...valores];
                  nv[i] = { ...nv[i], cid11: e.target.value };
                  onChange(nv);
                }}
                placeholder="CID-11 (ex.: 6A70.1)"
                className="text-xs"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 mt-1.5 text-[11px] text-destructive/70"
              onClick={() => onChange(valores.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-3 w-3" /> remover
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function LaudoSuperPage() {
  const [entrada, setEntrada] = useState<SuperEntrada>(ENTRADA_VAZIA);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [abertos, setAbertos] = useState<Record<string, boolean>>({ capa: true });

  const toggle = (k: string) => setAbertos((p) => ({ ...p, [k]: !p[k] }));

  const configurado = useMemo(() => {
    if (vazia(entrada)) return false;
    if (!entrada.nome.trim()) return false;
    const tem =
      entrada.historiaSubsecoes.length > 0 ||
      entrada.funcionando.length > 0 ||
      entrada.pedeAtencao.length > 0 ||
      entrada.hipoteses.length > 0 ||
      entrada.cids.length > 0 ||
      entrada.planoMulti.length > 0;
    return tem || limpo(entrada.quemE).length > 2 || limpo(entrada.motivo).length > 2;
  }, [entrada]);

  const resultado = useMemo(() => (configurado ? gerarEValidarSuper(entrada) : null), [entrada, configurado]);

  const set = (k: keyof SuperEntrada) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setEntrada((p) => ({ ...p, [k]: e.target.value }));

  const handleGerar = () => {
    if (!resultado) return;
    setTexto(laudoSuperParaTexto(resultado.laudo));
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
    win.document.write(buildPrintHtmlSuper(texto, entrada.nome));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  const aprovado = resultado?.qa.startsWith("APROVADO");
  const aprovadoLabel = resultado
    ? resultado.qa.startsWith("APROVADO")
      ? "QA de perfil: APROVADO — capa CID, mapa funcional, hipóteses com prós/contras, disclaimer, 3 cenários e sinais de alerta."
      : resultado.qa.replace("REPROVADO:", "QA de perfil — corrigir antes de emitir:")
    : "";

  const nomeArquivo = `laudo-super-${dateStamp()}`;

  return (
    <div className="space-y-5 pb-8">
      <PageHero
        icon={ShieldCheck}
        eyebrow="documento clínico · perfil premium"
        title="Laudo SuperNeuroPed"
        subtitle="Geração assistida 100% local (sem Claude, sem API externa) no perfil real do modelo PANT: capa rica, 14 seções, mapa funcional, hipóteses com a favor/a ponderar, prognóstico em 3 cenários e assinatura Soli Deo Gloria."
        gradient="from-primary to-chart-4"
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

      {/* ── Painel QA ── */}
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

      {/* ── Editor ── */}
      {editando && (
        <div className="space-y-4">
          <SecaoEditor titulo="Capa e identificação" chave="capa" aberto={!!abertos.capa} onToggle={() => toggle("capa")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <CampoTexto label="Nome do paciente" id="super-nome" value={entrada.nome} onChange={set("nome")} placeholder="Ex.: Luiza Gonçalves Silva" />
              <CampoTexto label="Idade" id="super-idade" value={entrada.idade} onChange={set("idade")} placeholder="Ex.: 17 anos" />
              <CampoTexto label="Tipo de consulta" id="super-tipo" value={entrada.tipoConsulta} onChange={set("tipoConsulta")} placeholder="Ex.: primeira consulta / reavaliação" />
              <CampoTexto label="Data da consulta (por extenso)" id="super-data" value={entrada.dataConsulta} onChange={set("dataConsulta")} placeholder="Ex.: 18 de agosto de 2026" />
              <CampoTexto label="Protocolo (sem prefixo)" id="super-protocolo" value={entrada.protocolo} onChange={set("protocolo")} placeholder="Ex.: 2026-08-18-0001" />
              <CampoTexto label="Cidade/UF" id="super-cidade" value={entrada.cidade} onChange={set("cidade")} placeholder="Ex.: Petrolina/PE" />
            </div>
            <TextareaArea label="Síntese da consulta (caixa da capa)" id="super-resumo" value={entrada.resumoCapa} onChange={set("resumoCapa")} placeholder="Parágrafo-síntese: demanda, contexto e interlocução com outras especialidades…" />
            <TextareaArea label="Caixa CID (capa)" id="super-caixaCid" value={entrada.caixaCid} onChange={set("caixaCid")} placeholder="Ex.: CID-10 F32.1 · CID-11 6A70.1, hipótese em reavaliação, não firmada nesta consulta" />
            <div className="mt-2">
              <CidRepetidor valores={entrada.cids} onChange={(v) => setEntrada((p) => ({ ...p, cids: v }))} />
            </div>
          </SecaoEditor>

          <SecaoEditor titulo="01 · Quem é o paciente" chave="quem" aberto={!!abertos.quem} onToggle={() => toggle("quem")}>
            <TextareaArea label="Apresentação narrativa" id="super-quemE" value={entrada.quemE} onChange={set("quemE")} placeholder="Ex.: Luiza é uma adolescente de dezessete anos que chega a esta consulta trazendo uma história já em andamento…" />
            <TextareaArea label="Acompanhado por" id="super-acomp" value={entrada.acompanhadoPor} onChange={set("acompanhadoPor")} placeholder="Ex.: Chega acompanhada da mãe." />
            <TextareaArea label="Observação sobre a entrevista" id="super-entrevista" value={entrada.observacaoEntrevista} onChange={set("observacaoEntrevista")} placeholder="Ex.: Comunicativa, de discurso organizado, capaz de descrever com precisão o que sente…" />
          </SecaoEditor>

          <SecaoEditor titulo="02 · Motivo da avaliação" chave="motivo" aberto={!!abertos.motivo} onToggle={() => toggle("motivo")}>
            <TextareaArea label="Queixas centrais" id="super-motivo" value={entrada.motivo} onChange={set("motivo")} placeholder="Ex.: A consulta se organiza em torno de duas queixas centrais…" />
            <TextareaArea label="Contexto amplo" id="super-motivoCtx" value={entrada.motivoContexto} onChange={set("motivoContexto")} placeholder="Ex.: Ao redor dessas duas queixas, orbita um histórico mais amplo…" />
          </SecaoEditor>

          <SecaoEditor titulo="03 · Estrutura da história" chave="hist" aberto={!!abertos.hist} onToggle={() => toggle("hist")}>
            <SubsecaoRepetidor valores={entrada.historiaSubsecoes} onChange={(v) => setEntrada((p) => ({ ...p, historiaSubsecoes: v }))} />
          </SecaoEditor>

          <SecaoEditor titulo="04 · Convergência das fontes" chave="conv" aberto={!!abertos.conv} onToggle={() => toggle("conv")}>
            <TextareaArea label="Convergências" id="super-conv" value={entrada.convergencia} onChange={set("convergencia")} placeholder="Ex.: O relato da mãe e o relato da própria Luiza convergem na maior parte dos pontos centrais…" />
            <TextareaArea label="Divergências (se houver)" id="super-div" value={entrada.divergencias} onChange={set("divergencias")} placeholder="Ex.: Divergem em aspectos de dinâmica familiar… o que é, em si, um achado clínico digno de nota." />
            <TextareaArea label="Documentos que convergem" id="super-docs" value={entrada.documentosConvergentes} onChange={set("documentosConvergentes")} placeholder="Ex.: Documento psicológico anterior converge com o relato clínico…" />
          </SecaoEditor>

          <SecaoEditor titulo="05 · Mapa funcional" chave="mapa" aberto={!!abertos.mapa} onToggle={() => toggle("mapa")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoLista titulo="◆ O que está funcionando" valores={entrada.funcionando} onChange={(v) => setEntrada((p) => ({ ...p, funcionando: v }))} />
              <CampoLista titulo="■ O que ainda pede atenção" valores={entrada.pedeAtencao} onChange={(v) => setEntrada((p) => ({ ...p, pedeAtencao: v }))} />
            </div>
          </SecaoEditor>

          <SecaoEditor titulo="06 · Leitura diagnóstica, hipóteses em avaliação" chave="hip" aberto={!!abertos.hip} onToggle={() => toggle("hip")}>
            <HipoteseRepetidor valores={entrada.hipoteses} onChange={(v) => setEntrada((p) => ({ ...p, hipoteses: v }))} />
          </SecaoEditor>

          <SecaoEditor titulo="07 · Achados complementares" chave="ach" aberto={!!abertos.ach} onToggle={() => toggle("ach")}>
            <TextareaArea label="Exames e investigações" id="super-achados" value={entrada.achadosComplementares} onChange={set("achadosComplementares")} placeholder="Ex.: Não há, até esta data, EEG ou neuroimagem solicitados…" />
          </SecaoEditor>

          <SecaoEditor titulo="08 · Diagnósticos firmados" chave="cid" aberto={!!abertos.cid} onToggle={() => toggle("cid")}>
            <CidRepetidor valores={entrada.cids} onChange={(v) => setEntrada((p) => ({ ...p, cids: v }))} />
            <p className="text-[11px] text-muted-foreground mt-2">
              O disclaimer da seção ("Nenhum diagnóstico é firmado por este documento…") é inserido automaticamente pelo perfil.
            </p>
          </SecaoEditor>

          <SecaoEditor titulo="09 · Plano terapêutico multiprofissional" chave="plano" aberto={!!abertos.plano} onToggle={() => toggle("plano")}>
            <PlanoRepetidor valores={entrada.planoMulti} onChange={(v) => setEntrada((p) => ({ ...p, planoMulti: v }))} />
          </SecaoEditor>

          <SecaoEditor titulo="10 · Conduta farmacológica e exames" chave="farm" aberto={!!abertos.farm} onToggle={() => toggle("farm")}>
            <TextareaArea label="Conduta farmacológica" id="super-farm" value={entrada.condutaFarmaco} onChange={set("condutaFarmaco")} placeholder="Ex.: Mantida sertralina 75 mg ao dia, dose de origem confirmada nesta consulta…" />
            <CampoLista titulo="Solicitações desta consulta" valores={entrada.solicitacoes} onChange={(v) => setEntrada((p) => ({ ...p, solicitacoes: v }))} />
          </SecaoEditor>

          <SecaoEditor titulo="11 · Prognóstico, leitura funcional" chave="prog" aberto={!!abertos.prog} onToggle={() => toggle("prog")}>
            <TextareaArea label="Leitura funcional" id="super-prog" value={entrada.prognosticoLeitura} onChange={set("prognosticoLeitura")} placeholder="Ex.: Falar em prognóstico, neste momento, é falar em condicionais…" />
          </SecaoEditor>

          <SecaoEditor titulo="12 · Prognóstico em cenários" chave="cen" aberto={!!abertos.cen} onToggle={() => toggle("cen")}>
            <div className="grid gap-4 sm:grid-cols-3">
              <CampoLista titulo="✦ Favorável" valores={entrada.cenarioFavoravel} onChange={(v) => setEntrada((p) => ({ ...p, cenarioFavoravel: v }))} />
              <CampoLista titulo="✦ Esperado" valores={entrada.cenarioEsperado} onChange={(v) => setEntrada((p) => ({ ...p, cenarioEsperado: v }))} />
              <CampoLista titulo="✦ Reservado" valores={entrada.cenarioReservado} onChange={(v) => setEntrada((p) => ({ ...p, cenarioReservado: v }))} />
            </div>
          </SecaoEditor>

          <SecaoEditor titulo="13 · Acompanhamento e retorno" chave="ret" aberto={!!abertos.ret} onToggle={() => toggle("ret")}>
            <CampoLista titulo="✦ Sinais de alerta para retorno antecipado" valores={entrada.sinaisAlerta} onChange={(v) => setEntrada((p) => ({ ...p, sinaisAlerta: v }))} />
            <TextareaArea label="Condição de retorno" id="super-retorno" value={entrada.retornoCondicao} onChange={set("retornoCondicao")} placeholder="Ex.: Retorno sugerido após conclusão das investigações em curso…" />
          </SecaoEditor>

          <SecaoEditor titulo="14 · Síntese e encaminhamento" chave="sint" aberto={!!abertos.sint} onToggle={() => toggle("sint")}>
            <TextareaArea label="Síntese dirigida ao paciente" id="super-sintese" value={entrada.sintese} onChange={set("sintese")} placeholder='Ex.: Luiza, este documento não fecha o que ainda está em aberto…' />
            <p className="text-[11px] text-muted-foreground">
              Assinatura institucional (Dr. Jadson Fraga Araújo Júnior · Neurologista Infantil · Neuropediatra · CRM-PE 25.227 · RQE 17.756 · Soli Deo Gloria · Fraga Serviços Médicos LTDA) é inserida automaticamente no PDF.
            </p>
          </SecaoEditor>

          {/* ── Assinatura ICP-Brasil ── */}
          <Card className="p-5 border-2" style={{ borderColor: "hsl(var(--chart-4) / 0.5)" }}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-chart-4" />
              <h2 className="text-sm font-bold">Assinatura digital ICP-Brasil (certificado A1)</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Selecione seu certificado .p12/.pfx. A assinatura ocorre localmente e o certificado permanece somente na memória desta aba.
            </p>
            <AssinaturaIcpPanel
              buildPdf={async () => {
                const { buildDocumentPdf } = await import("@/lib/documentPdf");
                const textoAssinavel =
                  texto || laudoSuperParaTexto(gerarLaudoSuper(entrada));
                return buildDocumentPdf({
                  title: "Laudo Neuropediatrico — Perfil SuperNeuroPed",
                  subtitle: `SuperNeuroPed nº ${dateStamp()} · Gerado pela assistente embarcada NeuroPed EDJ`,
                  credentials: [
                    "Dr. Jadson Fraga Araujo Junior - CRM-PE 25.227 - RQE 17.756",
                    "Neurologista Infantil / Neuropediatra",
                    "Soli Deo Gloria",
                  ],
                  sections: [
                    { heading: "Conteudo integral do laudo", body: textoAssinavel.trim() || "Sem conteudo informado." },
                  ],
                  footer:
                    "Documento emitido eletronicamente pela plataforma NeuroPed EDJ. Quando assinado, " +
                    "contem assinatura digital ICP-Brasil em padrao PAdES-BES com certificado A1 (.p12/.pfx), " +
                    "anexada ao proprio PDF e conferivel em validador oficial.",
                });
              }}
              filename={nomeArquivo}
              signerName="Dr. Jadson Fraga Araujo Junior"
              location="Petrolina-PE"
              reason="Laudo SuperNeuroPed"
              archivePdf={undefined}
            />
          </Card>
        </div>
      )}

      {/* ── Prévia editável ── */}
      {!editando && texto && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleCopiar}>
              {copiado ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiado ? "Copiado!" : "Copiar texto"}
            </Button>
            <span className="text-xs text-muted-foreground">Edite livremente abaixo; a impressão/PDF usa o conteúdo final.</span>
          </div>
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[60vh] font-mono text-xs leading-relaxed"
            data-testid="textarea-laudo-super"
          />
        </section>
      )}
    </div>
  );
}

// ── Subcomponentes do editor ────────────────────────────────────────────────

function limpo(v: string): string {
  return typeof v === "string" ? v.trim() : "";
}

function SecaoEditor({
  titulo,
  chave,
  aberto,
  onToggle,
  children,
}: {
  titulo: string;
  chave: string;
  aberto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        data-testid={`secao-${chave}`}
      >
        <h2 className="text-sm font-bold text-foreground">{titulo}</h2>
        {aberto ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {aberto && <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">{children}</div>}
    </div>
  );
}

function CampoTexto({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input id={id} value={value} onChange={onChange} placeholder={placeholder} data-testid={`input-${id}`} />
    </div>
  );
}

function TextareaArea({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="min-h-16 resize-y text-xs leading-relaxed"
        data-testid={`textarea-${id}`}
      />
    </div>
  );
}

export { medicoSuper as medicoInfo };

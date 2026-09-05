import { useEffect, useState } from "react";
import { FileText, Printer, RefreshCw, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/PageHero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssinaturaIcpPanel } from "@/components/AssinaturaIcpPanel";
import { buildAppHashUrl } from "@/lib/appUrl";
import { archiveClinicalPdf } from "@/lib/clinicalDocumentsClient";
import { apiRequest } from "@/lib/queryClient";
import { escapeHtml as esc } from "@/lib/htmlEscape";
import {
  issuerCityLine,
  issuerContactLine,
  issuerCredentials,
  useIssuer,
  type DocumentIssuer,
} from "@/lib/issuer";
import { dateStamp } from "@/lib/printDocument";
import { readRouteParam } from "@/lib/routeQuery";

/* ────────────────────────────────────────────────────────────
   Receita de Controle Especial (Lista C1) — 2 vias
   Identidade do emissor: fonte única client/src/lib/issuer.ts
   Portaria SVS/MS nº 344/1998 e modelos Anvisa/SNCR — Versão 2 vigente desde 18/05/2026
──────────────────────────────────────────────────────────── */

interface ReceitaFields {
  pac: string;
  idadePaciente: string;
  dosesPorDia: string;
  end: string;
  med: string;
  qtd: string;
  qtde: string;
  poso: string;
  data: string;
}

const RECEITA_TEMPLATE_VERSION = "Versão 2 — modelo Anvisa vigente para impressões desde 18/05/2026";
const EMPTY: ReceitaFields = { pac: "", idadePaciente: "", dosesPorDia: "", end: "", med: "", qtd: "", qtde: "", poso: "", data: "" };

function todayBR(): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date());
}

// pdf-lib (Helvetica/WinAnsi, Windows-1252) LANÇA em qualquer caractere fora do
// Latin-1 — inclusive ao só MEDIR a largura do texto. Numa RECEITA C1 assinada,
// um "≥", "→" ou emoji colado abortava a geração. Normaliza tipografia e mapeia
// os símbolos comuns para ASCII, preservando acentos do português (Latin-1).
function pdfSafe(s: string): string {
  return (s ?? "")
    .replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...")
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/←/g, "<-").replace(/×/g, "x")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "");
}

function _canonicalReceitaC1Payload(f: ReceitaFields, issuedAt: string, issuer: DocumentIssuer) {
  return [
    [pdfSafe(issuer.clinicName), "Receita C1"].filter(Boolean).join(" - "),
    pdfSafe(issuer.doctorName),
    pdfSafe(issuerCredentials(issuer)),
    RECEITA_TEMPLATE_VERSION,
    `Emitida em: ${issuedAt}`,
    `Paciente: ${f.pac || "-"}`,
    `Idade do paciente: ${f.idadePaciente || "-"}`,
    `Doses por dia: ${f.dosesPorDia || "-"}`,
    `Endereco: ${f.end || "-"}`,
    `Medicamento: ${f.med || "-"}`,
    `Quantidade: ${f.qtd || "-"} ${f.qtde || ""}`.trim(),
    `Posologia: ${f.poso || "-"}`,
    `Data declarada: ${f.data || "-"}`,
  ].join("\n");
}

async function buildReceitaC1SignedPdfBytes(f: ReceitaFields, issuer: DocumentIssuer): Promise<Uint8Array> {
  // Não gerar/assinar uma receita de controle especial incompleta: cada campo
  // essencial precisa ser revisado pelo prescritor antes de produzir o PDF.
  const missing = [
    ["paciente", f.pac], ["idade do paciente", f.idadePaciente], ["doses por dia", f.dosesPorDia],
    ["endereço", f.end], ["medicamento/substância", f.med],
    ["quantidade", f.qtd], ["quantidade por extenso", f.qtde], ["posologia", f.poso], ["data", f.data],
  ].filter(([, value]) => !value?.trim()).map(([label]) => label);
  if (missing.length) throw new Error(`Preencha os campos obrigatórios: ${missing.join(", ")}.`);
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const QRCode = (await import("qrcode")).default;
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  // Sem logo/assinatura pessoais embutidas: a identidade visual do emissor só
  // entra quando existir upload por tenant; a assinatura é a digital ICP-Brasil.

  const cidadeUf = pdfSafe(issuerCityLine(issuer));
  const issuedAt = new Date().toLocaleString("pt-BR");
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");
  // O QR leva à página de verificação, que orienta a validar a assinatura
  // ICP-Brasil no Adobe/ITI. Não embutimos hash na URL: um hash do texto não é
  // conferível por terceiros, e o hash dos bytes do PDF final não pode ser
  // embutido no QR que já faz parte desse PDF. A conferência por SHA-256 dos
  // bytes é feita pelo comprovante gerado após a assinatura (AssinaturaIcpPanel).
  const validationUrl = buildAppHashUrl("/verificar");
  const qrDataUrl = await QRCode.toDataURL(validationUrl, { width: 240, margin: 1, errorCorrectionLevel: "M" });
  const qrImage = await pdf.embedPng(qrDataUrl.split(",")[1] ?? "");

  const A5 = { w: 419.53, h: 595.28 };
  const navy = rgb(0.06, 0.1, 0.18);
  const bordo = rgb(0.46, 0.12, 0.18);
  const gold = rgb(0.79, 0.66, 0.38);
  const ink = rgb(0.08, 0.09, 0.16);
  const muted = rgb(0.34, 0.34, 0.42);
  const line = rgb(0.78, 0.75, 0.68);

  const drawFitted = (page: import("pdf-lib").PDFPage, value: string, x: number, y: number, maxWidth: number, size: number, font = helv) => {
    let text = pdfSafe(value || "");
    // 1) Encolhe a fonte até um piso legível antes de cortar (cabe mais texto).
    let fs = size;
    const min = Math.max(4.4, size - 2.5);
    while (fs > min && font.widthOfTextAtSize(text, fs) > maxWidth) fs -= 0.2;
    // 2) Se ainda não couber, trunca com reticências VISÍVEIS — nunca corte
    //    silencioso do medicamento/quantidade numa receita de controle especial.
    if (text.length > 1 && font.widthOfTextAtSize(text, fs) > maxWidth) {
      while (text.length > 1 && font.widthOfTextAtSize(text + "...", fs) > maxWidth) text = text.slice(0, -1);
      text = text.replace(/[\s.]+$/, "") + "...";
    }
    page.drawText(text || " ", { x, y, size: fs, font, color: ink });
  };

  const wrap = (value: string, maxWidth: number, size: number, font = helv) => {
    const lines: string[] = [];
    for (const raw of pdfSafe(String(value || "")).split("\n")) {
      if (!raw.trim()) { lines.push(""); continue; }
      let current = "";
      for (const word of raw.split(/\s+/)) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);
    }
    return lines;
  };

  const drawVia = (via: "1a" | "2a", destino: string, pageIndex: number) => {
    const page = pdf.addPage([A5.w, A5.h]);
    const m = 14;
    const contentW = A5.w - m * 2;
    const top = A5.h;

    page.drawRectangle({ x: m, y: top - 55, width: contentW, height: 31, color: navy });
    page.drawRectangle({ x: A5.w - 155, y: top - 55, width: 141, height: 31, color: bordo });
    page.drawText(pdfSafe(issuer.clinicName), { x: m + 38, y: top - 38, size: 10.6, font: serif, color: rgb(1, 1, 1) });
    page.drawText(pdfSafe(issuer.specialty).toUpperCase(), { x: m + 38, y: top - 48, size: 4.4, font: bold, color: rgb(0.85, 0.88, 1) });
    page.drawText(`${via} VIA - ${destino}`, { x: A5.w - 83, y: top - 35, size: 4.8, font: bold, color: rgb(0.95, 0.9, 0.85) });
    page.drawText("RECEITA DE CONTROLE ESPECIAL", { x: A5.w - 139, y: top - 46, size: 8, font: serif, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: m, y: top - 57 }, end: { x: A5.w - m, y: top - 57 }, thickness: 1.5, color: gold });

    page.drawRectangle({ x: m, y: top - 94, width: contentW, height: 32, color: rgb(0.97, 0.96, 0.92) });
    page.drawRectangle({ x: m, y: top - 94, width: 4, height: 32, color: gold });
    drawFitted(page, [issuer.clinicName, issuer.doctorName].filter(Boolean).join(" - "), m + 10, top - 73, contentW - 22, 5.8, bold);
    drawFitted(page, [issuer.specialty, issuerCredentials(issuer)].filter(Boolean).join(" - "), m + 10, top - 82, contentW - 22, 5.6, helv);
    drawFitted(page, issuerContactLine(issuer), m + 10, top - 91, contentW - 22, 5.4, helv);

    const tableY = top - 122;
    const rowH = 13;
    page.drawRectangle({ x: m, y: tableY, width: contentW, height: rowH * 4, borderWidth: 0.4, borderColor: line });
    [1, 2, 3].forEach((i) => page.drawLine({ start: { x: m, y: tableY + rowH * i }, end: { x: A5.w - m, y: tableY + rowH * i }, thickness: 0.35, color: line }));
    [70, 236, 342].forEach((x) => page.drawLine({ start: { x: m + x, y: tableY }, end: { x: m + x, y: tableY + rowH * 4 }, thickness: 0.35, color: line }));
    page.drawText("PACIENTE", { x: m + 6, y: tableY + 42, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.pac, m + 74, tableY + 41, 160, 6.2, bold);
    page.drawText("DATA", { x: m + 242, y: tableY + 42, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.data, m + 346, tableY + 41, 60, 6.2, bold);
    page.drawText("IDADE", { x: m + 6, y: tableY + 29, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.idadePaciente, m + 74, tableY + 28, 150, 6.2, bold);
    page.drawText("DOSES/DIA", { x: m + 242, y: tableY + 29, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.dosesPorDia, m + 346, tableY + 28, 60, 6.2, bold);
    page.drawText("ENDERECO", { x: m + 6, y: tableY + 16, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.end, m + 74, tableY + 15, 150, 6.2, bold);
    page.drawText("MUNICIPIO/UF", { x: m + 242, y: tableY + 16, size: 4.5, font: helv, color: muted });
    drawFitted(page, cidadeUf, m + 346, tableY + 15, 60, 6.2, bold);
    page.drawText("VALIDADE", { x: m + 6, y: tableY + 3, size: 4.5, font: helv, color: muted });
    page.drawText(valBr, { x: m + 74, y: tableY + 2, size: 6.2, font: bold, color: ink });

    const rxY = 132;
    const rxH = tableY - rxY - 8;
    page.drawRectangle({ x: m, y: rxY, width: contentW, height: rxH, borderWidth: 0.45, borderColor: line, color: rgb(0.99, 1, 1) });
    page.drawText("Rx", { x: m + 8, y: tableY - 29, size: 23, font: serif, color: navy });
    drawFitted(page, f.med || "-", m + 40, tableY - 17, contentW - 52, 8.8, serif);
    page.drawLine({ start: { x: m + 40, y: tableY - 39 }, end: { x: A5.w - m - 6, y: tableY - 39 }, thickness: 0.3, color: line, dashArray: [2, 2] });
    drawFitted(page, `Quantidade: ${f.qtd || "-"}${f.qtde ? ` (${f.qtde})` : ""}`, m + 40, tableY - 52, contentW - 52, 6.8, helv);
    let iy = tableY - 67;
    // O corte era `.slice(0, 10)` fixo — bem abaixo da capacidade real do
    // quadro Rx (~30 linhas) e SEM qualquer aviso, ao contrário de drawFitted()
    // (ver comentário acima: "nunca corte silencioso do medicamento/quantidade").
    // Numa receita de controle especial, omitir parte da posologia sem marca
    // visível pode levar a erro de dose. Agora o limite reflete o espaço real
    // do quadro e, se ainda assim faltar espaço, a última linha é substituída
    // por um aviso visível — nunca um corte mudo.
    const iyMinPosologia = rxY + 6;
    const linhasPosologia = wrap(`Instrucoes: ${f.poso || "-"}`, contentW - 52, 6.4, helv);
    const maxLinhasPosologia = Math.max(1, Math.floor((iy - iyMinPosologia) / 9) + 1);
    const posologiaTruncada = linhasPosologia.length > maxLinhasPosologia;
    const linhasPosologiaVisiveis = posologiaTruncada
      ? linhasPosologia.slice(0, Math.max(0, maxLinhasPosologia - 1))
      : linhasPosologia;
    for (const ln of linhasPosologiaVisiveis) {
      page.drawText(ln || " ", { x: m + 40, y: iy, size: 6.4, font: helv, color: ink });
      iy -= 9;
    }
    if (posologiaTruncada) {
      page.drawText("[posologia truncada - revise o registro completo antes de dispensar]", { x: m + 40, y: iy, size: 5.6, font: bold, color: bordo });
    }

    page.drawLine({ start: { x: m, y: 120 }, end: { x: A5.w - m, y: 120 }, thickness: 0.4, color: line });
    page.drawText(`${cidadeUf ? `${cidadeUf}, ` : ""}${pdfSafe(f.data) || issuedAt}  -  Validade: ${valBr}`, { x: m, y: 108, size: 5.8, font: helv, color: muted });

    page.drawRectangle({ x: 218, y: 44, width: 176, height: 66, borderWidth: 0.6, borderColor: rgb(0.2, 0.45, 0.34), color: rgb(0.93, 0.99, 0.96) });
    page.drawLine({ start: { x: 228, y: 76 }, end: { x: 384, y: 76 }, thickness: 0.25, color: rgb(0.18, 0.22, 0.2) });
    drawFitted(page, issuer.doctorName, 238, 66, 148, 6.2, bold);
    drawFitted(page, issuerCredentials(issuer), 238, 58, 148, 5.2, helv);
    page.drawText("Assinatura digital ICP-Brasil PAdES-BES", { x: 236, y: 50, size: 5.2, font: helv, color: rgb(0.05, 0.34, 0.22) });
    if (pageIndex === 0) page.drawText("Campo tecnico da assinatura digital embutida no PDF.", { x: 222, y: 35, size: 4.4, font: helv, color: muted });

    page.drawRectangle({ x: m, y: 20, width: 190, height: 58, borderWidth: 0.4, borderColor: gold, color: rgb(1, 0.98, 0.92) });
    page.drawText("VALIDACAO DIGITAL", { x: m + 8, y: 64, size: 6.2, font: bold, color: ink });
    page.drawText("Abra no Adobe Acrobat ou validador ICP-Brasil/ITI.", { x: m + 8, y: 52, size: 4.8, font: helv, color: ink });
    page.drawText("Escaneie o QR para abrir a pagina de verificacao.", { x: m + 8, y: 43, size: 4.8, font: helv, color: ink });
    page.drawText("Confira a assinatura ICP-Brasil embutida no PDF.", { x: m + 8, y: 34, size: 4.3, font: helv, color: rgb(0.04, 0.19, 0.48) });
    page.drawImage(qrImage, { x: m + 152, y: 30, width: 34, height: 34 });
  };

  drawVia("1a", "FARMACIA", 0);
  drawVia("2a", "PACIENTE", 1);
  return await pdf.save({ useObjectStreams: false });
}

function viaHtml(tag: string, f: ReceitaFields, issuer: DocumentIssuer) {
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");
  const cidadeUf = issuerCityLine(issuer);
  return `
<div class="via">
  <div class="head">
    <div class="bk">
      <div class="wm">${esc(issuer.clinicName)}</div>
      <div class="tg">${esc([issuer.doctorName, issuer.specialty].filter(Boolean).join(" · "))}</div>
    </div>
    <div class="rt">
      <div class="rx">Receita de Controle Especial</div>
      <div class="via-tag">${tag}</div>
    </div>
  </div>
  <div class="ribbon"><i class="g"></i><i class="t"></i><i class="b"></i><i class="n"></i></div>
  <div class="body">
    <div class="box">
      <div class="lbl">Identificação do emitente</div>
      <div class="emit">
        <b>${esc([issuer.clinicName, issuer.doctorName].filter(Boolean).join(" — "))}</b><br>
        ${esc([issuer.specialty, issuerCredentials(issuer)].filter(Boolean).join(" · "))}<br>
        ${esc(issuerContactLine(issuer))}
      </div>
    </div>
    <div class="row">
      <div class="field"><span class="k">Paciente</span><span class="f">${esc(f.pac) || "&nbsp;"}</span></div>
    </div>
    <div class="row" style="gap:4mm">
      <div class="field" style="flex:1"><span class="k">Idade do paciente</span><span class="f">${esc(f.idadePaciente) || "&nbsp;"}</span></div>
      <div class="field" style="flex:1"><span class="k">Doses por dia</span><span class="f">${esc(f.dosesPorDia) || "&nbsp;"}</span></div>
    </div>
    <div class="row">
      <div class="field"><span class="k">Endereço</span><span class="f">${esc(f.end) || "&nbsp;"}</span></div>
    </div>
    <div class="row" style="gap:4mm">
      <div class="field" style="flex:1"><span class="k">Município/UF</span><span class="f">${esc(cidadeUf) || "&nbsp;"}</span></div>
      <div class="field" style="flex:1"><span class="k">Validade</span><span class="f">${valBr}</span></div>
    </div>
    <div class="rx-area"><span class="sym">&#8478;</span>
      <div class="rx-line"><span class="k">Medicamento / substância · concentração · forma</span><br>
        <span class="f fmed">${esc(f.med) || "&nbsp;"}</span></div>
      <div class="rx-line"><span class="k">Quantidade total</span>
        <span class="f" style="min-width:38mm">${esc(f.qtd) || "&nbsp;"}</span>
        &nbsp;<span class="f" style="min-width:50mm">${esc(f.qtde) || "&nbsp;"}</span></div>
      <div class="poso"><span class="k">Posologia / modo de usar</span>
        <span class="f fblock">${esc(f.poso) || "&nbsp;"}</span></div>
    </div>
    <div class="datasig">
      <div class="data">${cidadeUf ? `${esc(cidadeUf)},&nbsp;` : ""}<span class="f" style="min-width:52mm">${esc(f.data) || "____/____/______"}</span></div>
      <div class="sig">
        <div class="ln"></div>
        <div class="nm">${esc(issuer.doctorName)}</div>
        <div class="rg">${esc(issuerCredentials(issuer))} — assinatura e carimbo</div>
        <div class="sd">Assinatura digital ICP-Brasil PAdES-BES</div>
      </div>
    </div>
    <div class="disp">
      <div class="box">
        <div class="lbl">Identificação do comprador <span class="mini">(preenchimento na dispensação)</span></div>
        <div class="uline"></div><div class="mini">Nome</div>
        <div class="row" style="margin-top:1mm;gap:4mm">
          <div style="flex:2"><div class="uline"></div><div class="mini">Identidade (RG)</div></div>
          <div style="flex:2"><div class="uline"></div><div class="mini">Órgão emissor</div></div>
        </div>
        <div class="uline" style="margin-top:1mm"></div><div class="mini">Endereço</div>
        <div class="row" style="margin-top:1mm;gap:4mm">
          <div style="flex:3"><div class="uline"></div><div class="mini">Cidade / UF</div></div>
          <div style="flex:2"><div class="uline"></div><div class="mini">Telefone</div></div>
        </div>
      </div>
      <div class="box">
        <div class="lbl">Identificação do fornecedor <span class="mini">(farmácia)</span></div>
        <div class="uline"></div><div class="mini">Cidade / UF</div>
        <div class="uline" style="margin-top:1mm"></div><div class="mini">Data da dispensação</div>
        <div class="uline" style="margin-top:5mm"></div><div class="mini">Assinatura do farmacêutico</div>
      </div>
    </div>
    <div class="legal"><b>Rascunho para revisão do prescritor:</b> validade de <b>30 dias</b> a partir da data de emissão. Emitida em <b>2 vias</b> — 1ª via retida pela farmácia ou drogaria, 2ª via do paciente. Substância da <b>Lista C1</b>, sujeita à conferência da lista vigente e das regras sanitárias aplicáveis. Modelo Anvisa <b>Versão 2</b>, vigente para impressões desde <b>18/05/2026</b>. Sem rasuras; usar somente após assinatura qualificada válida e conferência profissional.</div>
  </div>
</div>`;
}

function buildReceitaC1Html(f: ReceitaFields, issuer: DocumentIssuer): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Receita de Controle Especial</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page{size:A4 portrait;margin:11mm 12mm}
:root{--navy:#1E2A4A;--navyd:#0B1024;--bordo:#7A1F2B;--gold:#C9A961;--goldd:#A88844;--teal:#2E7163;
  --ivory:#FBF8F0;--ink:#5B5B6B;--graf:#2C2C3E;--line:#D9D2C2;--white:#fff;--parchment:#fbf8ee;
  --ribbon-gold:#B98A24;--ribbon-gold-light:#F4D36C;--slate:#475467;
  --logo-red:#8E1625;--logo-gold:#D9B75B;--logo-gold-soft:#F6E7B5;--logo-navy:#101A2D;
  --gold-a76:rgba(201,169,97,.76);--gold-a58:rgba(201,169,97,.58);--gold-a55:rgba(201,169,97,.55);
  --gold-a18:rgba(201,169,97,.18);--gold-a14:rgba(201,169,97,.14);--goldd-a78:rgba(168,136,68,.78);
  --teal-a36:rgba(46,113,99,.36);--bordo-a40:rgba(122,31,43,.40);--bordo-a26:rgba(122,31,43,.26);
  --bordo-a14:rgba(122,31,43,.14);--logo-navy-a10:rgba(16,26,45,.10);--logo-navy-a07:rgba(16,26,45,.07);
  --logo-gold-soft-a92:rgba(246,231,181,.92);--white-a97:rgba(255,255,255,.97);--white-a78:rgba(255,255,255,.78);
  --white-a20:rgba(255,255,255,.20);--white-a035:rgba(255,255,255,.035);--cream-a76:rgba(250,247,239,.76);
  --cream-a45:rgba(250,247,239,.45);--charcoal-a04:rgba(31,42,55,.04);--black-a35:rgba(0,0,0,.35);
  --black-a32:rgba(0,0,0,.32);--black-a28:rgba(0,0,0,.28);--black-a25:rgba(0,0,0,.25)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:var(--white);font-family:'Carlito',Arial,sans-serif;font-size:9pt;color:var(--graf)}
.sheet{width:100%;background:linear-gradient(180deg,var(--white) 0%,var(--white) 74%,var(--parchment) 100%)}
.via{margin-bottom:7mm;border:1.15pt solid var(--gold-a76);border-radius:2.4mm;overflow:hidden;
  break-inside:avoid;display:flex;flex-direction:column;position:relative;
  box-shadow:0 7px 18px var(--logo-navy-a07)}
.via:before{content:"";position:absolute;inset:2mm;border:.45pt solid var(--teal-a36);
  border-radius:2.2mm;pointer-events:none;z-index:0}
.via>*{position:relative;z-index:1}
.head{padding:4.5mm 6.2mm 4.3mm;background:linear-gradient(135deg,var(--logo-navy) 0%,var(--navy) 44%,var(--bordo) 100%);
  color:var(--ivory);display:flex;align-items:center;gap:4.4mm;
  box-shadow:inset 0 -1.1mm 0 var(--gold-a58)}
.head .selo{width:19mm;height:19mm;border-radius:4.4mm;
  background:radial-gradient(circle at 50% 30%,var(--white-a20),var(--white-a035) 60%,var(--black-a25));
  border:1pt solid var(--logo-gold-soft-a92);
  box-shadow:0 0 0 1.2mm var(--gold-a18),0 2mm 6mm var(--black-a28);
  overflow:hidden;flex:0 0 19mm;display:flex;align-items:center;justify-content:center}
.head .selo img{width:17.8mm;height:17.8mm;object-fit:cover;border-radius:3.2mm;display:block;
  filter:contrast(1.04) saturate(1.06)}
.head .bk{flex:1 1 auto;padding-left:.8mm}
.head .wm{font-family:'Cormorant Garamond',Georgia,serif;font-size:15.2pt;font-weight:700;
  letter-spacing:.05em;color:var(--white);line-height:1;text-shadow:0 1px 0 var(--black-a35)}
.head .tg{font-size:6.2pt;letter-spacing:.25em;text-transform:uppercase;color:var(--logo-gold-soft);margin-top:1mm}
.head .rt{text-align:right}
.head .rx{font-family:'Cormorant Garamond',Georgia,serif;font-size:11.4pt;font-weight:700;
  letter-spacing:.08em;color:var(--white);white-space:nowrap;text-shadow:0 1px 0 var(--black-a32)}
.head .via-tag{font-size:6.4pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--logo-gold-soft);margin-top:1.2mm}
.ribbon{height:1.9mm;display:flex;box-shadow:0 .5mm 1.5mm var(--logo-navy-a10)}
.ribbon i{display:block;height:100%}
.ribbon .g{width:34%;background:linear-gradient(90deg,var(--ribbon-gold),var(--ribbon-gold-light),var(--ribbon-gold))}
.ribbon .t{width:22%;background:var(--teal)}
.ribbon .b{width:22%;background:var(--bordo)}
.ribbon .n{width:22%;background:var(--navyd)}
.body{padding:4.2mm 6.4mm 5.4mm;background:linear-gradient(180deg,var(--white-a97),var(--cream-a45))}
.box{border:.55pt solid var(--gold-a58);border-radius:1.6mm;padding:2.6mm 3mm;margin-top:3mm;
  background:var(--white-a78);box-shadow:0 .8mm 2mm var(--charcoal-a04)}
.lbl{font-size:6.6pt;font-weight:700;letter-spacing:.145em;text-transform:uppercase;
  color:var(--bordo);margin-bottom:1.4mm}
.emit{font-size:8.25pt;line-height:1.45;color:var(--graf)}
.emit b{font-size:9pt;color:var(--logo-navy)}
.row{display:flex;gap:5mm;margin-top:3mm}
.field{flex:1 1 auto;font-size:8.4pt}
.field .k{font-size:7pt;font-weight:700;color:var(--navy);text-transform:uppercase;
  letter-spacing:.06em;margin-right:2mm}
.f{display:inline-block;min-width:30mm;border-bottom:.55pt solid var(--goldd-a78);
  padding:0 1mm 1px;color:var(--graf)}
.rx-area{border:.65pt solid var(--bordo-a26);border-radius:1.6mm;margin-top:3mm;
  min-height:42mm;padding:3mm;position:relative;
  background:var(--white);box-shadow:inset 0 .6mm 0 var(--gold-a14)}
.rx-area .sym{position:absolute;top:2mm;right:3mm;
  font-family:'Cormorant Garamond',Georgia,serif;font-size:22pt;font-weight:700;
  color:var(--bordo-a14)}
.rx-line{font-size:9pt;line-height:1.7;margin-bottom:1mm}
.rx-line .k{font-size:7pt;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.05em}
.fmed{min-width:120mm;display:inline-block}
.poso{margin-top:2mm}
.poso .k{display:block;font-size:7pt;font-weight:700;color:var(--navy);
  text-transform:uppercase;letter-spacing:.05em;margin-bottom:1mm}
.fblock{display:block;min-height:13mm;white-space:pre-wrap}
.datasig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:5mm;gap:8mm}
.datasig .data{font-size:8.6pt;color:var(--graf)}
.sig{text-align:center;min-width:74mm}
.sig .sig-img{width:54mm;height:10mm;object-fit:contain;display:block;margin:0 auto -1.4mm;opacity:.96}
.sig .ln{border-top:.75pt solid var(--logo-navy);margin-bottom:1.2mm}
.sig .nm{font-family:'Cormorant Garamond',Georgia,serif;font-size:10.1pt;font-weight:600;color:var(--logo-navy)}
.sig .rg{font-size:6.6pt;color:var(--slate)}
.sig .sd{font-size:6.2pt;color:var(--teal);font-weight:700;margin-top:.45mm}
.disp{display:flex;gap:4mm;margin-top:3mm}
.disp .box{flex:1 1 0;margin-top:0;padding:1.5mm 2mm}
.uline{border-bottom:.5pt solid var(--line);height:4.6mm;margin-bottom:1mm}
.mini{font-size:6.6pt;color:var(--ink)}
.legal{font-size:6.4pt;line-height:1.4;color:var(--ink);margin-top:3mm;
  border-top:.55pt solid var(--gold-a55);padding:2mm 2.3mm;
  background:var(--cream-a76);border-radius:1.3mm}
.cut{margin:1.4mm 0;color:var(--bordo);border-top:1.2px dashed var(--bordo-a40);
  text-align:center;font-size:6.6pt;letter-spacing:.1em;padding-top:1mm}
@media print{
  html,body{background:var(--white);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .via{box-shadow:none}
  .head .selo{box-shadow:none}
  .sheet{background:var(--white)}
  .legal{background:var(--white)}
  .f{border-bottom:.5pt solid var(--goldd-a78)}
  .via{break-inside:avoid}
  .cut{break-after:page}
}
</style>
</head>
<body>
<div class="sheet">
  ${viaHtml("1ª via · Retenção da farmácia", f, issuer)}
  <div class="cut">— — — — —  destaque a 1ª via para retenção da farmácia · 2ª via do paciente  — — — — —</div>
  ${viaHtml("2ª via · Paciente", f, issuer)}
</div>
</body>
</html>`;
}

export default function ReceitaC1Page() {
  const { issuer } = useIssuer();
  const [f, setF] = useState<ReceitaFields>({ ...EMPTY, data: todayBR() });
  const [showPreview, setShowPreview] = useState(false);
  const [patientLoading, setPatientLoading] = useState(false);
  const patientId = readRouteParam("patientId") || null;
  const filename = `receita-c1-${dateStamp()}`;

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setPatientLoading(true);
    apiRequest("GET", `/api/patients/${encodeURIComponent(patientId)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        const patient = payload?.patient ?? payload?.data ?? payload;
        setF((current) => ({
          ...current,
          pac: current.pac || patient?.name || "",
          end: current.end || patient?.address || patient?.guardianAddress || "",
          data: current.data || todayBR(),
        }));
        setPatientLoading(false);
      })
      .catch(() => {
        if (!cancelled) setPatientLoading(false);
      });
    return () => { cancelled = true; };
  }, [patientId]);

  function set(k: keyof ReceitaFields) {
    return ({ target }: { target: { value: string } }) =>
      setF((prev) => ({ ...prev, [k]: target.value }));
  }

  const handlePrint = () => {
    if (!patientId) {
      window.alert("Abra a Receita C1 a partir de um paciente cadastrado para manter o documento vinculado ao prontuário persistente.");
      return;
    }
    const missing = [
      ["paciente", f.pac], ["idade do paciente", f.idadePaciente], ["doses por dia", f.dosesPorDia],
      ["endereço", f.end], ["medicamento/substância", f.med],
      ["quantidade", f.qtd], ["quantidade por extenso", f.qtde], ["posologia", f.poso], ["data", f.data],
    ].filter(([, value]) => !value?.trim()).map(([label]) => label);
    if (missing.length) {
      window.alert(`Preencha os campos obrigatórios antes de imprimir: ${missing.join(", ")}.`);
      return;
    }
    const win = window.open("", "_blank");
    if (!win) return;
    win.opener = null;
    win.document.write(buildReceitaC1Html(f, issuer));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHero
        icon={FileText}
        eyebrow="receita de controle especial"
        title="Receita de Controle Especial"
        subtitle={`Preencha, revise e assine os campos abaixo. ${RECEITA_TEMPLATE_VERSION}. A receita de controle especial C1 é gerada em 2 vias; o PDF só deve ser usado após conferência do prescritor e assinatura válida.`}
        gradient="from-primary to-chart-2"
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowPreview((v) => !v)} variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            {showPreview ? "Fechar prévia" : "Visualizar"}
          </Button>
          <Button onClick={handlePrint} disabled={patientLoading || !patientId} size="sm" className="gap-2">
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setF({ ...EMPTY, data: todayBR() })}>
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>
      </PageHero>

      <div className="rounded-2xl border border-amber-400/60 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-100">
        <strong>Revisão obrigatória:</strong> este módulo usa o modelo Anvisa {RECEITA_TEMPLATE_VERSION.replace("Versão 2 — ", "")}. A tela não decide se uma substância é C1 nem substitui conferência da lista vigente, do prescritor, do estabelecimento ou da assinatura qualificada. Sem paciente vinculado, a impressão fica bloqueada.
      </div>

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
          signerName={pdfSafe(issuer.doctorName) || undefined}
          location={issuerCityLine(issuer) || undefined}
          reason="Receita de Controle Especial - Lista C1"
          widgetRect={[218, 44, 394, 110]}
          widgetPageIndex={0}
          archivePdf={async (bytes, meta) => {
            await archiveClinicalPdf({
              bytes,
              filename,
              documentType: "receita",
              title: "Receita de Controle Especial - Lista C1",
              patientId,
              signatureStatus: meta.signatureStatus,
              signatureType: meta.signatureType,
              signatureAlgorithm: meta.signatureAlgorithm,
              signerName: meta.signerName,
              certificateIssuer: meta.certificateIssuer,
              certificateValidUntil: meta.certificateValidUntil,
              metadata: {
                patientName: f.pac,
                patientAge: f.idadePaciente,
                dosesPerDay: f.dosesPorDia,
                medication: f.med,
                source: "receita-c1",
                patientId,
              },
            });
          }}
          buildPdf={async () => buildReceitaC1SignedPdfBytes(f, issuer)}
        />
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-foreground">Dados da receita</h2>
          <span className="text-xs text-muted-foreground">{patientLoading ? "Carregando paciente…" : patientId ? "Paciente vinculado ao prontuário" : "Abra esta tela por Pacientes"}</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Paciente</label>
          <Input
            value={f.pac}
            onChange={set("pac")}
            placeholder="Nome completo do paciente"
            className="mt-1"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Idade do paciente *</label>
            <Input
              value={f.idadePaciente}
              onChange={set("idadePaciente")}
              placeholder="ex.: 7 anos e 3 meses"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Doses por dia *</label>
            <Input
              value={f.dosesPorDia}
              onChange={set("dosesPorDia")}
              inputMode="numeric"
              placeholder="ex.: 2"
              className="mt-1"
            />
          </div>
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
            srcDoc={buildReceitaC1Html(f, issuer)}
            className="w-full"
            style={{ height: "760px", border: "none" }}
            title="Receita C1 Preview"
          />
        </div>
      )}
    </div>
  );
}

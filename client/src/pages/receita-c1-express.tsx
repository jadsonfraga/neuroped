import { useState, useEffect, useRef } from "react";
import {
  Pill,
  FileSignature,
  Printer,
  Download,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/PageHero";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import signatureImageUrl from "@/assets/images/jadson-signature.jpg";
import { drJadsonMasterShieldLogo } from "@/assets/drJadsonMasterShieldLogo";
import { purgeLegacyCertificateCache } from "@/lib/certificateSession";
import { buildAppHashUrl } from "@/lib/appUrl";

/* ──────────────────────────────────────────────────────────────
   Receita C1 Express — Receita de Controle Especial
   Certificado acoplado: preencha a receita + insira apenas a senha
──────────────────────────────────────────────────────────────── */

const CLINIC_NAME = "NeuroPed SDG";
const DOCTOR_NAME = "Dr. Jadson Fraga Araújo Júnior";
const DOCTOR_NAME_PDF = "Dr. Jadson Fraga Araujo Junior";
const DOCTOR_CREDENTIALS = "CRM-PE 25.227 | RQE 17.756";
const DOCTOR_SPECIALTY = "Neurologista Infantil / Neuropediatra";
const DOCTOR_SPECIALTY_HTML = "Neurologista Infantil · Neuropediatra";
const CLINIC_ADDRESS_1 = "Rua Raimundo Lacerda, 001 — Bairro São José";
const CLINIC_ADDRESS_2 = "Petrolina/PE — CEP 56302-470";
const CLINIC_PHONE = "Telefone: (87) 9 9109-7371";
const CLINIC_ADDRESS_HTML = `${CLINIC_ADDRESS_1} · ${CLINIC_ADDRESS_2} · ${CLINIC_PHONE}`;
const CLINIC_ADDRESS_PDF = "Rua Raimundo Lacerda, 001 - Bairro Sao Jose, Petrolina/PE - CEP 56302-470 - Telefone: (87) 9 9109-7371";

// ── Helpers ──────────────────────────────────────────────────────
function todayBr(): string {
  return new Date().toLocaleDateString("pt-BR");
}

function dateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function escHtml(v: string) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── PDF assinável (template pdf-lib, 2 vias) ─────────────────────
async function _sha256HexText(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function _canonicalExpressPayload(f: FormFields, issuedAt: string) {
  return [
    `${CLINIC_NAME} - Receita C1 Express`,
    DOCTOR_NAME_PDF,
    "CRM-PE 25.227",
    "RQE 17.756",
    `Emitida em: ${issuedAt}`,
    `Paciente: ${f.paciente || "-"}`,
    `Idade do paciente: ${f.idadePaciente || "-"}`,
    `Doses por dia: ${f.dosesPorDia || "-"}`,
    `Data de nascimento: ${fmtNasc(f.dataNasc) || "-"}`,
    `Endereco: ${f.endereco || "-"}`,
    `Municipio/UF: ${f.municipio || "-"}`,
    `CEP: ${f.cep || "-"}`,
    `Medicamento: ${f.medicamento || "-"}`,
    `Concentracao: ${f.concentracao || "-"}`,
    `Forma: ${f.forma || "-"}`,
    `Quantidade: ${f.quantidade || "-"} ${f.quantidadeExtenso || ""}`.trim(),
    `Instrucoes: ${f.instrucoes || "-"}`,
    `CID-10: ${f.cid || "-"}`,
  ].join("\n");
}

// ── PDF assinável (texto estruturado) ────────────────────────────
async function _buildC1PdfBytes(f: FormFields): Promise<Uint8Array> {
  const { buildDocumentPdf } = await import("@/lib/documentPdf");
  const data = todayBr();
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");

  return buildDocumentPdf({
    title: "RECEITA DE CONTROLE ESPECIAL — C1",
    subtitle: "Via para farmácia · Validade: 30 dias",
    credentials: [
      `${DOCTOR_NAME}  ${DOCTOR_CREDENTIALS}`,
      DOCTOR_SPECIALTY,
      CLINIC_ADDRESS_HTML,
    ],
    sections: [
      {
        heading: "Dados do Paciente",
        body: [
          `Nome: ${f.paciente || "—"}`,
          `Idade do paciente: ${f.idadePaciente || "—"}`,
          `Doses por dia: ${f.dosesPorDia || "—"}`,
          `Data de nascimento: ${fmtNasc(f.dataNasc) || "—"}`,
          `Endereço: ${f.endereco || "—"}`,
          `Município/UF: ${f.municipio || "—"}  CEP: ${f.cep || "—"}`,
        ].join("\n"),
      },
      {
        heading: "Prescrição",
        body: [
          `Rp./ ${f.medicamento || "—"}`,
          f.concentracao ? `Concentração: ${f.concentracao}` : "",
          f.forma ? `Forma farmacêutica: ${f.forma}` : "",
          `Quantidade: ${f.quantidade || "—"}${f.quantidadeExtenso ? ` (${f.quantidadeExtenso})` : ""}`,
          `Doses por dia: ${f.dosesPorDia || "—"}`,
          `\nPosologia / Instrução de uso:\n${f.instrucoes || "—"}`,
        ].filter(Boolean).join("\n"),
      },
      {
        heading: "Validade e Assinatura",
        body: [
          `Petrolina/PE, ${data}`,
          `Validade da receita: ${valBr}`,
          f.cid ? `CID-10: ${f.cid}` : "",
          "\n_________________________________",
          DOCTOR_NAME,
          DOCTOR_CREDENTIALS,
          "Assinatura digital ICP-Brasil PAdES-BES",
        ].filter(Boolean).join("\n"),
      },
    ],
    footer:
      "Receita de Controle Especial (C1) — 1ª Via. " +
      "Assinatura digital ICP-Brasil em padrão PAdES-BES, verificável em iti.br/repositorio. " +
      `Emitida em ${data}. Validade: 30 dias.`,
  });
}

// pdf-lib (Helvetica/WinAnsi, Windows-1252) LANÇA em qualquer caractere fora do
// Latin-1 — inclusive ao só MEDIR a largura. Num C1 assinado, "≥/→/emoji" colado
// abortava a geração. Normaliza tipografia e mapeia símbolos comuns para ASCII,
// preservando os acentos do português (Latin-1).
function pdfSafe(s: string): string {
  return (s ?? "")
    .replace(/[–—]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...")
    .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[→⇒]/g, "->").replace(/←/g, "<-").replace(/×/g, "x")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "");
}

// Data de nascimento vem do <input type="date"> como "YYYY-MM-DD". Exibe em
// pt-BR (DD/MM/AAAA) ancorando ao meio-dia local para não recuar um dia no fuso.
function fmtNasc(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

// ── HTML de impressão (2 vias em A5) ─────────────────────────────
async function buildC1TemplatePdfBytes(f: FormFields): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const QRCode = (await import("qrcode")).default;
  const data = todayBr();
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");

  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const A5 = { w: 419.53, h: 595.28 };
  const navy = rgb(0.06, 0.1, 0.18);
  const bordo = rgb(0.46, 0.12, 0.18);
  const gold = rgb(0.79, 0.66, 0.38);
  const ink = rgb(0.08, 0.09, 0.16);
  const muted = rgb(0.34, 0.34, 0.42);
  const line = rgb(0.78, 0.75, 0.68);
  // QR aponta para a verificação (orienta validar a assinatura ICP-Brasil no
  // Adobe/ITI). Sem hash na URL: um hash de texto não é conferível por terceiros
  // e o hash dos bytes do PDF final não cabe no QR embutido nele. A conferência
  // por SHA-256 dos bytes é feita pelo comprovante pós-assinatura.
  const validationUrl = buildAppHashUrl("/verificar");
  const qrDataUrl = await QRCode.toDataURL(validationUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" });
  const qrPng = await pdf.embedPng(qrDataUrl.split(",")[1] ?? "");
  const signatureImageBytes = await fetch(signatureImageUrl).then((response) => response.arrayBuffer());
  const signatureImage = await pdf.embedJpg(signatureImageBytes);
  const logoImage = await pdf.embedJpg(drJadsonMasterShieldLogo.split(",")[1] ?? "");

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
    const logoDims = logoImage.scaleToFit(24, 24);
    page.drawImage(logoImage, {
      x: m + 6,
      y: top - 51 + (24 - logoDims.height) / 2,
      width: logoDims.width,
      height: logoDims.height,
    });
    page.drawText(CLINIC_NAME, { x: m + 36, y: top - 39, size: 11, font: serif, color: rgb(1, 1, 1) });
    page.drawText("NEUROPEDIATRIA - NEURODESENVOLVIMENTO", { x: m + 36, y: top - 48, size: 4.4, font: bold, color: rgb(0.85, 0.88, 1) });
    page.drawText(`${via} VIA - ${destino}`, { x: A5.w - 83, y: top - 35, size: 4.8, font: bold, color: rgb(0.95, 0.9, 0.85) });
    page.drawText("RECEITA DE CONTROLE ESPECIAL", { x: A5.w - 139, y: top - 46, size: 8, font: serif, color: rgb(1, 1, 1) });
    page.drawLine({ start: { x: m, y: top - 57 }, end: { x: A5.w - m, y: top - 57 }, thickness: 1.5, color: gold });

    page.drawRectangle({ x: m, y: top - 94, width: contentW, height: 32, color: rgb(0.97, 0.96, 0.92) });
    page.drawRectangle({ x: m, y: top - 94, width: 4, height: 32, color: gold });
    drawFitted(page, `${CLINIC_NAME} - ${DOCTOR_NAME_PDF}`, m + 10, top - 73, contentW - 22, 5.8, bold);
    page.drawText(`${DOCTOR_SPECIALTY} - ${DOCTOR_CREDENTIALS}`, { x: m + 10, y: top - 82, size: 5.6, font: helv, color: ink });
    drawFitted(page, CLINIC_ADDRESS_PDF, m + 10, top - 91, contentW - 22, 5.4, helv);

    const tableY = top - 122;
    const rowH = 13;
    page.drawRectangle({ x: m, y: tableY, width: contentW, height: rowH * 3, borderWidth: 0.4, borderColor: line });
    [1, 2].forEach((i) => page.drawLine({ start: { x: m, y: tableY + rowH * i }, end: { x: A5.w - m, y: tableY + rowH * i }, thickness: 0.35, color: line }));
    [70, 236, 342].forEach((x) => page.drawLine({ start: { x: m + x, y: tableY }, end: { x: m + x, y: tableY + rowH * 3 }, thickness: 0.35, color: line }));
    page.drawText("PACIENTE", { x: m + 6, y: tableY + 29, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.paciente, m + 74, tableY + 28, 160, 6.2, bold);
    page.drawText("DATA NASC.", { x: m + 242, y: tableY + 29, size: 4.5, font: helv, color: muted });
    drawFitted(page, fmtNasc(f.dataNasc), m + 346, tableY + 28, 60, 6.2, bold);
    page.drawText("IDADE", { x: m + 6, y: tableY + 16, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.idadePaciente, m + 74, tableY + 15, 150, 6.2, bold);
    page.drawText("DOSES/DIA", { x: m + 242, y: tableY + 16, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.dosesPorDia, m + 346, tableY + 15, 60, 6.2, bold);
    page.drawText("ENDERECO", { x: m + 6, y: tableY + 3, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.endereco, m + 74, tableY + 2, 150, 6.2, bold);
    page.drawText("MUNICIPIO/UF", { x: m + 242, y: tableY + 3, size: 4.5, font: helv, color: muted });
    drawFitted(page, f.municipio, m + 346, tableY + 2, 60, 6.2, bold);

    const rxY = 132;
    const rxH = tableY - rxY - 8;
    page.drawRectangle({ x: m, y: rxY, width: contentW, height: rxH, borderWidth: 0.45, borderColor: line, color: rgb(0.99, 1, 1) });
    page.drawText("Rx", { x: m + 8, y: tableY - 29, size: 23, font: serif, color: navy });
    drawFitted(page, `${f.medicamento || "-"}${f.concentracao ? ` - ${f.concentracao}` : ""}`, m + 40, tableY - 17, contentW - 52, 8.8, serif);
    if (f.forma) drawFitted(page, f.forma, m + 40, tableY - 29, contentW - 52, 6.2, helv);
    page.drawLine({ start: { x: m + 40, y: tableY - 39 }, end: { x: A5.w - m - 6, y: tableY - 39 }, thickness: 0.3, color: line, dashArray: [2, 2] });
    drawFitted(page, `Quantidade: ${f.quantidade || "-"}${f.quantidadeExtenso ? ` (${f.quantidadeExtenso})` : ""}`, m + 40, tableY - 52, contentW - 52, 6.8, helv);
    let iy = tableY - 67;
    // O corte era `.slice(0, 10)` fixo — bem abaixo da capacidade real do
    // quadro Rx (~30 linhas) e SEM qualquer aviso, ao contrário de drawFitted()
    // (ver comentário acima: "nunca corte silencioso do medicamento/quantidade").
    // Numa receita de controle especial, omitir parte da posologia sem marca
    // visível pode levar a erro de dose. Agora o limite reflete o espaço real
    // do quadro e, se ainda assim faltar espaço, a última linha é substituída
    // por um aviso visível — nunca um corte mudo.
    const iyMinPosologia = rxY + 6;
    const linhasPosologia = wrap(`Instrucoes: ${f.instrucoes || "-"}`, contentW - 52, 6.4, helv);
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
    page.drawText(`Petrolina/PE, ${data}  -  Validade: ${valBr}${f.cid ? `  -  CID-10: ${f.cid}` : ""}`, { x: m, y: 108, size: 5.8, font: helv, color: muted });

    page.drawRectangle({ x: 218, y: 44, width: 176, height: 66, borderWidth: 0.6, borderColor: rgb(0.2, 0.45, 0.34), color: rgb(0.93, 0.99, 0.96) });
    page.drawImage(signatureImage, { x: 226, y: 78, width: 152, height: 26 });
    page.drawLine({ start: { x: 228, y: 76 }, end: { x: 384, y: 76 }, thickness: 0.25, color: rgb(0.18, 0.22, 0.2) });
    page.drawText(DOCTOR_NAME_PDF, { x: 238, y: 66, size: 6.2, font: bold, color: rgb(0.04, 0.22, 0.16) });
    page.drawText(DOCTOR_CREDENTIALS, { x: 250, y: 58, size: 5.2, font: helv, color: muted });
    page.drawText("Assinatura digital ICP-Brasil PAdES-BES", { x: 236, y: 50, size: 5.2, font: helv, color: rgb(0.05, 0.34, 0.22) });
    if (pageIndex === 0) page.drawText("Campo tecnico da assinatura digital embutida no PDF.", { x: 222, y: 35, size: 4.4, font: helv, color: muted });

    page.drawRectangle({ x: m, y: 20, width: 190, height: 58, borderWidth: 0.4, borderColor: gold, color: rgb(1, 0.98, 0.92) });
    page.drawText("VALIDACAO DIGITAL", { x: m + 8, y: 64, size: 6.2, font: bold, color: ink });
    page.drawText("Abra no Adobe Acrobat ou no validador ICP-Brasil/ITI.", { x: m + 8, y: 52, size: 4.8, font: helv, color: ink });
    page.drawText("Escaneie o QR para abrir a pagina de verificacao.", { x: m + 8, y: 43, size: 4.8, font: helv, color: ink });
    page.drawText("Confira a assinatura ICP-Brasil embutida no PDF.", { x: m + 8, y: 32, size: 4.3, font: helv, color: rgb(0.04, 0.19, 0.48) });
    page.drawImage(qrPng, { x: m + 152, y: 30, width: 34, height: 34 });
  };

  drawVia("1a", "FARMACIA", 0);
  drawVia("2a", "PACIENTE", 1);
  return await pdf.save({ useObjectStreams: false });
}

function buildC1PrintHtml(f: FormFields): string {
  const hoje = todayBr();
  const validade = new Date();
  validade.setDate(validade.getDate() + 30);
  const valBr = validade.toLocaleDateString("pt-BR");

  const via = (numero: "1ª" | "2ª", destino: string) => `
<div class="via">
  <div class="head">
    <div class="bk">
      <div class="logo-nm">${CLINIC_NAME}</div>
      <div class="logo-sub">${DOCTOR_NAME} · Neuropediatria</div>
    </div>
    <div class="rt">
      <div class="via-tag">${numero} VIA — ${destino}</div>
      <div class="c1-tag">RECEITA DE CONTROLE ESPECIAL</div>
    </div>
  </div>

  <div class="medico-box">
    <strong>${CLINIC_NAME} — ${DOCTOR_NAME}</strong><br>
    ${DOCTOR_SPECIALTY_HTML} · ${DOCTOR_CREDENTIALS}<br>
    ${CLINIC_ADDRESS_HTML}
  </div>

  <table class="dados">
    <tr>
      <td class="lbl">Paciente</td>
      <td class="val">${escHtml(f.paciente)}</td>
      <td class="lbl" style="width:26%">Data nasc.</td>
      <td class="val" style="width:18%">${escHtml(fmtNasc(f.dataNasc))}</td>
    </tr>
    <tr>
      <td class="lbl">Idade</td>
      <td class="val">${escHtml(f.idadePaciente)}</td>
      <td class="lbl">Doses/dia</td>
      <td class="val">${escHtml(f.dosesPorDia)}</td>
    </tr>
    <tr>
      <td class="lbl">Endereço</td>
      <td class="val" colspan="3">${escHtml(f.endereco)}</td>
    </tr>
    <tr>
      <td class="lbl">Município/UF</td>
      <td class="val">${escHtml(f.municipio)}</td>
      <td class="lbl">CEP</td>
      <td class="val">${escHtml(f.cep)}</td>
    </tr>
  </table>

  <div class="rx-area">
    <div class="rx-sym">℞</div>
    <div class="rx-body">
      <div class="med-nm">${escHtml(f.medicamento)}${f.concentracao ? ` — ${escHtml(f.concentracao)}` : ""}</div>
      ${f.forma ? `<div class="med-sub">${escHtml(f.forma)}</div>` : ""}
      <div class="med-qtd">Quantidade: <strong>${escHtml(f.quantidade)}</strong>${f.quantidadeExtenso ? ` (${escHtml(f.quantidadeExtenso)})` : ""}</div>
      <div class="med-qtd">Doses por dia: <strong>${escHtml(f.dosesPorDia)}</strong></div>
      <div class="med-uso"><em>Instruções:</em> ${escHtml(f.instrucoes)}</div>
    </div>
  </div>

  <div class="footer-row">
    <div>Petrolina/PE, ${hoje} &nbsp;·&nbsp; Validade: <strong>${valBr}</strong>${f.cid ? ` &nbsp;·&nbsp; CID-10: ${escHtml(f.cid)}` : ""}</div>
    <div class="sig-area">
      <img class="sig-img" src="${signatureImageUrl}" alt="">
      <div class="sig-line"></div>
      <div class="sig-nm">${DOCTOR_NAME}</div>
      <div class="sig-info">${DOCTOR_CREDENTIALS}</div>
      <div class="sig-digital">Assinatura digital ICP-Brasil PAdES-BES</div>
    </div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Receita C1 — Dr. Jadson — ${dateStamp()}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Carlito:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
@page{size:A5 portrait;margin:8mm 10mm 10mm 10mm}
:root{--navy:#1E2A4A;--navyd:#101A2D;--bordo:#7A1F2B;--gold:#C9A961;--teal:#2E7163;
  --ivory:#FBF8F0;--ink:#5B5B6B;--graf:#2C2C3E;--line:#D9D2C2;--white:#fff;--linen:#f7f5ef;
  --mist:#bbb;--linen-deep:#f4f2ec;--taupe:#c8c0b0;--charcoal:#333;--silver:#888;
  --gold-a5:rgba(201,169,97,.5);--white-a7:rgba(255,255,255,.7)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--white);font-family:'Carlito',Arial,sans-serif;font-size:9pt;color:var(--graf)}

.via{page-break-after:always;min-height:97vh;display:flex;flex-direction:column;gap:3mm}
.via:last-child{page-break-after:auto}

.head{padding:3mm 4mm;background:linear-gradient(135deg,var(--navyd) 0%,var(--navy) 50%,var(--bordo) 100%);
  color:var(--white);display:flex;align-items:center;justify-content:space-between;
  border-radius:1.5mm;box-shadow:inset 0 -0.8mm 0 var(--gold-a5)}
.logo-nm{font-family:'Cormorant Garamond',Georgia,serif;font-size:13pt;font-weight:700;letter-spacing:.05em}
.logo-sub{font-size:6pt;letter-spacing:.2em;text-transform:uppercase;color:var(--white-a7);margin-top:.5mm}
.rt{text-align:right}
.via-tag{font-size:6pt;letter-spacing:.15em;text-transform:uppercase;color:var(--white-a7)}
.c1-tag{font-family:'Cormorant Garamond',Georgia,serif;font-size:10pt;font-weight:700;letter-spacing:.04em}

.medico-box{background:var(--linen);border-left:2mm solid var(--gold);padding:1.5mm 3mm;
  font-size:7.5pt;line-height:1.5;color:var(--graf)}

table.dados{width:100%;border-collapse:collapse;font-size:8pt}
.dados td{border:0.35pt solid var(--mist);padding:1.2mm 2mm;vertical-align:top}
.dados .lbl{background:var(--linen-deep);font-size:6.5pt;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink);white-space:nowrap;width:16%}
.dados .val{font-weight:600}

.rx-area{display:flex;gap:3mm;flex:1;border:0.5pt solid var(--taupe);border-radius:1mm;padding:2.5mm 3mm}
.rx-sym{font-size:32pt;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;
  color:var(--navyd);line-height:1;padding-top:1mm;flex-shrink:0}
.rx-body{flex:1;display:flex;flex-direction:column;gap:1.5mm}
.med-nm{font-size:11pt;font-weight:700;font-family:'Cormorant Garamond',Georgia,serif;color:var(--navyd)}
.med-sub{font-size:8pt;color:var(--ink)}
.med-qtd{font-size:9pt;border-top:.35pt dashed var(--line);padding-top:1.5mm;margin-top:1mm}
.med-uso{font-size:8.5pt;color:var(--graf);white-space:pre-wrap;line-height:1.55}

.footer-row{display:flex;align-items:flex-end;justify-content:space-between;
  border-top:.5pt solid var(--line);padding-top:2mm;font-size:7.5pt;color:var(--ink);flex-wrap:wrap;gap:2mm}
.sig-area{text-align:center}
.sig-img{width:42mm;height:9mm;object-fit:contain;display:block;margin:0 auto -1.2mm;opacity:.96}
.sig-line{width:48mm;border-top:.6pt solid var(--charcoal);margin:0 auto 1mm}
.sig-nm{font-size:8pt;font-weight:700;font-family:'Cormorant Garamond',Georgia,serif}
.sig-info{font-size:6.5pt;color:var(--ink)}
.sig-digital{font-size:6pt;color:var(--silver);font-style:italic}

@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .via{min-height:auto}}
</style>
</head>
<body>
${via("1ª", "FARMÁCIA")}
${via("2ª", "PACIENTE")}
</body>
</html>`;
}

// ── Tipos ─────────────────────────────────────────────────────────
interface FormFields {
  paciente: string;
  idadePaciente: string;
  dosesPorDia: string;
  dataNasc: string;
  endereco: string;
  municipio: string;
  cep: string;
  medicamento: string;
  concentracao: string;
  forma: string;
  quantidade: string;
  quantidadeExtenso: string;
  instrucoes: string;
  cid: string;
}

const EMPTY_FORM: FormFields = {
  paciente: "", idadePaciente: "", dosesPorDia: "", dataNasc: "", endereco: "", municipio: "", cep: "",
  medicamento: "", concentracao: "", forma: "", quantidade: "", quantidadeExtenso: "",
  instrucoes: "", cid: "",
};

type CertStatus = "ready" | "missing";

// ── Componente principal ──────────────────────────────────────────
export default function ReceitaC1ExpressPage() {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const [certStatus, setCertStatus] = useState<CertStatus>("missing");
  const [certInfo, setCertInfo] = useState<{ commonName: string; notAfter: Date } | null>(null);
  const [p12, setP12] = useState<ArrayBuffer | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  // Trava contra corrida: trocar o arquivo antes do arrayBuffer() anterior
  // resolver deixa duas leituras assíncronas em paralelo; sem isso, o
  // certificado que acaba assinando pode não ser o último selecionado.
  const p12LoadIdRef = useRef(0);

  const [busy, setBusy] = useState<"" | "sign" | "plain" | "verify">("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // ── Elimina qualquer cache legado; o certificado só entra por upload local ─
  useEffect(() => {
    void purgeLegacyCertificateCache();
  }, []);

  // ── Verifica info do certificado quando p12 + senha disponíveis ─
  async function verificarCert() {
    if (!p12 || !senha) return;
    setBusy("verify");
    setError(""); setOk("");
    try {
      const { readP12Info } = await import("@/lib/icpSign");
      const info = readP12Info(p12, senha);
      setCertInfo({ commonName: info.commonName, notAfter: info.notAfter });
      setOk(`Certificado válido até ${info.notAfter.toLocaleDateString("pt-BR")}.`);
    } catch {
      setError("Senha incorreta ou certificado inválido.");
      setCertInfo(null);
    } finally { setBusy(""); }
  }

  // ── Upload manual do .p12 (fallback) ─────────────────────────
  async function onUploadP12(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const loadId = ++p12LoadIdRef.current;
    const ab = await f.arrayBuffer();
    if (loadId !== p12LoadIdRef.current) return; // uma seleção mais recente já venceu
    setP12(ab);
    setCertStatus("ready");
    setShowUpload(false);
    setOk("Certificado carregado somente nesta aba; não foi salvo no navegador.");
  }

  // ── Gerar PDF + assinar ───────────────────────────────────────
  async function gerarEAssinar() {
    if (!p12) { setError("Certificado não disponível."); return; }
    if (!senha) { setError("Informe a senha do certificado."); return; }
    if (!form.paciente || !form.idadePaciente || !form.dosesPorDia || !form.medicamento || !form.instrucoes) {
      setError("Preencha: paciente, idade do paciente, doses por dia, medicamento e instruções de uso.");
      return;
    }
    setError(""); setOk(""); setBusy("sign");
    try {
      const { readP12Info } = await import("@/lib/icpSign");
      readP12Info(p12, senha);
    } catch (error) {
      const { icpErrorMessage } = await import("@/lib/icpSign");
      setError(icpErrorMessage(error));
      setBusy("");
      return;
    }
    try {
      const pdfBytes = await buildC1TemplatePdfBytes(form);
      const { signPdfWithP12, downloadBytes } = await import("@/lib/icpSign");
      const signed = await signPdfWithP12(pdfBytes, p12, senha, {
        reason: "Receita de Controle Especial C1",
        name: DOCTOR_NAME_PDF,
        location: "Petrolina-PE",
        widgetRect: [218, 44, 394, 110],
        widgetPageIndex: 0,
      });
      downloadBytes(signed, `receita-c1-${dateStamp()}-assinada.pdf`);
      setOk("Receita assinada e baixada com sucesso.");
    } catch (error) {
      const { icpErrorMessage } = await import("@/lib/icpSign");
      setError(icpErrorMessage(error));
    } finally { setBusy(""); }
  }

  // ── Imprimir 2 vias ───────────────────────────────────────────
  function imprimirDuasVias() {
    if (!form.paciente || !form.idadePaciente || !form.dosesPorDia || !form.medicamento || !form.instrucoes) {
      setError("Preencha paciente, idade do paciente, doses por dia, medicamento e instruções antes de imprimir.");
      return;
    }
    setError("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.opener = null;
    win.document.write(buildC1PrintHtml(form));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  // ── Baixar PDF sem assinatura ─────────────────────────────────
  async function baixarSemAssinar() {
    if (!form.paciente || !form.idadePaciente || !form.dosesPorDia || !form.medicamento || !form.instrucoes) {
      setError("Preencha paciente, idade do paciente, doses por dia, medicamento e instruções.");
      return;
    }
    setError(""); setOk(""); setBusy("plain");
    try {
      const bytes = await buildC1TemplatePdfBytes(form);
      const { downloadBytes } = await import("@/lib/icpSign");
      downloadBytes(bytes, `receita-c1-${dateStamp()}.pdf`);
      setOk("PDF gerado (sem assinatura digital).");
    } catch {
      setError("Falha ao gerar o PDF.");
    } finally { setBusy(""); }
  }

  const set = (key: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-5 pb-10 max-w-3xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────── */}
      <PageHero
        icon={Pill}
        eyebrow="receita c1 · emissão rápida"
        title="Emissão Rápida — Receita C1"
        subtitle="Preencha os dados da prescrição e informe a senha do certificado digital. O certificado fica somente na memória desta aba e não é salvo no navegador."
        gradient="from-primary to-chart-2"
      />

      {/* ── Certificado + Senha ─────────────────────────────────── */}
      <section
        className="rounded-3xl border-2 p-5 sm:p-6"
        style={{
          borderColor: certStatus === "ready" ? "hsl(var(--chart-2) / 0.5)" : "hsl(var(--chart-4) / 0.4)",
          background: certStatus === "ready"
            ? "linear-gradient(135deg, hsl(var(--chart-2) / 0.06), hsl(var(--chart-1) / 0.04))"
            : "linear-gradient(135deg, hsl(var(--chart-4) / 0.07), hsl(var(--chart-5) / 0.04))",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5" style={{ color: certStatus === "ready" ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))" }} />
          <h2 className="text-base font-bold" style={{ color: certStatus === "ready" ? "hsl(var(--chart-2))" : "hsl(var(--chart-4))" }}>
            Certificado Digital ICP-Brasil
          </h2>
        </div>

        {/* Status do certificado */}
        {certStatus === "ready" && (
          <div className="mb-4 rounded-xl border border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/30 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>
                Certificado carregado somente nesta aba
                {certInfo && ` · válido até ${certInfo.notAfter.toLocaleDateString("pt-BR")}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground underline flex-shrink-0"
            >
              Trocar
            </button>
          </div>
        )}
        {certStatus === "missing" && (
          <div className="mb-4 rounded-xl border border-amber-300/70 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Selecione seu arquivo .p12 / .pfx localmente. O certificado e a senha não serão enviados ao servidor.
            </div>
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="text-xs font-semibold underline flex-shrink-0"
            >
              Selecionar
            </button>
          </div>
        )}

        {/* Upload exclusivamente local */}
        {(showUpload || certStatus === "missing") && (
          <div className="mb-4 rounded-xl border border-border bg-background/50 p-3 space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Selecionar certificado .p12 / .pfx
            </Label>
            <Input
              type="file"
              accept=".p12,.pfx"
              onChange={onUploadP12}
              className="text-xs"
            />
          </div>
        )}

        {/* Senha */}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label htmlFor="senha-cert" className="text-xs font-semibold text-muted-foreground">
              Senha do certificado *
            </Label>
            <div className="relative mt-1">
              <Input
                id="senha-cert"
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha do .pfx"
                className="pr-9"
                onKeyDown={(e) => e.key === "Enter" && verificarCert()}
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={verificarCert}
              disabled={!!busy || !p12 || !senha}
              className="gap-1.5 w-full sm:w-auto"
            >
              {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verificar
            </Button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> {error}
          </p>
        )}
        {ok && (
          <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> {ok}
          </p>
        )}
      </section>

      {/* ── Dados do Paciente ────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Dados do Paciente</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Nome completo *</Label>
            <Input
              value={form.paciente}
              onChange={set("paciente")}
              placeholder="Nome do paciente"
              className="mt-1"
              data-testid="input-paciente"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Data de nascimento</Label>
            <Input
              type="date"
              value={form.dataNasc}
              onChange={set("dataNasc")}
              className="mt-1 w-full sm:w-40"
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Idade do paciente *</Label>
            <Input
              value={form.idadePaciente}
              onChange={set("idadePaciente")}
              placeholder="ex.: 7 anos e 3 meses"
              className="mt-1"
              data-testid="input-idade-paciente"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Doses por dia *</Label>
            <Input
              value={form.dosesPorDia}
              onChange={set("dosesPorDia")}
              inputMode="numeric"
              placeholder="ex.: 2"
              className="mt-1"
              data-testid="input-doses-por-dia"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-muted-foreground">Endereço</Label>
          <Input
            value={form.endereco}
            onChange={set("endereco")}
            placeholder="Rua, número, bairro"
            className="mt-1"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Município / UF</Label>
            <Input
              value={form.municipio}
              onChange={set("municipio")}
              placeholder="Petrolina / PE"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">CEP</Label>
            <Input
              value={form.cep}
              onChange={set("cep")}
              placeholder="00000-000"
              className="mt-1 w-full sm:w-32"
              maxLength={9}
            />
          </div>
        </div>
      </section>

      {/* ── Prescrição ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground">Prescrição</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground">Medicamento *</Label>
            <Input
              value={form.medicamento}
              onChange={set("medicamento")}
              placeholder="Nome do medicamento"
              className="mt-1"
              data-testid="input-medicamento"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Concentração</Label>
            <Input
              value={form.concentracao}
              onChange={set("concentracao")}
              placeholder="ex.: 10 mg/mL"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Forma farmacêutica</Label>
            <Input
              value={form.forma}
              onChange={set("forma")}
              placeholder="ex.: solução oral"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Quantidade</Label>
            <Input
              value={form.quantidade}
              onChange={set("quantidade")}
              placeholder="ex.: 2 frascos"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-muted-foreground">Quantidade (por extenso)</Label>
            <Input
              value={form.quantidadeExtenso}
              onChange={set("quantidadeExtenso")}
              placeholder="ex.: dois frascos"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-muted-foreground">
            Instruções de uso / Posologia *
          </Label>
          <Textarea
            value={form.instrucoes}
            onChange={set("instrucoes")}
            placeholder="ex.: Tomar 5 mL (5 mg) à noite, por via oral. Usar sem interrupção."
            className="mt-1 min-h-[90px] text-sm"
            data-testid="textarea-instrucoes"
          />
        </div>

        <div className="w-40">
          <Label className="text-xs font-semibold text-muted-foreground">CID-10 (opcional)</Label>
          <Input
            value={form.cid}
            onChange={set("cid")}
            placeholder="ex.: F90.0"
            className="mt-1"
            maxLength={10}
          />
        </div>
      </section>

      {/* ── Ações ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border/70 bg-card/80 p-4">
        <div className="flex flex-wrap gap-2.5">
          <Button
            onClick={gerarEAssinar}
            disabled={!!busy || !p12 || !senha}
            size="default"
            className="gap-2 font-semibold"
          >
            {busy === "sign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            Assinar e baixar C1
          </Button>
          <Button
            onClick={imprimirDuasVias}
            variant="outline"
            size="default"
            className="gap-2"
          >
            <Printer className="h-4 w-4" /> Imprimir 2 vias
          </Button>
          <Button
            onClick={baixarSemAssinar}
            disabled={!!busy}
            variant="ghost"
            size="default"
            className="gap-2"
          >
            {busy === "plain" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF sem assinatura
          </Button>
          <Button
            onClick={() => setShowPreview((v) => !v)}
            variant="ghost"
            size="default"
            className="gap-2"
          >
            <Eye className="h-4 w-4" /> {showPreview ? "Fechar prévia" : "Prévia visual"}
          </Button>
          <Button
            onClick={() => { setForm(EMPTY_FORM); setError(""); setOk(""); }}
            variant="ghost"
            size="default"
            className="gap-2 ml-auto"
          >
            <RefreshCw className="h-4 w-4" /> Limpar
          </Button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          A chave privada e a senha permanecem somente na memória desta aba e são descartadas ao fechá-la.
          Assinatura no padrão PAdES-BES com certificado A1 ICP-Brasil. Validade da receita: <strong>30 dias</strong>.
        </p>
      </section>

      {/* ── Prévia ───────────────────────────────────────────────── */}
      {showPreview && (
        <section className="rounded-2xl border border-border bg-card/80 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
            <span className="text-sm font-semibold">Pré-visualização (1ª via)</span>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>✕</Button>
          </div>
          <iframe
            srcDoc={buildC1PrintHtml(form)}
            className="w-full"
            style={{ height: 640, border: "none" }}
            title="Prévia Receita C1"
          />
        </section>
      )}
    </div>
  );
}

// ============================================================
// Exportação da recomendação do Filtro Clínico — CSV (Excel) e PDF.
// Estende o "Copiar p/ laudo": gera um arquivo anexável ao prontuário com o
// pódio filtrado e os qualificadores clínicos (validação BR, tempo, corte,
// fonte). Reusa buildDocumentPdf (pdf-lib) para o PDF institucional.
// ============================================================

import { neutralizeCsvFormula } from "./csv";
import { issuerCredentials, loadIssuer } from "./issuer";

export interface FilterExportRow {
  slot: string;
  clinicalTier: string;
  name: string;
  fullName: string;
  ageRange: string;
  respondente: string;
  validacaoBrasil: string;
  tempo: string;
  scoringCutoff: string;
  fonte: string;
  reason: string;
}

export interface FilterExportMeta {
  age: string;
  queixas: string;
  respondente: string;
  generatedAtLabel: string;
  qualitativeReport?: string;
}

const DISCLAIMER =
  "Recomendacao gerada pelo Filtro Clinico Inteligente da plataforma NeuroPed. " +
  "Instrumentos de triagem/apoio: organizam e priorizam escalas por idade, queixa e respondente, " +
  "mas nao substituem o julgamento clinico nem fecham diagnostico isoladamente. " +
  "Validacao no Brasil, tempo e ponto de corte refletem os metadados do catalogo; confira sempre a fonte oficial.";

// pdf-lib (Helvetica/WinAnsi) quebra em caracteres fora do Latin-1. Normaliza
// pontuação tipográfica e remove qualquer coisa fora da faixa segura (emoji…).
function asciiSafe(input: string): string {
  return (input ?? "")
    .replace(/[–—]/g, "-") // – —
    .replace(/[‘’]/g, "'") // ‘ ’
    .replace(/[“”]/g, '"') // “ ”
    .replace(/…/g, "...") // …
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "") // mantem ASCII + Latin-1 (WinAnsi)
    .trim();
}

// ---------- CSV ----------
function csvCell(value: string): string {
  const s = neutralizeCsvFormula((value ?? "").replace(/\r?\n/g, " ").trim());
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildFilterCsv(meta: FilterExportMeta, rows: FilterExportRow[]): string {
  const header = [
    "Prioridade",
    "Linha clinica",
    "Escala",
    "Nome completo",
    "Faixa etaria",
    "Respondente",
    "Validacao Brasil",
    "Tempo",
    "Ponto de corte",
    "Fonte",
    "Motivo",
  ];
  const metaLines = [
    `NeuroPed - Recomendacao de escalas;${meta.generatedAtLabel}`,
    `Idade;${meta.age}`,
    `Queixa(s);${meta.queixas}`,
    `Respondente;${meta.respondente}`,
    meta.qualitativeReport ? `Relato qualitativo;${csvCell(meta.qualitativeReport)}` : "",
    "",
  ];
  const body = rows.map((r) =>
    [
      r.slot,
      r.clinicalTier,
      r.name,
      r.fullName,
      r.ageRange,
      r.respondente,
      r.validacaoBrasil,
      r.tempo,
      r.scoringCutoff,
      r.fonte,
      r.reason,
    ]
      .map(csvCell)
      .join(";")
  );
  // BOM para o Excel abrir acentos corretamente; separador ";" (padrão BR).
  return "﻿" + [...metaLines, header.join(";"), ...body].join("\r\n");
}

// ---------- PDF ----------
export async function buildFilterPdf(
  meta: FilterExportMeta,
  rows: FilterExportRow[]
): Promise<Uint8Array> {
  const { buildDocumentPdf } = await import("@/lib/documentPdf");
  // Identidade do emissor pela fonte única (client/src/lib/issuer.ts):
  // sem perfil configurado o PDF declara a ausência de registro — nunca inventa.
  const issuer = await loadIssuer();
  const credentials = [
    [issuer.doctorName, issuerCredentials(issuer)].filter(Boolean).join(" - "),
    issuer.specialty,
  ].filter(Boolean);
  const contextBody = [
    `Idade: ${meta.age}`,
    `Queixa(s): ${meta.queixas}`,
    `Respondente: ${meta.respondente}`,
    `Gerado em: ${meta.generatedAtLabel}`,
  ].join("\n");

  const scaleSections = rows.map((r) => ({
    heading: asciiSafe(`${r.slot}${r.clinicalTier ? ` (${r.clinicalTier})` : ""} - ${r.name}`),
    body: asciiSafe(
      [
        r.fullName,
        `Faixa etaria: ${r.ageRange}`,
        `Respondente: ${r.respondente}`,
        r.validacaoBrasil ? `Validacao no Brasil: ${r.validacaoBrasil}` : "",
        r.tempo ? `Tempo de aplicacao: ${r.tempo}` : "",
        r.scoringCutoff ? `Ponto de corte: ${r.scoringCutoff}` : "",
        r.fonte ? `Fonte: ${r.fonte}` : "",
        r.reason ? `Motivo: ${r.reason}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    ),
  }));

  return buildDocumentPdf({
    title: "Recomendacao de Escalas - NeuroPed",
    subtitle: "Filtro Clinico Inteligente - triagem de apoio",
    credentials,
    clinicName: issuer.clinicName || undefined,
    motto: issuer.motto || undefined,
    sections: [
      { heading: "Contexto clinico", body: asciiSafe(contextBody) },
      ...(meta.qualitativeReport ? [{ heading: "Relato qualitativo por extenso", body: asciiSafe(meta.qualitativeReport) }] : []),
      ...scaleSections,
    ],
    footer: asciiSafe(DISCLAIMER),
  });
}

// ---------- Download ----------
export function downloadBlob(filename: string, mime: string, data: string | Uint8Array) {
  const blob = new Blob([data as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

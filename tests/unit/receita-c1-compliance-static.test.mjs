// Contrato estático da Receita de Controle Especial (C1): campos legais, layout
// sem sobreposição do emitente, metadados ITI e trava de transição SNCR.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pages = ["client/src/pages/receita-c1.tsx", "client/src/pages/receita-c1-express.tsx"];
for (const path of pages) {
  const src = readFileSync(path, "utf8");
  // Portaria 06/1999 art. 85 (red. RDC 1.000/2025): paciente identificado por CPF ou passaporte.
  assert.match(src, /cpf: string;/, `${path}: campo CPF ausente`);
  assert.match(src, /CPF \(ou passaporte\)/, `${path}: rótulo CPF/passaporte ausente`);
  assert.match(src, /CPF\/PASSAPORTE/, `${path}: CPF fora do PDF`);
  // Tabela do paciente abaixo do quadro do emitente (que termina em top - 94).
  const tableY = Number(src.match(/const tableY = top - (\d+);/)?.[1]);
  const rows = Number(src.match(/height: rowH \* (\d)/)?.[1]);
  assert.ok(tableY - rows * 13 >= 94 + 4, `${path}: tabela sobrepõe a identificação do emitente`);
  // Título medido para caber na faixa bordô.
  assert.match(src, /widthOfTextAtSize\(tituloC1, tituloSize\)/, `${path}: título C1 sem ajuste de largura`);
  // OIDs ITI de prescrição e trava SNCR.
  assert.match(src, /healthDocument[=:]\s*\{\{?\s*kind: "prescricao"/, `${path}: metadados ITI ausentes`);
  assert.match(src, /electronicRceBlockReason\(\)/, `${path}: trava de transição SNCR ausente`);
  assert.match(src, /Identificação do comprador/, `${path}: bloco do comprador ausente na impressão`);
  assert.match(src, /Identificação do fornecedor/, `${path}: bloco do fornecedor ausente na impressão`);
}
const panel = readFileSync("client/src/components/AssinaturaIcpPanel.tsx", "utf8");
assert.match(panel, /disabled=\{!!busy \|\| !p12 \|\| !!signingBlockedReason\}/);
assert.match(panel, /healthDocument,\n\s*\}\);/);
console.log("[receita-c1-compliance] ✓ CPF, layout do emitente, metadados ITI e trava SNCR conectados.");

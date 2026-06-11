// @ts-check
// Guard anti-regressão do LAYOUT do filtro (/filtro).
// Trava o bug em que a página deixou de ser centralizada e a seção de
// sinais/sintomas (QUEIXA) ficou "encolhida" (grade lg:grid-cols-4 truncada
// dentro de uma coluna estreita lg:col-span-1). Falha (exit 1) se reaparecer.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, "..", "..", "client/src/pages/filtro.tsx"), "utf8");

const errors = [];
const must = (cond, msg) => { if (!cond) errors.push(msg); };

// 1. Página centralizada com largura máxima.
must(/mx-auto/.test(src) && /max-w-\dxl/.test(src), "Filtro não está centralizado (faltam mx-auto + max-w-Nxl no shell).");

// 2. Sem o container de 2 colunas que espremia os controles.
must(!/lg:grid-cols-3/.test(src), "Regressão: 'lg:grid-cols-3' (layout de 2 colunas) reapareceu no filtro.");
must(!/lg:col-span-1/.test(src), "Regressão: 'lg:col-span-1' (coluna de controles estreita) reapareceu.");
must(!/lg:col-span-2/.test(src), "Regressão: 'lg:col-span-2' (split de resultados) reapareceu.");

// 3. Grade de QUEIXA (sinais/sintomas) não pode voltar a 4 colunas espremidas.
must(!/lg:grid-cols-4/.test(src), "Regressão: 'lg:grid-cols-4' (grade de queixas espremida) reapareceu.");

// 4. Botões de queixa devem ter emoji + rótulo que quebra (line-clamp), não truncate.
must(/q\.emoji/.test(src), "Botões de queixa sem emoji (q.emoji ausente).");
must(/line-clamp-2/.test(src), "Botões de queixa sem rótulo legível (line-clamp-2 ausente).");

if (errors.length) {
  console.error("❌ [audit-filter-layout] REGRESSÃO de layout detectada:");
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("✅ [audit-filter-layout] Filtro centralizado e sinais/sintomas legíveis (sem regressão).");

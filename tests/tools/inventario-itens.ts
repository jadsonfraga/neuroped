// Inventário descritivo dos itens aplicados (procedência e tempos previstos), gerado do código.
// Serve à revisão clínica item a item. Não contém corte, nível de desempenho nem classificação.
// Regenere com `node --import tsx tests/tools/inventario-itens.ts` e revise o diff.
import { writeFileSync } from "node:fs";
import { INTEGRATED_BANK, PHASE_ORDER, YEARS } from "../../client/src/features/super-neuropad/bank";
import { ORIGIN_LABELS } from "../../client/src/features/super-neuropad/items";
import { itemSeconds } from "../../client/src/features/super-neuropad/model";
import { BANDS } from "../../client/src/features/dyslexia-risk/game/bank";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const row = (cells: unknown[]) => cells.map(cell).join(",");

export function inventarioSuper(): string {
  const lines = [row(["faixa_anos", "mundo", "id_item", "tipo", "origem_do_item", "referencia", "tempo_previsto_s", "revisao_clinica", "observacao_da_revisao"])];
  for (const years of YEARS) {
    for (const phase of PHASE_ORDER) {
      for (const item of INTEGRATED_BANK[years][phase]) {
        lines.push(row([years, phase, item.id, item.kind, ORIGIN_LABELS[item.origin], item.ref, itemSeconds(item), "", ""]));
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

export function inventarioJogo(): string {
  const lines = [row(["faixa", "mundo", "id_item", "tipo_ou_operacao", "dificuldade_do_item_na_administracao", "revisao_clinica", "observacao_da_revisao"])];
  for (const band of BANDS) {
    for (const item of band.ditado) lines.push(row([band.label, "ditado", item.id, item.pseudo ? "pseudopalavra" : "palavra", item.level, "", ""]));
    for (const item of band.decodificacao) lines.push(row([band.label, "decodificacao", item.id, item.kind, item.level, "", ""]));
    for (const item of band.aritmetica) lines.push(row([band.label, "aritmetica", item.id, item.op, item.level, "", ""]));
    for (const set of [band.compreensao, band.compreensaoB]) {
      set.questions.forEach((q, i) => lines.push(row([band.label, `compreensao (${set.id})`, `${set.id}-q${i + 1}`, "pergunta", "", "", ""])));
    }
    lines.push(row([band.label, "fluencia", band.fluencia.id, "forma A", "", "", ""]));
    lines.push(row([band.label, "fluencia", band.fluenciaB.id, "forma B", "", "", ""]));
  }
  return `${lines.join("\n")}\n`;
}

if (process.argv[1]?.endsWith("inventario-itens.ts")) {
  writeFileSync(new URL("../../docs/instrumentos/inventario-itens-super-neuropad.csv", import.meta.url), inventarioSuper());
  writeFileSync(new URL("../../docs/instrumentos/inventario-itens-jogo-letras-numeros.csv", import.meta.url), inventarioJogo());
  console.log("inventários regenerados");
}

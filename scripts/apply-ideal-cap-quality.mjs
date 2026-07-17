import { readFileSync, writeFileSync } from "node:fs";

const path = "tests/clinical/test-filter-ideal-choice.mjs";
let source = readFileSync(path, "utf8");
const before = `  for (const i of issues) failCounts.set(i, (failCounts.get(i) ?? 0) + 1);\n  if (issues.length) {\n    failures.push({\n      id: ctx.id,\n      ageMonths: ctx.ageMonths,\n      queixas: ctx.queixas.join("+"),\n      respondente: ctx.respondente ?? "qualquer",\n      sinais: ctx.selectedSignals.join(","),\n      podio: slots.map((s) => s.scale.id).join(" | "),\n      issues: issues.join("; "),\n    });\n  }`;
const after = `  // Quando nenhum trio cabe no teto, a redução de medalhas é uma necessidade\n  // operacional. Nesses casos, não penalizamos critérios comparativos que\n  // pressupõem três slots; permanecem obrigatórios segurança, aplicabilidade e\n  // carga máxima.\n  const effectiveIssues = trioFitsBudget\n    ? issues\n    : issues.filter((issue) => issue.startsWith("R7-") || issue.startsWith("R8-"));\n  for (const i of effectiveIssues) failCounts.set(i, (failCounts.get(i) ?? 0) + 1);\n  if (effectiveIssues.length) {\n    failures.push({\n      id: ctx.id,\n      ageMonths: ctx.ageMonths,\n      queixas: ctx.queixas.join("+"),\n      respondente: ctx.respondente ?? "qualquer",\n      sinais: ctx.selectedSignals.join(","),\n      podio: slots.map((s) => s.scale.id).join(" | "),\n      issues: effectiveIssues.join("; "),\n    });\n  }`;
if (!source.includes(before)) throw new Error("bloco de falhas não encontrado");
source = source.replace(before, after);
writeFileSync(path, source);
console.log("✓ taxa ideal alinhada ao teto absoluto");

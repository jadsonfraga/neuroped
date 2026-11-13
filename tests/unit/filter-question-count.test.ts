import assert from "node:assert/strict";
import type { ScaleEntry } from "../../client/src/data/scaleFilter.ts";

const podiumModule = await import("../../client/src/data/filterPodium.ts");
const getQuestionCountInfo = (podiumModule as Record<string, unknown>).getQuestionCountInfo;

assert.equal(
  typeof getQuestionCountInfo,
  "function",
  "o pódio deve expor contagem verificável, sem fallback silencioso de 20 itens",
);

const countInfo = getQuestionCountInfo as (scale: ScaleEntry) => {
  count: number | null;
  status: "verified" | "unknown";
  source: string;
};

const base = {
  name: "Sintética",
  fullName: "Sintética",
  ageMin: 0,
  ageMax: 216,
  queixas: ["tdah"],
  respondente: ["pais"],
  prioridade: "triagem",
  tempo: "5 min",
  implementationStatus: "complete",
  appRoute: "/generic-scale/sintetica",
} as const;

const unknown = {
  ...base,
  id: "sintetica-sem-contagem",
  description: "Questionário com carga ainda não conferida",
} as unknown as ScaleEntry;
assert.deepEqual(countInfo(unknown), {
  count: null,
  status: "unknown",
  source: "unknown",
});

const misleadingDescription = {
  ...base,
  id: "sintetica-descricao-nao-e-evidencia",
  description: "20 itens segundo um texto não auditado",
} as unknown as ScaleEntry;
assert.equal(countInfo(misleadingDescription).count, null, "número na descrição não vira contagem verificada");

const verified = {
  ...base,
  id: "sintetica-verificada",
  description: "Carga conferida na implementação",
  verifiedItemCount: 17,
} as unknown as ScaleEntry;
assert.deepEqual(countInfo(verified), {
  count: 17,
  status: "verified",
  source: "catalog",
});

console.log("✓ contagem de perguntas falha fechada e distingue carga desconhecida");

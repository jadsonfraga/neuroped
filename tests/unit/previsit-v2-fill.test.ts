// Seletor v2 da pré-consulta: sempre três posições, rotuladas, sem tocar o que o v1 já resolvia; flag + modo sombra.
import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales";
import { PREVISIT_POSITIONS, previsitFamily, safePrevisitRecommendations } from "../../client/src/lib/preConsultaSafeRanking";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import { getPrevisitSelectorMode, getPrevisitShadowLog, parsePrevisitSelectorMode } from "../../client/src/lib/previsitSelectorMode";

const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const pos = (rows: ReturnType<typeof safePrevisitRecommendations>) => rows.filter((r) => (PREVISIT_POSITIONS as readonly string[]).includes(r.label));

test("v2 devolve exatamente três instrumentos, distintos e de famílias distintas, onde o v1 deixava vazio", () => {
  for (const [queixa, idadeMeses, respondente] of [["depressao", 12, "pais"], ["tiques", 6, "professor"], ["dor", 24, "pais"], ["trauma", 18, "professor"], ["efeitos", 6, "pais"]] as const) {
    const v1 = pos(safePrevisitRecommendations(catalog, { idadeMeses, queixa, respondente, contexto: "primeira-consulta" }));
    const v2 = pos(safePrevisitRecommendations(catalog, { idadeMeses, queixa, respondente, contexto: "primeira-consulta" }, { fill: true }));
    assert.ok(v1.filter((r) => r.scale).length < 3, `${queixa}/${idadeMeses}: caso de teste deveria estar incompleto no v1`);
    assert.equal(v2.filter((r) => r.scale).length, 3, `${queixa}/${idadeMeses}/${respondente}`);
    const scales = v2.map((r) => r.scale!);
    assert.equal(new Set(scales.map((s) => s.id)).size, 3);
    assert.equal(new Set(scales.map(previsitFamily)).size, 3);
    for (const r of v2) assert.ok(r.reason.length > 20);
    for (let i = 0; i < v1.filter((r) => r.scale).length; i++) assert.equal(v1[i].scale!.id, v2[i].scale!.id, "o v2 não altera posições que o v1 já preenchia");
  }
});

test("v2 mantém exatamente as escolhas do v1 quando o v1 já tinha três", () => {
  for (const queixa of ["tea", "tdah", "ansiedade", "sono", "linguagem"]) for (const idadeMeses of [72, 120, 168]) {
    const input = { idadeMeses, queixa, respondente: "pais", contexto: "primeira-consulta" };
    assert.deepEqual(safePrevisitRecommendations(catalog, input, { fill: true }).map((r) => r.scale?.id), safePrevisitRecommendations(catalog, input).map((r) => r.scale?.id));
  }
});

test("flag: padrão v2; valores inválidos são ignorados; shadow devolve o v1 e registra só dados não identificáveis", () => {
  assert.equal(getPrevisitSelectorMode(), "v2");
  assert.equal(parsePrevisitSelectorMode("x"), null);
  const input = { idadeMeses: 12, queixa: "depressao", respondente: "pais", contexto: "primeira-consulta", paciente: "Fulano de Tal", id: "x", status: "aguardando", createdAt: "" } as never;
  const store: Record<string, string> = { "neuroped:previsit-selector": "shadow" };
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store[k] ?? null };
  const out = recommendPreConsultaScales(input);
  assert.ok(out.filter((r) => r.scale).length < 3, "shadow devolve o resultado do v1");
  const log = getPrevisitShadowLog();
  assert.ok(log.length >= 1);
  assert.ok(!JSON.stringify(log).includes("Fulano"));
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

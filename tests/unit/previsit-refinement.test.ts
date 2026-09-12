import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales, type ScaleEntry } from "../../client/src/data/scaleFilter";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import { previsitRespondentVariant, previsitUpperMinutes } from "../../client/src/lib/preConsultaSafeRanking";

test("instrumento que aceita pais e professor não vira exclusivo do professor por inferência", () => {
  const snap = allScales.find((s) => s.id === "snap")!;
  assert.ok(snap.respondente.includes("pais") && snap.respondente.includes("professor"));
  const before = JSON.stringify(snap);
  assert.equal(previsitRespondentVariant(snap, "pais").applicationMode, "questionario_pais");
  assert.equal(previsitRespondentVariant(snap, "professor").applicationMode, "questionario_professor");
  assert.equal(JSON.stringify(snap), before, "não mutar o catálogo compartilhado");
  const explicit = { ...snap, applicationMode: "observacional_clinico" as const };
  assert.equal(previsitRespondentVariant(explicit, "pais"), explicit, "não relaxar modo explícito");
});

test("teto de tempo não interpreta limite inferior ou duração desconhecida como teto", () => {
  const scale = allScales.find((s) => s.id === "snap")!;
  for (const [tempo, expected] of [["3–5 min", 5], ["10 minutos", 10], ["≤ 5 min", 5], ["2,5 min", 3]] as const) assert.equal(previsitUpperMinutes({ ...scale, tempo }), expected);
  for (const tempo of ["≥ 5 min", "mais de 5 min", "variável", "20 itens; tempo não aferido", "1 hora", "0 min"]) assert.equal(previsitUpperMinutes({ ...scale, tempo }), null);
});

test("perfis usuais oferecem opção útil real, não apenas resultados vazios seguros", () => {
  for (const queixa of ["tea", "tdah", "sono", "comportamento"]) {
    const rows = recommendPreConsultaScales({ idadeMeses: 96, queixa, respondente: "pais", contexto: "primeira-consulta" });
    assert.ok(rows.some((r) => r.label === "Ouro" && r.scale), `${queixa}: há uma opção principal`);
    assert.equal(new Set(rows.flatMap((r) => r.scale ? [r.scale.id] : [])).size, rows.filter((r) => r.scale).length);
  }
  const tdah = recommendPreConsultaScales({ idadeMeses: 96, queixa: "tdah", respondente: "pais", contexto: "primeira-consulta" });
  assert.equal(tdah[0].scale?.id, "snap", "preservar instrumento específico compatível, não perder para banda larga por ordem dos respondentes");
});

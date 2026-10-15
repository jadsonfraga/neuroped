// Pré-consulta "sempre três" (decisão do Dr. Jadson, 15/10/2026) e âncora de condição no filtro.
import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { filterScalesWithClinicalRescue, getApplicationMode, isPsychosisInstrument, isSuicideInstrument, outsideConditionAnchor } from "../../client/src/data/advancedFilterLogic";
import { preConsultaQueixas, recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import { PREVISIT_POSITIONS, previsitFamily, previsitUpperMinutes } from "../../client/src/lib/preConsultaSafeRanking";

const MODE = { pais: "questionario_pais", professor: "questionario_professor", adolescente: "autoquestionario_crianca_adolescente" } as const;

test("perfis usuais recebem três posições sem repetir instrumento nem família", () => {
  for (const queixa of ["tea", "tdah", "ansiedade", "depressao", "tiques", "toc", "cefaleia", "sono", "linguagem"]) for (const idadeMeses of [72, 120, 168]) {
    const rows = recommendPreConsultaScales({ idadeMeses, queixa, respondente: "pais", contexto: "primeira-consulta" });
    const primary = rows.filter((r) => (PREVISIT_POSITIONS as readonly string[]).includes(r.label));
    assert.deepEqual(primary.map((r) => r.label), ["Ouro", "Prata", "Bronze"], `${queixa}/${idadeMeses}`);
    assert.ok(primary.every((r) => r.scale), `${queixa}/${idadeMeses}: três instrumentos`);
    const scales = primary.map((r) => r.scale!);
    assert.equal(new Set(scales.map((s) => s.id)).size, 3);
    assert.equal(new Set(scales.map(previsitFamily)).size, 3);
  }
});

test("retorno de depressão e de tiques não volta vazio", () => {
  for (const queixa of ["depressao", "tiques"]) for (const idadeMeses of [120, 168]) {
    const rows = recommendPreConsultaScales({ idadeMeses, queixa, respondente: "pais", contexto: "retorno" });
    assert.ok(rows.filter((r) => r.scale && r.label !== "Questionário escolar").length >= 2, `${queixa}/${idadeMeses}`);
  }
});

test("as três posições nunca relaxam idade, respondente, modo, segurança ou tempo", () => {
  const roles = ["pais", "adolescente", "professor"] as const;
  for (const { id: queixa } of preConsultaQueixas) for (const idadeMeses of [6, 18, 36, 72, 120, 168, 215]) for (const respondente of roles) for (const contexto of ["primeira-consulta", "retorno", "ajuste-medicacao"] as const) {
    const rows = recommendPreConsultaScales({ idadeMeses, queixa, respondente, contexto });
    for (const row of rows) {
      if (!row.scale || !(PREVISIT_POSITIONS as readonly string[]).includes(row.label)) continue;
      const s = row.scale;
      const where = `${queixa}/${idadeMeses}/${respondente}/${contexto}: ${s.id}`;
      assert.ok(idadeMeses >= s.ageMin && idadeMeses <= s.ageMax, where);
      assert.equal(getApplicationMode(s), MODE[respondente], where);
      assert.equal(isSuicideInstrument(s) || isPsychosisInstrument(s), false, where);
      assert.ok((previsitUpperMinutes(s) ?? 99) <= 15, where);
    }
    const empty = rows.find((r) => !r.scale && (PREVISIT_POSITIONS as readonly string[]).includes(r.label));
    if (empty) assert.match(empty.reason, /Não completar com instrumento inadequado/);
  }
});

test("cefaleia aos 10 anos não traz bateria de paralisia cerebral (filtro e pré-consulta)", () => {
  const ctx = { ageMonths: 120, ageBand: { min: 120, max: 120 }, queixas: ["dor"], respondente: "pais" as const, assessmentUse: null, isLiterate: null, isVerbal: null, selectedSignals: [] };
  const ids = filterScalesWithClinicalRescue(allScales, ctx).map((m) => m.scale.id);
  assert.ok(!ids.some((id) => id.startsWith("ipn-pc-fun")), ids.join(","));
  const pre = recommendPreConsultaScales({ idadeMeses: 120, queixa: "cefaleia", respondente: "pais", contexto: "primeira-consulta" });
  assert.ok(pre.every((r) => !r.scale?.id.startsWith("ipn-pc-fun")));
  const pc = allScales.find((s) => s.id === "ipn-pc-fun-familia-50")!;
  assert.equal(outsideConditionAnchor(pc, ["dor"]), true);
  assert.equal(outsideConditionAnchor(pc, ["dor", "pc"]), false);
  assert.equal(outsideConditionAnchor(pc, ["motor"]), false);
  assert.equal(outsideConditionAnchor(pc, []), false, "sem queixa: não bloqueia");
});

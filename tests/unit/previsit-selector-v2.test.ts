import assert from "node:assert/strict";
import { test } from "node:test";
import { allScales } from "../../client/src/data/scaleFilter";
import { mergeFilterableCatalog } from "../../client/src/data/filterableCatalog";
import { noCostWorldScales } from "../../client/src/data/noCostWorldScales";
import { isLicenseRestricted, isPsychosisInstrument, isSuicideInstrument, getImplementationStatus } from "../../client/src/data/advancedFilterLogic";
import { QUEIXA_COOCORRENCIA } from "../../client/src/data/scaleFilter";
import { recommendPrevisitV2, overlapGroupOf } from "../../client/src/lib/previsitSelectorV2";
import { recommendPreConsultaScales } from "../../client/src/lib/preConsultaCore";
import { getPrevisitSelectorMode, getPrevisitShadowLog, parsePrevisitSelectorMode, PREVISIT_SELECTOR_DEFAULT, PREVISIT_SELECTOR_STORAGE_KEY } from "../../client/src/lib/previsitSelectorMode";

const catalog = mergeFilterableCatalog([...allScales, ...noCostWorldScales]);
const QUEIXAS = ["linguagem", "tea", "tdah", "comportamento", "sono", "ansiedade", "depressao", "trauma", "tiques", "epilepsia", "aprendizagem", "alimentacao", "efeitos", "social", "atraso", "toc", "dor", "pc"];
const ROLE = { pais: "pais", adolescente: "autoaplicavel", professor: "professor", secretaria: "pais" } as const;

test("v2: invariantes de segurança e domínio em toda a grade (0–3 escalas, nunca irrelevante)", () => {
  let checked = 0;
  for (const queixa of QUEIXAS) for (const respondente of ["pais", "adolescente", "professor", "secretaria"] as const)
    for (const contexto of ["primeira-consulta", "retorno", "avaliacao-escolar", "ajuste-medicacao", "acompanhamento"] as const)
      for (const idadeMeses of [8, 20, 30, 50, 70, 90, 110, 130, 150, 190, 215]) {
        if (respondente === "adolescente" && idadeMeses < 96) continue;
        const out = recommendPrevisitV2(catalog, { idadeMeses, queixa, respondente, contexto });
        const tag = `${queixa}/${respondente}/${contexto}/${idadeMeses}m`;
        assert.ok(out.length <= 3, tag);
        assert.equal(new Set(out.map((r) => r.scale!.id)).size, out.length, `${tag}: repetida`);
        assert.equal(new Set(out.map((r) => overlapGroupOf(r.scale!))).size, out.length, `${tag}: mesmo grupo de redundância`);
        assert.equal(new Set(out.map((r) => r.label)).size, out.length, `${tag}: rótulo repetido`);
        const allowed = new Set([queixa === "efeitos" ? "efeitos" : queixa, ...(QUEIXA_COOCORRENCIA[queixa] ?? []), "sono", "funcionalidade", "efeitos"]);
        for (const r of out) {
          const s = r.scale!;
          assert.ok(idadeMeses >= s.ageMin && idadeMeses <= s.ageMax, `${tag}: ${s.id} fora da idade`);
          assert.ok(s.respondente.length > 0 && !!s.appRoute, `${tag}: ${s.id} sem rota/respondente`);
          assert.equal(getImplementationStatus(s), "complete", `${tag}: ${s.id} não abre por inteiro`);
          assert.ok(!isLicenseRestricted(s) && !isSuicideInstrument(s) && !isPsychosisInstrument(s), `${tag}: ${s.id} bloqueada`);
          assert.ok(s.queixas.some((q) => allowed.has(q)), `${tag}: ${s.id} de domínio estranho`);
          assert.ok(r.reasons.length >= 4 && r.slot, `${tag}: sem motivos`);
          assert.ok(!r.reason.includes("undefined"), tag);
        }
        const mainRole = ROLE[respondente];
        const main = out.find((r) => r.slot === "principal");
        assert.ok(!main || main.scale!.respondente.includes(mainRole), `${tag}: respondente da vaga 1`);
        checked++;
      }
  assert.ok(checked > 1000);
});

test("v2 é puro: não muda o catálogo e é determinístico", () => {
  const before = JSON.stringify(catalog);
  const input = { idadeMeses: 96, queixa: "tdah", respondente: "pais", contexto: "primeira-consulta" } as const;
  assert.deepEqual(recommendPrevisitV2(catalog, input).map((r) => r.scale!.id), recommendPrevisitV2(catalog, input).map((r) => r.scale!.id));
  assert.equal(JSON.stringify(catalog), before);
});

test("v2 recusa entrada inválida e não inventa respondente", () => {
  assert.deepEqual(recommendPrevisitV2(catalog, { idadeMeses: 0, queixa: "tdah", respondente: "pais", contexto: "retorno" }), []);
  assert.deepEqual(recommendPrevisitV2(catalog, { idadeMeses: 90, queixa: "tdah", respondente: "pais", contexto: "x" as never }), []);
});

test("flag: padrão v1 preserva o comportamento atual; valores inválidos são ignorados", () => {
  assert.equal(PREVISIT_SELECTOR_DEFAULT, "v1");
  assert.equal(parsePrevisitSelectorMode("v2"), "v2");
  assert.equal(parsePrevisitSelectorMode("v3"), null);
  assert.equal(getPrevisitSelectorMode(), "v1");
  const rows = recommendPreConsultaScales({ idadeMeses: 96, queixa: "tdah", respondente: "pais", contexto: "primeira-consulta" });
  assert.equal(rows[0].scale?.id, "snap");
});

test("modo sombra devolve v1 e registra divergência sem dados do paciente", () => {
  const store = new Map<string, string>([[PREVISIT_SELECTOR_STORAGE_KEY, "shadow"]]);
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => store.get(k) ?? null };
  try {
    const rows = recommendPreConsultaScales({ idadeMeses: 100, queixa: "tdah", respondente: "pais", contexto: "primeira-consulta" });
    assert.equal(rows[0].scale?.id, "snap");
    assert.ok(rows.every((r) => r.slot === undefined), "shadow devolve a saída v1");
    for (const rec of getPrevisitShadowLog()) assert.deepEqual(Object.keys(rec).sort(), ["ageBand", "contexto", "queixa", "respondente", "v1", "v2"]);
  } finally { delete (globalThis as { localStorage?: unknown }).localStorage; }
});

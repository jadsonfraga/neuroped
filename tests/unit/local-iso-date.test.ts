// Regressão: formulários clínicos (diário de crises, Ashworth/Tardieu, fichas
// de registro, diários) preenchiam "hoje" com toISOString().slice(0, 10), que
// é a data em UTC — no Brasil, depois das 21h, o registro nascia no dia
// seguinte (e o diário de crises juntava essa data com a hora local).
process.env.TZ = "America/Sao_Paulo";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { formatIsoDateBr, localIsoDate } from "../../client/src/lib/clinicalDate";
import { montarResumo } from "../../client/src/lib/resumoPreConsulta";

describe("localIsoDate", () => {
  it("usa o calendário local, não UTC", () => {
    const lateEvening = new Date("2026-09-28T23:30:00-03:00");
    assert.equal(lateEvening.toISOString().slice(0, 10), "2026-09-29", "premissa: UTC já virou o dia");
    assert.equal(localIsoDate(lateEvening), "2026-09-28");
    assert.equal(localIsoDate(new Date("2026-01-05T00:10:00-03:00")), "2026-01-05");
  });

  it("formulários clínicos não usam a data UTC como padrão de hoje", () => {
    for (const path of [
      "client/src/components/DiarioClinico.tsx",
      "client/src/pages/diario-epilepsia.tsx",
      "client/src/pages/espasticidade.tsx",
      "client/src/pages/fichas-registro.tsx",
      "client/src/pages/epilepsy-diary.tsx",
      "client/src/pages/headache-calendar.tsx",
      "client/src/pages/laudo-um-clique.tsx",
    ]) {
      const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
      // Qualquer chave de data (`data`, `dataConsulta`, `date`, `f[field.key]`…).
      assert.doesNotMatch(source, /(\w*(?:data|date|Data|Date)\w*|f\[field\.key\])\s*[:=]\s*(new Date\(\)|now)\.toISOString\(\)\.slice\(0, 10\)/, path);
      assert.match(source, /localIsoDate\((now)?\)/, path);
    }
  });

  it("arquivos exportados e registros lúdicos não datam o dia em UTC", () => {
    for (const path of [
      "client/src/components/BatteryReportCard.tsx",
      "client/src/components/DiarioClinico.tsx",
      "client/src/pages/paciente-detalhe.tsx",
      "client/src/pages/headache-calendar.tsx",
      "client/src/pages/epilepsy-diary.tsx",
      "client/src/pages/pacientes.tsx",
      "client/src/pages/super-neuropad-game.tsx",
      "client/src/features/super-neuropad/model.ts",
    ]) {
      const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
      assert.doesNotMatch(source, /toISOString\(\)\.(slice\(0, 10\)|split\("T"\)\[0\])/, path);
      assert.doesNotMatch(source, /startedAt\.slice\(0, 10\)/, path);
    }
  });

  it("datas exibidas: timestamp mostra o dia local; data pura fica como está", () => {
    // Escala aplicada às 22h em Brasília (01h UTC do dia seguinte) é do dia 21.
    assert.equal(formatIsoDateBr("2026-10-22T01:30:00.000Z"), "21/10/2026");
    assert.equal(formatIsoDateBr("2026-10-21"), "21/10/2026");
    assert.equal(formatIsoDateBr("não é data"), null);
    assert.equal(formatIsoDateBr("2026-13-45"), null, "data pura impossível não vira dd/mm");
    for (const path of [
      "client/src/components/EvolucaoEscalasPanel.tsx",
      "client/src/pages/resumo-pre-consulta.tsx",
      "client/src/lib/evolucaoEscalas/evolucao.ts",
      "client/src/lib/resumoPreConsulta/resumo.ts",
    ]) {
      const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
      assert.doesNotMatch(source, /toISOString\(\)\.slice\(0, 10\)\.split\("-"\)\.reverse/, path);
      assert.match(source, /formatIsoDateBr/, path);
    }
  });

  it("idade do resumo pré-consulta conta o dia local, não o UTC", () => {
    // 21/10 às 22h em Brasília já é 22/10 em UTC: a criança ainda não completou 10 anos.
    const r = montarResumo({
      paciente: { nome: "Paciente Fictício", dataNascimento: "2016-10-22" },
      eventos: [],
      resultados: [],
      hoje: "2026-10-22T01:00:00Z",
    });
    assert.equal(r.paciente.idade, "9 anos");
  });

  it("prontuário recalcula hoje a cada uso e o diário de crises lê a data no fuso local", () => {
    const prontuario = readFileSync(new URL("../../client/src/pages/prontuario.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(prontuario, /^const today\s*=/m, "data congelada no carregamento do módulo");
    const diario = readFileSync(new URL("../../client/src/pages/diario-epilepsia.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(diario, /new Date\(c\.data\)/, "data do input lida como UTC");
  });
});

// Regressão (diagnóstico 07/11/2026, P1): Laudo NeuroPed, Laudo em um clique e
// Evolução buscavam o paciente em /api/patients (legado *_demo, por dono). Em
// sessão LIVE o ID pertence a /api/live/patients (por clínica), e o
// pré-preenchimento falhava em silêncio. Dados 100% sintéticos.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  liveAssessmentsToResults,
  patientPrefillFromPayload,
  patientProfileUrl,
} from "../../client/src/lib/patientPrefillSource";

const LIVE = { live: true, clinicId: "clinic-sintetica" };
const LOCAL = { live: false, clinicId: null };

describe("patientPrefillSource", () => {
  it("LIVE busca o paciente na clínica ativa; local mantém o legado", () => {
    assert.equal(patientProfileUrl("pac-1", LIVE), "/api/live/patients/pac-1?clinicId=clinic-sintetica");
    assert.equal(patientProfileUrl("pac-1", LOCAL), "/api/patients/pac-1");
    assert.throws(() => patientProfileUrl("pac-1", { live: true, clinicId: null }));
  });

  it("lê o perfil cifrado LIVE (profile) e o formato legado", () => {
    const live = patientPrefillFromPayload(
      { id: "pac-1", profile: { name: "Criança Sintética", birthDate: "2018-01-02", diagnosisCode: "F84.0", guardianName: "Responsável Sintético" } },
      LIVE,
    );
    assert.deepEqual(live, { name: "Criança Sintética", birthDate: "2018-01-02", diagnosisCode: "F84.0", guardianName: "Responsável Sintético" });
    const legacy = patientPrefillFromPayload({ patient: { name: "Outra Sintética" } }, LOCAL);
    assert.equal(legacy.name, "Outra Sintética");
    assert.equal(legacy.birthDate, "");
  });

  it("avaliações LIVE viram resultados sem escore nem classificação inventados", () => {
    const [result] = liveAssessmentsToResults({
      data: [{ id: "a-1", instrumentId: "snap-iv", instrumentVersion: "1", appliedAt: "2026-11-01T10:00:00.000Z", payload: { title: "SNAP-IV" }, status: "active" }],
    }) as Array<Record<string, unknown>>;
    assert.equal(result.scaleName, "SNAP-IV");
    assert.equal(result.totalScore, null);
    assert.equal(result.classification, "");
    assert.equal(result.createdAt, "2026-11-01T10:00:00.000Z");
    assert.deepEqual(liveAssessmentsToResults(null), []);
    const onlyActive = liveAssessmentsToResults({
      data: [
        { id: "a-2", instrumentId: "snap-iv", appliedAt: "2026-11-02T10:00:00.000Z", payload: { title: "SNAP-IV" }, status: "active" },
        { id: "a-1", instrumentId: "snap-iv", appliedAt: "2026-11-01T10:00:00.000Z", payload: { title: "SNAP-IV" }, status: "corrected" },
        { id: "a-0", instrumentId: "snap-iv", appliedAt: "2026-10-01T10:00:00.000Z", payload: { title: "SNAP-IV" }, status: "voided" },
      ],
    }) as Array<Record<string, unknown>>;
    assert.deepEqual(onlyActive.map((row) => row.id), ["a-2"], "supersedida não entra no laudo nem na evolução");
  });

  for (const file of [
    "client/src/pages/laudo-neuroped.tsx",
    "client/src/pages/laudo-um-clique.tsx",
    "client/src/pages/evolucao-escalas.tsx",
  ]) {
    it(`${file} não busca o paciente direto no legado`, () => {
      const source = readFileSync(file, "utf8");
      assert.equal(/\/api\/patients/.test(source), false);
      assert.match(source, /usePatientDataSource/);
    });
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { onRequestPost } from "../../functions/api/live/events/index";
import { ALFA, BETA, fixture } from "./_multiclinic-fixture";

test("reconhece a mesma tentativa de salvar e não confirma outro conteúdo ou outro tenant", async () => {
  const f = await fixture();
  try {
    const original = {
      clinicId: ALFA, patientId: "paciente-alfa", eventType: "observation",
      occurredAt: "2026-01-12T12:00:00.000Z", encounterId: "nppr-v1-anamnese-queixaPrincipal",
      provenanceKind: "documented", provenanceSource: "clinician",
      sourceRecordReference: "nppr-save-v1-0dfdee00-0000-4000-8000-000000000007",
      payload: { domain: "other", findingStatus: "present", valueText: "Primeiro registro fictício" },
    };
    const save = (data: typeof original) => f.call("owner-a", onRequestPost as never, "/api/live/events", "POST", data, data.clinicId);
    const first = await save(original);
    assert.equal(first.status, 201, await first.clone().text());
    const { id } = await first.json() as { id: string };
    const repeated = await save(original);
    assert.equal(repeated.status, 200);
    assert.deepEqual(await repeated.json(), { id, duplicate: true });
    const notSame = await save({ ...original, payload: { ...original.payload, valueText: "Outro texto fictício" } });
    assert.equal(notSame.status, 409);
    assert.equal((await notSame.json() as { code: string }).code, "PRONTUARIO_REPLAY_CONFLICT");
    assert.equal((await save({ ...original, clinicId: BETA, patientId: "paciente-beta" })).status, 403);
    assert.equal((f.raw.prepare("SELECT count(*) AS count FROM live_clinical_events WHERE source_record_hash IS NOT NULL").get() as { count: number }).count, 1);
  } finally { f.raw.close(); }
});

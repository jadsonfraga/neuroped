/** Generate a disposable SQLite fixture for local D1. This never accepts an existing database. */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { backup } from "node:sqlite";
import { fixture, ALFA } from "../../unit/_multiclinic-fixture";
import { encryptClinicalJson } from "../../../functions/api/tenant/_crypto";
import { hashPassword } from "../../../functions/api/auth/_crypto";

const destination = process.argv[2];
const password = process.env.LIVE_DISCOVERY_PASSWORD;
assert.ok(destination?.endsWith(".sqlite") && !existsSync(destination), "use um novo arquivo .sqlite");
assert.ok(password && password.length >= 12, "configure uma senha fictícia, exclusiva da fixture");
const dataKey = process.env.LIVE_DISCOVERY_FIXTURE_DATA_KEY;
if (dataKey !== undefined) assert.ok(dataKey.length >= 32, "a chave efêmera da fixture deve ter pelo menos 32 caracteres");
const f = await fixture();
try {
  const fixtureEnv = dataKey === undefined ? f.env : { ...f.env, CLINICAL_DATA_KEY: dataKey };
  f.raw.exec("DELETE FROM live_patients");
  f.raw.prepare("UPDATE users SET password_hash=? WHERE id='owner-a'").run(await hashPassword(password));
  if (process.env.LIVE_AGENDA_OPERATOR_FIXTURE === "1") {
    f.raw.prepare("UPDATE users SET password_hash=? WHERE id='sec-a'").run(await hashPassword(password));
  }
  const insert = f.raw.prepare("INSERT INTO live_patients(id,clinic_id,created_by_user_id,profile_encrypted,created_at) VALUES(?,?,'owner-a',?,?)");
  for (let i = 0; i < 156; i++) {
    const id = "audit-patient-" + String(i).padStart(3, "0");
    const name = i === 0 ? "Paciente Remoto Sintético Distante" : "Paciente fictício " + i;
    const profile = await encryptClinicalJson(fixtureEnv, ALFA, "patient-profile:" + id, { name });
    insert.run(id, ALFA, profile, new Date(Date.UTC(2024, 0, i + 1)).toISOString());
  }
  if (process.env.LIVE_DISCOVERY_PRONTUARIO_LEGACY === "1") {
    const id = "prontuario-legado-ficticio";
    const payload = await encryptClinicalJson(fixtureEnv, ALFA, "clinical-event:" + id, { valueText: "Registro gestacional sintético legado." });
    f.raw.prepare(`INSERT INTO live_clinical_events
      (id, clinic_id, patient_id, author_user_id, event_type, occurred_at, encounter_id, provenance_kind, provenance_source, payload_encrypted, status)
      VALUES (?,?,'audit-patient-000','prof-a','observation',?,'anamnese:gestacional','documented','clinician',?,'active')`)
      .run(id, ALFA, "2024-01-01T00:00:00.000Z", payload);
  }
  await backup(f.raw, destination);
} finally {
  f.raw.close();
}

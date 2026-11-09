/**
 * G3: migração do único paciente legado real para o prontuário LIVE cifrado.
 * Handler REAL + middleware global + todas as migrations em SQLite.
 * Dados 100% fictícios: nomes, datas e escalas inventados para o teste.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { fixture, ALFA, BETA } from "./_multiclinic-fixture";
import { onRequestPost as migrate, onRequestGet as eligibility, LEGACY_MIGRATION_CONFIRMATION } from "../../functions/api/admin/legacy-patient-migration";
import { onRequestGet as assessmentsGet } from "../../functions/api/live/assessments/index";
import { decryptClinicalJson } from "../../functions/api/tenant/_crypto";

const PATH = "/api/admin/legacy-patient-migration";
const NAME = "Criança Fictícia Migração";

async function setup(opts: { seeds?: number; withRealConsultation?: boolean; secondClinic?: boolean } = {}) {
  const f = await fixture();
  // owner-a é a conta bootstrap: admin global e titular só da ALFA.
  f.raw.prepare("UPDATE users SET role = 'admin' WHERE id = 'owner-a'").run();
  (f.env as Record<string, unknown>).ADMIN_EMAIL = "owner-a@example.test";
  const seeds = opts.seeds ?? 3;
  for (let i = 1; i <= seeds; i += 1) {
    f.raw.prepare("INSERT INTO patients_demo (id, owner_user_id, name) VALUES (?, NULL, 'Demo fictício')").run(`demo-00${i}`);
  }
  f.raw.prepare("INSERT INTO consultations_demo (id, patient_id) VALUES ('c-seed', 'demo-001')").run();
  f.raw.prepare("INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name) VALUES ('s-seed', 'demo-001', 'snap', 'SNAP fictício')").run();
  f.raw.prepare(`INSERT INTO patients_demo (id, owner_user_id, name, birth_date, guardian_name, notes)
                 VALUES ('legado-real', 'owner-a', ?, '2017-03-04', 'Responsável Fictício', 'Nota fictícia de teste')`).run(NAME);
  const scales: Array<[string, string, string, number | null, string]> = [
    ["s1", "snap-iv", "SNAP-IV fictício", 12, '{"q1":2}'],
    ["s2", "mchat-r", "M-CHAT-R fictício", null, "texto livre não-JSON"],
    ["s3", "", "Escala sem id", 3, '{"q":1}'],
  ];
  for (const [id, scaleId, name, score, details] of scales) {
    f.raw.prepare(`INSERT INTO scale_results_demo (id, patient_id, scale_id, scale_name, score, interpretation, details, applied_at)
                   VALUES (?, 'legado-real', ?, ?, ?, 'interpretação fictícia', ?, '2025-05-0${id.slice(1)} 10:00:00')`).run(id, scaleId, name, score, details);
  }
  if (opts.withRealConsultation) {
    f.raw.prepare("INSERT INTO consultations_demo (id, patient_id) VALUES ('c-real', 'legado-real')").run();
  }
  if (opts.secondClinic) {
    f.raw.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, 'owner-a', 'owner')").run(BETA);
  }
  return f;
}

const body = (over: Record<string, unknown> = {}) => ({ confirm: LEGACY_MIGRATION_CONFIRMATION, ...over });

test("G3: só o admin bootstrap, com confirmação, migra o paciente real cifrado e preserva a origem", async () => {
  const f = await setup();
  try {
    assert.equal((await f.call("owner-a", eligibility as never, PATH)).status, 200, "cartão visível só ao admin principal");
    for (const other of ["prof-a", "owner-b", "admin-a"]) assert.equal((await f.call(other, eligibility as never, PATH)).status, 403, other);
    assert.equal((await f.call("prof-a", migrate as never, PATH, "POST", body())).status, 403, "profissional comum");
    assert.equal((await f.call("owner-b", migrate as never, PATH, "POST", body())).status, 403, "outro titular");
    assert.equal((await f.call("owner-a", migrate as never, PATH, "POST", { confirm: "sim" })).status, 400, "sem a frase");

    const before = {
      legacyPatients: (f.raw.prepare("SELECT COUNT(*) AS n FROM patients_demo").get() as { n: number }).n,
      legacyScales: (f.raw.prepare("SELECT COUNT(*) AS n FROM scale_results_demo").get() as { n: number }).n,
      livePatients: (f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients").get() as { n: number }).n,
    };

    const dry = await f.call("owner-a", migrate as never, PATH, "POST", body({ dryRun: true }));
    assert.equal(dry.status, 200);
    assert.deepEqual(await dry.json(), { dryRun: true, clinicId: ALFA, patientsMigrated: 0, assessmentsMigrated: 0, assessmentsFound: 3, legacySourcePreserved: true });
    assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients").get() as { n: number }).n, before.livePatients, "dry-run não grava");

    const res = await f.call("owner-a", migrate as never, PATH, "POST", body());
    assert.equal(res.status, 201);
    const out = (await res.json()) as { patientId: string; assessmentsMigrated: number; clinicId: string };
    assert.equal(out.clinicId, ALFA);
    assert.equal(out.assessmentsMigrated, 3);
    assert.doesNotMatch(JSON.stringify(out), /Fictícia|2017-03-04|Responsável/, "resposta sem dado pessoal");

    const row = f.raw.prepare("SELECT clinic_id, profile_encrypted, external_reference_hash, patient_identity_hash, created_by_user_id FROM live_patients WHERE id = ?").get(out.patientId) as Record<string, string>;
    assert.equal(row.clinic_id, ALFA);
    assert.equal(row.created_by_user_id, "owner-a");
    assert.ok(row.external_reference_hash && row.patient_identity_hash);
    assert.doesNotMatch(row.profile_encrypted, /Fictícia|2017/);
    const profile = await decryptClinicalJson<Record<string, unknown>>(f.env as never, ALFA, `patient-profile:${out.patientId}`, row.profile_encrypted);
    assert.deepEqual(profile, { name: NAME, birthDate: "2017-03-04", guardianName: "Responsável Fictício", guardianPhone: null, diagnosisCode: null, notes: "Nota fictícia de teste" });

    // escalas legíveis pela rota LIVE padrão, com título e dados legados preservados
    const listed = (await (await f.call("owner-a", assessmentsGet as never, `/api/live/assessments?clinicId=${ALFA}&patientId=${out.patientId}`, "GET", undefined, ALFA)).json()) as { data: Array<{ instrumentId: string; instrumentVersion: string; provenanceSource: string; payload: { title: string; legacy: { score: unknown; details: unknown } } }> };
    assert.equal(listed.data.length, 3);
    const byTitle = Object.fromEntries(listed.data.map((a) => [a.payload.title, a]));
    assert.equal(byTitle["SNAP-IV fictício"].instrumentId, "snap-iv");
    assert.deepEqual(byTitle["SNAP-IV fictício"].payload.legacy.details, { q1: 2 });
    assert.equal(byTitle["M-CHAT-R fictício"].payload.legacy.details, "texto livre não-JSON");
    assert.equal(byTitle["Escala sem id"].instrumentId, "legado");
    assert.ok(listed.data.every((a) => a.instrumentVersion === "legado" && a.provenanceSource === "instrument"));

    // origem intacta; seeds intocados; auditoria só com contagens
    assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM patients_demo").get() as { n: number }).n, before.legacyPatients);
    assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM scale_results_demo").get() as { n: number }).n, before.legacyScales);
    const audit = f.raw.prepare("SELECT metadata_json FROM saas_audit_log WHERE action = 'legacy_patient_migrated'").all() as Array<{ metadata_json: string }>;
    assert.equal(audit.length, 1);
    assert.doesNotMatch(audit[0].metadata_json, /Fictícia|2017|legado-real|Nota/);

    // idempotência
    const again = await f.call("owner-a", migrate as never, PATH, "POST", body());
    assert.equal(again.status, 409);
    assert.equal(((await again.json()) as { code: string }).code, "ALREADY_MIGRATED");
    assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients").get() as { n: number }).n, before.livePatients + 1);
  } finally {
    f.raw.close();
  }
});

test("G3: censo divergente, dependente não migrável ou titularidade ambígua bloqueiam sem gravar", async () => {
  const cases: Array<[Parameters<typeof setup>[0], string]> = [
    [{ seeds: 2 }, "CENSUS_MISMATCH"],
    [{ withRealConsultation: true }, "UNSUPPORTED_DEPENDENTS"],
    [{ secondClinic: true }, "OWNER_CLINIC_NOT_UNIQUE"],
  ];
  for (const [opts, code] of cases) {
    const f = await setup(opts);
    try {
      const livePatients = (f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients").get() as { n: number }).n;
      const res = await f.call("owner-a", migrate as never, PATH, "POST", body());
      assert.equal(res.status, 409, code);
      assert.equal(((await res.json()) as { code: string }).code, code);
      assert.equal((f.raw.prepare("SELECT COUNT(*) AS n FROM live_patients").get() as { n: number }).n, livePatients, `${code}: nada gravado`);
    } finally {
      f.raw.close();
    }
  }

  // registro real de outra conta: não é da bootstrap → bloqueia
  const f = await setup();
  try {
    f.raw.prepare("UPDATE patients_demo SET owner_user_id = 'prof-a' WHERE id = 'legado-real'").run();
    const res = await f.call("owner-a", migrate as never, PATH, "POST", body());
    assert.equal(((await res.json()) as { code: string }).code, "CENSUS_MISMATCH");
  } finally {
    f.raw.close();
  }
});

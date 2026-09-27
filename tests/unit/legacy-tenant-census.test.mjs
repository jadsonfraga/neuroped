import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { collectLegacyTenantCensus } from "../../scripts/audits/legacy-tenant-census.mjs";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = OFF");
  db.exec(readFileSync("db/schema.d1.sql", "utf8"));
  db.exec(readFileSync("db/migrations/0009_saas_phase1_foundation.sql", "utf8"));
  for (const id of ["unique", "multiple", "none", "inactive", "removed-clinic"]) {
    db.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES (?, 'SENSITIVE-NAME', ?, ?, ?)")
      .run(id, `${id}@synthetic.invalid`, id === "unique" ? "admin" : "professional", id === "inactive" ? 0 : 1);
  }
  for (const id of ["alfa", "beta", "suspended"]) {
    db.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id, status) VALUES (?, ?, 'SENSITIVE-CLINIC', 'unique', ?)")
      .run(id, id, id === "suspended" ? "suspended" : "active");
  }
  for (const [user, clinic] of [["unique", "alfa"], ["multiple", "alfa"], ["multiple", "beta"], ["inactive", "alfa"], ["removed-clinic", "suspended"]]) {
    db.prepare("INSERT INTO clinic_memberships (clinic_id, user_id, role) VALUES (?, ?, 'owner')").run(clinic, user);
  }
  const owners = [null, "unknown-user", "unique", "unique", "multiple", "none", "inactive", "removed-clinic"];
  owners.forEach((owner, i) => {
    db.prepare("INSERT INTO patients_demo (id, owner_user_id, name, notes) VALUES (?, ?, 'SENSITIVE-PATIENT', 'SENSITIVE-CLINICAL-CONTENT')")
      .run(i === 0 ? "demo-001" : `private-patient-${i}`, owner);
  });
  db.exec("PRAGMA query_only = ON");
  const queries = [];
  const query = async (sql, params = []) => {
    queries.push(sql);
    return db.prepare(sql).all(...params);
  };
  return { db, queries, query };
}

test("read-only census classifies ambiguous owners without returning identities or content", async () => {
  const f = fixture();
  try {
    const report = await collectLegacyTenantCensus(f.query, { bootstrapEmail: "unique@synthetic.invalid" });
    assert.equal(report.tables.patients_demo.rows, 8);
    assert.deepEqual(report.patientOwnership, {
      no_owner: 1, missing_owner: 1, inactive_owner: 1, no_active_clinic: 2,
      one_active_clinic: 2, multiple_active_clinics: 1,
    });
    assert.deepEqual(report.patientOwnerPresence, { assigned: 7, unassigned: 1 });
    assert.deepEqual(report.distinctOwners, {
      total: 6, no_active_clinic: 3, one_active_clinic: 2, multiple_active_clinics: 1,
    });
    assert.equal(report.legacySeedIdsPresent, 1);
    assert.equal(report.bootstrapAdmin.accounts, 1);
    assert.equal(report.bootstrapAdmin.activeOwnerMemberships, 1);
    assert.equal(report.bootstrapAdmin.ownedLegacyPatients, 2);
    assert.equal(report.unambiguousOwnerMapping, false);
    assert.equal(report.migrationAuthorized, false);
    const serialized = JSON.stringify(report);
    for (const forbidden of ["SENSITIVE-", "synthetic.invalid", "private-patient-", "unknown-user"]) assert.equal(serialized.includes(forbidden), false);
    assert.ok(f.queries.every((sql) => /^SELECT\s/i.test(sql)));
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM patients_demo").get().n, 8);
  } finally { f.db.close(); }
});

test("missing legacy tables are unavailable rather than reported as zero", async () => {
  const f = fixture();
  try {
    const report = await collectLegacyTenantCensus(f.query);
    assert.deepEqual(report.tables.external_import_batches, { available: false, rows: null });
    assert.equal(report.bootstrapAdmin.configured, false);
    assert.equal(report.unambiguousOwnerMapping, false);
  } finally { f.db.close(); }
});

test("query errors and invalid counts cannot certify a successful census", async () => {
  const f = fixture();
  try {
    await assert.rejects(collectLegacyTenantCensus(async (sql, params) => {
      if (sql.includes("COUNT(*) AS total FROM patients_demo")) throw new Error("synthetic query unavailable");
      return f.query(sql, params);
    }), /synthetic query unavailable/);
    await assert.rejects(collectLegacyTenantCensus(async (sql, params) => {
      if (sql.includes("COUNT(*) AS total FROM patients_demo")) return [{ total: -1 }];
      return f.query(sql, params);
    }), /CENSUS_INVALID_COUNT/);
  } finally { f.db.close(); }
});

test("workflow grants production credentials only to trusted main, and output excludes arbitrary errors", () => {
  const workflow = readFileSync(".github/workflows/legacy-tenant-census.yml", "utf8");
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /needs: contract/);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /pull_request_target|contents: write/);
  const script = readFileSync("scripts/audits/legacy-tenant-census.mjs", "utf8");
  assert.doesNotMatch(script, /console\.(log|error)\((error|response|data|token|account)/);
});


test("additional patients do not multiply distinct owner migration cases", async () => {
  const f = fixture();
  try {
    f.db.exec("PRAGMA query_only = OFF");
    for (const [id, owner] of [["extra-one", "unique"], ["extra-two", "unique"], ["extra-three", "multiple"]]) {
      f.db.prepare("INSERT INTO patients_demo (id, owner_user_id, name) VALUES (?, ?, 'SENSITIVE-EXTRA')").run(id, owner);
    }
    f.db.exec("PRAGMA query_only = ON");
    const report = await collectLegacyTenantCensus(f.query);
    assert.equal(report.patientOwnership.one_active_clinic, 4);
    assert.equal(report.patientOwnership.multiple_active_clinics, 2);
    assert.deepEqual(report.distinctOwners, {
      total: 6, no_active_clinic: 3, one_active_clinic: 2, multiple_active_clinics: 1,
    });
  } finally { f.db.close(); }
});

// S9: these are synthetic rows on the real base schema + migration 0009,
// not a production census or a complete migration/restore rehearsal.
const dependencyClasses = [
  "no_patient", "missing_patient", "no_owner", "missing_owner", "inactive_owner",
  "no_active_clinic", "one_active_clinic", "multiple_active_clinics",
];
const zeroDependencies = () => Object.fromEntries(dependencyClasses.map((key) => [key, 0]));

for (const table of ["consultations_demo", "scale_results_demo", "documents_demo"]) {
  test(`${table}: count dependency ownership and orphans without reading clinical payloads`, async () => {
    const f = fixture();
    try {
      f.db.exec("PRAGMA query_only = OFF");
      const patientIds = f.db.prepare("SELECT id FROM patients_demo ORDER BY id").all().map((row) => row.id);
      patientIds.push("SENSITIVE-MISSING-PATIENT", "");
      for (const patientId of patientIds) {
        if (table === "consultations_demo") {
          f.db.prepare("INSERT INTO consultations_demo (patient_id, subjective) VALUES (?, 'SENSITIVE-CONSULTATION')").run(patientId);
        } else if (table === "scale_results_demo") {
          f.db.prepare("INSERT INTO scale_results_demo (patient_id, scale_id, scale_name, details) VALUES (?, 'SENSITIVE-SCALE', 'SENSITIVE-SCALE', 'SENSITIVE-ANSWERS')").run(patientId);
        } else {
          f.db.prepare("INSERT INTO documents_demo (patient_id, type, title, content) VALUES (?, 'laudo', 'SENSITIVE-TITLE', 'SENSITIVE-DOCUMENT')").run(patientId);
        }
      }
      f.db.exec("PRAGMA query_only = ON");
      const report = await collectLegacyTenantCensus(f.query);
      assert.ok(report.patientDependencies, "patient totals alone do not describe dependent record ownership");
      assert.deepEqual(report.patientDependencies.tables[table], {
        available: true, rows: 10, requiresMappingReview: 8,
        byPatientOwnership: {
          no_patient: 0, missing_patient: 2, no_owner: 1, missing_owner: 1,
          inactive_owner: 1, no_active_clinic: 2, one_active_clinic: 2, multiple_active_clinics: 1,
        },
      });
      assert.equal(report.patientDependencies.snapshotAtomic, false);
      assert.equal(report.migrationAuthorized, false);
      const serialized = JSON.stringify(report);
      for (const forbidden of ["SENSITIVE-", "synthetic.invalid", "private-patient-", "unknown-user"]) {
        assert.equal(serialized.includes(forbidden), false);
      }
      assert.ok(f.queries.every((sql) => /^SELECT\s/i.test(sql) && !sql.includes(";")));
      assert.equal(f.db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n, 10);
    } finally { f.db.close(); }
  });
}

test("uniquely mapped patients do not conceal orphan documents or authorize migration", async () => {
  const f = fixture();
  try {
    f.db.exec("PRAGMA query_only = OFF");
    f.db.exec("DELETE FROM patients_demo WHERE owner_user_id IS NULL OR owner_user_id <> 'unique'");
    f.db.exec("INSERT INTO documents_demo (patient_id, type, title) VALUES ('SENSITIVE-ORPHAN', 'laudo', 'SENSITIVE-TITLE')");
    f.db.exec("PRAGMA query_only = ON");
    const report = await collectLegacyTenantCensus(f.query);
    assert.equal(report.unambiguousOwnerMapping, true, "the pre-existing flag describes patients only");
    assert.ok(report.patientDependencies, "the orphan document needs its own explicit evidence");
    assert.equal(report.patientDependencies.tables.documents_demo.byPatientOwnership.missing_patient, 1);
    assert.equal(report.patientDependencies.tables.documents_demo.requiresMappingReview, 1);
    assert.equal(report.migrationAuthorized, false);
  } finally { f.db.close(); }
});

test("absent dependency tables remain unknown; observed empty tables are genuinely zero", async () => {
  const f = fixture();
  try {
    const report = await collectLegacyTenantCensus(f.query);
    assert.ok(report.patientDependencies);
    assert.equal(report.patientDependencies.coverageComplete, false);
    assert.deepEqual(report.patientDependencies.tables.clinical_memory_notes_demo, {
      available: false, rows: null, requiresMappingReview: null, byPatientOwnership: null,
    });
    assert.deepEqual(report.patientDependencies.tables.documents_demo, {
      available: true, rows: 0, requiresMappingReview: 0, byPatientOwnership: zeroDependencies(),
    });
    assert.equal(Object.keys(report.patientDependencies.tables).length, 6);
    assert.equal(Object.hasOwn(report.patientDependencies.tables, "external_import_batches"), false);
  } finally { f.db.close(); }
});

test("invalid, repeated and unknown dependency buckets fail closed instead of manufacturing a census", async () => {
  const f = fixture();
  try {
    for (const [rows, expected] of [
      [[{ ownership_class: "missing_patient", total: -1 }], /CENSUS_INVALID_COUNT/],
      [[{ ownership_class: "missing_patient", total: "0" }], /CENSUS_INVALID_COUNT/],
      [[{ ownership_class: "untrusted", total: 0 }], /CENSUS_INVALID_CLASS/],
      [[{ ownership_class: "missing_patient", total: 0 }, { ownership_class: "missing_patient", total: 0 }], /CENSUS_INVALID_CLASS/],
    ]) {
      await assert.rejects(collectLegacyTenantCensus(async (sql, params) => {
        if (sql.includes("FROM scale_results_demo d")) return rows;
        return f.query(sql, params);
      }), expected);
    }
  } finally { f.db.close(); }
});

test("a dependency arriving after its count invalidates the observation, not the data", async () => {
  const f = fixture();
  let injected = false;
  try {
    await assert.rejects(collectLegacyTenantCensus(async (sql, params) => {
      if (!injected && sql.includes("FROM scale_results_demo d")) {
        injected = true;
        f.db.exec("PRAGMA query_only = OFF");
        f.db.exec("INSERT INTO scale_results_demo (patient_id, scale_id, scale_name) VALUES ('SENSITIVE-LATE', 'synthetic', 'synthetic')");
        f.db.exec("PRAGMA query_only = ON");
      }
      return f.query(sql, params);
    }), /CENSUS_CHANGED_DURING_READ/);
    assert.equal(injected, true);
    assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM scale_results_demo").get().n, 1);
  } finally { f.db.close(); }
});

test("nullable historical dependency projection distinguishes missing reference from missing patient", async () => {
  const f = fixture();
  try {
    f.db.exec("PRAGMA query_only = OFF");
    // Deliberately a synthetic historical projection, not the full current DDL.
    f.db.exec("CREATE TABLE clinical_memory_notes_demo (id TEXT PRIMARY KEY, patient_id TEXT, content TEXT)");
    f.db.exec("INSERT INTO clinical_memory_notes_demo VALUES ('synthetic-null', NULL, 'SENSITIVE-NOTE')");
    f.db.exec("PRAGMA query_only = ON");
    const report = await collectLegacyTenantCensus(f.query);
    assert.ok(report.patientDependencies);
    assert.equal(report.patientDependencies.tables.clinical_memory_notes_demo.byPatientOwnership.no_patient, 1);
    assert.equal(report.patientDependencies.tables.clinical_memory_notes_demo.byPatientOwnership.missing_patient, 0);
    assert.equal(JSON.stringify(report).includes("SENSITIVE-"), false);
  } finally { f.db.close(); }
});

test("incompatible dependency schema is an error, not an empty or successful mapping", async () => {
  const f = fixture();
  try {
    f.db.exec("PRAGMA query_only = OFF");
    f.db.exec("CREATE TABLE clinical_memory_notes_demo (id TEXT PRIMARY KEY)");
    f.db.exec("PRAGMA query_only = ON");
    await assert.rejects(collectLegacyTenantCensus(f.query), /no such column/);
  } finally { f.db.close(); }
});

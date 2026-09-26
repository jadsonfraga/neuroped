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

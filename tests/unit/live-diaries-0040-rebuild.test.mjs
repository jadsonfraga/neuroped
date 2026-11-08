// Migração 0040: reconstrói live_diary_entries para incluir o diário de
// crises e o calendário de cefaleia no CHECK, SEM perder linhas, status ou
// cadeia de correção já gravados em produção pela 0039. Dados sintéticos.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import Database from "better-sqlite3";

const read = (p) => readFileSync(p, "utf8");
const migrations = readdirSync("db/migrations").filter((n) => n.endsWith(".sql")).sort();
const upTo = migrations.filter((n) => n < "0040");
assert.ok(migrations.includes("0040_live_diary_entries_epilepsy_headache.sql"));

const db = new Database(":memory:");
db.pragma("foreign_keys = OFF");
db.exec(read("db/schema.d1.sql"));
for (const name of upTo) {
  try { db.exec(read(`db/migrations/${name}`)); } catch (error) {
    assert.match(error.message, /duplicate column name/i, `${name}: ${error.message}`);
  }
}
// Produção roda com FK ligada: os dados e a 0040 precisam passar assim.
db.pragma("foreign_keys = ON");

db.prepare("INSERT INTO users (id, name, email, role, is_active) VALUES ('u1','Fictício','u1@example.test','professional',1)").run();
db.prepare("INSERT INTO clinics (id, slug, name, created_by_user_id) VALUES ('c1','clinica-ficticia','Clínica Fictícia','u1')").run();
db.prepare("INSERT INTO live_patients (id, clinic_id, created_by_user_id, profile_encrypted) VALUES ('p1','c1','u1','cifrado')").run();
const ins = db.prepare(`INSERT INTO live_diary_entries
  (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version, supersedes_entry_id, created_at)
  VALUES (?, 'c1', 'p1', 'u1', 'diario-sono', ?, 'family', ?, 'v1', ?, ?)`);
ins.run("a", "2026-11-01", "cifra-a", null, "2026-11-01 10:00:00");
ins.run("b", "2026-11-01", "cifra-b", "a", "2026-11-01 11:00:00");
db.prepare("UPDATE live_diary_entries SET status = 'corrected' WHERE id = 'a'").run();
ins.run("c", "2026-11-02", "cifra-c", null, "2026-11-02 09:00:00");
db.prepare("UPDATE live_diary_entries SET status = 'voided' WHERE id = 'c'").run();
// o CHECK antigo recusa os diários novos
assert.throws(
  () => db.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version) VALUES ('y','c1','p1','u1','diario-epilepsia','2026-11-03','family','c','v1')").run(),
  /CHECK/,
);

const before = db.prepare("SELECT * FROM live_diary_entries ORDER BY id").all();
db.exec(read("db/migrations/0040_live_diary_entries_epilepsy_headache.sql"));
const after = db.prepare("SELECT * FROM live_diary_entries ORDER BY id").all();

assert.deepEqual(after, before, "todas as linhas, status, cifra e cadeia de correção preservados");
assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), [], "nenhuma FK quebrada");
const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='live_diary_entries'").get().sql;
assert.match(sql, /REFERENCES "?live_diary_entries"?\(id\)/, "auto-referência aponta para o nome final");
assert.doesNotMatch(sql, /live_diary_entries_new/);
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name = 'live_diary_entries_new'").get().n, 0);
const triggers = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='live_diary_entries' ORDER BY name").all().map((r) => r.name);
assert.deepEqual(triggers, [
  "trg_live_diary_entries_core_immutable",
  "trg_live_diary_entries_status_flow",
  "trg_live_diary_entries_supersedes_tenant",
  "trg_live_diary_entries_tenant_patient",
]);
const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='live_diary_entries' AND name LIKE 'idx_%' ORDER BY name").all().map((r) => r.name);
assert.deepEqual(indexes, ["idx_live_diary_entries_one_successor", "idx_live_diary_entries_patient"]);

// diários novos aceitos; gatilhos seguem valendo
db.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version) VALUES ('e1','c1','p1','u1','diario-epilepsia','2026-11-03','family','c','v1')").run();
db.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version) VALUES ('h1','c1','p1','u1','calendario-cefaleia','2026-11-03','patient','c','v1')").run();
assert.throws(() => db.prepare("UPDATE live_diary_entries SET payload_encrypted = 'x' WHERE id = 'e1'").run(), /LIVE_DIARY_ENTRY_IMMUTABLE/);
assert.throws(() => db.prepare("UPDATE live_diary_entries SET status = 'active' WHERE id = 'a'").run(), /LIVE_DIARY_STATUS_TRANSITION/);
assert.throws(() => db.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version, supersedes_entry_id) VALUES ('z','c1','p1','u1','diario-epilepsia','2026-11-03','family','c','v1','b')").run(), /LIVE_DIARY_SUPERSESSION_MISMATCH/);
assert.throws(() => db.prepare("INSERT INTO live_diary_entries (id, clinic_id, patient_id, author_user_id, diary_id, entry_date, reported_by, payload_encrypted, encryption_version, supersedes_entry_id) VALUES ('w','c1','p1','u1','diario-sono','2026-11-03','family','c','v1','a')").run(), /UNIQUE/, "um sucessor por registro");
// apagar o paciente leva os diários (cascata), como antes
db.prepare("DELETE FROM live_patients WHERE id = 'p1'").run();
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM live_diary_entries").get().n, 0);

console.log("✓ 0040: reconstrução preserva linhas, status e correções; diários de crises e cefaleia aceitos; gatilhos e índices intactos");

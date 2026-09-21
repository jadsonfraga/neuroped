import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { getCommercialLicenseSnapshot } from "../../functions/api/commercial/_core";
import { requireCommercialFeature } from "../../functions/api/commercial/_guard";
import { onRequestGet as getMe } from "../../functions/api/commercial/me";
import { onRequestGet as getMaterials } from "../../functions/api/commercial/materials/index";
import { onRequestGet as getUsers, onRequestPost as grantUser, onRequestDelete as revokeUser } from "../../functions/api/commercial/users";

let assertions = 0;
function check(value: unknown, message: string) { assert.ok(value, message); assertions++; }
type BindValue = string | number | null;

/** Adaptador de transporte D1 sobre SQLite real: nenhum resultado SQL é simulado. */
class Statement {
  values: BindValue[] = [];
  constructor(readonly owner: SQLiteD1, readonly sql: string) {}
  bind(...values: BindValue[]) { this.values = values; return this; }
  async first<T>() {
    const row = this.owner.raw.prepare(this.sql).get(...this.values) ?? null;
    if (/COUNT\(\*\) AS total\s+FROM commercial_license_users/.test(this.sql)) {
      this.owner.seatReads.push(Number(row?.total));
      await this.owner.afterSeatRead?.();
    }
    return row as T | null;
  }
  async all<T>() { return { success: true, results: this.owner.raw.prepare(this.sql).all(...this.values) as T[] }; }
  runSync() {
    const result = this.owner.raw.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes) }, results: [] };
  }
  async run() { return this.runSync(); }
}
class SQLiteD1 {
  readonly raw = new DatabaseSync(":memory:");
  seatReads: number[] = [];
  afterSeatRead: (() => Promise<void>) | null = null;
  prepare(sql: string) { return new Statement(this, sql); }
  async batch(statements: Statement[]) {
    this.raw.exec("BEGIN IMMEDIATE");
    try {
      const results = statements.map((statement) => statement.runSync());
      this.raw.exec("COMMIT");
      return results;
    } catch (error) {
      this.raw.exec("ROLLBACK");
      throw error;
    }
  }
  asD1() { return this as unknown as D1Database; }
}

const forwardMigration = readFileSync("db/migrations/0027_saas_commercial_seat_integrity.sql", "utf8");
function fixture() {
  const db = new SQLiteD1();
  db.raw.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT);
    CREATE TABLE clinics (id TEXT PRIMARY KEY, name TEXT, slug TEXT, status TEXT);
    CREATE TABLE clinic_memberships (
      clinic_id TEXT REFERENCES clinics(id), user_id TEXT REFERENCES users(id),
      role TEXT, active INTEGER, PRIMARY KEY(clinic_id, user_id)
    );
    CREATE TABLE saas_audit_log (
      id TEXT PRIMARY KEY, clinic_id TEXT, actor_user_id TEXT, action TEXT,
      target_type TEXT, target_id TEXT, metadata_json TEXT
    );
    INSERT INTO users VALUES ('owner','Synthetic owner','owner@invalid.example'),
      ('pro','Synthetic professional','pro@invalid.example'), ('outside','Synthetic outsider','outside@invalid.example');
    INSERT INTO clinics VALUES ('a','Synthetic A','a','active'), ('b','Synthetic B','b','active');
    INSERT INTO clinic_memberships VALUES ('a','owner','owner',1), ('a','pro','professional',1), ('b','owner','owner',1);
  `);
  db.raw.exec(readFileSync("db/migrations/0026_saas_commercial_catalog.sql", "utf8"));
  db.raw.exec(forwardMigration);
  db.raw.exec(forwardMigration); // Reaplicação idempotente, sem apagar dados.
  db.raw.exec(`
    INSERT INTO commercial_licenses
      (id,clinic_id,offer_id,unit_label,contract_version,billing_reference,created_by_user_id)
      VALUES ('lic-a','a','commercial-institutional-pilot-1-0','Synthetic A','institutional-pilot-terms-v1','synthetic-bill','owner');
    INSERT INTO commercial_license_acceptances
      (license_id,accepted_by_user_id,terms_version,no_patient_data_accepted,no_medical_service_accepted,no_redistribution_accepted)
      VALUES ('lic-a','owner','institutional-pilot-terms-v1',1,1,1);
    INSERT INTO commercial_license_users (license_id,user_id,authorized_by_user_id)
      VALUES ('lic-a','owner','owner'), ('lic-a','pro','owner');
    UPDATE commercial_licenses SET status='active', activated_at='2020-01-01T00:00:00Z', expires_at='2099-01-01T00:00:00Z' WHERE id='lic-a';
  `);
  return db;
}
function context(db: SQLiteD1, path: string, userId = "owner", method = "GET", body?: object) {
  return {
    env: { DB: db.asD1() },
    request: new Request(`https://synthetic.invalid${path}`, {
      method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }),
    data: { authUser: { id: userId, role: "professional", name: "Synthetic", email: `${userId}@invalid.example` } },
    params: {},
  } as unknown as Parameters<typeof getMe>[0];
}
async function expectHTTP(response: Response | Promise<Response>, status: number, code?: string) {
  const actual = await response;
  check(actual.status === status, `HTTP ${actual.status}, esperado ${status}`);
  const body = await actual.json() as Record<string, unknown>;
  if (code) check(body.code === code, `código ${String(body.code)}, esperado ${code}`);
  return body;
}
function count(db: SQLiteD1, table: string, where = "1=1") {
  // table/where são literais internos do teste, nunca entrada HTTP.
  return Number(db.raw.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`).get()?.n);
}
function rejectsSQL(db: SQLiteD1, sql: string, pattern: RegExp) {
  assert.throws(() => db.raw.exec(sql), pattern); assertions++;
}

// Leitura persistida -> handlers reais -> status HTTP: não basta testar um objeto manual.
{
  const db = fixture();
  for (const version of ["another-v9", ""]) {
    db.raw.prepare("UPDATE commercial_licenses SET contract_version=? WHERE id='lic-a'").run(version);
    const snapshot = await getCommercialLicenseSnapshot(db.asD1(), "a");
    check(snapshot !== null && snapshot.contractState === "drift", "drift persistido nunca desaparece como null");
    check(snapshot?.contractVersion === version, "versão persistida não é normalizada");
    await expectHTTP(getMe(context(db, "/api/commercial/me?clinicId=a")), 409, "COMMERCIAL_OFFER_UNKNOWN");
    await expectHTTP(getMaterials(context(db, "/api/commercial/materials?clinicId=a")), 409, "COMMERCIAL_OFFER_UNKNOWN");
    await expectHTTP(getUsers(context(db, "/api/commercial/users?clinicId=a")), 409, "COMMERCIAL_OFFER_UNKNOWN");
    await expectHTTP(grantUser(context(db, "/api/commercial/users", "owner", "POST", { clinicId: "a", userId: "pro" })), 409, "COMMERCIAL_OFFER_UNKNOWN");
    await expectHTTP(revokeUser(context(db, "/api/commercial/users?clinicId=a&userId=pro", "owner", "DELETE")), 409, "COMMERCIAL_OFFER_UNKNOWN");
    const guard = await requireCommercialFeature(context(db, "/api/commercial/materials/form.change_log?clinicId=a"), "form.change_log", "a");
    check(!guard.ok, "guard recusa drift lido do banco");
    if (!guard.ok) await expectHTTP(guard.response, 409, "COMMERCIAL_OFFER_UNKNOWN");
    await expectHTTP(getMe(context(db, "/api/commercial/me?clinicId=a", "outside")), 403, "TENANT_FORBIDDEN");
  }
  check(count(db, "commercial_license_users", "status='active'") === 2, "drift não muda assentos");
  check(count(db, "commercial_usage_events") === 0 && count(db, "saas_audit_log") === 0, "drift não deixa efeitos");
  db.raw.exec("UPDATE commercial_licenses SET contract_version='institutional-pilot-terms-v1'; UPDATE commercial_offers SET code='unknown-offer' WHERE id='commercial-institutional-pilot-1-0';");
  await expectHTTP(getMe(context(db, "/api/commercial/me?clinicId=a")), 409, "COMMERCIAL_OFFER_UNKNOWN");
  check(await getCommercialLicenseSnapshot(db.asD1(), "b") === null, "ausência verdadeira continua null");
  const missing = await expectHTTP(getMe(context(db, "/api/commercial/me?clinicId=b")), 200);
  check(missing.license === null, "snapshot sem licença não inventa contrato");
  db.raw.close();
}

// Dois requests observam explicitamente COUNT=2 antes de disputar a escrita.
{
  const db = fixture();
  let arrivals = 0;
  let release: () => void = () => {};
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  db.afterSeatRead = async () => { if (++arrivals === 2) release(); await barrier; };
  const responses = await Promise.all([
    revokeUser(context(db, "/api/commercial/users?clinicId=a&userId=owner", "owner", "DELETE")),
    revokeUser(context(db, "/api/commercial/users?clinicId=a&userId=pro", "owner", "DELETE")),
  ]);
  assert.deepEqual(db.seatReads, [2, 2]); assertions++;
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]); assertions++;
  const rejected = responses.find((response) => response.status === 409);
  check(Boolean(rejected), "uma revogação perde a disputa");
  if (rejected) await expectHTTP(rejected, 409, "COMMERCIAL_LAST_AUTHORIZED_USER");
  check(count(db, "commercial_license_users", "status='active'") === 1, "último assento preservado atomicamente");
  check(count(db, "commercial_usage_events", "kind='authorized_user_revoked'") === 1, "somente a revogação efetiva entra no ledger");
  check(count(db, "saas_audit_log", "action='commercial_authorized_user_revoked'") === 1, "somente a revogação efetiva é auditada");
  rejectsSQL(db, "DELETE FROM commercial_license_users WHERE status='active'", /COMMERCIAL_LAST_AUTHORIZED_USER/);
  db.raw.close();
}

// SQL direto e statements multilinha não contornam a regra; ABORT desfaz a instrução.
{
  const db = fixture();
  rejectsSQL(db, "UPDATE commercial_license_users SET status='revoked'", /COMMERCIAL_LAST_AUTHORIZED_USER/);
  check(count(db, "commercial_license_users", "status='active'") === 2, "update coletivo falho restaura as duas linhas");
  rejectsSQL(db, "DELETE FROM commercial_license_users", /COMMERCIAL_LAST_AUTHORIZED_USER/);
  check(count(db, "commercial_license_users") === 2, "delete coletivo falho restaura as duas linhas");
  rejectsSQL(db, "UPDATE commercial_license_users SET user_id='outside' WHERE user_id='pro'", /COMMERCIAL_SEAT_IDENTITY_IMMUTABLE/);
  rejectsSQL(db, "UPDATE commercial_license_users SET license_id='other' WHERE user_id='pro'", /COMMERCIAL_SEAT_IDENTITY_IMMUTABLE/);
  db.raw.exec("UPDATE commercial_licenses SET status='suspended'; UPDATE commercial_license_users SET status='revoked';");
  check(count(db, "commercial_license_users", "status='active'") === 0, "licença suspensa permite encerrar assentos");
  rejectsSQL(db, "UPDATE commercial_licenses SET status='active'", /authorized user required/);
  db.raw.close();
}

// Falha do ledger aborta também o assento: jamais sucesso parcial da transação.
{
  const db = fixture();
  db.raw.exec("CREATE TRIGGER synthetic_ledger_failure BEFORE INSERT ON commercial_usage_events BEGIN SELECT RAISE(ABORT, 'synthetic ledger failure'); END;");
  await expectHTTP(revokeUser(context(db, "/api/commercial/users?clinicId=a&userId=pro", "owner", "DELETE")), 409, "COMMERCIAL_REVOKE_FAILED");
  check(count(db, "commercial_license_users", "status='active'") === 2, "ledger falhou: assento não foi revogado");
  check(count(db, "commercial_usage_events") === 0 && count(db, "saas_audit_log") === 0, "rollback não deixa evento órfão");
  db.raw.close();
}

// Catálogo distingue superfície pública de material institucional licenciado.
{
  const db = fixture();
  const body = await expectHTTP(getMaterials(context(db, "/api/commercial/materials?clinicId=a")), 200);
  const materials = body.materials as Array<{ code: string; surface: string; licensed: boolean; deniedReason: string | null }>;
  check(materials.length === 5, "cinco entradas preservadas no catálogo");
  check(materials.filter((material) => material.licensed).length === 4, "exatamente quatro materiais institucionalmente licenciados");
  const intake = materials.find((material) => material.code === "form.preconsultation");
  check(intake?.surface === "public-intake" && !intake.licensed && intake.deniedReason === null, "pré-consulta pública não recebe cadeado/licença fictícia");
  await expectHTTP(revokeUser(context(db, "/api/commercial/users?clinicId=a&userId=missing", "owner", "DELETE")), 404, "COMMERCIAL_SEAT_NOT_FOUND");
  check(count(db, "commercial_usage_events") === 0, "revogar inexistente não inventa evento");
  db.raw.close();
}
console.log(`✅ Integridade comercial: ${assertions} asserções; handlers reais, SQLite, concorrência, rollback e fronteira pública.`);

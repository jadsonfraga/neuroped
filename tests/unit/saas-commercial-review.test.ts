import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequest as middleware } from "../../functions/api/_middleware";
import { onRequestGet as catalog } from "../../functions/api/commercial/catalog";
import { onRequestGet as openMaterial, onRequestPost as exportMaterial } from "../../functions/api/commercial/materials/[code]";
import { onRequestGet as getSeats, onRequestPost as grantSeat, onRequestDelete as revokeSeat } from "../../functions/api/commercial/users";
import { executeCommercialExport } from "../../client/src/lib/commercialExport";
import { resolveCommercialScope } from "../../client/src/lib/commercialScope";
import { buildCommercialTemplate } from "../../shared/commercialTemplates";
import { commercialFeatureCodes } from "../../shared/commercial";

let assertions = 0;
function check(value: unknown, message: string) { assert.ok(value, message); assertions++; }
type Value = string | number | null;
class Statement {
  values: Value[] = [];
  constructor(readonly db: SQLiteD1, readonly sql: string) {}
  bind(...values: Value[]) { this.values = values; return this; }
  async first<T>() { return (this.db.raw.prepare(this.sql).get(...this.values) ?? null) as T | null; }
  async all<T>() { return { success: true, results: this.db.raw.prepare(this.sql).all(...this.values) as T[] }; }
  runSync() { const result = this.db.raw.prepare(this.sql).run(...this.values); return { success: true, results: [], meta: { changes: Number(result.changes) } }; }
  async run() { return this.runSync(); }
}
class SQLiteD1 {
  raw = new DatabaseSync(":memory:");
  beforeBatch: (() => void) | null = null;
  prepare(sql: string) { return new Statement(this, sql); }
  async batch(statements: Statement[]) {
    const hook = this.beforeBatch; this.beforeBatch = null; hook?.();
    this.raw.exec("BEGIN IMMEDIATE");
    try { const result = statements.map((statement) => statement.runSync()); this.raw.exec("COMMIT"); return result; }
    catch (error) { this.raw.exec("ROLLBACK"); throw error; }
  }
  asD1() { return this as unknown as D1Database; }
}
function fixture() {
  const db = new SQLiteD1();
  db.raw.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE users(id TEXT PRIMARY KEY,name TEXT,email TEXT);
    CREATE TABLE clinics(id TEXT PRIMARY KEY,name TEXT,slug TEXT,status TEXT);
    CREATE TABLE clinic_memberships(clinic_id TEXT,user_id TEXT,role TEXT,active INTEGER,PRIMARY KEY(clinic_id,user_id));
    CREATE TABLE saas_audit_log(id TEXT PRIMARY KEY,clinic_id TEXT,actor_user_id TEXT,action TEXT,target_type TEXT,target_id TEXT,metadata_json TEXT);
    INSERT INTO users VALUES('owner','Synthetic owner','owner@invalid.example'),('pro','Synthetic pro','pro@invalid.example');
    INSERT INTO clinics VALUES('a','Synthetic A','a','active');
    INSERT INTO clinic_memberships VALUES('a','owner','owner',1),('a','pro','professional',1);`);
  for (const migration of ["0026_saas_commercial_catalog", "0027_saas_commercial_seat_integrity", "0028_saas_commercial_final_authorization"]) {
    const sql = readFileSync(`db/migrations/${migration}.sql`, "utf8");
    db.raw.exec(sql); db.raw.exec(sql);
  }
  db.raw.exec(`INSERT INTO commercial_licenses(id,clinic_id,offer_id,unit_label,contract_version,billing_reference,created_by_user_id)
    VALUES('lic','a','commercial-institutional-pilot-1-0','Synthetic A','institutional-pilot-terms-v1','synthetic-bill','owner');
    INSERT INTO commercial_license_acceptances(license_id,accepted_by_user_id,terms_version,no_patient_data_accepted,no_medical_service_accepted,no_redistribution_accepted)
    VALUES('lic','owner','institutional-pilot-terms-v1',1,1,1);
    INSERT INTO commercial_license_users(license_id,user_id,authorized_by_user_id) VALUES('lic','owner','owner'),('lic','pro','owner');
    UPDATE commercial_licenses SET status='active',activated_at='2020-01-01T00:00:00Z',expires_at='2099-01-01T00:00:00Z';`);
  return db;
}
function context(db: SQLiteD1, path: string, method = "GET", body?: object) {
  return {
    env: { DB: db.asD1() }, params: { code: "form.approved_plan" },
    data: { authUser: { id: "owner", role: "professional", name: "Synthetic", email: "owner@invalid.example" } },
    request: new Request(`https://synthetic.invalid${path}`, { method, ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) }),
  } as unknown as Parameters<typeof openMaterial>[0];
}
async function expectHTTP(response: Response | Promise<Response>, status: number, code?: string) {
  const actual = await response;
  check(actual.status === status, `HTTP ${actual.status}, esperado ${status}`);
  const body = await actual.json() as Record<string, unknown>;
  if (code) check(body.code === code, `código ${String(body.code)}, esperado ${code}`);
  return body;
}
function count(db: SQLiteD1, table: string) { return Number(db.raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()?.n); }

// Middleware REAL: catálogo anônimo, sem DB/JWT, sem abrir o namespace comercial.
{
  const db = fixture();
  for (const binding of [undefined, db.asD1()]) {
    let reached = false;
    const base = {
      env: { DB: binding, ENVIRONMENT: "production", NEUROPED_JWT_SECRET: "s".repeat(40) }, data: {},
      request: new Request("https://synthetic.invalid/api/commercial/catalog"),
      next: async () => { reached = true; return catalog({} as Parameters<typeof catalog>[0]); },
      waitUntil: () => undefined,
    } as unknown as Parameters<typeof middleware>[0];
    const body = await expectHTTP(middleware(base), 200);
    check(reached && Array.isArray(body.offers), "catálogo público alcança handler sem sessão");
    for (const path of ["me", "users", "materials", "catalog/private"]) {
      reached = false;
      await expectHTTP(middleware({ ...base, request: new Request(`https://synthetic.invalid/api/commercial/${path}`) }), binding ? 401 : 503, binding ? "UNAUTHENTICATED" : "DB_REQUIRED");
      check(!reached, `/${path} continua protegido`);
    }
  }
  db.raw.close();
}

// Revogação entre preflight e INSERT: handlers não confirmam acesso obsoleto.
for (const mutate of [
  "UPDATE clinic_memberships SET active=0 WHERE user_id='owner'",
  "DELETE FROM clinic_memberships WHERE user_id='owner'",
  "UPDATE clinics SET status='suspended'",
  "UPDATE commercial_licenses SET expires_at='2000-01-01T00:00:00Z'",
]) {
  for (const method of ["GET", "POST"]) {
    const db = fixture();
    db.beforeBatch = () => db.raw.exec(mutate);
    const ctx = context(db, "/api/commercial/materials/form.approved_plan?clinicId=a", method, method === "POST" ? { channel: "download" } : undefined);
    await expectHTTP(method === "GET" ? openMaterial(ctx) : exportMaterial(ctx), 403, "COMMERCIAL_ACCESS_CHANGED");
    check(count(db, "commercial_usage_events") === 0 && count(db, "saas_audit_log") === 0, "autorização revogada não deixa ledger nem sucesso");
    db.raw.close();
  }
}

// Turnover com 10 assentos: ex-membro visível, revogável e limite recuperável.
{
  const db = fixture();
  for (let i = 0; i < 9; i++) {
    const id = `synthetic-${i}`;
    db.raw.prepare("INSERT INTO users VALUES(?,?,?)").run(id, id, `${id}@invalid.example`);
    db.raw.prepare("INSERT INTO clinic_memberships VALUES('a',?,'professional',1)").run(id);
    if (i < 8) db.raw.prepare("INSERT INTO commercial_license_users(license_id,user_id,authorized_by_user_id) VALUES('lic',?,'owner')").run(id);
  }
  db.raw.exec("UPDATE clinic_memberships SET active=0 WHERE user_id='pro'");
  const listing = await expectHTTP(getSeats(context(db, "/api/commercial/users?clinicId=a")), 200);
  const seats = listing.members as Array<{ userId: string; membershipActive: boolean; authorized: boolean }>;
  check(listing.authorizedUsers === 10, "lista não esconde alocações do COUNT contratual");
  check(seats.some((seat) => seat.userId === "pro" && !seat.membershipActive && seat.authorized), "assento do ex-membro aparece para revogação");
  await expectHTTP(grantSeat(context(db, "/api/commercial/users", "POST", { clinicId: "a", userId: "synthetic-8" })), 409, "COMMERCIAL_AUTHORIZED_USER_LIMIT_REACHED");
  await expectHTTP(grantSeat(context(db, "/api/commercial/users", "POST", { clinicId: "a", userId: "pro" })), 409, "COMMERCIAL_AUTHORIZED_USER_NOT_MEMBER");
  await expectHTTP(revokeSeat(context(db, "/api/commercial/users?clinicId=a&userId=pro", "DELETE")), 200);
  await expectHTTP(grantSeat(context(db, "/api/commercial/users", "POST", { clinicId: "a", userId: "synthetic-8" })), 200);
  db.raw.exec("DELETE FROM clinic_memberships WHERE user_id='synthetic-0'");
  const after = await expectHTTP(getSeats(context(db, "/api/commercial/users?clinicId=a")), 200);
  check(after.authorizedUsers === 10, "rotatividade recupera vaga sem ultrapassar dez");
  check((after.members as typeof seats).some((seat) => seat.userId === "synthetic-0" && !seat.membershipActive && seat.authorized), "vínculo excluído também não esconde assento");
  db.raw.close();
}

// Canais reais e metadados: sem corpo clínico, sem afirmar entrega concluída.
{
  const db = fixture();
  for (const channel of ["print", "email", "copy", "download"]) {
    const body = await expectHTTP(exportMaterial(context(db, "/api/commercial/materials/form.approved_plan?clinicId=a", "POST", { channel })), 200);
    check(body.recorded === true && body.stage === "authorized_initiation", "recibo prova iniciação autorizada, não entrega");
  }
  check(count(db, "commercial_usage_events") === 4, "quatro canais são persistidos");
  await expectHTTP(exportMaterial(context(db, "/api/commercial/materials/form.approved_plan?clinicId=a", "POST", { channel: "download", content: "synthetic forbidden payload" })), 400, "COMMERCIAL_EXPORT_BODY_INVALID");
  check(count(db, "commercial_usage_events") === 4, "conteúdo extra não entra na telemetria");
  db.raw.close();
}

// Executor usado pelos botões: autorização precede ação; erro/troca cancela.
{
  const scope = resolveCommercialScope({ accessMode: "remote", isAuthLoading: false, isAuthenticated: true, userId: "synthetic", clinicId: "a", isClinicLoading: false, clinicError: null });
  const order: string[] = [];
  const base = { scope, feature: "form.approved_plan" as const, channel: "download" as const, isCurrent: () => true,
    record: async () => { order.push("receipt"); return { recorded: true }; }, action: () => { order.push("action"); } };
  await executeCommercialExport(base);
  assert.deepEqual(order, ["receipt", "action"]); assertions++;
  for (const record of [async () => ({ recorded: false }), async () => { throw new Error("denied"); }]) {
    order.length = 0;
    await assert.rejects(executeCommercialExport({ ...base, record })); assertions++;
    check(order.length === 0, "sem recibo não executa ação");
  }
  let current = true;
  order.length = 0;
  await assert.rejects(executeCommercialExport({ ...base, isCurrent: () => current, record: async () => { current = false; return { recorded: true }; } })); assertions++;
  check(order.length === 0, "troca de contexto durante resposta cancela ação");
  for (const unavailable of [{ kind: "loading" as const }, { kind: "unavailable" as const, error: "missing", code: "missing" }]) {
    await assert.rejects(executeCommercialExport({ ...base, scope: unavailable })); assertions++;
  }
  await executeCommercialExport({ ...base, scope: { kind: "individual" }, record: async () => { throw new Error("local must not call server"); } });
  check(order.at(-1) === "action", "modo individual explícito não exige ledger institucional");
}
for (const feature of commercialFeatureCodes.filter((code) => code !== "form.preconsultation")) {
  const template = buildCommercialTemplate(feature);
  check(template.fields.length > 0 && template.html.includes("modelo em branco"), "material institucional realmente disponível em branco");
  check(!/<input|<textarea|<script|localStorage|indexedDB/i.test(template.html), "modelo não coleta PHI nem executa script");
}
assert.throws(() => buildCommercialTemplate("form.preconsultation")); assertions++;
const gateSource = readFileSync("client/src/components/CommercialGate.tsx", "utf8");
check(gateSource.includes("CommercialMaterialWorkspace") && gateSource.includes('if (state === "outside-scope") return <>{children}</>'), "superfície comercial separada de telas clínicas locais");
const viewSource = readFileSync("client/src/components/CommercialMaterialView.tsx", "utf8");
for (const channel of ["print", "email", "copy", "download"]) check(viewSource.includes(`perform("${channel}")`), `botão ${channel} usa autorização`);
const hookSource = readFileSync("client/src/hooks/useCommercialExport.ts", "utf8");
check(hookSource.includes("record: recordCommercialMaterialExport"), "cliente de exportação está ligado ao executor usado pela UI");
console.log(`✅ Revisão comercial: ${assertions} asserções; middleware, vínculo final, assentos antigos e quatro canais de exportação.`);

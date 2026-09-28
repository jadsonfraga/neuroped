import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { evaluateEntitlement } from '../../server/lib/billingEntitlement.ts';
import { provisionInstitutionalAgenda } from '../../scripts/operations/provision-institutional-agenda.mjs';
const read=p=>readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
function setup({ triggers = true } = {}) {
  const db=new DatabaseSync(':memory:');
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT, role TEXT, is_active INTEGER); INSERT INTO users VALUES('owner','owner@example.test','admin',1),('e2e','e2e@example.test','reader',1),('other','other@example.test','professional',1)");
  for (const [file,tables] of [
    ['db/migrations/0009_saas_phase1_foundation.sql',['clinics','clinic_memberships','saas_audit_log']],
    ['db/migrations/0012_saas_billing_onboarding.sql',['billing_plans','billing_customers','billing_subscriptions']],
  ]) for (const table of tables) {
    const start=read(file).indexOf(`CREATE TABLE IF NOT EXISTS ${table} (`);
    const source=read(file).slice(start); db.exec(source.slice(0,source.indexOf('\n);')+4));
  }
  db.exec('ALTER TABLE billing_customers ADD COLUMN grace_ends_at DATETIME');
  if (triggers) {
    const lifecycle=read('db/migrations/0014_saas_tenant_lifecycle.sql');
    const start=lifecycle.indexOf('CREATE TABLE IF NOT EXISTS tenant_lifecycle (');
    const ddl=lifecycle.slice(start); db.exec(ddl.slice(0,ddl.indexOf('\n);')+4));
    db.exec("INSERT INTO billing_plans(id,name,slug,price_cents,seat_price_cents) VALUES('saas-professional','Plano de teste','test',9900,9900)");
    for (const [file,name] of [
      ['db/migrations/0015_saas_billing_trial_seats_hardening.sql','trg_clinic_create_billing_trial'],
      ['db/migrations/0014_saas_tenant_lifecycle.sql','trg_clinic_create_tenant_lifecycle'],
      ['db/migrations/0025_membership_role_change_seat_fix.sql','trg_membership_insert_seat_limit'],
    ]) {
      const source=read(file);
      const found=source.match(new RegExp(`CREATE TRIGGER(?: IF NOT EXISTS)? ${name}\\b[\\s\\S]*?\\nEND;`));
      assert.ok(found, `trigger real ausente: ${name}`); db.exec(found[0]);
    }
  }

  let beforeBatch;
  const adapter={query:async(sql,params=[])=>db.prepare(sql).all(...params), batch:async(statements)=>{
    beforeBatch?.(); db.exec('BEGIN');
    try {for(const {sql,params} of statements) db.prepare(sql).all(...params); db.exec('COMMIT');}
    catch(e){db.exec('ROLLBACK');throw e;}
  }};
  return {db,adapter,setBeforeBatch:fn=>{beforeBatch=fn;}};
}
const options={ownerEmail:'OWNER@example.test',e2eEmail:'e2e@example.test',apply:true};
{
 const {db,adapter}=setup();
 const dry=await provisionInstitutionalAgenda(adapter,{...options,apply:false}); assert.equal(dry.status,'ready_to_apply');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM clinics').get().n,0);
 const first=await provisionInstitutionalAgenda(adapter,options); assert.equal(first.status,'configured');
 const second=await provisionInstitutionalAgenda(adapter,options); assert.equal(second.status,'already_configured');
 for (const table of ['clinics','clinic_memberships','billing_customers','saas_audit_log']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,1);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM billing_subscriptions').get().n,0);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM clinic_memberships WHERE user_id IN ('e2e','other')").get().n,0);
 assert.equal(db.prepare('SELECT provider FROM billing_customers').get().provider,'none');
 const liveSql=read('functions/api/billing/_guard.ts').match(/`(SELECT cm\.user_id[\s\S]*?LIMIT 1)`/)[1];
 const clinicId=db.prepare('SELECT id FROM clinics').get().id;
 assert.equal(evaluateEntitlement(db.prepare(liveSql).get('owner',clinicId),'clinical').deniedReason,null);
 assert.equal(evaluateEntitlement(db.prepare(liveSql).get('e2e',clinicId),'clinical').deniedReason,'ENTITLEMENT_NOT_FOUND');
 db.exec("UPDATE clinics SET status='suspended'");
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options),/EXISTING_SETUP_CHANGED/);
 assert.equal(db.prepare('SELECT status FROM clinics').get().status,'suspended'); db.close();
}
for(const patch of [{ownerEmail:'e2e@example.test'},{ownerEmail:'other@example.test'},{ownerEmail:''},{e2eEmail:''}]) {
 const {db,adapter}=setup(); await assert.rejects(()=>provisionInstitutionalAgenda(adapter,{...options,...patch}),/AGENDA_SETUP_/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM clinics').get().n,0); db.close();
}
{
 const {db,adapter,setBeforeBatch}=setup();
 setBeforeBatch(()=>db.exec("UPDATE users SET is_active=0 WHERE id='owner'"));
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options));
 for (const table of ['clinics','clinic_memberships','billing_customers','saas_audit_log']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0); db.close();
}
{
 const {db,adapter}=setup();
 db.exec("CREATE TRIGGER deny_audit BEFORE INSERT ON saas_audit_log BEGIN SELECT RAISE(ABORT,'test rollback'); END");
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options));
 for (const table of ['clinics','clinic_memberships','billing_customers','billing_subscriptions','tenant_lifecycle']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0); db.close();
}
{
 const {db,adapter}=setup();
 db.exec("INSERT INTO clinics(id,slug,name,created_by_user_id) VALUES('prior','prior','Prior','owner')");
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options),/RECONCILIATION/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM clinics').get().n,1); db.close();
}
{
 const {db,adapter}=setup();
 db.exec("INSERT INTO clinics(id,slug,name,created_by_user_id) VALUES('commercial-other','commercial-other','Other synthetic clinic','other')");
 const before={customer:db.prepare("SELECT * FROM billing_customers WHERE clinic_id='commercial-other'").all(),
   subscriptions:db.prepare("SELECT bs.* FROM billing_subscriptions bs JOIN billing_customers bc ON bc.id=bs.customer_id WHERE bc.clinic_id='commercial-other'").all()};
 await provisionInstitutionalAgenda(adapter,options);
 assert.deepEqual(db.prepare("SELECT * FROM billing_customers WHERE clinic_id='commercial-other'").all(),before.customer);
 assert.deepEqual(db.prepare("SELECT bs.* FROM billing_subscriptions bs JOIN billing_customers bc ON bc.id=bs.customer_id WHERE bc.clinic_id='commercial-other'").all(),before.subscriptions);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='trigger'").get().n,3);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM tenant_lifecycle').get().n,2);
 assert.equal(db.prepare("SELECT COUNT(*) n FROM billing_customers WHERE provider='none'").get().n,1); db.close();
}
{
 const {db,adapter}=setup();
 db.exec("CREATE TRIGGER synthetic_external_subscription AFTER INSERT ON billing_subscriptions BEGIN UPDATE billing_subscriptions SET provider_subscription_id='synthetic-external-reference' WHERE id=NEW.id; END");
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options));
 for (const table of ['clinics','clinic_memberships','billing_customers','billing_subscriptions','tenant_lifecycle','saas_audit_log']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0);
 db.close();
}
{
 const {db,adapter}=setup({triggers:false});
 assert.equal((await provisionInstitutionalAgenda(adapter,options)).status,'configured');
 assert.equal(db.prepare('SELECT COUNT(*) n FROM billing_customers').get().n,1);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM billing_subscriptions').get().n,0); db.close();
}
console.log('✓ institutional agenda: real SQLite DDL and production triggers; idempotency, scoped auto-trial reconciliation, commercial isolation and full atomic rollback');

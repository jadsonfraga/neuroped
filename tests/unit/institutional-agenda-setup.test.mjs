import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { evaluateEntitlement } from '../../server/lib/billingEntitlement.ts';
import { provisionInstitutionalAgenda } from '../../scripts/operations/provision-institutional-agenda.mjs';
const read=p=>readFileSync(new URL(`../../${p}`,import.meta.url),'utf8');
function setup() {
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
 for (const table of ['clinics','clinic_memberships','billing_customers']) assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table}`).get().n,0); db.close();
}
{
 const {db,adapter}=setup();
 db.exec("INSERT INTO clinics(id,slug,name,created_by_user_id) VALUES('prior','prior','Prior','owner')");
 await assert.rejects(()=>provisionInstitutionalAgenda(adapter,options),/RECONCILIATION/);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM clinics').get().n,1); db.close();
}
console.log('✓ institutional agenda: actual SQLite schema, idempotency, dry-run, E2E exclusion, ownership guards and atomic rollback');

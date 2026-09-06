import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { onRequestGet, onRequestPost } from "../../functions/api/live/escuta/index";
import { encodeWav } from "../../shared/escuta/core";

// Real handler and SQLite statements; AI is an explicitly named contract fixture.
// This suite tests authorization/fail-closed behavior, not the actual AI service.
const raw = new DatabaseSync(":memory:");
raw.exec(readFileSync("db/schema.d1.sql", "utf8"));
for (const name of readdirSync("db/migrations").filter(n=>/^\d{4}.*\.sql$/.test(n) && !/^000[12]_/.test(n)).sort()) raw.exec(readFileSync(`db/migrations/${name}`, "utf8"));
for (const id of ["u1", "u2"]) raw.prepare("INSERT INTO users(id,name,email,password_hash,role,is_active,must_change_password) VALUES(?,?,?,'non-login-fixture','professional',1,0)").run(id, "Fictício QA", `${id}@escuta.invalid`);
for (const [id, owner] of [["c1", "u1"],["c2", "u2"]]) {
  raw.prepare("INSERT INTO clinics(id,name,slug,created_by_user_id) VALUES(?,?,?,?)").run(id, `Fictícia ${id}`, id, owner);
  raw.prepare("INSERT INTO clinic_memberships(clinic_id,user_id,role,active) VALUES(?,?,'owner',1)").run(id, owner);
}
let failDb = false, calls = 0, failProvider = false, inventSource = false;
const db = { prepare(sql: string) {
  const make = (args: unknown[]) => ({
    async first() { if(failDb) throw new Error("Synthetic DB outage"); return raw.prepare(sql).get(...args as never[]) ?? null; },
    async all() { if(failDb) throw new Error("Synthetic DB outage"); return {success:true,results:raw.prepare(sql).all(...args as never[])}; },
    async run() { if(failDb) throw new Error("Synthetic DB outage"); const result=raw.prepare(sql).run(...args as never[]); return {success:true,meta:{changes:Number(result.changes)}}; },
  });
  return { ...make([]), bind: (...args: unknown[]) => make(args) };
} };
const transcript = "Médico: o diagnóstico ainda está em investigação.";
const fixtureAi = { async run() { calls++; if(failProvider) throw new Error("Synthetic provider failure"); return {response:{sections:[{key:"hipoteses",text:"Quadro em investigação.",quotes:[inventSource?"diagnóstico confirmado":"o diagnóstico ainda está em investigação"],uncertain:true}]}}; } };
const env = {DB:db,CLINICAL_LIVE_ENABLED:"true",CLINICAL_DATA_KEY:"synthetic-clinical-key-abcdefghijklmnopqrstuvwxyz",CLINICAL_INDEX_KEY:"synthetic-index-key-abcdefghijklmnopqrstuvwxyz",ESCUTA_ENABLED:"true",AI:fixtureAi,NEUROPED_E2E_EMAIL:"reserved@escuta.invalid"};
const user = {id:"u1",name:"Fictício QA",email:"u1@escuta.invalid",role:"professional",mustChangePassword:false};
const normal = {clinicId:"c1",action:"generate",transcript,recordingAcknowledged:true};
let count=0;
async function invoke(method: "GET"|"POST", body: unknown = normal, options: {user?:unknown;env?:Record<string,unknown>;query?:string;rawBody?:string;headers?:Record<string,string>} = {}) {
  const request = new Request(`https://escuta.invalid/api/live/escuta?clinicId=${options.query ?? "c1"}`,{method,headers:{"Content-Type":"application/json",...options.headers},body:method==="POST"?(options.rawBody??JSON.stringify(body)):undefined});
  const context = {request,env:{...env,...options.env},data:{authUser:Object.hasOwn(options,"user")?options.user:user}} as unknown as Parameters<typeof onRequestPost>[0];
  return (method==="GET"?onRequestGet:onRequestPost)(context);
}
async function check(name: string, method: "GET"|"POST", status: number, code?:string, body:unknown=normal, options:Parameters<typeof invoke>[2]={}) {
  const before=calls; const response=await invoke(method,body,options); const payload=await response.json() as {code?:string};
  assert.equal(response.status,status,`${name}: status`); if(code)assert.equal(payload.code,code,`${name}: code`);
  if(status>=400 && !["provider fails honestly","invented source rejected"].includes(name))assert.equal(calls,before,`${name}: provider must not be called`);
  count++;console.log(`PASS ${name}`);return payload;
}
for(const method of ["GET","POST"] as const){
  await check(`${method} anonymous`,method,401,"UNAUTHENTICATED",normal,{user:null});
  await check(`${method} missing DB`,method,503,"DB_REQUIRED",normal,{env:{DB:undefined}});
  await check(`${method} foreign tenant`,method,403,"TENANT_FORBIDDEN",{...normal,clinicId:"c2"},{query:"c2"});
  await check(`${method} technical reserved`,method,403,"TENANT_FORBIDDEN",normal,{user:{...user,email:"reserved@escuta.invalid"}});
  await check(`${method} global reader`,method,403,"TENANT_FORBIDDEN",normal,{user:{...user,role:"reader"}});
}
await check("missing clinic","GET",400,"CLINIC_REQUIRED",normal,{query:""});
await check("malformed body","POST",400,"INVALID_JSON",normal,{rawBody:"{"});
await check("null body","POST",400,"INVALID_JSON",null);
await check("oversized body","POST",413,"PAYLOAD_TOO_LARGE",normal,{headers:{"content-length":"4000000"}});
await check("live disabled","POST",503,"CLINICAL_LIVE_DISABLED",normal,{env:{CLINICAL_LIVE_ENABLED:"false"}});
await check("crypto absent","POST",503,"CLINICAL_CRYPTO_NOT_CONFIGURED",normal,{env:{CLINICAL_DATA_KEY:undefined}});
await check("crypto same keys","POST",503,"CLINICAL_CRYPTO_NOT_CONFIGURED",normal,{env:{CLINICAL_INDEX_KEY:env.CLINICAL_DATA_KEY}});
await check("AI binding absent","POST",503,"ESCUTA_NOT_CONFIGURED",normal,{env:{AI:undefined}});
await check("recording acknowledgment absent","POST",400,"RECORDING_ACK_REQUIRED",{...normal,recordingAcknowledged:false});
await check("silent WAV","POST",422,"NO_SPEECH",{...normal,action:"transcribe",audio:Buffer.from(encodeWav(new Int16Array(16000))).toString("base64")});
const available=await invoke("GET");assert.equal((await available.json() as {enabled:boolean}).enabled,true);count++;
const disabled=await invoke("GET",normal,{env:{CLINICAL_LIVE_ENABLED:"false"}});assert.equal((await disabled.json() as {enabled:boolean}).enabled,false);count++;
await check("valid extraction contract","POST",200);
inventSource=true;await check("invented source rejected","POST",502,"UNSUPPORTED_NOTE");inventSource=false;
failProvider=true;await check("provider fails honestly","POST",503,"ESCUTA_UNAVAILABLE");failProvider=false;
const day=new Date().toISOString().slice(0,10);
raw.prepare("UPDATE escuta_usage SET used=719 WHERE clinic_id='c1' AND user_id='u1' AND day=?").run(day);
await check("last allowed request","POST",200);
await check("quota exceeded","POST",429,"QUOTA_EXCEEDED");
assert.equal((raw.prepare("SELECT used FROM escuta_usage WHERE clinic_id='c1' AND user_id='u1' AND day=?").get(day) as {used:number}).used,720);
// Preserve the last-owner invariant instead of disabling its trigger to arrange this fixture.
assert.throws(()=>raw.prepare("UPDATE clinic_memberships SET active=0 WHERE clinic_id='c1' AND user_id='u1'").run(),/LAST_OWNER_PROTECTED/);count++;
raw.prepare("INSERT INTO clinic_memberships(clinic_id,user_id,role,active) VALUES('c1','u2','owner',1)").run();
raw.prepare("UPDATE clinic_memberships SET active=0 WHERE clinic_id='c1' AND user_id='u1'").run();
await check("revoked persisted membership","GET",403,"TENANT_FORBIDDEN");
failDb=true;await check("database outage","GET",503,"ESCUTA_UNAVAILABLE");failDb=false;
raw.close();console.log(`Escuta handler: ${count} verificações passaram; inferência é fixture de contrato, não validação do provedor.`);

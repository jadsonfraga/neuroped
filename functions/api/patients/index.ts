/** Pacientes no D1: PII/diagnóstico cifrados; busca por índice cego. */
import type { ClinicalCryptoEnv } from "../_clinicalCrypto";
import { ClinicalCryptoError, clinicalStrictMode, replaceBlindTokensStatements, searchEncryptedEntityIds } from "../_clinicalCrypto";
import { patientStorage, readPatientPayload } from "../_clinicalRecords";
import { authorizationError, canWriteClinicalData, getContextUser, isAdmin } from "../auth/_authorization";
import { normalizePatientWrite, parsePositiveInteger, toPatientApi, type PatientDatabaseRow } from "./_contract";
import { isPlainObject } from "../_request";
interface Env extends ClinicalCryptoEnv { DB?: D1Database }
const DEMO_PATIENTS: PatientDatabaseRow[] = [
  { id:"demo-001", name:"Demo Paciente 1 — Fictício", birth_date:"2018-03-15", guardian_name:"Responsável Demo 1", guardian_phone:"(81) 99000-0001", diagnosis_code:"F84.0", notes:"Paciente de demonstração — dados fictícios.", is_demo:1, created_at:new Date("2025-01-10").toISOString(), updated_at:new Date("2025-01-10").toISOString() },
  { id:"demo-002", name:"Demo Paciente 2 — Fictício", birth_date:"2016-07-22", guardian_name:"Responsável Demo 2", guardian_phone:"(81) 99000-0002", diagnosis_code:"F90.0", notes:"Paciente de demonstração — dados fictícios.", is_demo:1, created_at:new Date("2025-02-14").toISOString(), updated_at:new Date("2025-02-14").toISOString() },
  { id:"demo-003", name:"Demo Paciente 3 — Fictício", birth_date:"2020-11-05", guardian_name:"Responsável Demo 3", guardian_phone:"(81) 99000-0003", diagnosis_code:"G40.3", notes:"Paciente de demonstração — dados fictícios.", is_demo:1, created_at:new Date("2025-03-01").toISOString(), updated_at:new Date("2025-03-01").toISOString() },
];
function jsonResponse(data: unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
function errorResponse(message:string,code:string,status:number){return jsonResponse({error:message,code},status)}
async function present(env:Env,row:Record<string,unknown>){const secure=await readPatientPayload(env,row); return toPatientApi({...row,...secure})}
function demoSearch(query:string,p:PatientDatabaseRow){const q=query.toLocaleLowerCase("pt-BR"); return [p.name,p.diagnosis_code,p.guardian_name].some(v=>String(v??"").toLocaleLowerCase("pt-BR").includes(q))}
export const onRequestGet: PagesFunction<Env> = async(context)=>{
 const {env,request}=context; const url=new URL(request.url); const page=parsePositiveInteger(url.searchParams.get("page"),1,1_000_000); const limit=parsePositiveInteger(url.searchParams.get("limit"),20,50); const search=(url.searchParams.get("q")??"").trim().slice(0,160);
 if(!env.DB){let results=DEMO_PATIENTS;if(search)results=results.filter(p=>demoSearch(search,p));const offset=(page-1)*limit;return jsonResponse({data:results.slice(offset,offset+limit).map(toPatientApi),total:results.length,page,limit,mode:"demo"})}
 const user=getContextUser(context); if(!user)return authorizationError("Não autenticado.","UNAUTHENTICATED",401);
 try{
   let candidateIds:string[]|null=null;
   if(search){candidateIds=await searchEncryptedEntityIds(env,env.DB,"patient","patient_search",search,5000); if(candidateIds.length===0&&!clinicalStrictMode(env)) candidateIds=null; else if(candidateIds.length===0)return jsonResponse({data:[],total:0,page,limit,mode:"db"});}
   const ownerClause=isAdmin(user)?"":"AND owner_user_id = ?"; const ownerBinds=isAdmin(user)?[]:[user.id];
   let idClause=""; const idBinds:unknown[]=[];
   if(candidateIds){idClause=`AND id IN (${candidateIds.map(()=>"?").join(",")})`;idBinds.push(...candidateIds)}
   let legacyClause="";const legacyBinds:unknown[]=[];
   if(search&&!candidateIds&&!clinicalStrictMode(env)){const q=`%${search.replace(/[\\%_]/g,c=>`\\${c}`)}%`;legacyClause=`AND (name LIKE ? ESCAPE '\\' OR diagnosis_code LIKE ? ESCAPE '\\' OR guardian_name LIKE ? ESCAPE '\\')`;legacyBinds.push(q,q,q)}
   const binds=[...ownerBinds,...idBinds,...legacyBinds]; const count=await env.DB.prepare(`SELECT COUNT(*) AS total FROM patients_demo WHERE is_demo=1 ${ownerClause} ${idClause} ${legacyClause}`).bind(...binds).first<{total:number}>(); const offset=(page-1)*limit;
   const rows=await env.DB.prepare(`SELECT id,name,birth_date,guardian_name,guardian_phone,diagnosis_code,notes,is_demo,created_at,updated_at FROM patients_demo WHERE is_demo=1 ${ownerClause} ${idClause} ${legacyClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(...binds,limit,offset).all<Record<string,unknown>>();
   const data=await Promise.all((rows.results??[]).map(row=>present(env,row))); return jsonResponse({data,total:count?.total??0,page,limit,mode:"db"});
 }catch(error){if(error instanceof ClinicalCryptoError)return errorResponse(error.message,error.code,503);console.error("[patients.GET] DB error");return errorResponse("Erro ao buscar pacientes.","DB_ERROR",500)}
};
export const onRequestPost: PagesFunction<Env> = async(context)=>{
 const {env,request}=context;const user=env.DB?getContextUser(context):null;if(env.DB&&!user)return authorizationError("Não autenticado.","UNAUTHENTICATED",401);if(user&&!canWriteClinicalData(user))return authorizationError("Perfil sem permissão para criar pacientes.","FORBIDDEN",403);let parsed:unknown;try{parsed=await request.json()}catch{return errorResponse("Corpo da requisição inválido ou não é JSON.","INVALID_JSON",400)}if(!isPlainObject(parsed))return errorResponse("Corpo deve ser um objeto JSON.","INVALID_JSON",400);const normalized=normalizePatientWrite(parsed,{requireName:true});if(!normalized.ok)return errorResponse(normalized.message,"VALIDATION_ERROR",400);if(!env.DB)return errorResponse("Persistência indisponível. Nenhum paciente foi criado.","DB_REQUIRED",503);
 const id=`demo-${crypto.randomUUID()}`;const now=new Date().toISOString();const payload={name:String(normalized.values.name),birth_date:normalized.values.birth_date??null,guardian_name:normalized.values.guardian_name??null,guardian_phone:normalized.values.guardian_phone??null,diagnosis_code:normalized.values.diagnosis_code??null,notes:normalized.values.notes??null};
 try{const stored=await patientStorage(env,id,payload);const statements=[env.DB.prepare(`INSERT INTO patients_demo (id,name,birth_date,guardian_name,guardian_phone,diagnosis_code,notes,owner_user_id,is_demo,created_at,updated_at) VALUES (?, '[encrypted]', NULL, NULL, NULL, NULL, ?, ?, 1, ?, ?)`).bind(id,stored.envelope,user!.id,now,now),...replaceBlindTokensStatements(env.DB,"patient",id,"patient_search",stored.search)];await env.DB.batch(statements);return jsonResponse({...toPatientApi({id,...payload,is_demo:1,created_at:now,updated_at:now}),mode:"db"},201)}catch(error){if(error instanceof ClinicalCryptoError)return errorResponse(error.message,error.code,503);console.error("[patients.POST] DB error");return errorResponse("Erro ao criar paciente.","DB_ERROR",500)}
};

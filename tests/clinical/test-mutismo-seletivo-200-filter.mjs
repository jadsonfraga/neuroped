// @ts-check
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const imp = (path) => import(pathToFileURL(resolve(root, path)).href);
const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, getVerbalRequirement, getLiteracyRequirement } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");
const { mutismoSeletivoItems, filterMutismoSeletivoModules, MUTISMO_SELETIVO_PROVENANCE } = await imp("client/src/data/mutismoSeletivo200Contract.ts");
const expected = {"mutismo-seletivo-familia-30":30,"mutismo-seletivo-escola-30":30,"mutismo-seletivo-autopercepcao-20":20,"mutismo-seletivo-anamnese-20":20,"mutismo-seletivo-observacao-20":20,"mutismo-seletivo-diferenciais-20":20,"mutismo-seletivo-seguranca-10":10,"mutismo-seletivo-sintese-50":50};
const ids = Object.keys(expected); const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog,{queixas:["ansiedade"],selectedSignals:[],...ctx});
let failures=0, checks=0; const ok=(condition,message)=>{checks++;if(!condition){failures++;console.error(`❌ ${message}`);}};
let total=0;
for(const [id,count] of Object.entries(expected)){
 const scale=allScales.find((entry)=>entry.id===id); const def=interactiveScaleItems[id]; const delivered=(def?.domains??[]).reduce((sum,d)=>sum+d.items.length,0); total+=delivered;
 ok(Boolean(scale),`${id}: catálogo`); ok(Boolean(def),`${id}: aplicação`); ok(delivered===count,`${id}: ${delivered}/${count}`); ok(Boolean(scale)&&getImplementationStatus(scale)==="complete",`${id}: completo`); ok(scale?.appRoute===`/generic-scale/${id}`,`${id}: rota aberta`);
 const fields=(def?.domains??[]).flatMap((d)=>d.items); ok(def?.optionPoints?.every((v)=>v===0),`${id}: sem soma`); ok(fields.every((field)=>typeof field!=="string"&&field.responseType==="text"&&field.required===false),`${id}: campos qualitativos opcionais`);
}
ok(total===200&&mutismoSeletivoItems.length===200,"200 campos integrais");
ok(new Set(mutismoSeletivoItems.map((item)=>item.id)).size===200,"IDs únicos");
ok(new Set(mutismoSeletivoItems.map((item)=>item.prompt)).size===200,"prompts únicos");
ok(mutismoSeletivoItems.every((item)=>item.scored===false),"nenhum campo pontuável");
const redFlags=mutismoSeletivoItems.filter((item)=>item.redFlag); ok(redFlags.length===10&&redFlags.every((item)=>item.module==="seguranca"&&!item.scored),"10 red flags fora de escore");
ok(MUTISMO_SELETIVO_PROVENANCE.pages===200&&MUTISMO_SELETIVO_PROVENANCE.bytes===632257,"contrato do PDF");
const pdfSha=MUTISMO_SELETIVO_PROVENANCE.sha256Chunks.join("");
ok(pdfSha.length===64&&pdfSha.startsWith("aea95638")&&pdfSha.endsWith("57126e2c"),"integridade SHA-256");
ok(MUTISMO_SELETIVO_PROVENANCE.storageStatus==="blocked"&&MUTISMO_SELETIVO_PROVENANCE.driveFileId===null,"Drive bloqueado registrado honestamente");
ok(run({ageMonths:48,respondente:"pais",assessmentUse:"triagem"}).some((m)=>m.scale.id==="mutismo-seletivo-familia-30"),"família por idade/informante");
ok(run({ageMonths:48,respondente:"professor",assessmentUse:"triagem"}).some((m)=>m.scale.id==="mutismo-seletivo-escola-30"),"escola por idade/informante");
ok(run({ageMonths:96,respondente:"autoaplicavel",assessmentUse:"triagem",isVerbal:false,isLiterate:false}).some((m)=>m.scale.id==="mutismo-seletivo-autopercepcao-20"),"autopercepção apoiada");
const self=allScales.find((s)=>s.id==="mutismo-seletivo-autopercepcao-20"); ok(Boolean(self)&&getVerbalRequirement(self)==="nao_verbal_compativel"&&getLiteracyRequirement(self)==="indiferente","comunicação/alfabetização inclusivas");
ok(run({ageMonths:120,respondente:"clinico",assessmentUse:"monitorizacao"}).some((m)=>m.scale.id==="mutismo-seletivo-sintese-50"),"monitorização");
ok(filterMutismoSeletivoModules({ageMonths:72,informant:"clinico",signals:["catatonia"]}).some((m)=>m.key==="diferenciais"),"catatonia recupera diferenciais");
ok(filterMutismoSeletivoModules({ageMonths:72,informant:"professor",contexts:["escola"]}).some((m)=>m.key==="escola"),"contexto escola");
ok(filterMutismoSeletivoModules({ageMonths:72,informant:"pais",contexts:["casa"]}).some((m)=>m.key==="familia"),"contexto casa");
const scales=allScales.filter((s)=>ids.includes(s.id)); ok(scales.every((s)=>s.licencaUso==="autoral"&&s.pendente_validacao_clinica===true),"autoria e validação explícitas"); ok(scales.every((s)=>(s.signalTags?.length??0)>=45),"filtro clínico rico"); ok(scales.every((s)=>!/(login|senha|pin)/i.test(s.appRoute??"")),"acesso aberto"); ok(scales.every((s)=>!/probabilidade diagnóstica [0-9]|ponto de corte positivo/i.test(`${s.description} ${s.scoringCutoff}`)),"sem diagnóstico automático");
if(failures){console.error(`❌ ${failures}/${checks} verificações falharam`);process.exit(1);} console.log(`✅ Mutismo seletivo 200 OK — ${checks} verificações passaram.`);

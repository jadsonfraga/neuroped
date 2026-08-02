// @ts-check
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const imp = (rel) => import(pathToFileURL(resolve(repoRoot, rel)).href);
const { allScales } = await imp("client/src/data/scaleFilter.ts");
const { mergeFilterableCatalog } = await imp("client/src/data/filterableCatalog.ts");
const { filterScalesIntelligently, getImplementationStatus, getVerbalRequirement, getLiteracyRequirement } = await imp("client/src/data/advancedFilterLogic.ts");
const { interactiveScaleItems } = await imp("client/src/data/interactiveScaleItems.ts");

const EXPECTED = {
  "ipn-epi-seg-familia-60": 60,
  "ipn-epi-seg-escola-30": 30,
  "ipn-epi-seg-autopercepcao-20": 20,
  "ipn-epi-seg-observacao-20": 20,
  "ipn-epi-seg-caracterizacao-20": 20,
  "ipn-epi-seg-tratamento-20": 20,
  "ipn-epi-seg-anamnese-15": 15,
  "ipn-epi-seg-sintese-15": 15
};
const IDS = Object.keys(EXPECTED);
const catalog = mergeFilterableCatalog(allScales);
const run = (ctx) => filterScalesIntelligently(catalog, { queixas: ["epilepsia"], selectedSignals: [], ...ctx });
let failures=0, checks=0;
function ok(v,m){ checks++; if(!v){ failures++; console.error(`  ❌ ${m}`); } }

let total=0;
for (const [id,expected] of Object.entries(EXPECTED)) {
  const scale=allScales.find((s)=>s.id===id);
  const def=interactiveScaleItems[id];
  const delivered=(def?.domains??[]).reduce((n,d)=>n+d.items.length,0);
  total+=delivered;
  ok(Boolean(scale),`${id} cadastrado`);
  ok(Boolean(def),`${id} interativo`);
  ok(delivered===expected,`${id}: ${delivered}/${expected}`);
  ok(Boolean(scale)&&getImplementationStatus(scale)==="complete",`${id} completo`);
}
ok(total===200,`conteúdo integral ${total}/200`);

const family=run({ageMonths:6,respondente:"pais",assessmentUse:"diagnostico"});
ok(family.some((m)=>m.scale.id==="ipn-epi-seg-familia-60"),"lactente + família disponível");
const school=run({ageMonths:120,respondente:"professor",assessmentUse:"diagnostico"});
ok(school.some((m)=>m.scale.id==="ipn-epi-seg-escola-30"),"escola disponível");
ok(!school.some((m)=>m.scale.id==="ipn-epi-seg-familia-60"),"sem contaminação de informante");
const self=run({ageMonths:144,respondente:"autoaplicavel",assessmentUse:"diagnostico",isVerbal:false,isLiterate:false});
ok(self.some((m)=>m.scale.id==="ipn-epi-seg-autopercepcao-20"),"autorrelato apoiado não verbal/não alfabetizado");
const selfScale=allScales.find((s)=>s.id==="ipn-epi-seg-autopercepcao-20");
ok(Boolean(selfScale)&&getVerbalRequirement(selfScale)==="nao_verbal_compativel","compatibilidade não verbal explícita");
ok(Boolean(selfScale)&&getLiteracyRequirement(selfScale)==="indiferente","sem barreira de alfabetização");
const clinician=run({ageMonths:12,respondente:"clinico",assessmentUse:"diagnostico"});
for (const id of ["ipn-epi-seg-observacao-20","ipn-epi-seg-caracterizacao-20","ipn-epi-seg-anamnese-15"]) ok(clinician.some((m)=>m.scale.id===id),`clínico inclui ${id}`);
const monitor=run({ageMonths:120,respondente:"clinico",assessmentUse:"monitorizacao"});
ok(monitor.some((m)=>m.scale.id==="ipn-epi-seg-tratamento-20"),"tratamento no seguimento");
ok(monitor.some((m)=>m.scale.id==="ipn-epi-seg-sintese-15"),"síntese no seguimento");

for (const id of ["ipn-epi-seg-anamnese-15","ipn-epi-seg-sintese-15"]) {
  const its=interactiveScaleItems[id].domains.flatMap((d)=>d.items);
  ok(its.every((it)=>typeof it!=="string"&&it.responseType==="text"&&it.required===false),`${id} qualitativo opcional`);
}
const allItems=IDS.flatMap((id)=>interactiveScaleItems[id].domains.flatMap((d)=>d.items));
ok(allItems.every((it)=>typeof it==="string"||!it.sentinel),"red flags de epilepsia não reutilizam sentinela suicida");
ok(allItems.some((it)=>typeof it!=="string"&&/SAMU 192|nada.*boca|crise prolongada/i.test(`${it.text} ${it.example??""}`)),"primeiros socorros explícitos");
const scales=allScales.filter((s)=>IDS.includes(s.id));
ok(scales.every((s)=>s.licencaUso==="autoral"&&s.pendente_validacao_clinica===true),"autoria e validação pendente");
ok(scales.every((s)=>s.suicideRiskInstrument===false&&s.psychosisRiskInstrument===false),"sem classificação de segurança indevida");
ok(scales.every((s)=>(s.signalTags?.length??0)>=40),"filtro clínico rico");

if(failures){ console.error(`❌ IPN-EPI/SEG falhou: ${failures}/${checks}`); process.exit(1); }
console.log(`✅ IPN-EPI/SEG OK — ${checks} verificações.`);

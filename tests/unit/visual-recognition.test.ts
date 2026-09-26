import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { ITEMS, COLORS, PAIRS, CATEGORIES, VERSION, ageInMonths, bandFor, eligibleItems, buildPlan, makeTrial, easyPlanFor, itemFor, distractorPool, emptyDraft, observe, problems, activeObservations, reportText, type Config, type Draft, type StageEvent } from "../../client/src/features/visual-recognition/model.ts";
const events:StageEvent[]=[{kind:"apresentado",at:"2026-09-23T12:00:00Z"},{kind:"encerrado",at:"2026-09-23T12:00:01Z"}];
const base:Config={ageMonths:60,mode:"receptivo",choices:2,count:12,selectedIds:ITEMS.filter(item=>item.minMonths<=60).map(item=>item.id),seed:17756,distractors:"distantes",contextAcknowledged:true,conditions:[]};
const answered=():Draft=>({...emptyDraft(),outcome:"correspondente",channel:"apontar",familiarity:"conhecida"});
const root=new URL("../../client/public/recognition-v2/",import.meta.url);

test("banco completo, IDs únicos, licença e hashes de cada figura local",()=>{
 const manifest=JSON.parse(readFileSync(new URL("manifest.json",root),"utf8"));
 assert.equal(manifest.items.length,58);assert.equal(ITEMS.length,89);assert.equal(COLORS.length,11);assert.equal(PAIRS.length,10);
 assert.equal(new Set(ITEMS.map(item=>item.id)).size,ITEMS.length);
 assert.deepEqual([...new Set(ITEMS.map(item=>item.category))].sort(),Object.keys(CATEGORIES).sort());
 assert.match(readFileSync(new URL("LICENSE.txt",root),"utf8"),/by-sa\/4\.0/);
 assert.equal(readdirSync(root).filter(name=>name.endsWith(".svg")).length,58);
 for(const item of manifest.items){
  const bytes=readFileSync(new URL(`${item.id}.svg`,root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"),item.sha256,item.id);
  assert.equal(item.license,"CC-BY-SA-4.0");assert.match(item.sourceSha,/^[a-f0-9]{40}$/);
  const svg=bytes.toString("utf8");assert.match(svg,/<svg\b/);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image|text|title|desc|metadata)\b|\son\w+\s*=|href\s*=\s*["']\s*(?:https?:|data:|javascript:)/i,item.id);
 }
});
test("idade exata sem inventar valor ausente; transições inclusive 29/30 meses",()=>{
 for(const [years,months] of [["","0"],["a","0"],["3","12"],["3.5","0"],["0","11"],["20","0"],["-1","0"],["3"," "]])assert.equal(ageInMonths(years,months),null);
 for(const value of [12,23,24,29,30,35,36,47,48,59,60,83,84,119,120,155,156,215,216,239]){
  assert.equal(ageInMonths(String(Math.floor(value/12)),String(value%12)),value);
  const band=bandFor(value);assert.ok(band);assert.ok(value>=band.min&&value<=band.max);
 }
 assert.equal(bandFor(23)?.id,"12-23");assert.equal(bandFor(24)?.id,"24-35");assert.equal(bandFor(36)?.id,"36-47");assert.equal(bandFor(84)?.id,"84-119");assert.equal(bandFor(12.5),undefined);
 assert.equal(eligibleItems(29,"receptivo").some(item=>item.category==="cores"),false);
 assert.equal(eligibleItems(30,"receptivo").filter(item=>item.category==="cores").length,4);
 assert.equal(eligibleItems(47,"nomeacao").some(item=>item.category==="cores"),false);
 assert.equal(eligibleItems(48,"nomeacao").some(item=>item.category==="cores"),true);
 assert.equal(eligibleItems(60,"pareamento").some(item=>item.category==="opostos"),false);
 assert.throws(()=>buildPlan({...base,ageMonths:23,mode:"nomeacao"}),/24 meses/);
});
test("roteiro determinístico, diversidade de categorias, alvo único e alternativas registradas",()=>{
 for(const mode of ["nomeacao","receptivo","pareamento"] as const){
  const cfg={...base,mode,selectedIds:eligibleItems(60,mode).map(item=>item.id)};
  const plan=buildPlan(cfg);assert.deepEqual(plan,buildPlan(cfg));assert.equal(plan.length,12);
  assert.equal(new Set(plan.map(trial=>trial.targetId)).size,plan.length);
  assert.ok(new Set(plan.map(trial=>ITEMS.find(item=>item.id===trial.targetId)!.category)).size>=4);
  for(const trial of plan){assert.equal(new Set(trial.optionIds).size,trial.optionIds.length);assert.equal(trial.optionIds.filter(id=>id===trial.targetId).length,1);assert.equal(trial.assetVersion,VERSION);assert.ok(trial.optionIds.every(id=>cfg.selectedIds.includes(id)));}
 }
});
test("posição do alvo balanceada, sem primeira alternativa sistemática",()=>{
 const pool=ITEMS.filter(item=>item.category==="animais");
 for(let seed=0;seed<30;seed++)for(const choices of [2,3,4]){
  const positions=Array(choices).fill(0);
  for(let index=0;index<choices*5;index++){
   const trial=makeTrial(pool[index%pool.length].id,"receptivo",pool,choices,seed,index);
   assert.equal(trial.optionIds.length,choices);positions[trial.optionIds.indexOf(trial.targetId)]++;
  }
  assert.deepEqual(positions,Array(choices).fill(5));
 }
});
test("pares completos e contexto obrigatório; não há massa inferida pelo tamanho",()=>{
 const selectedIds=ITEMS.filter(item=>item.category==="opostos").map(item=>item.id);
 const plan=buildPlan({...base,count:100,selectedIds});assert.equal(plan.length,20);
 for(const trial of plan){const target=ITEMS.find(item=>item.id===trial.targetId)!;assert.equal(trial.optionIds.length,2);assert.ok(trial.optionIds.every(id=>ITEMS.find(item=>item.id===id)!.pair===target.pair));}
 assert.throws(()=>buildPlan({...base,selectedIds,contextAcknowledged:false}),/contextualizados/);
 assert.throws(()=>buildPlan({...base,selectedIds:["massa-0"]}),/dois estados/);
 assert.match(plan.find(trial=>trial.targetId==="massa-0")!.context!,/mesmo tamanho/);
 assert.match(PAIRS.find(pair=>pair.id==="temperatura")!.note,/Nunca/);
});
test("não aceita configurações adulteradas ou IDs repetidos",()=>{
 assert.throws(()=>buildPlan({...base,selectedIds:["nao-existe"]}),/incompatível/);
 assert.throws(()=>buildPlan({...base,selectedIds:["gato","gato"]}),/incompatível/);
 assert.throws(()=>buildPlan({...base,count:0}),/inválida/);
 assert.throws(()=>buildPlan({...base,selectedIds:[]}),/Selecione/);
});
test("resposta não observada e erro de imagem nunca fabricam desempenho",()=>{
 const trial=buildPlan(base)[0];
 assert.ok(problems(trial,answered(),[]).some(value=>value.includes("apresentada")));
 assert.ok(problems(trial,{...answered(),outcome:"sem_resposta"},[]).some(value=>value.includes("apresentada")));
 const broken:StageEvent[]=[...events,{kind:"erro-imagem",at:"2026-09-23T12:00:02Z",itemId:trial.targetId}];
 assert.ok(problems(trial,answered(),broken).some(value=>value.includes("Falha")));
 for(const outcome of ["tecnico","ambiguo","recusa","nao_aplicado"] as const){
  assert.ok(problems(trial,{...answered(),outcome},events).length>0);
  assert.equal(problems(trial,{...answered(),outcome,note:"Condição fictícia documentada."},events).length,0);
 }
});
test("toque precisa coincidir com o evento; respostas não orais são aceitas",()=>{
 const trial=makeTrial("gato","receptivo",ITEMS.filter(item=>item.category==="animais"),2,3,0);
 const tapped:StageEvent[]=[...events,{kind:"toque",itemId:"gato",at:"2026-09-23T12:00:02Z"}];
 assert.equal(problems(trial,{...answered(),channel:"toque"},tapped).length,0);
 assert.ok(problems(trial,{...answered(),channel:"toque",outcome:"diferente"},tapped).length>0);
 assert.ok(problems(trial,{...answered(),channel:"toque"},events).length>0);
 assert.equal(problems(trial,{...answered(),channel:"olhar",note:"Direção do olhar interpretada pelo aplicador."},events).length,0);
 const naming=makeTrial("gato","nomeacao",ITEMS,2,3,0);
 assert.ok(problems(naming,answered(),events).some(value=>value.includes("Transcreva")));
 assert.equal(problems(naming,{...answered(),channel:"oral",literal:"gatinho"},events).length,0);
});
test("correção append-only preserva resposta anterior e não duplica oportunidade",()=>{
 const plan=buildPlan(base),trial=plan[0],record=observe(trial,answered(),events,[]);
 assert.throws(()=>observe(trial,answered(),events,[record]),/registrada|duplicada/);
 assert.throws(()=>observe(trial,answered(),events,[record],record.id,""),/justificativa/);
 const corrected=observe(trial,{...answered(),outcome:"diferente"},events,[record],record.id,"Correção de transcrição.");
 const ledger=[record,corrected];assert.equal(ledger[0].response.outcome,"correspondente");assert.deepEqual(activeObservations(ledger),[corrected]);
 const report=reportText(base,plan,ledger);assert.match(report,/1 de 12 oportunidades/);assert.match(report,/11 ainda sem registro/);assert.match(report,/Correção de transcrição/);assert.match(report,/Resposta diferente/);
});
test("exposição prévia não volta como nomeação espontânea",()=>{
 const first=makeTrial("gato","receptivo",ITEMS,2,9,0),record=observe(first,answered(),events,[]);
 const later=makeTrial("gato","nomeacao",ITEMS,2,9,1);
 const naming=observe(later,{...answered(),literal:"gato",channel:"oral"},events,[record]);assert.equal(naming.previousExposure,true);
 const report=reportText(base,[first,later],[record,naming]);assert.match(report,/exposição prévia/i);
});
test("tela infantil sem mecanismo de memória, resposta falada automática ou textos-alvo",()=>{
 const source=readFileSync(new URL("../../client/src/features/visual-recognition/TrialStage.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(source,/setInterval|setTimeout|speechSynthesis|target\.label|item\.label|localStorage|sessionStorage/);
 assert.match(source,/showModal/);assert.match(source,/visibilitychange/);assert.match(source,/onError/);
 const workspace=readFileSync(new URL("../../client/src/features/visual-recognition/Workspace.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(workspace,/localStorage|sessionStorage|SaveToPatient/);
 assert.match(workspace,/preloadSymbols/);assert.match(workspace,/Correção|correção/);
});

test("\"Categorias distintas quando possível\" de fato evita a mesma categoria; recua para o mesmo tipo de arte só quando falta figura",()=>{
 // Bug corrigido: o pool filtrava só por tipo de arte, então a etiqueta prometia distância e entregava vizinhos da mesma categoria.
 let checked=0;
 for(const age of [12,23,24,47,48,83,84,119,120,155,156,215,216,239])for(const choices of [2,3,4] as const){
  const selectedIds=eligibleItems(age,"receptivo").map(item=>item.id);
  for(const trial of buildPlan({...base,ageMonths:age,choices,count:100,selectedIds})){
   const target=itemFor(trial.targetId);if(target.pair||target.category==="cores")continue;
   checked++;
   assert.equal(trial.optionIds.length,choices,`${age}m/${choices}: tela cheia`);
   for(const id of trial.optionIds)if(id!==target.id)assert.notEqual(itemFor(id).category,target.category,`${age}m/${choices}: ${id} é da categoria de ${target.id}`);
  }
 }
 assert.ok(checked>1000,`amostra suficiente (${checked})`);
 // Quando não há figuras distantes suficientes, completa com a mesma arte em vez de falhar.
 const few=buildPlan({...base,choices:4,selectedIds:["gato","cachorro","peixe","banana"],count:4});
 const gato=few.find(trial=>trial.targetId==="gato");assert.ok(gato);assert.equal(gato.optionIds.length,4);
 const banana=few.find(trial=>trial.targetId==="banana");assert.ok(banana);
 assert.ok(banana.optionIds.filter(id=>id!=="banana").every(id=>itemFor(id).category==="animais"));
 // Cores continuam só entre cores; opostos só no par.
 assert.ok(distractorPool(itemFor("vermelho"),ITEMS,4,"distantes").every(item=>item.category==="cores"));
 assert.ok(distractorPool(itemFor("massa-0"),ITEMS,4,"distantes").every(item=>item.pair==="massa"));
});
test("\"Mesma categoria\" falha fechado nomeando a categoria quando ela tem uma só figura elegível",()=>{
 // Antes: erro genérico sobre conceitos/pares, no meio da montagem do plano, para qualquer criança de 12 a 23 meses.
 const selectedIds=eligibleItems(12,"receptivo").map(item=>item.id);
 assert.throws(()=>buildPlan({...base,ageMonths:12,selectedIds,distractors:"categoria"}),/Em "Mesma categoria", (Frutas tem só Banana|Transportes tem só Carro) elegível/);
 assert.throws(()=>buildPlan({...base,ageMonths:60,selectedIds:["gato","banana","carro"],distractors:"categoria"}),/Mesma categoria/);
 // Com duas ou mais figuras por categoria, a mesma categoria é respeitada em todas as telas.
 for(const trial of buildPlan({...base,ageMonths:60,choices:3,count:100,distractors:"categoria"})){
  const target=itemFor(trial.targetId);
  for(const id of trial.optionIds)if(!target.pair)assert.equal(itemFor(id).category,target.category);
 }
});
test("Modo Fácil: quantidade prometida é a quantidade entregue (12–23 meses tem 7 figuras, não 8)",()=>{
 const young=easyPlanFor(12);assert.equal(young.ids.length,7);assert.equal(young.count,7);
 for(const age of [12,23,24,47,48,83,84,239]){
  const plan=easyPlanFor(age);
  assert.ok(plan.count<=plan.ids.length&&plan.count>=1);
  const trials=buildPlan({ageMonths:age,mode:"receptivo",choices:plan.choices,count:plan.count,selectedIds:plan.ids,seed:3,distractors:plan.distractors,contextAcknowledged:false,conditions:[]});
  assert.equal(trials.length,plan.count,`${age}m: plano com ${trials.length} telas para ${plan.count} prometidas`);
  for(const trial of trials)if(!itemFor(trial.targetId).pair)assert.equal(trial.optionIds.length,plan.choices,`${age}m: tela cheia (opostos são sempre o par)`);
 }
 assert.equal(easyPlanFor(60).count,12);
 const workspace=readFileSync(new URL("../../client/src/features/visual-recognition/Workspace.tsx",import.meta.url),"utf8");
 assert.match(workspace,/const settings=easyPlanFor\(age\);/,"o início do jogo usa o plano resolvido");
 assert.match(workspace,/\$\{easyPlanFor\(age\)\.count\} figuras para reconhecer/,"a tela promete o número real");
 assert.doesNotMatch(workspace,/easyPlanSettings/,"nenhum consumidor lê a configuração bruta");
});

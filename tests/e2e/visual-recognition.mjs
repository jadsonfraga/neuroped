import assert from "node:assert/strict";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir=process.env.RECOGNITION_ARTIFACT_DIR||"/tmp/visual-recognition";
await mkdir(dir,{recursive:true});
const server=await startStaticServer("dist/public",{port:0,apiHandler:createSyntheticClinicalApi({patients:"empty"})});
const browser=await chromium.launch(auditBrowserLaunchOptions());
const context=await browser.newContext({viewport:{width:1180,height:920},acceptDownloads:true});
await context.addInitScript(storage=>{for(const [key,value] of Object.entries(storage))localStorage.setItem(key,value);},ACCEPTED_FIRST_VISIT_STORAGE);
const page=await context.newPage(),errors=[],screens=[];
page.on("pageerror",error=>errors.push(error.message));page.on("dialog",dialog=>dialog.accept());
const w=page.locator(".rv-workspace");
const button=name=>w.getByRole("button",{name,exact:true});
const preflight=async()=>{for(const box of await w.locator('.rv-preflight input[type="checkbox"]').all())await box.check();};
async function screen(name,child=false){
 const selector=child?".rv-child-dialog":".rv-workspace";
 assert.equal(await page.locator(selector).evaluate(element=>element.scrollWidth>element.clientWidth+1),false,`${name}: overflow`);
 const audit=await new AxeBuilder({page}).include(selector).analyze();
 await writeFile(`${dir}/${name}-axe.json`,JSON.stringify(audit.violations,null,2));
 assert.deepEqual(audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],name);
 await page.screenshot({path:`${dir}/${name}.png`,fullPage:!child});screens.push(name);
}
async function configure(mode="receptivo",count="6"){
 await w.getByLabel("Anos completos",{exact:true}).fill("5");
 await w.getByLabel("Meses adicionais",{exact:true}).fill("0");
 await w.getByLabel("Modalidade",{exact:true}).selectOption(mode);
 await w.getByLabel("Tamanho da sessão",{exact:true}).selectOption(count);
 await preflight();
 await button("Verificar banco e iniciar").click();
 await w.locator(".rv-run").waitFor({timeout:45000});
}
async function presentAndRespond(mode,{capture=false,offline=false}={}){
 const target=await w.locator(".rv-run-grid h2").innerText();
 const preview=await w.locator(".rv-operator-preview").evaluate(element=>{
  const image=element.querySelector("img");return image?{type:"img",value:image.src}:{type:"svg",value:element.querySelector("svg")?.innerHTML};
 });
 await button("Mostrar somente as figuras à criança").click();
 const dialog=page.getByRole("dialog",{name:"Apresentação de figuras",exact:true});await dialog.waitFor();
 assert.equal(await dialog.locator("img:not([alt='Figura de avaliação'])").count(),0,"child image alt must not reveal vocabulary");
 assert.equal(await dialog.locator("svg[aria-label]:not([aria-label='Figura de avaliação'])").count(),0,"child vector label must not reveal answer");
 assert.equal(await dialog.getByText(target,{exact:true}).count(),0,"no naming labels in child surface");
 const order=await dialog.locator(".rv-picture").evaluateAll(elements=>elements.map(element=>element.querySelector("img")?.src??element.querySelector("svg")?.innerHTML));
 const targetIndex=order.indexOf(preview.value);assert.ok(targetIndex>=0,"target remains recognizable to the image comparison test");
 if(mode==="pareamento")assert.equal(await dialog.locator(".rv-model").count(),1,"model remains visible");
 if(offline)await context.setOffline(true);
 if(mode!=="nomeacao"){
  await dialog.getByRole("button",{name:`Selecionar figura ${targetIndex+1}`,exact:true}).click();
  assert.equal(await dialog.getByRole("button",{name:`Selecionar figura ${targetIndex+1}`,exact:true}).getAttribute("aria-pressed"),"true");
 }
 if(capture){await screen(`child-${mode}`,true);await page.setViewportSize({width:390,height:844});await screen(`child-${mode}-phone`,true);await page.setViewportSize({width:1180,height:920});}
 assert.equal(await dialog.locator(".rv-picture").count(),order.length,"images do not disappear after answer");
 await dialog.getByRole("button",{name:"← Voltar ao aplicador",exact:true}).click();await dialog.waitFor({state:"detached"});
 await w.getByLabel("Situação observada",{exact:true}).selectOption("correspondente");
 await w.getByLabel("Via da resposta",{exact:true}).selectOption(mode==="nomeacao"?"oral":"toque");
 await w.getByLabel("Familiaridade com o item",{exact:true}).selectOption("incerta");
 if(mode==="nomeacao")await w.getByLabel("Resposta literal / forma de comunicação",{exact:true}).fill(`Resposta fictícia: ${target}.`);
 return target;
}
async function exportRecord(name){const wait=page.waitForEvent("download");await button("Baixar JSON com histórico").click();const file=await wait;await file.saveAs(`${dir}/${name}.json`);return JSON.parse(await readFile(`${dir}/${name}.json`,"utf8"));}
try{
 await page.goto(`${server.origin}/#/testes-reconhecimento`);
 await page.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);await page.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
 await page.locator('[data-testid="login-form"] button[type="submit"]').click();await w.waitFor();
 await screen("01-preparation-desktop");
 await button("Verificar banco e iniciar").click();assert.match(await w.locator(".rv-message").innerText(),/idade exata/);
 await w.getByLabel("Anos completos",{exact:true}).fill("5");
 await w.getByLabel(/Incluir quente\/frio/).check();
 await page.locator(".rv-catalog").evaluate(element=>{element.style.maxHeight="none";element.style.overflow="visible";});
 assert.equal(await w.locator(".rv-catalog-card").count(),89);
 for(const img of await w.locator(".rv-catalog img").all())assert.equal(await img.evaluate(element=>element.complete&&element.naturalWidth>0),true,"every catalog symbol loads");
 await w.locator(".rv-catalog").screenshot({path:`${dir}/02-all-89-stimuli.png`});screens.push("02-all-89-stimuli");
 await page.locator(".rv-catalog").evaluate(element=>{element.style.maxHeight="";element.style.overflow="";});
 await page.setViewportSize({width:768,height:1024});await screen("03-preparation-tablet");
 await page.setViewportSize({width:390,height:844});await screen("04-preparation-phone");await page.setViewportSize({width:1180,height:920});
 await w.getByLabel(/Incluir quente\/frio/).uncheck();
 await configure("receptivo");
 for(let i=0;i<6;i++){
  await presentAndRespond("receptivo",{capture:i===0,offline:i===0});
  await button("Registrar e continuar").click();
 }
 await context.setOffline(false);
 await w.getByRole("heading",{name:"Revisão profissional",exact:true}).waitFor();
 assert.equal(await button("Continuar aplicação").count(),0,"completed session cannot re-record final item");
 let record=await exportRecord("05-receptive-complete");assert.equal(record.ledger.length,6);assert.equal(record.plan.length,6);assert.match(record.report,/6 de 6 oportunidades/);assert.equal(record.config.ageMonths,60);
 await w.getByRole("button",{name:"Corrigir com justificativa",exact:true}).first().click();
 await w.getByLabel("Situação observada",{exact:true}).selectOption("sem_resposta");
 await w.getByLabel("Via da resposta",{exact:true}).selectOption("nenhuma");
 await w.getByLabel("Motivo da correção (obrigatório)",{exact:true}).fill("Correção fictícia para testar o histórico.");
 await button("Salvar correção com histórico").click();record=await exportRecord("06-correction-history");
 assert.equal(record.ledger.length,7);assert.equal(record.ledger[6].supersedes,record.ledger[0].id);assert.equal(record.ledger[0].response.outcome,"correspondente");assert.match(record.report,/6 de 6 oportunidades/);
 await screen("07-report-correction");
 await button("Nova sessão").click();await configure("nomeacao");
 await presentAndRespond("nomeacao",{capture:true});await button("Registrar e complementar com “Mostre…”").click();
 assert.match(await w.locator(".rv-run-top").innerText(),/COMPLEMENTAR/);
 await presentAndRespond("receptivo");await button("Registrar e continuar").click();
 await button("Revisar registros").click();record=await exportRecord("08-naming-and-receptive");
 assert.equal(record.ledger.length,2);assert.equal(record.ledger[0].trial.mode,"nomeacao");assert.equal(record.ledger[1].trial.mode,"receptivo");assert.equal(record.ledger[1].trial.adaptedFrom,record.ledger[0].trial.id);assert.match(record.report,/1 de 6 oportunidades/);
 await button("Nova sessão").click();await configure("pareamento");await presentAndRespond("pareamento",{capture:true});await button("Registrar e continuar").click();
 await button("Não aplicar este item").click();await w.getByLabel("Familiaridade com o item",{exact:true}).selectOption("incerta");await w.getByLabel("Ajuda, interferentes ou motivo de não aplicação",{exact:true}).fill("Interrupção fictícia por cansaço; não interpretar como erro.");await button("Registrar e continuar").click();
 await button("Revisar registros").click();record=await exportRecord("09-matching-and-not-applied");assert.equal(record.ledger[1].response.outcome,"nao_aplicado");
 await button("Nova sessão").click();await preflight();
 await page.route("**/recognition-v2/*.svg",route=>route.fulfill({status:200,contentType:"image/svg+xml",body:'<svg xmlns="http://www.w3.org/2000/svg"><circle r="1"/></svg>'}));
 await button("Verificar banco e iniciar").click();await w.locator(".rv-message").filter({hasText:/divergente/}).waitFor();assert.equal(await w.locator(".rv-run").count(),0,"integrity failure blocks session");await page.unroute("**/recognition-v2/*.svg");
 assert.deepEqual(errors,[]);
 await writeFile(`${dir}/result.json`,JSON.stringify({status:"passed",screens,bank:89,syntheticOnly:true,modes:3,offlineDuringSession:true,historyVerified:true},null,2));
 console.log('VISUAL_RECOGNITION_E2E_PASS: tablet, mobile, 89 stimuli, modes, offline, correction and integrity.');
}finally{await browser.close();await server.close();}

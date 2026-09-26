/** Actual built OBS-10 route; synthetic auth and generated media only. No clinical state injection. */
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
const dir = process.env.OBS10_EVIDENCE_ARTIFACT_DIR || "/tmp/obs10-evidence";
await mkdir(dir,{recursive:true});
const synthetic = createSyntheticClinicalApi({patients:"empty"});
// Change only the synthetic identity in the fixture response, never product authorization.
let operator=false;
const server = await startStaticServer("dist/public",{port:0,apiHandler:async(req,res,path,params)=>{
  if(operator && path.startsWith("/api/auth/")) {
    const original=res.end.bind(res);
    res.end=(body,...args)=>{ if(typeof body==="string"){ try { const data=JSON.parse(body); if(data.user) data.user.role="operator"; else if(data.role) data.role="operator"; body=JSON.stringify(data); }catch{} } return original(body,...args); };
  }
  return synthetic(req,res,path,params);
}});
const browser = await chromium.launch(auditBrowserLaunchOptions({args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]}));
const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,permissions:["microphone"]});
await context.addInitScript((s)=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v);},ACCEPTED_FIRST_VISIT_STORAGE);
const page=await context.newPage();const errors=[],writes=[],screens=[];
page.on("dialog",d=>d.accept());page.on("pageerror",e=>errors.push(e.message));
page.on("request",r=>{if(["POST","PUT","PATCH","DELETE"].includes(r.method())&&/\/api\//.test(r.url())&&!/\/api\/auth\//.test(r.url()))writes.push(r.url());});
const button=(name)=>page.getByRole("button",{name,exact:true});const field=(name)=>page.getByLabel(name,{exact:true});
async function login(p=page){await p.goto(`${server.origin}/#/avaliacao-pre-consulta-faixa-etaria`);await p.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email);await p.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);await p.locator('[data-testid="login-form"] button[type="submit"]').click();await p.getByTestId("obs10-workspace").waitFor({timeout:20000});}
async function exported(filename){const wait=page.waitForEvent("download");await button("Exportar JSON").click();const d=await wait;await d.saveAs(`${dir}/${filename}`);return JSON.parse(await readFile(`${dir}/${filename}`,"utf8"));}
async function screen(name){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,name);const a=await new AxeBuilder({page}).include(".obs10").analyze();await writeFile(`${dir}/${name}-axe.json`,JSON.stringify(a.violations,null,2));assert.deepEqual(a.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[],name);await page.getByTestId("obs13-evidence").screenshot({path:`${dir}/${name}.png`});screens.push(name);}
async function seek(n){await page.getByLabel("Reprodutor de evidência local",{exact:true}).evaluate((v,t)=>{v.pause();v.currentTime=t;},n);await page.waitForFunction(()=>{const v=document.querySelector('.obs13-evidence video');return v&&!v.seeking&&v.readyState>=2;});}
try{
 await login();
 // Produce a bounded, wholly synthetic moving picture with actual MediaRecorder.
 const bytes=await page.evaluate(async()=>{const c=document.createElement("canvas");c.width=320;c.height=180;const g=c.getContext("2d");let frame=0;const draw=()=>{g.fillStyle="white";g.fillRect(0,0,320,180);g.fillStyle="navy";g.font="20px sans-serif";g.fillText("MIDIA SINTETICA",40,65);g.fillRect((frame++*4)%260,110,30,30);};draw();const stream=c.captureStream(15),rec=new MediaRecorder(stream,{mimeType:"video/webm"}),chunks=[];return await new Promise((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onerror=reject;rec.onstop=async()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));};rec.start();const timer=setInterval(draw,60);setTimeout(()=>rec.stop(),2200);});});
 const file={name:"MIDIA-SINTETICA.webm",mimeType:"video/webm",buffer:Buffer.from(bytes)};
 await page.getByTestId("obs13-audio").locator("summary").click();await button("Gravar 3 segundos de teste").click();await page.getByLabel("Reprodução do teste de áudio",{exact:true}).waitFor({timeout:10000});assert.equal(await page.getByTestId("obs10-clock").count(),0);await button("Descartar teste de áudio").click();
 await page.getByTestId("obs13-pilot").locator("summary").first().click();await button("Cronometrar preparação").click();
 await field("Anos completos").fill("7");await field("Meses adicionais").fill("0");await field("Código institucional, sem nome").fill("OBS13-SINTETICO");await button("Separei o kit completo").click();for(const c of await page.locator(".obs10-checklist input").all())await c.check();
 await button("Iniciar aplicação · 10 minutos").click();assert.equal(await button("Parar medição desta etapa").count(),0);
 await button("+ Registrar uma tarefa deste bloco").click();await field("Qual tarefa?").fill("Interacao sintetica");await field("O que fez ou falou? Descreva literalmente").fill("Movimento observado na amostra ficticia.");await field("Como respondeu?").selectOption("E");await field("Qualidade do trecho, conferida por você").selectOption("Parcial");await button("Encerrar antes").click();
 await field("Vídeo local para esta sessão").setInputFiles(file);await button("Conferi: este vídeo pertence a esta sessão").waitFor();await button("Conferi: este vídeo pertence a esta sessão").click();
 const videoStep=page.getByTestId("obs10-next-steps").locator(".obs10-next-list > li").nth(3);
 assert.equal(await videoStep.evaluate(el=>el.classList.contains("is-done")),true,"a local external file counts only after byte-confirmation in this live screen session");
 assert.equal(await field("Código institucional do registro").isDisabled(),true);
 await seek(.2);await button("Marcar início do trecho").click();await seek(.9);await button("Marcar fim e vincular").click();
 assert.equal(await field("Confronto com o registro").inputValue(),"");
 await field("Tarefa registrada para vincular").selectOption("");assert.equal(await field("Comentário profissional sobre este trecho").count(),0);await button("Abrir trecho 1").click();
 await page.getByRole("checkbox",{name:"Revisei este trecho e seus limites de imagem e áudio.",exact:true}).check();await field("Confronto com o registro").selectOption("Trecho insuficiente");await field("Comentário profissional sobre este trecho").fill("Amostra sintetica: sem audio clinico. <script>window.obsInjected=true</script>");await button("Registrar comentário profissional").click();assert.equal(await page.evaluate(()=>window.obsInjected),undefined);
 const first=await exported("01-evidencia.json");assert.equal(first.evidence.clips.length,1);assert.equal(first.evidence.clips[0].sha256.length,64);assert.equal(first.evidence.moments[0].startSecond,.2);assert.equal(first.evidence.moments[0].endSecond,.9);assert.equal(first.evidence.reviews.length,1);assert.ok(first.pilot.logs.some(l=>l.phase==="Preparação"));assert.equal(JSON.stringify(first).includes(file.name),false);
 await screen("01-evidencia-desktop");await page.setViewportSize({width:390,height:844});await screen("02-evidencia-celular");await page.setViewportSize({width:1440,height:1000});
 await field("O que fez ou falou? Descreva literalmente").fill("Descricao retificada na revisao.");assert.match(await page.getByTestId("obs13-evidence").textContent(),/comentário precisa ser reconferido/);
 await button("Excluir este registro").click();assert.equal(await page.locator(".obs10-observation").count(),1);
 await button("Cronometrar revisão médica").click();await button("Parar medição desta etapa").click();await field("Utilidade para a consulta").selectOption("acrescentou parcialmente");
 const wait=page.waitForEvent("download");await button("Exportar métricas sem textos clínicos").click();const download=await wait;await download.saveAs(`${dir}/metricas.json`);const metrics=await readFile(`${dir}/metricas.json`,"utf8");assert.equal(metrics.includes("OBS13-SINTETICO"),false);assert.equal(metrics.includes("Descricao retificada"),false);assert.equal(metrics.includes(first.evidence.clips[0].sha256),false);
 const latest=await exported("02-retificado.json");await button("Nova aplicação · limpar esta sessão").click();assert.equal(await page.getByTestId("obs13-evidence").count(),0);
 await field("Arquivo JSON para revisão").setInputFiles({name:"OBS13-SINTETICO.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(latest))});await button("Abrir somente para revisão").click();
 assert.equal(await page.locator(".obs13-evidence video").count(),0);assert.match(await page.getByTestId("obs13-evidence").textContent(),/importado; autoria não autenticada/);
 assert.equal(await videoStep.evaluate(el=>el.classList.contains("is-done")),false,"imported clip references never masquerade as a locally confirmed video file");
 await button("Abrir trecho 1").click();await field("Vídeo local para esta sessão").setInputFiles({...file,buffer:Buffer.concat([file.buffer,Buffer.from([1])])});await page.getByText(/Este arquivo não corresponde ao clipe selecionado/).waitFor();assert.equal(await page.locator(".obs13-evidence video").count(),0);
 await field("Vídeo local para esta sessão").setInputFiles(file);await button("Conferi: este vídeo pertence a esta sessão").click();
 assert.equal(await videoStep.evaluate(el=>el.classList.contains("is-done")),true,"reattaching and byte-confirming the imported clip resolves the video step");
 await button("Abrir trecho 1").click();await page.waitForFunction(()=>{const v=document.querySelector('.obs13-evidence video');return v&&!v.seeking;});assert.ok(Math.abs(await page.locator(".obs13-evidence video").evaluate(v=>v.currentTime)-.2)<.15);
 const reopened=await exported("03-reanexado.json");assert.equal(reopened.evidence.reviews[0].origin,"imported-unverified");assert.equal(reopened.evidence.moments.length,1);assert.equal(reopened.evidence.clips.length,1);
 await screen("03-reaberto-com-evidencia");
 // New independent session authenticated as operator: product role check must remain closed.
 operator=true;const op=await browser.newContext({viewport:{width:1200,height:900}});await op.addInitScript(s=>{for(const[k,v]of Object.entries(s))localStorage.setItem(k,v);},ACCEPTED_FIRST_VISIT_STORAGE);const opPage=await op.newPage();opPage.on("dialog",d=>d.accept());await login(opPage);await opPage.getByLabel("Arquivo JSON para revisão",{exact:true}).setInputFiles({name:"OBS13-SINTETICO.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(latest))});await opPage.getByRole("button",{name:"Abrir somente para revisão",exact:true}).click();await opPage.getByRole("button",{name:"Abrir trecho 1",exact:true}).click();await opPage.getByLabel("Vídeo local para esta sessão",{exact:true}).setInputFiles(file);await opPage.getByRole("button",{name:"Conferi: este vídeo pertence a esta sessão",exact:true}).click();assert.equal(await opPage.getByLabel("Comentário profissional sobre este trecho",{exact:true}).isDisabled(),true);await op.close();
 assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
 await writeFile(`${dir}/result.json`,JSON.stringify({passed:true,screens,errors,clinicalWrites:writes,coverage:["adult-audio-preflight","explicit-work-timer","local-video-hash","player-linked-interval","professional-note-separation","changed-observation-invalidates","protected-code-and-referenced-record","text-free-metrics","no-video-in-json","wrong-file-rejected","same-file-reattach","operator-note-denied"]},null,2));
 console.log("OBS-10 v1.3: local video, source comparison, role-gated review and operational pilot journey passed.");
}catch(error){await page.screenshot({path:`${dir}/failure.png`,fullPage:true});await writeFile(`${dir}/failure.txt`,String(error.stack||error));throw error;}
finally{await context.close();await browser.close();await server.close();}

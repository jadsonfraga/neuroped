import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { build } from "esbuild";
import { chromium } from "playwright";
// Teste de componente isolado. Auth/tenant/provedor são fixtures explícitos, não prova de produção.
const root=process.cwd(), out=resolve("artifacts/escuta"), temp=resolve(".tmp/escuta-component");
mkdirSync(out,{recursive:true});mkdirSync(temp,{recursive:true});
const transcript="Médico: o diagnóstico ainda está em investigação. Responsável: não lembro a concentração do medicamento.";
const note={version:"escuta-v1",sections:[{key:"hipoteses",text:"O médico mantém o caso em investigação.",quotes:["o diagnóstico ainda está em investigação"],uncertain:true}]};
let saved=null;const calls=[];const assertions=[];
await build({stdin:{contents:'import React from "react";import {createRoot} from "react-dom/client";import Page from "@/pages/escuta-clinica";createRoot(document.getElementById("root")).render(<><div style={{padding:12,background:"#fff3cd"}}>TESTE DE COMPONENTE — serviços e identidade simulados; microfone virtual</div><Page/></>);',resolveDir:root,loader:"tsx"},bundle:true,platform:"browser",format:"esm",jsx:"automatic",outdir:temp,entryNames:"app",alias:{"@":resolve("client/src"),"@shared":resolve("shared")},plugins:[{name:"explicit-component-fixtures",setup(b){b.onResolve({filter:/^@\/contexts\/ClinicContext$/},()=>({path:"clinic",namespace:"fixture"}));b.onResolve({filter:/^@\/lib\/authClient$/},()=>({path:"auth",namespace:"fixture"}));b.onLoad({filter:/.*/,namespace:"fixture"},args=>({contents:args.path==="clinic"?'export function useClinic(){return {activeClinicId:"qa-clinic-only"};}':'export function authFetch(path,options={}){return fetch(path,{...options,headers:{"Content-Type":"application/json",...options.headers}});}',loader:"js"}));}}]});
writeFileSync(join(temp,"index.html"),'<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"><style>body{margin:0;font-family:Arial;--background:#fafbfc;--foreground:#162d38;--card:#fff}*{box-sizing:border-box}</style><div id="root"></div><script type="module" src="/app.js"></script></html>');
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,"http://localhost");res.setHeader("Cache-Control","no-store");
  if(url.pathname.startsWith("/api/")){
    res.setHeader("Content-Type","application/json");let body={};if(req.method==="POST"){const chunks=[];for await(const c of req)chunks.push(c);body=JSON.parse(Buffer.concat(chunks).toString());calls.push({path:url.pathname,body});}
    let data={};if(url.pathname==="/api/live/escuta")data=req.method==="GET"?{configured:true,enabled:true}:body.action==="transcribe"?{transcript,model:"EXPLICIT_TEST_FIXTURE"}:{note,model:"EXPLICIT_TEST_FIXTURE"};
    if(url.pathname==="/api/live/patients")data={data:[{id:"qa-patient-only",name:"Paciente fictício QA"}]};
    if(url.pathname==="/api/live/documents"){if(req.method==="POST"){saved={id:"qa-document-only",updatedAt:new Date().toISOString(),version:{content:body.content}};data={id:saved.id};}else data={data:saved?[saved]:[]};}
    res.end(JSON.stringify(data));return;
  }
  const file=url.pathname==="/audio/escuta-recorder.js"?resolve("client/public/audio/escuta-recorder.js"):url.pathname==="/app.js"?join(temp,"app.js"):url.pathname==="/app.css"?join(temp,"app.css"):join(temp,"index.html");
  res.setHeader("Content-Type",file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":"text/html");res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;const report={scope:"isolated component contract with fixture services and virtual microphone; not production/auth/provider E2E",assertions,status:"running"};
const passed=name=>{assertions.push(name);console.log(`PASS ${name}`);};
try{
  browser=await chromium.launch({headless:true,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream","--autoplay-policy=no-user-gesture-required"]});
  const context=await browser.newContext({viewport:{width:1440,height:1100},permissions:["microphone"],acceptDownloads:true});
  await context.addInitScript(()=>{const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);window.qaTracks=[];navigator.mediaDevices.getUserMedia=async c=>{const stream=await original(c);window.qaTracks.push(...stream.getTracks());return stream;};});
  const page=await context.newPage();const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
  await page.goto(origin);await page.getByText("Processamento habilitado",{exact:true}).waitFor();
  await page.screenshot({path:join(out,"desktop.png"),fullPage:true});passed("workspace rendered at 1440px with explicit fixture label");
  await page.getByLabel("Confirmo autorização",{exact:false}).check();
  await page.getByRole("button",{name:"Iniciar gravação"}).click();await page.getByText("Gravando",{exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector(".escuta-time")?.textContent!=="00:00");
  await page.getByRole("button",{name:"Pausar",exact:true}).click();await page.getByText("Pausado",{exact:true}).waitFor();
  await page.getByRole("button",{name:"Retomar",exact:true}).click();await page.getByText("Gravando",{exact:true}).waitFor();
  await page.waitForTimeout(1200);await page.getByRole("button",{name:"Finalizar",exact:true}).click();await page.getByText("Gravação encerrada",{exact:true}).waitFor();
  assert(await page.evaluate(()=>window.qaTracks.length>0&&window.qaTracks.every(t=>t.readyState==="ended")));passed("real browser MediaStream and AudioWorklet start/pause/resume/stop; all virtual tracks ended");
  const audioBytes=await page.locator("audio").evaluate(async audio=>(await(await fetch(audio.src)).arrayBuffer()).byteLength);assert(audioBytes>16000);passed("playback contains captured WAV bytes, not decorative waveform");
  await page.getByRole("button",{name:"Transcrever e gerar anamnese",exact:true}).click();await page.getByRole("heading",{name:"3. Anamnese para revisão"}).waitFor();
  assert(calls.some(c=>c.body.action==="transcribe"&&c.body.audio.length>16000));assert(calls.some(c=>c.body.action==="generate"&&c.body.transcript.includes("investigação")));passed("UI sends captured bytes then returned transcript to distinct fixture phases");
  const review=page.getByLabel("Conferi o conteúdo",{exact:false});await review.check();await page.getByRole("textbox",{name:"Hipóteses explicitamente mencionadas",exact:true}).fill("Rascunho editado para teste de revisão.");assert.equal(await review.isChecked(),false);passed("editing invalidates reviewed status");
  const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar JSON",exact:true}).click();const download=await downloadPromise;const parsed=JSON.parse(readFileSync(await download.path(),"utf8"));assert.equal(parsed.unsigned,true);assert.equal(parsed.reviewed,false);passed("JSON download is parseable, unsigned and retains review state");
  await page.getByRole("combobox").selectOption("qa-patient-only");await review.check();await page.getByRole("button",{name:"Salvar rascunho revisado",exact:true}).click();await page.getByText(/Rascunho salvo no prontuário clínico/).waitFor();
  const save=calls.find(c=>c.path==="/api/live/documents");assert.equal(save.body.familyVisibility,false);assert.equal(save.body.status,"draft");assert.equal(save.body.patientId,"qa-patient-only");passed("save request uses existing document contract, draft and no family visibility (fixture persistence only)");
  await page.getByRole("button",{name:"Consultar histórico",exact:true}).click();await page.getByRole("button",{name:"Abrir versão",exact:true}).waitFor();await page.getByRole("button",{name:"Abrir versão",exact:true}).click();assert.equal(await review.isChecked(),false);passed("history opens fixture version and demands review again");
  await page.screenshot({path:join(out,"draft.png"),fullPage:true});
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));await page.screenshot({path:join(out,"mobile.png"),fullPage:true});passed("390px viewport without horizontal overflow");
  assert.deepEqual(errors,[]);passed("no uncaught browser errors during component flow");
  const denied=await browser.newContext();await denied.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException("QA permission denied","NotAllowedError");};});const deniedPage=await denied.newPage();await deniedPage.goto(origin);await deniedPage.getByLabel("Confirmo autorização",{exact:false}).check();await deniedPage.getByRole("button",{name:"Iniciar gravação"}).click();await deniedPage.getByText(/Microfone não autorizado/).waitFor();passed("simulated permission denial displays actionable error, no success");
  await denied.close();await context.close();report.status="passed";
}catch(error){report.status="failed";report.error=error.message;process.exitCode=1;console.error(error.message);}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));writeFileSync(join(out,"browser.json"),JSON.stringify(report,null,2));}

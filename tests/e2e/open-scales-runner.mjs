// E2E do runner real (Chromium): abre cada escala aberta/autoral, responde tudo, finaliza e confere aviso, registro e ausência de erros de console.
// Uso: npm run build:client && node --import tsx tests/e2e/open-scales-runner.mjs   (A/B = fatia)
import fs from "node:fs";
import { chromium } from "playwright";
import { startStaticServer, auditBrowserLaunchOptions, ACCEPTED_FIRST_VISIT_STORAGE } from "../../scripts/lib/browser-audit-runtime.mjs";
import { createSyntheticClinicalApi, SYNTHETIC_CREDENTIALS } from "../../scripts/lib/synthetic-clinical-api.mjs";
import { openScaleSpecs } from "../../client/src/data/openScalesIndex.ts";
const specs=openScaleSpecs.map((s)=>({id:s.id,authorial:!!s.authorial,items:s.def.domains.reduce((n,d)=>n+d.items.length,0),labels:s.def.labels.length})).slice(+process.env.A||0,+process.env.B||999);
const server=await startStaticServer("dist/public",{port:0,apiHandler:createSyntheticClinicalApi({patients:"empty"})});
const b=await chromium.launch(auditBrowserLaunchOptions());
const ctx=await b.newContext({viewport:{width:1000,height:1400},acceptDownloads:true});
await ctx.addInitScript(st=>{for(const [k,v] of Object.entries(st))localStorage.setItem(k,v);},ACCEPTED_FIRST_VISIT_STORAGE);
const login=await ctx.newPage();
await login.goto(`${server.origin}/#/testes-diretos`); await login.waitForLoadState("networkidle");
await login.waitForSelector("#login-email",{timeout:15000});
await login.locator("#login-email").fill(SYNTHETIC_CREDENTIALS.email); await login.locator("#login-password").fill(SYNTHETIC_CREDENTIALS.password);
await login.locator('[data-testid="login-form"] button[type="submit"]').click(); await login.waitForTimeout(3000);
const results=[]; const s_auth=(id)=>specs.find((x)=>x.id===id)?.authorial;
for(const s of specs){
  const p=login; p.removeAllListeners("console"); p.removeAllListeners("pageerror"); const errs=[]; p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,160));}); p.on("pageerror",e=>errs.push("PAGEERR "+e.message.slice(0,160)));
  const r={id:s.id,items:s.items,nlab:s.labels};
  try{
    await p.goto(`${server.origin}/#/generic-scale/${s.id}`,{waitUntil:"domcontentloaded"});
    await p.waitForSelector('[role="radiogroup"]',{timeout:12000});
    r.cards=await p.locator('[role="radiogroup"]').count();
    r.pre=(await p.locator("body").innerText());
    r.noticeVisible=/sem validação psicométrica/i.test(r.pre); delete r.pre;
    let done=0;
    for(let round=0;round<6;round++){
      const cnt=await p.locator('[role="radiogroup"]').count();
      for(let i=done;i<cnt;i++){ const g=p.locator('[role="radiogroup"]').nth(i); const n=await g.locator("label").count(); await g.locator("label").nth(i%n).click({timeout:4000}); }
      done=cnt; const more=p.getByRole("button",{name:/Carregar próximas perguntas/});
      if(await more.count()) await more.click(); else break;
      await p.waitForTimeout(300);
    }
    r.cards=done;
    await p.locator('[data-testid="button-submit"]').click(); await p.waitForTimeout(800);
    const body=await p.locator("#main-content").innerText(); await fs.promises.mkdir("/tmp/shots",{recursive:true});
    r.disc=/sem validação psicométrica/i.test(body)||r.noticeVisible; r.sum=/soma|total|pontos|média/i.test(body.toLowerCase()); r.print=await p.getByText(/imprimir|PDF|exportar/i).count();
    r.cutwords=/ponto de corte|alto risco|em risco|positivo para|rastreio positivo/i.test(body.replace(/sem ponto de corte[^.]*\./gi,""));
    if(process.env.SHOT){fs.mkdirSync("/tmp/shots",{recursive:true});await p.screenshot({path:`/tmp/shots/${s.id}.png`,fullPage:true});}
    if(process.env.DUMP) r.body=body.slice(0,1500);
  }catch(e){r.error=e.message.split("\n")[0]; try{fs.mkdirSync("/tmp/shots",{recursive:true});await p.screenshot({path:"/tmp/shots/ERR.png"});}catch{} try{r.body=(await p.locator("body").innerText()).slice(0,200);}catch{}}
  r.errs=errs.filter(e=>!/favicon|Failed to load resource|\/api\/|503/i.test(e)); console.log(s.id,r.error||"ok"); results.push(r);
}
await b.close(); await server.close();
fs.writeFileSync("/tmp/open-scales-runner.json",JSON.stringify(results,null,1));
const bad=results.filter(r=>r.error||r.cards!==r.items||(s_auth(r.id)&&!r.disc)||r.errs.length);
console.log("total",results.length,"bad",bad.length); for(const r of bad) console.log(JSON.stringify({id:r.id,error:r.error,cards:r.cards,items:r.items,disc:r.disc,errs:r.errs,body:r.body}));
console.log("cutwords:",results.filter(r=>r.cutwords).map(r=>r.id).join(","),"| sem sumario:",results.filter(r=>!r.sum).map(r=>r.id).join(","));

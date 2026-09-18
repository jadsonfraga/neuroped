import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { COPY, LANGUAGES, CONTACT } from '../../scripts/obs10-global/content.mjs';
let count=0;
const check=(value,message)=>{assert.ok(value,message);count++;};
const source=(p)=>readFileSync(p,'utf8');
const keys=(obj)=>Object.keys(obj).sort();
execFileSync(process.execPath,['scripts/obs10-global/render.mjs','--check']);
for(const l of LANGUAGES){
 const c=COPY[l.id], html=source(`client/public${l.path}index.html`), kit=source(`client/public/obs10-global/partner-kit-${l.id}.md`);
 assert.deepEqual(keys(c),keys(COPY.pt));count++;
 check(html.includes(`<html lang="${l.html}">`),'explicit HTML language');
 for(const other of LANGUAGES)check(html.includes(`hreflang="${other.html}"`),'all translated alternates linked');
 check(html.includes(c.disclaimer),'nonvalidation prominent');
 check(html.includes(c.factsNote),'presentation translation != protocol translation');
 check(html.includes(c.evidence[2][1]),'unknown benefits remain unknown');
 check(html.includes('<noscript>'),'no-JS explanation');
 check(html.includes(c.contactNote),'no automatic email claim');
 check(html.includes('mailto:'+CONTACT),'existing institutional email');
 check(html.includes('href="/#/avaliacao-pre-consulta-faixa-etaria"'),'clinical entry unchanged');
 check(html.includes("connect-src 'none'"),'no network permission from presentation');
 check((html.match(/data-demo-step=/g)||[]).length===12,'four steps x three scenarios');
 check((html.match(/<h1\b/g)||[]).length===1,'one main heading');
 check((html.match(/data-scenario=/g)||[]).length===3,'three synthetic scenarios');
 check(!/<(?:iframe|form|video|audio)\b/i.test(html),'no patients, uploads, media or external embed');
 check(!/type="(?:file|password|email)"/.test(html),'no patient or credential input');
 check(!/<script[^>]*>[^<]+<\/script>/.test(html),'no inline executable script');
 check(kit.includes(c.analysis),'analysis plan not results');
 check(kit.includes(c.email),'invitation template exported');
 check(c.scenarios.length===3 && new Set(c.scenarios.map(s=>s.id)).size===3,'unique scenarios');
 check(c.workflow.length===4&&c.steps.length===4&&c.pilotSteps.length===4,'four-stage structure');
 check(c.criteria.length===6,'prospective criteria for pilot');
 for(const s of c.scenarios){assert.deepEqual(keys(s),keys(COPY.pt.scenarios[0]));count++;check(html.includes(s.response),'synthetic note rendered');check(html.includes(s.limit),'interpretation limit rendered');}
 for(const criterion of c.criteria)check(kit.includes(criterion),'no empty missing criterion');
}
const js=source('client/public/obs10-global/site.js');
for(const forbidden of [/\bfetch\s*\(/,/\b(?:localStorage|sessionStorage|indexedDB)\s*\./,/getUserMedia\s*\(/,/\b(?:eval|WebSocket|XMLHttpRequest)\s*\(/,/innerHTML\s*=/,/sendBeacon\s*\(/])check(!forbidden.test(js),'no data capture, hidden write or HTML injection');
check(js.length<6000,'no framework weight added to public site');
check(source('client/public/obs10-global/site.css').includes('prefers-reduced-motion'),'reduced-motion support');
const rewrite=JSON.parse(source('vercel.json')).rewrites[0].source;
const regexp=new RegExp('^'+rewrite+'$');
for(const p of ['/obs10-global','/obs10-global/','/obs10-global/en/','/obs10-global/site.js','/obs10-global/partner-kit-en.md','/api/health'])check(!regexp.test(p),'public files and API not rewritten to clinical shell');
for(const p of ['/','/other','/obs10-global-fake','/something/obs10-global/'])check(regexp.test(p),'only exact namespace excluded');
// Real service-worker fetch handler is exercised, not a copy of its condition.
const handlers={};
const ctx={URL,console,importScripts(){},self:{addEventListener:(k,fn)=>handlers[k]=fn},caches:{open:async()=>({match:async()=>undefined,put:async()=>{}})},fetch:async()=>({ok:true,clone(){return this;}}),Response};
vm.runInNewContext(source('client/public/sw.js'),ctx);
for(const p of ['/obs10-global','/obs10-global/en/','/obs10-global/site.js','/api/health']){let intercepted=false;handlers.fetch({request:{url:'https://test.invalid'+p,method:'GET'},respondWith(){intercepted=true;}});check(!intercepted,'SW passes independent site and clinical API to network');}
let rootIntercepted=false;handlers.fetch({request:{url:'https://test.invalid/',method:'GET'},respondWith(){rootIntercepted=true;}});check(rootIntercepted,'existing app strategy retained');
console.log(`OBS-10 global: ${count} language, provenance, no-data and routing checks passed.`);

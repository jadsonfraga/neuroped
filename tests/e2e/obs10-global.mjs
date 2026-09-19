/** Static public presentation served from the real production build. No patient or auth fixtures. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { auditBrowserLaunchOptions } from '../../scripts/lib/browser-audit-runtime.mjs';
import { LANGUAGES, COPY } from '../../scripts/obs10-global/content.mjs';
const root=resolve(process.env.OBS_GLOBAL_ROOT||'dist/public');
const dir=process.env.OBS_GLOBAL_ARTIFACT_DIR||'/tmp/obs10-global';
await mkdir(dir,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.md':'text/markdown','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+path);if(!file.startsWith(root+sep)&&file!==root){res.writeHead(403).end();return;}if(statSync(file).isDirectory())file=resolve(file,'index.html');res.writeHead(200,{'Content-Type':(mime[extname(file)]||'text/plain')+'; charset=utf-8','Cache-Control':'no-store','Permissions-Policy':'camera=(), microphone=(), geolocation=()'}).end(readFileSync(file));}catch{res.writeHead(404).end('Not found');}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch(auditBrowserLaunchOptions());
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();const errors=[],requests=[],screens=[];let stages=0;
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
async function shot(name){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${name}: no overflow`);const a=await new AxeBuilder({page}).analyze();await writeFile(`${dir}/${name}-axe.json`,JSON.stringify(a.violations,null,2));assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${name}: accessibility`);await page.screenshot({path:`${dir}/${name}.png`,fullPage:true});screens.push(name);}
try{
 for(const lang of LANGUAGES){
  const c=COPY[lang.id];const response=await page.goto(origin+lang.path);assert.equal(response.status(),200);assert.equal(await page.locator('html').getAttribute('lang'),lang.html);assert.equal(await page.title(),c.title);
  assert.equal(await page.locator('.demo-case:visible').count(),1);
  for(const scenario of c.scenarios){await page.selectOption('#scenario',scenario.id);assert.equal(await page.locator('[data-step-button="0"]').getAttribute('aria-current'),'step');
   for(let i=0;i<4;i++){await page.locator(`[data-step-button="${i}"]`).click();assert.equal(await page.locator('.demo-case:visible [data-demo-step]:visible').getAttribute('data-demo-step'),String(i));assert.ok((await page.locator('.demo-case:visible').innerText()).includes(scenario.label));stages++;}
  }
  await page.locator('#reset').click();assert.equal(await page.locator('#previous').isDisabled(),true);assert.equal(await page.locator('#next').isDisabled(),false);
  const downloaded=page.waitForEvent('download');await page.locator('#kit-download').click();const dl=await downloaded;await dl.saveAs(`${dir}/partner-kit-${lang.id}.md`);assert.equal(await readFile(`${dir}/partner-kit-${lang.id}.md`,'utf8'),readFileSync(resolve(root,`obs10-global/partner-kit-${lang.id}.md`),'utf8'));
  const contact=await page.locator('#contact').getAttribute('href');assert.ok(contact.startsWith('mailto:'));assert.equal(new URL(contact).searchParams.get('body'),c.email);
  await shot(`${lang.id}-desktop`);await page.setViewportSize({width:390,height:844});await shot(`${lang.id}-mobile`);await page.setViewportSize({width:1440,height:1000});
  await page.locator('.languages a').filter({hasText:LANGUAGES[(LANGUAGES.indexOf(lang)+1)%3].name}).click();assert.equal(await page.locator('html').getAttribute('lang'),LANGUAGES[(LANGUAGES.indexOf(lang)+1)%3].html);
 }
 // Keyboard operation uses native buttons/select, including a reset with visible focus.
 await page.goto(origin+'/obs10-global/en/');await page.locator('#next').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-step-button="1"]').getAttribute('aria-current'),'step');await page.locator('#reset').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#scenario').evaluate(el=>el===document.activeElement),true);
 const nojs=await browser.newContext({javaScriptEnabled:false});const staticPage=await nojs.newPage();await staticPage.goto(origin+'/obs10-global/en/');assert.equal(await staticPage.locator('.demo-case:visible').count(),3);assert.equal(await staticPage.locator('[data-demo-step]:visible').count(),12);assert.equal(await staticPage.locator('#kit-download').isVisible(),true);await nojs.close();
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');await page.emulateMedia({media:'print'});assert.equal(await page.locator('[data-demo-step]:visible').count(),12);await page.emulateMedia({media:'screen'});
 assert.deepEqual(errors,[]);assert.equal(requests.filter(r=>r.method!=='GET'||!r.url.startsWith(origin)||new URL(r.url).pathname.startsWith('/api/')).length,0,'no API, cross-origin or write requests');assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.deepEqual(await context.cookies(),[]);
 await writeFile(`${dir}/result.json`,JSON.stringify({passed:true,stages,screens,errors,networkRequests:requests.length,clinicalRequests:0,dataWrites:0,noJS:true,keyboard:true,scope:'Three-language editorial showcase and fictional demo; not clinical validation.'},null,2));console.log('OBS-10 global: 36 scenario stages, 6 a11y screens, no-JS, keyboard, downloads and no-data boundary passed.');
}catch(error){await page.screenshot({path:`${dir}/failure.png`,fullPage:true});await writeFile(`${dir}/failure.txt`,String(error.stack||error));throw error;}
finally{await context.close();await browser.close();await new Promise((r,j)=>server.close(e=>e?j(e):r()));}

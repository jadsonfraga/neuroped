import assert from "node:assert/strict";
import { chromium } from "playwright";

/** Actual deployed frontend, virtual microphone with fictional speech, real APIs. No network interception. */
export async function verifyCloudBrowser({origin, password, patientId, microphoneFile, audioSeconds, out}) {
  const browser = await chromium.launch({headless:true,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream",`--use-file-for-fake-audio-capture=${microphoneFile}`,"--autoplay-policy=no-user-gesture-required"]});
  try {
    const context = await browser.newContext({viewport:{width:1365,height:1000},permissions:["microphone"]});
    // Only introductory UI preferences. No auth token, user, tenant or API result is fabricated.
    await context.addInitScript(()=>{localStorage.setItem("np_tour_intro_v2","1");localStorage.setItem("np_tour_v2_done","1");});
    const page = await context.newPage(); page.setDefaultTimeout(120000);
    page.on("dialog", dialog=>dialog.accept());
    await page.goto(`${origin}/#/login`);
    await page.locator('input[type="email"]').fill("alpha@escuta.invalid");
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button",{name:"Entrar com segurança",exact:true}).click();
    await page.waitForFunction(()=>!window.location.hash.includes("/login"));
    await page.goto(`${origin}/#/escuta-clinica`);
    await page.getByRole("heading",{name:"Escuta Clínica",exact:true}).waitFor();
    await page.getByText("Processamento habilitado",{exact:true}).waitFor();
    await page.getByLabel("Confirmo autorização",{exact:false}).check();
    await page.getByRole("button",{name:"Iniciar gravação"}).click();
    await page.getByText("Gravando",{exact:true}).waitFor();
    await page.waitForFunction(min=>{const text=document.querySelector(".escuta-time")?.textContent||"00:00";const [m,s]=text.split(":").map(Number);return m*60+s>=min;},Math.ceil(audioSeconds)+1);
    await page.getByRole("button",{name:"Finalizar",exact:true}).click();
    await page.getByText("Gravação encerrada",{exact:true}).waitFor();
    await page.getByRole("button",{name:"Transcrever e gerar anamnese",exact:true}).click();
    await page.getByRole("heading",{name:"3. Anamnese para revisão",exact:true}).waitFor();
    const transcript=await page.getByRole("textbox",{name:"Transcrição da consulta",exact:true}).inputValue();
    assert(transcript.length>40,"UI transcrição real insuficiente");
    const section=page.locator(".escuta-document textarea").first();
    const text=await section.inputValue();assert(text.length>5);
    await page.getByLabel("Paciente do prontuário",{exact:false}).selectOption(patientId);
    await page.getByLabel("Conferi o conteúdo",{exact:false}).check();
    await page.getByRole("button",{name:"Salvar rascunho revisado",exact:true}).click();
    await page.getByText(/Rascunho salvo no prontuário clínico/).waitFor();
    await page.reload();
    await page.getByRole("heading",{name:"Escuta Clínica",exact:true}).waitFor();
    await page.getByLabel("Paciente do prontuário",{exact:false}).selectOption(patientId);
    await page.getByRole("button",{name:"Consultar histórico",exact:true}).click();
    await page.getByRole("button",{name:"Abrir versão",exact:true}).first().click();
    await page.getByRole("heading",{name:"3. Anamnese para revisão",exact:true}).waitFor();
    assert.equal(await page.locator(".escuta-document textarea").first().inputValue(),text,"UI não restaurou o texto efetivamente salvo");
    assert.equal(await page.getByLabel("Conferi o conteúdo",{exact:false}).isChecked(),false);
    await page.screenshot({path:`${out}/deployed-desktop.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`${out}/deployed-mobile.png`,fullPage:true});
    await context.close();
    return {passed:true,providerMocked:false,authenticationMocked:false,persistenceMocked:false,microphone:"virtual with synthetic Portuguese speech",transcriptCharacters:transcript.length,restoredAfterReload:true};
  } finally {await browser.close();}
}

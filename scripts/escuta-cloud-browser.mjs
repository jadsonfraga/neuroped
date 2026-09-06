import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

// Cada espera nomeia o próprio passo. Sem isso, "waitForFunction: Timeout"
// no CI não distingue login recusado de gravador que nunca partiu.
async function step(name, action) {
  try { return await action(); }
  catch (error) { if (error instanceof Error && !error.escutaStep) error.escutaStep = name; throw error; }
}

// Corrida sem rejeição órfã: o perdedor ainda rejeita depois do vencedor.
function first(promises) {
  const winner = Promise.race(promises);
  promises.forEach(promise => promise.catch(() => {}));
  return winner;
}

/** Deployed frontend, virtual microphone with fictional speech, real APIs. No network interception. */
export async function verifyCloudBrowser({origin,password,patientId,microphoneFile,audioSeconds,out}) {
  const browser=await chromium.launch({headless:true,args:["--use-fake-device-for-media-stream","--use-fake-ui-for-media-stream",`--use-file-for-fake-audio-capture=${microphoneFile}`,"--autoplay-policy=no-user-gesture-required"]});
  let page=null;
  try {
    const context=await browser.newContext({viewport:{width:1365,height:1000},permissions:["microphone"]});
    // Introductory UI preferences only. Auth, tenant, legal notice and API responses are not fabricated.
    await context.addInitScript(()=>{localStorage.setItem("np_tour_intro_v2","1");localStorage.setItem("np_tour_v2_done","1");});
    page=await context.newPage();page.setDefaultTimeout(120000);
    page.on("dialog",dialog=>dialog.accept());
    await step("abrir a tela de login publicada",()=>page.goto(`${origin}/#/login`));
    // Follow the actual first-visit notice, without force-clicking through its overlay.
    await step("aceitar o aviso de primeira visita",async()=>{
      await page.getByTestId("button-aviso-aceitar").click();
      await page.getByRole("dialog",{name:"Aviso importante",exact:true}).waitFor({state:"hidden"});
    });
    await step("submeter o login profissional",async()=>{
      await page.locator('input[type="email"]').fill("alpha@escuta.invalid");
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button",{name:"Entrar com segurança",exact:true}).click();
    });
    // A própria tela publica o motivo da recusa: falhar com ele vale mais do
    // que esperar 120 s pelo hash que nunca vai mudar.
    const loginAlert=page.getByRole("alert");
    await step("sair da rota de login após autenticar",()=>first([
      page.waitForFunction(()=>!window.location.hash.includes("/login")),
      loginAlert.waitFor({state:"visible"}).then(async()=>{throw new Error(`login recusado pela UI: ${(await loginAlert.innerText()).trim()}`);}),
    ]));
    await step("abrir a Escuta Clínica autenticada",async()=>{
      await page.goto(`${origin}/#/escuta-clinica`);
      await page.getByRole("heading",{name:"Escuta Clínica",exact:true}).waitFor();
      await page.getByText("Processamento habilitado",{exact:true}).waitFor();
    });
    await step("iniciar a gravação pelo microfone virtual",async()=>{
      await page.getByLabel("Confirmo autorização",{exact:false}).check();
      await page.getByRole("button",{name:"Iniciar gravação"}).click();
      await page.getByText("Gravando",{exact:true}).waitFor();
    });
    const target=Math.ceil(audioSeconds)+1;
    // O estado do gravador é a única fonte que explica um relógio parado.
    await step(`relógio do gravador alcançar ${target}s`,()=>first([
      page.waitForFunction(min=>{const text=document.querySelector(".escuta-time")?.textContent||"00:00";const [m,s]=text.split(":").map(Number);return m*60+s>=min;},target),
      page.locator(".escuta-recorder p").filter({hasText:/^(Pronto para gravar|Pausado|Gravação encerrada)$/}).waitFor({state:"visible"})
        .then(async()=>{throw new Error(`gravador saiu de "Gravando" antes de ${target}s: ${(await page.locator(".escuta-recorder p").innerText()).trim()}`);}),
    ]));
    await step("encerrar a gravação",async()=>{
      await page.getByRole("button",{name:"Finalizar",exact:true}).click();
      await page.getByText("Gravação encerrada",{exact:true}).waitFor();
    });
    await step("transcrever e gerar a anamnese pela IA nativa",async()=>{
      await page.getByRole("button",{name:"Transcrever e gerar anamnese",exact:true}).click();
      await page.getByRole("heading",{name:"3. Anamnese para revisão",exact:true}).waitFor();
    });
    const transcript=await page.getByRole("textbox",{name:"Transcrição da consulta",exact:true}).inputValue();assert(transcript.length>40,"UI transcrição real insuficiente");
    const section=page.locator(".escuta-document textarea").first();const text=await section.inputValue();assert(text.length>5);
    await step("salvar o rascunho revisado no prontuário",async()=>{
      await page.getByLabel("Paciente do prontuário",{exact:false}).selectOption(patientId);
      await page.getByLabel("Conferi o conteúdo",{exact:false}).check();
      await page.getByRole("button",{name:"Salvar rascunho revisado",exact:true}).click();
      await page.getByText(/Rascunho salvo no prontuário clínico/).waitFor();
    });
    await step("restaurar a versão salva após recarregar",async()=>{
      await page.reload();
      await page.getByRole("heading",{name:"Escuta Clínica",exact:true}).waitFor();
      await page.getByLabel("Paciente do prontuário",{exact:false}).selectOption(patientId);
      await page.getByRole("button",{name:"Consultar histórico",exact:true}).click();
      await page.getByRole("button",{name:"Abrir versão",exact:true}).first().click();
      await page.getByRole("heading",{name:"3. Anamnese para revisão",exact:true}).waitFor();
    });
    assert.equal(await page.locator(".escuta-document textarea").first().inputValue(),text,"UI não restaurou o texto efetivamente salvo");
    assert.equal(await page.getByLabel("Conferi o conteúdo",{exact:false}).isChecked(),false);
    await page.screenshot({path:`${out}/deployed-desktop.png`,fullPage:true});
    await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`${out}/deployed-mobile.png`,fullPage:true});
    await context.close();
    return {passed:true,providerMocked:false,authenticationMocked:false,persistenceMocked:false,firstVisitNoticeAcknowledgedThroughUI:true,microphone:"virtual with synthetic Portuguese speech",transcriptCharacters:transcript.length,restoredAfterReload:true};
  } catch(error) {
    // Preserve the error while redacting fill() values before the caller serializes it.
    const redact=value=>typeof value==="string"?value.split(password).join("[REDACTED]"):value;
    if(page){
      // O estado visível no instante da falha é o que falta no relatório do CI.
      const observed=await page.evaluate(()=>({
        hash:location.hash,
        recorder:document.querySelector(".escuta-recorder p")?.textContent??null,
        timer:document.querySelector(".escuta-time")?.textContent??null,
        alerts:Array.from(document.querySelectorAll('[role="alert"]')).map(node=>node.textContent?.trim()).filter(Boolean),
      })).catch(()=>null);
      await page.screenshot({path:`${out}/deployed-failure.png`,fullPage:true}).catch(()=>{});
      writeFileSync(`${out}/browser-failure.json`,redact(JSON.stringify({
        step:error instanceof Error?error.escutaStep??null:null,
        message:error instanceof Error?error.message:String(error),
        observed,
      },null,2)));
    }
    if(error instanceof Error) {
      error.message=redact(error.message);
      if(error.stack)error.stack=redact(error.stack);
    }
    throw error;
  } finally {await browser.close();}
}

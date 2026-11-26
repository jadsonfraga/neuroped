/** Only synthetic Chromium/Pages/D1. No signing or certificate persistence. */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import forge from "node-forge";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import { chromium } from "playwright";
import { ACCEPTED_FIRST_VISIT_STORAGE, auditBrowserLaunchOptions } from "../../scripts/lib/browser-audit-runtime.mjs";

const base = new URL(process.env.LIVE_DISCOVERY_URL);
assert.ok(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname));
assert.ok(process.env.LIVE_DISCOVERY_EMAIL?.endsWith("@example.test"));
const password = randomBytes(18).toString("hex");
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01";
cert.validity.notBefore = new Date(Date.now() - 3600000);
cert.validity.notAfter = new Date(Date.now() + 3600000);
const attrs = [{ name: "commonName", value: "QA FICTICIO NAO ICP NAO DISPENSAR" }];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey, forge.md.sha256.create());
const pfx = forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password, { algorithm: "3des" }));
const buffer = Buffer.from(pfx.getBytes(),"binary");
const browser = await chromium.launch(auditBrowserLaunchOptions());
try {
  const ctx = await browser.newContext({ acceptDownloads: true, serviceWorkers:"block" });
  await ctx.route("**/*", route => route.request().url().startsWith(base.origin + "/") ? route.continue() : route.abort());
  await ctx.addInitScript(storage => {
    for (const [key,value] of Object.entries(storage)) localStorage.setItem(key,value);
  }, ACCEPTED_FIRST_VISIT_STORAGE);
  const p = await ctx.newPage();
  p.setDefaultTimeout(12000);
  await p.goto(base.origin + "/?next=%2Freceita-c1-express#/login");
  await p.locator("#login-email").fill(process.env.LIVE_DISCOVERY_EMAIL);
  await p.locator("#login-password").fill(process.env.LIVE_DISCOVERY_PASSWORD);
  await p.getByTestId("login-form").locator("button[type=submit]").click();
  await p.getByTestId("input-paciente").waitFor();
  assert.equal(await p.getByRole("button",{name:"Assinar e baixar C1",exact:true}).count(), 0,
    "Express não pode oferecer assinatura sem validação independente");
  const downloaded = [];
  p.on("download", download => downloaded.push(download.suggestedFilename()));
  const remember = p.getByTestId("checkbox-remember-cert");
  if (await remember.count()) await remember.uncheck();
  await p.locator('input[type="file"]').setInputFiles({name:"qa-only.p12", mimeType:"application/x-pkcs12", buffer});
  for (const [id,value] of Object.entries({
    "input-cpf":"FICTICIO-TESTE-INVALIDO",
    "input-paciente":"SIMULACAO NAO DISPENSAR",
    "input-idade-paciente":"5 anos",
    "input-doses-por-dia":"1",
    "input-medicamento":"SUBSTANCIA INEXISTENTE PARA TESTE",
    "textarea-instrucoes":"TESTE DE SOFTWARE. NAO ADMINISTRAR. NAO DISPENSAR.",
  })) await p.getByTestId(id).fill(value);
  await p.locator("#senha-cert").fill(password);
  await p.locator("#senha-cert").press("Enter");
  await p.getByRole("button",{name:"Verificar",exact:true}).click();
  await p.getByText(/Certificado lido localmente/).waitFor();
  assert.deepEqual(downloaded,[]);
  const next = p.waitForEvent("download");
  await p.getByRole("button",{name:"PDF sem assinatura",exact:true}).click();
  const draft = await next;
  try {
    const bytes = await readFile(await draft.path());
    const pdf = await PDFDocument.load(bytes);
    assert.equal(pdf.getPageCount(),2);
    assert.ok(!pdf.context.enumerateIndirectObjects().some(([,dict]) => dict instanceof PDFDict &&
      ["Type","FT"].some(key => dict.get(PDFName.of(key))?.toString() === "/Sig")));
    assert.doesNotMatch(draft.suggestedFilename(),/-assinad[oa]\.pdf$/);
  } finally { await draft.delete(); }
  await p.goto(base.origin + "/#/receita-c1?patientId=audit-patient-155");
  const sign = p.getByTestId("button-sign");
  await sign.waitFor();
  await p.getByTestId("signing-blocked").getByText(/não verifica a assinatura qualificada/).waitFor();
  const pick = p.getByTestId("input-p12");
  await pick.setInputFiles({name:"qa-only.p12",mimeType:"application/x-pkcs12", buffer});
  const code = p.getByTestId("input-p12-senha");
  await code.fill(password);
  assert.equal(await sign.isDisabled(),true);
  await code.press("Enter");
  assert.equal(await sign.isDisabled(),true);
  assert.equal(downloaded.length,1,"somente o rascunho Express foi baixado");
  await ctx.close();
  console.log("C1: Express e via vinculada não emitem; conferência local e PDF de rascunho com duas vias preservados.");
} finally { await browser.close(); }

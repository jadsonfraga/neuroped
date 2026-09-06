import { mkdirSync,writeFileSync } from "node:fs";
// Alternative service only; never bypasses a Cloudflare authorization denial.
// Uses the existing Gemini key already referenced by repository workflows.
const key=process.env.GEMINI_API_KEY?.trim();
const report={scope:"existing authorized Gemini provider preflight; no clinical data",status:"running",keyPresent:Boolean(key)};
try{
  if(!key)throw new Error("BLOCKED_EXTERNAL_GEMINI_KEY_NOT_CONFIGURED");
  const headers={"x-goog-api-key":key,"Content-Type":"application/json"};
  const models=await fetch("https://generativelanguage.googleapis.com/v1beta/models",{headers,signal:AbortSignal.timeout(20000)});
  report.modelsHttp=models.status;
  if(!models.ok)throw new Error(`BLOCKED_EXTERNAL_GEMINI_MODELS_HTTP_${models.status}`);
  const data=await models.json();
  const available=new Set((data.models||[]).map(m=>m.name.replace(/^models\//,"")));
  const model=["gemini-3.8-flash","gemini-3.7-flash","gemini-2.5-flash"].find(m=>available.has(m));
  if(!model)throw new Error("BLOCKED_EXTERNAL_GEMINI_MODEL_NOT_AVAILABLE");
  report.model=model;
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers,signal:AbortSignal.timeout(60000),body:JSON.stringify({contents:[{role:"user",parts:[{text:'Teste fictício de disponibilidade de extração. Extraia literalmente a frase entre aspas sem acrescentar diagnóstico: "o diagnóstico ainda está em investigação". Responda apenas com JSON {"texto": "..."}.'}]}],generationConfig:{temperature:0,responseMimeType:"application/json",maxOutputTokens:2048}})});
  report.generationHttp=response.status;
  if(!response.ok)throw new Error(`BLOCKED_EXTERNAL_GEMINI_GENERATION_HTTP_${response.status}`);
  const body=await response.json();const text=(body.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||"").join("");
  const parsed=JSON.parse(text);if(parsed.texto!=="o diagnóstico ainda está em investigação")throw new Error("GEMINI_EXTRACTION_ASSERTION_FAILED");
  report.status="passed";report.syntheticOutput=parsed;console.log("PASS existing Gemini provider credential and actual structured extraction request.");
}catch(error){report.status="blocked_or_failed";report.reason=error instanceof Error?error.message:"UNKNOWN_FAILURE";console.error(report.reason);process.exitCode=2;}
finally{mkdirSync("artifacts/escuta",{recursive:true});writeFileSync("artifacts/escuta/gemini-preflight.json",JSON.stringify(report,null,2));}

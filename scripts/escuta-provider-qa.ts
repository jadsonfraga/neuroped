import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { SYSTEM_PROMPT, NOTE_SCHEMA, validateNote, validateWav, encodeWav } from "../shared/escuta/core.ts";
// Só aceita o fixture sintético gerado no CI. Nunca lê pacientes, chaves locais ou dados do aplicativo.
const token = process.env.CLOUDFLARE_API_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const dir = "artifacts/escuta"; mkdirSync(dir,{recursive:true});
const report: Record<string,unknown> = { scope: "native-provider round trip with synthetic speech; not clinical production E2E", status: "running", date: new Date().toISOString() };
async function run(model: string, input: Record<string,unknown>) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${model}`, { method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(input),signal:AbortSignal.timeout(100000) });
  report[model] = { httpStatus:response.status };
  if(!response.ok) throw new Error(`BLOCKED_EXTERNAL_CLOUDFLARE_AI_HTTP_${response.status}`);
  const body = await response.json() as { success:boolean;result?:Record<string,unknown> };
  if(!body.success || !body.result) throw new Error("INVALID_PROVIDER_ENVELOPE");
  return body.result;
}
try {
  if(!token || !account) throw new Error("BLOCKED_EXTERNAL_CLOUDFLARE_AI_CREDENTIALS");
  const raw = readFileSync("/tmp/escuta-fixture.pcm"); const pcm = new Int16Array(raw.length/2); for(let i=0;i<pcm.length;i++)pcm[i]=raw.readInt16LE(i*2);
  const wav=encodeWav(pcm); report.audio=validateWav(wav);
  const stt=await run("@cf/openai/whisper-large-v3-turbo",{audio:Buffer.from(wav).toString("base64"),language:"pt",task:"transcribe",vad_filter:true,condition_on_previous_text:false});
  if(typeof stt.text!=="string" || stt.text.length<40)throw new Error("EMPTY_REAL_TRANSCRIPTION");
  const result=await run("@cf/meta/llama-3.3-70b-instruct-fp8-fast",{messages:[{role:"system",content:SYSTEM_PROMPT},{role:"user",content:JSON.stringify({transcript:stt.text})}],temperature:0,max_tokens:6500,response_format:{type:"json_schema",json_schema:NOTE_SCHEMA}});
  const note=validateNote(result.response,stt.text); report.status="passed";report.transcript=stt.text;report.note=note;
  console.log("PASS native speech-to-text -> structured note, real provider requests with synthetic audio only.");
} catch(error) {
  report.status="blocked_or_failed";report.reason=error instanceof Error?error.message:"UNKNOWN_FAILURE";
  console.error(String(report.reason));process.exitCode=2;
} finally {writeFileSync(`${dir}/provider.json`,JSON.stringify(report,null,2));}

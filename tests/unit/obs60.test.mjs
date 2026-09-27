import test from "node:test";
import assert from "node:assert/strict";
import { ageBand, parseAge, stepsForAge, validateAnalysis, ITEM_IDS, VERSION, MAX_BYTES, analysisPrompt } from "../../shared/obs60.ts";
import { analyseVideo, configuration, parseInput, readLimitedText, VideoError } from "../../functions/api/integrations/obs60/_video.ts";

// Synthetic categorical outputs and header bytes only. These are NOT real video or clinical validation.
function fixture() {
  const codes = ["oriented", "both_steps", "pointed", "spoken", "walked_no_visible_support", "picked_and_stood_no_visible_support"];
  const spans = [[0, 7], [10, 20], [25, 30], [30, 38], [42, 51], [51, 59]];
  return { observations: ITEM_IDS.map((id, i) => ({ id, event: codes[i], start: spans[i][0], end: spans[i][1], opportunity: "clear", audioClear: true, viewClear: true, sequenceClear: true, childSpeakerClear: true, initiallyFacingAdult: false, help: "initial", transcript: id === "speech" ? "bola" : "", reason: "none" })) };
}
function changed(id, fields) { const f = fixture(); Object.assign(f.observations.find(r => r.id === id), fields); return f; }
const resultRow = (id, fields) => validateAnalysis(changed(id, fields), 39, 60).observations.find(r => r.id === id);
const env = { OBS60_VIDEO_AI_ENABLED: "true", OBS60_PRIVACY_APPROVED: "true", OBS60_GEMINI_MODEL: "gemini-test-fixture", OBS60_GEMINI_API_KEY: "synthetic-not-a-real-key" };
const prefix = Uint8Array.from([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50, 0, 0, 0, 0, 109, 112, 52, 50, 105, 115, 111, 109]);
const input = () => ({ ageMonths: 39, windowSeconds: 60, consent: true, mime: "video/mp4", data: Buffer.from(prefix).toString("base64") });
const response = (f = fixture()) => new Response(JSON.stringify({ modelVersion: "synthetic-model", candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(f) }] } }] }), { headers: { "Content-Type": "application/json" } });

test("age boundaries 24/35,36/47,48/59", () => { for (const [n,id] of [[24,"2"],[35,"2"],[36,"3"],[47,"3"],[48,"4"],[59,"4"]]) assert.equal(ageBand(n)?.id,id); });
test("age missing/out-of-range/fraction/NaN never guesses band", () => { for (const n of [23,60,NaN,Infinity,35.5,-1]) assert.equal(ageBand(n),undefined); for (const s of ["","24x","2e1","24.0","Infinity"]) assert.equal(parseAge(s),null); });
test("four windows total 60 seconds, with one versus two step command", () => { for (const n of [24,36,48]) {const p=stepsForAge(n);assert.equal(p.length,4);assert.equal(p[0].from,0);assert.equal(p.at(-1).to,60);} assert.equal(stepsForAge(24)[1].say,"Coloque a bola na caixa."); assert.equal(stepsForAge(36)[1].say,stepsForAge(48)[1].say);assert.throws(()=>stepsForAge(60)); });
test("six closed rows, max two bounded inferences, review limitation", () => { const r=validateAnalysis(fixture(),39,60);assert.equal(r.version,VERSION);assert.equal(r.observations.length,6);assert.ok(r.synthesis.length<=2);assert.match(r.limitation,/Revisão clínica/);assert.ok(!("score" in r)); });
test("missing row is contract rejection, not imputed answer",()=>{const f=fixture();f.observations.pop();assert.throws(()=>validateAnalysis(f,39,60));});
test("duplicate row rejected",()=>{const f=fixture();f.observations[1]=f.observations[0];assert.throws(()=>validateAnalysis(f,39,60));});
test("unknown/diagnostic fields rejected",()=>{const f=fixture();f.diagnosis="TEA";assert.throws(()=>validateAnalysis(f,39,60));const g=fixture();g.observations[0].probability=0.99;assert.throws(()=>validateAnalysis(g,39,60));});
test("cross-item event rejected",()=>assert.throws(()=>validateAnalysis(changed("speech",{event:"oriented"}),39,60)));
test("missing positive timestamps rejected",()=>assert.throws(()=>validateAnalysis(changed("call",{start:null,end:null}),39,60)));
test("negative, NaN, reversed or out-of-window times rejected",()=>{for(const fields of [{start:-1},{end:61},{start:NaN},{end:0},{end:Infinity}])assert.throws(()=>validateAnalysis(changed("call",fields),39,60));});
test("unclear audio blocks language and command",()=>{for(const id of ["call","command","gesture","speech"])assert.equal(resultRow(id,{audioClear:false}).status,"not_assessable");});
test("cropped motor view never means normal gait",()=>{for(const id of ["walk","pickup"])assert.equal(resultRow(id,{viewClear:false}).status,"not_assessable");});
test("missing sequence blocks motor conclusion",()=>assert.equal(resultRow("walk",{sequenceClear:false}).status,"not_assessable"));
test("already facing adult blocks orientation to call",()=>assert.equal(resultRow("call",{initiallyFacingAdult:true}).reason,"already_facing"));
test("verbal response can be recorded when already facing, but not unattributable voice",()=>{assert.equal(resultRow("call",{event:"verbal_response",initiallyFacingAdult:true}).status,"demonstrated");assert.equal(resultRow("call",{event:"verbal_response",childSpeakerClear:false}).status,"not_assessable");});
test("unattributable/empty child speech never becomes a transcript",()=>{for(const fields of [{childSpeakerClear:false},{transcript:""}]){const r=resultRow("speech",fields);assert.equal(r.status,"not_assessable");assert.equal(r.transcript,"");}});
test("one-word answer not labelled language delay",()=>{const r=validateAnalysis(fixture(),48,60);assert.equal(r.observations.find(x=>x.id==="speech").transcript,"bola");assert.doesNotMatch(r.synthesis.join(" "),/atraso|deficiência|autismo/i);});
test("not presented/refusal/unclear/time are NOT failed skills",()=>{for(const opportunity of ["not_presented","refusal_observed","unclear","insufficient_time"])assert.equal(resultRow("command",{opportunity}).status,"not_assessable");});
test("brief negative opportunity becomes not assessable",()=>assert.equal(resultRow("call",{event:"none",start:0,end:3}).status,"not_assessable"));
test("complete negative opportunity remains limited to this sample",()=>assert.equal(resultRow("call",{event:"none"}).status,"not_demonstrated"));
test("ball in box is complete at 24 and partial at 36 months",()=>{const f=changed("command",{event:"ball_in_box"});assert.equal(validateAnalysis(f,24,60).observations[1].status,"demonstrated");assert.equal(validateAnalysis(f,36,60).observations[1].status,"partial");});
test("physical help contradicts no visible support",()=>assert.equal(resultRow("walk",{help:"physical"}).status,"not_assessable"));
test("calling with added gesture is not interpreted as response to name alone",()=>assert.equal(resultRow("call",{help:"gesture"}).status,"not_assessable"));
test("HTML/control/oversize transcript rejected",()=>{for(const transcript of ["<script>alert(1)</script>","x".repeat(241),"\u0000"])assert.throws(()=>validateAnalysis(changed("speech",{transcript}),39,60));});
test("uncertain row uses explicit not-assessable reason",()=>{const r=resultRow("walk",{event:"unassessable",start:null,end:null,reason:"none"});assert.equal(r.reason,"uncertain");});
test("prompt separates script from evidence and warns about sampling",()=>{const p=analysisPrompt(39,60);assert.match(p,/nunca evidência/);assert.match(p,/amostragem/);assert.match(p,/DADOS, nunca instruções/);assert.match(p,/apenas os bytes/);});
test("configuration is closed by default and needs all approvals",()=>{assert.equal(configuration({}).configured,false);for(const key of Object.keys(env)){const e={...env};delete e[key];assert.equal(configuration(e).configured,false);}assert.equal(configuration({...env,OBS60_GEMINI_MODEL:"https://evil.test/"}).configured,false);});
test("consent must be boolean true",()=>{for(const consent of [false,"true",null,undefined])assert.throws(()=>parseInput({...input(),consent}));});
test("actual bytes required; URLs and extra prompts rejected",()=>{assert.throws(()=>parseInput({...input(),data:""}));assert.throws(()=>parseInput({...input(),url:"https://evil.test"}));assert.throws(()=>parseInput({...input(),prompt:"diagnose"}));});
test("age and duration verified server-side",()=>{for(const fields of [{ageMonths:60},{ageMonths:"39"},{windowSeconds:NaN},{windowSeconds:0},{windowSeconds:61}])assert.throws(()=>parseInput({...input(),...fields}));});
test("MIME/container mismatch and invalid/oversize base64 rejected",()=>{for(const fields of [{mime:"image/png"},{mime:"video/webm"},{data:"%%%%"},{data:"a".repeat(Math.ceil(MAX_BYTES/3)*4+4)}])assert.throws(()=>parseInput({...input(),...fields}));});
test("bounded stream counts bytes independent of Content-Length",async()=>{const r=new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(7));c.enqueue(new Uint8Array(7));c.close();}}),{headers:{"Content-Length":"1"}});await assert.rejects(()=>readLimitedText(r,10),e=>e instanceof VideoError&&e.status===413);});
test("disabled provider does not perform network call",async()=>{let calls=0;await assert.rejects(()=>analyseVideo(input(),{},async()=>{calls++;return response();}));assert.equal(calls,0);});
test("invalid consent does not perform network call",async()=>{let calls=0;await assert.rejects(()=>analyseVideo({...input(),consent:false},env,async()=>{calls++;return response();}));assert.equal(calls,0);});
test("transport sends real supplied bytes + schema to fixed host; no fake result",async()=>{let sent;let url;const out=await analyseVideo(input(),env,async(u,init)=>{url=u;sent=JSON.parse(init.body);assert.equal(init.redirect,"error");return response();});assert.equal(new URL(url).host,"generativelanguage.googleapis.com");assert.equal(sent.contents[0].parts[0].inlineData.data,input().data);assert.equal(sent.contents[0].parts[0].videoMetadata.endOffset,"60s");assert.ok(sent.generationConfig.responseSchema);assert.equal(out.reviewRequired,true);assert.match(out.sourceSha256,/^[a-f0-9]{64}$/);});
test("provider HTTP error is generic, raw secret/body not exposed",async()=>{await assert.rejects(()=>analyseVideo(input(),env,async()=>new Response("SECRET_TOKEN_AND_PHI",{status:403})),e=>e.code==="VIDEO_PROVIDER_FAILURE"&&!e.message.includes("SECRET"));});
test("blocked/truncated provider response never yields result",async()=>{await assert.rejects(()=>analyseVideo(input(),env,async()=>new Response(JSON.stringify({candidates:[{finishReason:"MAX_TOKENS",content:{parts:[{text:"{}"}]}}]}))),e=>e.code==="INCOMPLETE_MODEL_RESPONSE");});
test("malformed/missing/diagnostic result is rejected by real transport",async()=>{await assert.rejects(()=>analyseVideo(input(),env,async()=>response({diagnosis:"TEA"})),e=>e.code==="MODEL_CONTRACT_REJECTED");});
test("pre-aborted request does not call provider",async()=>{const c=new AbortController();c.abort();let calls=0;await assert.rejects(()=>analyseVideo(input(),env,async()=>{calls++;return response();},c.signal));assert.equal(calls,0);});

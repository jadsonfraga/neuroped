import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../../client/public/audio/escuta-recorder.js",import.meta.url),"utf8");
let passed=0;
function make(rate=48000){let Type;const messages=[];class Base{constructor(){this.port={onmessage:null,postMessage:m=>messages.push(m)};}}const context={AudioWorkletProcessor:Base,sampleRate:rate,Int16Array,Math,registerProcessor:(_name,type)=>{Type=type;}};vm.runInNewContext(source,context);return {processor:new Type(),messages};}
function check(name,fn){fn();passed++;console.log(`PASS ${name}`);}
check("captura deriva de amostras reais e drena último bloco",()=>{const {processor:p,messages}=make();p.process([[new Float32Array(24000).fill(.1)]]);p.port.onmessage({data:"stop"});const pcm=messages.find(m=>m.pcm).pcm;assert.equal(pcm.length,8000);assert(pcm.every(v=>Math.abs(v-3277)<=1));assert.equal(messages.at(-1).ended,true);});
check("pausa exclui áudio e retomada preserva sequência",()=>{const {processor:p,messages}=make();p.process([[new Float32Array(24000).fill(.1)]]);p.port.onmessage({data:"pause"});p.process([[new Float32Array(48000).fill(.8)]]);p.port.onmessage({data:"resume"});p.process([[new Float32Array(24000).fill(.1)]]);p.port.onmessage({data:"stop"});assert.equal(messages.filter(m=>m.pcm).reduce((n,m)=>n+m.pcm.length,0),16000);});
check("resampling contínuo 44.1k sem zerar fase por frame",()=>{const {processor:p}=make(44100);for(let i=0;i<441;i++)p.process([[new Float32Array(100)]]);assert.equal(p.total,16000);});
check("limite artificial de contador fecha captura",()=>{const {processor:p,messages}=make();p.total=16000*3600-10;assert.equal(p.process([[new Float32Array(300)]]),false);assert.equal(messages.at(-1).limit,true);assert.equal(p.total,16000*3600);});
check("stop não aceita nova captura",()=>{const {processor:p}=make();p.port.onmessage({data:"stop"});assert.equal(p.process([[new Float32Array(48000)]]),false);assert.equal(p.total,0);});
console.log(`Escuta worklet: ${passed} testes passaram. Simulação do processador; não é microfone físico.`);

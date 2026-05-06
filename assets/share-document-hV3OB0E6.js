const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-CCN60Z39.js","./index-CYKyYC_X.css"])))=>i.map(i=>d[i]);
import{bs as u}from"./index-CCN60Z39.js";const m="drjadsonfraga@proton.me";function w(n,o,a,t){c(n,o);const e=new Blob([n],{type:"application/pdf"}),r=new File([e],o,{type:"application/pdf"});if(navigator.canShare?.({files:[r]})){navigator.share({title:a,text:`${a}

Dr. Jadson Fraga Araújo Júnior
CRM-PE 25227 | RQE 17756
www.drjadsonfraga.com`,files:[r]}).catch(()=>{l(a,t)});return}l(a,t)}function l(n,o){const a=o?.replace(/\D/g,"")||"",t=a.startsWith("55")?a:a?`55${a}`:"",e=encodeURIComponent(`📋 *${n}*

O PDF foi baixado no seu dispositivo.
Por favor, anexe o arquivo nesta conversa usando o clipe 📎.

Dr. Jadson Fraga Araújo Júnior
CRM-PE 25227 | RQE 17756
www.drjadsonfraga.com`),r=t?`https://wa.me/${t}?text=${e}`:`https://wa.me/?text=${e}`;window.open(r,"_blank")}async function f(n,o,a,t){try{const{apiRequest:d}=await u(async()=>{const{apiRequest:s}=await import("./index-CCN60Z39.js").then(p=>p.bz);return{apiRequest:s}},__vite__mapDeps([0,1]),import.meta.url),i=await d("POST","/api/laudo/salvar",{texto:t,dataFormatada:new Date().toLocaleDateString("pt-BR")});if((i.headers.get("content-type")||"").includes("application/json")&&(await i.json()).ok)return!0}catch{}c(n,o);const e=encodeURIComponent(a),r=encodeURIComponent(`${t}

---
PDF em anexo: ${o}
(O PDF foi baixado — anexe manualmente ao email)

Emitido via NeuroPed • www.drjadsonfraga.com`);return window.open(`mailto:${m}?subject=${e}&body=${r}`,"_blank"),!1}async function R(n,o,a,t){return c(n,o),{downloaded:!0,emailed:await f(n,o,`[NeuroPed] ${a}`,t)}}async function g(n,o,a,t){const e=new Blob([n],{type:"application/pdf"}),r=new File([e],o,{type:"application/pdf"});if(navigator.canShare?.({files:[r]}))try{await navigator.share({title:a,text:`${a}
Dr. Jadson Fraga • CRM-PE 25227`,files:[r]});return}catch{}w(n,o,a,t)}function c(n,o){const a=new Blob([n],{type:"application/pdf"}),t=URL.createObjectURL(a),e=document.createElement("a");e.href=t,e.download=o,document.body.appendChild(e),e.click(),setTimeout(()=>{URL.revokeObjectURL(t),e.remove()},2e3)}export{f as sendToProtonMail,g as shareDocument,R as shareDocumentComplete,w as shareViaPDFWhatsApp};

(function(){
'use strict';
const MK='neuroped_master_access_v1';
const K='np_consulta_livre_v1';
const LIB='np_consulta_livre_biblioteca_v1';
const TTL=12*60*60*1000;
function master(){try{const v=JSON.parse(localStorage.getItem(MK)||'{}');return v.ok&&Date.now()-Number(v.ts||0)<TTL}catch(e){return false}}
function g(id){return document.getElementById(id)}
function text(){return g('consultaLivreTexto')?.value||''}
function setText(v){if(g('consultaLivreTexto'))g('consultaLivreTexto').value=v||''}
function note(t){if(g('consultaLivreNote'))g('consultaLivreNote').textContent=t}
function save(){localStorage.setItem(K,JSON.stringify({text:text(),ts:Date.now()}));note('Rascunho salvo localmente.')}
function load(){try{return JSON.parse(localStorage.getItem(K)||'{}')}catch(e){return{}}}
function drafts(){try{return JSON.parse(localStorage.getItem(LIB)||'[]')}catch(e){return[]}}
function putDrafts(a){localStorage.setItem(LIB,JSON.stringify(a));renderDrafts()}
function esc(s){return String(s||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]))}
function copy(t){navigator.clipboard.writeText(t||text()).then(()=>note('Texto copiado.')).catch(()=>note('Não foi possível copiar.'))}
function printText(t){const w=window.open('','_blank');if(!w){note('Pop-up bloqueado.');return}w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>Consulta livre</title><style>body{font-family:Arial,sans-serif;padding:34px;line-height:1.55;color:#111}pre{white-space:pre-wrap;font:15px Arial,sans-serif}</style></head><body><pre>'+esc(t||text())+'</pre></body></html>');w.document.close();w.print()}
function insert(t){setText((text()?text()+'\n\n':'')+t);save()}
function header(){insert('Dr. Jadson Fraga Araújo Júnior\nNeuropediatria · CRM-PE 25227 · RQE 17756\nAv. Cardoso de Sá, 1000 – Bairro Novo Centro – Petrolina/PE\n\nData: '+new Date().toLocaleDateString('pt-BR'))}
function signature(){insert('Dr. Jadson Fraga Araújo Júnior\nCRM-PE 25227 · RQE 17756')}
function named(){const title=prompt('Nome do rascunho:')||'';if(!title.trim())return;const a=drafts();a.unshift({id:Date.now(),title:title.trim(),text:text(),at:new Date().toISOString()});putDrafts(a.slice(0,40));note('Rascunho nomeado salvo.')}
function openDraft(id){const x=drafts().find(i=>i.id===id);if(x){setText(x.text);save();note('Rascunho aberto.')}}
function duplicate(id){const x=drafts().find(i=>i.id===id);if(!x)return;const a=drafts();a.unshift({id:Date.now(),title:x.title+' copia',text:x.text,at:new Date().toISOString()});putDrafts(a.slice(0,40))}
function del(id){if(confirm('Apagar rascunho?'))putDrafts(drafts().filter(x=>x.id!==id))}
function exportJson(){const blob=new Blob([JSON.stringify({current:text(),drafts:drafts()},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='consulta-livre-neuroped.json';a.click()}
function renderDrafts(){const el=g('consultaLivreDrafts');if(!el)return;const a=drafts();el.innerHTML=a.length?a.map(x=>'<div class="app-card"><b>'+esc(x.title)+'</b><p class="muted">'+new Date(x.at).toLocaleString('pt-BR')+'</p><button class="btn ghost" onclick="NeuroPedConsultaLivre.open('+x.id+')">Abrir</button><button class="btn ghost" onclick="NeuroPedConsultaLivre.dup('+x.id+')">Duplicar</button><button class="btn ghost" onclick="NeuroPedConsultaLivre.copy('+x.id+')">Copiar</button><button class="btn ghost" onclick="NeuroPedConsultaLivre.print('+x.id+')">Imprimir</button><button class="btn wine" onclick="NeuroPedConsultaLivre.del('+x.id+')">Apagar</button></div>').join(''):'<p class="muted">Nenhum rascunho nomeado.</p>'}
function html(){return '<div class="card span12 no-print" id="consultaLivreModulo"><h2>Consulta médica livre</h2><p class="muted">Digite, cole ou dite livremente. Nada é obrigatório. Modelos apenas inserem texto editável.</p><textarea id="consultaLivreTexto" style="min-height:340px;font-size:16px;line-height:1.6" placeholder="Cole ou redija aqui qualquer texto da consulta, orientação, relatório ou documento."></textarea><div class="actions"><button class="btn gold" id="clCopy">Copiar</button><button class="btn ghost" id="clPrint">Imprimir/PDF</button><button class="btn" id="clSave">Salvar</button><button class="btn ghost" id="clNamed">Salvar nomeado</button><button class="btn ghost" id="clHeader">Cabeçalho</button><button class="btn ghost" id="clSign">Assinatura</button><button class="btn ghost" id="clExport">Exportar JSON</button></div><p id="consultaLivreNote" class="status">Editor livre protegido por PIN master.</p></div><div class="card span12 no-print"><h2>Biblioteca de rascunhos</h2><div id="consultaLivreDrafts"></div></div>'}
function inject(){if(!/consulta\.html/i.test(location.pathname))return false;if(!master())return false;if(g('consultaLivreModulo'))return true;const grid=document.querySelector('#app .grid')||document.querySelector('section#app .grid');if(!grid)return false;const tmp=document.createElement('div');tmp.innerHTML=html();while(tmp.firstChild)grid.insertBefore(tmp.lastChild,grid.firstChild);setText(load().text||'');g('clCopy').onclick=()=>copy();g('clPrint').onclick=()=>printText();g('clSave').onclick=save;g('clNamed').onclick=named;g('clHeader').onclick=header;g('clSign').onclick=signature;g('clExport').onclick=exportJson;g('consultaLivreTexto').addEventListener('input',save);renderDrafts();return true}
window.NeuroPedConsultaLivre={open:openDraft,dup:duplicate,del:del,copy:function(id){const x=drafts().find(i=>i.id===id);if(x)copy(x.text)},print:function(id){const x=drafts().find(i=>i.id===id);if(x)printText(x.text)}};
function boot(){if(inject())return;let n=0;const t=setInterval(()=>{n++;if(inject()||n>120)clearInterval(t)},700);const onClick=()=>{setTimeout(()=>{if(inject())document.removeEventListener('click',onClick,true)},150)};document.addEventListener('click',onClick,true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

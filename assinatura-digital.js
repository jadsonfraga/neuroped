(function(){
'use strict';
const KEY='np_assinatura_digital_registros_v1';
function enc(s){return new TextEncoder().encode(String(s||''))}
async function sha256Text(text){const b=await crypto.subtle.digest('SHA-256',enc(text));return hex(b)}
async function sha256File(file){const b=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return hex(b)}
function hex(buffer){return Array.from(new Uint8Array(buffer)).map(x=>x.toString(16).padStart(2,'0')).join('')}
function nowBR(){return new Date().toLocaleString('pt-BR')}
function dateFile(){return new Date().toISOString().slice(0,10)}
function getRegs(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
function setRegs(r){try{localStorage.setItem(KEY,JSON.stringify(r||[]));return true}catch(e){return false}}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function val(id){return document.getElementById(id)?.value||''}
function setHTML(id,html){const el=document.getElementById(id);if(el)el.innerHTML=html}
window.gerarRegistro=async function(){
  const tipo=val('docTipo'); const paciente=val('docPaciente').trim()||'sem identificação'; const texto=val('docTexto');
  if(!texto.trim()){setHTML('prepOut','<div class="warn">Cole ou digite o texto do documento antes de gerar o hash.</div>');return}
  const base=['NEUROPED SDG — REGISTRO DE DOCUMENTO','Tipo: '+tipo,'Paciente/controle: '+paciente,'Data/hora: '+nowBR(),'','CONTEÚDO','',''+texto].join('\n');
  const hash=await sha256Text(base);
  const item={id:'doc_'+Date.now(),tipo,paciente,createdAt:new Date().toISOString(),createdText:nowBR(),hash,chars:base.length};
  const regs=getRegs(); regs.unshift(item); setRegs(regs.slice(0,80));
  setHTML('prepOut','<div class="ok"><strong>Registro gerado.</strong><br>Tipo: '+esc(tipo)+'<br>Paciente/controle: '+esc(paciente)+'<br>Data: '+esc(item.createdText)+'</div><div class="hash">'+hash+'</div><div class="actions"><button class="btn ghost" onclick="copiarHash(\''+hash+'\')">Copiar hash</button><button class="btn ghost" onclick="baixarRegistro(\''+item.id+'\')">Baixar registro</button></div>');
  renderRegs();
};
window.copiarHash=function(hash){navigator.clipboard.writeText(hash).then(()=>alert('Hash copiado.'))};
window.copiarTexto=function(){const texto=val('docTexto');if(!texto.trim()){alert('Não há texto para copiar.');return}navigator.clipboard.writeText(texto).then(()=>alert('Texto copiado.'))};
window.baixarTXT=function(){const tipo=val('docTipo')||'documento';const paciente=(val('docPaciente')||'sem_identificacao').replace(/\s+/g,'_');const blob=new Blob([val('docTexto')],{type:'text/plain;charset=utf-8'});download(blob,'neuroPed_'+tipo.replace(/\s+/g,'_')+'_'+paciente+'_'+dateFile()+'.txt')};
window.baixarRegistro=function(id){const r=getRegs().find(x=>x.id===id);if(!r)return;const txt=['REGISTRO LOCAL DE DOCUMENTO — NEUROPED SDG','Tipo: '+r.tipo,'Paciente/controle: '+r.paciente,'Gerado em: '+r.createdText,'SHA-256: '+r.hash,'Caracteres no registro-base: '+r.chars,'','Observação: registro local para conferência. Não substitui assinatura digital ICP-Brasil.'].join('\n');download(new Blob([txt],{type:'text/plain;charset=utf-8'}),'registro_hash_'+r.id+'.txt')};
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
window.verificarPDF=async function(){
  const file=document.getElementById('pdfFile')?.files?.[0];
  if(!file){setHTML('pdfOut','<div class="warn">Selecione um PDF para conferir.</div>');return}
  const hash=await sha256File(file); const expected=val('expectedHash').trim().toLowerCase();
  let status='<div class="ok"><strong>PDF conferido.</strong><br>Arquivo: '+esc(file.name)+'<br>Tamanho: '+Math.round(file.size/1024)+' KB</div><div class="hash">'+hash+'</div>';
  if(expected){status += expected===hash?'<div class="ok">Hash confere com o esperado.</div>':'<div class="warn"><strong>Hash diferente do esperado.</strong><br>Revise se o arquivo é exatamente o PDF final assinado.</div>'}
  status += '<div class="warn"><strong>Aviso:</strong> este app calcula o hash do PDF. A validade jurídica da assinatura deve ser conferida no assinador/verificador ICP-Brasil ou serviço autorizado.</div>';
  setHTML('pdfOut',status);
};
window.limparPDF=function(){const f=document.getElementById('pdfFile');const h=document.getElementById('expectedHash');if(f)f.value='';if(h)h.value='';setHTML('pdfOut','Nenhum PDF conferido.')};
window.renderRegs=function(){const regs=getRegs();if(!regs.length){setHTML('regList','<div class="warn">Nenhum registro local ainda.</div>');return}setHTML('regList',regs.map(r=>'<div class="doc"><strong>'+esc(r.tipo)+'</strong><br><span class="small">Paciente/controle: '+esc(r.paciente)+' · '+esc(r.createdText)+'</span><div class="hash">'+r.hash+'</div><div class="actions"><button class="btn ghost" onclick="copiarHash(\''+r.hash+'\')">Copiar hash</button><button class="btn ghost" onclick="baixarRegistro(\''+r.id+'\')">Baixar registro</button></div></div>').join(''))};
window.limparRegs=function(){if(confirm('Limpar registros locais deste navegador?')){localStorage.removeItem(KEY);renderRegs()}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderRegs);else renderRegs();
})();
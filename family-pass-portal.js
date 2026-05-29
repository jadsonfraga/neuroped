(function(){
  'use strict';
  function safeChild(s){return String(s||'família').replace(/[^a-zA-Z0-9À-ſ\s]/g,' ').replace(/\s+/g,' ').trim().slice(0,80)||'família'}
  function render(){
    if(!/portal-familia-livre\.html/i.test(location.pathname))return;
    if(document.getElementById('familyPassStatusPanel'))return;
    var host=document.querySelector('.hero')||document.querySelector('main')||document.body;
    var panel=document.createElement('div');
    panel.id='familyPassStatusPanel';
    panel.style.cssText='margin-top:14px;border:1px solid rgba(169,164,255,.16);background:rgba(20,18,46,.92);border-radius:22px;padding:14px;box-shadow:0 10px 28px rgba(45,41,38,.08)';
    var pass=window.NeuroPedFamilyPass&&window.NeuroPedFamilyPass.current&&window.NeuroPedFamilyPass.current();
    var title=document.createElement('strong');
    var copy=document.createElement('p');
    copy.className='muted';copy.style.cssText='margin:6px 0 10px';
    var link=document.createElement('a');link.className='btn gold';link.href='./ativar-passe-familiar.html';
    if(pass){
      title.style.color='#6d6af5';title.textContent='✅ Passe familiar ativo';
      copy.textContent='Acesso familiar não sensível liberado para '+safeChild(pass.child)+' até '+window.NeuroPedFamilyPass.fmtDate(pass.expires)+'.';
      link.textContent='Gerenciar passe';
    } else {
      title.style.color='#a78bfa';title.textContent='🔐 Passe familiar não ativado';
      copy.textContent='Se a clínica entregou um passe de 4 meses, ative aqui para organizar a navegação familiar neste aparelho.';
      link.textContent='Ativar passe familiar';
    }
    panel.appendChild(title);panel.appendChild(copy);panel.appendChild(link);
    host.appendChild(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(render,120)});else setTimeout(render,120);
})();

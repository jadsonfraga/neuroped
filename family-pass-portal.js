(function(){
  'use strict';
  function render(){
    if(!/portal-familia-livre\.html/i.test(location.pathname))return;
    if(document.getElementById('familyPassStatusPanel'))return;
    var host=document.querySelector('.hero')||document.querySelector('main')||document.body;
    var panel=document.createElement('div');
    panel.id='familyPassStatusPanel';
    panel.style.cssText='margin-top:14px;border:1px solid #eadcc7;background:rgba(255,253,249,.92);border-radius:22px;padding:14px;box-shadow:0 10px 28px rgba(45,41,38,.08)';
    var pass=window.NeuroPedFamilyPass&&window.NeuroPedFamilyPass.current&&window.NeuroPedFamilyPass.current();
    if(pass){
      panel.innerHTML='<strong style="color:#1a6b65">✅ Passe familiar ativo</strong><p class="muted" style="margin:6px 0 10px">Acesso familiar não sensível liberado para '+(pass.child||'família')+' até '+window.NeuroPedFamilyPass.fmtDate(pass.expires)+'.</p><a class="btn gold" href="./ativar-passe-familiar.html">Gerenciar passe</a>';
    } else {
      panel.innerHTML='<strong style="color:#8b2e3b">🔐 Passe familiar não ativado</strong><p class="muted" style="margin:6px 0 10px">Se a clínica entregou um passe de 4 meses, ative aqui para organizar a navegação familiar neste aparelho.</p><a class="btn gold" href="./ativar-passe-familiar.html">Ativar passe familiar</a>';
    }
    host.appendChild(panel);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(render,120)});else setTimeout(render,120);
})();
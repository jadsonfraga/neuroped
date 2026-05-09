(function(){
  'use strict';
  const MASTER_KEY='neuroped_master_access_v1';
  const TTL=12*60*60*1000;
  let attempts=0;
  function masterActive(){try{const v=JSON.parse(localStorage.getItem(MASTER_KEY)||'{}');return v.ok&&Date.now()-Number(v.ts||0)<TTL}catch(e){return false}}
  function html(){return '<div class="card span12 no-print" id="familyPassGenerator"><h2>Passe Familiar de 4 meses</h2><p class="muted">Gerador para a secretaria entregar à família no dia da consulta. O passe dura 120 dias e libera navegação ampliada por conteúdos não sensíveis. Não libera documentos, mensagens, prontuário, laudos, prescrições ou dados clínicos protegidos.</p><div class="grid" style="grid-template-columns:repeat(12,1fr);margin-top:8px"><div style="grid-column:span 4"><label>Nome ou iniciais da criança</label><input id="fpChild" placeholder="Ex.: C. Fraga"></div><div style="grid-column:span 4"><label>Responsável</label><input id="fpResp" placeholder="Ex.: mãe / pai / responsável"></div><div style="grid-column:span 4"><label>Duração</label><input value="120 dias / 4 meses" disabled></div></div><div class="actions"><button class="btn gold" id="fpGenerate">Gerar passe familiar</button><button class="btn ghost" id="fpCopy">Copiar instruções</button><button class="btn ghost" id="fpOnlyCopy">Copiar só código</button><a class="btn" href="./ativar-passe-familiar.html" target="_blank" rel="noopener noreferrer">Tela de ativação</a></div><textarea id="fpCode" readonly style="min-height:92px" placeholder="O passe aparecerá aqui"></textarea><pre id="fpInstruction" style="min-height:110px">Instrução para a secretaria:\n1. Abra a Consulta com PIN master.\n2. Gere o passe.\n3. Copie e entregue à família.\n4. Oriente: acessar ativar-passe-familiar.html e colar o código.\n5. Reforce: o passe não abre dados sensíveis.</pre><p class="muted" style="font-size:12px;margin-top:8px"><strong>Segurança:</strong> este recurso é local/estático. Para controle central por paciente, a etapa futura correta é backend com convites revogáveis.</p></div>'}
  function inject(){
    if(!/consulta\.html/i.test(location.pathname))return false;
    if(document.getElementById('familyPassGenerator'))return true;
    if(!masterActive())return false;
    const app=document.querySelector('#app .grid')||document.querySelector('section#app .grid')||document.querySelector('.grid');
    if(!app)return false;
    const wrap=document.createElement('div');wrap.innerHTML=html();
    app.appendChild(wrap.firstChild);
    const code=document.getElementById('fpCode');
    const inst=document.getElementById('fpInstruction');
    document.getElementById('fpGenerate').onclick=async function(){
      if(!window.NeuroPedFamilyPass){alert('Módulo de passe familiar não carregou. Recarregue.');return;}
      const child=document.getElementById('fpChild').value.trim()||document.getElementById('nome')?.value.trim()||'Família';
      const responsible=document.getElementById('fpResp').value.trim()||'Responsável';
      const pass=await window.NeuroPedFamilyPass.make({child,responsible});
      const checked=await window.NeuroPedFamilyPass.validate(pass);
      if(!checked.ok){alert('Não foi possível validar o passe gerado. Recarregue.');return;}
      code.value=pass;
      const expires=checked.payload.expires;
      inst.textContent='PASSE FAMILIAR NEUROPED\n\nCriança/controle: '+child+'\nResponsável: '+responsible+'\nValidade: 4 meses, até '+window.NeuroPedFamilyPass.fmtDate(expires)+'\n\nComo ativar:\n1. Abra https://jadsonfraga.github.io/neuroped/ativar-passe-familiar.html\n2. Cole o passe.\n3. Toque em Ativar passe.\n\nEste passe libera apenas navegação familiar não sensível. Não libera prontuário, documentos, mensagens, laudos ou prescrições.\n\nCódigo:\n'+pass;
    };
    document.getElementById('fpCopy').onclick=function(){const text=(inst.textContent||'')+'\n\n'+(code.value||'');if(!code.value){alert('Gere o passe primeiro.');return}navigator.clipboard.writeText(text).then(()=>alert('Instruções do passe familiar copiadas.'))};
    document.getElementById('fpOnlyCopy').onclick=function(){if(!code.value){alert('Gere o passe primeiro.');return}navigator.clipboard.writeText(code.value).then(()=>alert('Código do passe copiado.'))};
    return true;
  }
  function boot(){
    if(inject())return;
    const timer=setInterval(function(){attempts++; if(inject()||attempts>180)clearInterval(timer)},750);
    const onClick=function(){setTimeout(function(){if(inject())document.removeEventListener('click',onClick,true)},150)};
    document.addEventListener('click',onClick,true);
    window.addEventListener('storage',inject);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
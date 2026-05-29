(function(){
  const QUICK_KEY='neuroped_caa_frases_rapidas_familia_v1';
  function toast(msg){
    const el=document.getElementById('status');
    if(el){el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800);}
  }
  function phraseText(){
    return Array.from(document.querySelectorAll('#tokens .token')).map(x=>x.textContent.replace(/^\S+\s*/, '').trim()).filter(Boolean).join(' ');
  }
  function copyPhrase(){
    const txt=phraseText();
    if(!txt){toast('Monte uma frase primeiro');return;}
    if(navigator.clipboard){navigator.clipboard.writeText(txt).then(()=>toast('Frase copiada'),()=>toast('Não foi possível copiar'));}
    else {toast('Cópia indisponível neste navegador');}
  }
  function saveQuickPhrase(){
    const txt=phraseText();
    if(!txt){toast('Monte uma frase primeiro');return;}
    let list=[];try{list=JSON.parse(localStorage.getItem(QUICK_KEY)||'[]')}catch{}
    if(!list.includes(txt)) list.unshift(txt);
    localStorage.setItem(QUICK_KEY, JSON.stringify(list.slice(0,30)));
    toast('Frase rápida salva');
    renderSaved();
  }
  function renderSaved(){
    const quick=document.getElementById('quick');
    if(!quick || document.getElementById('familyQuickBox')) return;
    const box=document.createElement('div');
    box.id='familyQuickBox';
    box.style.cssText='grid-column:1/-1;background:#14132a;border:1px dashed rgba(184,150,62,.75);border-radius:24px;padding:14px';
    box.innerHTML='<strong style="display:block;color:#6d6af5;margin-bottom:8px">⭐ Frases salvas da família</strong><div id="familyQuickList" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px"></div>';
    quick.prepend(box);
    updateSavedList();
  }
  function updateSavedList(){
    const listEl=document.getElementById('familyQuickList');
    if(!listEl) return;
    let list=[];try{list=JSON.parse(localStorage.getItem(QUICK_KEY)||'[]')}catch{}
    listEl.textContent='';
    if(!list.length){
      const empty=document.createElement('span');
      empty.style.cssText='font-size:12px;color:#b6b2e6';
      empty.textContent='Nenhuma frase salva ainda.';
      listEl.appendChild(empty);
      return;
    }
    list.forEach((t,i)=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.dataset.i=String(i);
      btn.style.cssText='text-align:left;background:rgba(124,118,210,.10);border:1px solid rgba(26,107,101,.18);border-radius:16px;padding:12px;font-weight:900;color:#6d6af5';
      btn.textContent='💬 '+t;
      btn.onclick=function(){
        const txt=list[Number(this.dataset.i)];
        if(!txt)return;
        if('speechSynthesis' in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='pt-BR';u.rate=0.84;speechSynthesis.speak(u);}
      };
      listEl.appendChild(btn);
    });
  }
  function addButtons(){
    const sentence=document.querySelector('.sentence .row');
    if(!sentence || document.getElementById('copyPhraseBtn')) return false;
    const copy=document.createElement('button');
    copy.id='copyPhraseBtn';copy.type='button';copy.textContent='📋 Copiar frase';copy.onclick=copyPhrase;
    const save=document.createElement('button');
    save.id='saveQuickPhraseBtn';save.type='button';save.textContent='⭐ Salvar frase rápida';save.onclick=saveQuickPhrase;
    sentence.appendChild(copy);sentence.appendChild(save);
    renderSaved();
    return true;
  }
  function boot(){
    let tries=0;const t=setInterval(()=>{tries++;if(addButtons()||tries>60)clearInterval(t);updateSavedList();},250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

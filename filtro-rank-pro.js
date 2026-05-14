(function(){
'use strict';
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function medal(i){return i===0?['ouro','🥇 Ouro — melhor encaixe clínico']:i===1?['prata','🥈 Prata — segunda melhor hipótese']:i===2?['bronze','🥉 Bronze — terceira opção útil']:['base','📋 Complementar']}
function parseAge(txt){const t=norm(txt);const m=t.match(/\d+([,.]\d+)?/);if(!m)return null;const n=parseFloat(m[0].replace(',','.'));if(t.includes('mes'))return Math.round(n);if(t.includes('ano')||/\d+a/.test(t))return Math.round(n*12);return n>24?Math.round(n*12):Math.round(n)}
function currentComplaint(){return norm((document.getElementById('queixaLivre')&&document.getElementById('queixaLivre').value)||'')}
function currentAge(){return parseAge((document.getElementById('idade')&&document.getElementById('idade').value)||'')}
function directScore(s){
  const text=currentComplaint(); const age=currentAge();
  const hay=norm([s.title,s.short_title,s.domain,s.audience_label,s.age_band,...(s.symptoms||[]),...(s.complaints||[]),...(s.keywords||[]),...(s.plain_questions||[])].join(' '));
  let score=0,reasons=[];
  const domains={
    risco:['nao quer viver','não quer viver','se machuca','autolesao','autolesão','suicid','morrer'],
    tea:['tea','autismo','autimo','nome','olhar','estereotip','rigidez','social','barulho','brinca sozinho'],
    linguagem:['nao fala','não fala','fala','linguagem','ecolalia','gesto','pedido'],
    tdah:['tdah','desatencao','desatenção','nao termina','não termina','agitado','impulsivo','esquece'],
    escola:['escola','leitura','escrita','matematica','matemática','aprendizagem','tarefa'],
    alimentar:['seletividade','seletivdade','textura','engasgo','comida','alimentacao','alimentação'],
    sensorial:['sensorial','sensorail','barulho','toque','cheiro','luz','textura'],
    sono:['sono','dorme','insonia','insônia','acorda'],
    humor:['triste','humor','isolamento','chora','desanimo','desânimo'],
    epilepsia:['epilepsia','convuls','crise','olhar parado','desmaio'],
    cefaleia:['cefaleia','cabeca','cabeça','enxaqueca','vomito','vômito']
  };
  Object.entries(domains).forEach(([k,words])=>{const hit=words.some(w=>text.includes(norm(w)));const match=words.some(w=>hay.includes(norm(w)));if(hit&&match){score+=45;reasons.push(k)}});
  const exact=(s.symptoms||[]).filter(x=>text.includes(norm(x))).length;score+=exact*22;if(exact)reasons.push('sintoma exato');
  if(age!=null){const a=s.age_min_months??0,b=s.age_max_months??240;if(age>=a&&age<=b){score+=38;reasons.push('idade exata')}else if(age>=a-24&&age<=b+24){score+=16;reasons.push('idade próxima')}else{score-=20}}
  const resp=(document.getElementById('respondente')&&document.getElementById('respondente').value)||'';if(resp&&s.audience===resp){score+=20;reasons.push('respondente ideal')}else if(resp&&s.audience!==resp){score-=8}
  if(/risco|autoles/i.test(hay)&&/(nao quer viver|não quer viver|se machuca|autoles|suicid|morrer)/i.test(text)){score+=80;reasons.push('alerta de segurança')}
  if(/lote|banco/i.test(s.title||''))score-=120;
  score+=Math.min(Number(s.priority||50)/3,35);
  return {score,reasons:[...new Set(reasons)]};
}
function allScales(){return [...(window.NEUROPED_EDITORIAL_SCALES||[])];}
function ensurePanel(){
  if(document.getElementById('proRankPanel'))return;
  const host=document.querySelector('#package')||document.querySelector('.package'); if(!host)return;
  const div=document.createElement('div');div.id='proRankPanel';div.style.cssText='margin:12px 0;border:2px solid rgba(184,150,62,.35);border-radius:22px;background:linear-gradient(135deg,#fffdf9,#fff7e8);padding:14px';
  host.parentNode.insertBefore(div,host.nextSibling);
}
function renderPro(){
  ensurePanel(); const panel=document.getElementById('proRankPanel'); if(!panel)return;
  const rows=allScales().map(s=>Object.assign({},s,directScore(s))).sort((a,b)=>b.score-a.score).slice(0,12);
  if(!rows.length){panel.innerHTML='<strong>Ranking clínico:</strong> carregando...';return;}
  const top=rows.slice(0,3).map((s,i)=>{const m=medal(i);return '<article style="background:white;border:1px solid #eadcc7;border-radius:18px;padding:12px;margin:8px 0;display:grid;grid-template-columns:1fr auto;gap:10px"><div><div style="font-weight:950;color:#8b2e3b">'+m[1]+'</div><h3 style="margin:4px 0;color:#1a6b65;font-family:Georgia,serif">'+esc(s.title)+'</h3><div style="font-size:12px;color:#6f6963">'+esc(s.audience_label||'Instrumento')+' · '+esc(s.age_band||'idade livre')+' · '+esc(s.domain||'')+'</div><div style="font-size:12px;margin-top:6px;color:#6f6963"><b>Por que:</b> '+esc((s.reasons||[]).join(' · ')||'compatibilidade geral')+'</div><ol style="margin:8px 0 0 18px;padding:0;font-size:13px">'+(s.plain_questions||[]).slice(0,5).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btn" href="./instrumento.html?id='+encodeURIComponent(s.id)+'">Abrir teste funcional</a><button class="ghost" onclick="navigator.clipboard.writeText(\''+esc((s.title||'').replace(/'/g,'’'))+'\')">Copiar nome</button></div></div><div style="min-width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#1a6b65,#124b47);color:white;font-weight:950;display:grid;place-items:center;text-align:center">'+Math.round(Math.max(0,s.score))+'<br><span style="font-size:10px">crit.</span></div></article>'}).join('');
  panel.innerHTML='<h3 style="font-family:Georgia,serif;color:#8b2e3b;margin:0 0 8px">Ranking Ouro · Prata · Bronze</h3><p style="color:#6f6963;margin:0 0 8px">Seleção mais criteriosa: cruza idade, sintoma dominante, risco, respondente e prioridade clínica. Sempre abre teste funcional com perguntas e tarefas.</p>'+top;
}
function patchLinks(){
  document.querySelectorAll('.result-card a.btn,.card a.btn').forEach(a=>{
    const txt=(a.textContent||'').toLowerCase(); if(!txt.includes('abrir'))return;
    if(a.href.includes('instrumento.html'))return;
    const card=a.closest('.result-card,.card'); if(!card)return;
    const title=norm(card.querySelector('h3,h2')?.textContent||'');
    const s=allScales().find(x=>norm(x.title)===title||title.includes(norm(x.short_title))); if(s){a.href='./instrumento.html?id='+encodeURIComponent(s.id);a.textContent='Abrir teste funcional'}
  });
}
function run(){renderPro();setTimeout(patchLinks,200);setTimeout(patchLinks,800)}
window.addEventListener('load',run);document.addEventListener('input',()=>setTimeout(run,100),true);document.addEventListener('click',()=>setTimeout(run,200),true);setInterval(run,2000);
})();
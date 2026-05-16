(function(){
'use strict';
/* NeuroPed EDJ - filtro-rank-pro.js (v2: sem polling perpetuo)
 * Renderiza o ranking Ouro/Prata/Bronze a partir do estado atual do filtro.
 * Re-render somente quando os inputs do filtro mudam (debounced).
 */
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function medal(i){return i===0?['ouro','🥇 Ouro - melhor encaixe clinico']:i===1?['prata','🥈 Prata - segunda melhor hipotese']:i===2?['bronze','🥉 Bronze - terceira opcao util']:['base','📋 Complementar']}
function parseAge(txt){const t=norm(txt);const m=t.match(/\d+([,.]\d+)?/);if(!m)return null;const n=parseFloat(m[0].replace(',','.'));if(t.includes('mes'))return Math.round(n);if(t.includes('ano')||/\d+a/.test(t))return Math.round(n*12);return n>24?Math.round(n*12):Math.round(n)}
function val(id){var el=document.getElementById(id);return el?el.value||'':''}
function currentComplaint(){return norm(val('queixaLivre'))}
function currentAge(){return parseAge(val('idade'))}
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
  if(age!=null){const a=s.age_min_months??0,b=s.age_max_months??240;if(age>=a&&age<=b){score+=38;reasons.push('idade exata')}else if(age>=a-24&&age<=b+24){score+=16;reasons.push('idade proxima')}else{score-=20}}
  const resp=val('respondente');if(resp&&s.audience===resp){score+=20;reasons.push('respondente ideal')}else if(resp&&s.audience!==resp){score-=8}
  if(/risco|autoles/i.test(hay)&&/(nao quer viver|não quer viver|se machuca|autoles|suicid|morrer)/i.test(text)){score+=80;reasons.push('alerta de seguranca')}
  if(/lote|banco/i.test(s.title||''))score-=120;
  score+=Math.min(Number(s.priority||50)/3,35);
  return {score,reasons:[...new Set(reasons)]};
}
function allScales(){return [...(window.NEUROPED_EDITORIAL_SCALES||[])];}
function ensurePanel(){
  if(document.getElementById('proRankPanel'))return document.getElementById('proRankPanel');
  const host=document.querySelector('#package')||document.querySelector('.package'); if(!host)return null;
  const div=document.createElement('div');div.id='proRankPanel';div.style.cssText='margin:12px 0;border:2px solid rgba(184,150,62,.35);border-radius:22px;background:linear-gradient(135deg,#fffdf9,#fff7e8);padding:14px';
  host.parentNode.insertBefore(div,host.nextSibling);
  return div;
}
function lastSignature(){return JSON.stringify([currentComplaint(),currentAge(),val('respondente'),val('sensibilidade'),allScales().length])}
let prevSig='';
function renderPro(force){
  const sig=lastSignature();
  if(!force && sig===prevSig)return;
  prevSig=sig;
  const panel=ensurePanel(); if(!panel)return;
  const rows=allScales().map(s=>Object.assign({},s,directScore(s))).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!rows.length){panel.innerHTML='<strong>Ranking clinico:</strong> carregando...';return;}
  // Construcao DOM-safe (sem onclick inline frageis)
  panel.textContent='';
  const h3=document.createElement('h3');h3.style.cssText='font-family:Georgia,serif;color:#8b2e3b;margin:0 0 8px';h3.textContent='Ranking Ouro · Prata · Bronze';
  const p=document.createElement('p');p.style.cssText='color:#6f6963;margin:0 0 8px';p.textContent='Seleção mais criteriosa: cruza idade, sintoma dominante, risco, respondente e prioridade clinica. Sempre abre teste funcional com perguntas e tarefas.';
  panel.appendChild(h3);panel.appendChild(p);
  rows.forEach((s,i)=>{
    const m=medal(i);
    const card=document.createElement('article');
    card.style.cssText='background:white;border:1px solid #eadcc7;border-radius:18px;padding:12px;margin:8px 0;display:grid;grid-template-columns:1fr auto;gap:10px';
    const left=document.createElement('div');
    const tag=document.createElement('div');tag.style.cssText='font-weight:950;color:#8b2e3b';tag.textContent=m[1];
    const title=document.createElement('h3');title.style.cssText='margin:4px 0;color:#1a6b65;font-family:Georgia,serif';title.textContent=s.title||'Instrumento';
    const meta=document.createElement('div');meta.style.cssText='font-size:12px;color:#6f6963';meta.textContent=[s.audience_label||'Instrumento',s.age_band||'idade livre',s.domain||''].filter(Boolean).join(' · ');
    const why=document.createElement('div');why.style.cssText='font-size:12px;margin-top:6px;color:#6f6963';why.innerHTML='<b>Por que:</b> '+esc((s.reasons||[]).join(' · ')||'compatibilidade geral');
    const ol=document.createElement('ol');ol.style.cssText='margin:8px 0 0 18px;padding:0;font-size:13px';
    (s.plain_questions||[]).slice(0,5).forEach(q=>{const li=document.createElement('li');li.textContent=q;ol.appendChild(li)});
    const actions=document.createElement('div');actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
    const open=document.createElement('a');open.className='btn';open.href='./instrumento.html?id='+encodeURIComponent(s.id||'');open.textContent='Abrir teste funcional';
    const copy=document.createElement('button');copy.type='button';copy.className='ghost';copy.textContent='Copiar nome';
    copy.addEventListener('click',function(){if(navigator.clipboard)navigator.clipboard.writeText(s.title||'')});
    actions.appendChild(open);actions.appendChild(copy);
    left.appendChild(tag);left.appendChild(title);left.appendChild(meta);left.appendChild(why);left.appendChild(ol);left.appendChild(actions);
    const right=document.createElement('div');right.style.cssText='min-width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#1a6b65,#124b47);color:white;font-weight:950;display:grid;place-items:center;text-align:center';
    right.innerHTML=Math.round(Math.max(0,s.score))+'<br><span style="font-size:10px">crit.</span>';
    card.appendChild(left);card.appendChild(right);
    panel.appendChild(card);
  });
}
function patchLinks(){
  document.querySelectorAll('.result-card a.btn,.card a.btn').forEach(a=>{
    const txt=(a.textContent||'').toLowerCase(); if(!txt.includes('abrir'))return;
    if(a.href.includes('instrumento.html'))return;
    const card=a.closest('.result-card,.card'); if(!card)return;
    const title=norm(card.querySelector('h3,h2')?.textContent||'');
    const s=allScales().find(x=>norm(x.title)===title||(x.short_title&&title.includes(norm(x.short_title))));
    if(s){a.href='./instrumento.html?id='+encodeURIComponent(s.id);a.textContent='Abrir teste funcional'}
  });
}
function debounce(fn,ms){let t;return function(){clearTimeout(t);const a=arguments;t=setTimeout(()=>fn.apply(null,a),ms)}}
const renderDebounced=debounce(function(){renderPro(false);patchLinks()},180);
function bind(){
  ['idade','queixaLivre','respondente','sensibilidade'].forEach(id=>{
    const el=document.getElementById(id); if(el)el.addEventListener('input',renderDebounced)
  });
  const chips=document.getElementById('chips');
  if(chips)chips.addEventListener('click',function(ev){if(ev.target.closest('button'))renderDebounced()});
  // Primeira renderizacao com retry ate o NEUROPED_EDITORIAL_SCALES carregar
  let tries=0;const t=setInterval(()=>{tries++;if(allScales().length){renderPro(true);patchLinks();clearInterval(t)}else if(tries>20)clearInterval(t)},250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();

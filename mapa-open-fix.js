(function(){
'use strict';
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function scales(){return window.NEUROPED_EDITORIAL_SCALES||[]}
function patch(){
  if(!/mapa-escalas\.html/i.test(location.pathname))return;
  document.querySelectorAll('.card a.btn').forEach(a=>{
    const txt=(a.textContent||'').toLowerCase();
    if(!txt.includes('abrir'))return;
    if(a.href.includes('instrumento.html'))return;
    const card=a.closest('.card'); if(!card)return;
    const title=norm(card.querySelector('h2')?.textContent||'');
    const s=scales().find(x=>norm(x.title)===title||title.includes(norm(x.short_title||''))||norm(x.title||'').includes(title));
    if(s){a.href='./instrumento.html?id='+encodeURIComponent(s.id);a.textContent='Abrir teste funcional'}
  });
}
window.addEventListener('load',patch);document.addEventListener('click',()=>setTimeout(patch,120),true);setInterval(patch,1500);
})();
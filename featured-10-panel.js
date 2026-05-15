(function(){
'use strict';
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function card(s,i){return '<article style="background:#fffdf9;border:1px solid #eadcc7;border-radius:20px;padding:14px;box-shadow:0 10px 28px rgba(45,41,38,.07)"><div style="font-weight:950;color:#8b2e3b">'+String(i+1).padStart(2,'0')+' · '+esc(s.featured_label||'Escala em destaque')+'</div><h3 style="margin:6px 0;color:#1a6b65;font-family:Georgia,serif;font-size:20px">'+esc(s.title)+'</h3><div style="font-size:12px;color:#6f6963;font-weight:800">'+esc(s.audience_label||'Instrumento')+' · '+esc(s.age_band||'idade livre')+' · '+esc(s.domain||'Triagem')+'</div><p style="color:#6f6963;line-height:1.5">'+esc(s.clinical_use||'Instrumento prioritário do acervo NeuroPed EDJ.')+'</p><ol style="font-size:13px;color:#2d2926;margin-left:18px;padding-left:0">'+(s.plain_questions||[]).slice(0,3).map(q=>'<li>'+esc(q)+'</li>').join('')+'</ol><a class="btn" href="./instrumento.html?id='+encodeURIComponent(s.id)+'">Abrir teste funcional</a></article>'}
function unique(list){const seen=new Set();return list.filter(x=>x&&x.id&&!seen.has(x.id)&&(seen.add(x.id),true))}
function render(){
  const list=unique([...(window.NEUROPED_FEATURED10||[]),...(window.NEUROPED_FEATURED_EXTRA||[])]).slice().sort((a,b)=>(a.featured_rank||99)-(b.featured_rank||99));
  if(!list.length)return false;
  const id='featured10Panel'; if(document.getElementById(id))return true;
  const panel=document.createElement('section');panel.id=id;panel.style.cssText='margin:16px 0;padding:16px;border:2px solid rgba(184,150,62,.38);border-radius:28px;background:linear-gradient(135deg,#fffdf9,#fff4df);box-shadow:0 18px 52px rgba(45,41,38,.10)';
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:950;color:#b8963e">Coleção destacada</div><h2 style="font-family:Georgia,serif;color:#8b2e3b;font-size:32px;margin:4px 0">Escalas Prioritárias Dr. Jadson</h2><p style="color:#6f6963;margin:0">Instrumentos enviados em PDF e convertidos em testes funcionais com perguntas por extenso, tarefas clínicas e abertura direta.</p><p style="color:#6f6963;margin:6px 0 0;font-size:13px"><strong>'+list.length+'</strong> escalas destacadas carregadas nesta coleção.</p></div><a class="btn ghost" href="./mapa-escalas.html">Ver mapa completo</a></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:14px">'+list.map(card).join('')+'</div>';
  const target=document.querySelector('.hero')||document.querySelector('main')||document.body;
  if(target.classList&&target.classList.contains('hero'))target.insertAdjacentElement('afterend',panel);else target.prepend(panel);
  return true;
}
function boot(){render();let n=0;const t=setInterval(()=>{n++;if(render()||n>40)clearInterval(t)},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();